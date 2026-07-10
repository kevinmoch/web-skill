import React, { useState } from 'react';
import { RefreshCw, ShieldAlert, Box, Database } from 'lucide-react';

import { SkillCatalogTab } from './webskill-manager/SkillCatalogTab';
import { ImportExportTab } from './webskill-manager/ImportExportTab';
import { AuditEvaluationTab } from './webskill-manager/AuditEvaluationTab';
import { RunObservationTab } from './webskill-manager/RunObservationTab';
import { MOCK_SKILLS } from './webskill-manager/MOCK_SKILLS';
import { useAgileData } from '../context/AgileDataContext';

export default function WebSkillManager() {
  const { lang } = useAgileData();
  const [activeTab, setActiveTab] = useState<'catalog' | 'import-export' | 'run-observation' | 'audit-evaluation'>('catalog');
  const [skills, setSkills] = useState<any[]>(MOCK_SKILLS);
  const [catalogResetCounter, setCatalogResetCounter] = useState(0);

  // Dynamically calculate OPFS space usage based on installed skills
  const opfsSize = skills
    .reduce((total, skill) => {
      // Basic heuristics: local skills are slightly larger as they may contain more code.
      const size = skill.source === 'local' ? 3.5 : 1.2;
      return total + size;
    }, 0)
    .toFixed(1);

  return (
    <div className="flex flex-col space-y-6 animate-fadeIn text-xs" id="webskill-manager">
      {/* Header */}
      <div className="flex items-center justify-between select-none">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F172A] dark:text-white tracking-tight flex items-center gap-1.5">
            <Box className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{lang === 'zh' ? 'WebSkill 管理器' : 'WebSkill Manager'}</span>
          </h2>
          <p className="text-xs text-zinc-450 mt-1 font-semibold uppercase tracking-wider font-mono flex items-center">
            <Database className="w-3.5 h-3.5 mr-1 text-slate-400" /> {lang === 'zh' ? '占用 OPFS 空间' : 'OPFS Space Used'}: {opfsSize} MB
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold rounded-xl shadow-xs transition duration-150 flex items-center space-x-1 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin-hover" />
            <span>{lang === 'zh' ? '刷新' : 'Refresh'}</span>
          </button>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition duration-150 flex items-center space-x-1 cursor-pointer">
            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
            <span>{lang === 'zh' ? '全局校验' : 'Verify All'}</span>
          </button>
        </div>
      </div>

      {/* Database Listing Card containing TAB switcher and Content Body */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111823] shadow-xs flex flex-col h-auto min-h-[600px]" id="webskill-manager-card">
        {/* Tab switcher inside the box */}
        <div className="flex space-x-1 px-4 py-2 bg-[#F8FAFC]/90 dark:bg-[#0F172A]/50 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold select-none rounded-t-2xl">
          {[
            { id: 'catalog', label: lang === 'zh' ? '技能目录' : 'Catalog' },
            { id: 'import-export', label: lang === 'zh' ? '导入导出' : 'Import / Export' },
            { id: 'run-observation', label: lang === 'zh' ? '运行观测' : 'Observation' },
            { id: 'audit-evaluation', label: lang === 'zh' ? '审计评估' : 'Evaluation' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'catalog') {
                  setCatalogResetCounter((prev) => prev + 1);
                }
              }}
              className={`cursor-pointer px-4 py-2 text-xs font-bold rounded-xl transition duration-150 ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body inside the box */}
        <div className="flex-1 relative" id="webskill-manager-body">
          {activeTab === 'catalog' && <SkillCatalogTab skills={skills} setSkills={setSkills} resetCounter={catalogResetCounter} />}
          {activeTab === 'import-export' && (
            <ImportExportTab
              skills={skills}
              onInstallSkill={(skill) => {
                setSkills((prev) => [{ ...skill }, ...prev]);
              }}
            />
          )}
          {activeTab === 'run-observation' && <RunObservationTab />}
          {activeTab === 'audit-evaluation' && <AuditEvaluationTab skills={skills} />}
        </div>
      </div>
    </div>
  );
}
