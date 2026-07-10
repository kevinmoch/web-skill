import React, { useState } from 'react';
import { OpenUISchema } from '../types';
import { useAgileData } from '../context/AgileDataContext';
import { TrendingUp, CheckSquare } from 'lucide-react';

interface OpenUIRendererProps {
  schema: OpenUISchema;
  lang: 'zh' | 'en';
}

const InteractiveForm: React.FC<{
  schema: OpenUISchema;
  lang: 'zh' | 'en';
  onSubmitted?: () => void;
}> = ({ schema, lang, onSubmitted }) => {
  const { projects, addBug, addRequirement, setCurrentProjectId, currentProjectId, sendChatMessage } = useAgileData();
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    schema.formFields?.forEach((f) => {
      initial[f.key] = f.defaultValue || '';
    });
    return initial;
  });
  const [submitted, setSubmitted] = useState(false);
  const [createdSummary, setCreatedSummary] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const projId = formData['projectId'] || currentProjectId;

    if (schema.formActionId === 'create-bug') {
      const title = formData['title'] || 'New reported incident';
      const severity = formData['severity'] || 'Major';
      const description = formData['description'] || 'No description provided.';

      // Select project so it aligns on standard UI views automatically!
      setCurrentProjectId(projId);

      addBug({
        projectId: projId,
        title,
        severity: severity as any,
        module: description,
        status: 'Open',
        createdAt: new Date().toISOString().split('T')[0],
        assignee: lang === 'zh' ? '经办人(AI分配)' : 'Wang',
        reporter: lang === 'zh' ? '智能客服' : 'AI Copilot'
      });

      const matchedProj = projects.find((p) => p.id === projId);
      const projName = matchedProj ? (lang === 'zh' ? matchedProj.name : matchedProj.name_en) : projId;
      setCreatedSummary(lang === 'zh' ? `✅ 成功！故障单已提交至【${projName}】，状态：已挂起待办。` : `✅ Submitted! Defect logged in project "${projName}" as an open ticket.`);
      setSubmitted(true);
      if (onSubmitted) onSubmitted();
    } else if (schema.formActionId === 'create-requirement') {
      const title = formData['title'] || 'New capability';
      const priority = formData['priority'] || 'High';
      const description = formData['description'] || '';

      setCurrentProjectId(projId);
      addRequirement({
        projectId: projId,
        title,
        priority: priority as any,
        status: 'Todo',
        description,
        reporter: lang === 'zh' ? '智能助理' : 'AI Copilot',
        assignee: 'Wang',
        epic: 'AI Automation',
        storyPoints: 5
      });

      const matchedProj = projects.find((p) => p.id === projId);
      const projName = matchedProj ? (lang === 'zh' ? matchedProj.name : matchedProj.name_en) : projId;
      setCreatedSummary(lang === 'zh' ? `✅ 成功！新需求已录入至【${projName}】待办队列 (Roadmap Backlog)。` : `✅ Requirement logged! Placed inside backlog of project "${projName}".`);
      setSubmitted(true);
      if (onSubmitted) onSubmitted();
    } else if (schema.formActionId === 'analyze-project') {
      setSubmitted(true);
      if (onSubmitted) onSubmitted();

      // Auto trigger the bot to perform the real analysis. The user won't type this manually.
      setTimeout(() => {
        sendChatMessage(lang === 'zh' ? `分析迭代进度 ${projId}` : `Analyze sprint progress ${projId}`);
      }, 500);
    } else if (schema.formActionId === 'analyze-bug-severity') {
      setSubmitted(true);
      if (onSubmitted) onSubmitted();

      setTimeout(() => {
        sendChatMessage(lang === 'zh' ? `分析缺陷严重程度 ${projId}` : `Analyze bug severity ${projId}`);
      }, 500);
    } else if (schema.formActionId === 'analyze-kanban') {
      setSubmitted(true);
      if (onSubmitted) onSubmitted();

      setTimeout(() => {
        sendChatMessage(lang === 'zh' ? `分析项目需求 ${projId}` : `Analyze project requirements ${projId}`);
      }, 500);
    }
  };

  if (submitted) {
    if (schema.formActionId === 'analyze-project' || schema.formActionId === 'analyze-bug-severity' || schema.formActionId === 'analyze-kanban') {
      return (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1.5 mt-2 animate-fadeIn select-none">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
            <CheckSquare className="w-4 h-4 mr-1.5 shrink-0" />
            <span>{lang === 'zh' ? '选项已成功提交，正在为您生成报告...' : 'Selection submitted, generating report...'}</span>
          </p>
        </div>
      );
    }
    return (
      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1.5 mt-2 animate-fadeIn select-none">
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
          <CheckSquare className="w-4 h-4 mr-1.5 shrink-0" />
          <span>{createdSummary}</span>
        </p>
        <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold font-mono">{lang === 'zh' ? '敏捷度量大屏、计划迭代以及看板已实时重绘！' : 'Metrics dashboards and kanbans updated instantly!'}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mt-2 animate-fadeIn text-left shadow-xs">
      <div className="space-y-3">
        {schema.formFields?.map((f) => {
          return (
            <div key={f.key} className="space-y-1">
              <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">{f.label}</label>

              {f.type === 'radio' ? (
                <div className="space-y-1.5 mt-1 pt-0.5">
                  {f.options?.map((opt) => {
                    const isChecked = (formData[f.key] || '') === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex items-center space-x-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-500/10 dark:bg-indigo-600/15 border-indigo-500 dark:border-indigo-400 ring-1 ring-indigo-500/20 text-indigo-900 dark:text-indigo-200'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={f.key}
                          value={opt.value}
                          checked={isChecked}
                          onChange={() => setFormData({ ...formData, [f.key]: opt.value })}
                          className="w-3.5 h-3.5 text-indigo-650 border-slate-300 dark:border-slate-700 focus:ring-indigo-500 bg-white dark:bg-slate-950 cursor-pointer accent-indigo-600"
                        />
                        <span className="text-xs font-semibold">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              ) : f.type === 'select' ? (
                <select
                  value={formData[f.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                  className="w-full text-xs font-semibold bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-550 transition cursor-pointer"
                >
                  {f.options?.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea
                  value={formData[f.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  rows={2}
                  className="w-full text-xs font-medium bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-550 transition placeholder-slate-400 dark:placeholder-slate-500 leading-normal"
                />
              ) : (
                <input
                  type="text"
                  value={formData[f.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  required
                  className="w-full text-xs font-semibold bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 transition placeholder-slate-400 dark:placeholder-slate-500"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-1">
        <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md hover:shadow-indigo-500/10 cursor-pointer duration-155">
          {schema.formSubmitText || (lang === 'zh' ? '确认提交' : 'Submit')}
        </button>
      </div>
    </form>
  );
};

export const OpenUIRenderer: React.FC<OpenUIRendererProps> = ({ schema, lang }) => {
  const [showDSL, setShowDSL] = useState(false);

  // Render different OpenUI templates based on schema.type
  const renderContent = () => {
    switch (schema.type) {
      case 'form':
        return <InteractiveForm schema={schema} lang={lang} />;

      case 'kpis':
        return (
          <div className="grid grid-cols-2 gap-3 mt-2" id="openui-kpi-grid">
            {schema.data?.kpis?.map((kpi, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 shadow-xs hover:border-indigo-500 transition">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">{kpi.label}</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-xl font-extrabold font-mono tracking-tight ${kpi.color || 'text-slate-900 dark:text-white'}`}>{kpi.value}</span>
                  {kpi.change && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center space-x-1 font-mono ${
                        kpi.trend === 'up'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/45 dark:border-emerald-900/40'
                          : kpi.trend === 'down'
                            ? 'bg-rose-50 dark:bg-rose-905/40 text-rose-600 dark:text-rose-400 border border-rose-200/45 dark:border-rose-900/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {kpi.trend === 'up' ? '▲' : kpi.trend === 'down' ? '▼' : '■'} {kpi.change}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'kanban':
        return (
          <div className="space-y-3 mt-2" id="openui-kanban-board">
            {schema.data?.kanbanGroups?.map((group, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/40 dark:bg-slate-900/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-550 inline-block" />
                    <span>{group.title}</span>
                  </h5>
                  <span className="text-[9px] bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full font-bold font-mono border border-slate-200/60 dark:border-slate-700">{group.items.length}</span>
                </div>
                <div className="space-y-2">
                  {group.items.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-500 italic">No tasks active</div>
                  ) : (
                    group.items.map((item) => (
                      <div key={item.id} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs hover:border-indigo-500/70 transition cursor-pointer">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.id}</span>
                          <span
                            className={`text-[9px] font-bold px-1 rounded-full font-mono ${
                              item.priority === 'High'
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                                : item.priority === 'Medium'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-relaxed mb-1.5">{item.title}</p>
                        {item.reporter && (
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold font-mono">
                            {lang === 'zh' ? '受理自::' : 'Assigned::'} {item.reporter}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'table':
        return (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 mt-2 shadow-xs" id="openui-table">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  {schema.data?.columns?.map((col) => (
                    <th key={col.key} className="p-2.5 font-bold tracking-tight">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schema.data?.rows?.map((row, idx) => (
                  <tr key={idx} className="border-b last:border-0 border-slate-150 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 bg-white dark:bg-slate-950">
                    {schema.data?.columns?.map((col) => (
                      <td key={col.key} className="p-2.5 text-slate-700 dark:text-slate-200">
                        {col.key === 'id' ? (
                          <span className="font-mono font-bold text-indigo-650 dark:text-indigo-400">{row[col.key]}</span>
                        ) : col.key === 'priority' ? (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              row[col.key] === 'High'
                                ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                                : row[col.key] === 'Medium'
                                  ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {row[col.key]}
                          </span>
                        ) : col.key === 'status' ? (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              row[col.key] === 'Done'
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                                : row[col.key] === 'In Progress'
                                  ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {row[col.key]}
                          </span>
                        ) : (
                          <span className="text-slate-700 dark:text-slate-250 font-semibold line-clamp-1">{row[col.key]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'chart':
        const points = schema.data?.chartPoints || [];
        const isDonut = schema.data?.chartType === 'donut';

        if (isDonut) {
          const totalVal = points.reduce((sum, p) => sum + p.value, 0);
          return (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-3.5 flex items-center justify-between mt-2 shadow-xs" id="openui-donut-chart">
              {/* Custom SVG gauge */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle className="text-slate-100 dark:text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none" cx="18" cy="18" r="15.9155" />
                  {/* Draw slices for critical, major, minor */}
                  {points.map((p, index) => {
                    const prevSum = points.slice(0, index).reduce((sum, item) => sum + item.value, 0);
                    const percentage = totalVal ? (p.value / totalVal) * 100 : 0;
                    const dashArray = `${percentage} ${100 - percentage}`;
                    const dashOffset = totalVal ? -((prevSum / totalVal) * 100) : 0;

                    const colors = [
                      '#f43f5e', // rose-500
                      '#f59e0b', // amber-500
                      '#10b981' // emerald-500
                    ];

                    return <circle key={index} stroke={colors[index % colors.length]} strokeWidth="3.8" strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round" fill="none" cx="18" cy="18" r="15.9155" />;
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                  <span className="text-xs font-bold font-mono text-slate-800 dark:text-white">{totalVal}</span>
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Bugs</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 ml-4 space-y-1.5">
                {points.map((p, index) => {
                  const colors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500'];
                  return (
                    <div key={index} className="flex items-center justify-between text-[11px] font-bold">
                      <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${colors[index % colors.length]}`} />
                        <span className="capitalize">{p.label}</span>
                      </div>
                      <span className="font-mono text-slate-800 dark:text-white">
                        {p.value} ({totalVal ? Math.round((p.value / totalVal) * 100) : 0}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        } else {
          // Render beautiful custom bar graph
          const maxVal = points.length > 0 ? Math.max(...points.map((p) => p.value)) : 0;
          return (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-3 mt-2 shadow-xs" id="openui-bar-chart">
              <div className="space-y-2.5">
                {points.map((p, index) => {
                  const percentWidth = maxVal ? (p.value / maxVal) * 100 : 0;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[140px] font-bold">{p.label}</span>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="text-slate-850 dark:text-slate-100 font-bold">{p.value} pts</span>
                          {p.secondaryValue !== undefined && <span className="text-emerald-500 dark:text-emerald-400 font-bold">({p.secondaryValue}%)</span>}
                        </div>
                      </div>
                      <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden relative flex items-center">
                        <div className="h-full bg-linear-to-r from-indigo-600 to-indigo-500 rounded-lg transition-all duration-500" style={{ width: `${percentWidth}%` }} />
                        {p.secondaryValue !== undefined && <div className="absolute top-0 bottom-0 bg-emerald-500/20 border-r-2 border-emerald-500 transition-all duration-500" style={{ width: `${p.secondaryValue}%` }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 border-t border-slate-150 dark:border-slate-800 pt-2 font-bold select-none">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-1 bg-indigo-500 inline-block rounded-xs" />
                  <span>{lang === 'zh' ? '规划故事点' : 'Velocity Capacity'}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-1 bg-emerald-500 inline-block rounded-xs" />
                  <span>{lang === 'zh' ? '完成比率 (%)' : 'Sprint Progress (%)'}</span>
                </span>
              </div>
            </div>
          );
        }

      case 'dashboard': {
        const dashData = schema.data?.dashboardData;
        if (!dashData) return null;

        const maxVal = dashData.barPoints.length > 0 ? Math.max(...dashData.barPoints.map((p) => p.value)) : 0;
        const totalVal = dashData.donutPoints.reduce((sum, p) => sum + p.value, 0);

        return (
          <div className="space-y-4 mt-2">
            {/* KPIs */}
            {dashData.kpis && dashData.kpis.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {dashData.kpis.map((kpi, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="text-[9px] text-slate-500 font-bold mb-1 line-clamp-1">{kpi.label}</div>
                    <div className={`text-sm font-black font-mono ${kpi.color || 'text-slate-800 dark:text-white'}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Bar Chart */}
            {dashData.barPoints && dashData.barPoints.length > 0 && (
              <div className="p-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
                <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wide">{lang === 'zh' ? '迭代速率对比' : 'Iteration Velocity'}</div>
                {dashData.barPoints.map((p, index) => {
                  const percentWidth = maxVal ? (p.value / maxVal) * 100 : 0;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold">
                        <span className="text-slate-700 dark:text-slate-300 truncate">{p.label}</span>
                        <span className="text-slate-850 dark:text-slate-100">{p.value} pts</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative">
                        <div className="h-full bg-indigo-500" style={{ width: `${percentWidth}%` }} />
                        {p.secondaryValue !== undefined && <div className="absolute top-0 bottom-0 bg-emerald-500/30 border-r-2 border-emerald-500" style={{ width: `${p.secondaryValue}%` }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Donut Chart */}
            <div className="p-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle className="text-slate-100 dark:text-slate-800" strokeWidth="4" stroke="currentColor" fill="none" cx="18" cy="18" r="15.9155" />
                  {dashData.donutPoints.map((p, index) => {
                    const prevSum = dashData.donutPoints.slice(0, index).reduce((sum, item) => sum + item.value, 0);
                    const percentage = totalVal ? (p.value / totalVal) * 100 : 0;
                    const dashOffset = totalVal ? -((prevSum / totalVal) * 100) : 0;
                    const colors = ['#f43f5e', '#f59e0b', '#10b981'];
                    return <circle key={index} stroke={colors[index % colors.length]} strokeWidth="4" strokeDasharray={`${percentage} ${100 - percentage}`} strokeDashoffset={dashOffset} fill="none" cx="18" cy="18" r="15.9155" />;
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold font-mono">{totalVal}</span>
                </div>
              </div>
              <div className="flex-1 ml-4 space-y-1">
                {dashData.donutPoints.map((p, index) => {
                  const colors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500'];
                  return (
                    <div key={index} className="flex justify-between text-[10px] font-bold">
                      <div className="flex items-center space-x-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${colors[index % colors.length]}`} />
                        <span className="text-slate-600 dark:text-slate-400">{p.label}</span>
                      </div>
                      <span className="font-mono text-slate-800 dark:text-white">{p.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Tables */}
            {dashData.tables && dashData.tables.length > 0 && (
              <div className="space-y-3 mt-4">
                {dashData.tables.map((table, tIdx) => (
                  <div key={tIdx} className="p-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wide">{table.title}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr>
                            {table.columns.map((col) => (
                              <th key={col.key} className="pb-2 text-[9px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {table.rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {table.columns.map((col) => (
                                <td key={col.key} className="py-2 text-[10px] text-slate-700 dark:text-slate-300">
                                  {row[col.key]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'metrics':
        return (
          <div className="grid grid-cols-2 gap-3 mt-2" id="openui-metrics-card-grid">
            {schema.data?.kpis?.map((kpi, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 shadow-xs hover:border-violet-500 transition flex flex-col justify-between text-left">
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest font-mono leading-none mb-1">{kpi.label}</div>
                  <div className="flex items-baseline space-x-1.5">
                    <span className={`text-xl font-extrabold font-mono tracking-tight ${kpi.color || 'text-slate-900 dark:text-white'}`}>{kpi.value}</span>
                  </div>
                </div>
                {kpi.change && (
                  <div
                    className={`mt-2 text-[9px] inline-flex self-start px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-[#1E293B] text-indigo-600 dark:text-indigo-400 font-bold font-mono items-center space-x-1`}
                  >
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                    <span>{kpi.change}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-2 relative overflow-hidden text-left" id="openui-seamless-renderer">
      {/* Visual Component Render */}
      {showDSL ? (
        <div className="bg-slate-950 border border-slate-800 text-slate-300 p-3 rounded-xl text-[10px] font-mono leading-relaxed overflow-x-auto max-h-[220px]">
          <pre>{JSON.stringify(schema, null, 2)}</pre>
        </div>
      ) : (
        <div className="transition-all duration-300">{renderContent()}</div>
      )}

      {/* Mini indicator under the data visualizer block */}
      <div className="flex justify-between items-center text-[9px] text-indigo-600 dark:text-[#818CF8]/85 font-mono font-bold px-1 select-none pt-1">
        <span className="flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 inline-block mr-1 animate-pulse" />
          <span>{lang === 'zh' ? '生成式 UI 引擎渲染' : 'OpenUI Engine active'}</span>
        </span>
        <button onClick={() => setShowDSL(!showDSL)} className="text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 font-extrabold uppercase tracking-widest flex items-center transition cursor-pointer">
          {showDSL ? (lang === 'zh' ? '[显示图表]' : '[Show Visual]') : lang === 'zh' ? '[查看 UI Schema]' : '[View UI Schema JSON]'}
        </button>
      </div>
    </div>
  );
};
