/// <reference types="@webskill/chatbot/virtual" />
import { createConfigDefaultsStore } from '@webskill/chatbot/config';
import type { WebSkillConfigDefaults } from '@webskill/chatbot/config';
import type { RuntimeConfigStore } from '@webskill/chatbot';
import { loadWebSkillSecrets, WEBSKILL_CONFIG } from 'virtual:webskill-config';

/**
 * `config.json` 缺省值的接线。
 *
 * 合并语义、占位串换入换出、烘焙凭据的解密全在 SDK 里
 * （`@webskill/chatbot/config` 与构建期的 `@webskill/chatbot/vite`）。
 * 这里只剩本应用自己的事：快照存哪个 localStorage 键。
 */

/** 上次应用过的缺省值快照。有了它，改 config.json 重新构建，老用户也能拿到新值 */
const SNAPSHOT_KEY = 'agile.webskill.config-defaults';

const snapshot = {
  read: (): WebSkillConfigDefaults | undefined => {
    try {
      const raw = globalThis.localStorage?.getItem(SNAPSHOT_KEY);
      return raw ? (JSON.parse(raw) as WebSkillConfigDefaults) : undefined;
    } catch {
      // 读不到就按「首次应用」处理：最差是某一项跟着新缺省值走，不影响用户改过的项
      return undefined;
    }
  },
  write: (value: WebSkillConfigDefaults) => {
    try {
      globalThis.localStorage?.setItem(SNAPSHOT_KEY, JSON.stringify(value));
    } catch {
      // 隐私模式 / 配额满：不写快照只是失去「跟随新缺省值」，不该让整页起不来
    }
  },
  clear: () => {
    try {
      globalThis.localStorage?.removeItem(SNAPSHOT_KEY);
    } catch {
      // 同上
    }
  }
};

/** 把 config.json 的缺省值与烘焙凭据接进本应用的 localStorage store */
export function withConfigDefaults(inner: RuntimeConfigStore, readRaw: () => unknown): RuntimeConfigStore {
  return createConfigDefaultsStore(inner, {
    defaults: WEBSKILL_CONFIG,
    readRaw,
    snapshot,
    secrets: loadWebSkillSecrets
  });
}
