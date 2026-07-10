import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { UploadCloud, DownloadCloud, Box, Zap } from 'lucide-react';
import { SkillPreviewModal } from './SkillPreviewModal';
import { REMOTE_SPRINT_PLANNING_SKILL } from '../../mock/skills/remoteSprintPlanning';
import { REMOTE_BUG_TRACKING_SKILL } from '../../mock/skills/remoteBugTracking';
import { WEBMCP_AGILE_VELOCITY_SKILL } from '../../mock/skills/webmcpAgileVelocity';
import { useAgileData } from '../../context/AgileDataContext';

export function ImportExportTab({ skills = [], onInstallSkill }: { skills?: any[]; onInstallSkill?: (skill: any) => void }) {
  const { lang } = useAgileData();
  const [remoteUrl, setRemoteUrl] = useState('');
  const [mcpEndpoint, setMcpEndpoint] = useState('');
  const [installPhase, setInstallPhase] = useState<'idle' | 'progress' | 'preview'>('idle');
  const [installType, setInstallType] = useState<'remote' | 'webmcp'>('remote');
  const [installProgress, setInstallProgress] = useState(0);
  const [selectedMockSkills, setSelectedMockSkills] = useState<any[]>([]);

  const startInstall = (type: 'remote' | 'webmcp') => {
    const url = type === 'remote' ? remoteUrl : mcpEndpoint;
    if (!url.trim()) {
      alert(type === 'remote' ? '请输入来源地址' : '请输入端点名称');
      return;
    }
    setInstallType(type);
    setInstallPhase('progress');
    setInstallProgress(0);

    const mockSkills = type === 'remote' ? [REMOTE_SPRINT_PLANNING_SKILL, REMOTE_BUG_TRACKING_SKILL] : [WEBMCP_AGILE_VELOCITY_SKILL];
    setSelectedMockSkills(mockSkills);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => setInstallPhase('preview'), 300);
      }
      setInstallProgress(progress);
    }, 200);
  };

  const handleConfirmInstall = () => {
    if (onInstallSkill && selectedMockSkills.length > 0) {
      selectedMockSkills.forEach((s) => {
        // We will pass the skill and let WebSkillManager handle it.
        onInstallSkill({ ...s, url: installType === 'remote' ? remoteUrl : mcpEndpoint });
      });
    }
    setInstallPhase('idle');
  };

  const handleCancelInstall = () => {
    setInstallPhase('idle');
  };

  return (
    <div className="p-8 w-full space-y-8 animate-fadeIn pb-12">
      {/* Progress Modal */}
      {installPhase === 'progress' &&
        document.getElementById('main-content-wrapper') &&
        createPortal(
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-96 p-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 text-center">
                {lang === 'zh' ? '正在连接' : 'Connecting to'} {installType === 'remote' ? remoteUrl : mcpEndpoint}{' '}
                {installType === 'remote' ? (lang === 'zh' ? '安装 WebSkill 技能' : 'to install WebSkill') : lang === 'zh' ? '端点安装 WebMCP 技能' : 'to install WebMCP Skill'}
              </h3>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 mb-2 overflow-hidden relative">
                <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-200 ease-out absolute left-0 top-0 bottom-0" style={{ width: `${installProgress}%` }}></div>
              </div>
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2 font-mono">{installProgress}%</p>
            </div>
          </div>,
          document.getElementById('main-content-wrapper')!
        )}

      {/* Preview Modal */}
      {installPhase === 'preview' && selectedMockSkills.length > 0 && (
        <SkillPreviewModal skills={selectedMockSkills} url={installType === 'remote' ? remoteUrl : mcpEndpoint} type={installType} onConfirm={handleConfirmInstall} onCancel={handleCancelInstall} />
      )}

      <div className="grid grid-cols-2 gap-8">
        {/* 安装远程技能 */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <DownloadCloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{lang === 'zh' ? '安装远程技能' : 'Install Remote Skill'}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{lang === 'zh' ? '从外部信任源安装 WebSkill 技能，支持 HTTP/HTTPS 协议标准来源模块。' : 'Install WebSkill from external trusted sources supporting HTTP/HTTPS protocols.'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">{lang === 'zh' ? '来源地址' : 'Source URL'}</label>
              <input
                type="text"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                placeholder="https://github.com/org/skill-repo.git"
                className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-lg">
              <span className="text-xs text-amber-700 dark:text-amber-500 font-medium">{lang === 'zh' ? '安装第三方来源代码前必须经过风险确认查杀校验。' : 'Third-party code installation requires risk confirmation and validation.'}</span>
            </div>
            <div className="flex space-x-3 pt-2">
              <button onClick={() => startInstall('remote')} className="cursor-pointer w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-lg transition shadow-sm dark:bg-indigo-500 dark:hover:bg-indigo-650">
                {lang === 'zh' ? '确定安装执行' : 'Confirm Installation'}
              </button>
            </div>
          </div>
        </div>

        {/* 安装 MCP 技能 */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{lang === 'zh' ? '安装 WebMCP 技能' : 'Install WebMCP Skill'}</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {lang === 'zh' ? '基于 MCP 标准通信协议动态加载 Web 页面技能， 并映射为非持久性临时技能。' : 'Dynamically load Web skills based on MCP standard protocol, mapped as non-persistent temporary skills.'}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">{lang === 'zh' ? '端点名称' : 'Endpoint'}</label>
              <input
                type="text"
                value={mcpEndpoint}
                onChange={(e) => setMcpEndpoint(e.target.value)}
                placeholder="endpoint"
                className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-lg">
              <span className="text-xs text-amber-700 dark:text-amber-500 font-medium">{lang === 'zh' ? '提示：使用 MCP 协议成功连接端点后，将列出可导入的技能。' : 'Hint: Available skills will be listed after connecting to MCP endpoint.'}</span>
            </div>
            <div className="pt-2">
              <button onClick={() => startInstall('webmcp')} className="cursor-pointer w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-lg transition shadow-sm dark:bg-indigo-500 dark:hover:bg-indigo-650">
                {lang === 'zh' ? '确定连接端点' : 'Connect Endpoint'}
              </button>
            </div>
          </div>
        </div>

        {/* 上传技能包 */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{lang === 'zh' ? '上传 WebSkill 压缩包 (*.zip, *.tar)' : 'Upload WebSkill Archive (*.zip, *.tar)'}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{lang === 'zh' ? '上传已具备完整 WebSkill 配置结构的压缩归档。' : 'Upload an archive containing a complete WebSkill structure.'}</p>
            </div>
          </div>
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B0E14] hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition">
            <UploadCloud className="w-8 h-8 text-slate-400 mb-3" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">{lang === 'zh' ? '点击或拖拽 Zip 技能包文件' : 'Click or Drag Zip Archive Here'}</span>
            <span className="text-xs text-slate-400">{lang === 'zh' ? '强制前置校验 WebSkill 技能配置结构' : 'Strict pre-validation of structure required'}</span>
          </div>
        </div>

        {/* 导出技能 */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Box className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{lang === 'zh' ? '导出 WebSkill 技能包' : 'Export WebSkill Archive'}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{lang === 'zh' ? '将当前 system 可用的 WebSkill 技能打包成通用分发格式。' : 'Package currently available skills into a standard distribution archive format.'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">{lang === 'zh' ? '选择要导出的技能' : 'Select Skill to Export'}</label>
              <select className="w-full text-sm px-3 py-2 bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-semibold text-slate-700 dark:text-slate-300">
                <optgroup label="LOCAL">
                  {skills
                    .filter((s) => s.source === 'local')
                    .map((s) => (
                      <option key={s.name}>{s.name}</option>
                    ))}
                </optgroup>
                <optgroup label="REMOTE">
                  {skills
                    .filter((s) => s.source === 'remote')
                    .map((s) => (
                      <option key={s.name}>{s.name}</option>
                    ))}
                </optgroup>
                <optgroup label="WebMCP">
                  {skills
                    .filter((s) => s.source === 'webmcp')
                    .map((s) => (
                      <option key={s.name}>{s.name}</option>
                    ))}
                </optgroup>
              </select>
            </div>
            <div className="pt-2">
              <button className="cursor-pointer w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-lg transition shadow-sm dark:bg-indigo-500 dark:hover:bg-indigo-650">
                {lang === 'zh' ? '生成压缩包并导出' : 'Generate and Export'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
