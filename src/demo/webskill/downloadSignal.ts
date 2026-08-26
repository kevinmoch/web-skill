import type { ActionDownloadWatcher, ActionDownloadWindow } from '@webskill/sdk/agent';

/**
 * 操作触发的下载信号（SDK 0.15.0 分册 15）在**页面宿主**里的观察端口。
 *
 * 扩展宿主有 `chrome.downloads.onChanged`，页面宿主没有——网页能观察到的
 * 只有「本文档里有人点了一个会下载的链接」。所以这里的口径是
 * **浏览器接受了一次下载**，而不是磁盘落盘完成；实践上同源附件两者只差几十毫秒，
 * 而信号本身只是让模型知道「刚才那一下产生了文件」，不是回执。
 *
 * 只在一次页面操作的窗口期内挂监听，`settle()` 立刻摘掉：常驻监听意味着
 * 这个应用任何时候都在记录用户点了哪些下载链接，那与本能力无关。
 *
 * 计数之外什么都不读：href、文件名、类型一概不碰（D-15-3）。要读内容仍得走
 * `list_downloaded_files` / `read_downloaded_file` 的逐次确认卡。
 */

/** 判定一次点击会不会让浏览器起下载。只看锚点自身的声明，不发请求、不看响应头 */
function startsDownload(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const anchor = target.closest('a');
  if (anchor === null) return false;
  if (anchor.hasAttribute('download')) return true;
  // blob: / data: 的锚点即使没写 download，浏览器也可能直接存盘
  const href = anchor.getAttribute('href') ?? '';
  return href.startsWith('blob:') || href.startsWith('data:');
}

export function createAgileDownloadWatcher(): ActionDownloadWatcher {
  return {
    open: (): ActionDownloadWindow => {
      let count = 0;
      let firstHit: (() => void) | undefined;
      const listener = (event: Event): void => {
        if (!startsDownload(event.target)) return;
        count += 1;
        firstHit?.();
      };
      // 捕获阶段：页面自己的 handler 若 stopPropagation，冒泡阶段就再也看不到这一下
      document.addEventListener('click', listener, true);

      let closed = false;
      const close = (): number => {
        if (!closed) {
          closed = true;
          document.removeEventListener('click', listener, true);
        }
        return count;
      };

      return {
        settle: async ({ timeoutMs }) => {
          // 预算 0 = 执行抛错的那条路：关窗并丢弃计数
          if (timeoutMs <= 0) {
            close();
            return 0;
          }
          if (count === 0) {
            await new Promise<void>((resolve) => {
              const timer = setTimeout(resolve, timeoutMs);
              firstHit = () => {
                clearTimeout(timer);
                resolve();
              };
            });
            firstHit = undefined;
          }
          return close();
        }
      };
    }
  };
}
