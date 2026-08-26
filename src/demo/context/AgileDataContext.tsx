import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Requirement,
  Sprint,
  Bug,
  TestSuite,
  Metrics,
  Project,
  initialRequirements,
  initialSprints,
  initialBugs,
  initialTestSuites,
  initialMetrics,
  initialProjects,
} from '../mock/staticData';
import { Screen, ScreenParams } from '../types';
import type { RuntimeAppearanceConfig } from '@webskill/chatbot';
import { getWebSkillRuntime, RUNTIME_CONFIG_STORAGE_KEY } from '../webskill/runtime';
import { setAgileHostStateReader, setAgileNavigator, type AgileHostState } from '../webskill/hostState';
import { recordFieldValues } from '../webskill/fieldHistory';
import { serveAgilePageEndpoint } from '../webskill/mcpHost';

interface AgileDataContextType {
  requirements: Requirement[];
  sprints: Sprint[];
  bugs: Bug[];
  testSuites: TestSuite[];
  metrics: Metrics;
  currentScreen: Screen;
  screenParams?: ScreenParams;
  setCurrentScreen: (screen: Screen, params?: ScreenParams) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  lang: 'zh' | 'en';
  setLang: (lang: 'zh' | 'en') => void;
  /**
   * 外观（主题/语言/渲染档/听写语言）的唯一真值源是 RuntimeConfigStore。
   * 本方法双写：既更新 context（业务页用），也写入配置存储（chatbot / console 用）。
   */
  updateAppearance: (partial: Partial<RuntimeAppearanceConfig>) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;

  // Projects support
  projects: Project[];
  currentProjectId: string;
  setCurrentProjectId: (id: string) => void;

  // CRUD actions
  addRequirement: (req: Omit<Requirement, 'id' | 'projectId'> & { projectId?: string }) => void;
  updateRequirement: (req: Requirement) => void;
  deleteRequirement: (id: string) => void;

  addSprint: (sprint: Omit<Sprint, 'id' | 'projectId'> & { projectId?: string }) => void;
  updateSprint: (sprint: Sprint) => void;
  deleteSprint: (id: string) => void;

  addBug: (bug: Omit<Bug, 'id' | 'projectId'> & { projectId?: string }) => void;
  updateBug: (bug: Bug) => void;
  deleteBug: (id: string) => void;

  addTestSuite: (suite: Omit<TestSuite, 'id' | 'projectId'> & { projectId?: string }) => void;
  updateTestSuite: (suite: TestSuite) => void;
  deleteTestSuite: (id: string) => void;

  updateMetrics: (metrics: Metrics) => void;
  resetAllData: () => void;

  /** 业务数据被页面动作改动后，通知感知层刷新（T3 用） */
  subscribeDataChange: (fn: () => void) => () => void;
}

const AgileDataContext = createContext<AgileDataContextType | undefined>(undefined);

