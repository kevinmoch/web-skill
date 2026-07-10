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
    <div className="p-4 md:p-6 space-y-4 animate-fadeIn w-full h-auto flex flex-col">
      {/* Top Section: Strategy Settings */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-5 shadow-sm shrink-0">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-indigo-500" />
          {lang === 'zh' ? '技能评分策略' : 'Skill Rating Strategy'}
        </h3>

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="w-full md:w-3/5 px-4 relative pt-7 pb-3">
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full relative" ref={trackRef}>
              {/* Highlight track */}
              <div className="absolute h-full bg-indigo-500 dark:bg-indigo-600 rounded-full" style={{ left: `${lowScore}%`, right: `${100 - highScore}%` }} />

              {/* Low score thumb */}
              <div className="absolute top-0 -mt-6 transform -translate-x-1/2 flex flex-col items-center z-20" style={{ left: `${lowScore}%` }}>
                <div className="text-[11px] font-bold text-slate-100 bg-slate-800 dark:bg-slate-900 py-0.5 px-2 rounded whitespace-nowrap mb-1">{lang === 'zh' ? `低评分 ${lowScore}%` : `Low ${lowScore}%`}</div>
                <div className="w-5 h-5 bg-white shadow-md border-2 border-slate-800 dark:border-indigo-400 rounded-full cursor-grab active:cursor-grabbing hover:scale-110 transition-transform" onMouseDown={handleDrag(0)} />
              </div>

              {/* High score thumb */}
              <div className="absolute top-0 -mt-6 transform -translate-x-1/2 flex flex-col items-center z-20" style={{ left: `${highScore}%` }}>
                <div className="text-[11px] font-bold text-slate-100 bg-slate-800 dark:bg-slate-900 py-0.5 px-2 rounded whitespace-nowrap mb-1">{lang === 'zh' ? `高评分 ${highScore}%` : `High ${highScore}%`}</div>
                <div className="w-5 h-5 bg-white shadow-md border-2 border-indigo-600 rounded-full cursor-grab active:cursor-grabbing hover:scale-110 transition-transform" onMouseDown={handleDrag(1)} />
              </div>
            </div>

            {/* Scale marks */}
            <div className="flex justify-between mt-4 text-[11px] font-mono font-medium text-slate-400 pl-2">
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((val) => (
                <span key={val} className="w-4 text-center transform -translate-x-1/2">
                  {val}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full md:w-2/5 flex flex-col space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pl-4 border-l border-slate-200 dark:border-slate-800">
            <p className="flex items-start">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1 mr-2.5 flex-shrink-0" />
              <span>
                <strong className="text-slate-800 dark:text-slate-200 block sm:inline">{lang === 'zh' ? '高评分策略：' : 'High Score: '}</strong>
                {lang === 'zh' ? '技能保持激活状态，允许更新升级版本。' : 'Skills stay active and can be updated.'}
              </span>
            </p>
            <p className="flex items-start">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 mr-2.5 flex-shrink-0" />
              <span>
                <strong className="text-slate-800 dark:text-slate-200 block sm:inline">{lang === 'zh' ? '低评分策略：' : 'Low Score: '}</strong>
                {lang === 'zh' ? '触发技能回滚或卸载提示，避免低质量技能持续使用。' : 'Triggers rollback or uninstall alerts to prevent poor quality.'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Skills Details Table */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col h-auto">
        <div className="px-6 py-4 flex items-center bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 rounded-t-xl shrink-0">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{lang === 'zh' ? `已加载技能明细列表 (${skills.length})` : `Loaded Skill Roster (${skills.length})`}</h3>
        </div>

        <div className="w-full bg-white dark:bg-[#1E293B] rounded-b-xl overflow-hidden">
          <table className="w-full text-left border-collapse whitespace-nowrap md:whitespace-normal">
            <thead className="border-b border-slate-200 dark:border-slate-800 shadow-sm">
              <tr className="bg-[#F8FAFC] dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold text-xs">
                <th className="px-6 py-3 w-48">{lang === 'zh' ? '技能名称' : 'Skill Name'}</th>
                <th className="px-6 py-3 w-32">{lang === 'zh' ? '来源类型' : 'Source'}</th>
                <th className="px-6 py-3 w-28 text-right">{lang === 'zh' ? '激活次数' : 'Activations'}</th>
                <th className="px-6 py-3 w-28 text-right">{lang === 'zh' ? '执行成功率' : 'Success Rate'}</th>
                <th className="px-6 py-3 w-32 text-center">{lang === 'zh' ? '历史记录' : 'History'}</th>
                <th className="px-6 py-3 w-48 text-center">{lang === 'zh' ? '操作' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {skills.map((skill) => {
                let desc = '无描述';
                try {
                  const doc = parseSkillMarkdown(skill['SKILL.md'], { root: skill.root, skillFile: 'SKILL.md' });
                  desc = doc?.metadata?.description || '无描述';
                } catch (e) {}

                const stats = skillStats[skill.name] || { activationCount: 0, successRate: 0 };
                const isUpdateEnabled = stats.successRate >= highScore;
                const isRollbackUninstallEnabled = stats.successRate <= lowScore;

                // Colorize success rate based on value compared to thresholds
                let rateColor = 'text-slate-600 dark:text-slate-300';
                if (stats.successRate >= highScore) rateColor = 'text-indigo-600 dark:text-indigo-400 font-bold';
                else if (stats.successRate <= lowScore) rateColor = 'text-rose-600 dark:text-rose-400 font-bold';

                return (
                  <tr key={skill.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={skill.name}>
                        {skill.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          skill.source === 'local'
                            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/30'
                            : skill.source === 'webmcp'
                              ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 border border-sky-200/40 dark:border-sky-900/30'
                              : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-900/30'
                        }`}
                      >
                        {skill.source === 'local' ? 'LOCAL' : skill.source === 'webmcp' ? 'WebMCP' : 'REMOTE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-slate-500">{stats.activationCount.toLocaleString()}</td>
                    <td className={`px-6 py-4 text-right font-mono text-sm ${rateColor}`}>{stats.successRate}%</td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium hover:underline text-xs cursor-pointer transition-colors">{lang === 'zh' ? '查看' : 'View'}</button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center space-x-1.5 min-w-[max-content]">
                        <button
                          disabled={!isUpdateEnabled}
                          title={isUpdateEnabled ? (lang === 'zh' ? '符合高评分标准，可以更新' : 'High score, able to update') : lang === 'zh' ? '执行成功率未达到高评分标准' : 'Success rate below high threshold'}
                          className={`px-2 py-1.5 flex items-center text-xs font-semibold rounded shrink-0 transition-colors ${
                            isUpdateEnabled
                              ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 cursor-pointer'
                              : 'text-slate-400 bg-slate-50 dark:text-slate-600 dark:bg-slate-800/50 cursor-not-allowed'
                          }`}
                        >
                          <DownloadCloud className="w-3.5 h-3.5 mr-1" />
                          {lang === 'zh' ? '更新' : 'Update'}
                        </button>
                        <button
                          disabled={!isRollbackUninstallEnabled}
                          title={isRollbackUninstallEnabled ? (lang === 'zh' ? '命中低质量标准，建议回滚' : 'Low score hit, suggest rollback') : lang === 'zh' ? '执行成功率未低于低评分标准' : 'Success rate not below low threshold'}
                          className={`px-2 py-1.5 flex items-center text-xs font-semibold rounded shrink-0 transition-colors ${
                            isRollbackUninstallEnabled
                              ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 cursor-pointer'
                              : 'text-slate-400 bg-slate-50 dark:text-slate-600 dark:bg-slate-800/50 cursor-not-allowed'
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          {lang === 'zh' ? '回滚' : 'Rollback'}
                        </button>
                        <button
                          disabled={!isRollbackUninstallEnabled}
                          title={isRollbackUninstallEnabled ? (lang === 'zh' ? '命中低质量标准，建议卸载' : 'Low score hit, suggest uninstall') : lang === 'zh' ? '执行成功率未低于低评分标准' : 'Success rate not below low threshold'}
                          className={`px-2 py-1.5 flex items-center text-xs font-semibold rounded shrink-0 transition-colors ${
                            isRollbackUninstallEnabled
                              ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 cursor-pointer'
                              : 'text-slate-400 bg-slate-50 dark:text-slate-600 dark:bg-slate-800/50 cursor-not-allowed'
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
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
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
