import type { Bug, Metrics, Project, Requirement, Sprint, TestSuite } from '../mock/staticData';
import type { Screen } from '../types';

/**
 * 宿主状态桥：AgileDataContext 活在 React 树里，而数据源 / 页面工具 / 技能脚本
 * 的调用发生在引擎侧（非 React 调用栈）。Provider 在每次渲染后把最新状态注册进来，
 * 调用方永远读到的是最新值，不存在闭包读旧值的问题。
 */
export interface AgileHostState {
  projects: Project[];
  currentProjectId: string;
  /** 全量池（不按项目过滤；过滤由调用方按 projectId 参数决定） */
  requirements: Requirement[];
  sprints: Sprint[];
  bugs: Bug[];
  testSuites: TestSuite[];
  metrics: Metrics;
  screen: Screen;
}

let reader: (() => AgileHostState) | undefined;
/** 导航桥：页面工具（navigate_to_screen）经它切屏；Provider 挂载时注册 */
let navigator_: ((screen: Screen) => void) | undefined;

/** 由 AgileDataProvider 挂载时注册；卸载时不清理（应用级 Provider 永不卸载） */
export function setAgileHostStateReader(fn: () => AgileHostState): void {
  reader = fn;
}

/** 由 AgileDataProvider 注册（与 reader 同一挂载点） */
export function setAgileNavigator(fn: (screen: Screen) => void): void {
  navigator_ = fn;
}

/** 引擎侧切屏入口：未注册时明确抛错，不静默吞 */
export function navigateAgileScreen(screen: Screen): void {
  if (!navigator_) {
    // 英文：会进工具错误与 LLM 上下文
    throw new Error('Agile navigator is not ready yet');
  }
  navigator_(screen);
}

export function readAgileHostState(): AgileHostState {
  if (!reader) {
    // 英文：会进工具错误与 LLM 上下文
    throw new Error('Agile host state is not ready yet');
  }
  return reader();
}
