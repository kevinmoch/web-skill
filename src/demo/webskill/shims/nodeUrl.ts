/**
 * `node:url` 的浏览器 shim（仅实现 vfile 等用到的 `fileURLToPath` / `pathToFileURL`）。
 * 背景同 ./nodeModule.ts。
 */

export function fileURLToPath(url: string | URL): string {
  const href = typeof url === 'string' ? url : url.href;
  if (!href.startsWith('file://')) {
    throw new Error(`[node-url-shim] fileURLToPath only supports file: URLs, got: ${href}`);
  }
  const { pathname, hostname } = new URL(href);
  const path = decodeURIComponent(pathname);
  return hostname ? `//${hostname}${path}` : path;
}

export function pathToFileURL(path: string): URL {
  const abs = path.startsWith('/') ? path : `/${path}`;
  return new URL(`file://${abs.split('/').map(encodeURIComponent).join('/')}`);
}

export default { fileURLToPath, pathToFileURL };
