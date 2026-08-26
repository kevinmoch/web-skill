import { declareDataSourcesToPageHost } from '@webskill/sdk/mcp';
import { readAgileHostState } from './hostState';
import { fetchAgileData } from './dataSources';

/**
 * WebMCP 工具声明（浏览器原生通道，`document.modelContext`，Chrome 150+ 命令式 API）。
 *
 * 与 `mcpHost.ts` 的进程内 MCP 端点（agile-page）是**两条独立通道**：
 * 这里的工具经浏览器标准的 WebMCP 面声明，任何 WebMCP 消费方（本页的 chatbot、
 * 浏览器自带的代理）都能发现；模型侧可见名是 `mcp__<工具名>`（单来源无前缀，
 * 见 mcp/src/resolver/nameSanitize.ts 的 webMcpToolLlmName）。
 *
 * 浏览器原生 modelContext 已存在时**合并**而不是覆盖：我们的工具并入 getTools，
 * executeTool 按名字分派，其余透传原生实现——原生通道因此不受损。
 */

/** 声明的描述符形状（对齐 Chrome 150+：inputSchema 是 JSON 字符串） */
interface WebMcpToolDeclaration {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  run(args: Record<string, unknown>): unknown | Promise<unknown>;
}

const EMPTY_SCHEMA: Record<string, unknown> = { type: 'object', properties: {}, additionalProperties: false };

const PROJECT_ID_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: { projectId: { type: 'string', description: '项目编号；省略则取当前选中项目' } },
  additionalProperties: false
};

/**
 * 技能脚本请求的数据集（`context.fetchData('bugs')` 那一串 id），逐个报成 WebMCP 工具。
 *
 * 本页内的 chatbot 走 `config.fetchData` 直连页面 state，压根用不着这些工具；
 * 但扩展里的助手**不在本页**，WebMCP 是它唯一的取数通道。
 * 只自荐 `agile_get_current_view` 是不够的：那是一份视图摘要，
 * `quality-bulletin` / `agile-ops-screen` 要的是 `bugs` / `testSuites` / `metrics` 本身。
 */
const DATASETS: { id: string; tool: string; description: string }[] = [
  { id: 'projects', tool: 'agile_get_projects', description: '工作区内的全部项目：编号、名称、状态与负责人。' },
  {
    id: 'requirements',
    tool: 'agile_get_requirements',
    description: '当前项目（或 projectId 指定项目）的需求池条目，含优先级、状态与故事点。'
  },
  {
    id: 'sprints',
    tool: 'agile_get_sprints',
    description: '当前项目的迭代列表，含起止日期、状态与完成进度。'
  },
  {
    id: 'bugs',
    tool: 'agile_get_bugs',
    description: '当前项目的缺陷清单，含严重级别、状态、经办人与创建时间。'
  },
  {
    id: 'testSuites',
    tool: 'agile_get_test_suites',
    description: '当前项目的测试套件，含用例数、覆盖率与通过率。'
  },
  { id: 'metrics', tool: 'agile_get_metrics', description: '工作区级 DORA 四项指标时间序列（不按项目切分）。' }
];

const PROJECT_SCOPED = new Set(['requirements', 'sprints', 'bugs', 'testSuites']);

function datasetTools(): WebMcpToolDeclaration[] {
  return DATASETS.map((dataset) => ({
    name: dataset.tool,
    description: dataset.description,
    inputSchema: PROJECT_SCOPED.has(dataset.id) ? PROJECT_ID_SCHEMA : EMPTY_SCHEMA,
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    // 与本页 chatbot 的 `fetchData` 同一个实现，两条通道不会各算各的
    run: (args) => fetchAgileData(dataset.id, args)
  }));
}

interface ModelContextLike {
  getTools?: () => Promise<unknown>;
  executeTool?: (tool: unknown, argsJson: string, options?: { signal?: AbortSignal }) => Promise<unknown>;
}

const WEB_MCP_TOOLS: WebMcpToolDeclaration[] = [
  {
    name: 'agile_get_current_view',
    description:
      '获取 Agile Studio 当前视图上下文：用户所在屏幕、当前选中项目，以及头条数据（需求池规模、活跃迭代进度、未关闭缺陷、测试质量与 DORA 指标）。',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    run: () => {
      const s = readAgileHostState();
      const project = s.projects.find((p) => p.id === s.currentProjectId);
      const requirements = s.requirements.filter((r) => r.projectId === s.currentProjectId);
      const sprints = s.sprints.filter((x) => x.projectId === s.currentProjectId);
      const bugs = s.bugs.filter((b) => b.projectId === s.currentProjectId);
      const suites = s.testSuites.filter((t) => t.projectId === s.currentProjectId);
      const active = sprints.find((x) => x.status === 'Active') ?? sprints[0];
      const open = bugs.filter((b) => b.status === 'Open');
      return {
        screen: s.screen,
        project: project ? { id: project.id, key: project.key, name: project.name, status: project.status } : null,
        backlog: {
          count: requirements.length,
          storyPoints: requirements.reduce((sum, r) => sum + (r.storyPoints ?? 0), 0)
        },
        activeSprint: active
          ? {
              id: active.id,
              name: active.name,
              window: `${active.startDate} → ${active.endDate}`,
              progress: active.progress
            }
          : null,
        openDefects: {
          total: open.length,
          critical: open.filter((b) => b.severity === 'Critical').length,
          major: open.filter((b) => b.severity === 'Major').length,
          minor: open.filter((b) => b.severity === 'Minor').length
        },
        testQuality: {
          suites: suites.length,
          avgCoverage: suites.length ? Math.round(suites.reduce((x, t) => x + t.coverage, 0) / suites.length) : 0,
          avgPassRate: suites.length ? Math.round(suites.reduce((x, t) => x + t.passRate, 0) / suites.length) : 0
        },
        dora: s.metrics
      };
    }
  },
  ...datasetTools()
];

