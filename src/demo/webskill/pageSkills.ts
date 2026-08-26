import type { LlmToolSpec } from '@webskill/sdk';
import type { Screen } from '../types';
import { navigateAgileScreen, readAgileHostState } from './hostState';
import { getWebSkillRuntime } from './runtime';
import { readFieldHistory } from './fieldHistory';

/**
 * 页面工具与页面临时技能的**数据定义**（装配在 ./mcpHost.ts：
 * 经进程内 MCP 端点注册，chatbot 与 console 共用同一份，不会漂移）。
 *
 * 模型可见的工具名带端点前缀（`agile-page__list_requirements`）；
 * 技能正文里的引用必须写全名——它们进 LLM 上下文。
 */

export const AGILE_PAGE_ENDPOINT = 'agile-page';

export interface PageToolDef {
  spec: LlmToolSpec;
  run(args: Record<string, unknown>): unknown | Promise<unknown>;
}

const PROJECT_ID_PARAM = {
  projectId: { type: 'string', description: 'Project id; defaults to the currently selected project.' }
} as const;

export const PAGE_TOOLS: PageToolDef[] = [
  {
    spec: {
      name: 'list_requirements',
      description: 'List requirements of a project, optionally filtered by status.',
      inputSchema: {
        type: 'object',
        properties: {
          ...PROJECT_ID_PARAM,
          status: { type: 'string', enum: ['Todo', 'In Progress', 'Done'], description: 'Optional status filter.' }
        }
      }
    },
    run: (args) => {
      const s = readAgileHostState();
      const projectId = (args.projectId as string) ?? s.currentProjectId;
      const status = args.status as string | undefined;
      return s.requirements.filter((r) => r.projectId === projectId && (!status || r.status === status));
    }
  },
  {
    spec: {
      name: 'list_sprints',
      description: 'List sprints (iterations) of a project.',
      inputSchema: { type: 'object', properties: { ...PROJECT_ID_PARAM } }
    },
    run: (args) => {
      const s = readAgileHostState();
      const projectId = (args.projectId as string) ?? s.currentProjectId;
      return s.sprints.filter((x) => x.projectId === projectId);
    }
  },
  {
    spec: {
      name: 'list_bugs',
      description: 'List defects of a project, optionally filtered by severity.',
      inputSchema: {
        type: 'object',
        properties: {
          ...PROJECT_ID_PARAM,
          severity: { type: 'string', enum: ['Critical', 'Major', 'Minor'], description: 'Optional severity filter.' }
        }
      }
    },
    run: (args) => {
      const s = readAgileHostState();
      const projectId = (args.projectId as string) ?? s.currentProjectId;
      const severity = args.severity as string | undefined;
      return s.bugs.filter((b) => b.projectId === projectId && (!severity || b.severity === severity));
    }
  },
  {
    spec: {
      name: 'list_test_suites',
      description: 'List test suites of a project with coverage and pass rate.',
      inputSchema: { type: 'object', properties: { ...PROJECT_ID_PARAM } }
    },
    run: (args) => {
      const s = readAgileHostState();
      const projectId = (args.projectId as string) ?? s.currentProjectId;
      return s.testSuites.filter((t) => t.projectId === projectId);
    }
  },
  {
    spec: {
      name: 'get_dora_metrics',
      description: 'Get the workspace-level DORA metrics (lead time, cycle time, deployment frequency, failure rate).',
      inputSchema: { type: 'object', properties: { ...PROJECT_ID_PARAM } }
    },
    run: () => readAgileHostState().metrics
  },
  {
    spec: {
      name: 'list_projects',
      description: 'List all projects in the workspace.',
      inputSchema: { type: 'object', properties: {} }
    },
    run: () => readAgileHostState().projects
  },
  {
    spec: {
      name: 'navigate_to_screen',
      description:
        'Switch the Agile Studio left-menu page the user is looking at. Use when the user asks to go to / open / switch to another screen, or when a skill needs the user to be on a specific screen.',
      inputSchema: {
        type: 'object',
        properties: {
          screen: {
            type: 'string',
            enum: ['overview', 'requirements', 'sprints', 'bugs', 'tests', 'metrics'],
            description:
              'Target screen: overview 全景视图 / requirements 需求管理 / sprints 迭代管理 / bugs 缺陷管理 / tests 测试管理 / metrics 度量分析.'
          }
        },
        required: ['screen']
      }
    },
    run: (args) => {
      const screen = args.screen as Screen;
      // 技能中心不对模型开放（它是宿主管理面，不在左侧业务菜单里）
      const allowed: Screen[] = ['overview', 'requirements', 'sprints', 'bugs', 'tests', 'metrics'];
      if (!allowed.includes(screen)) {
        return { ok: false, error: `Unknown screen "${String(args.screen)}". Valid: ${allowed.join(', ')}` };
      }
      navigateAgileScreen(screen);
      // 换屏会热替换该屏的页面临时技能——提醒模型后续按新屏的技能集行动
      return { ok: true, screen, note: 'The visible page switched immediately; the page skills of the new screen are now in effect.' };
    }
  },
  {
    spec: {
      name: 'get_field_history',
      description:
        'Get the user’s field-value history (top values with counts) for a tracked field, to offer as form suggestions. Only whitelisted enum/short-text fields are tracked.',
      inputSchema: {
        type: 'object',
        properties: {
          entity: { type: 'string', enum: ['requirement', 'bug', 'test'], description: 'Entity whose field history to read.' },
          field: { type: 'string', description: 'Field name, e.g. assignee / priority / epic / module / severity / type.' }
        },
        required: ['entity', 'field']
      }
    },
    run: async (args) => {
      const { fieldHistory } = await getWebSkillRuntime();
      return readFieldHistory(fieldHistory, 'test', args);
    }
  }
];

