import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
import { Screen, LLMConfig, ChatMessage, OpenUISchema } from '../types';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: string;
}

export interface TraceLog {
  id: string;
  traceId: string;
  phase: string;
  skillName: string;
  inputParams: string;
  outputResult: string;
  executionTimeMs: number;
  recordTime: string;
  timestamp: Date;
}

export interface TraceMetrics {
  activatedSkills: number;
  successCount: number;
  failureCount: number;
  reviewCount: number;
}

interface AgileDataContextType {
  requirements: Requirement[];
  sprints: Sprint[];
  bugs: Bug[];
  testSuites: TestSuite[];
  metrics: Metrics;
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  lang: 'zh' | 'en';
  setLang: (lang: 'zh' | 'en') => void;
  llmConfig: LLMConfig;
  setLlmConfig: (config: LLMConfig) => void;
  chatHistory: ChatMessage[];
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;

  // Projects support
  projects: Project[];
  currentProjectId: string;
  setCurrentProjectId: (id: string) => void;

  // Chat Sessions (History list)
  sessions: ChatSession[];
  currentSessionId: string;
  setCurrentSessionId: (id: string) => void;
  createNewSession: (title?: string) => void;
  deleteSession: (id: string) => void;

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

  // Chat Actions
  sendChatMessage: (text: string) => Promise<void>;
  clearChat: () => void;

  // Tracing
  traceLogs: TraceLog[];
  traceMetrics: TraceMetrics;
  clearTraceLogs: () => void;
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

  // Screen
  const [currentScreen, setCurrentScreen] = useState<Screen>('overview');

