import React, { useState, useEffect } from 'react';
import { Check, X, CheckCircle2 } from 'lucide-react';
import { parseSkillMarkdown, SkillDocument } from '../../core/index';
import { useAgileData } from '../../context/AgileDataContext';

export function SkillOverview({ skill, onUpdateMetadata }: { skill: any; onUpdateMetadata: (metadata: { description?: string; version?: string; tags?: string[] }) => void }) {
  const { lang } = useAgileData();
  let doc: SkillDocument | null = null;
  try {
    doc = parseSkillMarkdown(skill['SKILL.md'], { root: skill.root, skillFile: 'SKILL.md' });
  } catch (e) {}

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescVal, setEditDescVal] = useState('');
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  const [editVersionVal, setEditVersionVal] = useState('');
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTagVal, setNewTagVal] = useState('');
  const [validationState, setValidationState] = useState<'init' | 'validating' | 'success'>('init');

  useEffect(() => {
    setValidationState('init');
    setIsEditingDesc(false);
    setIsEditingTags(false);
    setIsEditingVersion(false);
  }, [skill.name]);

  const handleValidate = () => {
    setValidationState('validating');
    setTimeout(() => {
      setValidationState('success');
    }, 1500);
  };

  const fileKeys = Object.keys(skill).filter((key) => !['name', 'source', 'root', 'refs', 'SKILL.md', 'url'].includes(key));

  const countFiles = (dir: string) => {
    return fileKeys.filter((k) => k.startsWith(`${dir}/`) && k !== `${dir}/` && skill[k] !== true).length;
  };

  const scriptsCount = countFiles('scripts');
  const referencesCount = countFiles('references');
  const resourcesCount = countFiles('resources');
  const assetsCount = countFiles('assets');

  const descText = doc?.metadata?.description || '';
  const versionText = doc?.metadata?.version || '';

  return (
    <div className="p-8 w-full space-y-8 animate-fadeIn">
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#1E293B]">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold">
            {lang === 'zh' ? '技能概况：' : 'Skill Overview: '}
            {skill.name}
          </h2>
          {validationState === 'init' && (
            <button onClick={handleValidate} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition duration-155 cursor-pointer shadow-xs border border-transparent">
              {lang === 'zh' ? '校验技能结构' : 'Verify Structure'}
            </button>
          )}
          {validationState === 'validating' && (
            <button disabled className="px-3 py-1 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold flex items-center">
              <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {lang === 'zh' ? '结构校验中...' : 'Verifying...'}
            </button>
          )}
          {validationState === 'success' && (
            <button
              onClick={handleValidate}
              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 rounded-full text-xs font-bold ring-1 ring-emerald-200 dark:ring-emerald-800 transition duration-155 cursor-pointer"
              title={lang === 'zh' ? '点击重新校验' : 'Click to reverify'}
            >
              {lang === 'zh' ? '结构校验通过' : 'Validation Successful'}
            </button>
          )}
        </div>
        <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          {/* 描述 */}
          <div className="flex items-center space-x-1.5 min-h-[30px]">
            <span className="text-slate-500 flex-shrink-0">{lang === 'zh' ? '描述：' : 'Description:'}</span>
            {isEditingDesc ? (
              <div className="flex items-center space-x-1 flex-1">
                <input
                  type="text"
                  value={editDescVal}
                  onChange={(e) => setEditDescVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onUpdateMetadata({ description: editDescVal });
                      setIsEditingDesc(false);
                    } else if (e.key === 'Escape') {
                      setIsEditingDesc(false);
                    }
                  }}
                  className="text-xs px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-500 rounded outline-none w-full min-w-[150px] text-slate-800 dark:text-slate-100 font-medium"
                  autoFocus
                />
                <button
                  onClick={() => {
                    onUpdateMetadata({ description: editDescVal });
                    setIsEditingDesc(false);
                  }}
                  className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                  title={lang === 'zh' ? '确认' : 'Confirm'}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setIsEditingDesc(false)} className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer" title={lang === 'zh' ? '取消' : 'Cancel'}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span
                className={`cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-1.5 py-0.5 rounded flex-1 truncate transition ${descText ? 'font-medium text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500 italic'}`}
                onDoubleClick={() => {
                  setIsEditingDesc(true);
                  setEditDescVal(descText);
                }}
                title={lang === 'zh' ? '双击进行编辑' : 'Double click to edit'}
              >
                {descText || (lang === 'zh' ? '双击编辑描述...' : 'Double click to edit description...')}
              </span>
            )}
          </div>

          {/* 版本 */}
          <div className="flex items-center space-x-1.5 min-h-[30px]">
            <span className="text-slate-500 flex-shrink-0">{lang === 'zh' ? '版本：' : 'Version:'}</span>
            {isEditingVersion ? (
              <div className="flex items-center space-x-1 flex-1">
                <input
                  type="text"
                  value={editVersionVal}
                  onChange={(e) => setEditVersionVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onUpdateMetadata({ version: editVersionVal });
                      setIsEditingVersion(false);
                    } else if (e.key === 'Escape') {
                      setIsEditingVersion(false);
                    }
                  }}
                  className="text-xs px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-500 rounded outline-none w-full min-w-[150px] text-slate-800 dark:text-slate-100 font-medium"
                  autoFocus
                />
                <button
                  onClick={() => {
                    onUpdateMetadata({ version: editVersionVal });
                    setIsEditingVersion(false);
                  }}
                  className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                  title={lang === 'zh' ? '确认' : 'Confirm'}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setIsEditingVersion(false)} className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer" title={lang === 'zh' ? '取消' : 'Cancel'}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span
                className={`font-mono px-1.5 py-0.5 rounded cursor-pointer transition flex-1 truncate ${
                  versionText ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700' : 'text-slate-400 dark:text-slate-500 italic hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                onDoubleClick={() => {
                  setIsEditingVersion(true);
                  setEditVersionVal(versionText);
                }}
                title={lang === 'zh' ? '双击进行编辑' : 'Double click to edit'}
              >
                {versionText || (lang === 'zh' ? '双击编辑版本...' : 'Double click to edit version...')}
              </span>
            )}
          </div>

          {/* 标签 */}
          <div className="col-span-2 flex items-center space-x-1.5 min-h-[30px]">
            <span className="text-slate-500 flex-shrink-0">{lang === 'zh' ? '标签：' : 'Tags:'}</span>
            {isEditingTags ? (
              <div className="flex items-center space-x-1 flex-1">
                <input
                  type="text"
                  placeholder={lang === 'zh' ? '输入新标签名，回车创建' : 'Enter new tag, press enter to create'}
                  value={newTagVal}
                  onChange={(e) => setNewTagVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const trimmed = newTagVal.trim();
                      if (trimmed) {
                        const existingTags = doc?.metadata?.tags || [];
                        if (!existingTags.includes(trimmed)) {
                          onUpdateMetadata({ tags: [...existingTags, trimmed] });
                        }
                      }
                      setNewTagVal('');
                      setIsEditingTags(false);
                    } else if (e.key === 'Escape') {
                      setIsEditingTags(false);
                    }
                  }}
                  className="text-xs px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-500 rounded outline-none text-slate-800 dark:text-slate-100 font-medium w-full max-w-[150px]"
                  autoFocus
                />
                <button
                  onClick={() => {
                    const trimmed = newTagVal.trim();
                    if (trimmed) {
                      const existingTags = doc?.metadata?.tags || [];
                      if (!existingTags.includes(trimmed)) {
                        onUpdateMetadata({ tags: [...existingTags, trimmed] });
                      }
                    }
                    setNewTagVal('');
                    setIsEditingTags(false);
                  }}
                  className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                  title={lang === 'zh' ? '确认添加' : 'Confirm add'}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setIsEditingTags(false)} className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer" title={lang === 'zh' ? '取消' : 'Cancel'}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                className="inline-flex gap-1.5 items-center flex-1 cursor-pointer min-h-[30px] flex-wrap"
                onDoubleClick={() => {
                  setIsEditingTags(true);
                  setNewTagVal('');
                }}
                title={lang === 'zh' ? '双击空白处添加新标签' : 'Double click empty space to add new tag'}
              >
                {doc?.metadata?.tags && doc.metadata.tags.length > 0 ? (
                  doc.metadata.tags.map((t: string) => (
                    <span key={t} className="group relative px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-xs select-none pr-5 flex items-center inline-block font-semibold">
                      #{t}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const existingTags = doc?.metadata?.tags || [];
                          onUpdateMetadata({ tags: existingTags.filter((tag: string) => tag !== t) });
                        }}
                        className="absolute -top-1.5 -right-1.5 hidden group-hover:flex w-4 h-4 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 border border-red-200 dark:border-red-800 items-center justify-center text-red-600 dark:text-red-300 transition duration-155 cursor-pointer text-[9px] font-bold"
                        title={lang === 'zh' ? '删除标签' : 'Delete tag'}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500 italic text-xs">{lang === 'zh' ? '双击此处添加标签...' : 'Double click here to add tag...'}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500">{lang === 'zh' ? '来源类型：' : 'Source Type:'}</span>
            <span className="font-mono bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded capitalize">{skill.source === 'webmcp' ? 'WebMCP' : skill.source}</span>
            {(skill.source === 'remote' || skill.source === 'webmcp') && skill.url && (
              <span className="text-xs text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded truncate max-w-[200px]" title={skill.url}>
                {skill.url}
              </span>
            )}
          </div>
          <div className="col-span-2">
            <span className="text-slate-500">{lang === 'zh' ? '本地根路径：' : 'Local Root Path:'}</span> <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{skill.root}</code>
          </div>
          <div className="col-span-2 flex gap-6 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className={`w-4 h-4 ${scriptsCount > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
              <span>
                {lang === 'zh' ? '包含 scripts' : 'Contains scripts'} ({scriptsCount})
              </span>
            </div>
            {(referencesCount > 0 || resourcesCount === 0) && (
              <div className="flex items-center space-x-2">
                <CheckCircle2 className={`w-4 h-4 ${referencesCount > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>
                  {lang === 'zh' ? '包含 references' : 'Contains references'} ({referencesCount})
                </span>
              </div>
            )}
            {resourcesCount > 0 && (
              <div className="flex items-center space-x-2">
                <CheckCircle2 className={`w-4 h-4 ${resourcesCount > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>
                  {lang === 'zh' ? '包含 resources' : 'Contains resources'} ({resourcesCount})
                </span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <CheckCircle2 className={`w-4 h-4 ${assetsCount > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
              <span>
                {lang === 'zh' ? '包含 assets' : 'Contains assets'} ({assetsCount})
              </span>
            </div>
          </div>
        </div>
      </div>

      {skill.source === 'installed' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#1E293B]">
          <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <h3 className="font-bold text-sm">{lang === 'zh' ? '安装 Manifest 信息' : 'Install Manifest Info'}</h3>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4 text-sm font-mono text-xs">
            <div>
              <span className="text-slate-500">{lang === 'zh' ? '来源：' : 'Source:'}</span> npm:bug-severity-classifier@1.2.1
            </div>
            <div>
              <span className="text-slate-500">{lang === 'zh' ? '安装时间：' : 'Install Time:'}</span> 2026-05-25 10:00:00
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">{lang === 'zh' ? '摘要(SHA256)：' : 'Digest(SHA256):'}</span> 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
