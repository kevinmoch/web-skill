import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Console, createFsConsoleBackend, createFsTraceSource, createGovernanceFacade } from '@webskill/console';
import type { ConsoleAppearanceChange } from '@webskill/console';
import { isLlmEntryUsable, sandboxExecutorDeps } from '@webskill/chatbot';
import type { ChatEngine } from '@webskill/chatbot';
import { FsTrustedKeyStore, WebSkillRuntime } from '@webskill/sdk';
import { BrowserSkillManager, BrowserWorkerScriptExecutor, createLlmClient } from '@webskill/sdk/browser';
import '@webskill/console/console.css';
import { useWebSkillRuntime } from '../webskill/useRuntime';
import { MANAGED_ROOT, SKILL_ROOTS } from '../webskill/runtime';
import { fetchAgileData } from '../webskill/dataSources';
import { getAgileHostCapabilities } from '../webskill/adapter';
import { getAgileMcpHost } from '../webskill/mcpHost';
import { createAgileConnectFacade } from '../webskill/connectFacade';
import { useAgileData } from '../context/AgileDataContext';
import type { ScreenParams } from '../types';

const CHAT_ROOT = '/chat';

const ScreenError: React.FC<{ error: Error }> = ({ error }) => (
  <div className="h-full min-h-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
    <p className="text-sm font-semibold text-destructive">Skill center failed to start</p>
    <p className="text-xs text-muted-foreground break-all">{error.message}</p>
  </div>
);

const ScreenSkeleton: React.FC = () => (
  <div className="h-full min-h-0 flex flex-col gap-3 p-6">
    <div className="h-5 w-40 animate-pulse rounded bg-muted" />
    <div className="h-4 w-64 animate-pulse rounded bg-muted" />
    <div className="h-full w-full animate-pulse rounded bg-muted" />
  </div>
);

