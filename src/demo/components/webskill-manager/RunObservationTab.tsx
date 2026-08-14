import React, { useState } from 'react';
import { Activity, CheckCircle2, XCircle, Search, List, ActivitySquare } from 'lucide-react';
import { useAgileData } from '../../context/AgileDataContext';

export function RunObservationTab() {
  const { traceLogs, traceMetrics, lang } = useAgileData();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isZh = lang === 'zh';

  const filteredLogs = traceLogs.filter((log) => log.traceId.includes(searchTerm) || log.skillName.toLowerCase().includes(searchTerm.toLowerCase()) || log.phase.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const totalExecutions = traceMetrics.successCount + traceMetrics.failureCount;
  const successRate = totalExecutions > 0 ? Math.round((traceMetrics.successCount / totalExecutions) * 100) + '%' : '0%';

  // Reset to page 1 if searching changes things
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="flex flex-col h-full bg-card w-full text-foreground" style={{ minHeight: '600px' }}>
      {/* 1. Summary Stats Bar */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-border bg-secondary/30">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center border border-border">
            <ActivitySquare className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{isZh ? '已激活技能总数' : 'Activated Skills'}</div>
            <div className="text-2xl font-bold font-mono text-foreground">{traceMetrics.activatedSkills}</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center border border-emerald-500/25">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{isZh ? '执行成功次数' : 'Success'}</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{traceMetrics.successCount}</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/15 flex items-center justify-center border border-destructive/25">
            <XCircle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{isZh ? '执行失败次数' : 'Failures'}</div>
            <div className="text-2xl font-bold font-mono text-destructive">{traceMetrics.failureCount}</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center border border-amber-500/25">
            <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{isZh ? '技能执行成功率' : 'Success Rate'}</div>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{successRate}</div>
          </div>
        </div>
      </div>

      {/* 2. Log Controls & Status */}
      <div className="px-4 py-3 bg-secondary/50 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <List className="w-4.5 h-4.5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-sm">{isZh ? '运行观测日志' : 'Run Observation Logs'}</h3>
          <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-bold px-2 py-0.5 rounded-md ml-2">LIVE</span>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={isZh ? '搜索 TraceID 或技能...' : 'Search TraceID or Skill...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs bg-background border border-input rounded-lg focus:outline-none focus:border-ring text-foreground w-64"
          />
        </div>
      </div>

      {/* 3. Log Table */}
      <div className="flex-1 overflow-auto bg-card">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-secondary/60 text-xs font-semibold text-muted-foreground sticky top-0 shadow-xs z-10">
            <tr>
              <th className="px-4 py-3 font-mono uppercase tracking-wider border-b border-border w-32">TraceID</th>
              <th className="px-4 py-3 font-mono uppercase tracking-wider border-b border-border w-36">{isZh ? '生命周期阶段' : 'Phase'}</th>
              <th className="px-4 py-3 font-mono uppercase tracking-wider border-b border-border w-44">{isZh ? '技能名称' : 'Skill Name'}</th>
              <th className="px-4 py-3 font-mono uppercase tracking-wider border-b border-border min-w-48">{isZh ? '输入参数' : 'Input'}</th>
              <th className="px-4 py-3 font-mono uppercase tracking-wider border-b border-border min-w-48">{isZh ? '输出结果' : 'Output'}</th>
              <th className="px-4 py-3 font-mono uppercase tracking-wider border-b border-border w-24 text-right">{isZh ? '执行时间' : 'Time'}</th>
              <th className="px-4 py-3 font-mono uppercase tracking-wider border-b border-border w-40">{isZh ? '记录时间' : 'Record Time'}</th>
            </tr>
          </thead>
          <tbody className="text-xs divide-y divide-border">
            {currentLogs.map((log) => (
              <tr key={log.id} className="hover:bg-accent/40 transition">
                <td className="px-4 py-3 font-mono text-muted-foreground">{log.traceId}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                      log.phase === 'DISCOVERED'
                        ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
                        : log.phase === 'ACTIVATED'
                          ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30'
                          : log.phase === 'EXECUTING'
                            ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                            : log.phase === 'AWAITING_USER'
                              ? 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30'
                              : log.phase === 'COMPLETED'
                                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                                : log.phase === 'ERROR'
                                  ? 'bg-destructive/15 text-destructive border-destructive/30 font-bold'
                                  : 'bg-secondary text-foreground font-medium border-border'
                    }`}
                  >
                    {log.phase}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-medium text-foreground whitespace-nowrap">{log.skillName}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono">
                  <div className="line-clamp-2" title={log.inputParams}>
                    {log.inputParams || '-'}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground font-mono">
                  <div className="line-clamp-2" title={log.outputResult}>
                    {log.outputResult || '-'}
                  </div>
                </td>
                <td className="px-4 py-2.5 font-mono text-right text-muted-foreground">{log.executionTimeMs}ms</td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{log.recordTime}</td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center">
                    <Activity className="w-8 h-8 mb-2 opacity-40" />
                    <span>{searchTerm ? (isZh ? '没有找到匹配的日志' : 'No matching logs') : isZh ? '暂无运行日志，请在左侧对话框中发起请求' : 'No logs yet, please ask the assistant in the panel.'}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-secondary/30">
          <div className="text-xs text-muted-foreground font-mono">
            {isZh
              ? `显示 ${startIndex + 1} 到 ${Math.min(startIndex + itemsPerPage, filteredLogs.length)} 条，共 ${filteredLogs.length} 条记录`
              : `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, filteredLogs.length)} of ${filteredLogs.length} records`}
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary px-2.5 py-1 text-xs disabled:opacity-40"
            >
              {isZh ? '上一页' : 'Prev'}
            </button>
            <span className="px-2.5 py-1 text-muted-foreground font-mono text-xs">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary px-2.5 py-1 text-xs disabled:opacity-40"
            >
              {isZh ? '下一页' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
