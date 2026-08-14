import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { useAgileData } from '../context/AgileDataContext';
import { translations } from '../utils/translations';
import { OpenUIRenderer } from './OpenUIRenderer';
import { Send, Settings2, Trash2, Sparkles, Cpu, Blocks, Zap, History, Plus, MessageSquare, X, User, Bot } from 'lucide-react';

export const AIChatPanel: React.FC = () => {
  const { chatHistory, sendChatMessage, lang, llmConfig, setLlmConfig, sessions, currentSessionId, setCurrentSessionId, createNewSession, deleteSession, setCurrentScreen } = useAgileData();

  const t = translations[lang];

  // UI States
  const [inputText, setInputText] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Editable config state
  const [localConfig, setLocalConfig] = useState(llmConfig);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep in sync with context config
    setLocalConfig(llmConfig);
  }, [llmConfig]);

  useEffect(() => {
    // Scroll chat to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, sessions, currentSessionId]);

  const handleApplyConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setLlmConfig(localConfig);
    setShowConfig(false);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isLoading) return;

    setInputText('');
    setIsLoading(true);
    try {
      await sendChatMessage(cleanText);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const executeTemplate = async (prompt: string) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await sendChatMessage(prompt);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const templates =
    lang === 'zh'
      ? [
          { label: '📊 分析项目迭代进展', prompt: '帮我分析项目迭代进展' },
          { label: '🛑 缺陷严重程度分布', prompt: '生成缺陷严重程度分布图' },
          { label: '💡 需求看板深度梳理', prompt: '帮我做需求看板状态梳理' },
          { label: '➕ 新增智能关联需求', prompt: '创建一个新的高优先级需求' }
        ]
      : [
          { label: '📊 Sprint Progress Analysis', prompt: 'Analyze current sprint progress' },
          { label: '🛑 Bug Severity Gauge', prompt: 'Generate bug severity distribution' },
          { label: '💡 Backlog Kanban Breakdown', prompt: 'Show requirement Kanban' },
          { label: '➕ Auto Create Backlog Item', prompt: 'Create a new requirement' }
        ];

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground border-l border-border relative font-sans" id="ai-chat-panel">
      {/* 1. Header with model info and settings/history toggles */}
      <div className="p-3.5 border-b border-border flex items-center justify-between bg-card text-card-foreground relative z-30">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg webskill-brand-mark flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center tracking-tight">
              <span>{lang === 'zh' ? '敏捷平台智能助手' : 'Agile Platform Assistant'}</span>
              <span className="ml-1.5 w-2 h-2 bg-success rounded-full inline-block animate-pulse" />
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {/* WebSkill Manager Config Toggle Button */}
          <button
            onClick={() => {
              setCurrentScreen('webskill-manager');
            }}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
            title="WebSkill 技能"
          >
            <Blocks className="w-4.5 h-4.5" />
          </button>

          {/* History Toggle Button */}
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              setShowConfig(false);
            }}
            className={`p-1.5 rounded-lg transition cursor-pointer ${showHistory ? 'bg-accent text-accent-foreground font-semibold' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}`}
            title={lang === 'zh' ? '会话历史记录' : 'Chat History Logs'}
          >
            <History className="w-4.5 h-4.5" />
          </button>

          {/* New Chat fast button */}
          <button
            onClick={() => {
              createNewSession();
              setShowHistory(false);
            }}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
            title={lang === 'zh' ? '开启新对话' : 'New Conversations'}
          >
            <Plus className="w-4.5 h-4.5" />
          </button>

          {/* Config Settings */}
          <button
            onClick={() => {
              setShowConfig(!showConfig);
              setShowHistory(false);
            }}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              showConfig ? 'bg-accent text-accent-foreground font-semibold' : 'hover:bg-accent text-muted-foreground hover:text-foreground'
            }`}
            title={t.chat.configTitle}
          >
            <Settings2 className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {/* 2. Collapsible Custom LLM Credentials form */}
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-card border-b border-border p-4 z-20 relative overflow-hidden"
            id="llm-config-panel"
          >
            <form onSubmit={handleApplyConfig} className="space-y-3">
              <h4 className="text-xs font-semibold text-foreground flex items-center space-x-1.5 font-mono uppercase tracking-wider">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                <span>{t.chat.configTitle}</span>
              </h4>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1 font-mono uppercase tracking-wider">{t.chat.apiKey}</label>
                  <input
                    type="password"
                    value={localConfig.apiKey}
                    onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                    className="w-full text-sm bg-background px-3 py-1.5 rounded-lg border border-input text-foreground focus:outline-none focus:border-ring font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 font-mono uppercase tracking-wider">{t.chat.model}</label>
                    <input
                      type="text"
                      value={localConfig.modelName}
                      onChange={(e) => setLocalConfig({ ...localConfig, modelName: e.target.value })}
                      className="w-full text-sm bg-background px-3 py-1.5 rounded-lg border border-input text-foreground focus:outline-none focus:border-ring font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1 font-mono uppercase tracking-wider">{t.chat.endpoint}</label>
                    <input
                      type="text"
                      value={localConfig.endpoint}
                      onChange={(e) => setLocalConfig({ ...localConfig, endpoint: e.target.value })}
                      className="w-full text-sm bg-background px-3 py-1.5 rounded-lg border border-input text-foreground focus:outline-none focus:border-ring font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button type="button" onClick={() => setShowConfig(false)} className="btn-ghost px-3 py-1 text-xs cursor-pointer">
                  {t.actions.cancel}
                </button>
                <button type="submit" className="btn-primary px-3.5 py-1 text-xs cursor-pointer">
                  {t.chat.saveConfig}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Slide-out Session History List overlay */}
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-14 bg-popover text-popover-foreground border-b border-border shadow-pop z-25 p-4 max-h-[75%] overflow-y-auto select-none"
          >
            <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
              <span className="text-xs font-semibold text-foreground font-mono tracking-wider uppercase flex items-center">
                <History className="w-4 h-4 mr-1.5 text-muted-foreground" />
                {lang === 'zh' ? '多轮历史会话列表' : 'Conversation History'}
              </span>
              <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground transition p-0.5 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {sessions.map((sess) => {
                const isCurrent = sess.id === currentSessionId;
                return (
                  <div
                    key={sess.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition border cursor-pointer select-none ${
                      isCurrent
                        ? 'bg-accent text-accent-foreground border-border'
                        : 'text-popover-foreground hover:bg-accent/60 border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setCurrentSessionId(sess.id);
                        setShowHistory(false);
                      }}
                      className="flex-1 text-left text-sm font-medium truncate flex items-center space-x-2 mr-3 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{sess.title}</span>
                    </button>
                    <div className="flex items-center space-x-1.5 text-xs font-mono text-muted-foreground">
                      <span className="hidden sm:inline-block">{sess.timestamp}</span>
                      <button
                        onClick={() => deleteSession(sess.id)}
                        className="p-1 rounded-md hover:bg-destructive-soft hover:text-destructive text-muted-foreground transition cursor-pointer"
                        title={lang === 'zh' ? '删除此条记录' : 'Delete Session'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Render feed or prompt onboarding templates */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background relative" id="chat-messages-container">
        <AnimatePresence mode="wait">
          {chatHistory.length === 0 ? (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col justify-between py-2"
              id="chat-onboarding"
            >
              <div className="text-center my-auto px-4 max-w-sm mx-auto space-y-3 select-none">
                <div className="w-11 h-11 rounded-xl bg-card flex items-center justify-center mx-auto text-foreground shadow-xs border border-border">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">{lang === 'zh' ? '您好！我是敏捷智能协作助手' : 'Hello! I am Agile Workspace Copilot'}</h4>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {lang === 'zh'
                      ? '我可以智能分析当前选定项目的需求明细、迭代周期、缺陷程度以及自动化跑测结果。一键录入需求并实时生成各模块的分析报告。'
                      : 'I can query and map active scrum boards or DevOps ratios. Input commands below to paint columns, widgets, grids, or register new issues.'}
                  </p>
                </div>
              </div>

              {/* Prompt Quick Actions */}
              <div className="bg-card p-4 rounded-xl border border-border shadow-xs select-none">
                <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider block mb-2.5 px-1">{t.chat.templates}</span>
                <div className="space-y-2 max-h-[210px] overflow-y-auto">
                  {templates.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => executeTemplate(tpl.prompt)}
                      disabled={isLoading}
                      className="w-full text-left p-3 rounded-lg text-sm font-medium text-card-foreground bg-background hover:bg-accent border border-input hover:border-border transition flex items-center justify-between group cursor-pointer"
                    >
                      <span>{tpl.label}</span>
                      <Zap className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Meta Details */}
                  <div className="text-xs text-muted-foreground font-mono font-medium mb-1.5 flex items-center space-x-1.5 select-none">
                    {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    <span>{m.timestamp}</span>
                  </div>

                  {/* Message Box */}
                  <div
                    className={`max-w-[92%] px-4 py-3.5 rounded-2xl shadow-xs leading-relaxed space-y-2.5 text-sm ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none text-left font-medium'
                        : 'bg-card border border-border text-card-foreground rounded-tl-none text-left'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <p className="whitespace-pre-line leading-relaxed text-[15px]">{m.text}</p>
                    ) : (
                      <div className="markdown-body space-y-2 leading-relaxed text-[15px]">
                        <ReactMarkdown
                          components={{
                            p: ({ node, ...props }) => <p className="leading-relaxed text-card-foreground mb-1.5 text-[15px]" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-2 text-card-foreground text-[15px]" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 my-2 text-card-foreground text-[15px]" {...props} />,
                            li: ({ node, ...props }) => <li className="text-card-foreground leading-relaxed text-[15px]" {...props} />,
                            h1: ({ node, ...props }) => <h1 className="text-lg font-bold text-foreground mt-3 mb-1.5" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-base font-bold text-foreground mt-2.5 mb-1" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-[15px] font-semibold text-foreground mt-2 mb-1" {...props} />
                          }}
                        >
                          {m.text}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Streaming Spinner */}
                    {m.isStreaming && (
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground font-mono py-1 animate-pulse select-none">
                        <span className="w-3 h-3 rounded-full border-2 border-foreground border-t-transparent animate-spin inline-block" />
                        <span>{t.chat.streamWarning}</span>
                      </div>
                    )}

                    {/* Render UI Component if is assistant and schema exists */}
                    {m.role === 'assistant' && m.uiSchema && (
                      <div className="pt-2 animate-fadeIn text-card-foreground">
                        <OpenUIRenderer schema={m.uiSchema} lang={lang} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Chat Drawer Input Area */}
      <div className="p-3.5 bg-card border-t border-border">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={t.chat.placeholder}
            className="w-full text-sm pl-4 pr-11 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:border-ring transition placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`absolute right-1.5 p-2 rounded-md transition ${
              inputText.trim() && !isLoading ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs' : 'text-muted-foreground bg-transparent cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="mt-2.5 flex items-center justify-center space-x-1.5 text-xs text-muted-foreground select-none">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span>{lang === 'zh' ? '内容由AI生成，仅供参考' : 'Content generated by AI, for reference only'}</span>
        </div>
      </div>
    </div>
  );
};
