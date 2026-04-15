import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './components/LanguageToggle';
import { motion } from 'motion/react';
import { BrainCircuit, Code2, LayoutTemplate, Wrench, ShieldAlert, Zap, RefreshCw, Lock, FileJson, ChevronRight, Terminal, Network } from 'lucide-react';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
}

const FadeIn: React.FC<FadeInProps> = ({ children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6, delay }}>
    {children}
  </motion.div>
);

const ICONS: Record<string, any> = {
  BrainCircuit,
  Code2,
  LayoutTemplate,
  Wrench,
  ShieldAlert,
  Zap,
  RefreshCw,
  Lock,
  FileJson,
  ChevronRight,
  Terminal,
  Network
};

const TrinityDiagram: React.FC<{ t: (key: string) => any }> = ({ t }) => (
  <div className="relative w-full max-w-2xl mx-auto aspect-video flex items-center justify-center mt-16 mb-8">
    {/* Central LLM */}
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="absolute z-20 flex flex-col items-center justify-center w-32 h-32 rounded-full bg-surface border border-border-color shadow-[0_0_40px_rgba(0,240,255,0.2)]"
    >
      <BrainCircuit className="w-10 h-10 text-accent mb-2" />
      <span className="font-mono font-bold text-sm">LLM</span>
    </motion.div>

    {/* Connecting Lines */}
    <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.3))' }}>
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
        d="M 50 50 L 20 20"
        stroke="var(--color-accent)"
        strokeWidth="1"
        fill="none"
        strokeDasharray="4 4"
      />
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.7 }}
        d="M 50 50 L 80 20"
        stroke="var(--color-accent)"
        strokeWidth="1"
        fill="none"
        strokeDasharray="4 4"
      />
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.9 }}
        d="M 50 50 L 50 85"
        stroke="var(--color-accent)"
        strokeWidth="1"
        fill="none"
        strokeDasharray="4 4"
      />
    </svg>

    {/* Nodes */}
    <motion.div
      initial={{ opacity: 0, x: -20, y: -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="absolute top-[10%] left-[10%] flex flex-col items-center p-4 bg-surface/80 backdrop-blur border border-border-color rounded w-40"
    >
      <Code2 className="w-6 h-6 text-text-main mb-2" />
      <span className="font-mono font-semibold text-sm">WebSkill</span>
      <span className="text-[10px] text-text-dim text-center mt-1">{t('trinity.nodeLabels.webskill')}</span>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, x: 20, y: -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.8, delay: 0.7 }}
      className="absolute top-[10%] right-[10%] flex flex-col items-center p-4 bg-surface/80 backdrop-blur border border-border-color rounded w-40"
    >
      <LayoutTemplate className="w-6 h-6 text-text-main mb-2" />
      <span className="font-mono font-semibold text-sm">Generative UI</span>
      <span className="text-[10px] text-text-dim text-center mt-1">{t('trinity.nodeLabels.generative')}</span>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.9 }}
      className="absolute bottom-[0%] left-1/2 -translate-x-1/2 flex flex-col items-center p-4 bg-surface/80 backdrop-blur border border-border-color rounded w-40"
    >
      <Wrench className="w-6 h-6 text-text-main mb-2" />
      <span className="font-mono font-semibold text-sm">WebMCP</span>
      <span className="text-[10px] text-text-dim text-center mt-1">{t('trinity.nodeLabels.webmcp')}</span>
    </motion.div>
  </div>
);

