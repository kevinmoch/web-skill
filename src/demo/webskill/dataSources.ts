import { readAgileHostState } from './hostState';
import { getWebSkillRuntime } from './runtime';
import { readFieldHistory } from './fieldHistory';

/**
 * 脚本取数通道：`config.fetchData` 的实现（分册 16）。
 * 技能脚本里的 `context.fetchData(sourceId, params)` 最终落到这里。
 *
 * 必须是稳定引用（模块级单例）：它进 ChatEngine 的 useMemo 依赖表，
 * 每次渲染新建会把整个引擎重建掉。
 *
 * default 分支抛错不是防御性编程：静默返回空会让技能生成一张空图表，
 * 而没人知道是数据源名写错了（T4 评测集能变红的前提）。
 */
export function createAgileDataSource() {
  return async (sourceId: string, params?: Record<string, unknown>): Promise<unknown> => {
    const s = readAgileHostState();
    const projectId = (params?.projectId as string) ?? s.currentProjectId;
    switch (sourceId) {
      case 'projects':
        return s.projects;
      case 'requirements':
        return s.requirements.filter((r) => r.projectId === projectId);
      case 'sprints':
        return s.sprints.filter((x) => x.projectId === projectId);
      case 'bugs':
        return s.bugs.filter((b) => b.projectId === projectId);
      case 'testSuites':
        return s.testSuites.filter((t) => t.projectId === projectId);
      case 'metrics':
        // DORA 四项指标是工作区级度量，不按项目切分
        return s.metrics;
      case 'field-history': {
        // 字段历史（T6）：模型据此在 ask_user 上给 suggestion + suggestionReason
        const { fieldHistory } = await getWebSkillRuntime();
        return readFieldHistory(fieldHistory, 'test', params);
      }
      default:
        throw new Error(`Unknown data source: ${sourceId}`);
    }
  };
}

/** 模块级稳定引用：直接挂进 ChatbotConfig.fetchData */
export const fetchAgileData = createAgileDataSource();
