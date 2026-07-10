import React, { useState } from 'react';
import { Box, ChevronDown, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { FileTreeRenderer } from './FileTreeRenderer';
import { UniversalFileEditor } from './UniversalFileEditor';
import { FolderOverview } from './FolderOverview';
import { SkillOverview } from './SkillOverview';
import { useAgileData } from '../../context/AgileDataContext';

export function SkillPreviewModal({
  skills,
  url,
  type = 'remote',
  onConfirm,
  onCancel,
}: {
  skills: any[];
  url: string;
  type?: 'remote' | 'webmcp';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { lang } = useAgileData();
  const [selectedNode, setSelectedNode] = useState<string | null>(skills[0]?.name || null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isFolderSelected, setIsFolderSelected] = useState<boolean>(true);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const selectItem = (skillName: string, path: string, isFolder: boolean) => {
    setSelectedNode(skillName);
    setSelectedFile(path);
    setIsFolderSelected(isFolder);
  };

  const toggleNode = (skillName: string) => {
    const newCollapsed = new Set(collapsedNodes);
    if (newCollapsed.has(skillName)) {
      newCollapsed.delete(skillName);
    } else {
      newCollapsed.add(skillName);
    }
    setCollapsedNodes(newCollapsed);
  };

  const selectedSkill = skills.find((s) => s.name === selectedNode);

  const modalContent = (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl flex flex-col h-[650px] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {type === 'remote'
              ? lang === 'zh'
                ? `是否安装来源于 ${url} 的 WebSkill 技能`
                : `Do you want to install the WebSkill from ${url}?`
              : lang === 'zh'
                ? `是否安装端点为 ${url} 的 WebMCP 技能`
                : `Do you want to install the WebMCP skill from ${url}?`}
          </h2>
        </div>

        {/* Content (Left tree, Right panel) */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-50 dark:bg-slate-950">
          {/* Left Tree */}
          <div className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-[#FAFAFC] dark:bg-[#0F172A]/50 pt-2 select-none overflow-y-auto">
            <div className="flex-1 p-2 space-y-1 text-sm select-none">
              {skills.map((skill) => {
                const isCollapsed = collapsedNodes.has(skill.name);
                const isRootSelected = selectedNode === skill.name && !selectedFile;

                return (
                  <div key={skill.name}>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(skill.name);
                        setSelectedFile(null);
                        setIsFolderSelected(true);
                      }}
                      className={`flex items-center px-2 py-1.5 rounded cursor-pointer ${isRootSelected ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                    >
                      <div
                        className="mr-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode(skill.name);
                        }}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      <Box className="w-4 h-4 mr-1.5 text-emerald-500 dark:text-emerald-400" />
                      <span className="truncate flex-1 font-semibold text-xs">{skill.name}</span>
                    </div>
                    {!isCollapsed && (
                      <FileTreeRenderer
                        skillName={skill.name}
                        files={Object.keys(skill).filter(
                          (k) => k !== 'name' && k !== 'source' && k !== 'root' && k !== 'refs' && k !== 'url',
                        )}
                        selectedFile={selectedNode === skill.name ? selectedFile : null}
                        selectItem={selectItem}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 bg-white dark:bg-[#111827] overflow-y-auto relative">
            {selectedSkill && selectedFile === null && (
              <div className="pointer-events-none opacity-80">
                <SkillOverview skill={{ ...selectedSkill, url }} onUpdateMetadata={() => {}} />
              </div>
            )}

            {selectedSkill && selectedFile && isFolderSelected && <FolderOverview skill={selectedSkill} folderPath={selectedFile} />}

            {selectedSkill && selectedFile && !isFolderSelected && (
              <div className="pointer-events-none">
                <UniversalFileEditor skill={selectedSkill} selectedFile={selectedFile} onSave={() => {}} />
              </div>
            )}

            {!selectedSkill && (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                {lang === 'zh' ? '请选择左侧技能' : 'Please select a skill on the left'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
          >
            {lang === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition"
          >
            {lang === 'zh' ? '确认' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );

  const container = document.getElementById('main-content-wrapper');
  return container ? createPortal(modalContent, container) : null;
}
