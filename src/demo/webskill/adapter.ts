import type { ChatbotHostAdapter, SettingsSectionId } from '@webskill/chatbot';
import type { PageActionUi } from '@webskill/sdk/agent';
import { PERCEPTION_PAGING_DEFAULTS } from '@webskill/sdk/agent';
import {
  captureDocumentImage,
  createDocumentSurfaceHost,
  createDocxBlockReader,
  createFetchLinkedDocumentReader,
  createPptxBlockReader,
  createRemoteImageHost,
  createXlsxBlockReader,
  extractDocxText,
  extractPptxText,
  extractXlsxText,
  fillDocxTemplate,
  fillXlsxTemplate,
  readDocxTemplate,
  readXlsxTemplate
} from '@webskill/sdk/browser';
import { FsAuditLog } from '@webskill/sdk/governance';
import i18n from '../../i18n';
import type { AgileWebSkillRuntime } from './runtime';
import { MANAGED_ROOT } from './runtime';
import { createAgilePageReader, createAgilePerception } from './perception';
import { createAgileActions, type PageActionUiRef } from './actions';
import { createAgileConsentStore, type AgileConsentStore } from './consentStore';
import { createAgileDwgHost } from './dwgHost';
import { getAgileMcpHost } from './mcpHost';
import { extractPdfText, pdfDocumentReader } from './pdfText';
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

  // 文档投放面（0.15.0 分册 13）：接了它，技能脚本才能发 `Spec.OpenDocument`，
  // 会话里那颗「在独立窗口打开」的按钮也才渲染得出来。
  // 宿主自己那两处入口（质量通报 / 监控大屏）与 DWG 图纸走的是同一个 viewer 路由
  const documentSurface = createDocumentSurfaceHost({
    viewerUrl: VIEWER_URL,
    // viewer 跑在 opaque origin，读不到站点的 i18n 状态，语言只能随地址带过去。
    // 每次投放现读现拼：装配期快照会让用户切换语言后新开的文档仍是旧语言
    open: (url, target) => window.open(`${url}?lang=${i18n.language.startsWith('zh') ? 'zh' : 'en'}`, target),
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
  });

  const adapter: ChatbotHostAdapter = {
    storage: runtime.storage,
    skillRoots: runtime.skillRoots,
    navigation: {
      openConsole: () => deps.navigate.toConsole(),
      openConsoleTrace: (runId) => deps.navigate.toTrace(runId),
      openConsoleCandidate: (candidateId) => deps.navigate.toCandidate(candidateId)
    },
    pagePerception,
    pageActions: createAgileActions(runtime, pageReader, pageActionUiRef, pageActionConsent),
    // 需求列表这类长表格一次感知能上千节点，不分段就会在工具结果层被中段截断，
    // 而模型看不出自己少读了什么（SDK 分册 22）
    pagePerceptionPaging: { enabled: true, ...PERCEPTION_PAGING_DEFAULTS },
    pageSkillSource: mcpHost.toolSource,
    // 链接文档读取：需求表的 .docx 附件是同源资源，直读；
    // 跨源文档由引擎侧准入策略拦截（需用户确认），宿主不需要额外开关
    linkedDocuments: createFetchLinkedDocumentReader(),
    // 不注入则 .docx 明确报「本环境不支持」
    docxExtractor: extractDocxText,
    // 不注入则 .xlsx 连附件选择框都进不去（SDK 分册 12）
    xlsxExtractor: extractXlsxText,
    // 0.22.0 分册 18：.pptx 与上面两个同级，缺席即该格式明确报不支持
    pptxExtractor: extractPptxText,
    // PDF 默认原件直传；只有端点以 4xx 拒收时运行时才回头用它抽文本重发（SDK 分册 22）
    pdfExtractor: extractPdfText,
    // 逐单元读取（SDK 0.21.0 分册 22 / 0.22.0 分册 18）：上面四个抽取器回答「整份是什么」，
    // 这四个回答「第 N 页/段/表是什么」。四种格式各自独立，缺哪个就哪种格式明确报不支持。
    // pdf 的图是「整页渲染」，docx/xlsx/pptx 的图是包里现成的 PNG/JPEG，两条路不同实现
    pdfDocumentReader,
    docxDocumentReader: createDocxBlockReader(),
    xlsxDocumentReader: createXlsxBlockReader(),
    pptxDocumentReader: createPptxBlockReader(),
    // 照着模板出文件（0.22.0 分册 42）。与上面四个读取器分开给：那四个回答「这份文件说了什么」，
    // 这两个回答「哪个格子在哪儿、怎么往里写而不动其余任何东西」——后者不能靠前者拼出来，
    // 因为前者读出的文本里没有样式、列宽、合并和公式
    xlsxTemplateEngine: { read: readXlsxTemplate, fill: fillXlsxTemplate },
    docxTemplateEngine: { read: readDocxTemplate, fill: fillDocxTemplate },
    // **不接 `downloads`**：读用户本机下载目录是扩展宿主的事（`chrome.downloads`）。
    // 网页端唯一的入口是 File System Access 目录选择器，那等于让模型开口要整个下载文件夹，
    // 换来的能力和风险不成比例。缺席即 `list_downloaded_files` / `read_downloaded_file` 都不注册。
    documentSurface,
    // DWG 图纸（0.22.0 分册 19）：解析在 Worker 里，投放复用上面那个受信外壳。
    // 语言每次现读，跟 `documentSurface.open` 的理由一样
    dwg: createAgileDwgHost({
      surface: () => documentSurface,
      locale: () => (i18n.language.startsWith('zh') ? 'zh' : 'en')
    }),
    // 取宿主页面上的图放进文档（0.22.0 分册 12）。本宿主与被感知的页面**同一个文档**，
    // 不需要像扩展那样跨上下文转发：句柄直接问感知那份句柄表要元素即可。
    // 授权卡、会话内记忆、产物落盘都在引擎那一侧——它们要知道 run 目录与会话生灭
    pageImage: {
      capture: async (ref, maxBytes) => {
        const element = pageReader.resolve(ref);
        // 句柄查无此人不是「取不到图」，但对模型是同一件事：说清该怎么办，别只说失败
        if (element === undefined) {
          return {
            id: ref,
            reason: 'that reference is not on this page any more; perceive the page again to get a fresh reference',
            triedLevels: []
          };
        }
        return await captureDocumentImage(element, { id: ref, maxBytes });
      }
    },
    // 外链图（0.22.0 分册 13）。站点自己 `fetch`，跨源能不能拿到由对方的 CORS 决定，
    // 拿不到会如实回报而不是静默变成空图。授权在引擎那一侧，且在发请求之前（AC-13.5）
    remoteImage: createRemoteImageHost(),
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
