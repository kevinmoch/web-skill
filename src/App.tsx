import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './components/LanguageToggle';
import { Terminal, ArrowUp } from 'lucide-react';
import Home from './pages/Home';
import Implement from './pages/Implement';
import Polyfill from './pages/Polyfill';
import Standards from './pages/Standards';
import DocsPage from './pages/docs/DocsPage';
import { chapterBySlug, chapterTitle } from './docs/manifest';
import { docsRouteFromHash, type DocsRoute } from './docs/router';

// 顶层页面与 hash 路由一一对应；docs 另有内部章节路由（#/docs/<slug>）
const TAB_HASHES: Record<string, string> = {
  home: '#/home',
  implement: '#/implement',
  polyfill: '#/polyfill',
  standards: '#/standardization',
  docs: '#/docs'
};

const tabFromHash = (hash: string): string | null => {
  if (docsRouteFromHash(hash)) return 'docs';
  for (const [tab, tabHash] of Object.entries(TAB_HASHES)) {
    if (hash === tabHash) return tab;
  }
  return null;
};

const initialTab = (): string => tabFromHash(window.location.hash) ?? 'home';

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [docsRoute, setDocsRoute] = useState<DocsRoute>(
    () => docsRouteFromHash(window.location.hash) ?? { slug: null, anchor: null }
  );
  const [showScroll, setShowScroll] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [navCanScroll, setNavCanScroll] = useState(false);

  // 移动端导航溢出提示：内容超出可视宽度且未滚到底时，在右侧显示淡出遮罩
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const update = () => {
      setNavCanScroll(nav.scrollWidth - nav.clientWidth - nav.scrollLeft > 1);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    nav.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      nav.removeEventListener('scroll', update);
    };
  }, [i18n.resolvedLanguage, i18n.language]);

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

  // hash 路由监听：#/docs 交给文档路由，其余顶层页按 TAB_HASHES 映射；
  // 浏览器前进/后退回到无 hash 状态时落回首页。
  useEffect(() => {
    const onHashChange = () => {
      const route = docsRouteFromHash(window.location.hash);
      if (route) {
        setDocsRoute(route);
        setActiveTab('docs');
        return;
      }
      const tab = tabFromHash(window.location.hash);
      if (tab) {
        setActiveTab(tab);
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
      } else if (activeTab === 'polyfill') {
        document.title = `${t('polyfill.title')} - webskill.ai`;
      } else {
        document.title = isZh ? 'webskill.ai - 运行在浏览器的基于 Web 的 Agent 技能' : 'webskill.ai - Web-Based Agent Skill - Running in the Browser';
      }
      document.documentElement.lang = i18n.resolvedLanguage || i18n.language || 'en';
    } catch (e) {
      // ignore
    }
  }, [t, i18n.language, i18n.resolvedLanguage, activeTab, docsRoute]);

  // 所有顶层页统一经 hash 切换，浏览器前进/后退由此自然可用；
  // 重复点击当前页不新增历史记录。
  const switchTab = (tab: string) => {
    const hash = TAB_HASHES[tab] ?? '#/home';
    if (tab === 'docs') {
      // 经 hash 进入文档，深链与浏览器前进/后退才可用；已在文档内则原地不动
      if (!/^#\/docs(\/|$)/.test(window.location.hash)) {
        window.location.hash = hash;
      } else {
        setActiveTab('docs');
      }
      return;
    }
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      setActiveTab(tab);
    }
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'implement':
        return <Implement t={t} />;
      case 'polyfill':
        return <Polyfill t={t} />;
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
    { id: 'polyfill', label: t('nav.polyfill') },
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
        <div className="relative w-full md:w-auto">
          <nav ref={navRef} className="flex w-full md:w-auto justify-between md:justify-center gap-2 sm:gap-6 md:gap-8 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => switchTab(item.id)}
                className={`${
                  activeTab === item.id ? 'text-accent font-semibold' : 'text-text-dim'
                } text-[12px] sm:text-[14px] uppercase tracking-[1px] hover:text-text-main cursor-pointer transition-colors whitespace-nowrap`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div
            className={`pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-bg to-transparent transition-opacity md:hidden ${
              navCanScroll ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
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
