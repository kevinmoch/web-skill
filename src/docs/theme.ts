import { createContext } from 'react';

/**
 * 独立文档构建（docs.html → dist-docs）的亮/暗主题。
 * 主站固定暗色：主站不提供 DocsThemeContext.Provider，消费方拿到默认值 'dark'，
 * 且只有 docs.html 会写 data-docs-theme 属性，主站页面不受影响。
 */

export type DocsTheme = 'light' | 'dark';

export const DOCS_THEME_KEY = 'docs-theme';

/**
 * 初始主题：docs.html 内联脚本写入的 data-docs-theme > 用户存过的选择
 * > 系统 prefers-color-scheme > 亮色兜底。内联脚本在首屏前已按同一套规则
 * 写过属性，React 这里先读属性是为了两边结论一致，避免挂载后主题跳变。
 */
export function resolveDocsTheme(): DocsTheme {
  const attr = document.documentElement.dataset.docsTheme;
  if (attr === 'light' || attr === 'dark') return attr;
  try {
    const stored = localStorage.getItem(DOCS_THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // ignore
  }
  try {
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {
    // ignore
  }
  return 'light';
}

/** 写到 <html data-docs-theme>：全局 token 与 .docs-root 作用域变量都按它分流（index.css） */
export function applyDocsTheme(theme: DocsTheme): void {
  document.documentElement.dataset.docsTheme = theme;
}

/**
 * 持久化用户的选择。只在用户手动切换时调用——初始渲染不该把系统偏好
 * 落盘，否则用户之后改系统主题，文档不会再跟随。
 */
export function persistDocsTheme(theme: DocsTheme): void {
  try {
    localStorage.setItem(DOCS_THEME_KEY, theme);
  } catch {
    // ignore
  }
}

/** 独立文档构建由 DocsApp 提供当前主题；主站不挂 Provider，保持默认暗色 */
export const DocsThemeContext = createContext<DocsTheme>('dark');
