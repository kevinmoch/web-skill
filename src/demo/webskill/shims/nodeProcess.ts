/**
 * `node:process` 的浏览器 shim（仅 vfile 用到的 `cwd()`，加少量常用字段兜底）。
 * 背景同 ./nodeModule.ts。
 */

const env: Record<string, string | undefined> = {};

const processShim = {
  env,
  cwd: () => '/',
  platform: 'linux' as const,
  argv: [] as string[],
  version: '',
  versions: {} as Record<string, string>,
  nextTick: (fn: (...args: unknown[]) => void, ...args: unknown[]) => queueMicrotask(() => fn(...args))
};

export const cwd = processShim.cwd;
export const platform = processShim.platform;
export const argv = processShim.argv;
export const version = processShim.version;
export const versions = processShim.versions;
export const nextTick = processShim.nextTick;
export { env };

export default processShim;
