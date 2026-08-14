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
      const size = skill.source === 'local' ? 3.5 : 1.2;
      return total + size;
    }, 0)
    .toFixed(1);

  return (
    <div className="flex flex-col space-y-6 text-xs" id="webskill-manager">
      {/* Header */}
      <div className="flex items-center justify-between select-none">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Box className="w-5 h-5 text-foreground" />
            <span>{lang === 'zh' ? 'WebSkill 管理器' : 'WebSkill Manager'}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1 font-mono font-medium flex items-center">
            <Database className="w-3.5 h-3.5 mr-1 text-muted-foreground" /> {lang === 'zh' ? '占用 OPFS 空间' : 'OPFS Space Used'}: {opfsSize} MB
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="btn-secondary px-3.5 py-2 text-xs flex items-center space-x-1.5 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
            <span>{lang === 'zh' ? '刷新' : 'Refresh'}</span>
          </button>
          <button className="btn-primary px-3.5 py-2 text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '全局校验' : 'Verify All'}</span>
          </button>
        </div>
      </div>

      {/* Database Listing Card containing TAB switcher and Content Body */}
      <div className="rounded-xl overflow-hidden border border-border bg-card shadow-xs flex flex-col h-auto min-h-[600px] text-card-foreground" id="webskill-manager-card">
        {/* Tab switcher inside the box */}
        <div className="flex space-x-1 p-2 bg-secondary/50 border-b border-border text-xs font-medium select-none">
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
              className={`cursor-pointer px-3.5 py-1.5 text-xs font-medium rounded-lg transition ${
                activeTab === tab.id
                  ? 'bg-accent text-accent-foreground font-semibold border border-border shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
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