  // Theme state: default 'light' and load from localStorage
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('agile_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [lang, setLang] = useState<'zh' | 'en'>(() => {
    const saved = localStorage.getItem('agile_lang');
    if (saved === 'zh' || saved === 'en') return saved;
    const browserLang = typeof navigator !== 'undefined' ? navigator.language || (navigator as any).userLanguage || 'en' : 'en';
    return browserLang.toLowerCase().includes('zh') ? 'zh' : 'en';
  });

  // Keep refs of latest states to avoid stale closures in setTimeout, chat callbacks
  const currentProjectIdRef = useRef(currentProjectId);
  const allRequirementsRef = useRef(allRequirements);
  const allSprintsRef = useRef(allSprints);
  const allBugsRef = useRef(allBugs);
  const allTestSuitesRef = useRef(allTestSuites);
  const langRef = useRef(lang);

  useEffect(() => {
    currentProjectIdRef.current = currentProjectId;
  }, [currentProjectId]);
  useEffect(() => {
    allRequirementsRef.current = allRequirements;
  }, [allRequirements]);
  useEffect(() => {
    allSprintsRef.current = allSprints;
  }, [allSprints]);
  useEffect(() => {
    allBugsRef.current = allBugs;
  }, [allBugs]);
  useEffect(() => {
    allTestSuitesRef.current = allTestSuites;
  }, [allTestSuites]);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('agile_logged_in');
    return saved === 'true';
  });

  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => {
    const saved = localStorage.getItem('agile_llm_config');
    return saved
      ? JSON.parse(saved)
      : {
          apiKey: 'sk-agile-••••••••••••••••78bc',
          modelName: 'deepseek-v4',
          endpoint: 'https://api.deepseek.com/v1',
        };
  });

  // Double-linked session support
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('agile_chat_sessions_v1');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'session-default',
        title: '敏捷研发问答会话',
        messages: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const saved = localStorage.getItem('agile_current_session_id_v1');
    return saved || 'session-default';
  });

  const [traceLogs, setTraceLogs] = useState<TraceLog[]>([]);
  const [traceMetrics, setTraceMetrics] = useState<TraceMetrics>({
    activatedSkills: 0,
    successCount: 0,
    failureCount: 0,
    reviewCount: 0,
  });

  const activeTraceRef = useRef<{ traceId: string; isAwaitingUser: boolean; skillName: string } | null>(null);

  const clearTraceLogs = () => {
    setTraceLogs([]);
  };

  // Filtered views based on selected project
  const requirements = allRequirements.filter((r) => r.projectId === currentProjectId);
  const sprints = allSprints.filter((s) => s.projectId === currentProjectId);
  const bugs = allBugs.filter((b) => b.projectId === currentProjectId);
  const testSuites = allTestSuites.filter((t) => t.projectId === currentProjectId);

  const activeSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const chatHistory = activeSession ? activeSession.messages : [];

  // Theme toggle (Fully operational theme switching)
  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('agile_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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
    localStorage.setItem('agile_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('agile_logged_in', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('agile_llm_config', JSON.stringify(llmConfig));
  }, [llmConfig]);

  useEffect(() => {
    localStorage.setItem('agile_chat_sessions_v1', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('agile_current_session_id_v1', currentSessionId);
  }, [currentSessionId]);

  // Session History triggers
  const createNewSession = (title?: string) => {
    const id = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id,
      title: title || (lang === 'zh' ? '新会话' : 'New Session'),
      messages: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(id);
  };

  const deleteSession = (id: string) => {
    if (sessions.length <= 1) {
      // Keep at least one session active
      setSessions([
        {
          id: 'session-default',
          title: lang === 'zh' ? '基础协同会话' : 'Coordinating Session',
          messages: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setCurrentSessionId('session-default');
      return;
    }
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      setCurrentSessionId(remaining[0].id);
    }
  };

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

    setSessions([
      {
        id: 'session-default',
        title: '敏捷研发问答会话',
        messages: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setCurrentSessionId('session-default');
  };

  const clearChat = () => {
    setSessions((prev) => prev.map((s) => (s.id === currentSessionId ? { ...s, messages: [] } : s)));
  };

  // AI Dialog rendering simulator
  const sendChatMessage = async (userPrompt: string) => {
    const cleanPrompt = userPrompt.trim();
    if (!cleanPrompt) return;

    // Helper to generate a random 16-char string
    const generateTraceId = () => Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

    const isContinuingTrace = activeTraceRef.current?.isAwaitingUser;
    const traceId = isContinuingTrace && activeTraceRef.current ? activeTraceRef.current.traceId : generateTraceId();

    const generateRandomMs = () => Math.floor(Math.random() * 90) + 10;

    // helper to add log
    const appendLog = (phase: string, skillName: string, inputParams: string, outputResult: string) => {
      setTraceLogs((prev) => [
        {
          id: `log-${Date.now()}-${Math.random()}`,
          traceId,
          phase,
          skillName,
          inputParams,
          outputResult,
          executionTimeMs: generateRandomMs(),
          recordTime: new Date().toLocaleString('sv-SE').replace('T', ' '),
          timestamp: new Date(),
        },
        ...prev,
      ]);
    };

    // Acknowledge the user message immediately
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: cleanPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Rename session title if it's currently a default generic title
    let resolvedTitle: string | undefined = undefined;
    const currentSess = sessions.find((s) => s.id === currentSessionId);
    if (
      currentSess &&
      (currentSess.title === '新会话' || currentSess.title === '敏捷研发问答会话' || currentSess.title === 'New Session')
    ) {
      resolvedTitle = cleanPrompt.length > 12 ? cleanPrompt.slice(0, 12) + '...' : cleanPrompt;
    }

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            title: resolvedTitle || s.title,
            messages: [...s.messages, userMsg],
          };
        }
        return s;
      }),
    );

    // Generate tailored AI response based on current loaded project data
    let responseText = '';
    let schema: OpenUISchema | undefined = undefined;

    const pLower = cleanPrompt.toLowerCase();

    const isExecuteAnalyze = pLower.startsWith('分析迭代进度') || pLower.startsWith('analyze sprint progress');
    const isSprintProgress =
      !isExecuteAnalyze &&
      (pLower.includes('sprint') || pLower.includes('迭代') || pLower.includes('进展') || pLower.includes('progress')) &&
      !pLower.includes('看板');

    const isCreateBug =
      (pLower.includes('bug') || pLower.includes('缺陷') || pLower.includes('incident')) &&
      (pLower.includes('创建') ||
        pLower.includes('新建') ||
        pLower.includes('create') ||
        pLower.includes('提一') ||
        pLower.includes('录入') ||
        pLower.includes('添加') ||
        pLower.includes('报告'));

    const isExecuteBugSeverity = pLower.startsWith('分析缺陷严重程度') || pLower.startsWith('analyze bug severity');
    const isBugSeverity =
      !isExecuteBugSeverity &&
      !isCreateBug &&
      (pLower.includes('severity') ||
        pLower.includes('严重程度') ||
        (pLower.includes('缺陷') &&
          (pLower.includes('分布') || pLower.includes('图表') || pLower.includes('chart') || pLower.includes('分类'))));

    const isCreateRequirement =
      (pLower.includes('需求') || pLower.includes('requirement') || pLower.includes('用例')) &&
      (pLower.includes('创建') ||
        pLower.includes('新建') ||
        pLower.includes('create') ||
        pLower.includes('加一') ||
        pLower.includes('录入') ||
        pLower.includes('添加'));

    const isExecuteKanban = pLower.startsWith('分析项目需求') || pLower.startsWith('analyze project requirements');
    const isKanban =
      !isExecuteKanban &&
      !isCreateRequirement &&
      (pLower.includes('kanban') ||
        pLower.includes('看板') ||
        (pLower.includes('需求') &&
          (pLower.includes('梳理') ||
            pLower.includes('整理') ||
            pLower.includes('状态') ||
            pLower.includes('分布') ||
            pLower.includes('深度'))));

    let currentProjIdVal = currentProjectIdRef.current;
    const projMatch = pLower.match(/(proj-[a-z0-9_-]+)/i);
    if (projMatch) {
      currentProjIdVal = projMatch[1].toUpperCase();
    }
    const currentLangVal = langRef.current;
    const currentProjObj = projects.find((p) => p.id === currentProjIdVal) || projects[0];

    if (isExecuteAnalyze) {
      const projectSprints = allSprintsRef.current.filter((s) => s.projectId === currentProjIdVal);
      const activeSprints = projectSprints.filter((s) => s.status === 'Active');
      const plannedSprints = projectSprints.filter((s) => s.status === 'Planned');
      const completedSprints = projectSprints.filter((s) => s.status === 'Completed');
      const activeSprint = activeSprints[0] ||
        projectSprints[0] || { name: '无活跃迭代', name_en: 'No Active Sprint', velocity: 35, progress: 0, goal: '', goal_en: '' };

      const projectRequirements = allRequirementsRef.current.filter((r) => r.projectId === currentProjIdVal);
      const todoTickets = projectRequirements.filter((r) => r.status === 'Todo');
      const doingTickets = projectRequirements.filter((r) => r.status === 'In Progress');
      const doneTickets = projectRequirements.filter((r) => r.status === 'Done');

      // Burned SP calculated matching Scrum Kanban Done columns
      const completedSP = doneTickets.reduce((sum, r) => sum + (r.storyPoints || 0), 0);
      const velocitySP = activeSprint.velocity || 35;

      responseText =
        currentLangVal === 'zh'
          ? `好的，已成功对接 **${currentProjObj.name}** 迭代规划中心，基于当前实时提取的交付数据生成以下分析：

### 🎯 A. 活跃冲刺中
* 🚀 **敏捷冲刺周期**: \`${activeSprint.name}\`
* 📌 **迭代规划目标**: ${activeSprint.goal || '暂无规划目标'}

### 📈 B. 敏捷燃尽水位
* 🟢 **已收尾燃尽**: **${completedSP} SP** (故事点/Story Points)。
* 🛡️ **标准容量速率**: 当前迭代规划容器速率为 **${velocitySP} SP**。
* 📝 **生产交付水位**: 当前周期完成了约 **${Math.round((completedSP / (velocitySP || 1)) * 100)}%**。

### 📊 C. 本期状态分布 (看板列：待办 / 进行中 / 已关闭)
当前活跃迭代共包含 \`${projectRequirements.length}\` 个研发需求卡片。我们已通过 OpenUI 饼图及数据表格生成了详细的任务分类情况：`
          : `Connected database of **${currentProjObj.name_en || currentProjObj.name}** successfully. Below is the generated iteration report based on real-time data:

### 🎯 A. Current Active Sprint
* 🚀 **Period**: \`${activeSprint.name_en || activeSprint.name}\`
* 📌 **Planned Goals**: ${activeSprint.goal_en || activeSprint.goal || 'N/A'}

### 📈 B. Agile Completion & Capacity
* 🟢 **Story Points Burned**: **${completedSP} SP** (completed).
* 🛡️ **Standard Capacity**: Iteration standard velocity planned at **${velocitySP} SP**.
* 📝 **Completion Rate**: Current cycle has burned down **${Math.round((completedSP / (velocitySP || 1)) * 100)}%** of the velocity.

### 📊 C. Status Breakdowns (Todo / In Progress / Done)
Currently active sprint board contains \`${projectRequirements.length}\` issue cards. Detailed breakdowns are visualized below:`;

      schema = {
        type: 'dashboard',
        title:
          currentLangVal === 'zh'
            ? `${currentProjObj.name} - 迭代进展进展看板`
            : `${currentProjObj.name_en || currentProjObj.name} - Sprint Status`,
        subtitle: currentLangVal === 'zh' ? '迭代状态全局分布统计数据' : 'Global Iteration Distributions',
        data: {
          dashboardData: {
            kpis: [
              {
                label: currentLangVal === 'zh' ? '已收尾燃尽' : 'Burned SP',
                value: `${completedSP} SP`,
                color: 'text-emerald-600 dark:text-emerald-400',
              },
              {
                label: currentLangVal === 'zh' ? '容器总速率' : 'Total Velocity',
                value: `${velocitySP} SP`,
                color: 'text-indigo-600 dark:text-indigo-400',
              },
            ],
            barPoints: [],
            donutPoints: [
              { label: currentLangVal === 'zh' ? '待办 (Planned / Todo)' : 'Todo', value: todoTickets.length },
              { label: currentLangVal === 'zh' ? '进行中 (Active / Doing)' : 'Doing', value: doingTickets.length },
              { label: currentLangVal === 'zh' ? '已关闭 (Completed / Done)' : 'Done', value: doneTickets.length },
            ],
            tables: [
              {
                title: currentLangVal === 'zh' ? '📋 待办队列任务 (Planned/Todo)' : '📋 Todo Tickets',
                columns: [
                  { key: 'id', label: 'ID' },
                  { key: 'name', label: currentLangVal === 'zh' ? '需求/迭代名称' : 'Ticket Title' },
                  { key: 'points', label: currentLangVal === 'zh' ? '规划点数' : 'Story Points' },
                ],
                rows: todoTickets.map((t) => ({
                  id: t.id,
                  name: currentLangVal === 'zh' ? t.title : t.title_en || t.title,
                  points: `${t.storyPoints} pts`,
                })),
              },
              {
                title: currentLangVal === 'zh' ? '🏃‍♂️ 进行中任务 (Active/Doing)' : '🏃‍♂️ In Progress Tickets',
                columns: [
                  { key: 'id', label: 'ID' },
                  { key: 'name', label: currentLangVal === 'zh' ? '需求/迭代名称' : 'Ticket Title' },
                  { key: 'points', label: currentLangVal === 'zh' ? '规划点数' : 'Story Points' },
                ],
                rows: doingTickets.map((t) => ({
                  id: t.id,
                  name: currentLangVal === 'zh' ? t.title : t.title_en || t.title,
                  points: `${t.storyPoints} pts`,
                })),
              },
              {
                title: currentLangVal === 'zh' ? '📦 已关闭/燃尽需求 (Completed/Done)' : '📦 Completed Tickets',
                columns: [
                  { key: 'id', label: 'ID' },
                  { key: 'name', label: currentLangVal === 'zh' ? '需求/迭代名称' : 'Ticket Title' },
                  { key: 'points', label: currentLangVal === 'zh' ? '交付点数' : 'Story Points' },
                ],
                rows: doneTickets.map((t) => ({
                  id: t.id,
                  name: currentLangVal === 'zh' ? t.title : t.title_en || t.title,
                  points: `${t.storyPoints} pts`,
                })),
              },
            ],
          },
        },
      };
    } else if (isSprintProgress) {
      responseText =
        lang === 'zh'
          ? `好的，为了更精准地帮您进行迭代进展分析，请先在下方表单中选择您要分析的项目：`
          : `Understood! Let's analyze iteration progress. Please select the target project you would like to analyze:`;

      schema = {
        type: 'form',
        title: lang === 'zh' ? '选择分析项目' : 'Select Project for Analysis',
        subtitle: lang === 'zh' ? '请选择需要分析项目迭代数据的目标项目' : 'Select project to load iterations',
        formActionId: 'analyze-project',
        formSubmitText: lang === 'zh' ? '确定' : 'OK',
        formFields: [
          {
            key: 'projectId',
            label: lang === 'zh' ? '待分析目标项目' : 'Target Project',
            type: 'radio',
            options: projects.map((p) => ({ value: p.id, label: `${p.key} - ${lang === 'zh' ? p.name : p.name_en}` })),
            defaultValue: currentProjectId,
          },
        ],
      };
    } else if (isCreateBug) {
      responseText =
        lang === 'zh'
          ? `好的，敏捷智能助手已通过 OpenUI 动态为您生成了 **【缺陷单登记表单】**。\n\n请在表单选项中指定目标归属项目，并录入异常概要与严重程度。录入后，系统将为您自动对齐并归档故障：`
          : `Understood! I have rendered a seamless **Bug Registration Form** using OpenUI.\n\nPlease select the target project options, write the defect summary, rating level, and confirm:`;

      schema = {
        type: 'form',
        title: lang === 'zh' ? '敏捷缺陷登记表单' : 'Agile Defect Submission Form',
        subtitle: lang === 'zh' ? '经由智能语义引擎生成' : 'Generated by AI semantic engine',
        formActionId: 'create-bug',
        formSubmitText: lang === 'zh' ? '录入缺陷库' : 'Submit Defect',
        formFields: [
          {
            key: 'projectId',
            label: lang === 'zh' ? '归属目标项目' : 'Target Project',
            type: 'select',
            options: projects.map((p) => ({ value: p.id, label: `${p.key} - ${lang === 'zh' ? p.name : p.name_en}` })),
            defaultValue: currentProjectId,
          },
          {
            key: 'title',
            label: lang === 'zh' ? '异常缺陷概要' : 'Defect Title',
            type: 'text',
            placeholder: lang === 'zh' ? '请输入清晰的问题描述，例如：支付接口在部分浏览器偶现502' : 'Describe the technical core bug',
            defaultValue: '',
          },
          {
            key: 'severity',
            label: lang === 'zh' ? '严重影响级别' : 'Severity Rating',
            type: 'select',
            options: [
              { value: 'Critical', label: lang === 'zh' ? '🔴 致命中断' : 'Critical' },
              { value: 'Major', label: lang === 'zh' ? '🟡 严重故障' : 'Major' },
              { value: 'Minor', label: lang === 'zh' ? '🟢 一般轻微' : 'Minor' },
            ],
            defaultValue: 'Major',
          },
          {
            key: 'description',
            label: lang === 'zh' ? '重现步骤及辅助排查日志' : 'Detailed Description',
            type: 'textarea',
            placeholder: lang === 'zh' ? '1. 打开交易页 2. 点击支付 3. 出现白屏...' : 'Step by step logs or stack information...',
            defaultValue: '',
          },
        ],
      };
    } else if (isBugSeverity) {
      responseText =
        lang === 'zh'
          ? `好的，为了更精准地展现该项目的缺陷严重程度分布，请先在下方表单中选择您要调取的项目：`
          : `Understood! To display the bug severity distribution, please select the target project below:`;

      schema = {
        type: 'form',
        title: lang === 'zh' ? '选择分析项目' : 'Select Project',
        subtitle: lang === 'zh' ? '请选择需要分析缺陷严重程度分布的目标项目' : 'Select project to load defect severity ratios',
        formActionId: 'analyze-bug-severity',
        formSubmitText: lang === 'zh' ? '确定' : 'OK',
        formFields: [
          {
            key: 'projectId',
            label: lang === 'zh' ? '待分析目标项目' : 'Target Project',
            type: 'radio',
            options: projects.map((p) => ({ value: p.id, label: `${p.key} - ${lang === 'zh' ? p.name : p.name_en}` })),
            defaultValue: currentProjectId,
          },
        ],
      };
    } else if (isExecuteBugSeverity) {
      const projectBugs = allBugsRef.current.filter((b) => b.projectId === currentProjIdVal);
      const openBugs = projectBugs.filter((b) => b.status === 'Open');
      const criticalBugs = openBugs.filter((b) => b.severity === 'Critical');
      const majorBugs = openBugs.filter((b) => b.severity === 'Major');
      const minorBugs = openBugs.filter((b) => b.severity === 'Minor');

      responseText =
        lang === 'zh'
          ? `收到！正在调取该项目下的未关闭故障记录。\n项目 [${currentProjObj.name}] 挂起状态缺陷共计 **${openBugs.length}** 个，严重等级分类统计如下：\n- **🔴 致命中断**：${criticalBugs.length} 个\n- **🟡 严重故障**：${majorBugs.length} 个\n- **🟢 一般轻微**：${minorBugs.length} 个\n\n已为您计算并实时绘制出该项目缺陷的严重程度分布饼图，并在下方展示按严重等级分类的表格，为您罗列出具体缺陷故障的详细名称。`
          : `Defect database accessed. Grouping unresolved bugs under [${currentProjObj.name_en || currentProjObj.name}] (Total: ${openBugs.length}):\n- **🔴 Critical**: ${criticalBugs.length} issues\n- **🟡 Major**: ${majorBugs.length} issues\n- **🟢 Minor**: ${minorBugs.length} issues\n\nSynthesized a project bug density breakdown donut and detailed severity-categorized tabulations below.`;

      schema = {
        type: 'dashboard',
        title: lang === 'zh' ? '未解决缺陷级别大盘' : 'Bug Severity Overview',
        subtitle: lang === 'zh' ? `项目累计挂起：${openBugs.length} 个` : `Total Unresolved: ${openBugs.length}`,
        data: {
          dashboardData: {
            kpis: [
              {
                label: lang === 'zh' ? '总挂起缺陷数' : 'Total Open Bugs',
                value: `${openBugs.length}`,
                color: 'text-rose-600 dark:text-rose-400',
              },
              { label: lang === 'zh' ? '红线阻断缺陷' : 'Critical Bugs', value: `${criticalBugs.length}`, color: 'text-red-500' },
              { label: lang === 'zh' ? '一般严重缺陷' : 'Major Bugs', value: `${majorBugs.length}`, color: 'text-amber-500' },
            ],
            barPoints: [],
            donutPoints: [
              { label: lang === 'zh' ? '致命 (Critical)' : 'Critical', value: criticalBugs.length },
              { label: lang === 'zh' ? '重要 (Major)' : 'Major', value: majorBugs.length },
              { label: lang === 'zh' ? '轻微 (Minor)' : 'Minor', value: minorBugs.length },
            ],
            tables: [
              {
                title: lang === 'zh' ? '🔴 致命中断缺陷列表 (Critical)' : '🔴 Critical Issues',
                columns: [
                  { key: 'id', label: 'ID' },
                  { key: 'name', label: lang === 'zh' ? '缺陷名称' : 'Defect Title' },
                  { key: 'module', label: lang === 'zh' ? '归属模块/环境' : 'Module / Env' },
                ],
                rows: criticalBugs.map((b) => ({
                  id: b.id,
                  name: lang === 'zh' ? b.title : b.title_en || b.title,
                  module: lang === 'zh' ? b.module : b.module_en || b.module,
                })),
              },
              {
                title: lang === 'zh' ? '🟡 重要严重缺陷列表 (Major)' : '🟡 Major Issues',
                columns: [
                  { key: 'id', label: 'ID' },
                  { key: 'name', label: lang === 'zh' ? '缺陷名称' : 'Defect Title' },
                  { key: 'module', label: lang === 'zh' ? '归属模块/环境' : 'Module / Env' },
                ],
                rows: majorBugs.map((b) => ({
                  id: b.id,
                  name: lang === 'zh' ? b.title : b.title_en || b.title,
                  module: lang === 'zh' ? b.module : b.module_en || b.module,
                })),
              },
              {
                title: lang === 'zh' ? '🟢 轻微故障缺陷列表 (Minor)' : '🟢 Minor Issues',
                columns: [
                  { key: 'id', label: 'ID' },
                  { key: 'name', label: lang === 'zh' ? '缺陷名称' : 'Defect Title' },
                  { key: 'module', label: lang === 'zh' ? '归属模块/环境' : 'Module / Env' },
                ],
                rows: minorBugs.map((b) => ({
                  id: b.id,
                  name: lang === 'zh' ? b.title : b.title_en || b.title,
                  module: lang === 'zh' ? b.module : b.module_en || b.module,
                })),
              },
            ],
          },
        },
      };
    } else if (isCreateRequirement) {
      responseText =
        lang === 'zh'
          ? `好的，已为您智能生成 **【产品功能需求录入表单】**。\n\n您可以在下方表单中任意指定归属项目，输入需求名称、描述及优先级。点击录入后该需求将被实时推进至对应项目的 Scrum 待办列表中：`
          : `Understood! I have rendered a seamless **Scrum Requirement Form** using OpenUI.\n\nSpecify the target project, write title, select priority, and submit. This requirement will be cataloged directly in the backlog list of the selected project:`;

      schema = {
        type: 'form',
        title: lang === 'zh' ? '敏捷需求录入表单' : 'Create Scrum Backlog Requirement',
        subtitle: lang === 'zh' ? '配置并写入产品功能列表' : 'Map new capabilities dynamically',
        formActionId: 'create-requirement',
        formSubmitText: lang === 'zh' ? '提交需求' : 'Create Requirement',
        formFields: [
          {
            key: 'projectId',
            label: lang === 'zh' ? '归属需求项目' : 'Parent Project',
            type: 'select',
            options: projects.map((p) => ({ value: p.id, label: `${p.key} - ${lang === 'zh' ? p.name : p.name_en}` })),
            defaultValue: currentProjectId,
          },
          {
            key: 'title',
            label: lang === 'zh' ? '功能需求概要' : 'Requirement Name',
            type: 'text',
            placeholder: lang === 'zh' ? '例如：支持手机验证一键登录及快捷登录' : 'Describe product requirement',
            defaultValue: '',
          },
          {
            key: 'priority',
            label: lang === 'zh' ? '排期优先级' : 'Sprint Priority',
            type: 'select',
            options: [
              { value: 'High', label: lang === 'zh' ? '🔴 高' : '🔴 High' },
              { value: 'Medium', label: lang === 'zh' ? '🟡 中' : '🟡 Medium' },
              { value: 'Low', label: lang === 'zh' ? '🟢 低' : '🟢 Low' },
            ],
            defaultValue: 'High',
          },
          {
            key: 'description',
            label: lang === 'zh' ? '业务场景及验收准则' : 'Detailed Acceptance Criteria',
            type: 'textarea',
            placeholder: lang === 'zh' ? '作为产品用户，我期望可以通过短信快捷键完成登录，从而增强使用便携度。' : 'As a user, I want...',
            defaultValue: '',
          },
        ],
      };
    } else if (isKanban) {
      responseText =
        lang === 'zh'
          ? `为了更清晰地梳理产品的开发路线与 backlog 进展，请在下方选择目标项目的需求看板进行加载：`
          : `To review backlog details, please select the target project to load its interactive requirement Kanban board:`;

      schema = {
        type: 'form',
        title: lang === 'zh' ? '选择分析项目' : 'Select Project',
        subtitle: lang === 'zh' ? '请选择需要加载需求状态看板的目标项目' : 'Select project to load Kanban board',
        formActionId: 'analyze-kanban',
        formSubmitText: lang === 'zh' ? '确定' : 'OK',
        formFields: [
          {
            key: 'projectId',
            label: lang === 'zh' ? '待分析目标项目' : 'Target Project',
            type: 'radio',
            options: projects.map((p) => ({ value: p.id, label: `${p.key} - ${lang === 'zh' ? p.name : p.name_en}` })),
            defaultValue: currentProjectId,
          },
        ],
      };
    } else if (isExecuteKanban) {
      const projRequirements = allRequirementsRef.current.filter((r) => r.projectId === currentProjIdVal);
      const highReqs = projRequirements.filter((r) => r.priority === 'High');
      const mediumReqs = projRequirements.filter((r) => r.priority === 'Medium');
      const lowReqs = projRequirements.filter((r) => r.priority === 'Low');

      responseText =
        lang === 'zh'
          ? `正在为您分析项目【${currentProjObj.name}】下的需求库优先级分布并重绘决策视图：\n\n该项目目前共规划 **${projRequirements.length}** 个需求，按排期优先级的分类统计如下：\n* **🔴 高优先级 (High)**: \`${highReqs.length}\` 个需求\n* **🟡 中优先级 (Medium)**: \`${mediumReqs.length}\` 个需求\n* **🟢 低优先级 (Low)**: \`${lowReqs.length}\` 个需求\n\n已为您计算并实时绘制出该项目需求的优先级比例分布饼图，并在下方表格中按不同优先级分栏详细罗列了具体需求名称。`
          : `Analyzing requirement priority distribution for project "${currentProjObj.name_en || currentProjObj.name}" and generating roadmap metrics:\n\nTotal tracked requirements: **${projRequirements.length}**\n* **🔴 High Priority (High)**: \`${highReqs.length}\` cards\n* **🟡 Medium Priority (Medium)**: \`${mediumReqs.length}\` cards\n* **🟢 Low Priority (Low)**: \`${lowReqs.length}\` cards\n\nSynthesized priority ratio breakdowns and detailed priority-categorized tabulations below:`;

      schema = {
        type: 'dashboard',
        title: lang === 'zh' ? '产品需求优先级大盘' : 'Requirement Priority Board',
        subtitle: lang === 'zh' ? `项目主体: ${currentProjObj.name}` : `Project: ${currentProjObj.name_en || currentProjObj.name}`,
        data: {
          dashboardData: {
            kpis: [
              {
                label: lang === 'zh' ? '总需求数量' : 'Total Requirements',
                value: `${projRequirements.length}`,
                color: 'text-indigo-600 dark:text-indigo-400',
              },
              { label: lang === 'zh' ? '高优先级需求' : 'High Priority', value: `${highReqs.length}`, color: 'text-rose-600' },
              { label: lang === 'zh' ? '中优先级需求' : 'Medium Priority', value: `${mediumReqs.length}`, color: 'text-amber-550' },
            ],
            barPoints: [],
            donutPoints: [
              { label: lang === 'zh' ? '高 (High)' : 'High', value: highReqs.length },
              { label: lang === 'zh' ? '中 (Medium)' : 'Medium', value: mediumReqs.length },
              { label: lang === 'zh' ? '低 (Low)' : 'Low', value: lowReqs.length },
            ],
            tables: [
              {
                title: lang === 'zh' ? '🔴 高优先级需求列表 (High Priority)' : '🔴 High Priority Requirements',
                columns: [
                  { key: 'id', label: 'ID' },
                  { key: 'name', label: lang === 'zh' ? '需求名称' : 'Requirement Title' },
                  { key: 'status', label: lang === 'zh' ? '当前执行状态' : 'Status' },
                ],
                rows: highReqs.map((r) => ({
                  id: r.id,
                  name: r.title,
                  status:
                    r.status === 'Done'
                      ? lang === 'zh'
                        ? '已完成 🟢'
                        : 'Done 🟢'
                      : r.status === 'In Progress'
                        ? lang === 'zh'
                          ? '开发中 🏃‍♂️'
                          : 'In Progress 🏃‍♂️'
                        : lang === 'zh'
                          ? '待开发 📌'
                          : 'Backlog 📌',
                })),
              },
              {
                title: lang === 'zh' ? '🟡 中优先级需求列表 (Medium Priority)' : '🟡 Medium Priority Requirements',
                columns: [
                  { key: 'id', label: 'ID' },
                  { key: 'name', label: lang === 'zh' ? '需求名称' : 'Requirement Title' },
                  { key: 'status', label: lang === 'zh' ? '当前执行状态' : 'Status' },
                ],
                rows: mediumReqs.map((r) => ({
                  id: r.id,
                  name: r.title,
                  status:
                    r.status === 'Done'
                      ? lang === 'zh'
                        ? '已完成 🟢'
                        : 'Done 🟢'
                      : r.status === 'In Progress'
                        ? lang === 'zh'
                          ? '开发中 🏃‍♂️'
                          : 'In Progress 🏃‍♂️'
                        : lang === 'zh'
                          ? '待开发 📌'
                          : 'Backlog 📌',
                })),
              },
              {
                title: lang === 'zh' ? '🟢 低优先级需求列表 (Low Priority)' : '🟢 Low Priority Requirements',
                columns: [
                  { key: 'id', label: 'ID' },
                  { key: 'name', label: lang === 'zh' ? '需求名称' : 'Requirement Title' },
                  { key: 'status', label: lang === 'zh' ? '当前执行状态' : 'Status' },
                ],
                rows: lowReqs.map((r) => ({
                  id: r.id,
                  name: r.title,
                  status:
                    r.status === 'Done'
                      ? lang === 'zh'
                        ? '已完成 🟢'
                        : 'Done 🟢'
                      : r.status === 'In Progress'
                        ? lang === 'zh'
                          ? '开发中 🏃‍♂️'
                          : 'In Progress 🏃‍♂️'
                        : lang === 'zh'
                          ? '待开发 📌'
                          : 'Backlog 📌',
                })),
              },
            ],
          },
        },
      };
    } else {
      responseText =
        lang === 'zh'
          ? `您好，我是该项目的敏捷平台智能助手。我已经深度关联了您当前选择的项目：**${currentProjObj.name}** (${currentProjObj.key})。\n\n我可以帮您做以下事情：\n1. *"分析项目当前的 Sprint 开发进展"* (生迭代柱状图大屏)\n2. *"生成我的项目缺陷严重程度分布图"* (生成故障统计饼图)\n3. *"帮我做项目需求看板状态梳理"* (快速渲染三栏卡片看板)\n4. *"创建一个新的高优先级需求"* (往此项目中快速追加需求单并展示表格)\n\n您也可以直接在对话框输入或点击下方的快捷推荐场景面板！`
          : `Greetings! I am the platform AI virtual assistant connected to project **${currentProjObj.name_en}** (${currentProjObj.key}).\n\nI can read current sprints and backlogs from the workspace to render custom layouts. You may trigger commands like:\n- *"Analyze sprint metrics progress"* (Streams velocity bar column)\n- *"Show bug severity chart"* (Streams defect density map)\n- *"Evaluate backlogs in Kanban"* (Streams kanban card blocks)\n- *"Create a high priority requirement"* (Mutates data under this project)`;

      const countsCombined = [
        { label: lang === 'zh' ? '当前项目需求数' : 'Backlog Total', value: requirements.length },
        { label: label_for_lang(lang, '待修改 Bug', 'Pending Defects'), value: bugs.filter((b) => b.status === 'Open').length },
        {
          label: label_for_lang(lang, '自动化测试跑测率', 'Test Coverage'),
          value: testSuites.length > 0 ? `${Math.round(testSuites.reduce((a, b) => a + b.coverage, 0) / testSuites.length)}%` : '0%',
        },
      ];

      schema = {
        type: 'kpis',
        title: lang === 'zh' ? '敏捷智能引擎快照看板' : 'Project Diagnostics Snapshot',
        subtitle: lang === 'zh' ? `项目对齐：${currentProjObj.name}` : `Synced with: ${currentProjObj.name_en}`,
        data: {
          kpis: countsCombined.map((c) => ({
            label: c.label,
            value: c.value,
            color: 'text-indigo-600',
            trend: 'neutral',
          })),
        },
      };
    }

    // Stream rendering simulation
    const assistantId = `ast-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      text: '',
      isStreaming: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, assistantMsg],
          };
        }
        return s;
      }),
    );

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    // Calculate a matching skill for tracing
    let tracedSkillName = '';
    let tracedDescription = '';
    if (isExecuteAnalyze) {
      tracedSkillName = 'analyze-project-iteration-progress';
      tracedDescription = '分析当前冲刺迭代进度数据';
    } else if (isSprintProgress) {
      tracedSkillName = 'analyze-project-iteration-progress';
      tracedDescription = '分析当前冲刺迭代进度数据';
    } else if (isCreateBug) {
      tracedSkillName = 'remote-bug-tracking';
      tracedDescription = '将缺陷同步至远程事件跟踪系统';
    } else if (isExecuteBugSeverity) {
      tracedSkillName = 'bug-severity-distribution';
      tracedDescription = '生成软件缺陷严重程度分布图表';
    } else if (isBugSeverity) {
      tracedSkillName = 'bug-severity-distribution';
      tracedDescription = '生成软件缺陷严重程度分布图表';
    } else if (isExecuteKanban) {
      tracedSkillName = 'requirement-kanban-alignment';
      tracedDescription = '产品需求路线图及优先级规划图';
    } else if (isKanban) {
      tracedSkillName = 'requirement-kanban-alignment';
      tracedDescription = '产品需求路线图及优先级规划图';
    } else if (isCreateRequirement) {
      tracedSkillName = 'remote-sprint-planning';
      tracedDescription = '自动生成 Jira/Scrum 背景待办事项单';
    } else {
      tracedSkillName = 'webmcp-agile-velocity';
      tracedDescription = '备用通用敏捷研发助手代理';
    }

    // Use previous skill if continuing
    if (isContinuingTrace && activeTraceRef.current?.skillName) {
      tracedSkillName = activeTraceRef.current.skillName;
    }

    if (!isContinuingTrace) {
      // Start Trace: DISCOVERED
      appendLog('DISCOVERED', tracedSkillName, cleanPrompt, '');
      await delay(50);
      // Trace: ACTIVATED
      appendLog('ACTIVATED', tracedSkillName, tracedDescription, '');

      setTraceMetrics((prev) => ({
        ...prev,
        activatedSkills: prev.activatedSkills + 1,
      }));
      await delay(50);
    }

    // If it is a continuing trace, we execute records 4 to 8 of the multi-turn scenario style
    if (isContinuingTrace) {
      // Record 4: AWAITING_USER
      appendLog('AWAITING_USER', tracedSkillName, cleanPrompt, '');
      await delay(50);
      // Record 5: EXECUTING step 2
      appendLog('EXECUTING', tracedSkillName, '当用户选择项目后，调用 `scripts/fetchIterationData.ts` 获取迭代数据', '');
      await delay(50);
      // Record 6: EXECUTING step 3
      appendLog('EXECUTING', tracedSkillName, '结合获取的图表 JSON 数据展示分析并渲染分为三大模块', '');
      await delay(50);
      // Record 7: COMPLETED
      appendLog('COMPLETED', tracedSkillName, '', '当前项目产品需求规划概览指标');
      await delay(50);
      // Record 8: EVALUATING
      appendLog('EVALUATING', tracedSkillName, '成功率 100%', 'ACTIVATE');
      setTraceMetrics((prev) => ({ ...prev, successCount: prev.successCount + 1 }));
      activeTraceRef.current = null;
    } else {
      // If it requires a form...
      if (schema?.type === 'form') {
        appendLog('EXECUTING', tracedSkillName, '使用 OpenUI 引擎生成一个包含所有项目的选择表单给用户', '生成一个包含所有项目的选择表单');
        await delay(50);
        // We will log AWAITING_USER with '等待用户在表单里输入参数' in this turn itself if desired, or let the user click to log step 14.
        // Step 14 says: "第四条记录为沿用前面的 TraceID、生命周期阶段为 AWAITING_USER... 输入参数为用户在表单里的输入内容... 输出结果为空"
        // So we wait for the input. Let's record the traceRef to capture continuing scenario.
        activeTraceRef.current = { traceId, isAwaitingUser: true, skillName: tracedSkillName };
      } else {
        appendLog('EXECUTING', tracedSkillName, '调用获取目标迭代或看板状态最新数据的 API', '数据获取并解析成功');
        await delay(50);
        appendLog('EXECUTING', tracedSkillName, '结合获取的图表 JSON 数据展示分析并渲染模块', '已成功渲染数据图表可视化模块');
        await delay(100);
        appendLog('COMPLETED', tracedSkillName, '', '当前执行周期结果渲染完成');
        await delay(50);
        appendLog('EVALUATING', tracedSkillName, '成功率 100%', 'ACTIVATE');
        setTraceMetrics((prev) => ({ ...prev, successCount: prev.successCount + 1 }));
        activeTraceRef.current = null;
      }
    }

    const textLength = responseText.length;
    let currentText = '';
    const step = Math.max(1, Math.floor(textLength / 12));

    for (let i = 0; i < textLength; i += step) {
      await delay(30);
      currentText = responseText.slice(0, i + step);
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: s.messages.map((m) => (m.id === assistantId ? { ...m, text: currentText } : m)),
            };
          }
          return s;
        }),
      );
    }

    await delay(100);
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === assistantId ? { ...m, text: responseText, uiSchema: schema, isStreaming: false } : m,
            ),
          };
        }
        return s;
      }),
    );
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
        setCurrentScreen,
        theme,
        setTheme,
        lang,
        setLang,
        llmConfig,
        setLlmConfig,
        chatHistory,
        isLoggedIn,
        setIsLoggedIn,

        // Multi projects
        projects,
        currentProjectId,
        setCurrentProjectId,

        // Multiple chat histories
        sessions,
        currentSessionId,
        setCurrentSessionId,
        createNewSession,
        deleteSession,

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
        sendChatMessage,
        clearChat,

        traceLogs,
        traceMetrics,
        clearTraceLogs,
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

function label_for_lang(lang: 'zh' | 'en', zh: string, en: string): string {
  return lang === 'zh' ? zh : en;
}
