import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();

  const setLang = (lang: string) => {
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('i18nextLng', lang);
    } catch (e) {
      // ignore
    }
    document.documentElement.lang = lang;
  };

  const current = i18n.language || 'en';

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLang('zh')}
        className={`text-[11px] cursor-pointer px-2 py-1 rounded ${current.startsWith('zh') ? 'bg-surface/80' : 'opacity-50'}`}
        aria-pressed={current.startsWith('zh')}
      >
        中文
      </button>
      <button
        onClick={() => setLang('en')}
        className={`text-[11px] cursor-pointer px-2 py-1 rounded ${current.startsWith('en') ? 'bg-surface/80' : 'opacity-50'}`}
        aria-pressed={current.startsWith('en')}
      >
        English
      </button>
    </div>
  );
};

export default LanguageToggle;
