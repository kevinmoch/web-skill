import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DocsTheme } from '../../docs/theme';

interface DocsThemeToggleProps {
  theme: DocsTheme;
  onToggle: () => void;
}

/**
 * 独立文档构建的亮/暗主题切换（侧栏顶部，与语言切换并排）。
 * 图标约定与 src/demo 的侧栏一致：显示切换目标 —— 亮色下显示月亮
 * （点了去暗色），暗色下显示太阳（点了去亮色）。
 */
export default function DocsThemeToggle({ theme, onToggle }: DocsThemeToggleProps) {
  const { t } = useTranslation();
  const toDark = theme === 'light';
  const label = toDark ? t('docs.themeToDark') : t('docs.themeToLight');
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      aria-pressed={theme === 'dark'}
      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-text-dim transition-colors hover:bg-surface hover:text-text-main"
    >
      {toDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
