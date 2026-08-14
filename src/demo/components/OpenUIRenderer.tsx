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
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
            <CheckSquare className="w-4 h-4 mr-1.5 shrink-0" />
            <span>{lang === 'zh' ? '选项已成功提交，正在为您生成报告...' : 'Selection submitted, generating report...'}</span>
          </p>
        </div>
      );
    }
    return (
      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1.5 mt-2 animate-fadeIn select-none">
        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
          <CheckSquare className="w-4 h-4 mr-1.5 shrink-0" />
          <span>{createdSummary}</span>
        </p>
        <p className="text-xs text-muted-foreground font-bold font-mono">{lang === 'zh' ? '敏捷度量大屏、计划迭代以及看板已实时重绘！' : 'Metrics dashboards and kanbans updated instantly!'}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 bg-card p-4 rounded-xl border border-border mt-2 animate-fadeIn text-left shadow-xs">
      <div className="space-y-3">
        {schema.formFields?.map((f) => {
          return (
            <div key={f.key} className="space-y-1">
              <label className="block text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest leading-none">{f.label}</label>

              {f.type === 'radio' ? (
                <div className="space-y-1.5 mt-1 pt-0.5">
                  {f.options?.map((opt) => {
                    const isChecked = (formData[f.key] || '') === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex items-center space-x-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-primary/10 border-primary text-foreground font-semibold'
                            : 'bg-card border-border hover:bg-accent/40 text-muted-foreground'
                        }`}
                      >
                        <input
                          type="radio"
                          name={f.key}
                          value={opt.value}
                          checked={isChecked}
                          onChange={() => setFormData({ ...formData, [f.key]: opt.value })}
                          className="w-4 h-4 text-primary border-input bg-card cursor-pointer accent-primary"
                        />
                        <span className="text-sm font-semibold">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              ) : f.type === 'select' ? (
                <select
                  value={formData[f.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                  className="w-full text-sm font-semibold bg-background text-foreground border border-input rounded-lg px-2.5 py-2 focus:outline-none focus:border-ring transition cursor-pointer"
                >
                  {f.options?.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-background text-foreground">
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
                  className="w-full text-sm font-medium bg-background text-foreground border border-input rounded-lg px-2.5 py-2 focus:outline-none focus:border-ring transition placeholder:text-muted-foreground leading-normal"
                />
              ) : (
                <input
                  type="text"
                  value={formData[f.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  required
                  className="w-full text-sm font-semibold bg-background text-foreground border border-input rounded-lg px-2.5 py-2 focus:outline-none focus:border-ring transition placeholder:text-muted-foreground"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-1">
        <button type="submit" className="btn-primary px-5 py-2 font-bold text-sm shadow-xs cursor-pointer">
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
              <div key={idx} className="p-3.5 rounded-xl border border-border bg-card shadow-xs hover:border-primary transition">
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider font-bold truncate">{kpi.label}</div>
                <div className="flex items-baseline justify-between mt-1.5">
                  <span className={`text-2xl font-extrabold font-mono tracking-tight ${kpi.color || 'text-foreground'}`}>{kpi.value}</span>
                  {kpi.change && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-bold flex items-center space-x-1 font-mono border ${
                        kpi.trend === 'up'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : kpi.trend === 'down'
                            ? 'bg-destructive/10 text-destructive border-destructive/20'
                            : 'bg-secondary text-muted-foreground border-border'
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
              <div key={idx} className="rounded-xl border border-border bg-secondary/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-extrabold text-foreground flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                    <span>{group.title}</span>
                  </h5>
                  <span className="text-xs bg-card text-muted-foreground px-2 py-0.5 rounded-md font-bold font-mono border border-border">{group.items.length}</span>
                </div>
                <div className="space-y-2">
                  {group.items.length === 0 ? (
                    <div className="text-center py-4 text-xs text-muted-foreground italic">No tasks active</div>
                  ) : (
                    group.items.map((item) => (
                      <div key={item.id} className="p-3 rounded-lg border border-border bg-card shadow-xs hover:border-primary transition cursor-pointer">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-mono font-bold text-foreground">{item.id}</span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md font-mono border ${
                              item.priority === 'High'
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : item.priority === 'Medium'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  : 'bg-secondary text-muted-foreground border-border'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-relaxed mb-1.5">{item.title}</p>
                        {item.reporter && (
                          <div className="text-xs text-muted-foreground font-bold font-mono">
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
          <div className="overflow-x-auto rounded-xl border border-border mt-2 shadow-xs bg-card" id="openui-table">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-secondary/60 border-b border-border text-muted-foreground font-semibold">
                  {schema.data?.columns?.map((col) => (
                    <th key={col.key} className="p-3 font-bold tracking-tight">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {schema.data?.rows?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-accent/40 bg-card">
                    {schema.data?.columns?.map((col) => (
                      <td key={col.key} className="p-3 text-foreground">
                        {col.key === 'id' ? (
                          <span className="font-mono font-bold text-foreground">{row[col.key]}</span>
                        ) : col.key === 'priority' ? (
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold border ${
                              row[col.key] === 'High'
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : row[col.key] === 'Medium'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  : 'bg-secondary text-muted-foreground border-border'
                            }`}
                          >
                            {row[col.key]}
                          </span>
                        ) : col.key === 'status' ? (
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-bold border ${
                              row[col.key] === 'Done'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : row[col.key] === 'In Progress'
                                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                                  : 'bg-secondary text-muted-foreground border-border'
                            }`}
                          >
                            {row[col.key]}
                          </span>
                        ) : (
                          <span className="text-foreground font-semibold line-clamp-1 text-sm">{row[col.key]}</span>
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
            <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between mt-2 shadow-xs" id="openui-donut-chart">
              {/* Custom SVG gauge */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle className="text-secondary" strokeWidth="3.5" stroke="currentColor" fill="none" cx="18" cy="18" r="15.9155" />
                  {/* Draw slices for critical, major, minor */}
                  {points.map((p, index) => {
                    const prevSum = points.slice(0, index).reduce((sum, item) => sum + item.value, 0);
                    const percentage = totalVal ? (p.value / totalVal) * 100 : 0;
                    const dashArray = `${percentage} ${100 - percentage}`;
                    const dashOffset = totalVal ? -((prevSum / totalVal) * 100) : 0;

                    const colors = [
                      '#e11d48', // rose-600
                      '#d97706', // amber-600
                      '#059669' // emerald-600
                    ];

                    return <circle key={index} stroke={colors[index % colors.length]} strokeWidth="3.8" strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round" fill="none" cx="18" cy="18" r="15.9155" />;
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                  <span className="text-sm font-bold font-mono text-foreground">{totalVal}</span>
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Bugs</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 ml-4 space-y-2">
                {points.map((p, index) => {
                  const colors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500'];
                  return (
                    <div key={index} className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center space-x-1.5 text-muted-foreground">
                        <span className={`w-2 h-2 rounded-full ${colors[index % colors.length]}`} />
                        <span className="capitalize">{p.label}</span>
                      </div>
                      <span className="font-mono text-foreground">
                        {p.value} ({totalVal ? Math.round((p.value / totalVal) * 100) : 0}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        } else {
          // Render bar graph
          const maxVal = points.length > 0 ? Math.max(...points.map((p) => p.value)) : 0;
          return (
            <div className="rounded-xl border border-border bg-card p-4 mt-2 shadow-xs" id="openui-bar-chart">
              <div className="space-y-3">
                {points.map((p, index) => {
                  const percentWidth = maxVal ? (p.value / maxVal) * 100 : 0;
                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-foreground truncate max-w-[160px] font-bold text-sm">{p.label}</span>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="text-foreground font-bold text-sm">{p.value} pts</span>
                          {p.secondaryValue !== undefined && <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">({p.secondaryValue}%)</span>}
                        </div>
                      </div>
                      <div className="h-4 w-full bg-secondary border border-border rounded-lg overflow-hidden relative flex items-center">
                        <div className="h-full bg-primary rounded-lg transition-all duration-500" style={{ width: `${percentWidth}%` }} />
                        {p.secondaryValue !== undefined && <div className="absolute top-0 bottom-0 bg-emerald-500/20 border-r-2 border-emerald-500 transition-all duration-500" style={{ width: `${p.secondaryValue}%` }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3.5 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2.5 font-bold select-none">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-1.5 bg-primary inline-block rounded-xs" />
                  <span>{lang === 'zh' ? '规划故事点' : 'Velocity Capacity'}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-1.5 bg-emerald-500 inline-block rounded-xs" />
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
              <div className="grid grid-cols-3 gap-2.5">
                {dashData.kpis.map((kpi, idx) => (
                  <div key={idx} className="p-3 bg-card border border-border rounded-xl">
                    <div className="text-xs text-muted-foreground font-bold mb-1 line-clamp-1">{kpi.label}</div>
                    <div className={`text-base font-black font-mono ${kpi.color || 'text-foreground'}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Bar Chart */}
            {dashData.barPoints && dashData.barPoints.length > 0 && (
              <div className="p-3.5 bg-card border border-border rounded-xl space-y-3">
                <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">{lang === 'zh' ? '迭代速率对比' : 'Iteration Velocity'}</div>
                {dashData.barPoints.map((p, index) => {
                  const percentWidth = maxVal ? (p.value / maxVal) * 100 : 0;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-foreground truncate font-medium">{p.label}</span>
                        <span className="text-foreground font-mono font-bold">{p.value} pts</span>
                      </div>
                      <div className="h-3 bg-secondary rounded-lg overflow-hidden relative">
                        <div className="h-full bg-primary" style={{ width: `${percentWidth}%` }} />
                        {p.secondaryValue !== undefined && <div className="absolute top-0 bottom-0 bg-emerald-500/30 border-r-2 border-emerald-500" style={{ width: `${p.secondaryValue}%` }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Donut Chart */}
            <div className="p-3.5 bg-card border border-border rounded-xl flex items-center justify-between">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle className="text-secondary" strokeWidth="4" stroke="currentColor" fill="none" cx="18" cy="18" r="15.9155" />
                  {dashData.donutPoints.map((p, index) => {
                    const prevSum = dashData.donutPoints.slice(0, index).reduce((sum, item) => sum + item.value, 0);
                    const percentage = totalVal ? (p.value / totalVal) * 100 : 0;
                    const dashOffset = totalVal ? -((prevSum / totalVal) * 100) : 0;
                    const colors = ['#e11d48', '#d97706', '#059669'];
                    return <circle key={index} stroke={colors[index % colors.length]} strokeWidth="4" strokeDasharray={`${percentage} ${100 - percentage}`} strokeDashoffset={dashOffset} fill="none" cx="18" cy="18" r="15.9155" />;
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold font-mono text-foreground">{totalVal}</span>
                </div>
              </div>
              <div className="flex-1 ml-4 space-y-1.5">
                {dashData.donutPoints.map((p, index) => {
                  const colors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500'];
                  return (
                    <div key={index} className="flex justify-between text-xs font-bold">
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full ${colors[index % colors.length]}`} />
                        <span className="text-muted-foreground">{p.label}</span>
                      </div>
                      <span className="font-mono text-foreground">{p.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Tables */}
            {dashData.tables && dashData.tables.length > 0 && (
              <div className="space-y-3 mt-4">
                {dashData.tables.map((table, tIdx) => (
                  <div key={tIdx} className="p-3.5 bg-card border border-border rounded-xl">
                    <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">{table.title}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr>
                            {table.columns.map((col) => (
                              <th key={col.key} className="pb-2 font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {table.rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {table.columns.map((col) => (
                                <td key={col.key} className="py-2.5 text-foreground">
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
              <div key={idx} className="p-3.5 rounded-xl border border-border bg-card shadow-xs hover:border-primary transition flex flex-col justify-between text-left">
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest font-mono leading-none mb-1.5">{kpi.label}</div>
                  <div className="flex items-baseline space-x-1.5">
                    <span className={`text-2xl font-extrabold font-mono tracking-tight ${kpi.color || 'text-foreground'}`}>{kpi.value}</span>
                  </div>
                </div>
                {kpi.change && (
                  <div
                    className={`mt-2 text-xs inline-flex self-start px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-bold font-mono items-center space-x-1`}
                  >
                    <TrendingUp className="w-3 h-3 mr-0.5" />
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
        <div className="bg-muted border border-border text-foreground p-3 rounded-xl text-xs font-mono leading-relaxed overflow-x-auto max-h-[220px]">
          <pre>{JSON.stringify(schema, null, 2)}</pre>
        </div>
      ) : (
        <div className="transition-all duration-300">{renderContent()}</div>
      )}

      {/* Mini indicator under the data visualizer block */}
      <div className="flex justify-between items-center text-xs text-muted-foreground font-mono font-bold px-1 select-none pt-1">
        <span className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-primary inline-block mr-1.5 animate-pulse" />
          <span>{lang === 'zh' ? '生成式 UI 引擎渲染' : 'OpenUI Engine active'}</span>
        </span>
        <button onClick={() => setShowDSL(!showDSL)} className="text-muted-foreground hover:text-foreground font-extrabold uppercase tracking-widest flex items-center transition cursor-pointer">
          {showDSL ? (lang === 'zh' ? '[显示图表]' : '[Show Visual]') : lang === 'zh' ? '[查看 UI Schema]' : '[View UI Schema JSON]'}
        </button>
      </div>
    </div>
  );
};
