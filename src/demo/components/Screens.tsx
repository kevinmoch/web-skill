import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAgileData } from '../context/AgileDataContext';
import { translations } from '../utils/translations';
import { Requirement, Sprint, Bug, TestSuite } from '../mock/staticData';
import { Plus, Search, Trash2, Edit3, TrendingUp, Layers, Workflow, Bug as BugIcon, GraduationCap, Activity, CheckCircle, Code, ChevronRight, Briefcase, FileCheck, Info } from 'lucide-react';

const getEpicTranslation = (epic: string | undefined | null, lang: 'zh' | 'en'): string => {
  if (!epic) return '';
  if (lang === 'zh') return epic;

  const mapping: Record<string, string> = {
    用户中心安全: 'Auth Security',
    智能卡片模块: 'Smart Card Module',
    智能卡片模版: 'Smart Card Template',
    交互看板模块: 'Interactive Kanban',
    数据存储层安全: 'Data Security',
    效能质量跑测: 'QA Automation',
    拖拽流程配置: 'Flow Config',
    云原生容器发布: 'Cloud Native Deploy',
    质量门槛卡扣: 'Quality Gate',
    精准RAG知识检索: 'Precise RAG',
    大模型总结应用: 'LLM Summarization'
  };

  return mapping[epic] || epic;
};

