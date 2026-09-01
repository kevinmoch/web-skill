import { createLocalStorageMcpVisibility, createPageMcpEndpoint } from '@webskill/sdk/mcp';
import type { McpVisibilityStore, PageMcpEndpoint } from '@webskill/sdk/mcp';
import type { Screen } from '../types';
import { AGILE_PAGE_ENDPOINT, PAGE_SKILLS, PAGE_TOOLS } from './pageSkills';
import type { PageToolDef } from './pageSkills';
import { loadSkillEditTools } from './skillEditTools';

/**
 * 进程内 MCP 端点（agile-page）：页面工具与页面临时技能经真实 MCP 通道供给，
 * chatbot 的 pageSkillSource 与 console 的 ConnectFacade 共用同一个 EndpointRegistry，
 * 端点/工具的启停对两侧同时生效——「治理在工作」因此是可演示的事实，不是两张皮。
 *
 * 装配自 SDK 0.19.0 起由 `createPageMcpEndpoint` 提供。这里原本是 195 行手写实现，
 * 三处易错的地方（端口不复用、先建后换、catch 排在 then 之前）现在由 SDK 保证；
 * 本文件只剩「这个应用有哪些工具、当前屏有哪些技能」这类本应用特有的部分。
 */

/**
 * 启停与披露的状态存储。键形 `agile.mcp.*`，名单里的工具一律带 endpoint。
 *
 * 存量禁用记录不迁移：旧实现存的是裸工具名，换算不回 `<endpoint>/<tool>`。
 * 用户此前禁用过的工具会回到启用态——方向是放开，不是收紧。
 */
export const agileMcpVisibility: McpVisibilityStore = createLocalStorageMcpVisibility('agile');

/** 当前屏：技能随屏生灭，工具常驻。skills 用函数形态，每次 serve 重新求值 */
let currentScreen: Screen | undefined;

/** 技能文件编辑工具：console 包是动态 import，挂端点前先取回来 */
let skillEditTools: readonly PageToolDef[] = [];

let cached: PageMcpEndpoint | undefined;

export function getAgileMcpHost(): PageMcpEndpoint {
  cached ??= createPageMcpEndpoint({
    endpoint: AGILE_PAGE_ENDPOINT,
    visibility: agileMcpVisibility,
    // 页面工具（常驻）+ 技能文件编辑工具（模型改技能的入口）
    tools: () => [...PAGE_TOOLS, ...skillEditTools],
    skills: () => PAGE_SKILLS[currentScreen as Screen] ?? [],
    serverInfo: { name: 'agile-page' },
    clientInfo: { name: 'agile-host' }
  });
  return cached;
}

/** 换屏重建端点内容。串行与失败恢复由 SDK 负责 */
export async function serveAgilePageEndpoint(screen: Screen): Promise<void> {
  currentScreen = screen;
  // 编辑工具拉不回来不能连带页面工具一起挂不上：这一次少两个工具，下一次换屏重试
  skillEditTools = await loadSkillEditTools().catch(() => skillEditTools);
  return getAgileMcpHost().serve();
}
