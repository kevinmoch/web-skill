/**
 * `node:path` 的浏览器 shim（POSIX 语义子集）。
 *
 * 背景同 ./nodeModule.ts：@webskill/* 发布产物里打包进 vfile 等 CJS 依赖，
 * 它们在浏览器侧被调用时需要真实的 path 函数（Vite 的外部化空壳一碰就抛错）。
 * 只实现 POSIX 变体——vfile/unified 在浏览器里处理的正是 POSIX 风格路径。
 */

export const sep = '/';
export const delimiter = ':';

export function normalize(p: string): string {
  if (p.length === 0) return '.';
  const isAbs = p.startsWith('/');
  const parts = p.split('/').filter((s) => s.length > 0 && s !== '.');
  const out: string[] = [];
  for (const part of parts) {
    if (part === '..') {
      if (out.length > 0 && out[out.length - 1] !== '..') out.pop();
      else if (!isAbs) out.push('..');
    } else {
      out.push(part);
    }
  }
  const res = (isAbs ? '/' : '') + out.join('/');
  return res === '' ? (isAbs ? '/' : '.') : res;
}

export function join(...parts: string[]): string {
  return normalize(parts.filter((s) => s.length > 0).join('/'));
}

export function isAbsolute(p: string): boolean {
  return p.startsWith('/');
}

export function basename(p: string, ext?: string): string {
  const base = p.split('/').pop() ?? '';
  if (ext && base.endsWith(ext) && base.length > ext.length) return base.slice(0, -ext.length);
  return base;
}

export function dirname(p: string): string {
  const idx = p.lastIndexOf('/');
  if (idx === -1) return '.';
  if (idx === 0) return '/';
  return p.slice(0, idx);
}

export function extname(p: string): string {
  const base = basename(p);
  const idx = base.lastIndexOf('.');
  return idx > 0 ? base.slice(idx) : '';
}

export function resolve(...parts: string[]): string {
  let resolved = '';
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]!;
    if (part.length === 0) continue;
    resolved = resolved ? `${part}/${resolved}` : part;
    if (part.startsWith('/')) return normalize(resolved);
  }
  return normalize(`/${resolved}`);
}

export function relative(from: string, to: string): string {
  const fromParts = resolve(from).split('/').filter(Boolean);
  const toParts = resolve(to).split('/').filter(Boolean);
  let i = 0;
  while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) i++;
  return [...fromParts.slice(i).map(() => '..'), ...toParts.slice(i)].join('/') || '.';
}

export function parse(p: string): { root: string; dir: string; base: string; ext: string; name: string } {
  const root = isAbsolute(p) ? '/' : '';
  const dir = dirname(p);
  const base = basename(p);
  const ext = extname(p);
  return { root, dir, base, ext, name: base.slice(0, base.length - ext.length) };
}

export function format(parts: { root?: string; dir?: string; base?: string; ext?: string; name?: string }): string {
  const base = parts.base ?? `${parts.name ?? ''}${parts.ext ?? ''}`;
  return parts.dir ? `${parts.dir}/${base}` : base;
}

export default {
  sep,
  delimiter,
  normalize,
  join,
  isAbsolute,
  basename,
  dirname,
  extname,
  resolve,
  relative,
  parse,
  format,
  posix: { sep, delimiter, normalize, join, isAbsolute, basename, dirname, extname, resolve, relative, parse, format }
};
