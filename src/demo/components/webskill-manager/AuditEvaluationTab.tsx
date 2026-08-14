import React, { useState, useEffect, useRef } from 'react';
import { Shield, DownloadCloud, RotateCcw, Trash2, AlertCircle } from 'lucide-react';
import { parseSkillMarkdown } from '../../core/index';
import { useAgileData } from '../../context/AgileDataContext';

export function AuditEvaluationTab({ skills }: { skills: any[] }) {
  const { lang } = useAgileData();
  const [lowScore, setLowScore] = useState(30);
  const [highScore, setHighScore] = useState(80);
  const trackRef = useRef<HTMLDivElement>(null);

  const [skillStats, setSkillStats] = useState<Record<string, { activationCount: number; successRate: number }>>({});

  useEffect(() => {
    setSkillStats((prev) => {
      const newStats = { ...prev };
      skills.forEach((s) => {
        if (!newStats[s.name]) {
          if (s.name === 'analyze-project-iteration-progress') {
            newStats[s.name] = { activationCount: 20, successRate: 90 };
          } else if (s.name === 'bug-severity-distribution') {
            newStats[s.name] = { activationCount: 10, successRate: 20 };
          } else if (s.name === 'requirement-kanban-alignment') {
            newStats[s.name] = { activationCount: 16, successRate: 50 };
          } else {
            newStats[s.name] = { activationCount: 0, successRate: 0 };
          }
        }
      });
      return newStats;
    });
  }, [skills]);

  const handleDrag = (index: 0 | 1) => (e: React.MouseEvent) => {
    e.preventDefault();
    const track = trackRef.current;
    if (!track) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = track.getBoundingClientRect();
      const percent = Math.round(((moveEvent.clientX - rect.left) / rect.width) * 10) * 10;
      const clamped = Math.max(0, Math.min(100, percent));

      if (index === 0) {
        setLowScore((prev) => Math.min(clamped, highScore));
      } else {
        setHighScore((prev) => Math.max(clamped, lowScore));
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="p-6 space-y-6 w-full h-auto flex flex-col text-foreground">
      {/* Top Section: Strategy Settings */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs shrink-0">
        <h3 className="text-xs font-bold text-foreground mb-3 flex items-center">
          <Shield className="w-4 h-4 mr-2 text-foreground" />
          {lang === 'zh' ? '技能评分策略' : 'Skill Rating Strategy'}
        </h3>

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="w-full md:w-3/5 px-4 relative pt-7 pb-3">
            <div className="w-full h-2 bg-secondary rounded-full relative" ref={trackRef}>
              {/* Highlight track */}
              <div className="absolute h-full bg-primary rounded-full" style={{ left: `${lowScore}%`, right: `${100 - highScore}%` }} />

              {/* Low score thumb */}
              <div className="absolute top-0 -mt-7 transform -translate-x-1/2 flex flex-col items-center z-20" style={{ left: `${lowScore}%` }}>
                <div className="text-xs font-bold font-mono text-primary-foreground bg-primary py-0.5 px-2 rounded-md whitespace-nowrap mb-1 shadow-xs">{lang === 'zh' ? `低评分 ${lowScore}%` : `Low ${lowScore}%`}</div>
                <div className="w-4.5 h-4.5 bg-background shadow-xs border-2 border-primary rounded-full cursor-grab active:cursor-grabbing hover:scale-110 transition-transform" onMouseDown={handleDrag(0)} />
              </div>

              {/* High score thumb */}
              <div className="absolute top-0 -mt-7 transform -translate-x-1/2 flex flex-col items-center z-20" style={{ left: `${highScore}%` }}>
                <div className="text-xs font-bold font-mono text-primary-foreground bg-primary py-0.5 px-2 rounded-md whitespace-nowrap mb-1 shadow-xs">{lang === 'zh' ? `高评分 ${highScore}%` : `High ${highScore}%`}</div>
                <div className="w-4.5 h-4.5 bg-background shadow-xs border-2 border-primary rounded-full cursor-grab active:cursor-grabbing hover:scale-110 transition-transform" onMouseDown={handleDrag(1)} />
              </div>
            </div>

            {/* Scale marks */}
            <div className="flex justify-between mt-4 text-xs font-mono font-medium text-muted-foreground pl-2">
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((val) => (
                <span key={val} className="w-5 text-center transform -translate-x-1/2">
                  {val}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full md:w-2/5 flex flex-col space-y-1.5 text-xs text-muted-foreground pl-4 border-l border-border">
            <p className="flex items-start">
              <span className="w-2 h-2 rounded-full bg-primary mt-1 mr-2 flex-shrink-0" />
              <span>
                <strong className="text-foreground block sm:inline">{lang === 'zh' ? '高评分策略：' : 'High Score: '}</strong>
                {lang === 'zh' ? '技能保持激活状态，允许更新升级版本。' : 'Skills stay active and can be updated.'}
              </span>
            </p>
            <p className="flex items-start">
              <span className="w-2 h-2 rounded-full bg-destructive mt-1 mr-2 flex-shrink-0" />
              <span>
                <strong className="text-foreground block sm:inline">{lang === 'zh' ? '低评分策略：' : 'Low Score: '}</strong>
                {lang === 'zh' ? '触发技能回滚或卸载提示，避免低质量技能持续使用。' : 'Triggers rollback or uninstall alerts to prevent poor quality.'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Skills Details Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs flex flex-col h-auto overflow-hidden">
        <div className="px-6 py-3.5 flex items-center bg-secondary/50 border-b border-border shrink-0">
          <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider">{lang === 'zh' ? `已加载技能明细列表 (${skills.length})` : `Loaded Skill Roster (${skills.length})`}</h3>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap md:whitespace-normal text-xs">
            <thead className="border-b border-border bg-secondary/60">
              <tr className="text-muted-foreground font-semibold">
                <th className="px-6 py-3 w-48">{lang === 'zh' ? '技能名称' : 'Skill Name'}</th>
                <th className="px-6 py-3 w-32">{lang === 'zh' ? '来源类型' : 'Source'}</th>
                <th className="px-6 py-3 w-28 text-right">{lang === 'zh' ? '激活次数' : 'Activations'}</th>
                <th className="px-6 py-3 w-28 text-right">{lang === 'zh' ? '执行成功率' : 'Success Rate'}</th>
                <th className="px-6 py-3 w-32 text-center">{lang === 'zh' ? '历史记录' : 'History'}</th>
                <th className="px-6 py-3 w-48 text-center">{lang === 'zh' ? '操作' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {skills.map((skill) => {
                const stats = skillStats[skill.name] || { activationCount: 0, successRate: 0 };
                const isUpdateEnabled = stats.successRate >= highScore;
                const isRollbackUninstallEnabled = stats.successRate <= lowScore;

                let rateColor = 'text-foreground';
                if (stats.successRate >= highScore) rateColor = 'text-emerald-600 dark:text-emerald-400 font-bold';
                else if (stats.successRate <= lowScore) rateColor = 'text-destructive font-bold';

                return (
                  <tr key={skill.name} className="hover:bg-accent/40 transition">
                    <td className="px-6 py-3.5">
                      <div className="font-mono font-semibold text-foreground truncate" title={skill.name}>
                        {skill.name}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-bold font-mono border ${
                          skill.source === 'local'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : skill.source === 'webmcp'
                              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {skill.source === 'local' ? 'LOCAL' : skill.source === 'webmcp' ? 'WebMCP' : 'REMOTE'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-muted-foreground">{stats.activationCount.toLocaleString()}</td>
                    <td className={`px-6 py-3.5 text-right font-mono ${rateColor}`}>{stats.successRate}%</td>
                    <td className="px-6 py-3.5 text-center">
                      <button className="text-foreground hover:underline font-medium text-xs cursor-pointer">{lang === 'zh' ? '查看' : 'View'}</button>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-center space-x-1.5 min-w-[max-content]">
                        <button
                          disabled={!isUpdateEnabled}
                          title={isUpdateEnabled ? (lang === 'zh' ? '符合高评分标准，可以更新' : 'High score, able to update') : lang === 'zh' ? '执行成功率未达到高评分标准' : 'Success rate below high threshold'}
                          className={`px-2.5 py-1 flex items-center text-xs font-medium rounded-md transition ${
                            isUpdateEnabled
                              ? 'btn-primary cursor-pointer'
                              : 'bg-secondary text-muted-foreground border border-border opacity-70 cursor-not-allowed'
                          }`}
                        >
                          <DownloadCloud className="w-3.5 h-3.5 mr-1" />
                          {lang === 'zh' ? '更新' : 'Update'}
                        </button>
                        <button
                          disabled={!isRollbackUninstallEnabled}
                          title={isRollbackUninstallEnabled ? (lang === 'zh' ? '命中低质量标准，建议回滚' : 'Low score hit, suggest rollback') : lang === 'zh' ? '执行成功率未低于低评分标准' : 'Success rate not below low threshold'}
                          className={`px-2.5 py-1 flex items-center text-xs font-medium rounded-md transition ${
                            isRollbackUninstallEnabled
                              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer font-semibold'
                              : 'bg-secondary text-muted-foreground border border-border opacity-70 cursor-not-allowed'
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          {lang === 'zh' ? '回滚' : 'Rollback'}
                        </button>
                        <button
                          disabled={!isRollbackUninstallEnabled}
                          title={isRollbackUninstallEnabled ? (lang === 'zh' ? '命中低质量标准，建议卸载' : 'Low score hit, suggest uninstall') : lang === 'zh' ? '执行成功率未低于低评分标准' : 'Success rate not below low threshold'}
                          className={`px-2.5 py-1 flex items-center text-xs font-medium rounded-md transition ${
                            isRollbackUninstallEnabled
                              ? 'btn-destructive cursor-pointer'
                              : 'bg-secondary text-muted-foreground border border-border opacity-70 cursor-not-allowed'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          {lang === 'zh' ? '卸载' : 'Uninstall'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {skills.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground opacity-40 mb-3" />
                    <p>{lang === 'zh' ? '当前没有可用技能' : 'No skills available'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
