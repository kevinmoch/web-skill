import React from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageToggleProps {
  /**
   * pair（默认）：「中文 | English」两个并排按钮，主站 header 用。
   * compact：单个按钮，文字是切换目标语言（当前中文显示 "EN"，当前英文
   * 显示 "中"），独立文档构建的侧栏顶部用。
   */
  variant?: 'pair' | 'compact';
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ variant = 'pair' }) => {
  const { t, i18n } = useTranslation();

  const setLang = (lang: string) => {
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('i18nextLng', lang);
    } catch (e) {
      // ignore
    }
    document.documentElement.lang = lang;
  };

  const current = i18n.resolvedLanguage || i18n.language || 'en';
  const isZh = current.startsWith('zh');

  if (variant === 'compact') {
    return (
      <button
        onClick={() => setLang(isZh ? 'en' : 'zh')}
        className="cursor-pointer rounded px-2 py-1 text-xs font-semibold text-text-dim transition-colors hover:bg-surface hover:text-text-main"
        aria-label={t('docs.switchLang')}
        title={t('docs.switchLang')}
      >
        {isZh ? 'EN' : '中'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLang('zh')}
        className={`text-xs cursor-pointer px-2 py-1 rounded font-medium ${isZh ? 'bg-surface font-semibold' : 'opacity-50'}`}
        aria-pressed={isZh}
      >
        中文
      </button>
      <button
        onClick={() => setLang('en')}
        className={`text-xs cursor-pointer px-2 py-1 rounded font-medium ${!isZh ? 'bg-surface font-semibold' : 'opacity-50'}`}
        aria-pressed={!isZh}
      >
        English
      </button>
    </div>
  );
};

export default LanguageToggle;
