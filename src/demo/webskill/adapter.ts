import type { ChatbotHostAdapter, SettingsSectionId } from '@webskill/chatbot';
import type { PageActionUi } from '@webskill/sdk/agent';
import { PERCEPTION_PAGING_DEFAULTS } from '@webskill/sdk/agent';
import {
  createDocumentSurfaceHost,
  createFetchLinkedDocumentReader,
  extractDocxText,
  extractXlsxText
} from '@webskill/sdk/browser';
import { FsAuditLog } from '@webskill/sdk/governance';
import i18n from '../../i18n';
import type { AgileWebSkillRuntime } from './runtime';
import { MANAGED_ROOT } from './runtime';
import { createAgilePageReader, createAgilePerception } from './perception';
import { createAgileActions, type PageActionUiRef } from './actions';
import { createAgileConsentStore, type AgileConsentStore } from './consentStore';
import { createAgileDownloadedFileReader, createAgileDownloadsConsent } from './downloads';
import { getAgileMcpHost } from './mcpHost';
import { VIEWER_URL } from './viewerRoute';
import type { PagePerceptionPolicy } from '@webskill/sdk/agent';

/** 宿主导航出口：chatbot 内部不感知路由，跳转全由宿主执行 */
export interface NavigateFns {
  toConsole(): void;
  toTrace(runId: string): void;
  toCandidate(candidateId: string): void;
  toSettings(section?: SettingsSectionId): void;
}

export interface AgileHostCapabilities {
  adapter: ChatbotHostAdapter;
  /** 页面感知策略实例（console 连接页的感知状态区块要读它） */
  pagePerception: PagePerceptionPolicy;
  /** 已记住的页面操作授权（console 连接页列出并撤销，与确认卡是同一份存储） */
  pageActionConsent: AgileConsentStore;
  /**
   * 引擎就绪后回填页面操作确认卡的 UI 端口（`engine.bridge`）。
   * 装配时引擎还不存在，端口只能后填——未回填时动作请求会明确报错而非挂起。
   */
  bindPageActionUi(ui: PageActionUi): void;
}

/**
 * 宿主装配口（T2 底座 + T3 全量宿主能力）：
 * 存储 / 技能根 / 导航 / 页面感知 / 页面操作 / 页面技能与工具 / 链接文档读取。
 */
export function createAgileHostCapabilities(
  runtime: AgileWebSkillRuntime,
  deps: { navigate: NavigateFns }
): AgileHostCapabilities {
  // 感知与操作共享同一个 reader：句柄表只有一份，ref 才能认得出
  const pageReader = createAgilePageReader();
  const pageActionUiRef: PageActionUiRef = {};
  const pagePerception = createAgilePerception(runtime, pageReader);
  const pageActionConsent = createAgileConsentStore();
  // 页面工具与临时技能走进程内 MCP 端点（与 console 连接页同一注册表）
  const mcpHost = getAgileMcpHost();
  const audit = new FsAuditLog({ root: MANAGED_ROOT, fs: runtime.storage });

  // 下载信号的开关要**同步**读得到（策略在 act() 里判），而配置存储是异步的：
  // 缓存一份并订阅变更。装配期取一次就固化的话，用户刚在设置里打开的开关要等刷新才生效
  let downloadSignalOn = false;
  const refreshDownloadSignal = (): void => {
    void runtime.runtimeConfig
      .load()
      .then((config) => {
        downloadSignalOn = config.sandbox.downloadedFiles === true;
      })
      .catch(() => undefined);
  };
  refreshDownloadSignal();
  runtime.runtimeConfig.subscribe?.(refreshDownloadSignal);

  const adapter: ChatbotHostAdapter = {
    storage: runtime.storage,
    skillRoots: runtime.skillRoots,
    navigation: {
      openConsole: () => deps.navigate.toConsole(),
      openConsoleTrace: (runId) => deps.navigate.toTrace(runId),
      openConsoleCandidate: (candidateId) => deps.navigate.toCandidate(candidateId)
    },
    pagePerception,
    pageActions: createAgileActions(runtime, pageReader, pageActionUiRef, pageActionConsent, () => downloadSignalOn),
    // 需求列表这类长表格一次感知能上千节点，不分段就会在工具结果层被中段截断，
    // 而模型看不出自己少读了什么（SDK 分册 22）
    pagePerceptionPaging: { enabled: true, ...PERCEPTION_PAGING_DEFAULTS },
    pageSkillSource: mcpHost.pageSkillSource,
    // 链接文档读取：需求表的 .docx 附件是同源资源，直读；
    // 跨源文档由引擎侧准入策略拦截（需用户确认），宿主不需要额外开关
    linkedDocuments: createFetchLinkedDocumentReader(),
    // 不注入则 .docx 明确报「本环境不支持」（PDF 是直通，不需要它）
    docxExtractor: extractDocxText,
    // 不注入则 .xlsx 连附件选择框都进不去（SDK 分册 12）
    xlsxExtractor: extractXlsxText,
    // 下载的文件（0.14.0 分册 20）：reader 缺席即两个工具不注册。
    // 授权卡出口 / 能力开关 / 读图判定 / docx·xlsx 抽取 / 审计由引擎从适配器既有字段接线
    downloads: { reader: createAgileDownloadedFileReader(), consent: createAgileDownloadsConsent() },
    // 文档投放面（0.15.0 分册 13）：接了它，技能脚本才能发 `Spec.OpenDocument`，
    // 会话里那颗「在独立窗口打开」的按钮也才渲染得出来。
    // 宿主自己那两处入口（质量通报 / 监控大屏）走的是同一个 viewer 路由
    documentSurface: createDocumentSurfaceHost({
      viewerUrl: VIEWER_URL,
      // 授权复用页面操作那条确认卡通路，不另造一套弹窗
      confirm: async ({ skillName, dataSource }) => {
        const ui = pageActionUiRef.current;
        if (!ui) throw new Error('Page action UI is not bound yet; the chat engine has not been mounted.');
        // 语言每次现读：装配期快照会让用户切换语言后这句话仍是旧语言
        const zh = i18n.language.startsWith('zh');
        const response = await ui.request({
          type: 'confirm',
          id: `document-surface-${Date.now()}`,
          message: zh
            ? `技能「${skillName}」要把一份文档投到独立窗口打开，其中包含来自「${dataSource}」的数据。是否继续？`
            : `Skill “${skillName}” wants to open a document in a separate window. It carries data from “${dataSource}”. Continue?`
        });
        return response.cancelled !== true && response.value !== false;
      },
      audit
    }),
    documentAudit: audit
  };

  return {
    adapter,
    pagePerception,
    pageActionConsent,
    bindPageActionUi: (ui) => {
      pageActionUiRef.current = ui;
    }
  };
}

let cachedCaps: { runtime: AgileWebSkillRuntime; caps: AgileHostCapabilities } | undefined;

/**
 * 能力单例（按 runtime 缓存）：ChatDrawer 与 SkillCenterScreen 共享同一份装配，
 * chatbot 的适配器与 console 的连接门面因此读同一条注册表/策略实例。
 */
export function getAgileHostCapabilities(
  runtime: AgileWebSkillRuntime,
  deps: { navigate: NavigateFns }
): AgileHostCapabilities {
  if (!cachedCaps || cachedCaps.runtime !== runtime) {
    cachedCaps = { runtime, caps: createAgileHostCapabilities(runtime, deps) };
  }
  return cachedCaps.caps;
}
