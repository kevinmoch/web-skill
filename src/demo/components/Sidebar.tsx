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
      className="w-64 h-full flex flex-col justify-between bg-sidebar text-sidebar-foreground border-r border-sidebar-border select-none"
      id="sidebar-layout"
    >
      {/* Upper part */}
      <div className="space-y-5">
        {/* Header Branding */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl webskill-brand-mark flex items-center justify-center shadow-xs">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">Agile Studio</h1>
              <p className="text-xs text-muted-foreground font-medium tracking-wider uppercase font-mono">{t.webSkillDemo}</p>
            </div>
          </div>
          <button
            onClick={resetAllData}
            title={t.nav.resetData}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Project Context selector */}
        <div className="px-3 relative" id="project-selector">
          <div className="bg-sidebar-accent/50 rounded-xl p-3 border border-sidebar-border space-y-2 shadow-xs">
            <label className="text-xs font-semibold text-muted-foreground font-mono uppercase tracking-wider block">
              {lang === 'zh' ? '当前协同项目' : 'ACTIVE PROJECT'}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                className="w-full text-left text-sm bg-card text-card-foreground border border-input rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-ring transition cursor-pointer font-sans flex items-center relative shadow-xs select-none min-h-[38px]"
              >
                <span className="truncate block font-medium text-foreground">
                  {lang === 'zh' ? activeProject.name : activeProject.name_en}
                </span>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">▼</span>
              </button>

              {projectDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProjectDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1 bg-popover text-popover-foreground border border-border rounded-xl shadow-pop z-50 max-h-60 overflow-y-auto p-1 space-y-0.5 select-none animate-fadeIn">
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
                          className={`w-full text-left text-sm px-3 py-2 rounded-lg font-medium transition flex items-center cursor-pointer ${
                            isSelected
                              ? 'bg-accent text-accent-foreground font-semibold'
                              : 'text-popover-foreground hover:bg-accent/60'
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
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium font-mono">
              <span>KEY: {activeProject.key}</span>
              <span className="flex items-center">
                <span className="w-1.5 h-1.5 bg-success rounded-full inline-block mr-1 select-none animate-pulse" />
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
                className={`w-full text-sm font-medium px-3.5 py-2.5 rounded-lg transition duration-150 flex items-center justify-between group cursor-pointer ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-semibold'
                    : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <IconComponent
                    className={`w-4.5 h-4.5 transition ${isActive ? 'text-sidebar-primary-foreground' : 'text-muted-foreground group-hover:text-sidebar-foreground'}`}
                  />
                  <span className="truncate max-w-[140px] font-medium">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground'
                        : 'bg-sidebar-accent text-sidebar-foreground/75'
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
      <div className="p-3 border-t border-sidebar-border space-y-2.5 bg-sidebar">
        {/* Toggle Utilities (Theme and Language) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Theme Button (Toggle theme) */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="flex items-center justify-center space-x-1.5 py-2 text-xs font-medium rounded-lg border border-sidebar-border bg-card hover:bg-sidebar-accent text-card-foreground transition cursor-pointer"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-muted-foreground" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-muted-foreground" />
                <span>Light</span>
              </>
            )}
          </button>

          {/* Language Switch */}
          <button
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="flex items-center justify-center space-x-1.5 py-2 text-xs font-medium rounded-lg border border-sidebar-border bg-card hover:bg-sidebar-accent text-card-foreground transition cursor-pointer"
          >
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span>{t.nav.langSwitch}</span>
          </button>
        </div>

        {/* Signed User Card with Logout trigger */}
        <div className="p-2.5 bg-card text-card-foreground rounded-xl border border-sidebar-border flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-1 truncate max-w-[170px]">
            <div className="text-left font-mono truncate">
              <span className="text-sm font-semibold text-card-foreground block truncate leading-none">test</span>
              <span className="text-xs text-muted-foreground block truncate mt-1">test@abc.com</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-destructive-soft text-muted-foreground hover:text-destructive transition cursor-pointer"
            title={t.nav.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
