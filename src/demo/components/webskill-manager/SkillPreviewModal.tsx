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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-5xl flex flex-col h-[650px] overflow-hidden text-card-foreground">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-secondary/50">
          <h2 className="text-base font-bold text-foreground">
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
        <div className="flex-1 flex overflow-hidden min-h-0 bg-background">
          {/* Left Tree */}
          <div className="w-64 border-r border-border flex flex-col bg-secondary/30 pt-2 select-none overflow-y-auto">
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
                      className={`flex items-center px-2 py-1.5 rounded-lg cursor-pointer transition ${isRootSelected ? 'bg-accent text-accent-foreground font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'}`}
                    >
                      <div
                        className="mr-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode(skill.name);
                        }}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <Box className="w-4 h-4 mr-1.5 text-emerald-500" />
                      <span className="truncate flex-1 font-mono text-xs">{skill.name}</span>
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
          <div className="flex-1 bg-card overflow-y-auto relative">
            {selectedSkill && selectedFile === null && (
              <div className="pointer-events-none opacity-90">
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
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                {lang === 'zh' ? '请选择左侧技能' : 'Please select a skill on the left'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-secondary/50 border-t border-border flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="btn-secondary px-4 py-1.5 text-xs font-medium"
          >
            {lang === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary px-4 py-1.5 text-xs font-medium shadow-xs"
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
