import React, { useState, useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { parseSkillMarkdown } from '../../core/index';
import { Wand2 } from 'lucide-react';
import { useAgileData } from '../../context/AgileDataContext';

export function UniversalFileEditor({ skill, selectedFile, onSave }: { skill: any; selectedFile: string; onSave: (skillName: string, path: string, content: string) => void }) {
  const { lang, theme } = useAgileData();
  const [content, setContent] = useState(skill[selectedFile] || '');
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [activeMode, setActiveMode] = useState<'edit' | 'preview'>('edit');
  const isChanged = content !== skill[selectedFile];

  useEffect(() => {
    let initialContent = skill[selectedFile] || '';
    if (selectedFile === 'SKILL.md') {
      const trimmed = initialContent.trim();
      const isNew = !initialContent || !initialContent.includes('---') || trimmed === `# ${skill.name}` || trimmed.toLowerCase() === '#new-skill' || trimmed.toLowerCase().includes('new-skill');
      if (isNew) {
        let currentDesc = '';
        let currentVersion = '';
        let currentTags: string[] = [];
        try {
          const doc = parseSkillMarkdown(initialContent, { root: skill.root, skillFile: 'SKILL.md' });
          currentDesc = doc?.metadata?.description || '';
          currentVersion = doc?.metadata?.version || '';
          currentTags = doc?.metadata?.tags || [];
        } catch (e) {}

        const tagsStr = currentTags.length > 0 ? currentTags.join(', ') : '';
        const headingText = currentDesc || skill.name;

        initialContent = `---
name: ${skill.name}
description: ${currentDesc}
version: ${currentVersion}
tags: [${tagsStr}]
---
# ${headingText}`;
      }
    }
    setContent(initialContent);
    const ext = selectedFile.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'ico'].includes(ext)) {
      setActiveMode('preview');
    } else {
      setActiveMode('edit');
    }
  }, [selectedFile, skill]);

  const monaco = useMonaco();
  useEffect(() => {
    if (monaco) {
      const monacoAny = monaco as any;
      monacoAny.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: false,
        schemas: [],
        enableSchemaRequest: true
      });
      if (monacoAny.languages.html) {
        monacoAny.languages.html.htmlDefaults.setOptions({
          format: {
            wrapLineLength: 80,
            wrapAttributes: 'auto'
          }
        });
      }
      if (monacoAny.languages.typescript) {
        monacoAny.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: true,
          noSyntaxValidation: false
        });
        monacoAny.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: true,
          noSyntaxValidation: false
        });
      }
    }
  }, [monaco]);

  const handleSave = () => {
    if (isChanged) {
      onSave(skill.name, selectedFile, content);
    }
  };

  const fileExt = selectedFile.split('.').pop()?.toLowerCase() || '';

  const isImage = ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'ico'].includes(fileExt);
  const isMarkdown = fileExt === 'md';
  const isJSON = fileExt === 'json';
  const isTS = fileExt === 'ts' || fileExt === 'tsx' || fileExt === 'js' || fileExt === 'jsx';
  const isHTMLCSS = fileExt === 'html' || fileExt === 'css';

  let language = 'plaintext';
  if (isMarkdown) language = 'markdown';
  else if (isJSON) language = 'json';
  else if (isTS) language = 'typescript';
  else if (fileExt === 'html') language = 'html';
  else if (fileExt === 'css') language = 'css';

  return (
    <div className="flex h-full min-h-[500px]">
      <div className="flex-1 flex flex-col border-r border-border bg-background text-foreground">
        <div className="p-3 bg-secondary/50 border-b border-border text-xs font-medium flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground font-mono">{skill.name} /</span>
            <span className="font-mono font-semibold text-foreground">{selectedFile}</span>

            {isImage && (
              <div className="ml-4 flex rounded-lg bg-secondary p-0.5 text-xs">
                <button
                  onClick={() => setActiveMode('edit')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer text-xs font-medium ${activeMode === 'edit' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {lang === 'zh' ? '编辑源码' : 'Edit Source'}
                </button>
                <button
                  onClick={() => setActiveMode('preview')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer text-xs font-medium ${activeMode === 'preview' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {lang === 'zh' ? '查看图像' : 'Preview Image'}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!isImage && (isJSON || isTS || isHTMLCSS || fileExt === 'js' || fileExt === 'ts' || fileExt === 'tsx' || fileExt === 'jsx') && (
              <button
                onClick={() => {
                  if (typeof content !== 'string') return;
                  try {
                    if (isJSON) {
                      const parsed = JSON.parse(content);
                      setContent(JSON.stringify(parsed, null, 2));
                    } else {
                      if (editorInstance) {
                        editorInstance.focus();
                        const formatAction = editorInstance.getAction('editor.action.formatDocument');
                        if (formatAction) {
                          formatAction
                            .run()
                            .then(() => {
                              setContent(editorInstance.getValue());
                              editorInstance.layout();
                            })
                            .catch((err: any) => {
                              console.error('Monaco format error:', err);
                              editorInstance.trigger('editor', 'editor.action.formatDocument', null);
                              setTimeout(() => {
                                setContent(editorInstance.getValue());
                                editorInstance.layout();
                              }, 250);
                            });
                        } else {
                          editorInstance.trigger('editor', 'editor.action.formatDocument', null);
                          setTimeout(() => {
                            setContent(editorInstance.getValue());
                            editorInstance.layout();
                          }, 250);
                        }
                      }
                    }
                  } catch {
                    alert(lang === 'zh' ? '格式错误，无法格式化' : 'Format error, unable to format');
                  }
                }}
                className="btn-secondary px-3 py-1.5 text-xs flex items-center cursor-pointer shadow-xs font-medium"
              >
                <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                {lang === 'zh' ? '格式化代码' : 'Format Code'}
              </button>
            )}
            {!isImage && (
              <button
                onClick={handleSave}
                disabled={!isChanged}
                className={`text-xs px-3.5 py-1.5 rounded-lg transition font-medium ${isChanged ? 'btn-primary cursor-pointer shadow-xs' : 'bg-secondary text-muted-foreground border border-border opacity-70 cursor-not-allowed'}`}
              >
                {lang === 'zh' ? '保存更改' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        {activeMode === 'edit' && !isImage ? (
          <div className="flex-1 w-full relative">
            <Editor
              height="100%"
              language={language}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={content}
              onChange={(value) => setContent(value || '')}
              onMount={(editor) => setEditorInstance(editor)}
              options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' as const }}
            />
          </div>
        ) : activeMode === 'preview' ? (
          <div className="flex-1 w-full relative bg-secondary/30 flex items-center justify-center overflow-hidden p-6">
            {isImage ? (
              <img src={content} alt="Preview" className="max-w-full max-h-full object-contain relative z-10 shadow-md rounded-lg border border-border bg-card" />
            ) : (
              <div className="text-muted-foreground text-sm">{lang === 'zh' ? '该文件类型不支持图形化预览' : 'This file type does not support graphical preview'}</div>
            )}
          </div>
        ) : (
          <div className="flex-1 w-full relative">
            <Editor
              height="100%"
              language={language}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={content}
              onChange={(value) => setContent(value || '')}
              onMount={(editor) => setEditorInstance(editor)}
              options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' as const }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
