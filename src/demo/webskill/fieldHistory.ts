import { FsMemoryStore, SerializingMemoryStore } from '@webskill/sdk';
import type { FileSystemProvider } from '@webskill/sdk';

/**
 * 字段历史（宿主自建的确定性依据通道，T6 §2）：
 * 画像（SDK 内建）是概括，说不出「你最近 10 条需求里有 7 条派给张伟」这种硬事实。
 * 宿主把枚举型/短文本字段的提交频次记在这里，模型经 fetchData('field-history') 读到后，
 * 由它自己填进 ask_user 的 suggestion / suggestionReason——永不代填。
 *
 * 与 chatbot 的 <chatRoot>/memory 完全隔离（独立 root）。
 */

/** 只记枚举型与短文本。白名单是硬拦截，不依赖调用方自觉——标题、描述、password 字段进不来 */
const TRACKED: Record<string, readonly string[]> = {
  requirement: ['assignee', 'priority', 'epic'],
  bug: ['module', 'severity', 'assignee'],
  test: ['type']
};

const MAX_VALUE_LEN = 64;
const TOGGLE_KEY = 'agile_field_history_enabled';

export interface FieldStat {
  values: Array<{ value: string; count: number; lastAt: number }>;
}

export function createFieldHistory(fs: FileSystemProvider): SerializingMemoryStore {
  // root 用应用自己的目录，与 chatbot 的 <chatRoot>/memory 完全隔离
  const base = new FsMemoryStore({ root: '/agile/field-history', fs });
  // 读-改-写必须串行，否则两个表单并发提交会互相覆盖
  return new SerializingMemoryStore(base);
}

/** 字段历史有**自己的开关**，不能复用 userProfile.enabled（有人接受记值、不接受画像） */
export function isFieldHistoryEnabled(): boolean {
  try {
    return globalThis.localStorage?.getItem(TOGGLE_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setFieldHistoryEnabled(enabled: boolean): void {
  globalThis.localStorage?.setItem(TOGGLE_KEY, enabled ? '1' : '0');
}

function bumpFrequency(cur: FieldStat | undefined, value: string): FieldStat {
  const values = [...(cur?.values ?? [])];
  const hit = values.find((x) => x.value === value);
  if (hit) {
    hit.count += 1;
    hit.lastAt = Date.now();
  } else {
    values.push({ value, count: 1, lastAt: Date.now() });
  }
  // 只留最近最常用的 10 个，避免无限增长
  values.sort((a, b) => b.count - a.count || b.lastAt - a.lastAt);
  return { values: values.slice(0, 10) };
}

/** 写入点在宿主 CRUD（技能脚本拿不到存储句柄，也不该拿到）。开关关闭时不记。 */
export async function recordFieldValues(
  store: SerializingMemoryStore,
  userId: string,
  entity: keyof typeof TRACKED,
  values: Record<string, unknown>
): Promise<void> {
  if (!isFieldHistoryEnabled()) return;
  const scope = `user:${userId}`;
  const fields = TRACKED[entity] ?? [];
  await store.transaction(scope, async (m) => {
    for (const field of fields) {
      const v = values[field];
      if (typeof v !== 'string' || v.length === 0 || v.length > MAX_VALUE_LEN) continue;
      const key = `field:${entity}.${field}`;
      const cur = (await m.get(scope, key)) as FieldStat | undefined;
      await m.set(scope, key, bumpFrequency(cur, v));
    }
  });
}

/** 读出：经 fetchData('field-history', { entity, field }) 通道，返回 top3 带占比 */
export async function readFieldHistory(
  store: SerializingMemoryStore,
  userId: string,
  params?: Record<string, unknown>
): Promise<unknown> {
  if (!isFieldHistoryEnabled()) return { enabled: false, values: [] };
  const { entity, field } = (params ?? {}) as { entity?: string; field?: string };
  if (!entity || !field) throw new Error('field-history requires "entity" and "field" params');
  if (!(TRACKED[entity] ?? []).includes(field)) {
    throw new Error(`field "${field}" is not tracked for entity "${entity}"`);
  }
  const stat = (await store.get(`user:${userId}`, `field:${entity}.${field}`)) as FieldStat | undefined;
  const total = (stat?.values ?? []).reduce((s, x) => s + x.count, 0);
  return { enabled: true, values: (stat?.values ?? []).slice(0, 3).map((x) => ({ value: x.value, count: x.count, total })) };
}
