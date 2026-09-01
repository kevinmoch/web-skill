import type { ReactNode } from 'react';

/**
 * 「仅扩展版」类标记徽章（视觉规范 §6 Badge）：透明边框 + soft 底 + -1 文字。
 * soft 底半透明，叠在侧栏 surface 底上自然加深一层。
 */
export default function DocsBadge({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        backgroundColor: 'var(--docs-purple-soft)',
        color: 'var(--docs-purple-1)',
        borderColor: 'transparent'
      }}
      className="ml-2 inline-block shrink-0 rounded border px-1.5 py-0.5 align-middle text-[0.75rem] font-medium leading-tight"
    >
      {children}
    </span>
  );
}
