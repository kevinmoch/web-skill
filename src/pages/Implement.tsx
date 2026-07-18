import { motion } from 'motion/react';
import { FadeIn } from '../components/FadeIn';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Folder, File, FileText, FileCode, Image as ImageIcon,
  Layers, ArrowDown, Database, TerminalSquare, Box,
  Plug, Settings, RefreshCw, Zap, Server, Network, Cpu, Code
} from 'lucide-react';

export default function Implement({ t }: { t: any }) {
  
  const formatColonText = (text: string) => {
    if (!text) return null;
    let splitIndex = text.indexOf('：');
    if (splitIndex === -1) {
      splitIndex = text.indexOf(':');
    }
    
    if (splitIndex !== -1) {
      const title = text.substring(0, splitIndex + 1);
      const content = text.substring(splitIndex + 1);
      return (
        <>
          <span className="text-text-main font-medium">{title}</span>
          <span className="text-text-dim">{content}</span>
        </>
      );
    }
    return <span className="text-text-main">{text}</span>;
  };
  
  const mcpServerCode = `import { McpServer } from '@modelcontextprotocol/server';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { MessageChannelServerTransport, MessageChannelClientTransport } from './channel.ts';
import * as z from 'zod/v4';

const server = new McpServer({ name: 'greeting-server', version: '1.0.0' });

server.registerTool({
  'greet',
  {
    description: 'Greet someone by name',
    inputSchema: z.object({ name: z.string() }),
    async ({ name }) => {
    content: [{ type: 'text', text: \`Hello, \${name}!\` }],
    },
  },
});

const serverTransport = new MessageChannelServerTransport('endpoint');
const clientTransport = new MessageChannelClientTransport('endpoint');
const client = new Client({ name: 'greeting-client', version: '1.0.0' });

await serverTransport.listen();
await server.connect(serverTransport);
await client.connect(clientTransport);

const result = await client.listTools();
const response = await client.callTool({ name: 'greet', arguments: { name: 'Jack' } });`;

  const chromeMcpCode = `const controller = new AbortController();

navigator.modelContext.registerTool({
  name: 'fetch_page_summary',
  description: 'Fetches the title and a partial body summary of the current page for content analysis.',
  inputSchema: {
    type: 'object',
    properties: {
      maxLength: { type: 'integer', description: 'Maximum number of characters for the returned summary', default: 100 }
    }
  },
  execute: async ({ maxLength }) => {
    const title = document.title;
    const bodyText = document.body.innerHTML.slice(0, maxLength);

    return {
      content: [{ type: 'text', text: \`Title: \${title}\\nSummary: \${bodyText}\` }]
    };
  }
});

const availableTools = await navigator.modelContextTesting.listTools();
console.log('Registered WebMCP tools on the current page:', availableTools);

const targetTool = 'fetch_page_summary';
const toolArguments = JSON.stringify({ maxLength: 150 });
const response = await navigator.modelContextTesting.executeTool(targetTool, toolArguments);`;

  return (
    <div className="flex flex-col gap-16 w-full max-w-[1024px] mx-auto px-4 sm:px-6 md:px-8 lg:px-0 py-16">
      
      {/* Screen 1: Directory Structure (2.1) */}
      <section className="flex flex-col gap-8">
        <FadeIn>
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-[28px] md:text-[32px] font-medium tracking-tight mb-4">{t('implement.s1Title')}</h2>
            <p className="text-[15px] md:text-[16px] text-text-dim leading-relaxed">
              {t('implement.s1Desc')}
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div className=" rounded-3xl p-6 md:p-8 lg:p-12 bg-surface flex flex-col gap-8">
            <div className="w-full bg-bg  rounded-2xl p-6 font-mono text-[14px]">
              <div className="flex items-center gap-2 text-accent mb-4 font-bold">
                <Folder className="w-5 h-5 fill-accent/20" />
                {t('implement.s1DirRoot')}
              </div>
              <div className="ml-4 flex flex-col gap-4 border-l border-border-color pl-4">
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-2 text-text-main">
                    <FileText className="w-4 h-4 text-text-dim" />
                    {t('implement.s1DirSkill')}
                  </div>
                  <div className="text-text-dim/60 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                    {t('implement.s1DirSkillDesc')}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 text-text-main">
                      <Folder className="w-4 h-4 text-accent/80 fill-accent/10" />
                      {t('implement.s1DirScripts')}
                    </div>
                    <div className="text-text-dim/60 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                      {t('implement.s1DirScriptsDesc')}
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col gap-2 border-l border-border-color/50 pl-3">
                    <div className="flex items-center gap-2 text-text-dim text-[13px]"><FileCode className="w-3.5 h-3.5" /> index.ts</div>
                    <div className="flex items-center gap-2 text-text-dim text-[13px]"><FileCode className="w-3.5 h-3.5" /> utils.js</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 text-text-main">
                      <Folder className="w-4 h-4 text-accent/80 fill-accent/10" />
                      {t('implement.s1DirRefs')}
                    </div>
                    <div className="text-text-dim/60 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                      {t('implement.s1DirRefsDesc')}
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col gap-2 border-l border-border-color/50 pl-3">
                    <div className="flex items-center gap-2 text-text-dim text-[13px]"><File className="w-3.5 h-3.5" /> template.html</div>
                    <div className="flex items-center gap-2 text-text-dim text-[13px]"><File className="w-3.5 h-3.5" /> config.json</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 text-text-main">
                      <Folder className="w-4 h-4 text-accent/80 fill-accent/10" />
                      {t('implement.s1DirAssets')}
                    </div>
                    <div className="text-text-dim/60 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                      {t('implement.s1DirAssetsDesc')}
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col gap-2 border-l border-border-color/50 pl-3">
                    <div className="flex items-center gap-2 text-text-dim text-[13px]"><ImageIcon className="w-3.5 h-3.5" /> logo.png</div>
                    <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-2 text-text-dim text-[13px]"><Folder className="w-3.5 h-3.5" /> intermediate/</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-surface rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[12px] font-bold text-accent">1</span>
                </div>
                <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s1Exp1'))}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[12px] font-bold text-accent">2</span>
                </div>
                <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s1Exp2'))}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[12px] font-bold text-accent">3</span>
                </div>
                <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s1Exp3'))}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[12px] font-bold text-accent">4</span>
                </div>
                <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s1Exp4'))}</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Screen 2: Progressive Disclosure (2.2) */}
      <section className="flex flex-col gap-8">
        <FadeIn>
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-[28px] md:text-[32px] font-medium tracking-tight mb-4">{t('implement.s2Title')}</h2>
            <p className="text-[15px] md:text-[16px] text-text-dim leading-relaxed">
              {t('implement.s2Desc')}
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div className="flex flex-col items-center gap-2 w-full max-w-2xl mx-auto">
            <div className="w-full bg-accent/10 border border-accent/20 rounded-t-3xl rounded-b-xl p-6 text-center relative overflow-hidden group hover:bg-accent/20 transition-colors cursor-default">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Layers className="w-16 h-16 text-accent" />
               </div>
               <h3 className="text-accent font-bold text-[18px] mb-2 relative z-10">{t('implement.s2L1')}</h3>
               <p className="text-accent/80 text-[14px] relative z-10">{t('implement.s2L1Desc')}</p>
            </div>
            <ArrowDown className="w-5 h-5 text-text-dim/70" />
            <div className="w-full bg-surface/50  rounded-xl p-6 text-center hover:bg-surface/70 transition-colors cursor-default">
               <h3 className="text-text-main font-medium text-[16px] mb-2">{t('implement.s2L2')}</h3>
               <p className="text-text-dim text-[13px]">{t('implement.s2L2Desc')}</p>
            </div>
            <ArrowDown className="w-5 h-5 text-text-dim/70" />
            <div className="w-full bg-bg  rounded-b-3xl rounded-t-xl p-6 text-center hover:bg-surface transition-colors cursor-default">
               <h3 className="text-text-main font-medium text-[16px] mb-2">{t('implement.s2L3')}</h3>
               <p className="text-text-dim text-[13px]">{t('implement.s2L3Desc')}</p>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="flex flex-col gap-4 bg-surface  rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px] font-bold text-accent">1</span>
              </div>
              <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s2Exp1'))}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px] font-bold text-accent">2</span>
              </div>
              <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s2Exp2'))}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px] font-bold text-accent">3</span>
              </div>
              <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s2Exp3'))}</p>
            </div>
            <div className="mt-4 p-4 border-l-2 border-accent bg-accent/5 rounded-r-xl">
              <p className="text-[14px] md:text-[15px] leading-relaxed italic">{formatColonText(t('implement.s2Exp4'))}</p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Screen 3: Execution Units (2.3) */}
      <section className="flex flex-col gap-8">
        <FadeIn>
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-[28px] md:text-[32px] font-medium tracking-tight mb-4">{t('implement.s3Title')}</h2>
            <p className="text-[15px] md:text-[16px] text-text-dim leading-relaxed">
              {t('implement.s3Desc')}
            </p>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="p-6  rounded-2xl bg-surface flex flex-col items-center text-center">
               <FileCode className="w-8 h-8 text-accent mb-4 opacity-80" />
               <h4 className="font-medium text-text-main mb-2">{t('implement.s3Req1')}</h4>
               <p className="text-text-dim text-[13px] leading-relaxed">{t('implement.s3Req1Desc')}</p>
             </div>
             <div className="p-6  rounded-2xl bg-surface flex flex-col items-center text-center">
               <Zap className="w-8 h-8 text-accent mb-4 opacity-80" />
               <h4 className="font-medium text-text-main mb-2">{t('implement.s3Req2')}</h4>
               <p className="text-text-dim text-[13px] leading-relaxed">{t('implement.s3Req2Desc')}</p>
             </div>
             <div className="p-6  rounded-2xl bg-surface flex flex-col items-center text-center">
               <Settings className="w-8 h-8 text-accent mb-4 opacity-80" />
               <h4 className="font-medium text-text-main mb-2">{t('implement.s3Req3')}</h4>
               <p className="text-text-dim text-[13px] leading-relaxed">{t('implement.s3Req3Desc')}</p>
             </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="flex flex-col gap-4 bg-surface  rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px] font-bold text-accent">1</span>
              </div>
              <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s3Exp1'))}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px] font-bold text-accent">2</span>
              </div>
              <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s3Exp2'))}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px] font-bold text-accent">3</span>
              </div>
              <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s3Exp3'))}</p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-col gap-6 mt-4">
            <div className="text-center">
              <h4 className="text-[16px] font-semibold text-accent tracking-wide">{t('implement.s3SchemaMethodsTitle')}</h4>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 bg-surface  rounded-2xl p-6 flex flex-col relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <Code className="w-6 h-6 text-accent mb-4" />
                <h4 className="text-text-main font-medium mb-2">{t('implement.s3Method1Title')}</h4>
                <p className="text-text-dim text-[13px] leading-relaxed">{t('implement.s3Method1Desc')}</p>
              </div>
              <div className="flex-1 bg-surface  rounded-2xl p-6 flex flex-col relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <FileCode className="w-6 h-6 text-accent mb-4" />
                <h4 className="text-text-main font-medium mb-2">{t('implement.s3Method2Title')}</h4>
                <p className="text-text-dim text-[13px] leading-relaxed">{t('implement.s3Method2Desc')}</p>
              </div>
              <div className="flex-1 bg-surface  rounded-2xl p-6 flex flex-col relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <FileText className="w-6 h-6 text-accent mb-4" />
                <h4 className="text-text-main font-medium mb-2">{t('implement.s3Method3Title')}</h4>
                <p className="text-text-dim text-[13px] leading-relaxed">{t('implement.s3Method3Desc')}</p>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="mt-4 p-6  rounded-2xl bg-[#0A0A0A] flex flex-col items-center">
            <div className="font-mono text-[13px] text-accent mb-2">{t('implement.s3McpReturnFormat')}</div>
            <pre className="text-[12px] font-mono text-text-dim bg-black/50 p-4 rounded-xl /50 w-full max-w-lg overflow-x-auto code-scrollbar">
              <code>{`{\n  "content": [\n    {\n      "type": "text",\n      "text": "..."\n    }\n  ]\n}`}</code>
            </pre>
          </div>
        </FadeIn>

        <FadeIn delay={0.5}>
          <div className="flex flex-col gap-4 bg-surface  rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px] font-bold text-accent">1</span>
              </div>
              <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s3Ret1'))}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px] font-bold text-accent">2</span>
              </div>
              <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s3Ret2'))}</p>
            </div>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.6} className="flex flex-col gap-6 w-full max-w-full overflow-hidden">
           <div className="flex flex-col overflow-hidden max-h-[400px] w-full min-w-0 bg-bg  rounded-xl">
              <div className="bg-black/60 border-b border-border-color px-4 py-2 text-[12px] font-mono text-text-dim flex items-center gap-2">
                <TerminalSquare className="w-3.5 h-3.5" />
                Standard MCP SDK (TypeScript)
              </div>
              <div className="overflow-auto code-scrollbar text-[12px] font-mono leading-[1.6] flex-1 bg-black/30">
                 <SyntaxHighlighter language="typescript" style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', background: 'transparent', overflow: 'visible', width: 'max-content', minWidth: '100%' }}>
                    {mcpServerCode}
                 </SyntaxHighlighter>
              </div>
           </div>
           
           <div className="flex flex-col overflow-hidden max-h-[400px] w-full min-w-0 bg-bg  rounded-xl">
              <div className="bg-black/60 border-b border-border-color px-4 py-2 text-[12px] font-mono text-text-dim flex items-center gap-2">
                <Box className="w-3.5 h-3.5" />
                Chrome MCP API (Experimental)
              </div>
              <div className="overflow-auto code-scrollbar text-[12px] font-mono leading-[1.6] flex-1 bg-black/30">
                 <SyntaxHighlighter language="typescript" style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', background: 'transparent', overflow: 'visible', width: 'max-content', minWidth: '100%' }}>
                    {chromeMcpCode}
                 </SyntaxHighlighter>
              </div>
           </div>
        </FadeIn>
      </section>

      {/* Screen 4: Page-Level Dynamic Skills (2.4) */}
      <section className="flex flex-col gap-8">
        <FadeIn>
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-[28px] md:text-[32px] font-medium tracking-tight mb-4">{t('implement.s4Title')}</h2>
            <p className="text-[15px] md:text-[16px] text-text-dim leading-relaxed">
              {t('implement.s4Desc')}
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div className=" rounded-3xl p-8 md:p-16 bg-[#0A0A0A] flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
             <div className="flex flex-col items-center text-center w-64">
                <div className="w-24 h-24 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center mb-6 relative">
                   <div className="absolute inset-0 rounded-full animate-ping bg-accent/20"></div>
                   <Server className="w-10 h-10 text-accent" />
                </div>
                <h4 className="font-bold text-[16px] text-accent mb-2">{t('implement.s4Main')}</h4>
                <p className="text-[13px] text-text-dim">{t('implement.s4MainDesc')}</p>
             </div>
             
             <div className="flex flex-col items-center gap-2">
                <Network className="w-8 h-8 text-text-dim/50" />
                <div className="h-0.5 w-16 md:w-32 bg-gradient-to-r from-accent/50 to-text-main/50 relative">
                   <div className="absolute top-4 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_#00F0FF] animate-[pulse_2s_ease-in-out_infinite]"></div>
                </div>
                <span className="text-[11px] font-mono text-text-dim uppercase tracking-wider">{t('implement.s4Channel')}</span>
             </div>
             
             <div className="flex flex-col items-center text-center w-64">
                <div className="w-24 h-24 rounded-full bg-surface border-2 border-border-color flex items-center justify-center mb-6">
                   <Cpu className="w-10 h-10 text-text-main" />
                </div>
                <h4 className="font-medium text-[16px] text-text-main mb-2">{t('implement.s4Worker')}</h4>
                <p className="text-[13px] text-text-dim">{t('implement.s4WorkerDesc')}</p>
             </div>
          </div>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="flex flex-col gap-4 bg-surface  rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px] font-bold text-accent">1</span>
              </div>
              <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s4Exp1'))}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px] font-bold text-accent">2</span>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s4Exp2'))}</p>
                <div className="pl-4 border-l border-border-color flex flex-col gap-3 w-full">
                  <p className="text-[13px] md:text-[14px] leading-relaxed">{formatColonText(t('implement.s4Exp3'))}</p>
                  <p className="text-[13px] md:text-[14px] leading-relaxed">{formatColonText(t('implement.s4Exp4'))}</p>
                  <p className="text-[13px] md:text-[14px] leading-relaxed">{formatColonText(t('implement.s4Exp5'))}</p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Screen 5: Generative UI (2.5) */}
      <section className="flex flex-col gap-8">
        <FadeIn>
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-[28px] md:text-[32px] font-medium tracking-tight mb-4">{t('implement.s5Title')}</h2>
            <p className="text-[15px] md:text-[16px] text-text-dim leading-relaxed">
              {t('implement.s5Desc')}
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
           <div className=" rounded-3xl p-8 bg-surface flex flex-col gap-12">
              <div className="flex flex-col md:flex-row items-start md:items-start justify-between gap-8 md:gap-4 relative w-full">
                 <div className="absolute top-4 left-0 w-full h-px bg-border-color z-0 hidden md:block"></div>
                 <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border-color z-0 md:hidden"></div>
                 
                 {[
                   { id: 1, label: t('implement.s5State1'), active: false },
                   { id: 2, label: t('implement.s5State2'), active: true },
                   { id: 3, label: t('implement.s5State3'), active: true },
                   { id: 4, label: t('implement.s5State4'), active: false },
                   { id: 5, label: t('implement.s5State5'), active: false }
                 ].map((state, i) => (
                    <div key={state.id} className="flex flex-row md:flex-col items-center gap-4 md:gap-3 bg-surface z-10 py-1 md:py-0 pr-4 md:pr-0">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[12px] font-mono font-bold transition-colors ${state.active ? 'bg-accent text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'bg-surface border border-border-color text-text-dim'}`}>
                         {state.id}
                       </div>
                       <div className={`text-[13px] md:text-[11px] font-mono text-left md:text-center ${state.active ? 'text-accent' : 'text-text-dim'}`}>
                         {state.label}
                       </div>
                    </div>
                 ))}
              </div>
              
              <div className="bg-[#0A0A0A]  rounded-2xl p-8 flex flex-col items-center text-center max-w-lg mx-auto w-full relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none"></div>
                 <Plug className="w-10 h-10 text-accent mb-4 relative z-10" />
                 <h4 className="text-[18px] font-medium text-text-main mb-2 relative z-10">{t('implement.s5Bridge')}</h4>
                 <p className="text-[14px] text-text-dim relative z-10">{t('implement.s5BridgeDesc')}</p>
                 <div className="mt-6 flex flex-wrap justify-center gap-3 relative z-10">
                    <span className="px-3 py-1 bg-surface  rounded-full text-[12px] text-text-dim">React</span>
                    <span className="px-3 py-1 bg-surface  rounded-full text-[12px] text-text-dim">Vercel AI SDK</span>
                    <span className="px-3 py-1 bg-surface  rounded-full text-[12px] text-text-dim">OpenUI</span>
                 </div>
              </div>
           </div>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="flex flex-col gap-4 bg-surface  rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px] font-bold text-accent">1</span>
              </div>
              <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s5Exp1'))}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px] font-bold text-accent">2</span>
              </div>
              <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s5Exp2'))}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px] font-bold text-accent">3</span>
              </div>
              <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s5Exp3'))}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px] font-bold text-accent">4</span>
              </div>
              <p className="text-[14px] md:text-[15px] leading-relaxed">{formatColonText(t('implement.s5Exp4'))}</p>
            </div>
          </div>
        </FadeIn>
      </section>
      
    </div>
  );
}
