import React, { useState, useEffect, useRef } from 'react';
import { Plus, FilePlus, FolderPlus, Trash2, Search, Box, ChevronRight, ChevronDown, Folder } from 'lucide-react';
import { parseSkillMarkdown } from '../../core/index';
import { FileTreeRenderer } from './FileTreeRenderer';
import { FolderOverview } from './FolderOverview';
import { SkillSummaryDashboard } from './SkillSummaryDashboard';
import { SkillOverview } from './SkillOverview';
import { UniversalFileEditor } from './UniversalFileEditor';
import { useAgileData } from '../../context/AgileDataContext';

export function SkillCatalogTab({ skills, setSkills, resetCounter }: { skills: any[]; setSkills: React.Dispatch<React.SetStateAction<any[]>>; resetCounter?: number }) {
  const { lang } = useAgileData();
  const [search, setSearch] = useState('');

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null); // null means root is selected. 'scripts' means folder. 'scripts/run.ts' means file.
  const [isFolderSelected, setIsFolderSelected] = useState<boolean>(true);

  useEffect(() => {
    setSelectedNode(null);
    setSelectedFile(null);
  }, [resetCounter]);

  const [editingNode, setEditingNode] = useState<{ skill: string; path: string | null } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [collapsedSkills, setCollapsedSkills] = useState<Record<string, boolean>>({});
  const [deletePrompt, setDeletePrompt] = useState<{ show: boolean; target: string; isRoot: boolean } | null>(null);

  const toggleSkillCollapse = (name: string) => {
    setCollapsedSkills((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Set expansion state from outside to force expand when adding new items
  const setExpandedRef = useRef<any>(null);

  const selectSkill = (name: string) => {
    setSelectedNode(name);
    setSelectedFile(null);
    setIsFolderSelected(true);
  };

  const selectItem = (skillName: string, path: string, isFolder: boolean) => {
    setSelectedNode(skillName);
    setSelectedFile(path);
    setIsFolderSelected(isFolder);
  };

  const commitEdit = () => {
    if (!editingNode) return;
    const { skill: skillName, path: oldPath } = editingNode;
    const newValue = editingValue.trim();

    if (!newValue) {
      setEditingNode(null);
      if (oldPath === null && !skills.find((s) => s.name === skillName)?.['SKILL.md']) {
        // We created an empty skill, but user typed nothing. Just revert name or keep.
        setSkills(skills.filter((s) => s.name !== skillName));
        setSelectedNode(null);
      } else if (oldPath !== null && skills.find((s) => s.name === skillName)?.[oldPath] === '') {
        // Empty file created and aborted
        const newSkills = [...skills];
        const idx = newSkills.findIndex((s) => s.name === skillName);
        if (idx >= 0) delete newSkills[idx][oldPath];
        setSkills(newSkills);
        setSelectedFile(null);
        setIsFolderSelected(true);
      } else if (oldPath !== null && skills.find((s) => s.name === skillName)?.[`${oldPath}/`] === true) {
        // Empty folder created and aborted
        const newSkills = [...skills];
        const idx = newSkills.findIndex((s) => s.name === skillName);
        if (idx >= 0) delete newSkills[idx][`${oldPath}/`];
        setSkills(newSkills);
        setSelectedFile(null);
        setIsFolderSelected(true);
      }
      return;
    }

    if (oldPath === null) {
      if (newValue !== skillName && skills.some((s) => s.name === newValue)) {
        alert(lang === 'zh' ? '该技能名称已存在，请使用其他名称' : 'Skill name already exists. Please use a different name.');
        return;
      }
      if (newValue !== skillName) {
        setSkills(skills.map((s) => (s.name === skillName ? { ...s, name: newValue, root: `/skills/${newValue}` } : s)));
        if (selectedNode === skillName) setSelectedNode(newValue);
      }
      setEditingNode(null);
    } else {
      const parentDir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
      const newPath = parentDir ? `${parentDir}/${newValue}` : newValue;

      const skillIndex = skills.findIndex((s) => s.name === skillName);
      if (skillIndex < 0) {
        setEditingNode(null);
        return;
      }

      if (newPath !== oldPath) {
        const skill = skills[skillIndex];
        const paths = Object.keys(skill).filter((k) => k !== 'name' && k !== 'source' && k !== 'root' && k !== 'refs');

        const isFolder = paths.some((p) => p.startsWith(`${oldPath}/`)) || skill[`${oldPath}/`] === true;

        const newSkillData = { ...skill };
        if (isFolder) {
          if (paths.some((p) => p.startsWith(`${newPath}/`)) || skill[`${newPath}/`]) {
            alert('文件或文件夹已存在');
            return;
          }
          if (newSkillData[`${oldPath}/`] === true) {
            newSkillData[`${newPath}/`] = true;
            delete newSkillData[`${oldPath}/`];
          }
          paths.forEach((p) => {
            if (p.startsWith(`${oldPath}/`)) {
              const u = p.replace(`${oldPath}/`, `${newPath}/`);
              newSkillData[u] = newSkillData[p];
              delete newSkillData[p];
            }
          });
        } else {
          if (newSkillData[newPath] !== undefined) {
            alert('文件已存在');
            return;
          }
          newSkillData[newPath] = newSkillData[oldPath];
          delete newSkillData[oldPath];
        }

        const newSkills = [...skills];
        newSkills[skillIndex] = newSkillData;
        setSkills(newSkills);

        if (selectedFile === oldPath) setSelectedFile(newPath);
        else if (selectedFile?.startsWith(`${oldPath}/`)) setSelectedFile(selectedFile.replace(`${oldPath}/`, `${newPath}/`));
      }
      setEditingNode(null);
    }
  };

  const handleAddNewSkill = () => {
    let newName = 'new-skill';
    let counter = 1;
    while (skills.some((s) => s.name === newName)) {
      newName = `new-skill(${counter})`;
      counter++;
    }
    const newSkill = { name: newName, source: 'local', root: `/skills/${newName}`, 'SKILL.md': `# ${newName}` };
    setSkills([{ ...newSkill }, ...skills]);
    setSelectedNode(newName);
    setSelectedFile(null);
    setIsFolderSelected(true);
    setEditingNode({ skill: newName, path: null });
    setEditingValue(newName);
  };

  const handleNewFile = () => {
    if (!isFolderSelected || !selectedNode) return;
    const folderPrefix = selectedFile ? `${selectedFile}/` : '';
    let newName = lang === 'zh' ? '新建 文本文档.txt' : 'New Text Document.txt';
    let counter = 1;
    const skillIndex = skills.findIndex((s) => s.name === selectedNode);
    if (skillIndex < 0) return;

    let path = `${folderPrefix}${newName}`;
    while (skills[skillIndex][path] !== undefined) {
      newName = lang === 'zh' ? `新建 文本文档(${counter}).txt` : `New Text Document(${counter}).txt`;
      path = `${folderPrefix}${newName}`;
      counter++;
    }

    const newSkills = [...skills];
    newSkills[skillIndex] = { ...newSkills[skillIndex], [path]: '' };
    setSkills(newSkills);

    setSelectedFile(path);
    setIsFolderSelected(false);

    if (setExpandedRef.current && selectedFile) {
      setExpandedRef.current((prev: any) => ({ ...prev, [selectedFile]: true }));
    }

    setEditingNode({ skill: selectedNode, path });
    setEditingValue(newName);
  };

  const handleNewFolder = () => {
    if (!isFolderSelected || !selectedNode) return;
    const folderPrefix = selectedFile ? `${selectedFile}/` : '';
    let newName = lang === 'zh' ? '新建文件夹' : 'New Folder';
    let counter = 1;
    const skillIndex = skills.findIndex((s) => s.name === selectedNode);
    if (skillIndex < 0) return;

    let path = `${folderPrefix}${newName}`;
    while (skills[skillIndex][`${path}/`] === true || Object.keys(skills[skillIndex]).some((k) => k.startsWith(`${path}/`))) {
      newName = lang === 'zh' ? `新建文件夹(${counter})` : `New Folder(${counter})`;
      path = `${folderPrefix}${newName}`;
      counter++;
    }

    const newSkills = [...skills];
    newSkills[skillIndex] = { ...newSkills[skillIndex], [`${path}/`]: true };
    setSkills(newSkills);

    setSelectedFile(path);
    setIsFolderSelected(true);

    if (setExpandedRef.current && selectedFile) {
      setExpandedRef.current((prev: any) => ({ ...prev, [selectedFile]: true }));
    }

    setEditingNode({ skill: selectedNode, path });
    setEditingValue(newName);
  };

  const handleDelete = () => {
    if (!selectedNode) {
      alert(lang === 'zh' ? '请先选中要删除的文件、文件夹或技能' : 'Please select a file, folder or skill to delete first.');
      return;
    }
    const isRoot = selectedFile === null;
    const targetName = isRoot ? selectedNode : selectedFile;
    setDeletePrompt({ show: true, target: targetName, isRoot });
  };

  const confirmDelete = () => {
    if (!deletePrompt) return;
    if (deletePrompt.isRoot) {
      setSkills(skills.filter((s) => s.name !== selectedNode));
      setSelectedNode(null);
      setSelectedFile(null);
    } else {
      const skillIndex = skills.findIndex((s) => s.name === selectedNode);
      if (skillIndex < 0) {
        setDeletePrompt(null);
        return;
      }
      const newSkillData = { ...skills[skillIndex] };
      const paths = Object.keys(newSkillData);

      if (newSkillData[`${selectedFile}/`] === true || paths.some((p) => p.startsWith(`${selectedFile}/`))) {
        if (newSkillData[`${selectedFile}/`] === true) delete newSkillData[`${selectedFile}/`];
        paths.forEach((p) => {
          if (p.startsWith(`${selectedFile}/`)) delete newSkillData[p];
        });
      } else {
        delete newSkillData[selectedFile!];
      }

      const newSkills = [...skills];
      newSkills[skillIndex] = newSkillData;
      setSkills(newSkills);

      const parent = selectedFile!.includes('/') ? selectedFile!.substring(0, selectedFile!.lastIndexOf('/')) : null;
      setSelectedFile(parent);
      setIsFolderSelected(true);
    }
    setDeletePrompt(null);
  };

  const isAddBtnEnabled = isFolderSelected && selectedNode !== null;

  const handleSearch = () => {
    const term = search.trim().toLowerCase();
    if (!term) return;
    const match = skills.find((s) => s.name.toLowerCase().includes(term));
    if (match) {
      selectSkill(match.name);
      setCollapsedSkills((prev) => ({ ...prev, [match.name]: false }));
    }
  };

  const handleUpdateMetadata = (updatedFields: { description?: string; version?: string; tags?: string[] }) => {
    if (!selectedNode) return;
    setSkills((prev) =>
      prev.map((s) => {
        if (s.name === selectedNode) {
          const oldRaw = s['SKILL.md'] || '';
          let oldDoc: any = null;
          try {
            oldDoc = parseSkillMarkdown(oldRaw, { root: s.root, skillFile: 'SKILL.md' });
          } catch (e) {}

          const currentDesc = updatedFields.description !== undefined ? updatedFields.description : oldDoc?.metadata?.description || '';
          const currentVersion = updatedFields.version !== undefined ? updatedFields.version : oldDoc?.metadata?.version || '';
          const currentTags = updatedFields.tags !== undefined ? updatedFields.tags : oldDoc?.metadata?.tags || [];

          let body = '';
          if (oldRaw.includes('---')) {
            const end = oldRaw.indexOf('\n---', 3);
            if (end !== -1) {
              body = oldRaw.slice(end + 4);
            } else {
              body = oldRaw;
            }
          } else {
            body = oldRaw;
          }

          let newYaml = `name: ${s.name}\ndescription: ${currentDesc}`;
          if (currentVersion) {
            newYaml += `\nversion: ${currentVersion}`;
          }
          if (currentTags && currentTags.length > 0) {
            newYaml += `\ntags: [${currentTags.join(', ')}]`;
          }

          if (oldRaw.startsWith('---')) {
            const end = oldRaw.indexOf('\n---', 3);
            if (end !== -1) {
              const yaml = oldRaw.slice(3, end).trim();
              for (const line of yaml.split(/\r?\n/)) {
                const div = line.indexOf(':');
                if (div !== -1) {
                  const f = line.slice(0, div).trim().toLowerCase();
                  if (!['name', 'description', 'version', 'tags'].includes(f)) {
                    newYaml += `\n${line}`;
                  }
                }
              }
            }
          }

          const newRaw = `---\n${newYaml}\n---\n${body}`;
          return {
            ...s,
            'SKILL.md': newRaw
          };
        }
        return s;
      })
    );
  };

  const handleSaveFile = (skillName: string, filePath: string, content: string) => {
    const skillIndex = skills.findIndex((s) => s.name === skillName);
    if (skillIndex < 0) return;
    const newSkills = [...skills];
    newSkills[skillIndex] = {
      ...newSkills[skillIndex],
      [filePath]: content
    };
    setSkills(newSkills);
    alert(lang === 'zh' ? `文件 "${filePath}" 保存成功！` : `File "${filePath}" saved successfully!`);
  };

  return (
    <div className="flex h-full min-h-[550px]">
      {/* Left Tree */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-[#FAFAFC] dark:bg-[#0F172A]/50 pt-2 select-none rounded-bl-2xl">
        <div className="px-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="relative mb-2">
            <input
              type="text"
              placeholder={lang === 'zh' ? '搜索技能名称' : 'Search skill name'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="w-full pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded outline-none focus:border-indigo-500"
            />
            <Search onClick={handleSearch} className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 cursor-pointer" />
          </div>
          <div className="flex justify-end space-x-1 text-slate-500 mt-2">
            <button title={lang === 'zh' ? '新建技能' : 'New Skill'} onClick={handleAddNewSkill} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition duration-155 cursor-pointer">
              <Plus className="w-4 h-4 text-slate-600 dark:text-slate-300 hover:text-indigo-600" />
            </button>
            <button
              title={lang === 'zh' ? '新建文件' : 'New File'}
              onClick={handleNewFile}
              disabled={!isAddBtnEnabled}
              className={`p-1.5 rounded-lg transition duration-155 ${isAddBtnEnabled ? 'hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-300 hover:text-indigo-600' : 'opacity-30 cursor-not-allowed'}`}
            >
              <FilePlus className="w-4 h-4" />
            </button>
            <button
              title={lang === 'zh' ? '新建文件夹' : 'New Folder'}
              onClick={handleNewFolder}
              disabled={!isAddBtnEnabled}
              className={`p-1.5 rounded-lg transition duration-155 ${isAddBtnEnabled ? 'hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-300 hover:text-indigo-600' : 'opacity-30 cursor-not-allowed'}`}
            >
              <FolderPlus className="w-4 h-4" />
            </button>
            <button title={lang === 'zh' ? '删除' : 'Delete'} onClick={handleDelete} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition duration-155 text-rose-500 cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div
          className="flex-1 p-2 space-y-1 text-sm select-none"
          onClick={() => {
            setSelectedNode(null);
            setSelectedFile(null);
          }}
        >
          {skills.map((skill) => {
            const isEditingRoot = editingNode?.skill === skill.name && editingNode?.path === null;
            const isCollapsed = collapsedSkills[skill.name];
            return (
              <div key={skill.name}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    selectSkill(skill.name);
                    toggleSkillCollapse(skill.name);
                  }}
                  className={`flex items-center px-2 py-1.5 rounded cursor-pointer ${selectedNode === skill.name && !selectedFile && !isEditingRoot ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                >
                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 mr-1 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 mr-1 text-slate-400" />}
                  <Box
                    className={`w-4 h-4 mr-1.5 ${selectedNode === skill.name && !selectedFile ? 'text-indigo-600 dark:text-indigo-400' : skill.source === 'remote' ? 'text-emerald-500 dark:text-emerald-400' : skill.source === 'webmcp' ? 'text-sky-500 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`}
                  />
                  {isEditingRoot ? (
                    <input
                      autoFocus
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit();
                      }}
                      className="flex-1 text-xs px-1 text-slate-900 border border-indigo-500 rounded outline-none w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate flex-1 font-semibold text-xs">{skill.name}</span>
                  )}
                </div>
                {!isCollapsed && (
                  <FileTreeRenderer
                    setExpandedState={selectedNode === skill.name ? setExpandedRef : null}
                    skillName={skill.name}
                    files={Object.keys(skill).filter((k) => k !== 'name' && k !== 'source' && k !== 'root' && k !== 'refs' && k !== 'url')}
                    selectedFile={selectedNode === skill.name ? selectedFile : null}
                    selectItem={selectItem}
                    editingNode={editingNode}
                    editingValue={editingValue}
                    setEditingValue={setEditingValue}
                    commitEdit={commitEdit}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Details */}
      <div className="flex-1 bg-white dark:bg-[#111827] rounded-br-2xl">
        {!selectedNode ? (
          <SkillSummaryDashboard skills={skills} onSelectSkill={selectSkill} />
        ) : (
          <>
            {selectedNode && !selectedFile && skills.find((s) => s.name === selectedNode) && <SkillOverview skill={skills.find((s) => s.name === selectedNode)!} onUpdateMetadata={handleUpdateMetadata} />}

            {/* If selected file is a folder (isFolderSelected is true) and selectedFile is NOT null */}
            {selectedNode && selectedFile && isFolderSelected && skills.find((s) => s.name === selectedNode) && <FolderOverview skill={skills.find((s) => s.name === selectedNode)!} folderPath={selectedFile} />}

            {selectedNode && selectedFile && !isFolderSelected && skills.find((s) => s.name === selectedNode) && <UniversalFileEditor skill={skills.find((s) => s.name === selectedNode)!} selectedFile={selectedFile} onSave={handleSaveFile} />}
          </>
        )}
      </div>

      {deletePrompt?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{lang === 'zh' ? '确认删除' : 'Confirm Deletion'}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {lang === 'zh'
                ? `您确定要删除 ${deletePrompt.isRoot ? '文件夹及其所有内容' : '此文件或文件夹'} "${deletePrompt.target}" 吗？此操作无法撤销。`
                : `Are you sure you want to delete ${deletePrompt.isRoot ? 'the folder and all its contents' : 'this file or folder'} "${deletePrompt.target}"? This action cannot be undone.`}
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setDeletePrompt(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                {lang === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition">
                {lang === 'zh' ? '确认删除' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
