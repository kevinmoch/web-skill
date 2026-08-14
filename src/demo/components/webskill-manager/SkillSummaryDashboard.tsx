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
    <div className="p-6 space-y-6 overflow-y-auto max-h-[700px] text-foreground" id="skill-summary-dashboard">
      <div>
        <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-foreground" />
          <span>{lang === 'zh' ? '技能汇总统计' : 'Skill Summary Dashboard'}</span>
        </h3>
        <p className="text-xs text-muted-foreground mt-1">{lang === 'zh' ? '全局监控和深度管理当前已加载的所有 WebSkill 资源束' : 'Global monitoring and deep management of all loaded WebSkill bundles'}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{lang === 'zh' ? '总技能数量' : 'Total Skills'}</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-foreground">{totalSkills}</span>
            <span className="text-xs px-2 py-0.5 rounded-md font-bold font-mono bg-primary text-primary-foreground">ACTIVE</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{lang === 'zh' ? '本地自定义技能' : 'Local Custom Skills'}</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{localSkillsCount}</span>
            <span className="text-xs px-2 py-0.5 rounded-md font-bold font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">LOCAL</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{lang === 'zh' ? '外部远程技能' : 'Remote Skills'}</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{installedSkillsCount}</span>
            <span className="text-xs px-2 py-0.5 rounded-md font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">REMOTE</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{lang === 'zh' ? 'WebMCP 技能' : 'WebMCP Skills'}</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400">{webMcpSkillsCount}</span>
            <span className="text-xs px-2 py-0.5 rounded-md font-bold font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">WEBMCP</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-mono uppercase text-muted-foreground tracking-wider">{lang === 'zh' ? `已加载技能明细列表 (${skills.length})` : `Loaded Skill Roster (${skills.length})`}</h4>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-secondary/60 border-b border-border text-muted-foreground font-medium">
                <th className="p-3 font-semibold">{lang === 'zh' ? '技能名称' : 'Skill Name'}</th>
                <th className="p-3 font-semibold">{lang === 'zh' ? '技能描述' : 'Description'}</th>
                <th className="p-3 font-semibold w-24">{lang === 'zh' ? '版本号' : 'Version'}</th>
                <th className="p-3 font-semibold w-28">{lang === 'zh' ? '来源类型' : 'Source'}</th>
                <th className="p-3 font-semibold w-20">{lang === 'zh' ? '操作' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
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
                  <tr key={s.name} className="hover:bg-accent/40 transition cursor-pointer" onClick={() => onSelectSkill(s.name)}>
                    <td className="p-3 font-medium">
                      <div className="flex items-center space-x-2">
                        <Box className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-mono font-semibold text-foreground">{s.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="line-clamp-2 text-muted-foreground leading-relaxed max-w-[280px]">{description}</p>
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">v{version}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-bold font-mono border ${
                          s.source === 'local'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : s.source === 'webmcp'
                              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {s.source === 'local' ? 'LOCAL' : s.source === 'webmcp' ? 'WebMCP' : 'REMOTE'}
                      </span>
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => onSelectSkill(s.name)} className="btn-secondary px-2.5 py-1 text-xs cursor-pointer">
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