export const AgileDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Projects state
  const [projects] = useState<Project[]>(initialProjects);
  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    const saved = localStorage.getItem('agile_current_project_id');
    return saved || 'PROJ-CORE'; // Default to SmartCloud Core Platform
  });

  // Base persistent data pools
  const [allRequirements, setAllRequirements] = useState<Requirement[]>(() => {
    const saved = localStorage.getItem('agile_all_requirements');
    return saved ? JSON.parse(saved) : initialRequirements;
  });

  const [allSprints, setAllSprints] = useState<Sprint[]>(() => {
    const saved = localStorage.getItem('agile_all_sprints');
    return saved ? JSON.parse(saved) : initialSprints;
  });

  const [allBugs, setAllBugs] = useState<Bug[]>(() => {
    const saved = localStorage.getItem('agile_all_bugs');
    return saved ? JSON.parse(saved) : initialBugs;
  });

  const [allTestSuites, setAllTestSuites] = useState<TestSuite[]>(() => {
    const saved = localStorage.getItem('agile_all_testSuites');
    return saved ? JSON.parse(saved) : initialTestSuites;
  });

  const [metrics, setMetrics] = useState<Metrics>(() => {
    const saved = localStorage.getItem('agile_metrics');
    return saved ? JSON.parse(saved) : initialMetrics;
  });

  // Screen + navigation params（deep-link 到 console 的某个分区/run/候选）
  const [currentScreen, setCurrentScreenState] = useState<Screen>('overview');
  const [screenParams, setScreenParams] = useState<ScreenParams | undefined>(undefined);

  const setCurrentScreen = useCallback((screen: Screen, params?: ScreenParams) => {
    setScreenParams(params);
    setCurrentScreenState(screen);
  }, []);

  // Theme state: default 'dark' and load from localStorage
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('agile_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  const [lang, setLangState] = useState<'zh' | 'en'>(() => {
    const saved = localStorage.getItem('agile_lang');
    if (saved === 'zh' || saved === 'en') return saved;
    const browserLang =
      typeof navigator !== 'undefined' ? navigator.language || (navigator as any).userLanguage || 'en' : 'en';
    return browserLang.toLowerCase().includes('zh') ? 'zh' : 'en';
  });

  // Keep refs of latest states to avoid stale closures in async appearance writes
  const themeRef = useRef(theme);
  const langRef = useRef(lang);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('agile_logged_in');
    return saved === 'true';
  });

  // Filtered views based on selected project
  const requirements = allRequirements.filter((r) => r.projectId === currentProjectId);
  const sprints = allSprints.filter((s) => s.projectId === currentProjectId);
  const bugs = allBugs.filter((b) => b.projectId === currentProjectId);
  const testSuites = allTestSuites.filter((t) => t.projectId === currentProjectId);

  // ---- Appearance：context 与 RuntimeConfigStore 双写 ----

  /** 把外观字段写进配置存储（chatbot / console 的唯一真值源） */
  const persistAppearance = useCallback((partial: Partial<RuntimeAppearanceConfig>) => {
    getWebSkillRuntime()
      .then(({ runtimeConfig }) =>
        runtimeConfig.load().then((cfg) =>
          runtimeConfig.save({ ...cfg, appearance: { ...cfg.appearance, ...partial } })
        )
      )
      // 装配失败时外观仍走 context 本地存储，不阻塞交互
      .catch(() => undefined);
  }, []);

  const updateAppearance = useCallback(
    (partial: Partial<RuntimeAppearanceConfig>) => {
      if (partial.theme !== undefined) setThemeState(partial.theme);
      if (partial.locale !== undefined) setLangState(partial.locale);
      persistAppearance(partial);
    },
    [persistAppearance]
  );

  const setTheme = useCallback(
    (newTheme: 'light' | 'dark') => {
      updateAppearance({ theme: newTheme });
    },
    [updateAppearance]
  );

  const setLang = useCallback(
    (newLang: 'zh' | 'en') => {
      updateAppearance({ locale: newLang });
    },
    [updateAppearance]
  );

  /**
   * 首次装配时对齐两侧外观：
   * 配置存储已存在（用户可能已在 console 设置页编辑过）→ 以存储为准；
   * 不存在（全新启动）→ 把 context 的当前值种进存储。
   */
  useEffect(() => {
    let alive = true;
    getWebSkillRuntime()
      .then(async ({ runtimeConfig }) => {
        const cfg = await runtimeConfig.load();
        if (!alive) return;
        const hasSaved = !!globalThis.localStorage?.getItem(RUNTIME_CONFIG_STORAGE_KEY);
        if (hasSaved) {
          setThemeState(cfg.appearance.theme);
          setLangState(cfg.appearance.locale);
        } else {
          await runtimeConfig.save({
            ...cfg,
            appearance: { ...cfg.appearance, theme: themeRef.current, locale: langRef.current }
          });
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme class 落到根节点（业务页深浅色）
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Persistence helpers
  useEffect(() => {
    localStorage.setItem('agile_current_project_id', currentProjectId);
  }, [currentProjectId]);

  useEffect(() => {
    localStorage.setItem('agile_all_requirements', JSON.stringify(allRequirements));
  }, [allRequirements]);

  useEffect(() => {
    localStorage.setItem('agile_all_sprints', JSON.stringify(allSprints));
  }, [allSprints]);

  useEffect(() => {
    localStorage.setItem('agile_all_bugs', JSON.stringify(allBugs));
  }, [allBugs]);

  useEffect(() => {
    localStorage.setItem('agile_all_testSuites', JSON.stringify(allTestSuites));
  }, [allTestSuites]);

  useEffect(() => {
    localStorage.setItem('agile_metrics', JSON.stringify(metrics));
  }, [metrics]);

  useEffect(() => {
    localStorage.setItem('agile_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('agile_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('agile_logged_in', String(isLoggedIn));
  }, [isLoggedIn]);

  // ---- 数据变更广播（T3 感知刷新） ----
  const dataListeners = useRef(new Set<() => void>());
  const subscribeDataChange = useCallback((fn: () => void) => {
    dataListeners.current.add(fn);
    return () => {
      dataListeners.current.delete(fn);
    };
  }, []);
  useEffect(() => {
    dataListeners.current.forEach((fn) => fn());
  }, [allRequirements, allSprints, allBugs, allTestSuites, metrics]);

  // ---- 宿主状态桥（T3）：引擎侧的数据源 / 页面工具 / 技能脚本永远读最新状态 ----
  const hostStateRef = useRef<AgileHostState | undefined>(undefined);
  useEffect(() => {
    hostStateRef.current = {
      projects,
      currentProjectId,
      requirements: allRequirements,
      sprints: allSprints,
      bugs: allBugs,
      testSuites: allTestSuites,
      metrics,
      screen: currentScreen
    };
  });
  useEffect(() => {
    setAgileHostStateReader(() => {
      const s = hostStateRef.current;
      if (!s) throw new Error('Agile host state is not ready yet');
      return s;
    });
    // 导航桥：页面工具 navigate_to_screen 经此切左侧菜单屏（技能中心不对模型开放）
    setAgileNavigator((screen) => setCurrentScreen(screen));
  }, []);

  // 换屏即换一批页面临时技能（进程内 MCP 端点热替换，console 连接页同步可见）。
  // 技能中心不算业务屏：开着 console 时保留上一个业务屏的技能，否则连接页永远空。
  useEffect(() => {
    if (currentScreen === 'webskill-manager') return;
    void serveAgilePageEndpoint(currentScreen);
  }, [currentScreen]);

  // ---- 字段历史写入点（T6）：CRUD 成功后记录白名单字段的取值频次（开关关闭时不记） ----
  const trackFields = useCallback((entity: 'requirement' | 'bug' | 'test', values: Record<string, unknown>) => {
    void getWebSkillRuntime()
      .then(({ fieldHistory }) => recordFieldValues(fieldHistory, 'test', entity, values))
      .catch((e: unknown) => console.warn('[agile] field history record failed', e));
  }, []);

  // CRUD actions updating base data array
  const addRequirement = (req: Omit<Requirement, 'id' | 'projectId'> & { projectId?: string }) => {
    const targetProjId = req.projectId || currentProjectId;
    const nextNum = 100 + allRequirements.length + 1;
    const currentProjObj = projects.find((p) => p.id === targetProjId) || projects[0];
    const nextId = `${currentProjObj.key}-${nextNum}`;

    const { projectId, ...reqRest } = req;

    const item: Requirement = {
      ...reqRest,
      id: nextId,
      projectId: targetProjId,
      createdDate: new Date().toISOString().split('T')[0],
    };
    setAllRequirements([...allRequirements, item]);
    trackFields('requirement', req);
  };

  const updateRequirement = (req: Requirement) => {
    setAllRequirements(allRequirements.map((r) => (r.id === req.id ? req : r)));
  };

  const deleteRequirement = (id: string) => {
    setAllRequirements(allRequirements.filter((r) => r.id !== id));
  };

  const addSprint = (sprint: Omit<Sprint, 'id' | 'projectId'> & { projectId?: string }) => {
    const targetProjId = sprint.projectId || currentProjectId;
    const currentProjObj = projects.find((p) => p.id === targetProjId) || projects[0];
    const nextId = `${currentProjObj.key}-SPR-${allSprints.length + 1}`;

    const { projectId, ...sprintRest } = sprint;

    const item: Sprint = { ...sprintRest, id: nextId, projectId: targetProjId };
    setAllSprints([...allSprints, item]);
  };

  const updateSprint = (sprint: Sprint) => {
    setAllSprints(allSprints.map((s) => (s.id === sprint.id ? sprint : s)));
  };

  const deleteSprint = (id: string) => {
    setAllSprints(allSprints.filter((s) => s.id !== id));
  };

  const addBug = (bug: Omit<Bug, 'id' | 'projectId'> & { projectId?: string }) => {
    const targetProjId = bug.projectId || currentProjectId;
    const currentProjObj = projects.find((p) => p.id === targetProjId) || projects[0];
    const nextId = `${currentProjObj.key}-BUG-${allBugs.length + 1}`;

    const { projectId, ...bugRest } = bug;

    const item: Bug = { ...bugRest, id: nextId, projectId: targetProjId };
    setAllBugs([...allBugs, item]);
    trackFields('bug', bug);
  };

  const updateBug = (bug: Bug) => {
    setAllBugs(allBugs.map((b) => (b.id === bug.id ? bug : b)));
  };

  const deleteBug = (id: string) => {
    setAllBugs(allBugs.filter((b) => b.id !== id));
  };

  const addTestSuite = (suite: Omit<TestSuite, 'id' | 'projectId'> & { projectId?: string }) => {
    const targetProjId = suite.projectId || currentProjectId;
    const currentProjObj = projects.find((p) => p.id === targetProjId) || projects[0];
    const nextId = `${currentProjObj.key}-TST-${allTestSuites.length + 1}`;

    const { projectId, ...suiteRest } = suite;

    const item: TestSuite = { ...suiteRest, id: nextId, projectId: targetProjId };
    setAllTestSuites([...allTestSuites, item]);
    trackFields('test', suite);
  };

  const updateTestSuite = (suite: TestSuite) => {
    setAllTestSuites(allTestSuites.map((t) => (t.id === suite.id ? suite : t)));
  };

  const deleteTestSuite = (id: string) => {
    setAllTestSuites(allTestSuites.filter((t) => t.id !== id));
  };

  const updateMetrics = (newMetrics: Metrics) => {
    setMetrics(newMetrics);
  };

  const resetAllData = () => {
    setAllRequirements(initialRequirements);
    setAllSprints(initialSprints);
    setAllBugs(initialBugs);
    setAllTestSuites(initialTestSuites);
    setMetrics(initialMetrics);
  };

  return (
    <AgileDataContext.Provider
      value={{
        requirements,
        sprints,
        bugs,
        testSuites,
        metrics,
        currentScreen,
        screenParams,
        setCurrentScreen,
        theme,
        setTheme,
        lang,
        setLang,
        updateAppearance,
        isLoggedIn,
        setIsLoggedIn,

        // Multi projects
        projects,
        currentProjectId,
        setCurrentProjectId,

        addRequirement,
        updateRequirement,
        deleteRequirement,
        addSprint,
        updateSprint,
        deleteSprint,
        addBug,
        updateBug,
        deleteBug,
        addTestSuite,
        updateTestSuite,
        deleteTestSuite,
        updateMetrics,
        resetAllData,
        subscribeDataChange,
      }}
    >
      {children}
    </AgileDataContext.Provider>
  );
};

export const useAgileData = () => {
  const context = useContext(AgileDataContext);
  if (context === undefined) {
    throw new Error('useAgileData must be used within an AgileDataProvider');
  }
  return context;
};
