import React, { useState, useRef, useEffect } from 'react';
import { AgileDataProvider, useAgileData } from './context/AgileDataContext';
import { Sidebar } from './components/Sidebar';
import { ChatDrawer } from './components/ChatDrawer';
import { LoginScreen } from './components/LoginScreen';
import { Sparkles } from 'lucide-react';
import {
  OverviewScreen,
  RequirementsScreen,
  SprintsScreen,
  BugsScreen,
  TestsScreen,
  MetricsScreen
} from './components/Screens';
import { SkillCenterScreen } from './components/SkillCenterScreen';
import type { ChatEngine } from '@webskill/chatbot';

function DashboardContent() {
  const { isLoggedIn, currentScreen, screenParams, lang } = useAgileData();
  const [engine, setEngine] = useState<ChatEngine>();

  // 从技能中心回到业务页时，刚才可能安装/发布/删除过技能，而引擎把技能目录缓存在
  // runtime 实例里——不作废的话新技能要刷新页面才可用
  const prevScreenRef = useRef(currentScreen);
  useEffect(() => {
    const prev = prevScreenRef.current;
    prevScreenRef.current = currentScreen;
    if (prev === 'webskill-manager' && currentScreen !== 'webskill-manager') {
      void engine?.reloadConfig();
    }
  }, [currentScreen, engine]);

  // Width in pixels of the AI Chat panel. Persistent inside localStorage!
  const [chatWidth, setChatWidth] = useState<number>(() => {
    const saved = localStorage.getItem('agile_chat_width');
    return saved ? parseInt(saved, 10) : 384; // Default to 384px (w-96)
  });

  const chatWidthRef = useRef(chatWidth);
  const isResizing = useRef<boolean>(false);
  // 拖动中保持把手高亮（:hover 在鼠标移出把手后失效）
  const [isResizingBar, setIsResizingBar] = useState(false);

  // Sync ref with state
  React.useEffect(() => {
    chatWidthRef.current = chatWidth;
  }, [chatWidth]);

  const handleResize = React.useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    // 上限：浏览器窗口宽度的三分之二
    const maxWidth = Math.floor(window.innerWidth / 1.5);
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= 280 && newWidth <= maxWidth) {
      setChatWidth(newWidth);
    }
  }, []);

  const stopResize = React.useCallback(() => {
    if (isResizing.current) {
      isResizing.current = false;
      setIsResizingBar(false);
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
      setIsResizingBar(true);
      document.body.style.cursor = 'col-resize';
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
    },
    [handleResize, stopResize]
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
        return <SkillCenterScreen engine={engine} screenParams={screenParams} />;
      default:
        return <OverviewScreen />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden text-foreground bg-background font-sans" id="app-workspace">
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
        <main
          className={`flex-1 bg-background relative ${
            currentScreen === 'webskill-manager'
              ? // console 要一个视口定高的容器：自己的内部滚动区自己管，
                // 不让内容把宿主页面顶出滚动（切换屏时高度不漂移）
                'overflow-hidden p-0'
              : 'overflow-y-auto px-6 py-6 p-4 md:p-8'
          }`}
        >
          <div className={currentScreen === 'webskill-manager' ? 'h-full min-h-0' : 'w-full'}>
            {renderActiveScreen()}
          </div>
        </main>
      </div>

      {/* Resizer Handle Bar：常态 1px 细线（带阴影），悬停/拖动时浮现蓝色长条，光标 col-resize。
          视觉与 ccs-framework ChatbotDrawer 左缘把手一致：命中区透明，条带居中不改变布局。 */}
      <div
        className="group relative hidden md:flex w-1.5 cursor-col-resize select-none h-full shrink-0 z-50"
        onMouseDown={startResize}
        title={lang === 'zh' ? '向左拖拽以扩展宽度' : 'Drag left to resize chat panel'}
      >
        <div
          className={`absolute left-1/2 top-0 bottom-0 -translate-x-1/2 transition-all ${
            isResizingBar ? 'w-[3px] bg-blue-500/70' : 'w-px bg-border group-hover:w-[3px] group-hover:bg-blue-500/60'
          }`}
        />
      </div>

      {/* 3. Right AI Chat Console Drawer（宽度由内部 aside 携带；wrapper 不能再 w-full，
          否则在桌面 flex-row 里会吃掉主区宽度）。左缘双层柔影营造浮层感：近层勾出
          面板边缘，远层铺开深度；relative + z-10 保证阴影压在内容卡片之上。
          细线本体保持 1px 干净（阴影打在线条上会糊成粗线） */}
      <div className="h-96 md:h-full border-t md:border-t-0 border-border shrink-0 relative z-10 md:shadow-[-8px_0_16px_-10px_rgba(15,23,42,0.14),-24px_0_48px_-20px_rgba(15,23,42,0.20)]">
        <ChatDrawer width={chatWidth} onEngine={setEngine} />
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
