import React, { useState } from 'react';
import { useAgileData } from '../context/AgileDataContext';
import { translations } from '../utils/translations';
import { Sparkles, Zap, Activity, ShieldCheck, Globe, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginScreen: React.FC = () => {
  const { lang, setLang, isLoggedIn, setIsLoggedIn } = useAgileData();
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
    }, 500);
  };

  return (
    <div className="min-h-screen flex text-slate-850 dark:text-slate-100 bg-linear-to-b from-[#F8FAFC] to-slate-100 dark:from-[#0B0E14] dark:to-[#111823] border-slate-200" id="login-layout">
      {/* 1. Brand Conceptual Schematic - Left Side (2/3 width) - Desktop Exclusive */}
      <div className="hidden lg:flex lg:w-2/3 bg-slate-50 dark:bg-black p-12 flex-col justify-between relative overflow-hidden border-r border-slate-200 dark:border-[#1E293B]" id="brand-visuals">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-indigo-600/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full" />

        {/* High-quality vector grids overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#0000000a_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Brand Header */}
        <div className="z-10 flex items-center space-x-3 select-none">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/10">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-md font-bold text-slate-900 dark:text-white tracking-wide font-display">Agile Studio</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest font-mono">{t.webSkillDemo}</p>
          </div>
        </div>

        {/* Interactive Schematic Board */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="my-auto mx-auto z-10 max-w-2xl w-full" id="interactive-schematic">
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center px-3 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900 rounded-full font-mono uppercase tracking-wider">
                <Zap className="w-3 h-3 mr-1.5 text-indigo-600 dark:text-indigo-450 animate-pulse" />
                Active Sandbox Ready
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-normal font-display">{t.login.brandTitle}</h2>
              {t.login.brandDesc && <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">{t.login.brandDesc}</p>}
            </div>

            {/* Simulated Live Workplace Widget mockup */}
            <div className="bg-white/90 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xl dark:shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold font-mono uppercase tracking-wide">agile-studio-session-02 // Local Stream</span>
                </div>
                <div className="text-[11px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900 px-2 py-0.5 rounded-md font-bold font-mono flex items-center">
                  <Activity className="w-3 h-3 mr-1.5 animate-pulse" />
                  Live Sync
                </div>
              </div>

              {/* Grid content inside screen */}
              <div className="grid grid-cols-3 gap-3">
                {/* Visual Sprint Velocity card */}
                <div className="bg-slate-50 dark:bg-slate-950/65 p-3 rounded-xl border border-slate-200 dark:border-slate-900">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold font-mono tracking-wider block">Iteration 2 Progress</span>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-lg font-bold text-slate-950 dark:text-white font-mono tracking-tight">72%</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold font-mono mb-1">▲ Active</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-lg mt-2 overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-lg w-[72%]" />
                  </div>
                </div>

                {/* Open Bug severity Card */}
                <div className="bg-slate-50 dark:bg-slate-950/65 p-3 rounded-xl border border-slate-200 dark:border-slate-900">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold font-mono tracking-wider block">Unresolved Defects</span>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-lg font-bold text-rose-600 dark:text-rose-500 font-mono tracking-tight">
                      3 <span className="text-slate-500 text-[10px]">Open</span>
                    </span>
                    <span className="text-[9px] text-rose-500 dark:text-rose-400/80 font-bold font-mono mb-1">▲ Critical</span>
                  </div>
                  <div className="flex space-x-0.5 mt-2.5 items-center">
                    <span className="w-3 h-1 bg-rose-500 rounded-sm" />
                    <span className="w-3 h-1 bg-amber-500 rounded-sm" />
                    <span className="w-3 h-1 bg-emerald-500 rounded-sm" />
                    <span className="text-[8px] text-slate-500 font-bold ml-1">Metrics updated</span>
                  </div>
                </div>

                {/* Deployment Frequency card */}
                <div className="bg-slate-50 dark:bg-slate-950/65 p-3 rounded-xl border border-slate-200 dark:border-slate-900">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold font-mono tracking-wider block">Delivery Freq</span>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-lg font-bold text-slate-950 dark:text-white font-mono tracking-tight">14.5/wk</span>
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 font-mono mb-1">▲ Target 12</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-lg mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-lg w-[85%]" />
                  </div>
                </div>
              </div>

              {/* Code snippet rendering UI DSL schema */}
              <div className="bg-slate-50 dark:bg-black/40 p-3 rounded-xl border border-slate-150 dark:border-slate-900 text-[10px] font-mono text-indigo-700 dark:text-indigo-300 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-bold block mb-1 uppercase tracking-widest text-[8px]">// Interactive Rendering Generation Stream</span>
                <p>
                  <span className="text-amber-600 dark:text-amber-500">const</span> renderSchema = &#123;
                </p>
                <p className="pl-3">
                  type: <span className="text-emerald-600 dark:text-emerald-450">"metrics_scorecard"</span>,
                </p>
                <p className="pl-3">
                  title: <span className="text-emerald-600 dark:text-emerald-450">"DevOps Indicators"</span>,
                </p>
                <p className="pl-3">data: &#123; kpis: [ leadTime, deployFreq ] &#125;</p>
                <p>&#125;;</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer info labels */}
        <div className="z-10 flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs text-[10px] uppercase font-bold tracking-widest font-mono select-none">
          <span className="flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
            <span>Client SSL Guaranteed</span>
          </span>
          <span>© 2026 Developer Edition</span>
        </div>
      </div>

      {/* 2. Login dialog form Container - Right Side */}
      <div className="w-full lg:w-1/3 flex flex-col justify-between p-8 dark:bg-[#0F172A] bg-white border-l border-slate-200 dark:border-slate-800" id="login-dialog-panel">
        {/* Language selector toggle button near top-right */}
        <div className="flex justify-end select-none">
          <button
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="flex items-center space-x-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition font-semibold cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 animate-spin-slow" />
            <span>{t.nav.langSwitch}</span>
          </button>
        </div>

        {/* Core Login form Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
          className="my-auto max-w-sm w-full mx-auto space-y-6"
          id="login-gate"
        >
          {/* Logo on small screens only */}
          <div className="lg:hidden flex items-center space-x-2.5 mb-2 select-none">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono">Agile Studio</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">{t.login.heading}</h3>
            <p className="text-xs text-slate-400 font-medium">{t.login.subheading}</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Username Input with pre-filled state */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase font-mono tracking-wide">{t.login.username}</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-slate-400 select-none" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full text-xs bg-slate-50 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-indigo-200 focus:outline-none focus:border-indigo-500 font-mono select-all cursor-not-allowed font-medium"
                />
              </div>
            </div>

            {/* Password input with pre-filled state */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase font-mono tracking-wide">{t.login.password}</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-slate-400 select-none" />
                <input type="password" value={password} disabled className="w-full text-xs bg-slate-50 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-400 cursor-not-allowed font-mono" />
              </div>
            </div>

            {/* Sign in button trigger */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-xs py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-550/10 transition duration-200 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
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
        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center space-x-1 font-bold">
          <span>Environment Secure</span>
          <span>•</span>
          <span className="text-slate-500 dark:text-slate-300">Sandbox Persisted</span>
        </div>
      </div>
    </div>
  );
};
