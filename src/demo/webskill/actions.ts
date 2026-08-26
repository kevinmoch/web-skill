import { PageActionPolicy } from '@webskill/sdk/agent';
import type { PageActionUi } from '@webskill/sdk/agent';
import { createDomPageActionExecutor } from '@webskill/sdk/browser';
import type { DomPerceptionReader } from '@webskill/sdk/browser';
import { FsAuditLog } from '@webskill/sdk/governance';
import type { AgileWebSkillRuntime } from './runtime';
import { MANAGED_ROOT } from './runtime';
import type { AgileConsentStore } from './consentStore';
import { createAgileDownloadWatcher } from './downloadSignal';
import { AGILE_PAGE_SCOPE } from './perception';

/**
 * 确认粒度是**动作种类**级（SDK 没有按 actionId 的断言）：
 * - fill / select 不弹卡——否则「填一个多字段表单」会逐字段弹卡，看板挪卡也会每步一卡；
 * - click / submit / set / attach 一律弹确认卡——提交写库、删除、上传都在这一组。
 * 点「拒绝」只让该动作失败并记审计（PAGE_ACTION_DECLINED），整轮运行继续。
 */
const PREAUTHORIZED = ['fill', 'select'] as const;

/**
 * 确认卡的 UI 端口在引擎就绪后才存在（engine.bridge），先装配策略、后回填端口。
 * 未回填时若有动作请求到达，明确抛错而不是静默挂起。
 */
export interface PageActionUiRef {
  current?: PageActionUi;
}

/**
 * 一次操作之后等多久看有没有下载（SDK 0.15.0 分册 15 · FR-15.3）。
 * 需求表的 .docx 附件是同源静态资源，点完几乎立刻就起下载，不需要大预算；
 * 这个值由**宿主**定，模型没有任何入口能表达时长。
 */
const DOWNLOAD_WAIT_MS = 800;

export function createAgileActions(
  runtime: AgileWebSkillRuntime,
  reader: DomPerceptionReader,
  uiRef: PageActionUiRef,
  consent: AgileConsentStore,
  downloadSignalEnabled: () => boolean
): PageActionPolicy {
  return new PageActionPolicy({
    scope: AGILE_PAGE_SCOPE,
    executor: createDomPageActionExecutor({ reader }),
    ui: {
      request: (input) => {
        const ui = uiRef.current;
        if (!ui) throw new Error('Page action UI is not bound yet; the chat engine has not been mounted.');
        return ui.request(input);
      }
    },
    audit: new FsAuditLog({ root: MANAGED_ROOT, fs: runtime.storage }),
    // 接了它，确认卡上才会出现「不再询问」；与 console 连接页是同一份存储，撤销即时生效
    consent,
    // 下载信号（0.15.0 分册 15）：模型点完需求表的附件链接后，结果里才有「这一下产生了文件」。
    // 开关关着时窗口照开，只是结果改记一条 page.download.unreported 留痕，不进模型
    downloadWatcher: createAgileDownloadWatcher(),
    downloadSignalEnabled,
    downloadWaitMs: () => DOWNLOAD_WAIT_MS,
    preauthorized: PREAUTHORIZED
  });
}
