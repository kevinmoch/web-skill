import React, { useState } from 'react';
import { useAgileData } from '../context/AgileDataContext';
import { translations } from '../utils/translations';
import { Sparkles, Zap, Activity, ShieldCheck, Globe, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginScreen: React.FC = () => {
  const { lang, setLang, setIsLoggedIn } = useAgileData();
  const t = translations[lang];

  // Pre-filled login states
  const [email] = useState('test@abc.com');
  const [password] = useState('••••••••');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setIsLoggedIn(true);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex text-foreground bg-background font-sans" id="login-layout">
      {/* 1. Brand Conceptual Schematic - Left Side (2/3 width) - Desktop Exclusive */}
      <div className="hidden lg:flex lg:w-2/3 bg-secondary/30 p-12 flex-col justify-between relative overflow-hidden border-r border-border" id="brand-visuals">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

        {/* Brand Header */}
        <div className="z-10 flex items-center space-x-3 select-none">
          <div className="w-9 h-9 rounded-xl webskill-brand-mark flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground tracking-tight">Agile Studio</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider font-mono">{t.webSkillDemo}</p>
          </div>
        </div>

        {/* Interactive Schematic Board */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="my-auto mx-auto z-10 max-w-2xl w-full" id="interactive-schematic">
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-foreground bg-accent border border-border rounded-full font-mono uppercase tracking-wider">
                <Zap className="w-3 h-3 mr-1.5 text-warning animate-pulse" />
                Active Sandbox Ready
              </span>
              <h2 className="text-2xl font-bold text-foreground tracking-tight leading-tight">{t.login.brandTitle}</h2>
              {t.login.brandDesc && <p className="text-xs text-muted-foreground leading-relaxed">{t.login.brandDesc}</p>}
            </div>

            {/* Live Workplace Widget mockup */}
            <div className="webskill-surface space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                    <span className="w-2.5 h-2.5 rounded-full bg-warning" />
                    <span className="w-2.5 h-2.5 rounded-full bg-success" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium font-mono uppercase tracking-wide">agile-studio-session-02 // Local Stream</span>
                </div>
                <div className="text-xs bg-success-soft text-success border border-success/20 px-2 py-0.5 rounded-md font-medium font-mono flex items-center">
                  <Activity className="w-3 h-3 mr-1.5 animate-pulse" />
                  Live Sync
                </div>
              </div>

              {/* Grid content inside screen */}
              <div className="grid grid-cols-3 gap-3">
                {/* Visual Sprint Velocity card */}
                <div className="bg-secondary/40 p-3 rounded-lg border border-border">
                  <span className="text-xs text-muted-foreground font-medium font-mono tracking-wider block">Iteration 2 Progress</span>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-base font-bold text-foreground font-mono tracking-tight">72%</span>
                    <span className="text-xs text-success font-semibold font-mono mb-0.5">▲ Active</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-[72%]" />
                  </div>
                </div>

                {/* Open Bug severity Card */}
                <div className="bg-secondary/40 p-3 rounded-lg border border-border">
                  <span className="text-xs text-muted-foreground font-medium font-mono tracking-wider block">Unresolved Defects</span>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-base font-bold text-destructive font-mono tracking-tight">
                      3 <span className="text-muted-foreground text-xs font-normal">Open</span>
                    </span>
                    <span className="text-xs text-destructive font-semibold font-mono mb-0.5">▲ Critical</span>
                  </div>
                  <div className="flex space-x-1 mt-2.5 items-center">
                    <span className="w-3 h-1 bg-destructive rounded-sm" />
                    <span className="w-3 h-1 bg-warning rounded-sm" />
                    <span className="w-3 h-1 bg-success rounded-sm" />
                    <span className="text-xs text-muted-foreground ml-1">Updated</span>
                  </div>
                </div>

                {/* Deployment Frequency card */}
                <div className="bg-secondary/40 p-3 rounded-lg border border-border">
                  <span className="text-xs text-muted-foreground font-medium font-mono tracking-wider block">Delivery Freq</span>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-base font-bold text-foreground font-mono tracking-tight">14.5/wk</span>
                    <span className="text-xs font-semibold text-foreground font-mono mb-0.5">▲ Target 12</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-success rounded-full w-[85%]" />
                  </div>
                </div>
              </div>

              {/* Code snippet rendering UI DSL schema */}
              <div className="bg-background p-3 rounded-lg border border-border text-xs font-mono text-foreground space-y-1">
                <span className="text-muted-foreground font-semibold block mb-1 uppercase tracking-wider text-xs">// Interactive Rendering Generation Stream</span>
                <p>
                  <span className="text-muted-foreground">const</span> renderSchema = &#123;
                </p>
                <p className="pl-3">
                  type: <span className="text-foreground">"metrics_scorecard"</span>,
                </p>
                <p className="pl-3">
                  title: <span className="text-foreground">"DevOps Indicators"</span>,
                </p>
                <p className="pl-3">data: &#123; kpis: [ leadTime, deployFreq ] &#125;</p>
                <p>&#125;;</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer info labels */}
        <div className="z-10 flex items-center justify-between text-muted-foreground text-xs uppercase font-medium tracking-wider font-mono select-none">
          <span className="flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-foreground" />
            <span>Client SSL Guaranteed</span>
          </span>
          <span>© 2026 Developer Edition</span>
        </div>
      </div>

      {/* 2. Login dialog form Container - Right Side */}
      <div className="w-full lg:w-1/3 flex flex-col justify-between p-8 bg-card border-l border-border text-card-foreground" id="login-dialog-panel">
        {/* Language selector toggle button near top-right */}
        <div className="flex justify-end select-none">
          <button
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="flex items-center space-x-1.5 text-xs bg-secondary hover:bg-accent text-secondary-foreground px-3 py-1.5 rounded-lg border border-border transition font-medium cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{t.nav.langSwitch}</span>
          </button>
        </div>

        {/* Core Login form Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="my-auto max-w-sm w-full mx-auto space-y-6"
          id="login-gate"
        >
          {/* Logo on small screens only */}
          <div className="lg:hidden flex items-center space-x-2.5 mb-2 select-none">
            <div className="w-8 h-8 rounded-lg webskill-brand-mark flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-foreground font-mono">Agile Studio</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground tracking-tight">{t.login.heading}</h3>
            <p className="text-xs text-muted-foreground">{t.login.subheading}</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Username Input with pre-filled state */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase font-mono tracking-wider">{t.login.username}</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-muted-foreground select-none" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full text-xs bg-secondary/50 pl-9 pr-3 py-2 rounded-lg border border-input text-foreground font-mono select-all cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password input with pre-filled state */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase font-mono tracking-wider">{t.login.password}</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-muted-foreground select-none" />
                <input
                  type="password"
                  value={password}
                  disabled
                  className="w-full text-xs bg-secondary/50 pl-9 pr-3 py-2 rounded-lg border border-input text-muted-foreground cursor-not-allowed font-mono"
                />
              </div>
            </div>

            {/* Sign in button trigger */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-xs py-2.5 rounded-lg flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin inline-block" />
              ) : (
                <>
                  <span>{t.login.submit}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer info bar */}
        <div className="text-center text-xs text-muted-foreground flex items-center justify-center space-x-1 font-medium font-mono">
          <span>Environment Secure</span>
          <span>•</span>
          <span className="text-foreground">Sandbox Persisted</span>
        </div>
      </div>
    </div>
  );
};
