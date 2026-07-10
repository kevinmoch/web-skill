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
    <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-[#0F172A] w-full animate-fadeIn" style={{ minHeight: '600px' }}>
      {/* 1. Summary Stats Bar */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151D30]">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center">
            <ActivitySquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isZh ? '已激活技能总数' : 'Activated Skills'}</div>
            <div className="text-xl font-black text-slate-800 dark:text-slate-100">{traceMetrics.activatedSkills}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isZh ? '执行成功次数' : 'Success'}</div>
            <div className="text-xl font-black text-slate-800 dark:text-slate-100">{traceMetrics.successCount}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/40 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isZh ? '执行失败次数' : 'Failures'}</div>
            <div className="text-xl font-black text-slate-800 dark:text-slate-100">{traceMetrics.failureCount}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/40 flex items-center justify-center">
            <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isZh ? '技能执行成功率' : 'Success Rate'}</div>
            <div className="text-xl font-black text-slate-800 dark:text-slate-100">{successRate}</div>
          </div>
        </div>
      </div>

      {/* 2. Log Controls & Status */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <List className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">{isZh ? '运行观测日志' : 'Run Observation Logs'}</h3>
          <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">LIVE</span>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 pl-0.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isZh ? '搜索 TraceID 或技能...' : 'Search TraceID or Skill...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200 w-64"
          />
        </div>
      </div>

      {/* 3. Log Table */}
      <div className="flex-1 overflow-auto bg-white dark:bg-[#0F172A]">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-[#F8FAFC] dark:bg-slate-900/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 sticky top-0 shadow-sm z-10">
            <tr>
              <th className="px-4 py-3 font-mono uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 w-32">TraceID</th>
              <th className="px-4 py-3 font-mono uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 w-36">{isZh ? '生命周期阶段' : 'Phase'}</th>
              <th className="px-4 py-3 font-mono uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 w-44">{isZh ? '技能名称' : 'Skill Name'}</th>
              <th className="px-4 py-3 font-mono uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 min-w-48">{isZh ? '输入参数' : 'Input'}</th>
              <th className="px-4 py-3 font-mono uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 min-w-48">{isZh ? '输出结果' : 'Output'}</th>
              <th className="px-4 py-3 font-mono uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 w-24 text-right">{isZh ? '执行时间' : 'Time'}</th>
              <th className="px-4 py-3 font-mono uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 w-40">{isZh ? '记录时间' : 'Record Time'}</th>
            </tr>
          </thead>
          <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/60">
            {currentLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{log.traceId}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      log.phase === 'DISCOVERED'
                        ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50'
                        : log.phase === 'ACTIVATED'
                          ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50'
                          : log.phase === 'EXECUTING'
                            ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50'
                            : log.phase === 'AWAITING_USER'
                              ? 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800/50'
                              : log.phase === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50'
                                : log.phase === 'ERROR'
                                  ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {log.phase}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{log.skillName}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  <div className="line-clamp-2" title={log.inputParams}>
                    {log.inputParams || '-'}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  <div className="line-clamp-2" title={log.outputResult}>
                    {log.outputResult || '-'}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-right text-slate-500 dark:text-slate-400">{log.executionTimeMs}ms</td>
                <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{log.recordTime}</td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex flex-col items-center">
                    <Activity className="w-8 h-8 mb-2 opacity-50" />
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151D30]">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isZh
              ? `显示 ${startIndex + 1} 到 ${Math.min(startIndex + itemsPerPage, filteredLogs.length)} 条，共 ${filteredLogs.length} 条记录`
              : `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, filteredLogs.length)} of ${filteredLogs.length} records`}
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-50 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              {isZh ? '上一页' : 'Prev'}
            </button>
            <span className="px-3 py-1.5 text-slate-600 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-50 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              {isZh ? '下一页' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
