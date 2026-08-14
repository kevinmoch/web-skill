import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ChevronDown, Folder, Type, FileCode
} from 'lucide-react';

interface TreeNodeProps {
  name: string;
  node: any; // true for file, or object for folder
  parentPath: string; // e.g. "src" or ""
  skillName: string;
  selectedFile: string | null;
  selectItem: (skillName: string, path: string, isFolder: boolean) => void;
  editingNode: any;
  editingValue: string;
  setEditingValue: (val: string) => void;
  commitEdit: () => void;
  expanded: Record<string, boolean>;
  toggle: (path: string) => void;
}

function TreeNodeRenderer({
  name,
  node,
  parentPath,
  skillName,
  selectedFile,
  selectItem,
  editingNode,
  editingValue,
  setEditingValue,
  commitEdit,
  expanded,
  toggle
}: TreeNodeProps) {
  const currentPath = parentPath ? `${parentPath}/${name}` : name;
  const isFolder = node !== true;
  const isSelected = selectedFile === currentPath;
  const isEditing = editingNode?.skill === skillName && editingNode?.path === currentPath;

  if (!isFolder) {
    // Render File
    return (
      <div 
        key={name}
        onClick={(e) => { e.stopPropagation(); selectItem(skillName, currentPath, false); }}
        className={`flex items-center px-2 py-1 rounded-md cursor-pointer text-xs transition ${isSelected && !isEditing ? 'bg-accent text-accent-foreground font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'}`}
      >
        <div className="w-4 h-3.5 shrink-0" />
        {name.endsWith('.md') ? <Type className="w-3.5 h-3.5 mr-1.5 opacity-70 shrink-0" /> : <FileCode className="w-3.5 h-3.5 mr-1.5 opacity-70 shrink-0" />}
        {isEditing ? (
          <input 
            autoFocus 
            value={editingValue} 
            onChange={e => setEditingValue(e.target.value)} 
            onBlur={() => commitEdit()} 
            onKeyDown={e => { if(e.key === 'Enter') commitEdit(); }} 
            className="flex-1 text-xs px-1.5 py-0.5 bg-background text-foreground border border-ring rounded outline-none w-full" 
            onClick={e => e.stopPropagation()} 
          />
        ) : (
          <span className="truncate font-mono text-xs">{name}</span>
        )}
      </div>
    );
  } else {
    // Render Folder
    const isExpanded = !!expanded[currentPath];
    return (
      <div key={name}>
        <div 
          onClick={(e) => { e.stopPropagation(); toggle(currentPath); selectItem(skillName, currentPath, true); }}
          className={`flex items-center px-2 py-1 rounded-md cursor-pointer text-xs transition ${isSelected && !isEditing ? 'bg-accent text-accent-foreground font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'}`}
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 mr-1 opacity-70 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 mr-1 opacity-70 shrink-0" />}
          <Folder className="w-3.5 h-3.5 mr-1.5 text-muted-foreground shrink-0" />
          {isEditing ? (
            <input 
              autoFocus 
              value={editingValue} 
              onChange={e => setEditingValue(e.target.value)} 
              onBlur={() => commitEdit()} 
              onKeyDown={e => { if(e.key === 'Enter') commitEdit(); }} 
              className="flex-1 text-xs px-1.5 py-0.5 bg-background text-foreground border border-ring rounded outline-none w-full" 
              onClick={e => e.stopPropagation()} 
            />
          ) : (
            <span className="truncate font-mono text-xs">{name}</span>
          )}
        </div>
        {isExpanded && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-1">
            {Object.keys(node).sort().map(childName => {
              if (childName === '') return null;
              return (
                <TreeNodeRenderer
                  key={childName}
                  name={childName}
                  node={node[childName]}
                  parentPath={currentPath}
                  skillName={skillName}
                  selectedFile={selectedFile}
                  selectItem={selectItem}
                  editingNode={editingNode}
                  editingValue={editingValue}
                  setEditingValue={setEditingValue}
                  commitEdit={commitEdit}
                  expanded={expanded}
                  toggle={toggle}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }
}

export function FileTreeRenderer({ skillName, files, selectedFile, selectItem, editingNode, editingValue, setEditingValue, commitEdit, setExpandedState }: any) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (setExpandedState) {
      if (typeof setExpandedState === 'function') {
        setExpandedState(() => setExpanded);
      } else if (typeof setExpandedState === 'object' && 'current' in setExpandedState) {
        setExpandedState.current = setExpanded;
      }
    }
  }, [setExpandedState, setExpanded]);

  const toggle = (folderPath: string) => setExpanded(prev => ({...prev, [folderPath]: !prev[folderPath]}));

  // Build a generic, multi-tier nested directory tree structure
  const tree: Record<string, any> = {};
  files.forEach((file: string) => {
    const isFolder = file.endsWith('/');
    const cleanFile = isFolder ? file.slice(0, -1) : file;
    const parts = cleanFile.split('/');
    
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      const isAtEnd = i === parts.length - 1;
      if (isAtEnd) {
        if (isFolder) {
          if (!current[part] || current[part] === true) {
            current[part] = {};
          }
        } else {
          current[part] = true;
        }
      } else {
        if (!current[part] || current[part] === true) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  });

  return (
    <div className="ml-3 mt-0.5 space-y-0.5">
      {Object.keys(tree).sort().map(name => (
        <TreeNodeRenderer
          key={name}
          name={name}
          node={tree[name]}
          parentPath=""
          skillName={skillName}
          selectedFile={selectedFile}
          selectItem={selectItem}
          editingNode={editingNode}
          editingValue={editingValue}
          setEditingValue={setEditingValue}
          commitEdit={commitEdit}
          expanded={expanded}
          toggle={toggle}
        />
      ))}
    </div>
  );
}
