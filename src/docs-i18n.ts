import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import zh from './locales/zh.json';

/**
 * 独立文档构建（docs.html → dist-docs）的 i18n 初始化。
 * 与主站 i18n.ts 的唯一差别是 fallbackLng='zh'：浏览器语言识别不出
 * 支持的语言时文档默认中文（主站默认英文）。检测顺序 localStorage →
 * navigator：首次访问跟随浏览器语言，用户手动切换后被记住。
 * 与 i18n.ts 永不同页加载（docs.html 只引这里），单例不冲突。
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh }
    },
    fallbackLng: 'zh',
    supportedLngs: ['en', 'zh'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  });

export default i18n;
