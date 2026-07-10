import React, { useState } from 'react';
import { useAgileData } from '../context/AgileDataContext';
import { translations } from '../utils/translations';
import { Screen } from '../types';
import {
  Sparkles,
  LayoutDashboard,
  Layers,
  Workflow,
  Bug,
  GraduationCap,
  Activity,
  LogOut,
  Sun,
  Moon,
  Globe,
  RefreshCw,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    theme,
    setTheme,
    lang,
    setLang,
    setIsLoggedIn,
    requirements,
    bugs,
    projects,
    currentProjectId,
    setCurrentProjectId,
    sprints,
    testSuites,
    resetAllData,
  } = useAgileData();

  const t = translations[lang];
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

  const menuItems = [
    { id: 'overview' as Screen, label: t.nav.overview, icon: LayoutDashboard },
    { id: 'requirements' as Screen, label: t.nav.requirements, icon: Layers, count: requirements.length },
    { id: 'sprints' as Screen, label: t.nav.sprints, icon: Workflow, count: sprints.length },
    { id: 'bugs' as Screen, label: t.nav.bugs, icon: Bug, count: bugs.length },
    { id: 'tests' as Screen, label: t.nav.tests, icon: GraduationCap, count: testSuites.length },
    { id: 'metrics' as Screen, label: t.nav.metrics, icon: Activity },
  ];

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const activeProject = projects.find((p) => p.id === currentProjectId) || projects[0];

  return (
    <div
      className="w-64 h-full flex flex-col justify-between bg-white dark:bg-[#0F172A] text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-[#1E293B] select-none"
      id="sidebar-layout"
    >
      {/* Upper part */}
      <div className="space-y-6">
        {/* Header Branding */}
        <div className="p-5 border-b border-slate-200 dark:border-[#1E293B]/70 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/10">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide font-display">Agile Studio</h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase">{t.webSkillDemo}</p>
            </div>
          </div>
          <button
            onClick={resetAllData}
            title={t.nav.resetData}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Project Context selector */}
        <div className="px-3 relative" id="project-selector">
          <div className="bg-[#F8FAFC] dark:bg-[#1E293B]/40 rounded-xl p-2.5 border border-slate-200 dark:border-[#1E293B]/60 space-y-1.5 shadow-xs">
            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 font-mono uppercase tracking-widest block">
              {lang === 'zh' ? '当前协同项目' : 'ACTIVE PROJECT'}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                className="w-full text-left text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-indigo-550 transition cursor-pointer font-sans flex items-center relative shadow-xs select-none min-h-[38px]"
              >
                <span className="truncate block font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'zh' ? activeProject.name : activeProject.name_en}
                </span>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 dark:text-slate-500">▼</span>
              </button>

              {projectDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProjectDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-1 space-y-0.5 select-none animate-fadeIn">
                    {projects.map((proj) => {
                      const isSelected = proj.id === currentProjectId;
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={() => {
                            setCurrentProjectId(proj.id);
                            setProjectDropdownOpen(false);
                          }}
                          className={`w-full text-left text-xs px-2.5 py-2.5 rounded-lg font-bold transition flex items-center cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-indigo-950/20'
                          }`}
                        >
                          <span className="truncate">{lang === 'zh' ? proj.name : proj.name_en}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold font-mono">
              <span>KEY: {activeProject.key}</span>
              <span className="flex items-center">
                <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full inline-block mr-1 select-none animate-pulse" />
                <span>{lang === 'zh' ? activeProject.status : activeProject.status_en || activeProject.status}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Menu links */}
        <div className="px-2.5 space-y-1" id="sidebar-navigation">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id)}
                className={`w-full text-sm font-semibold px-3 py-2.5 rounded-lg transition duration-150 flex items-center justify-between group cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <IconComponent
                    className={`w-4 h-4 transition ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500'}`}
                  />
                  <span className="truncate max-w-[140px] font-medium">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-xs font-bold px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-indigo-500 text-white border border-indigo-400/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Low part */}
      <div className="p-3 border-t border-slate-200 dark:border-[#1E293B]/70 space-y-3 bg-[#F8FAFC]/55 dark:bg-[#1E293B]/10">
        {/* Toggle Utilities (Theme and Language) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Theme Button (Toggle theme) */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="flex items-center justify-center space-x-1.5 py-2 text-[11px] font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#111827] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </>
            )}
          </button>

          {/* Language Switch */}
          <button
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="flex items-center justify-center space-x-1.5 py-2 text-[11px] font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#111827] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{t.nav.langSwitch}</span>
          </button>
        </div>

        {/* Signed User Card with Logout trigger */}
        <div className="p-2.5 bg-white dark:bg-[#1A2333]/45 rounded-xl border border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center space-x-1 truncate max-w-[170px]">
            <div className="text-left font-mono truncate">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate leading-none">test</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate mt-0.5">test@abc.com</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 transition cursor-pointer"
            title={t.nav.logout}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
