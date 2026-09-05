import type { QuickPrompt } from '@webskill/chatbot';
import type { Screen } from '../types';

/**
 * 快捷指令（WelcomeScreen 快捷 prompt 覆盖）。
 *
 * 三条写法规则（设计文档 04 §6.1）：
 * 1. 不留待填空——点了就能跑；
 * 2. 不写死 ID——写「当前项目」「我正在看的这张表」，让 Agent 走感知；
 * 3. 要画面就说画面——涉及取像的必须出现「看图 / 截图 / 画面」。
 *
 * 全局条的出厂种子写在 config.json 的 `quickPrompts.items` 里（只注入一次，之后归 console「快捷指令」页管理），
 * 本文件只负责当前屏最多 4 条、随换屏实时下发的那批（SDK 0.13.0 分册 17）。
 * 文案按语种写在同一个 `text` 里由 chatbot 按 locale 解析（分册 21），不再维护两份平行数组。
 * 图标取 SDK 受控枚举（0.12.0 分册 21）：按意图就近选，不追求唯一。
 */

const BY_SCREEN: Partial<Record<Screen, QuickPrompt[]>> = {
  overview: [
    {
      icon: 'page',
      text: {
        zh: '给我当前页面的速览总结：我在哪个屏幕、正看哪个项目，以及它的需求池规模、迭代进度、未关闭缺陷和测试质量头条数据',
        en: 'Give me a readout of the page I am on: which screen and which project I am viewing, plus its headline stats — backlog size, sprint progress, open defects and test quality'
      }
    }
  ],
  requirements: [
    {
      icon: 'document',
      text: {
        zh: '读取我当前正在看的需求列表里带附件的那几条需求文档，抽出验收标准，并列出文档里有、需求单里缺的条目',
        en: 'Read the requirement documents with attachments in the list I am viewing, extract acceptance criteria, and list items present in the documents but missing from the tickets'
      }
    },
    {
      icon: 'list',
      text: {
        zh: '检查当前项目的需求状态和迭代阶段是否自洽，把不一致的列出来',
        en: 'Check whether requirement statuses and sprint stages of the current project are consistent, and list the mismatches'
      }
    },
    {
      icon: 'run',
      text: {
        zh: '把当前页面上处于 Todo 且优先级为 High 的需求，逐条挪进进行中状态',
        en: 'Move every requirement on this page that is Todo with High priority into In Progress, one by one'
      }
    },
    {
      icon: 'sparkles',
      text: {
        zh: '根据我的想法规划新需求、迭代任务和测试用例，带我到各个页面逐个创建落地',
        en: 'Turn my idea into a plan: new requirement, sprint tasks and test cases — then guide me through creating them on each page'
      }
    }
  ],
  sprints: [
    {
      icon: 'run',
      text: {
        zh: '根据每张卡片的完成情况，把当前迭代看板上的卡片调整到正确的阶段',
        en: 'Adjust the cards on the current sprint board to the correct stages based on each card’s completion'
      }
    },
    {
      icon: 'chart',
      text: {
        zh: '分析当前迭代的燃尽偏差，定位是哪些需求拖慢了进度',
        en: 'Analyze the current sprint’s burndown deviation and identify which requirements are slowing it down'
      }
    }
  ],
  bugs: [
    {
      icon: 'search',
      text: {
        zh: '看一下当前页面上这几个缺陷的截图画面，判断哪些可能是同一个根因，把判断依据说清楚',
        en: 'Look at the screenshots of these defects on the current page, judge which ones may share a root cause, and explain the reasoning'
      }
    },
    {
      icon: 'bug',
      text: {
        zh: '分析当前项目的缺陷严重度分布和模块热点，给出治理建议',
        en: 'Analyze the current project’s defect severity distribution and module hotspots, then suggest remediation'
      }
    },
    // 分册 30 验证路径：先产生两次真实工具调用（进轨迹留存），再触发「轨迹转录」的技能生成——
    // 确认卡上应看到每步的轨迹背书与参数对照
    {
      icon: 'sparkles',
      text: {
        zh: '先列出当前项目的缺陷清单，再读取本项目的 DORA 指标，然后把「查缺陷、读指标」这个流程固化成一个技能',
        en: 'List the current project’s bugs, then read its DORA metrics, and turn the "query bugs + read DORA" flow into a reusable skill'
      }
    }
  ],
  tests: [
    {
      icon: 'test',
      text: {
        zh: '找出覆盖率低于 70% 的测试套件，按风险排序并说明补测优先级',
        en: 'Find test suites with coverage below 70%, rank them by risk, and explain the backfill priority'
      }
    }
  ],
  metrics: [
    {
      icon: 'metric',
      text: {
        zh: '解读当前项目的 DORA 四项指标，对标行业水位，指出最该改进的一项',
        en: 'Interpret the current project’s four DORA metrics against industry benchmarks and name the top improvement'
      }
    }
  ]
};

/** 当前屏的上下文指令，随换屏实时下发 */
export function screenQuickPrompts(screen: Screen): QuickPrompt[] {
  return BY_SCREEN[screen] ?? [];
}
