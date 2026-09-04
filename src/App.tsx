import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './components/LanguageToggle';
import { Terminal, ArrowUp } from 'lucide-react';
import Home from './pages/Home';
import Implement from './pages/Implement';
import Standards from './pages/Standards';
import DocsPage from './pages/docs/DocsPage';
import { chapterBySlug, chapterTitle } from './docs/manifest';
import { docsRouteFromHash, type DocsRoute } from './docs/router';

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState(() =>
    docsRouteFromHash(window.location.hash) ? 'docs' : 'home'
  );
  const [docsRoute, setDocsRoute] = useState<DocsRoute>(
    () => docsRouteFromHash(window.location.hash) ?? { slug: null, anchor: null }
  );
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // hash 路由监听：只接管 #/docs 系；home/implement/standards 保持无 hash 的现有行为。
  // 浏览器前进/后退回到无 hash 状态时落回首页。
  useEffect(() => {
    const onHashChange = () => {
      const route = docsRouteFromHash(window.location.hash);
      if (route) {
        setDocsRoute(route);
        setActiveTab('docs');
      } else if (window.location.hash === '') {
        setActiveTab('home');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    try {
      const isZh = (i18n.resolvedLanguage || i18n.language || '').startsWith('zh');
      if (activeTab === 'docs') {
        const chapter = chapterBySlug(docsRoute.slug ?? undefined);
        const docsName = t('docs.pageTitle');
        document.title = chapter
          ? `${chapter.num}. ${chapterTitle(chapter, isZh)} - ${docsName} - webskill.ai`
          : `${docsName} - webskill.ai`;
      } else {
        document.title = isZh ? 'webskill.ai - 运行在浏览器的基于 Web 的 Agent 技能' : 'webskill.ai - Web-Based Agent Skill - Running in the Browser';
      }
      document.documentElement.lang = i18n.resolvedLanguage || i18n.language || 'en';
    } catch (e) {
      // ignore
    }
  }, [t, i18n.language, i18n.resolvedLanguage, activeTab, docsRoute]);

  const switchTab = (tab: string) => {
    if (tab === 'docs') {
      // 经 hash 进入文档，深链与浏览器前进/后退才可用；已在文档内则原地不动
      if (!/^#\/docs(\/|$)/.test(window.location.hash)) {
        window.location.hash = '#/docs';
      } else {
        setActiveTab('docs');
      }
    } else {
      setActiveTab(tab);
      // 离开文档时静默清掉 hash：replaceState 不触发 hashchange、不新增历史记录
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'implement':
        return <Implement t={t} />;
      case 'standards':
        return <Standards t={t} />;
      case 'docs':
        return <DocsPage t={t} slug={docsRoute.slug} anchor={docsRoute.anchor} />;
      case 'home':
      default:
        return <Home t={t} lang={i18n.resolvedLanguage || i18n.language || 'en'} />;
    }
  };

  const navItems = [
    { id: 'home', label: t('nav.home') },
    { id: 'implement', label: t('nav.implement') },
    { id: 'standards', label: t('nav.standardization') },
    { id: 'docs', label: t('nav.docs') },
  ];

  // 文档模块按视觉规范放宽到 90rem（三栏：17rem 侧栏 + 43rem 正文 + 16rem 大纲）；
  // 其余页保持站点既有 1024px
  const isDocs = activeTab === 'docs';
  const frameWidth = isDocs ? 'max-w-[90rem]' : 'max-w-[1024px]';

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans flex flex-col items-center">
      {/* Navbar */}
      <header className={`w-full ${frameWidth} px-6 sm:px-10 py-4 sm:py-6 flex flex-col md:flex-row justify-between items-center border-b border-border-color gap-4 md:gap-0`}>
        <div className="flex w-full md:w-auto justify-between items-center">
          <div 
            className="font-mono font-bold text-[18px] tracking-[-0.5px] flex items-center gap-2 cursor-pointer"
            onClick={() => switchTab('home')}
          >
            webskill.ai
          </div>
          <div className="md:hidden font-mono text-[14px] opacity-70">
            <LanguageToggle />
          </div>
        </div>
        <nav className="flex w-full md:w-auto justify-between md:justify-center gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => switchTab(item.id)}
              className={`${
                activeTab === item.id ? 'text-accent font-semibold' : 'text-text-dim'
              } text-[14px] uppercase tracking-[1px] hover:text-text-main cursor-pointer transition-colors whitespace-nowrap`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="font-mono text-[14px] opacity-70 hidden md:block">
          <LanguageToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`w-full ${frameWidth} flex-1`}>
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className={`w-full ${frameWidth} border-t border-border-color bg-bg py-6 px-6 sm:px-10 mb-6`}>
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Terminal className="w-4 h-4 text-text-dim" />
            <span className="font-mono font-bold text-[14px] text-text-dim">
              <span className="text-accent">{t('footer.author')}</span>
            </span>
          </div>
          <p className="text-text-dim text-[14px] font-mono">
            <span className="text-accent">{t('footer.company')}</span>, {t('footer.date')}.{' '}
            <a href="https://github.com/kevinmoch/web-skill" target="_blank" className="text-accent hover:underline">
              {t('footer.github')}
            </a>
          </p>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 p-3 bg-surface/50 backdrop-blur-md border border-border-color rounded-full shadow-lg hover:bg-surface-hover/80 hover:border-accent/50 text-text-dim hover:text-accent transition-all duration-300 z-50 ${
          showScroll ? 'opacity-70 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}
