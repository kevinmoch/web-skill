/**
 * viewer 顶部的悬浮提示。
 *
 * 导出结果原先挤在右上角那个圆胶囊里：未导出清单会逐项列出降级项，几十个字被压进
 * 一条窄柱，没人读得下去。挪成顶部独立一条之后它有整行宽度，也才放得下关闭按钮。
 *
 * 只做「显示 → 自动收起」这一件事，不排队、不堆叠：这一页同一时刻只可能有一次导出。
 */

/** 自动消失的时长。用户按 × 可以更早收起。 */
export const VIEWER_TOAST_MS = 5_000;

export interface ViewerNotice {
  /** 空串等于立即收起 */
  show(text: string): void;
}

export interface ViewerToastUi {
  root: HTMLElement;
  body: HTMLElement;
  close: HTMLButtonElement;
}

export function createViewerToast(ui: ViewerToastUi): ViewerNotice {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const hide = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    // 文字也一并清掉：留着的话下一次 show 之前读屏软件仍能读到上一次的回执
    ui.body.textContent = '';
    ui.root.hidden = true;
  };

  ui.close.addEventListener('click', hide);
  hide();

  return {
    show(text: string): void {
      if (text === '') {
        hide();
        return;
      }
      // 重新计时：连着两次导出时，第二条不该被第一条的旧计时器提前掐掉
      if (timer !== undefined) clearTimeout(timer);
      ui.body.textContent = text;
      ui.root.hidden = false;
      timer = setTimeout(hide, VIEWER_TOAST_MS);
    }
  };
}