/** 模型可见名：端点前缀形态（McpRuntimePlugin 的约定） */
const T = (name: string) => `${AGILE_PAGE_ENDPOINT}__${name}`;

export interface PageSkillDef {
  name: string;
  /** 路由匹配依据（中文，与界面语言一致；技能名等标识符不译） */
  description: string;
  body: string;
}

export const PAGE_SKILLS: Partial<Record<Screen, PageSkillDef[]>> = {
  // 全景视图：经 WebMCP 原生通道（mcp__ 前缀工具）取页面上下文——与 agile-page 端点并存的第二条演示通道
  overview: [
    {
      name: 'page-view-summary',
      description: '总结用户当前正在看的页面：所在屏幕、当前项目与关键指标速览。',
      body: [
        '## 步骤',
        '',
        '1. 调用 `mcp__agile_get_current_view`（WebMCP 原生通道）拿到当前屏幕、当前项目与头条数据。',
        '2. 用一段话说清用户正在看什么，再用 `KeyValue`（或一排 `Metric`）呈现头条数据。',
        '3. 数据只以该工具的返回为准——不要凭界面猜测，也不要编造工具没返回的字段。'
      ].join('\n')
    }
  ],
  requirements: [
    {
      name: 'requirement-kanban-alignment',
      description: '检查需求状态与当前迭代阶段是否自洽，并列出不一致的条目。',
      body: [
        '## 步骤',
        '',
        `1. 调用 \`${T('list_requirements')}\` 工具读取当前项目的需求。`,
        `2. 调用 \`${T('list_sprints')}\` 了解进行中迭代的时间窗与目标。`,
        '3. 标记状态与迭代阶段矛盾的需求（例如迭代临近结束仍是 `Todo`，或已 `Done` 又被关联缺陷重开）。',
        '4. 用 `Table` 渲染不一致项；没有不一致时明确说没有，不要编造问题。',
        '',
        '要在页面上修复不一致时，通过页面操作工具使用 `req.row.<id>.status` 控件。'
      ].join('\n')
    },
    {
      name: 'idea-to-delivery-plan',
      description: '根据用户的一句话想法，规划新需求、迭代任务与测试用例，并带用户逐个页面落地创建。',
      body: [
        '## 步骤',
        '',
        '> 轮次预算：本流程动作密集（多次切屏 + 逐字段写表），**不要调用 `manage_todo`**——',
        '> 每次清单记账都占一轮，会把轮次预算烧穿。任务拆解控制在 **4 项以内**，同理。',
        '',
        '1. **收集想法**：用户消息里已有明确想法就直接使用；没有就用 `ask_user` 单问题先收集一句话想法。',
        '',
        '2. **规划方案**：基于想法产出三件套草案，用 surface 呈现（Card + Table）：',
        '   - 新需求：标题、详细说明、优先级、故事点估算、关联史诗、经办人建议；',
        '   - 迭代任务拆解：把需求拆成可进看板待办列的任务（每项含标题与故事点）；',
        '   - 测试用例设计：测试套件名、目标覆盖率、用例总数与通过预期。',
        '   先调 `agile-page__list_requirements` / `list_sprints` / `list_test_suites` 对照当前项目现状，',
        '   规划要落在真实上下文里，不要编造。',
        '',
        '3. **综合表单补全**：想法里缺失的字段，用一次 `ask_user` 多字段表单收齐（不超 20 个字段），',
        '   字段与控件类型跟页面真实表单一致：',
        '   - 需求侧：`reqTitle`(text 必填)、`reqDescription`(textarea)、`reqPriority`(select: High/Medium/Low)、',
        '     `reqStatus`(select: Todo/In Progress/Done，默认 Todo)、`reqPoints`(number 1–13)、',
        '     `reqAssignee`(text)、`reqReporter`(text)、`reqEpic`(text)',
        '   - 迭代侧：`taskTitle`(text)、`taskPoints`(number)、`taskPriority`(select)、`taskAssignee`(text)',
        '   - 测试侧：`testSuite`(text 套件名)、`testCoverage`(number 目标覆盖率)、`testTotal`(number 用例总数)',
        '   已能确定的值一律填进 `defaultValue`（用户原话与规划结论都是客观来源），拿不准的留空给用户。',
        '',
        '4. **建议值**：构建表单之前，对 `reqAssignee` / `reqPriority` / `reqEpic` 各调一次',
        '   `agile-page__get_field_history`；返回 `enabled: true` 且 `values` 非空就给该字段加',
        '   `suggestion`（只展示、不预填），形如',
        '   `"suggestion": { "value": "林晨", "reason": "你最近 3 条需求都分给了林晨" }`。',
        '   用户画像里明确的客观事实（如常用经办人）同样可作建议来源。',
        '   用户已明说或已填 `defaultValue` 的字段不再加 `suggestion`。',
        '',
        '5. **逐页落地**（每步开始前用一句话告诉用户接下来做什么）：',
        '   a. 调 `agile-page__navigate_to_screen` 切到 `requirements`，点 `req.create.open`，',
        '      逐字段写 `req.form.*`（`req.form.priority` / `req.form.status` 是下拉框，写入选项值），',
        '      最后点 `req.form.submit`——点击与提交都会弹确认卡，由用户批准后生效；',
        '   b. 切到 `sprints`，点待办列的 `sprint.task.create.open`，写 `sprint.task.form.*`',
        '      （title/points/priority/assignee），点 `sprint.task.form.submit`；任务会落进待办列，',
        '      请用户核对；',
        '   c. 切到 `tests`，点 `test.create.open`，写 `test.form.*`（suite/coverage/total 等），',
        '      点 `test.form.submit`，请用户批准。',
        '   任何一步用户在确认卡上拒绝，如实记录原因并继续后续步骤，不要重试纠缠。',
        '',
        '6. **总结**：输出一段总结——创建的需求（含 ID）、迭代任务、测试套件，以及未落地的项与原因。'
      ].join('\n')
    }
  ],
  sprints: [
    {
      name: 'sprint-burndown-check',
      description: '根据剩余故事点与剩余天数，判断当前迭代能否按时收尾。',
      body: [
        '## 步骤',
        '',
        `1. 调用 \`${T('list_sprints')}\`，取状态为 \`Active\` 的迭代。`,
        `2. 调用 \`${T('list_requirements')}\`，按状态汇总故事点（\`Done\` 与其余）。`,
        '3. 把剩余故事点与迭代速率、窗口内剩余天数对比。',
        '4. 渲染一个 `Gauge` 表示完成率；燃尽用 `area` 面积图（已完成 / 剩余 / 容量三条系列），',
        '   故事点构成可用 `stacked-bar`（状态 × 优先级）；再用 `Callout` 点名拖慢收尾的需求。',
        '',
        '用户要求调整看板时，通过 `sprint.card.<id>.stage` 控件移动卡片。'
      ].join('\n')
    }
  ],
  bugs: [
    {
      name: 'bug-severity-distribution',
      description: '分析当前项目的缺陷严重程度分布与模块热点。',
      body: [
        '## 步骤',
        '',
        `1. 调用 \`${T('list_bugs')}\` 读取当前项目的缺陷。`,
        '2. 按严重程度（Critical > Major > Minor）与模块分组，统计未关闭 / 已修复 / 已关闭数量。',
        '3. 严重程度分布用 `pie` 饼图、模块热点用 `bar` 柱状图呈现，收尾用 `Callout` 给治理建议。',
        '',
        '本页提供同源缺陷截图；用户要求看图时用页面图像抓取，不要凭标题猜测。'
      ].join('\n')
    }
  ],
  tests: [
    {
      name: 'coverage-gap',
      description: '找出覆盖率低于门槛的测试套件，按风险排序并说明补测优先级。',
      body: [
        '## 步骤',
        '',
        `1. 调用 \`${T('list_test_suites')}\` 读取当前项目的测试套件。`,
        '2. 留下覆盖率低于门槛的套件（默认 70，用户另有指定除外）。',
        '3. 按风险排序：有失败用例的在前，再按覆盖率升序。',
        '4. 用 `Table` 渲染缺口清单，每个套件配一个 `Callout` 说明补测优先级。'
      ].join('\n')
    }
  ],
  metrics: [
    {
      name: 'dora-readout',
      description: '解读四项 DORA 指标，对标行业水位并指出最该改进的一项。',
      body: [
        '## 步骤',
        '',
        `1. 调用 \`${T('get_dora_metrics')}\`。`,
        '2. 把交付前置时间、周期时间、部署频率、变更失败率对照常见行业分层（elite / high / medium / low）解读。',
        '3. 先用 `KeyValue` 列出四项指标，再用一个 `Callout` 指出最该改进的单项指标及原因。'
      ].join('\n')
    }
  ]
};
