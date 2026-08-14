import React, { useState, useRef, useEffect } from 'react';
import { AgileDataProvider, useAgileData } from './context/AgileDataContext';
import { Sidebar } from './components/Sidebar';
import { AIChatPanel } from './components/AIChatPanel';
import { LoginScreen } from './components/LoginScreen';
import { Sparkles } from 'lucide-react';
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
      className="flex h-screen overflow-hidden text-foreground bg-background flex-col md:flex-row font-sans"
      id="app-workspace"
    >
      {/* 1. Sidebar Panel Column */}
      <Sidebar />

      {/* 2. Middle Main Screen Workspace Section */}
      <div className="flex-1 flex flex-col min-w-0 relative" id="main-content-wrapper">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6 select-none md:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg webskill-brand-mark flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-foreground uppercase tracking-widest leading-none">
              Agile Studio
            </span>
          </div>
        </header>

        {/* Scrollable primary content box */}
        <main className="flex-1 overflow-y-auto px-6 py-6 p-4 md:p-8 bg-background relative">
          <div className="w-full">
            {renderActiveScreen()}
          </div>
        </main>
      </div>

      {/* Resizer Handle Bar */}
      <div
        className="hidden md:flex w-1 bg-border hover:bg-muted-foreground/40 cursor-col-resize items-center justify-center select-none h-full shrink-0 z-50 transition-colors"
        onMouseDown={startResize}
        title={lang === 'zh' ? '向左拖拽以扩展宽度' : 'Drag left to resize chat panel'}
      />

      {/* 3. Right AI Chat Console Drawer */}
      <div
        className="w-full h-96 md:h-full border-t md:border-t-0 md:border-l border-border shrink-0"
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
