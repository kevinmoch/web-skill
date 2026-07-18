import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './components/LanguageToggle';
import { Terminal, ArrowUp } from 'lucide-react';
import Home from './pages/Home';
import Implement from './pages/Implement';
import Standards from './pages/Standards';

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('home');
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    try {
      document.title = 'webskill.ai - Web-Based Agent Skill - Running in the Browser';
      document.documentElement.lang = i18n.resolvedLanguage || i18n.language || 'en';
    } catch (e) {
      // ignore
    }
  }, [t, i18n.language]);

  const renderPage = () => {
    switch (activeTab) {
      case 'implement':
        return <Implement t={t} />;
      case 'standards':
        return <Standards t={t} />;
      case 'home':
      default:
        return <Home t={t} lang={i18n.resolvedLanguage || i18n.language || 'en'} />;
    }
  };

  const navItems = [
    { id: 'home', label: t('nav.home') },
    { id: 'implement', label: t('nav.implement') },
    { id: 'standards', label: t('nav.standardization') },
  ];

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans flex flex-col items-center">
      {/* Navbar */}
      <header className="w-full max-w-[1024px] px-6 sm:px-10 py-4 sm:py-6 flex flex-col md:flex-row justify-between items-center border-b border-border-color gap-4 md:gap-0">
        <div className="flex w-full md:w-auto justify-between items-center">
          <div 
            className="font-mono font-bold text-[18px] tracking-[-0.5px] flex items-center gap-2 cursor-pointer"
            onClick={() => setActiveTab('home')}
          >
            webskill.ai
          </div>
          <div className="md:hidden font-mono text-[11px] opacity-70">
            <LanguageToggle />
          </div>
        </div>
        <nav className="flex w-full md:w-auto justify-between md:justify-center gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`${
                activeTab === item.id ? 'text-accent' : 'text-text-dim'
              } ${
                !(i18n.resolvedLanguage || i18n.language || '').startsWith('zh') ? 'text-[10px] sm:text-[10px]' : 'text-[12px] sm:text-[13px]'
              } uppercase tracking-[1px] hover:text-text-main cursor-pointer transition-colors whitespace-nowrap`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="font-mono text-[11px] opacity-50 hidden md:block">
          <LanguageToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-[1024px] flex-1">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[1024px] border-t border-border-color bg-bg py-6 px-6 sm:px-10 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Terminal className="w-4 h-4 text-text-dim" />
            <span className="font-mono font-bold text-[12px] text-text-dim">
              <span className="text-accent">{t('footer.author')}</span>
            </span>
          </div>
          <p className="text-text-dim text-[11px] font-mono">
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
