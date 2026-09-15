/**
 * DWG 解析的 Worker 入口（0.22.0 分册 19，AC-19.11）。
 *
 * 解析必须离开主线程：实测 17 MB 的 `2D.dwg` 要 3.6 s，在侧栏线程上跑就是
 * 三秒半的白屏加转不动的滚动条。Worker 里只做一件事——字节进、`DwgDocumentContent` 出。
 *
 * 结果是纯数据（没有类实例、没有函数），可以直接结构化克隆回主线程。
 */

import { parseDwgDocument } from './dwgSource';

export interface DwgWorkerRequest {
  readonly id: number;
  readonly bytes: Uint8Array;
}

export type DwgWorkerResponse =
  | { readonly id: number; readonly ok: true; readonly document: unknown }
  | { readonly id: number; readonly ok: false; readonly message: string };

self.addEventListener('message', (event: MessageEvent<DwgWorkerRequest>) => {
  const { id, bytes } = event.data;
  try {
    const document = parseDwgDocument(bytes);
    const response: DwgWorkerResponse = { id, ok: true, document };
    self.postMessage(response);
  } catch (error) {
    // 错误对象跨不过结构化克隆的边界，只送文本
    const message = error instanceof Error ? error.message : String(error);
    const response: DwgWorkerResponse = { id, ok: false, message };
    self.postMessage(response);
  }
});