export const SkillCenterScreen: React.FC<{
  engine?: ChatEngine;
  screenParams?: ScreenParams;
}> = ({ engine, screenParams }) => {
  const { runtime, error } = useWebSkillRuntime();
  const { updateAppearance, setCurrentScreen } = useAgileData();

  // console 的恢复/提炼端口直接调引擎；引擎在 chatbot 挂载后才有，用 ref 读最新值
  const engineRef = useRef<ChatEngine | undefined>(engine);
  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  // 未签名技能策略来自运行配置（console Trust 页可改）：改完要重建 manager 才生效
  const [unsignedPolicy, setUnsignedPolicy] = useState<'allow' | 'warn' | 'deny' | undefined>(undefined);
  useEffect(() => {
    if (!runtime) return;
    let alive = true;
    const readPolicy = () =>
      runtime.runtimeConfig.load().then((cfg) => {
        if (alive) setUnsignedPolicy(cfg.security.unsignedSkills);
      });
    void readPolicy();
    const unsubscribe = runtime.runtimeConfig.subscribe?.(() => void readPolicy());
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [runtime]);

  const trustedKeys = useMemo(
    () => (runtime ? new FsTrustedKeyStore(runtime.storage, `${MANAGED_ROOT}/.webskill/trusted-keys.json`) : undefined),
    [runtime]
  );

  const manager = useMemo(() => {
    if (!runtime || !trustedKeys || unsignedPolicy === undefined) return undefined;
    return new BrowserSkillManager({
      fs: runtime.storage,
      managedRoot: MANAGED_ROOT,
      // builtin 是只读根；告诉管理器后导出/校验才能识别它们
      skillRoots: [SKILL_ROOTS[0]],
      signature: { trustedKeys, unsigned: unsignedPolicy },
      // 安装/卸载/晋升后引擎的技能目录缓存必须作废，否则对话侧看不到变化
      onChanged: () => void engineRef.current?.reloadConfig()
    });
  }, [runtime, trustedKeys, unsignedPolicy]);

  // 恢复的唯一实现在 ChatEngine：console 只发起（快照恢复入口）
  const resumeRun = useCallback(async (runId: string): Promise<void> => {
    const current = engineRef.current;
    if (!current) throw new Error('Chat surface has not been mounted yet; open the chat panel once first.');
    await current.resume(runId);
  }, []);

  /** 画像「立即提炼」要调模型，实现只在 ChatEngine 上 */
  const refineUserProfile = useCallback(async () => {
    const current = engineRef.current;
    if (!current) throw new Error('Chat surface has not been mounted yet; open the chat panel once first.');
    return current.refineUserProfile();
  }, []);

  const backend = useMemo(
    () =>
      runtime && manager && trustedKeys
        ? createFsConsoleBackend({
            fs: runtime.storage,
            roots: [...SKILL_ROOTS],
            traces: createFsTraceSource(runtime.storage, CHAT_ROOT),
            manager,
            estimate: () => navigator.storage.estimate().then((e) => ({ usage: e.usage ?? 0, quota: e.quota ?? 0 })),
            versionStoreRoot: MANAGED_ROOT,
            chatRoot: CHAT_ROOT,
            trustedKeys,
            resumeRun,
            refineUserProfile
          })
        : undefined,
    [runtime, manager, trustedKeys, resumeRun, refineUserProfile]
  );

  /**
   * 治理侧（评估 / 候选生成）用的 LLM 与评测运行时：跟随配置存储里的当前模型，
   * 配置一改就重建（subscribe 驱动）。没配模型时治理面显示接线说明页。
   */
  const [governanceParts, setGovernanceParts] = useState<
    { llm: ReturnType<typeof createLlmClient>; evaluationRuntime: WebSkillRuntime } | undefined
  >(undefined);
  useEffect(() => {
    if (!runtime) return;
    let alive = true;
    const assemble = () =>
      runtime.runtimeConfig.load().then((rc) => {
        if (!alive) return;
        const active = rc.llm.entries.find((e) => e.id === rc.llm.defaultId) ?? rc.llm.entries[0];
        if (!active || !isLlmEntryUsable(active)) {
          setGovernanceParts(undefined);
          return;
        }
        const llm = createLlmClient(active);
        const evaluationRuntime = new WebSkillRuntime({
          fs: runtime.storage,
          roots: [...SKILL_ROOTS],
          llm,
          // 评测运行时也按同一批数据源取数，否则脚本里的 fetchData 在评测下不存在
          fetchData: fetchAgileData,
          // 与主链路同一条装配路径：评估里的技能也受沙箱与网络策略约束
          executor: new BrowserWorkerScriptExecutor(sandboxExecutorDeps(runtime.storage, rc))
        });
        setGovernanceParts({ llm, evaluationRuntime });
      });
    void assemble();
    const unsubscribe = runtime.runtimeConfig.subscribe?.(() => void assemble());
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [runtime]);

  const governance = useMemo(
    () =>
      runtime && manager
        ? createGovernanceFacade({
            fs: runtime.storage,
            manager,
            governanceRoot: MANAGED_ROOT,
            chatRoot: CHAT_ROOT,
            ...(governanceParts
              ? { llm: governanceParts.llm, evaluationRuntime: governanceParts.evaluationRuntime }
              : {})
          })
        : undefined,
    [runtime, manager, governanceParts]
  );

  // 连接门面：与 chatbot 共用同一份 MCP 注册表（经能力单例拿到感知策略实例）
  const connect = useMemo(() => {
    if (!runtime) return undefined;
    const caps = getAgileHostCapabilities(runtime, {
      navigate: {
        toConsole: () => setCurrentScreen('webskill-manager'),
        toTrace: (runId) => setCurrentScreen('webskill-manager', { runId }),
        toCandidate: (candidateId) => setCurrentScreen('webskill-manager', { candidateId }),
        toSettings: (section) => setCurrentScreen('webskill-manager', { settings: section })
      }
    });
    return createAgileConnectFacade(getAgileMcpHost(), {
      pagePerception: caps.pagePerception,
      pageActionConsent: caps.pageActionConsent
    });
  }, [runtime, setCurrentScreen]);

  // 外观变更：唯一真值源是配置存储；context 双写（业务页 + 持久化一站完成）
  const onAppearanceChange = useCallback((next: ConsoleAppearanceChange) => updateAppearance(next), [updateAppearance]);

  if (error) return <ScreenError error={error} />;
  if (!backend || !governance) return <ScreenSkeleton />;

  // 直达页：run 定位 > 候选定位 > 设置分区 > 总览
  const initialPage =
    screenParams?.runId !== undefined
      ? ('runs.inspector' as const)
      : screenParams?.candidateId !== undefined
        ? ('governance.review' as const)
        : (screenParams?.settings ?? ('overview' as const));

  return (
    // h-full min-h-0 必须给穿到 Console 根：少一层内部表格就没有独立滚动容器
    <div id="webskill-manager" className="h-full min-h-0">
      <Console
        key={screenParams?.runId ?? screenParams?.candidateId ?? screenParams?.settings ?? 'console'}
        backend={backend}
        governance={governance}
        connect={connect}
        runtimeConfig={runtime!.runtimeConfig}
        initialPage={initialPage}
        {...(screenParams?.runId !== undefined ? { focusRunId: screenParams.runId } : {})}
        {...(screenParams?.candidateId !== undefined ? { focusCandidateId: screenParams.candidateId } : {})}
        onAppearanceChange={onAppearanceChange}
      />
    </div>
  );
};
