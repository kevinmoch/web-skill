import React, { useState, useRef, useEffect } from 'react';
import { AgileDataProvider, useAgileData } from './context/AgileDataContext';
import { Sidebar } from './components/Sidebar';
import { AIChatPanel } from './components/AIChatPanel';
import { LoginScreen } from './components/LoginScreen';
import { Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { OverviewScreen, RequirementsScreen, SprintsScreen, BugsScreen, TestsScreen, MetricsScreen } from './components/Screens';
import WebSkillManager from './components/WebSkillManager';

function DashboardContent() {
  const { isLoggedIn, currentScreen, lang } = useAgileData();

  // Width in pixels of the AI Chat panel. Persistent inside localStorage!
  const [chatWidth, setChatWidth] = useState<number>(() => {
    const saved = localStorage.getItem('agile_chat_width');
    return saved ? parseInt(saved, 10) : 384; // Default to 384px (w-96)
  });

  const chatWidthRef = useRef(chatWidth);
  const isResizing = useRef<boolean>(false);

  // Sync ref with state
  React.useEffect(() => {
    chatWidthRef.current = chatWidth;
  }, [chatWidth]);

  const handleResize = React.useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= 280 && newWidth <= 800) {
      setChatWidth(newWidth);
    }
  }, []);

  const stopResize = React.useCallback(() => {
    if (isResizing.current) {
      isResizing.current = false;
      localStorage.setItem('agile_chat_width', String(chatWidthRef.current));
      document.body.style.cursor = 'default';
    }
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  }, [handleResize]);

  const startResize = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      document.body.style.cursor = 'col-resize';
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
    },
    [handleResize, stopResize],
  );

  // Cleanup mouse listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };
  }, [handleResize, stopResize]);

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  // Render the current active screen
  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'overview':
        return <OverviewScreen />;
      case 'requirements':
        return <RequirementsScreen />;
      case 'sprints':
        return <SprintsScreen />;
      case 'bugs':
        return <BugsScreen />;
      case 'tests':
        return <TestsScreen />;
      case 'metrics':
        return <MetricsScreen />;
      case 'webskill-manager':
        return <WebSkillManager />;
      default:
        return <OverviewScreen />;
    }
  };

  return (
    <div
      className="flex h-screen overflow-hidden text-slate-800 dark:text-slate-100 bg-[#FAFAFC] dark:bg-[#0B0E14] flex-col md:flex-row"
      id="app-workspace"
    >
      {/* 1. Sidebar Panel Column */}
      <Sidebar />

      {/* 2. Middle Main Screen Workspace Section */}
      <div className="flex-1 flex flex-col min-w-0 relative" id="main-content-wrapper">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#111827] px-6 select-none md:hidden">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold font-display text-slate-800 dark:text-slate-100 uppercase tracking-widest leading-none">
              Agile Studio
            </span>
          </div>
        </header>

        {/* Scrollable primary content box */}
        <main className="flex-1 overflow-y-auto px-6 py-6 p-4 md:p-8 bg-[#FAFAFC] dark:bg-[#0F172A]/50 relative">
          <div className="w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScreen}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                {renderActiveScreen()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Resizer Handle Bar */}
      <div
        className="hidden md:flex w-1 bg-slate-200/80 dark:bg-slate-800/80 cursor-col-resize items-center justify-center select-none h-full flex-shrink-0 z-50 animate-fadeIn"
        onMouseDown={startResize}
        title={lang === 'zh' ? '向左拖拽以扩展宽度' : 'Drag left to resize chat panel'}
      />

      {/* 3. Right AI Chat Console Drawer */}
      <div
        className="w-full h-96 md:h-full border-t md:border-t-0 md:border-l border-slate-200 dark:border-[#1E293B]/70 flex-shrink-0"
        style={{ width: window.innerWidth > 768 ? `${chatWidth}px` : '100%' }}
      >
        <AIChatPanel />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AgileDataProvider>
      <DashboardContent />
    </AgileDataProvider>
  );
}
