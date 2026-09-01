import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

interface DocsImageProps {
  src?: string;
  alt?: string;
  /** 图注；不传则回退用 alt（Markdown 图片的约定就是 alt 即图注） */
  caption?: string;
  /** 追加在 figure 里 img 上的类名（如首页 M-01 的居中） */
  imgClassName?: string;
}

/**
 * 文档图片：figure + 图注 + 边框 + lazy（规范 §5），点击开轻量灯箱。
 * 灯箱行为约定（用户评审要求）：
 * - 全屏遮罩（黑半透明 + backdrop-blur，z-index 70，高于 §6 层级表里的遮罩 50/侧栏 60）；
 * - 图以 max 90vw/90vh 居中保持比例，SVG 同样可放大；
 * - 点遮罩任意处或按 Esc 关闭；打开时锁 body 滚动、关闭恢复；
 * - 不做滚动/缩放；动画用站点已有 motion。
 */
export default function DocsImage({ src, alt, caption, imgClassName }: DocsImageProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // 打开时锁定背景滚动，关闭/卸载时恢复
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc 关闭 + 打开时焦点移到关闭按钮（键盘可操作）
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const label = caption ?? alt;
  // SVG（Mermaid 图）天然分辨率小，位图式 max 约束不会放大它；
  // 给 SVG 一个 90vw×90vh 的盒子 + object-contain，让它在盒内等比放大（矢量无损）。
  // 位图（截图）保持 max 约束，不放超过原始尺寸（避免糊）。
  const isSvg = (src ?? '').split('?')[0].toLowerCase().endsWith('.svg');
  return (
    <>
      <figure className="my-4">
        <img
          src={src}
          alt={alt ?? ''}
          loading="lazy"
          onClick={() => setOpen(true)}
          className={`h-auto max-w-full cursor-zoom-in rounded-lg border border-[var(--docs-divider)] ${imgClassName ?? ''}`}
        />
        {label ? (
          <figcaption className="mt-2 text-center text-[0.875rem] text-text-dim">{label}</figcaption>
        ) : null}
      </figure>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={alt ?? t('docs.lightbox.close')}
            className="fixed inset-0 z-[70] flex cursor-zoom-out items-center justify-center bg-bg/80 p-4 backdrop-blur-sm"
          >
            <motion.img
              src={src}
              alt={alt ?? ''}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`rounded-lg border border-[var(--docs-divider)] object-contain ${
                isSvg ? 'h-[90vh] w-[90vw]' : 'max-h-[90vh] max-w-[90vw]'
              }`}
            />
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('docs.lightbox.close')}
              className="absolute right-4 top-4 flex h-10 w-10 cursor-zoom-out items-center justify-center rounded-full border border-border-color bg-surface/60 text-text-dim backdrop-blur transition-colors hover:text-text-main"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
