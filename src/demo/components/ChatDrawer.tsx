import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Chatbot } from '@webskill/chatbot';
import type { ChatEngine, ChatbotConfig, QuickPrompt, SettingsSectionId } from '@webskill/chatbot';
import '@webskill/chatbot/chatbot.css';
import { useWebSkillRuntime } from '../webskill/useRuntime';
import { getAgileHostCapabilities, type NavigateFns } from '../webskill/adapter';
import { fetchAgileData } from '../webskill/dataSources';
import { GLOBAL_QUICK_PROMPTS, screenQuickPrompts } from '../webskill/quickPrompts';
import { listUserSkillPrompts } from '../webskill/userSkillPrompts';
import { useAgileData } from '../context/AgileDataContext';

const ChatDrawerError: React.FC<{ error: Error }> = ({ error }) => (
  <div className="h-full min-h-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
    <p className="text-sm font-semibold text-destructive">AI Copilot failed to start</p>
    <p className="text-xs text-muted-foreground break-all">{error.message}</p>
  </div>
);

const ChatDrawerSkeleton: React.FC = () => (
  <div className="h-full min-h-0 flex flex-col items-center justify-center gap-2 p-6">
    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
    <div className="h-3 w-40 animate-pulse rounded bg-muted" />
  </div>
);

export const ChatDrawer: React.FC<{ width: number; onEngine(e: ChatEngine): void }> = ({ width, onEngine }) => {
  const { runtime, error } = useWebSkillRuntime();
  const { currentScreen, setCurrentScreen } = useAgileData();

  // 宿主导航出口：跳技能中心（console）的指定分区 / run / 候选
  const navigate = useMemo<NavigateFns>(
    () => ({
      toConsole: () => setCurrentScreen('webskill-manager'),
      toTrace: (runId) => setCurrentScreen('webskill-manager', { runId }),
      toCandidate: (candidateId) => setCurrentScreen('webskill-manager', { candidateId }),
      toSettings: (section) => setCurrentScreen('webskill-manager', { settings: section })
    }),
    [setCurrentScreen]
  );

  // 稳定引用：内联对象会让引擎每次 render 重装；能力按 runtime 单例缓存
  const capabilities = useMemo(
    () => (runtime ? getAgileHostCapabilities(runtime, { navigate }) : undefined),
    [runtime, navigate]
  );

  // 晋升到 /skills/user 的技能自动变成快捷指令（沉淀闭环）。
  // 离开技能中心时重读一次：刚才的审批/晋升动作要反映在芯片区。
  const [userPrompts, setUserPrompts] = useState<QuickPrompt[]>([]);
  useEffect(() => {
    if (!runtime) return;
    let alive = true;
    void listUserSkillPrompts(runtime.storage).then((prompts) => {
      if (alive) setUserPrompts(prompts);
    });
    return () => {
      alive = false;
    };
  }, [runtime, currentScreen]);

  const config = useMemo<ChatbotConfig | undefined>(
    () =>
      runtime && {
        title: 'Agile Copilot',
        chatRoot: '/chat',
        runtimeConfig: runtime.runtimeConfig,
        skillCandidates: runtime.skillCandidates,
        // 全局条只是种子（装载时写入一次，之后归 console 管）；随屏变的那批必须走动态下发
        quickPrompts: GLOBAL_QUICK_PROMPTS,
        dynamicQuickPrompts: [...screenQuickPrompts(currentScreen), ...userPrompts],
        generativeUi: true,
        // 脚本取数通道（模块级稳定引用）
        fetchData: fetchAgileData
      },
    [runtime, currentScreen, userPrompts]
  );

  const openSettings = useCallback((section?: SettingsSectionId) => navigate.toSettings(section), [navigate]);

  // 引擎就绪：把确认卡 UI 端口回填给页面操作策略，再把引擎交给宿主（console 恢复/隐私页用）
  const handleEngineReady = useCallback(
    (e: ChatEngine) => {
      capabilities?.bindPageActionUi(e.bridge);
      onEngine(e);
    },
    [capabilities, onEngine]
  );

  if (error) return <ChatDrawerError error={error} />;
  if (!capabilities || !config) return <ChatDrawerSkeleton />;

  return (
    <aside
      id="ai-chat-panel"
      className="h-full min-h-0 flex flex-col"
      style={{ width: window.innerWidth > 768 ? width : '100%' }}
    >
      <Chatbot
        adapter={capabilities.adapter}
        config={config}
        layout="embedded"
        onOpenSettings={openSettings}
        onEngineReady={handleEngineReady}
      />
    </aside>
  );
};