// ==========================================
// 1. OVERVIEW SCREEN
// ==========================================
export const OverviewScreen: React.FC = () => {
  const { requirements, sprints, bugs, testSuites, lang, setCurrentScreen, projects, currentProjectId } = useAgileData();
  const t = translations[lang];

  // Selected project details
  const activeProject = projects.find((p) => p.id === currentProjectId) || projects[0];

  // Active Sprint
  const activeSprint = sprints.find((s) => s.status === 'Active') ||
    sprints[0] || {
      id: 'NONE',
      name: 'None',
      name_en: 'None',
      startDate: '-',
      endDate: '-',
      progress: 0,
      velocity: 0,
      status: 'Planned',
      goal: '-',
      goal_en: '-',
      projectId: 'NONE'
    };

  // High-value counts sourced strictly from Context Mock data
  const totalRequirements = requirements.length;
  const todoReqs = requirements.filter((r) => r.status === 'Todo').length;
  const inProgressReqs = requirements.filter((r) => r.status === 'In Progress').length;
  const doneReqs = requirements.filter((r) => r.status === 'Done').length;
  const totalStoryPoints = requirements.reduce((acc, r) => acc + (r.storyPoints || 0), 0);
  const doneStoryPoints = requirements.filter((r) => r.status === 'Done').reduce((acc, r) => acc + (r.storyPoints || 0), 0);

  // Bug calculations
  const openBugsCount = bugs.filter((b) => b.status === 'Open').length;
  const fixedBugsCount = bugs.filter((b) => b.status === 'Fixed').length;
  const criticalBugs = bugs.filter((b) => b.status === 'Open' && b.severity === 'Critical').length;
  const majorBugs = bugs.filter((b) => b.status === 'Open' && b.severity === 'Major').length;
  const minorBugs = bugs.filter((b) => b.status === 'Open' && b.severity === 'Minor').length;

  // Test suite stats
  const totalSuites = testSuites.length;
  const avgCoverage = totalSuites > 0 ? Math.round(testSuites.reduce((sum, suite) => sum + suite.coverage, 0) / totalSuites) : 0;
  const avgPassRate = totalSuites > 0 ? Math.round(testSuites.reduce((sum, suite) => sum + suite.passRate, 0) / totalSuites) : 100;

  return (
    <div className="space-y-6 animate-fadeIn" id="overview-screen">
      {/* 1. Page Header with Selected Project Context banner */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded">
              PROJECT KEY: {activeProject.key}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1.5 flex items-center gap-1.5">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <span>{lang === 'zh' ? activeProject.name : activeProject.name_en}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">{lang === 'zh' ? '该全景图基于该项目内真实的需求积压、迭代、缺陷以及编译测试套件自动汇总。' : 'This workspace aggregates live sprint items, backlog tickets, QA blocks, and pipeline status.'}</p>
        </div>
        <div className="flex items-center space-x-3 text-xs shrink-0 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-2 rounded-xl">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-pulse" />
          <span className="font-mono text-slate-600 dark:text-slate-350 font-bold">{lang === 'zh' ? '状态：活跃' : 'STATUS: LIVE ACTIVE'}</span>
        </div>
      </div>

      {/* 2. Responsive KPIs Row (105% grounded in mock statistics, removing Lead Time fiction) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="agile-real-kpis">
        {/* Card 1: Requirements Total */}
        <div onClick={() => setCurrentScreen('requirements')} className="p-4 bg-white dark:bg-[#111823] border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-550 shadow-xs cursor-pointer transition group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">{lang === 'zh' ? '需求积压总数' : 'Requirements back'}</span>
            <Layers className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div>
              <span className="text-2.5xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">{totalRequirements}</span>
              <span className="text-xs text-slate-455 font-mono ml-1">{lang === 'zh' ? '个' : 'items'}</span>
            </div>
            <span className="text-[10px] text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded font-bold font-mono">{totalStoryPoints} SP</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-bold flex space-x-2">
            <span>Todo: {todoReqs}</span>
            <span>•</span>
            <span>Doing: {inProgressReqs}</span>
          </div>
        </div>

        {/* Card 2: Active Sprint Progress */}
        <div onClick={() => setCurrentScreen('sprints')} className="p-4 bg-white dark:bg-[#111823] border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500 shadow-xs cursor-pointer transition group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">{lang === 'zh' ? '当前迭代进度' : 'Active Sprint Burn'}</span>
            <Workflow className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div>
              <span className="text-2.5xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">{activeSprint.progress}%</span>
            </div>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest bg-amber-50 border border-amber-100 text-amber-600 dark:bg-amber-950/40 dark:border-amber-900 font-mono px-1">{activeSprint.status}</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 dark:text-slate-505 font-semibold truncate">Goal: {activeSprint ? (lang === 'zh' ? activeSprint.goal : activeSprint.goal_en) : '-'}</div>
        </div>

        {/* Card 3: Defect Risk Monitor */}
        <div onClick={() => setCurrentScreen('bugs')} className="p-4 bg-white dark:bg-[#111823] border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-red-500 shadow-xs cursor-pointer transition group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">{lang === 'zh' ? '遗留未解缺陷' : 'Pending Defects'}</span>
            <BugIcon className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div>
              <span className="text-2.5xl font-extrabold font-mono tracking-tight text-rose-500 dark:text-rose-450">{openBugsCount}</span>
              <span className="text-xs text-rose-455 font-mono ml-1">{lang === 'zh' ? '挂起' : 'open'}</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono ${criticalBugs > 0 ? 'bg-red-50 text-red-600 dark:bg-red-950/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>CRIT: {criticalBugs}</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-bold flex space-x-2">
            <span>Major: {majorBugs}</span>
            <span>•</span>
            <span>Minor: {minorBugs}</span>
          </div>
        </div>

        {/* Card 4: Quality Gate status */}
        <div onClick={() => setCurrentScreen('tests')} className="p-4 bg-white dark:bg-[#111823] border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-emerald-500 shadow-xs cursor-pointer transition group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">{lang === 'zh' ? '自动化测试阀门' : 'Auto Quality Gate'}</span>
            <CheckCircle className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div>
              <span className="text-2.5xl font-extrabold font-mono tracking-tight text-emerald-500 dark:text-emerald-400">{avgPassRate}%</span>
              <span className="text-[10px] text-slate-400 block">{lang === 'zh' ? '平均通过率' : 'Avg Pass'}</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-mono">COV: {avgCoverage}%</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-bold flex space-x-2">
            <span>Suites: {totalSuites}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Data layout blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Double column (Active sprints details and requirements breakdown) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Sprint Progress card */}
          <div className="bg-white dark:bg-[#111827] border border-zinc-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 select-none">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono flex items-center">
                <Workflow className="w-3.5 h-3.5 mr-1.5 text-indigo-650" />
                {lang === 'zh' ? '当前活跃迭代周期' : 'ACTIVE EXECUTING SPRINT'}
              </h3>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">{activeSprint.progress}% Complete</span>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-[#F8FAFC] dark:bg-[#111827] p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
                <div>
                  <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white leading-normal">{lang === 'en' && activeSprint.name_en ? activeSprint.name_en : activeSprint.name}</h4>
                  <p className="text-[11px] text-zinc-400 font-mono mt-1 font-medium">
                    🗓️ Scope: {activeSprint.startDate} → {activeSprint.endDate}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 font-bold font-mono uppercase block">{lang === 'zh' ? '迭代周期故事点容量' : 'Sprint commitment'}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5 font-mono">{activeSprint.velocity} story points</span>
                </div>
              </div>

              {/* Progress visual bar */}
              <div className="space-y-1.5">
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative flex items-center shadow-inner select-none">
                  <div className="h-full bg-linear-to-r from-indigo-550 to-indigo-600 rounded-xl transition-all duration-500" style={{ width: `${activeSprint.progress}%` }} />
                  <span className="absolute right-3.5 text-[9px] font-bold text-zinc-500 dark:text-zinc-450 font-mono">
                    {lang === 'zh' ? `已燃尽 ${doneStoryPoints} SP / 共 ${totalStoryPoints} SP` : `Burned ${doneStoryPoints} SP out of ${totalStoryPoints} SP`}
                  </span>
                </div>
              </div>

              {/* Sub-distribution row */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-100 dark:border-slate-800/60 font-mono text-center select-none">
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-zinc-450 font-bold uppercase block">ToDo</span>
                  <span className="text-base font-extrabold text-zinc-700 dark:text-zinc-300 block mt-0.5">
                    {todoReqs} <span className="text-[10px] font-normal text-slate-400">({lang === 'zh' ? '待开发' : 'iss'})</span>
                  </span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border-x border-slate-100">
                  <span className="text-[10px] text-zinc-450 font-bold uppercase block">In Progress</span>
                  <span className="text-base font-extrabold text-blue-500 block mt-0.5">
                    {inProgressReqs} <span className="text-[10px] font-normal text-slate-400">({lang === 'zh' ? '处理中' : 'iss'})</span>
                  </span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <span className="text-[10px] text-zinc-450 font-bold uppercase block">Done</span>
                  <span className="text-base font-extrabold text-emerald-500 block mt-0.5">
                    {doneReqs} <span className="text-[10px] font-normal text-slate-400">({lang === 'zh' ? '已完成' : 'iss'})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Test Suites coverage block */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono flex items-center">
                <FileCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-550" />
                {lang === 'zh' ? 'DevOps 质量流水线编译测试套件' : 'AUTOMATED PIPE TEST SUITES'}
              </h3>
              <span className="text-xs font-bold text-emerald-500 font-mono">{lang === 'zh' ? `平均通过率: ${avgPassRate}%` : `Gate: ${avgPassRate}% avg pass`}</span>
            </div>

            <div className="space-y-2.5">
              {testSuites.slice(0, 3).map((suite) => (
                <div key={suite.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-zinc-900/40 border border-slate-200/60 dark:border-slate-800/80">
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block truncate leading-relaxed">{lang === 'en' && suite.suite_en ? suite.suite_en : suite.suite}</span>
                    <div className="flex items-center space-x-2 text-[10px] text-zinc-400 font-mono font-medium mt-1">
                      <span>Coverage: {suite.coverage}%</span>
                      <span>•</span>
                      <span>Total: {suite.totalCases} cases</span>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 rounded-sm font-semibold text-[9px] font-mono tracking-wider ${
                          suite.status === 'Passed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/45 dark:text-rose-450'
                        }`}
                      >
                        {suite.status === 'Passed' ? 'PASSED' : 'FAILED'}
                      </span>
                      <div className="text-[10px] text-zinc-400 mt-0.5 font-mono font-medium">{suite.passRate}% pass</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-right">
              <button onClick={() => setCurrentScreen('tests')} className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition inline-flex items-center font-mono cursor-pointer">
                <span>{lang === 'zh' ? `管理全部 ${totalSuites} 个测试套件` : 'View all quality suites'}</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Single column (Bug classifications, severity graphs) */}
        <div className="space-y-6">
          {/* Bug Severity distribution chart */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono mb-4 flex items-center">
              <BugIcon className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
              {lang === 'zh' ? '活跃迭代缺陷严重程度分布' : 'DEFECT SEVERITY RISK'}
            </h3>

            <div className="space-y-4 select-none">
              {/* Critical */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0" />
                    <span>{lang === 'zh' ? '阻碍级致命' : 'Critical blockers'}</span>
                  </div>
                  <span className="font-mono text-rose-500">{criticalBugs}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-md overflow-hidden">
                  <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${openBugsCount > 0 ? (criticalBugs / openBugsCount) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Major */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0" />
                    <span>{lang === 'zh' ? '严重故障' : 'Major failures'}</span>
                  </div>
                  <span className="font-mono text-amber-500">{majorBugs}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-md overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${openBugsCount > 0 ? (majorBugs / openBugsCount) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Minor */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                    <span>{lang === 'zh' ? '微弱瑕疵' : 'Minor issues'}</span>
                  </div>
                  <span className="font-mono text-emerald-500">{minorBugs}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-900 rounded-md overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${openBugsCount > 0 ? (minorBugs / openBugsCount) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Divider Total details */}
              <div className="border-t border-zinc-150 dark:border-slate-800/60 pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold font-mono uppercase tracking-wider block">{lang === 'zh' ? '待开发/未解决缺陷总计' : 'ACTIVE DEFECT TOTALS'}</span>
                  <span className="text-2xl font-black font-mono tracking-tight text-zinc-850 dark:text-white mt-1 block">
                    {openBugsCount} <span className="text-xs text-rose-500 font-bold uppercase font-sans">{lang === 'zh' ? '个未解决' : 'Open'}</span>
                  </span>
                </div>
                <button
                  onClick={() => setCurrentScreen('bugs')}
                  className="p-2 px-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-slate-100/80 dark:hover:bg-zinc-700 text-indigo-650 dark:text-indigo-400 border border-zinc-200 dark:border-zinc-700/80 rounded-xl transition flex items-center justify-center text-[10px] font-bold cursor-pointer"
                >
                  {lang === 'zh' ? '缺陷分级中心' : 'Defect console'}
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Prompt Engine Copilot Tip box */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/40 dark:bg-zinc-900/30 dark:border-slate-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-2 leading-relaxed">
            <h4 className="font-bold text-slate-850 dark:text-zinc-200 flex items-center">
              <Code className="w-4 h-4 mr-1 text-indigo-650" />
              <span>{lang === 'zh' ? '敏捷平台智能助手' : 'Agile Assistant Copilot'}</span>
            </h4>
            <p className="font-medium text-zinc-550 dark:text-zinc-400">
              {lang === 'zh'
                ? "试一试在右侧助手发送 '帮我分析项目迭代进展'。AI 秘书可以智能化抓取该协同视窗背后的 JSON 数据集，通过流式 UI 实时渲染漂亮的报告图表！"
                : "Try typing 'Compare Sprint progress stats' in the assistant dialogue panel to stream custom GenUI layout metrics."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. REQUIREMENTS SCREEN (JIRA-STYLE BACKLOG)
// ==========================================
export const RequirementsScreen: React.FC = () => {
  const { requirements, addRequirement, updateRequirement, deleteRequirement, lang, projects, currentProjectId } = useAgileData();
  const t = translations[lang];

  const activeProject = projects.find((p) => p.id === currentProjectId) || projects[0];

  // Filters & Modal toggles
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);

  // Model editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [formStatus, setFormStatus] = useState<'Todo' | 'In Progress' | 'Done'>('Todo');
  const [formDesc, setFormDesc] = useState('');
  const [formReporter, setFormReporter] = useState('');
  const [formAssignee, setFormAssignee] = useState('');
  const [formStoryPoints, setFormStoryPoints] = useState<number | ''>('');
  const [formEpic, setFormEpic] = useState('');

  const openAddModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormPriority('Medium');
    setFormStatus('Todo');
    setFormDesc('');
    setFormReporter('');
    setFormAssignee('');
    setFormStoryPoints('');
    setFormEpic('');
    setShowModal(true);
  };

  const openEditModal = (req: Requirement) => {
    setEditingId(req.id);
    setFormTitle(lang === 'en' && req.title_en ? req.title_en : req.title);
    setFormPriority(req.priority);
    setFormStatus(req.status);
    setFormDesc((lang === 'en' && req.description_en ? req.description_en : req.description) || '');
    setFormReporter(lang === 'en' && req.reporter_en ? req.reporter_en : req.reporter);
    setFormAssignee((lang === 'en' && req.assignee_en ? req.assignee_en : req.assignee) || '');
    setFormStoryPoints(req.storyPoints || 3);
    setFormEpic((lang === 'en' && req.epic_en ? req.epic_en : req.epic) || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const dataPayload = {
      title: formTitle,
      priority: formPriority,
      status: formStatus,
      description: formDesc,
      reporter: formReporter || 'Kevin',
      assignee: formAssignee || 'Unassigned',
      storyPoints: Number(formStoryPoints),
      epic: formEpic || 'General Epic',
      createdDate: new Date().toISOString().split('T')[0]
    };

    if (editingId) {
      updateRequirement({ ...dataPayload, id: editingId, projectId: currentProjectId });
    } else {
      addRequirement(dataPayload);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteRequirement(id);
  };

  // Filter queries
  const filtered = requirements.filter((r) => {
    const matchesSearch =
      (lang === 'en' && r.title_en ? r.title_en : r.title).toLowerCase().includes(search.toLowerCase()) ||
      ((lang === 'en' && r.reporter_en ? r.reporter_en : r.reporter) && (lang === 'en' && r.reporter_en ? r.reporter_en : r.reporter).toLowerCase().includes(search.toLowerCase())) ||
      ((lang === 'en' && r.assignee_en ? r.assignee_en : r.assignee) && (lang === 'en' && r.assignee_en ? r.assignee_en : r.assignee)?.toLowerCase().includes(search.toLowerCase())) ||
      (r.id && r.id.toLowerCase().includes(search.toLowerCase())) ||
      ((lang === 'en' && r.epic_en ? r.epic_en : r.epic) && (lang === 'en' && r.epic_en ? r.epic_en : r.epic)?.toLowerCase().includes(search.toLowerCase()));
    const matchesPriority = priorityFilter === 'All' || r.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6 animate-fadeIn text-xs" id="requirements-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <Layers className="w-5 h-5 text-indigo-650" />
            <span>{t.requirements.title}</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-mono font-bold leading-none">{lang === 'zh' ? `项目「${activeProject.name}」需求管理看板` : `Requirements for project ${activeProject.key}`}</p>
        </div>
        <button onClick={openAddModal} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition duration-150 flex items-center space-x-1 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>{lang === 'zh' ? '创建需求/故事' : 'Create Requirement/Story'}</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-white dark:bg-zinc-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800" id="requirements-filter-bar">
        <div className="relative flex-1 w-full flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'zh' ? '搜索需求 ID、经办人、史诗模块、关键字...' : 'Search by ID, assignee, Epic or keyterms...'}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-555 font-medium"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-full sm:w-44 text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-505 font-semibold cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
        >
          <option value="All" className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
            {lang === 'zh' ? '⚡ 过滤全部优先级' : 'Filter Priority: All'}
          </option>
          <option value="High" className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
            {lang === 'zh' ? '🔴 高优先级' : 'High Priority'}
          </option>
          <option value="Medium" className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
            {lang === 'zh' ? '🟡 中优先级' : 'Medium Priority'}
          </option>
          <option value="Low" className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
            {lang === 'zh' ? '🟢 低优先级' : 'Low Priority'}
          </option>
        </select>
      </div>

      {/* Backlog list table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-zinc-950 shadow-xs" id="requirements-backlog-board">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-slate-800 text-zinc-500 dark:text-zinc-400 font-bold select-none uppercase tracking-wide">
                <th className="p-4 w-24">{lang === 'zh' ? '需求 ID' : 'Key ID'}</th>
                <th className="p-4">{lang === 'zh' ? '概况信息与描述' : 'Summary & Scope'}</th>
                <th className="p-4 w-32">{lang === 'zh' ? '史诗模块' : 'Epic Story'}</th>
                <th className="p-4 w-28">{lang === 'zh' ? '优先级' : 'Priority'}</th>
                <th className="p-4 w-28">{lang === 'zh' ? '状态' : 'Status'}</th>
                <th className="p-4 w-28">{lang === 'zh' ? '经办人' : 'Assignee'}</th>
                <th className="p-4 w-20 text-center">{lang === 'zh' ? '点数' : 'SP'}</th>
                <th className="p-4 text-right w-24">{lang === 'zh' ? '操作' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-xs text-zinc-400 italic">
                    {lang === 'zh' ? '暂无匹配的敏捷需求或故事记录' : 'No Scrum backlog issues matched search.'}
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="border-b last:border-0 border-slate-100 dark:border-slate-800/60 hover:bg-zinc-50/45 dark:hover:bg-zinc-900/10 transition">
                    {/* KEY ID */}
                    <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 select-all">{req.id}</td>

                    {/* SUMMARY & DESCRIPTION */}
                    <td className="p-4">
                      <div className="max-w-[280px] sm:max-w-[380px]">
                        <span className="font-extrabold text-zinc-850 dark:text-zinc-200 block leading-relaxed">{lang === 'en' && req.title_en ? req.title_en : req.title}</span>
                        {(lang === 'en' && req.description_en ? req.description_en : req.description) && (
                          <span className="text-xs text-zinc-400 block mt-1 line-clamp-1">{lang === 'en' && req.description_en ? req.description_en : req.description}</span>
                        )}
                      </div>
                    </td>

                    {/* EPIC STORY LINK */}
                    <td className="p-4">
                      {(lang === 'en' && req.epic_en ? req.epic_en : req.epic) ? (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-650 border border-purple-100 font-mono text-[9px] font-bold block truncate max-w-[120px] text-center dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900">
                          🎯 {getEpicTranslation(lang === 'en' && req.epic_en ? req.epic_en : req.epic, lang)}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">-</span>
                      )}
                    </td>

                    {/* JIRA PRIORITY */}
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                          req.priority === 'High'
                            ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/30'
                            : req.priority === 'Medium'
                              ? 'bg-amber-100/50 text-amber-600 border border-amber-200 dark:bg-amber-950/30'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400'
                        }`}
                      >
                        {req.priority === 'High' ? '🔴 High' : req.priority === 'Medium' ? '🟡 Medium' : '🟢 Low'}
                      </span>
                    </td>

                    {/* JIRA STATUS */}
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                          req.status === 'Done'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/35 dark:text-emerald-400'
                            : req.status === 'In Progress'
                              ? 'bg-sky-50 text-sky-650 dark:bg-sky-950/35 dark:text-sky-400'
                              : 'bg-slate-100 border text-slate-500 dark:bg-slate-800'
                        }`}
                      >
                        {req.status === 'Done' ? 'DONE' : req.status === 'In Progress' ? 'IN PROGRESS' : 'TO DO'}
                      </span>
                    </td>

                    {/* ASSIGNEE */}
                    <td className="p-4 text-zinc-600 dark:text-zinc-300 font-bold font-mono">
                      <span className="truncate max-w-[80px]">{(lang === 'en' && req.assignee_en ? req.assignee_en : req.assignee) || 'Unassigned'}</span>
                    </td>

                    {/* STORY POINTS SP */}
                    <td className="p-4 text-center font-mono font-bold">
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-200 inline-block text-center leading-6 font-semibold shadow-inner-sm">{req.storyPoints || 1}</span>
                    </td>

                    {/* ACTION TRIGGERS */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => openEditModal(req)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-indigo-600 rounded-lg transition cursor-pointer" title="Configure Issue">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(req.id)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 rounded-lg transition cursor-pointer" title="Purge Card">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JIRA Issue Editor modal */}
      {showModal &&
        createPortal(
          <div id="requirement-crud-modal" className="absolute inset-0 z-[1100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto relative z-10 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  🔧 {editingId ? (lang === 'zh' ? `编辑需求/故事 [${editingId}]` : `Edit Requirement/Story [${editingId}]`) : lang === 'zh' ? '创建新需求/故事' : 'Create Requirement/Story'}
                </h3>
                <span className="text-[10px] font-mono font-bold text-slate-400">{lang === 'zh' ? '状态引擎' : 'Status Engine'}</span>
              </div>

              <form onSubmit={handleSave} className="space-y-4 pt-1 text-slate-800 dark:text-zinc-200">
                {/* Summary */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">{lang === 'zh' ? '概要' : 'Summary Title'}</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-555 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Epic */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">{lang === 'zh' ? '关联史诗' : 'Epic Link'}</label>
                    <input
                      type="text"
                      required
                      value={formEpic}
                      onChange={(e) => setFormEpic(e.target.value)}
                      placeholder={lang === 'zh' ? '例如 支付网关' : 'e.g. Payment Gateway'}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-555"
                    />
                  </div>
                  {/* Story Points */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">{lang === 'zh' ? '估算故事点' : 'Story Points'}</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={13}
                      value={formStoryPoints}
                      onChange={(e) => setFormStoryPoints(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-555"
                    />
                  </div>
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">{lang === 'zh' ? '优先级' : 'Priority'}</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as any)}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-indigo-555 font-bold cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                    >
                      <option value="High" className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        {lang === 'zh' ? '🔴 高优先级' : '🔴 High Priority'}
                      </option>
                      <option value="Medium" className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        {lang === 'zh' ? '🟡 中优先级' : '🟡 Medium Priority'}
                      </option>
                      <option value="Low" className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        {lang === 'zh' ? '🟢 低优先级' : '🟢 Low Priority'}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">{lang === 'zh' ? '状态' : 'Status'}</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-indigo-555 font-bold cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                    >
                      <option value="Todo" className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        {lang === 'zh' ? '待开发' : 'TO DO'}
                      </option>
                      <option value="In Progress" className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        {lang === 'zh' ? '进行中' : 'IN PROGRESS'}
                      </option>
                      <option value="Done" className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        {lang === 'zh' ? '已关闭' : 'DONE'}
                      </option>
                    </select>
                  </div>
                </div>

                {/* Assignee / Reporter */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">{lang === 'zh' ? '经办人' : 'Assignee'}</label>
                    <input
                      type="text"
                      value={formAssignee}
                      onChange={(e) => setFormAssignee(e.target.value)}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-indigo-555 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">{lang === 'zh' ? '报告人' : 'Reporter'}</label>
                    <input
                      type="text"
                      value={formReporter}
                      onChange={(e) => setFormReporter(e.target.value)}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-indigo-555 font-bold"
                    />
                  </div>
                </div>

                {/* Desc Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">{lang === 'zh' ? '详细说明信息' : 'Specification Description'}</label>
                  <textarea
                    rows={3}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-indigo-555 leading-relaxed"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3.5 py-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer"
                  >
                    {t.actions.cancel}
                  </button>
                  <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer text-xs">
                    {lang === 'zh' ? '保存' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.getElementById('main-content-wrapper') || document.body
        )}
    </div>
  );
};

// ==========================================
// 3. SPRINTS SCREEN (KANBAN ACTIVE SPRINT BOARD)
// ==========================================
export const SprintsScreen: React.FC = () => {
  const { sprints, requirements, updateRequirement, lang } = useAgileData();
  const t = translations[lang];

  // Current Active Sprint
  const activeSprint = sprints.find((s) => s.status === 'Active') || sprints[0];

  // Quick State trigger to move requirement state
  const handleMoveStatus = (id: string, nextStatus: 'Todo' | 'In Progress' | 'Done') => {
    const ticket = requirements.find((r) => r.id === id);
    if (ticket) {
      updateRequirement({ ...ticket, status: nextStatus });
    }
  };

  // Scrum Board columns
  const todoTickets = requirements.filter((r) => r.status === 'Todo');
  const doingTickets = requirements.filter((r) => r.status === 'In Progress');
  const doneTickets = requirements.filter((r) => r.status === 'Done');

  return (
    <div className="space-y-6 animate-fadeIn text-xs" id="sprints-board-view">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <Workflow className="w-5 h-5 text-indigo-650" />
            <span>{lang === 'zh' ? '迭代管理看板' : 'Sprint Kanban Board'}</span>
          </h2>
          <div className="flex items-center space-x-2 mt-1 font-mono font-bold leading-none">
            <span className="text-sky-600 bg-sky-50 dark:bg-sky-950/45 dark:text-sky-400 px-1.5 py-0.5 rounded text-[10px] uppercase animate-pulse">{lang === 'zh' ? '● 活跃执行中' : '● ACTIVE IMPL'}</span>
            <span className="text-slate-400 dark:text-slate-500 font-sans font-medium text-xs">{activeSprint ? (lang === 'en' && activeSprint.name_en ? activeSprint.name_en : activeSprint.name) : 'Loading active cycle'}</span>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono font-bold flex space-x-4 items-center">
          <div>
            <span className="text-[9px] text-slate-400 dark:text-zinc-450 uppercase block">{lang === 'zh' ? '已收尾已燃尽' : 'Burned SP'}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 block mt-0.5">{requirements.filter((r) => r.status === 'Done').reduce((sum, r) => sum + (r.storyPoints || 0), 0)} SP</span>
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-zinc-700" />
          <div>
            <span className="text-[9px] text-slate-400 dark:text-zinc-450 uppercase block">{lang === 'zh' ? '迭代容量速率' : 'Total Velocity'}</span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 block mt-0.5">{activeSprint ? activeSprint.velocity : 40} SP</span>
          </div>
        </div>
      </div>

      {/* Kanban Board columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" id="scrum-kanban-rack">
        {/* Column 1: TO DO */}
        <div className="bg-[#F4F5F7] dark:bg-zinc-900/60 rounded-xl p-3.5 flex flex-col h-[70vh] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3 px-1 select-none">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
              <span className="font-extrabold text-slate-700 dark:text-slate-300 font-sans uppercase">{lang === 'zh' ? '待办' : 'TODO'}</span>
            </div>
            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded font-mono font-bold text-[10px]">{todoTickets.length}</span>
          </div>

          <div
            className="flex-1 overflow-y-auto space-y-2.5 pr-1"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const ticketId = e.dataTransfer.getData('text/plain');
              if (ticketId) handleMoveStatus(ticketId, 'Todo');
            }}
          >
            {todoTickets.length === 0 ? (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-350 rounded-xl py-12 italic text-slate-400">{lang === 'zh' ? '暂无待办需求' : 'Column Clear'}</div>
            ) : (
              todoTickets.map((tc) => (
                <div
                  key={tc.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', tc.id)}
                  className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition duration-150 flex flex-col justify-between h-28 cursor-grab active:cursor-grabbing"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-zinc-400 font-bold">{tc.id}</span>
                      {tc.epic && (
                        <span className="text-[8px] px-1 bg-purple-50 text-purple-650 rounded border border-purple-100 font-bold max-w-[80px] truncate leading-none dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900">
                          {lang === 'en' && tc.epic_en ? tc.epic_en : getEpicTranslation(tc.epic, lang)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">{lang === 'en' && tc.title_en ? tc.title_en : tc.title}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 mt-2 select-none">
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] font-mono px-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full font-bold">{tc.storyPoints} SP</span>
                    </div>
                    <button
                      onClick={() => handleMoveStatus(tc.id, 'In Progress')}
                      className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-600 rounded text-[9px] font-bold hover:bg-indigo-600 hover:text-white transition cursor-pointer dark:bg-indigo-950/40 dark:border-indigo-900/40 dark:text-indigo-400 dark:hover:bg-indigo-600 dark:hover:text-white"
                    >
                      {lang === 'zh' ? '开始研发 →' : 'Start Work →'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: IN PROGRESS */}
        <div className="bg-[#EAEFFF] dark:bg-zinc-900/40 rounded-xl p-3.5 flex flex-col h-[70vh] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3 px-1 select-none">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-550 inline-block animate-pulse" />
              <span className="font-extrabold text-[#3B82F6] font-sans uppercase">{lang === 'zh' ? '进行中' : 'IN PROGRESS'}</span>
            </div>
            <span className="px-2 py-0.5 bg-blue-105 bg-blue-100 dark:bg-slate-800 text-[#1E3A8A] dark:text-sky-300 rounded font-mono font-bold text-[10px]">{doingTickets.length}</span>
          </div>

          <div
            className="flex-1 overflow-y-auto space-y-2.5 pr-1"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const ticketId = e.dataTransfer.getData('text/plain');
              if (ticketId) handleMoveStatus(ticketId, 'In Progress');
            }}
          >
            {doingTickets.length === 0 ? (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-blue-200 rounded-xl py-12 italic text-blue-400">{lang === 'zh' ? '团队休息中' : 'No executing issues'}</div>
            ) : (
              doingTickets.map((tc) => (
                <div
                  key={tc.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', tc.id)}
                  className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition duration-150 flex flex-col justify-between h-28 cursor-grab active:cursor-grabbing"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-zinc-400 font-bold">{tc.id}</span>
                      {tc.epic && (
                        <span className="text-[8px] px-1 bg-purple-50 text-purple-650 rounded border border-purple-100 font-bold max-w-[80px] truncate leading-none dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900">
                          {lang === 'en' && tc.epic_en ? tc.epic_en : getEpicTranslation(tc.epic, lang)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">{lang === 'en' && tc.title_en ? tc.title_en : tc.title}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 mt-2 select-none">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-mono px-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full font-bold">{tc.storyPoints} SP</span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleMoveStatus(tc.id, 'Todo')}
                        className="px-1 px-1.2 py-0.5 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-750 text-slate-500 dark:text-slate-300 rounded text-[9px] font-bold transition cursor-pointer"
                      >
                        ← Todo
                      </button>
                      <button
                        onClick={() => handleMoveStatus(tc.id, 'Done')}
                        className="px-1 px-1.2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-152 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-bold hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition cursor-pointer"
                      >
                        {lang === 'zh' ? '提交DONE' : 'Done ✔'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: DONE */}
        <div className="bg-[#EAFDF7] dark:bg-zinc-900/30 rounded-xl p-3.5 flex flex-col h-[70vh] border border-slate-200/45 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3 px-1 select-none">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-55 bg-emerald-500 inline-block" />
              <span className="font-extrabold text-emerald-600 font-sans uppercase">{lang === 'zh' ? '已关闭' : 'DONE'}</span>
            </div>
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 rounded font-mono font-bold text-[10px]">{doneTickets.length}</span>
          </div>

          <div
            className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-slate-800"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const ticketId = e.dataTransfer.getData('text/plain');
              if (ticketId) handleMoveStatus(ticketId, 'Done');
            }}
          >
            {doneTickets.length === 0 ? (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-emerald-200 rounded-xl py-12 italic text-emerald-400">{lang === 'zh' ? '暂无关闭任务' : 'Burn down some tickets'}</div>
            ) : (
              doneTickets.map((tc) => (
                <div
                  key={tc.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', tc.id)}
                  className="bg-white/80 dark:bg-zinc-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between h-28 opacity-80 cursor-grab active:cursor-grabbing"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between select-none">
                      <span className="text-[9px] font-mono text-zinc-400 underline decoration-emerald-200 font-bold">{tc.id}</span>
                      <span className="inline-flex items-center justify-center text-[8px] bg-emerald-50 dark:bg-[#112F25] text-emerald-600 dark:text-emerald-400 px-1 rounded-sm font-bold font-sans uppercase border border-transparent dark:border-[#1E6B4F]/30">
                        {lang === 'zh' ? '已关闭' : 'CLOSED'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed line-through">{lang === 'en' && tc.title_en ? tc.title_en : tc.title}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 mt-2 select-none">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-50 dark:bg-[#112F25] text-emerald-600 dark:text-emerald-400 rounded-full font-bold">
                      {tc.storyPoints} {lang === 'zh' ? '故事点' : 'SP'}
                    </span>
                    <button
                      onClick={() => handleMoveStatus(tc.id, 'In Progress')}
                      className="px-1.5 py-0.5 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-750 text-slate-500 dark:text-slate-300 rounded text-[8px] font-bold cursor-pointer"
                    >
                      ↺ {lang === 'zh' ? '重新开启' : 'Reopen'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. BUGS SCREEN (JIRA DEFECT BOARD)
// ==========================================
export const BugsScreen: React.FC = () => {
  const { bugs, addBug, updateBug, deleteBug, lang, projects, currentProjectId } = useAgileData();
  const t = translations[lang];

  const activeProject = projects.find((p) => p.id === currentProjectId) || projects[0];

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formSeverity, setFormSeverity] = useState<'Critical' | 'Major' | 'Minor'>('Major');
  const [formStatus, setFormStatus] = useState<'Open' | 'Fixed' | 'Closed'>('Open');
  const [formModule, setFormModule] = useState('');
  const [formAssignee, setFormAssignee] = useState('');
  const [formReporter, setFormReporter] = useState('');

  const openAddModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormSeverity('Major');
    setFormStatus('Open');
    setFormModule('');
    setFormAssignee('');
    setFormReporter('');
    setShowModal(true);
  };

  const openEditModal = (bug: Bug) => {
    setEditingId(bug.id);
    setFormTitle(lang === 'en' && bug.title_en ? bug.title_en : bug.title);
    setFormSeverity(bug.severity);
    setFormStatus(bug.status);
    setFormModule(lang === 'en' && bug.module_en ? bug.module_en : bug.module);
    setFormAssignee((lang === 'en' && bug.assignee_en ? bug.assignee_en : bug.assignee) || 'Elena');
    setFormReporter((lang === 'en' && bug.reporter_en ? bug.reporter_en : bug.reporter) || 'Kevin');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const dataPayload = {
      title: formTitle,
      severity: formSeverity,
      status: formStatus,
      module: formModule,
      assignee: formAssignee || 'Unassigned',
      reporter: formReporter || 'QA Tester',
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (editingId) {
      updateBug({ ...dataPayload, id: editingId, projectId: currentProjectId });
    } else {
      addBug(dataPayload);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteBug(id);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-xs" id="bugs-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <BugIcon className="w-5 h-5 text-rose-500" />
            <span>{lang === 'zh' ? '缺陷管理看板' : 'Defect Management Board'}</span>
          </h2>
          <p className="text-xs text-zinc-450 mt-1 font-semibold uppercase tracking-wider font-mono">{lang === 'zh' ? `项目「${activeProject.name}」生产及研发缺陷协同总览` : `Scrum quality assurance console for project ${activeProject.key}`}</p>
        </div>
        <button onClick={openAddModal} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition duration-150 flex items-center space-x-1 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>{lang === 'zh' ? '提报缺陷/问题' : 'File Bug'}</span>
        </button>
      </div>

      {/* Database Listing Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-zinc-950 shadow-xs" id="bugs-database">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-slate-800 text-zinc-500 dark:text-zinc-400 font-bold select-none uppercase tracking-wide">
                <th className="p-4 w-28">{lang === 'zh' ? '缺陷键值' : 'Bug Key'}</th>
                <th className="p-4">{lang === 'zh' ? '缺陷说明 / 关联事项' : 'Stack Trace / Summary'}</th>
                <th className="p-4 w-32">{lang === 'zh' ? '严重程度' : 'Severity'}</th>
                <th className="p-4 w-28">{lang === 'zh' ? '缺陷状态' : 'Status'}</th>
                <th className="p-4 w-40">{lang === 'zh' ? '涉及子系统/模块' : 'Subsystem Module'}</th>
                <th className="p-4 w-28">{lang === 'zh' ? '经办接收人' : 'Assignee'}</th>
                <th className="p-4 w-24">{lang === 'zh' ? '创建日期' : 'Created At'}</th>
                <th className="p-4 text-right w-24">{lang === 'zh' ? '操作' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {bugs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-xs text-zinc-400 italic">
                    No defects archived in this sprint profile.
                  </td>
                </tr>
              ) : (
                bugs.map((bug) => (
                  <tr key={bug.id} className="border-b last:border-0 border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50/45 dark:hover:bg-zinc-900/10 transition">
                    {/* ID */}
                    <td className="p-4 font-mono font-bold text-rose-500 select-all">{bug.id}</td>

                    {/* Summary */}
                    <td className="p-4 font-sans font-bold text-slate-800 dark:text-zinc-100">
                      <div className="max-w-[280px]">
                        <span className="leading-relaxed block truncate">{lang === 'en' && bug.title_en ? bug.title_en : bug.title}</span>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap inline-flex items-center gap-1 ${
                          bug.severity === 'Critical'
                            ? 'bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                            : bug.severity === 'Major'
                              ? 'bg-amber-100/50 border border-amber-250 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                              : 'bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        }`}
                      >
                        {bug.severity === 'Critical' ? '🔴 Critical' : bug.severity === 'Major' ? '🟡 Major' : '🟢 Minor'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                          bug.status === 'Open' ? 'bg-red-50 text-red-600 dark:bg-red-950/30' : bug.status === 'Fixed' ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                        }`}
                      >
                        {bug.status}
                      </span>
                    </td>

                    {/* Subsystem Module */}
                    <td className="p-4 text-zinc-600 dark:text-zinc-350">
                      <span className="inline-flex items-center space-x-1">
                        <Code className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="truncate max-w-[120px] font-mono font-bold">{lang === 'en' && bug.module_en ? bug.module_en : bug.module}</span>
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="p-4 text-slate-650 dark:text-slate-300 font-mono font-bold">{(lang === 'en' && bug.assignee_en ? bug.assignee_en : bug.assignee) || 'Elena G'}</td>

                    {/* Created Date */}
                    <td className="p-4 text-zinc-400 font-mono">{bug.createdAt}</td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1 flex-row">
                        <button onClick={() => openEditModal(bug)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-indigo-600 dark:text-indigo-400 rounded-lg transition cursor-pointer" title="Triage Issue">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(bug.id)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 rounded-lg transition cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Bug Form Dialog */}
      {showModal &&
        createPortal(
          <div id="bug-crud-modal" className="absolute inset-0 z-[1100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md p-6 max-h-[92vh] overflow-y-auto relative z-10 flex flex-col">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white pb-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5">
                <span>🐞</span>
                <span>{editingId ? (lang === 'zh' ? `缺陷键值 ${editingId}` : `Defect Key ${editingId}`) : lang === 'zh' ? '新增缺陷问题' : 'Report Automated Defect'}</span>
              </h3>

              <form onSubmit={handleSave} className="space-y-4 pt-3 text-slate-800 dark:text-zinc-200">
                {/* Summary */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">{lang === 'zh' ? '问题概述 / 异常堆栈' : 'Exception Stack Summary'}</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-505 font-medium"
                  />
                </div>

                {/* Severity & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">{t.bugs.severity}</label>
                    <select
                      value={formSeverity}
                      onChange={(e) => setFormSeverity(e.target.value as any)}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none font-bold cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                    >
                      <option value="Critical" className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        🔴 Critical (致瘫故障)
                      </option>
                      <option value="Major" className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        🟡 Major (严重报错)
                      </option>
                      <option value="Minor" className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        🟢 Minor (微小异常)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">{t.bugs.status}</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none font-bold cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                    >
                      <option value="Open" className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        Unresolved (挂起处理中)
                      </option>
                      <option value="Fixed" className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        Resolved/Fixed (代码已修复)
                      </option>
                      <option value="Closed" className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        Verified/Closed (经 QA 验收关闭)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Module selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">{t.bugs.module}</label>
                  <input
                    type="text"
                    required
                    value={formModule}
                    onChange={(e) => setFormModule(e.target.value)}
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none font-semibold font-mono"
                  />
                </div>

                {/* Assignee / Reporter */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">{lang === 'zh' ? '经办人' : 'Assignee'}</label>
                    <input
                      type="text"
                      value={formAssignee}
                      onChange={(e) => setFormAssignee(e.target.value)}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">{lang === 'zh' ? '上报人' : 'Reporter'}</label>
                    <input
                      type="text"
                      value={formReporter}
                      onChange={(e) => setFormReporter(e.target.value)}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3.5 py-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer"
                  >
                    {t.actions.cancel}
                  </button>
                  <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">
                    {lang === 'zh' ? '确认同步' : 'Record Defect'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.getElementById('main-content-wrapper') || document.body
        )}
    </div>
  );
};

// ==========================================
// 5. TEST SCREEN (ZEPHYR QUALITY SUITES)
// ==========================================
export const TestsScreen: React.FC = () => {
  const { testSuites, addTestSuite, updateTestSuite, deleteTestSuite, lang, projects, currentProjectId } = useAgileData();
  const t = translations[lang];

  const activeProject = projects.find((p) => p.id === currentProjectId) || projects[0];

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formSuite, setFormSuite] = useState('');
  const [formCoverage, setFormCoverage] = useState<number | ''>('');
  const [formPassRate, setFormPassRate] = useState<number | ''>('');
  const [formTotal, setFormTotal] = useState<number | ''>('');
  const [formPassed, setFormPassed] = useState<number | ''>('');

  const openAddModal = () => {
    setEditingId(null);
    setFormSuite('');
    setFormCoverage('');
    setFormPassRate('');
    setFormTotal('');
    setFormPassed('');
    setShowModal(true);
  };

  const openEditModal = (suite: TestSuite) => {
    setEditingId(suite.id);
    setFormSuite(lang === 'en' && suite.suite_en ? suite.suite_en : suite.suite);
    setFormCoverage(suite.coverage);
    setFormPassRate(suite.passRate);
    setFormTotal(suite.totalCases);
    setFormPassed(suite.passed);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSuite.trim()) return;

    const dataPayload = {
      suite: formSuite,
      coverage: Number(formCoverage),
      passRate: Number(formPassRate),
      totalCases: Number(formTotal),
      passed: Number(formPassed),
      failed: Math.max(0, Number(formTotal) - Number(formPassed)),
      status: Number(formTotal) === Number(formPassed) ? 'Passed' : ('Failed' as any)
    };

    if (editingId) {
      updateTestSuite({ ...dataPayload, id: editingId, projectId: currentProjectId });
    } else {
      addTestSuite(dataPayload);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteTestSuite(id);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-xs" id="tests-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <GraduationCap className="w-5 h-5 text-indigo-650" />
            <span>{lang === 'zh' ? '测试管理看板' : 'Test Management Board'}</span>
          </h2>
          <p className="text-xs text-zinc-450 mt-1 font-semibold block uppercase tracking-wider font-mono">
            {lang === 'zh' ? `项目「${activeProject.name}」自动化测试验证流水线及质量管理校验底座` : `Automated compilation validation pipeline for project ${activeProject.key}`}
          </p>
        </div>
        <button onClick={openAddModal} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition duration-150 flex items-center space-x-1 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>{lang === 'zh' ? '新增测试用例套件' : 'New Test Case Suite'}</span>
        </button>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="tests-database">
        {testSuites.map((suite) => (
          <div key={suite.id} className="p-5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between shadow-xs hover:border-indigo-505 group/suite">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400">{suite.id}</span>
                <span
                  className={`px-2 py-0.5 rounded-sm text-[9px] font-mono font-bold uppercase ${suite.status === 'Passed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/45' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/45 dark:text-rose-450'}`}
                >
                  {suite.status}
                </span>
              </div>

              <h3 className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-200 leading-normal mt-2">📂 {lang === 'en' && suite.suite_en ? suite.suite_en : suite.suite}</h3>
            </div>

            {/* Test Metrics layout */}
            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <div>
                  <span className="text-zinc-450 block font-bold">{t.tests.coverage}</span>
                  <span className="text-sm font-bold font-mono text-zinc-850 dark:text-zinc-200 mt-1 block">{suite.coverage}%</span>
                </div>
                <div>
                  <span className="text-zinc-455 block font-bold">{t.tests.passRate}</span>
                  <span className="text-sm font-bold font-mono text-emerald-500 mt-1 block">{suite.passRate}%</span>
                </div>
              </div>

              {/* Progress visual bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-zinc-450 font-bold font-sans">
                  <span>{t.tests.cases}</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-extrabold">
                    {suite.passed} / {suite.totalCases} Passed
                  </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden relative">
                  <div className="h-full bg-emerald-500 rounded-lg transition-all duration-300" style={{ width: `${suite.passRate}%` }} />
                </div>
              </div>

              {/* Action buttons panel */}
              <div className="flex justify-end space-x-1 pt-1 opacity-100 transition-all duration-200">
                <button onClick={() => openEditModal(suite)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-indigo-650 dark:text-indigo-400 rounded-lg transition text-xs flex items-center font-bold cursor-pointer">
                  <Edit3 className="w-3.5 h-3.5 mr-1" /> {lang === 'zh' ? '编辑' : 'Edit'}
                </button>
                <button onClick={() => handleDelete(suite.id)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-955 text-rose-500 rounded-lg transition text-xs flex items-center font-bold cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> {lang === 'zh' ? '删除' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CRUD Test Modal */}
      {showModal &&
        createPortal(
          <div id="test-crud-modal" className="absolute inset-0 z-[1100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md p-6 max-h-[92vh] overflow-y-auto relative z-10 flex flex-col">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white pb-3 border-b border-zinc-100 dark:border-zinc-800">
                {editingId ? (lang === 'zh' ? '编辑测试套件属性' : 'Edit QA Suite') : lang === 'zh' ? '新建自动化测试套件' : 'Create Test Suite'}
              </h3>

              <form onSubmit={handleSave} className="space-y-4 pt-3 text-slate-800 dark:text-zinc-200">
                {/* Suite Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">{t.tests.suiteName}</label>
                  <input
                    type="text"
                    required
                    value={formSuite}
                    onChange={(e) => setFormSuite(e.target.value)}
                    placeholder="e.g. CLI Compiler Unit Tests"
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-505 font-medium"
                  />
                </div>

                {/* Coverage and Pass Rate */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">{t.tests.coverage} (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formCoverage}
                      onChange={(e) => setFormCoverage(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">{t.tests.passRate} (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formPassRate}
                      onChange={(e) => setFormPassRate(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Total Cases and Passed cases */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">{lang === 'zh' ? '总归纳例数' : 'Total cases'}</label>
                    <input
                      type="number"
                      value={formTotal}
                      onChange={(e) => setFormTotal(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">{lang === 'zh' ? '通过验证数' : 'Passed cases'}</label>
                    <input
                      type="number"
                      value={formPassed}
                      onChange={(e) => setFormPassed(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3.5 py-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer"
                  >
                    {t.actions.cancel}
                  </button>
                  <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">
                    {lang === 'zh' ? '确认同步' : 'Sync Suite'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.getElementById('main-content-wrapper') || document.body
        )}
    </div>
  );
};

// ==========================================
// 6. METRICS & ANALYTICS SCREEN (JIRA-STYLE REPORTS HUB)
// ==========================================
export const MetricsScreen: React.FC = () => {
  const { lang, requirements, sprints } = useAgileData();
  const t = translations[lang];

  // Reports navigation tab
  const [activeTab, setActiveTab] = useState<'burndown' | 'velocity' | 'cfd'>('burndown');

  // Calculates stats active sprint items
  const activeSprint = sprints.find((s) => s.status === 'Active') || sprints[0];
  const totalStoryPoints = requirements.reduce((acc, r) => acc + (r.storyPoints || 0), 0);
  const doneStoryPoints = requirements.filter((r) => r.status === 'Done').reduce((acc, r) => acc + (r.storyPoints || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn text-xs" id="metrics-reports-screen">
      {/* Page header */}
      <div className="pb-1">
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
          <Activity className="w-5 h-5 text-indigo-600 dark:text-[#818CF8]" />
          <span>{lang === 'zh' ? '度量分析与研发报告' : 'Metrics & Reports Hub'}</span>
        </h2>
        <p className="text-xs text-zinc-450 mt-1 font-semibold uppercase tracking-wider font-mono">{lang === 'zh' ? '敏捷交付燃尽记录、团队速率趋势及累计流向深度分析看板' : 'Sprint burndown trajectory, commitment velocity & cumulative flows'}</p>
      </div>

      {/* Jira-style Reports tabs navigation with a spacing gap from Header underlay */}
      <div className="flex overflow-x-auto select-none gap-2 mt-4 pb-1" id="metrics-tab-layout">
        <button
          onClick={() => setActiveTab('burndown')}
          className={`px-4 py-2 text-xs font-bold transition duration-150 flex items-center shrink-0 space-x-1.5 cursor-pointer rounded-xl border ${
            activeTab === 'burndown'
              ? 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'bg-white dark:bg-zinc-950 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border-slate-200/70 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{lang === 'zh' ? '1. Sprint 燃尽图' : 'Sprint Burndown Trajectory'}</span>
        </button>

        <button
          onClick={() => setActiveTab('velocity')}
          className={`px-4 py-2 text-xs font-bold transition duration-150 flex items-center shrink-0 space-x-1.5 cursor-pointer rounded-xl border ${
            activeTab === 'velocity'
              ? 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'bg-white dark:bg-zinc-950 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border-slate-200/70 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
        >
          <BarChartIcon className="w-3.5 h-3.5" />
          <span>{lang === 'zh' ? '2. 团队交付速率图' : 'Sprint Capacity Velocity'}</span>
        </button>

        <button
          onClick={() => setActiveTab('cfd')}
          className={`px-4 py-2 text-xs font-bold transition duration-150 flex items-center shrink-0 space-x-1.5 cursor-pointer rounded-xl border ${
            activeTab === 'cfd'
              ? 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'bg-white dark:bg-zinc-950 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border-slate-200/70 dark:border-zinc-805 hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{lang === 'zh' ? '3. 累计流向图' : 'Cumulative Flow CFD'}</span>
        </button>
      </div>

      {/* Dynamic Report Content based on tab */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-900 p-5 shadow-xs overflow-hidden" id="jira-reports-viewport">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} transition={{ duration: 0.25 }}>
            {/* REPORT 1: BURNDOWN CHART */}
            {activeTab === 'burndown' && (
              <div className="space-y-5" id="report-burndown">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-[#F8FAFC] dark:bg-zinc-900 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800 select-none">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-450 font-mono font-bold uppercase tracking-wider block">{lang === 'zh' ? '当前正跟踪活跃迭代' : 'Currently tracking active sprint'}</span>
                    <h4 className="text-sm font-extrabold text-indigo-900 dark:text-white leading-none">{activeSprint ? (lang === 'en' && activeSprint.name_en ? activeSprint.name_en : activeSprint.name) : 'Scrum Active Sprint Iteration'}</h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-450 mt-1">{lang === 'zh' ? `迭代容量：共交付储备 ${totalStoryPoints} 故事点` : `SP Scope: ${totalStoryPoints} Total story points committed`}</p>
                  </div>
                  <div className="flex space-x-4 text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold block uppercase">{lang === 'zh' ? '理想故事点剩余' : 'Ideal Burn remaining'}</span>
                      <span className="text-sm font-bold text-slate-400 block mt-0.5">0 SP</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-rose-400 font-bold block uppercase">{lang === 'zh' ? '实际故事点剩余' : 'Actual Burn remaining'}</span>
                      <span className="text-sm font-bold text-rose-500 block mt-0.5">{totalStoryPoints - doneStoryPoints} SP Left</span>
                    </div>
                  </div>
                </div>

                {/* Burndown trajectory rendered with native vector graphics */}
                <div className="h-64 relative font-sans">
                  <svg viewBox="0 0 500 180" className="w-full h-full text-zinc-400 select-none">
                    {/* Horizontal reference lanes */}
                    <line x1="50" y1="20" x2="450" y2="20" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="50" y1="50" x2="450" y2="50" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="50" y1="90" x2="450" y2="90" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="50" y1="130" x2="450" y2="130" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="50" y1="160" x2="450" y2="160" stroke="currentColor" strokeOpacity="0.2" />

                    {/* Vertical reference lanes for Day 1 to Day 10 */}
                    <line x1="50" y1="20" x2="50" y2="160" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="130" y1="20" x2="130" y2="160" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="210" y1="20" x2="210" y2="160" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="290" y1="20" x2="290" y2="160" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="370" y1="20" x2="370" y2="160" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="450" y1="20" x2="450" y2="160" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />

                    {/* GRAPH 2: Ideal burndown line (Dashed blue vector) */}
                    <line x1="50" y1="25" x2="450" y2="160" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4" />

                    {/* GRAPH 1: Actual remaining story points (Prideline rich purple line) */}
                    <path d="M 50 25 L 130 25 L 210 50 L 290 90 L 370 120 L 450 142" fill="none" stroke="#4F46E5" strokeWidth="3.5" strokeLinecap="round" />

                    {/* Visual points */}
                    <circle cx="50" cy="25" r="4" fill="#4F46E5" />
                    <circle cx="130" cy="25" r="4" fill="#4F46E5" />
                    <circle cx="210" cy="50" r="4" fill="#4F46E5" />
                    <circle cx="290" cy="90" r="4" fill="#4F46E5" />
                    <circle cx="370" cy="120" r="4" fill="#4F46E5" />
                    <circle cx="450" cy="142" r="4.5" fill="#10B981" />

                    {/* X labels (Scrum Days) */}
                    <text x="50" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '第1天' : 'Day 1'}
                    </text>
                    <text x="130" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '第3天' : 'Day 3'}
                    </text>
                    <text x="210" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '第5天' : 'Day 5'}
                    </text>
                    <text x="290" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '第7天' : 'Day 7'}
                    </text>
                    <text x="370" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '第9天' : 'Day 9'}
                    </text>
                    <text x="450" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '第10天 (结束)' : 'Day 10 (End)'}
                    </text>

                    {/* Y labels (SP Count) */}
                    <text x="35" y="28" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '40 故事点' : '40 SP'}
                    </text>
                    <text x="35" y="53" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '30 故事点' : '30 SP'}
                    </text>
                    <text x="35" y="93" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '20 故事点' : '20 SP'}
                    </text>
                    <text x="35" y="133" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '10 故事点' : '10 SP'}
                    </text>
                    <text x="35" y="163" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      0
                    </text>
                  </svg>
                </div>

                <div className="p-3 bg-indigo-50/25 dark:bg-zinc-900/30 rounded-xl border border-indigo-100/40 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-300 flex items-start space-x-2 leading-relaxed">
                  <Info className="w-4 h-4 text-indigo-650 mt-0.5 flex-shrink-0" />
                  <p className="font-medium text-slate-650">
                    {lang === 'zh'
                      ? '当前迭代状态呈现典型的「敏捷良势燃尽」。前 3 天产品梳理，第 5 天开始大幅吞吐研发打包归档，实际曲线与理想回归线相辅相成，预计可在第 10 天顺利清零交付！'
                      : 'The team is burning down remaining effort successfully corresponding to ideal scrum slope velocity. Outstanding sprint capacity is expected to hit zeroes on Day 10.'}
                  </p>
                </div>
              </div>
            )}

            {/* REPORT 2: VELOCITY CHART (COMMITTED VS COMPLETED) */}
            {activeTab === 'velocity' && (
              <div className="space-y-4" id="report-velocity">
                <div className="flex justify-between items-center bg-[#F8FAFC] dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800 select-none">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">{lang === 'zh' ? '团队迭代交付速率看板' : 'Scrum Velocity Board'}</h4>
                    <p className="text-[10px] text-zinc-450 mt-1">{lang === 'zh' ? 'Sprint 1 至 Sprint 4 历史达成故事点占比' : 'S1 to S4 historical completed story points ratio'}</p>
                  </div>
                  <div className="flex space-x-4 text-[10px] font-bold font-mono">
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 bg-indigo-600 rounded mr-1" />
                      {lang === 'zh' ? '预估点数' : 'Committed'}
                    </span>
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded mr-1" />
                      {lang === 'zh' ? '关闭点数' : 'Completed'}
                    </span>
                  </div>
                </div>

                {/* Velocity columns graph (SVG) */}
                <div className="h-64 relative font-sans">
                  <svg viewBox="0 0 500 180" className="w-full h-full text-zinc-400 select-none">
                    <line x1="50" y1="20" x2="450" y2="20" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="50" y1="60" x2="450" y2="60" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="50" y1="100" x2="450" y2="100" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="50" y1="140" x2="450" y2="140" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="55" y1="160" x2="450" y2="160" stroke="currentColor" strokeOpacity="0.2" />

                    {/* SPRINT 1 BAR GROUP */}
                    {/* Committed bar: 30 SP */}
                    <rect x="90" y="70" width="18" height="90" fill="#4F46E5" rx="2" />
                    {/* Completed bar: 24 SP */}
                    <rect x="111" y="88" width="18" height="72" fill="#10B981" rx="2" />

                    {/* SPRINT 2 BAR GROUP */}
                    {/* Committed bar: 35 SP */}
                    <rect x="180" y="55" width="18" height="105" fill="#4F46E5" rx="2" />
                    {/* Completed bar: 35 SP */}
                    <rect x="201" y="55" width="18" height="105" fill="#10B981" rx="2" />

                    {/* SPRINT 3 BAR GROUP */}
                    {/* Committed bar: 40 SP */}
                    <rect x="270" y="40" width="18" height="120" fill="#4F46E5" rx="2" />
                    {/* Completed bar: 38 SP */}
                    <rect x="291" y="46" width="18" height="114" fill="#10B981" rx="2" />

                    {/* SPRINT 4 BAR GROUP */}
                    {/* Committed bar: 45 SP */}
                    <rect x="360" y="25" width="18" height="135" fill="#4F46E5" rx="2" />
                    {/* Completed bar: 45 SP */}
                    <rect x="381" y="25" width="18" height="135" fill="#10B981" rx="2" />

                    {/* X Text Labels */}
                    <text x="110" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '迭代 1' : 'Sprint 1'}
                    </text>
                    <text x="200" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '迭代 2' : 'Sprint 2'}
                    </text>
                    <text x="290" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '迭代 3' : 'Sprint 3'}
                    </text>
                    <text x="380" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '迭代 4 (当前激活)' : 'Sprint 4 (Active)'}
                    </text>

                    {/* Y Text Labels */}
                    <text x="35" y="28" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '45 故事点' : '45 SP'}
                    </text>
                    <text x="35" y="63" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '30 故事点' : '30 SP'}
                    </text>
                    <text x="35" y="103" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '15 故事点' : '15 SP'}
                    </text>
                    <text x="35" y="143" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '5 故事点' : '5 SP'}
                    </text>
                    <text x="35" y="163" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      0
                    </text>
                  </svg>
                </div>
              </div>
            )}

            {/* REPORT 3: CUMULATIVE FLOW CFD */}
            {activeTab === 'cfd' && (
              <div className="space-y-4" id="report-cfd">
                <div className="flex justify-between items-center bg-[#F8FAFC] dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800 select-none">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">{lang === 'zh' ? '累计流向看板' : 'Cumulative Flow Board'}</h4>
                    <p className="text-[10px] text-zinc-450 mt-1">{lang === 'zh' ? '展示 7 周期间不同流向状态的配比漂移量' : 'Shows state proportion drift metrics over 7 weeks'}</p>
                  </div>
                  <div className="flex space-x-3 text-[9px] font-mono font-black text-slate-600 dark:text-zinc-200">
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-1" />
                      {lang === 'zh' ? '已收尾已关单 (DONE)' : 'DONE'}
                    </span>
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full mr-1" />
                      {lang === 'zh' ? '正在进行中 (IN PROGRESS)' : 'IN PROGRESS'}
                    </span>
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 bg-slate-400 rounded-full mr-1" />
                      {lang === 'zh' ? '待开发积压 (TODO)' : 'TODO'}
                    </span>
                  </div>
                </div>

                {/* Cumulative flow stream chart represented cleanly in SVG */}
                <div className="h-64 relative font-sans">
                  <svg viewBox="0 0 500 180" className="w-full h-full text-zinc-400 select-none">
                    {/* Horizontal reference lanes */}
                    <line x1="50" y1="20" x2="450" y2="20" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="50" y1="60" x2="450" y2="60" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="50" y1="100" x2="450" y2="100" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="50" y1="140" x2="450" y2="140" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3" />
                    <line x1="50" y1="160" x2="450" y2="160" stroke="currentColor" strokeOpacity="0.2" />

                    {/* Stream layers representing cumulative flow areas */}
                    {/* 1. Area 1: TO DO (Light Slate layer) */}
                    <path d="M 50 160 Q 150 140 250 110 T 450 60 L 450 160 L 50 160 Z" fill="#E2E8F0" opacity="0.8" />

                    {/* 2. Area 2: IN PROGRESS (Indigo stream layer overlay) */}
                    <path d="M 50 160 Q 150 150 250 130 T 450 100 L 450 160 L 50 160 Z" fill="#818CF8" opacity="0.9" />

                    {/* 3. Area 3: DONE (Emerald success area layer bottom base overlay) */}
                    <path d="M 50 160 Q 150 158 250 150 T 450 135 L 450 160 L 50 160 Z" fill="#34D399" opacity="0.95" />

                    {/* Y labels */}
                    <text x="35" y="23" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '50 工作项' : '50 Tickets'}
                    </text>
                    <text x="35" y="63" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '35 工作项' : '35 Tickets'}
                    </text>
                    <text x="35" y="103" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '20 工作项' : '20 Tickets'}
                    </text>
                    <text x="35" y="143" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '5 工作项' : '5 Tickets'}
                    </text>
                    <text x="35" y="163" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      0
                    </text>

                    {/* X labels (7 Weeks) */}
                    <text x="50" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '第 1 周' : 'W1'}
                    </text>
                    <text x="116" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '第 2 周' : 'W2'}
                    </text>
                    <text x="182" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '第 3 周' : 'W3'}
                    </text>
                    <text x="248" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '第 4 周' : 'W4'}
                    </text>
                    <text x="314" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '第 5 周' : 'W5'}
                    </text>
                    <text x="380" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '第 6 周' : 'W6'}
                    </text>
                    <text x="450" y="173" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-zinc-550 dark:text-zinc-350">
                      {lang === 'zh' ? '第 7 周' : 'W7'}
                    </text>
                  </svg>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Simple custom inline SVG bar chart helper icon
const BarChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