const CodeBlock: React.FC<{ t: (key: string) => any }> = ({ t }) => (
  <div className="rounded border border-border-color bg-[#0d0d0d] mt-6">
    <div className="flex items-center px-4 py-2 border-b border-border-color bg-surface/50">
      <div className="flex space-x-2">
        <div className="w-2 h-2 rounded-full bg-border-color" />
        <div className="w-2 h-2 rounded-full bg-border-color" />
        <div className="w-2 h-2 rounded-full bg-border-color" />
      </div>
      <div className="ml-4 text-[10px] font-mono text-text-dim">WEB IDL</div>
    </div>
    <div className="p-4 overflow-x-auto">
      <pre className="text-[11px] font-mono leading-relaxed">
        <code className="text-text-main">
          <span className="text-text-dim">// WebSkill manager (handles CRUD and validation based on OPFS)</span>
          {'\n'}
          <span className="text-accent">[Exposed=(Window,Worker)]</span> {'{\n'}
          <span className="text-accent">interface</span> <span className="text-text-main">WebSkillManager </span> {'{\n'}
          <span className="text-accent indent">Promise&lt;WebSkill?&gt;</span> <span className="text-text-main">get(DOMString skillId);</span>
          {'\n'}
          <span className="text-accent indent">Promise&lt;DOMString&gt;</span> <span className="text-text-main">create(WebSkillOptions options);</span>
          {'\n'}
          <span className="text-accent indent">Promise&lt;boolean&gt;</span> <span className="text-text-main">update(DOMString skillId, WebSkillOptions options);</span>
          {'\n'}
          <span className="text-accent indent">Promise&lt;boolean&gt;</span> <span className="text-text-main">remove(DOMString skillId);</span>
          {'\n'}
          <span className="text-text-dim indent">// Validate UI & MCP constraints meet security baseline</span>
          {'\n'}
          <span className="text-accent indent">Promise&lt;boolean&gt;</span> <span className="text-text-main">validate(DOMString skillId);</span>
          {'\n'}
          <span className="text-accent indent">Promise&lt;sequence&lt;WebSkill&gt;&gt;</span> <span className="text-text-main">query(DOMString? keyword);</span>
          {'\n'}
          {'}\n'}
        </code>
      </pre>
    </div>
  </div>
);

