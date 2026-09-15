/**
 * 把字节递给浏览器（0.21.0 分册 15 FR-15.9；分册 39 起由差异导出共用）。
 *
 * 三个刻意的决定：
 * 1. 不 `appendChild`——不入 DOM 也能触发，入了反而要在技能文档里塞一个临时节点；
 * 2. 延后 revoke——立刻 revoke 会在慢机器上撤掉还没读完的 blob；
 * 3. 这里**只知道自己发起了下载**。sandbox 页拿不到下载结果，
 *    所以调用方永远只能说「已生成」，不能说「已下载」（FR-15.9 第 4 条）。
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
