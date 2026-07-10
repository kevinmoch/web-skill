import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { useAgileData, ChatSession } from '../context/AgileDataContext';
import { translations } from '../utils/translations';
import { OpenUIRenderer } from './OpenUIRenderer';
import { Send, Settings2, Trash2, Sparkles, Cpu, Blocks, Zap, History, Plus, MessageSquare, X, User, Bot } from 'lucide-react';

export const AIChatPanel: React.FC = () => {
  const { chatHistory, sendChatMessage, clearChat, lang, llmConfig, setLlmConfig, sessions, currentSessionId, setCurrentSessionId, createNewSession, deleteSession, setCurrentScreen } = useAgileData();

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
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#0F172A] text-slate-700 dark:text-slate-150 border-l border-slate-200 dark:border-slate-800 shadow-2xl relative" id="ai-chat-panel">
      {/* 1. Header with model info and settings/history toggles */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/40 relative z-30">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/10 animate-pulse">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center font-display uppercase tracking-tight">
              <span>{lang === 'zh' ? '敏捷平台智能助手' : 'Agile Platform Assistant'}</span>
              <span className="ml-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse" />
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {/* WebSkill Manager Config Toggle Button */}
          <button
            onClick={() => {
              setCurrentScreen('webskill-manager');
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition duration-155 cursor-pointer"
            title="WebSkill 技能"
          >
            <Blocks className="w-4 h-4" />
          </button>

          {/* History Toggle Button */}
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              setShowConfig(false);
            }}
            className={`p-1.5 rounded-lg transition duration-150 cursor-pointer ${showHistory ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
            title={lang === 'zh' ? '会话历史记录' : 'Chat History Logs'}
          >
            <History className="w-4 h-4" />
          </button>

          {/* New Chat fast button */}
          <button
            onClick={() => {
              createNewSession();
              setShowHistory(false);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition duration-155 cursor-pointer"
            title={lang === 'zh' ? '开启新对话' : 'New Conversations'}
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Config Settings */}
          <button
            onClick={() => {
              setShowConfig(!showConfig);
              setShowHistory(false);
            }}
            className={`p-1.5 rounded-lg transition duration-200 cursor-pointer ${
              showConfig ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
            title={t.chat.configTitle}
          >
            <Settings2 className="w-4 h-4" />
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
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-slate-800 p-4 transition-all z-20 relative overflow-hidden"
            id="llm-config-panel"
          >
            <form onSubmit={handleApplyConfig} className="space-y-3">
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1 font-display">
                <Cpu className="w-3.5 h-3.5" />
                <span>{t.chat.configTitle}</span>
              </h4>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono uppercase tracking-wider">{t.chat.apiKey}</label>
                  <input
                    type="password"
                    value={localConfig.apiKey}
                    onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-550 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono uppercase tracking-wider">{t.chat.model}</label>
                    <input
                      type="text"
                      value={localConfig.modelName}
                      onChange={(e) => setLocalConfig({ ...localConfig, modelName: e.target.value })}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono uppercase tracking-wider">{t.chat.endpoint}</label>
                    <input
                      type="text"
                      value={localConfig.endpoint}
                      onChange={(e) => setLocalConfig({ ...localConfig, endpoint: e.target.value })}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button type="button" onClick={() => setShowConfig(false)} className="px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer">
                  {t.actions.cancel}
                </button>
                <button type="submit" className="px-3 py-1 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-md transition rounded-lg cursor-pointer">
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-18 bg-white dark:bg-[#151D30] border-b border-slate-200 dark:border-indigo-950 shadow-2xl z-25 p-4 max-h-[75%] overflow-y-auto select-none"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-wider uppercase flex items-center">
                <History className="w-3.5 h-3.5 mr-1.5" />
                {lang === 'zh' ? '多轮历史会话列表' : 'Conversation History'}
              </span>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {sessions.map((sess) => {
                const isCurrent = sess.id === currentSessionId;
                return (
                  <div
                    key={sess.id}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg font-bold transition border cursor-pointer select-none ${
                      isCurrent
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-indigo-950/20 border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setCurrentSessionId(sess.id);
                        setShowHistory(false);
                      }}
                      className="flex-1 text-left text-xs font-semibold truncate flex items-center space-x-2 mr-3 cursor-pointer"
                    >
                      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span className="truncate">{sess.title}</span>
                    </button>
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono">
                      <span className={`hidden sm:inline-block ${isCurrent ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{sess.timestamp}</span>
                      <button
                        onClick={() => deleteSession(sess.id)}
                        className={`p-1 rounded-md transition ${
                          isCurrent
                            ? 'hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300'
                            : 'hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-500'
                        }`}
                        title={lang === 'zh' ? '删除此条记录' : 'Delete Session'}
                      >
                        <Trash2 className="w-3.2 h-3.2" />
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-white dark:bg-slate-950/20 relative" id="chat-messages-container">
        <AnimatePresence mode="wait">
          {chatHistory.length === 0 ? (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full flex flex-col justify-between py-4"
              id="chat-onboarding"
            >
              <div className="text-center my-auto px-4 max-w-sm mx-auto space-y-4 select-none">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 shadow-xl border border-slate-200 dark:border-slate-700/60">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-display">{lang === 'zh' ? '您好！我是敏捷智能协作助手' : 'Hello! I am Agile Workspace Copilot'}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-normal">
                    {lang === 'zh'
                      ? '我可以智能分析当前选定项目的需求明细、迭代周期、缺陷程度以及自动化跑测结果。一键录入需求并实时生成各模块的分析报告。'
                      : 'I can query and map active scrum boards or DevOps ratios. Input commands below to paint columns, widgets, grids, or register new issues.'}
                  </p>
                </div>
              </div>

              {/* Prompt Quick Actions */}
              <div className="bg-[#F8FAFC] dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg select-none">
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-2 px-1">{t.chat.templates}</span>
                <div className="space-y-1.5 max-h-[190px] overflow-y-auto">
                  {templates.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => executeTemplate(tpl.prompt)}
                      disabled={isLoading}
                      className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center justify-between group cursor-pointer"
                    >
                      <span>{tpl.label}</span>
                      <Zap className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition" />
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
                  <div className="text-xs text-slate-400 dark:text-slate-400 font-bold mb-1.5 flex items-center space-x-1.5 font-mono select-none">
                    {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
                    <span>{m.timestamp}</span>
                  </div>

                  {/* Message Box */}
                  <div
                    className={`max-w-[92%] px-3.5 py-3 rounded-2xl shadow-xs leading-relaxed space-y-3 font-normal text-xs ${
                      m.role === 'user'
                        ? 'bg-indigo-600 dark:bg-indigo-700 text-white rounded-tr-none text-left'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none text-left'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <p className="whitespace-pre-line leading-relaxed font-normal">{m.text}</p>
                    ) : (
                      <div className="markdown-body space-y-1.5 leading-normal text-xs font-normal">
                        <ReactMarkdown
                          components={{
                            p: ({ node, ...props }) => <p className="leading-relaxed font-normal text-slate-800 dark:text-slate-100" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-extrabold text-[#4F46E5] dark:text-[#A5B4FC]" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 mt-1 mb-1" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1 mt-1 mb-1" {...props} />,
                            li: ({ node, ...props }) => <li className="text-slate-700 dark:text-slate-200" {...props} />,
                            h1: ({ node, ...props }) => <h1 className="text-sm font-extrabold text-slate-900 dark:text-white mt-2 mb-1" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 mb-1" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-xs font-bold text-slate-700 dark:text-slate-250 mt-1" {...props} />
                          }}
                        >
                          {m.text}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Streaming Spinner */}
                    {m.isStreaming && (
                      <div className="flex items-center space-x-2 text-[10px] text-indigo-400 font-bold font-mono py-1 animate-pulse select-none">
                        <span className="w-2.5 h-2.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin inline-block" />
                        <span>{t.chat.streamWarning}</span>
                      </div>
                    )}

                    {/* Render UI Component if is assistant and schema exists */}
                    {m.role === 'assistant' && m.uiSchema && (
                      <div className="pt-2 animate-fadeIn text-slate-800 dark:text-slate-150">
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
      <div className="p-3 bg-white dark:bg-[#0F172A]">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={t.chat.placeholder}
            className="w-full text-xs pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`absolute right-1.5 p-2 rounded-lg transition ${
              inputText.trim() && !isLoading ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md' : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 cursor-not-allowed'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="mt-2.5 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 dark:text-slate-500 select-none">
          <Sparkles className="w-3 h-3 text-indigo-500/80 dark:text-indigo-400/80 flex-shrink-0 animate-pulse" />
          <span>{lang === 'zh' ? '内容由AI生成，仅供参考' : 'Content generated by AI, for reference only'}</span>
        </div>
      </div>
    </div>
  );
};