export default function App() {
  const { t, i18n } = useTranslation();

  React.useEffect(() => {
    try {
      document.title = t('meta.title');
      document.documentElement.lang = i18n.language || 'en';
    } catch (e) {
      // ignore
    }
  }, [t, i18n.language]);

  const trinityItems = (t('trinity.items', { returnObjects: true }) as any[]) || [];
  const valueItems = (t('values.items', { returnObjects: true }) as any[]) || [];
  const standardsList = (t('standards.list', { returnObjects: true }) as string[]) || [];
  const securityItems = (t('security.items', { returnObjects: true }) as any[]) || [];

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans flex flex-col items-center">
      {/* Navbar */}
      <header className="w-full max-w-[1024px] px-10 py-6 flex justify-between items-center border-b border-x border-border-color">
        <div className="font-mono font-bold text-[18px] tracking-[-0.5px] flex items-center gap-2">WebSkill</div>
        <nav className="hidden md:flex gap-8">
          <a
            href="#architecture"
            className={`text-text-dim ${i18n.language && i18n.language.startsWith('en') ? 'text-[10px]' : 'text-[13px]'} uppercase tracking-[1px] hover:text-text-main transition-colors`}
          >
            {t('nav.architecture')}
          </a>
          <a
            href="#values"
            className={`text-text-dim ${i18n.language && i18n.language.startsWith('en') ? 'text-[10px]' : 'text-[13px]'} uppercase tracking-[1px] hover:text-text-main transition-colors`}
          >
            {t('nav.values')}
          </a>
          <a
            href="#standards"
            className={`text-text-dim ${i18n.language && i18n.language.startsWith('en') ? 'text-[11px]' : 'text-[13px]'} uppercase tracking-[1px] hover:text-text-main transition-colors`}
          >
            {t('nav.standards')}
          </a>
          <a
            href="#security"
            className={`text-text-dim ${i18n.language && i18n.language.startsWith('en') ? 'text-[11px]' : 'text-[13px]'} uppercase tracking-[1px] hover:text-text-main transition-colors`}
          >
            {t('nav.security')}
          </a>
        </nav>
        <div className="font-mono text-[11px] opacity-50 hidden md:block">
          <LanguageToggle />
        </div>
      </header>

      <main className="w-full max-w-[1024px] border-x border-border-color grid grid-cols-1 lg:grid-cols-[1fr_340px] grid-rows-auto">
        {/* Hero Section */}
        <section className="panel panel-right-border lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2">
          <span className="panel-label">{t('panel.skillDefinition')}</span>
          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[48px] font-medium tracking-[-0.02em] leading-[1.1] mb-6"
            >
              {t('hero.titleLine1')} <br />
              <span className="text-accent">{t('hero.titleAccent')}</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-[18px] text-text-dim max-w-[480px] mt-5 leading-[1.5]">
              {t('hero.description')}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-[30px] flex gap-[15px]">
              <div className="tag">{t('hero.tags.0')}</div>
              <div className="tag">{t('hero.tags.1')}</div>
            </motion.div>
          </div>

          <TrinityDiagram t={t} />
        </section>

        {/* Architecture Details */}
        <section id="architecture" className="panel lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-3 bg-[#0D0D0F]">
          <span className="panel-label">{t('panel.trinityArchitecture')}</span>
          <h2 className="text-[18px] mb-2">{t('trinity.heading')}</h2>

          <div className="scenario-list flex flex-col gap-5 mt-8">
            {trinityItems.map((item, i) => {
              const Icon = ICONS[item.icon] || (() => null);
              return (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="scenario-card">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-accent" />
                      <h4 className="text-[14px]">{item.title}</h4>
                    </div>
                    <span className="text-[12px] text-text-dim block mt-1">{item.desc}</span>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>

        {/* Core Values Bento Grid */}
        <section id="values" className="panel panel-right-border lg:col-start-1 lg:col-end-2 lg:row-start-2 lg:row-end-3 bg-gradient-to-br from-surface to-bg">
          <span className="panel-label">{t('panel.coreValue')}</span>
          <h2 className="text-[18px] mb-2">{t('values.heading')}</h2>
          <p className="text-[12px] text-text-dim max-w-2xl mb-6"></p>

          <div className="value-grid">
            {valueItems.map((item, i) => {
              const Icon = ICONS[item.icon] || (() => null);
              return (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className={`value-item ${i === 2 ? 'col-span-1 md:col-span-2' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-text-main" />
                      <h3 className="text-[14px] text-text-main">{item.title}</h3>
                    </div>
                    <p className="text-[12px] text-text-dim leading-[1.4]">{item.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>

        {/* Standardization (OPFS) */}
        <section id="standards" className="panel panel-right-border lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4 border-b-0">
          <span className="panel-label">{t('panel.webStandardization')}</span>
          <h3 className="text-[18px] mb-2">{t('standards.heading')}</h3>
          <p className="text-[11px] text-text-dim mb-4">{t('standards.paragraph')}</p>

          <ul className="space-y-2 mb-6">
            {standardsList.map((text, i) => (
              <li key={i} className="flex items-start space-x-2">
                <ChevronRight className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span className="text-[12px] text-text-dim">{text}</span>
              </li>
            ))}
          </ul>

          <CodeBlock t={t} />
        </section>

        {/* Security */}
        <section id="security" className="panel lg:col-start-2 lg:col-end-3 lg:row-start-3 lg:row-end-4 border-b-0">
          <span className="panel-label">{t('panel.securityDefense')}</span>

          <div className="security-status mb-8">
            <div>
              <p className="text-[18px] mb-2">{t('security.intro')}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {securityItems.map((item, i) => {
              const Icon = ICONS[item.icon] || (() => null);
              return (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="scenario-card">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-accent" />
                      <h4 className="text-[14px]">{item.title}</h4>
                    </div>
                    <span className="text-[12px] text-text-dim block mt-1">{item.desc}</span>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[1024px] border border-border-color bg-bg py-6 px-10 mb-10">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Terminal className="w-4 h-4 text-text-dim" />
            <span className="font-mono font-bold text-[12px] text-text-dim">
              <span className="text-accent">{t('footer.author')}</span>
            </span>
          </div>
          <p className="text-text-dim text-[11px] font-mono">
            <span className="text-accent">{t('footer.company')}</span>, {t('footer.date')}.{' '}
            <a href="https://github.com/kevinmoch/web-skill" target="_blank" className="text-accent">
              {t('footer.github')}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