/** 已声明工具的名字集合（executeTool 分派用） */
const DECLARED_NAMES = new Set(WEB_MCP_TOOLS.map((t) => t.name));

function toDescriptor(tool: WebMcpToolDeclaration): Record<string, unknown> {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: JSON.stringify(tool.inputSchema),
    origin: globalThis.location?.origin,
    annotations: tool.annotations
  };
}

function toolNameOf(tool: unknown): string | undefined {
  if (typeof tool === 'string') return tool;
  if (typeof tool === 'object' && tool !== null && typeof (tool as { name?: unknown }).name === 'string') {
    return (tool as { name: string }).name;
  }
  return undefined;
}

function makeModelContext(native: ModelContextLike | undefined): ModelContextLike {
  return {
    getTools: async () => {
      const nativeTools = await native?.getTools?.().catch(() => undefined);
      const nativeList = Array.isArray(nativeTools)
        ? nativeTools
        : Array.isArray((nativeTools as { tools?: unknown[] } | undefined)?.tools)
          ? (nativeTools as { tools: unknown[] }).tools
          : [];
      return [...nativeList, ...WEB_MCP_TOOLS.map(toDescriptor)];
    },
    executeTool: async (tool: unknown, argsJson: string, options?: { signal?: AbortSignal }) => {
      const name = toolNameOf(tool);
      const declared = WEB_MCP_TOOLS.find((t) => t.name === name);
      if (declared) {
        const args = argsJson ? (JSON.parse(argsJson) as Record<string, unknown>) : {};
        // MCP 信封形状（适配器先解包 content 再归一）
        return { content: [{ type: 'text', text: JSON.stringify(await declared.run(args)) }] };
      }
      if (typeof native?.executeTool === 'function') return native.executeTool(tool, argsJson, options);
      throw new Error(`WebMCP tool "${String(name)}" not found`);
    }
  };
}

/**
 * 安装 WebMCP 工具声明。幂等；原生 modelContext 存在时合并（我们的工具优先按名分派）。
 * 在应用入口调用一次即可——SDK 的 ExperimentalWebMcpAdapter 每次调用都惰性重读。
 */
export function installWebMcpTools(): void {
  const doc = globalThis.document as (Document & { modelContext?: ModelContextLike }) | undefined;
  if (!doc) return;
  // 自荐先于安装：上面的幂等早退会跳过后续语句，而自荐本身也是幂等的
  declareToPageHost();
  const current = doc.modelContext;
  // 已装过（本模块的合并版）就别再包一层
  if (current && DECLARED_NAMES.size > 0 && (current as { __agileWebMcp?: boolean }).__agileWebMcp === true) return;
  const merged = makeModelContext(current);
  Object.defineProperty(doc, 'modelContext', {
    configurable: true,
    value: Object.assign(merged, { __agileWebMcp: true })
  });
}

/**
 * 向页面宿主自荐本站的取数口（SDK 0.14.0 分册 21）。
 *
 * 上面的 WebMCP 面只对**本页内**的消费方可见；跑在浏览器扩展里的助手不在本页，
 * 光声明 `document.modelContext` 它一无所知。自荐是把「本站有这些取数口」交出去的那一步。
 *
 * 数据集用**技能脚本请求的那个 id** 自荐（`bugs` 而不是 `agile_get_bugs`）：
 * 宿主拿 `id` 匹配 `context.fetchData(id)`，拿 `target` 回调本页工具。
 * 两者写成同一个名字的话，`quality-bulletin` 在扩展里永远只能报「拿不到数据源」。
 *
 * 提议不等于可用：宿主那边它只是候选，用户点头前谁都取不到数。宿主没植锚点
 * （没装扩展、或本站不在它的白名单里）时整个调用是空操作。
 */
function declareToPageHost(): void {
  declareDataSourcesToPageHost([
    {
      id: 'agile_get_current_view',
      kind: 'webmcp-tool',
      description: WEB_MCP_TOOLS[0].description,
      // 宿主按工具名回调本页的 WebMCP 面；这里给的就是 `getTools` 会报出的那个名字
      target: 'agile_get_current_view'
    },
    ...DATASETS.map((dataset) => ({
      id: dataset.id,
      kind: 'webmcp-tool' as const,
      description: dataset.description,
      target: dataset.tool
    }))
  ]);
}
