import React from 'react';
import { FolderTree, Box } from 'lucide-react';
import { parseSkillMarkdown, SkillDocument } from '../../core/index';
import { useAgileData } from '../../context/AgileDataContext';

export function SkillSummaryDashboard({ skills, onSelectSkill }: { skills: any[]; onSelectSkill: (name: string) => void }) {
  const { lang } = useAgileData();
  const totalSkills = skills.length;
  const localSkillsCount = skills.filter((s) => s.source === 'local').length;
  const installedSkillsCount = skills.filter((s) => s.source === 'remote').length;

  const webMcpSkillsCount = skills.filter((s) => s.source === 'webmcp').length;

  return (
    <div className="p-6 space-y-6 animate-fadeIn overflow-y-auto max-h-[700px] text-slate-700 dark:text-slate-300" id="skill-summary-dashboard">
      <div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
          <FolderTree className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{lang === 'zh' ? '技能汇总统计' : 'Skill Summary Dashboard'}</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{lang === 'zh' ? '全局监控和深度管理当前已加载的所有 WebSkill 资源束' : 'Global monitoring and deep management of all loaded WebSkill bundles'}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-linear-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900 shadow-xs">
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{lang === 'zh' ? '总技能数量' : 'Total Skills'}</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{totalSkills}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-mono">ACTIVE</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-linear-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900 shadow-xs">
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{lang === 'zh' ? '本地自定义技能' : 'Local Custom Skills'}</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-500">{localSkillsCount}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/30 font-mono">LOCAL</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-linear-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900 shadow-xs">
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{lang === 'zh' ? '外部远程技能' : 'Remote Skills'}</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{installedSkillsCount}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-900/30 font-mono">REMOTE</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-linear-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900 shadow-xs">
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{lang === 'zh' ? 'WebMCP 技能' : 'WebMCP Skills'}</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-violet-600 dark:text-violet-400">{webMcpSkillsCount}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 border border-sky-200/40 dark:border-sky-900/30 font-mono">WEBMCP</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">{lang === 'zh' ? `已加载技能明细列表 (${skills.length})` : `Loaded Skill Roster (${skills.length})`}</h4>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                <th className="p-3 font-bold tracking-tight">{lang === 'zh' ? '技能名称' : 'Skill Name'}</th>
                <th className="p-3 font-bold tracking-tight">{lang === 'zh' ? '技能描述' : 'Description'}</th>
                <th className="p-3 font-bold tracking-tight w-24">{lang === 'zh' ? '版本号' : 'Version'}</th>
                <th className="p-3 font-bold tracking-tight w-28">{lang === 'zh' ? '来源类型' : 'Source'}</th>
                <th className="p-3 font-bold tracking-tight w-20">{lang === 'zh' ? '操作' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {skills.map((s) => {
                let doc: SkillDocument | null = null;
                try {
                  if (s['SKILL.md']) {
                    doc = parseSkillMarkdown(s['SKILL.md'], { root: s.root, skillFile: 'SKILL.md' });
                  }
                } catch (e) {}

                const description = doc?.metadata?.description || (lang === 'zh' ? '暂无描述。可通过编辑 SKILL.md 进行配置' : 'No description. Edit SKILL.md to configure.');
                const version = doc?.metadata?.version || '1.0.0';

                return (
                  <tr key={s.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition text-slate-700 dark:text-slate-200 cursor-pointer" onClick={() => onSelectSkill(s.name)}>
                    <td className="p-3 font-bold">
                      <div className="flex items-center space-x-2">
                        <Box className="w-4 h-4 text-indigo-550 shrink-0" />
                        <span className="font-mono text-indigo-650 dark:text-indigo-400">{s.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="line-clamp-2 text-slate-500 dark:text-slate-400 font-semibold leading-relaxed max-w-[280px]">{description}</p>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-500 dark:text-zinc-400">v{version}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.source === 'local'
                            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/30'
                            : s.source === 'webmcp'
                              ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 border border-sky-200/40 dark:border-sky-900/30'
                              : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-900/30'
                        }`}
                      >
                        {s.source === 'local' ? 'LOCAL' : s.source === 'webmcp' ? 'WebMCP' : 'REMOTE'}
                      </span>
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => onSelectSkill(s.name)} className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition">
                        {lang === 'zh' ? '管理' : 'Manage'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
