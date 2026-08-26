import type { PageActionConsent, PageActionKind, PageActionTarget } from '@webskill/sdk/agent';
import i18n from '../../i18n';

const PREFIX = 'agile.page-action.consent:';

/** 主文档的粒度串；本站没有嵌入帧，`target.frame` 恒为空 */
const SELF_SCOPE = 'this page';

interface StoredConsent {
  id: string;
  scope: string;
  action: string;
  grantedAt: string;
}

/**
 * console 连接页要展示的一条已记住授权。
 *
 * 结构照 `ConnectPageActionConsentView` 写，但**不从 `@webskill/console` 导入**：
 * 该类型只存在于尚未发布的 SDK 版本里，直接引用会让默认（npm 包）模式编译不过。
 */
export interface PageActionConsentView {
  id: string;
  scope: string;
  action: string;
  grantedAt: string;
}

function isStored(value: unknown): value is StoredConsent {
  const v = value as StoredConsent | undefined;
  return typeof v?.id === 'string' && typeof v.scope === 'string' && typeof v.action === 'string';
}

const scopeOf = (target: PageActionTarget): string => target.frame ?? SELF_SCOPE;

/** `<scope>|<action>`；console 只把 id 当不透明串回传，这边才能直接解析回键 */
const idOf = (scope: string, action: string): string => `${scope}|${action}`;

function parseId(id: string): { scope: string; action: string } | undefined {
  const cut = id.lastIndexOf('|');
  if (cut <= 0 || cut === id.length - 1) return undefined;
  return { scope: id.slice(0, cut), action: id.slice(cut + 1) };
}

const keyOf = (scope: string, action: string): string => `${PREFIX}${scope}|${action}`;

const ACTION_LABELS_ZH: Record<PageActionKind, string> = {
  click: '点击',
  fill: '填写',
  submit: '提交',
  select: '选择',
  set: '开关',
  attach: '附件上传'
};

const SCOPE_LABELS_ZH: Record<string, string> = { [SELF_SCOPE]: '本页面' };

/**
 * 一份实现同时满足两个接口：
 * - `PageActionConsent` 给 `PageActionPolicy`（写 + 读）；
 * - `list` / `forget` / `forgetScope` 给 console 连接页（列 + 撤销）。
 *
 * 必须是同一份存储：console 上撤销后策略侧若还留缓存，用户会看到「已撤销」却依然不弹卡。
 */
export interface AgileConsentStore extends PageActionConsent {
  list(): Promise<readonly PageActionConsentView[]>;
  forget(id: string): Promise<void>;
  forgetScope(scope: string): Promise<void>;
}

function readEntry(key: string): StoredConsent | undefined {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw === null ? undefined : JSON.parse(raw);
    return isStored(parsed) ? parsed : undefined;
  } catch {
    // 损坏的记录按「没记过」处理：宁可多问一次，也不能凭一条读不懂的记录放行
    return undefined;
  }
}

export function createAgileConsentStore(): AgileConsentStore {
  return {
    recall(target: PageActionTarget, action: PageActionKind): boolean {
      return readEntry(keyOf(scopeOf(target), action)) !== undefined;
    },

    remember(target: PageActionTarget, action: PageActionKind): void {
      const scope = scopeOf(target);
      const entry: StoredConsent = {
        id: idOf(scope, action),
        scope,
        action,
        grantedAt: new Date().toISOString()
      };
      localStorage.setItem(keyOf(scope, action), JSON.stringify(entry));
    },

    /** 复选框文案必须说出真实粒度，否则用户以为只授权了这一个按钮 */
    describeScope(target: PageActionTarget, action: PageActionKind): string {
      const scope = scopeOf(target);
      return i18n.language.startsWith('zh')
        ? `以后不再询问 ${SCOPE_LABELS_ZH[scope] ?? scope} 里的「${ACTION_LABELS_ZH[action]}」操作`
        : `Don’t ask again for “${action}” in ${scope}`;
    },

    list(): Promise<readonly PageActionConsentView[]> {
      const views: PageActionConsentView[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key === null || !key.startsWith(PREFIX)) continue;
        const entry = readEntry(key);
        if (entry !== undefined) {
          views.push({ id: entry.id, scope: entry.scope, action: entry.action, grantedAt: entry.grantedAt });
        }
      }
      return Promise.resolve(views);
    },

    forget(id: string): Promise<void> {
      const parsed = parseId(id);
      if (parsed !== undefined) localStorage.removeItem(keyOf(parsed.scope, parsed.action));
      return Promise.resolve();
    },

    forgetScope(scope: string): Promise<void> {
      const doomed: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== null && key.startsWith(`${PREFIX}${scope}|`)) doomed.push(key);
      }
      for (const key of doomed) localStorage.removeItem(key);
      return Promise.resolve();
    }
  };
}
