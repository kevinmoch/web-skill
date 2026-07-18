import { FadeIn } from '../components/FadeIn';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { TerminalSquare, ShieldAlert, Code, CheckCircle2, Box, Layers, Play } from 'lucide-react';

const mcpNavigatorCode = `partial interface Navigator {
  readonly attribute WebSkill webskill;
};

[Exposed=Window] interface WebSkill {
  // — SkillDiscovery —
  Promise<SkillCatalog>          discover(DOMString... roots);
  Promise<SkillDocument>         read(DOMString name);
  Promise<ValidationReport>      validate(DOMString... roots);

  // — MinimalRuntime —
  Promise<RuntimeRun>            run(DOMString prompt);

  // — SkillManager —
  Promise<InstalledSkillManifest> install(DOMString source);
  Promise<undefined>              uninstall(DOMString name);
};`;

const mcpCatalogCode = `dictionary SkillCatalog {
  required sequence<SkillCatalogEntry> entries;
  required DOMString generatedAt;
};

dictionary SkillCatalogEntry {
  required DOMString name;
  required DOMString description;
  DOMString version;
  sequence<DOMString> tags;
  required DOMString root;
  required boolean hasScripts;
  required boolean hasReferences;
  required boolean hasAssets;
  required SkillCatalogSource source;
};

dictionary SkillDocument {
  required SkillMetadata metadata;
  required DOMString body;
  required DOMString raw;
  required SkillLocation location;
};

dictionary SkillMetadata {
  required DOMString name;
  required DOMString description;
  DOMString version;
  sequence<DOMString> tags;
  DOMString author;
  DOMString license;
};

dictionary SkillLocation {
  required DOMString root;
  required DOMString skillFile;
};`;

const mcpValidationCode = `dictionary ValidationReport {
  required boolean ok;
  required sequence<ValidationIssue> issues;
};

dictionary ValidationIssue {
  required DOMString code;
  required ValidationSeverity severity;
  required DOMString message;
  DOMString path;
  any details;
};

typedef (DOMString) ValidationSeverity;

dictionary RuntimeRun {
  required DOMString id;
  required DOMString sessionId;
  required RunStatus status;
  required RuntimePhase phase;
  required DOMString userPrompt;
  required DOMString startedAt;
  DOMString endedAt;
  sequence<Artifact> artifacts;
  sequence<TraceEvent> trace;
};`;

const mcpRuntimeReturnCode = `typedef (DOMString) RunStatus;
// "created"|"running"|"interrupted"|
// "completed"|"failed"|"cancelled"

typedef (DOMString) RuntimePhase;
// "discover"|"route"|"activate"|"prepare"|
// "execute"|"observe"|"interact"|"complete"|"fail"

dictionary Artifact {
  required DOMString id;
  required DOMString runId;
  required DOMString path;
  required DOMString type;
  DOMString mimeType;
  unsigned long long size;
  required DOMString createdAt;
  record<DOMString, any> metadata;
};

dictionary TraceEvent {
  required DOMString id;
  required DOMString runId;
  required DOMString ts;
  RuntimePhase phase;
  required DOMString type;
  DOMString message;
  record<DOMString, any> data;
};`;

const mcpInstallManifestCode = `dictionary InstalledSkillManifest {
  required unsigned short schemaVersion;
  required DOMString name;
  required DOMString version;
  required SkillSource source;
  required DOMString installedAt;
  required ManifestIntegrity integrity;
  required sequence<ManifestFile> files;
};

dictionary SkillSource {
  required SkillSourceType type;
  DOMString path;
  DOMString url;
  DOMString packageName;
  DOMString version;
  DOMString commit;
};

dictionary ManifestIntegrity {
  required DOMString algorithm;
  required DOMString digest;
};

dictionary ManifestFile {
  required DOMString path;
  required unsigned long long size;
  required DOMString sha256;
};`;

const mcpJsUsageCode = `const ws = navigator.webskill;

// // discover → SkillCatalog
const catalog = await ws.discover('/skills');
for (const e of catalog.entries) {
  console.log(e.name, e.hasScripts);
}

// // read → SkillDocument
const doc = await ws.read('calculator');
console.log(doc.metadata.description, doc.body);

// // validate → ValidationReport
const report = await ws.validate('/skills');
if (!report.ok) report.issues.forEach((i) => console.warn(i));

// // run → RuntimeRun
const run = await ws.run('用 calculator 计算 2+3');
console.log(run.status, run.trace.length);

// // install → InstalledSkillManifest
const m = await ws.install('https://github.com/me/skills.git');
console.log(m.name, m.installedAt, m.integrity.digest);

// // uninstall → void
await ws.uninstall('calculator');`;

const readmeCompleteCode = `// 示例一：使用标准 MCP TypeScript SDK 动态声明并呼叫页面工具
import { McpServer } from '@modelcontextprotocol/server';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { MessageChannelServerTransport, MessageChannelClientTransport } from './channel.ts';
import * as z from 'zod/v4';

// 1. 初始化页面级 WebMCP 工具服务器
const server = new McpServer({ name: 'greeting-server', version: '1.0.0' });

server.registerTool({
  'greet',
  {
    description: 'Greet someone by name',
    inputSchema: z.object({ name: z.string() }),
    async ({ name }) => {
      return {
        content: [{ type: 'text', text: \`Hello, \${name}!\` }],
      };
    },
  },
});

// 2. 建立双向 MessageChannel 通道
const serverTransport = new MessageChannelServerTransport('endpoint');
const clientTransport = new MessageChannelClientTransport('endpoint');
const client = new Client({ name: 'greeting-client', version: '1.0.0' });

await serverTransport.listen();
await server.connect(serverTransport);
await client.connect(clientTransport);

// 3. 呼叫工具并取得结果
const availableTools = await client.listTools();
const response = await client.callTool({ name: 'greet', arguments: { name: 'Jack' } });
console.log('执行结果:', response.content[0].text);


// 示例二：使用 Chrome 实验性 MCP API (navigator.modelContext)
const controller = new AbortController();

navigator.modelContext.registerTool({
  name: 'fetch_page_summary',
  description: '获取当前页面的标题和部分正文摘要，用于分析页面内容。',
  inputSchema: {
    type: 'object',
    properties: {
      maxLength: { type: 'integer', description: '返回摘要的最大字数', default: 100 }
    }
  },
  execute: async ({ maxLength }) => {
    const title = document.title;
    const bodyText = document.body.innerHTML.slice(0, maxLength);

    return {
      content: [{ type: 'text', text: \`标题: \${title}\\n内容摘要: \${bodyText}\` }]
    };
  }
});

const pageTools = await navigator.modelContextTesting.listTools();
console.log('当前页面已注册的 WebMCP 工具:', pageTools);

const targetTool = 'fetch_page_summary';
const toolArguments = JSON.stringify({ maxLength: 150 });
const chromeResponse = await navigator.modelContextTesting.executeTool(targetTool, toolArguments);
console.log('Chrome API 执行结果:', chromeResponse);`;

export default function Standards({ t }: { t: any }) {
  return (
    <div className="flex flex-col gap-12 md:gap-16 w-full max-w-[1024px] mx-auto px-4 sm:px-6 md:px-8 lg:px-0 pb-16">
      
      {/* Introduction Header */}
      <div className="text-center max-w-3xl mx-auto mt-6 md:mt-12">
        <FadeIn>
          <h1 className="text-[28px] sm:text-[34px] md:text-[40px] font-medium tracking-tight mb-4">
            {t('standards.pageHeading')}
          </h1>
        </FadeIn>
      </div>

      {/* Screen 1: Web IDL Base Definitions */}
      <section className="flex flex-col gap-6 md:gap-8 bg-surface  rounded-3xl p-6 md:p-8 lg:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
        <FadeIn>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-[18px] sm:text-[22px] font-medium text-text-main">
                {t('standards.sec31Title')}
              </h2>
              <span className="text-xs font-mono text-accent uppercase tracking-wider">Web IDL Interface Spec</span>
            </div>
          </div>
          <p className="text-[14px] text-text-dim leading-relaxed mt-4">
            {t('standards.sec31Desc')}
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="flex flex-col gap-6 w-full max-w-full overflow-hidden">
           <div className="flex flex-col overflow-hidden max-h-[480px] w-full min-w-0 bg-bg  rounded-xl">
              <div className="bg-black/60 border-b border-border-color px-4 py-2.5 text-[12px] font-mono text-text-dim flex items-center gap-2 shrink-0">
                <TerminalSquare className="w-3.5 h-3.5" />
                Navigator & WebSkill IDL
              </div>
              <div className="overflow-auto code-scrollbar text-[12px] font-mono leading-[1.6] flex-1 bg-black/30">
                 <SyntaxHighlighter language="csharp" style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', background: 'transparent', overflow: 'visible', width: 'max-content', minWidth: '100%' }}>
                    {mcpNavigatorCode}
                 </SyntaxHighlighter>
              </div>
           </div>
           
           <div className="flex flex-col overflow-hidden max-h-[480px] w-full min-w-0 bg-bg  rounded-xl">
              <div className="bg-black/60 border-b border-border-color px-4 py-2.5 text-[12px] font-mono text-text-dim flex items-center gap-2 shrink-0">
                <Code className="w-3.5 h-3.5" />
                Skill Document & Metadata Dictionaries
              </div>
              <div className="overflow-auto code-scrollbar text-[12px] font-mono leading-[1.6] flex-1 bg-black/30">
                 <SyntaxHighlighter language="csharp" style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', background: 'transparent', overflow: 'visible', width: 'max-content', minWidth: '100%' }}>
                    {mcpCatalogCode}
                 </SyntaxHighlighter>
              </div>
           </div>
        </FadeIn>
      </section>

      {/* Screen 2: Validation & Runtime Return Values */}
      <section className="flex flex-col gap-6 md:gap-8 bg-surface  rounded-3xl p-6 md:p-8 lg:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
        <FadeIn>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-[18px] sm:text-[22px] font-medium text-text-main">
                {t('standards.sec32Title')}
              </h2>
              <span className="text-xs font-mono text-accent uppercase tracking-wider">Validation & Trailing Types</span>
            </div>
          </div>
          <p className="text-[14px] text-text-dim leading-relaxed mt-4">
            {t('standards.sec32Desc')}
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="flex flex-col gap-6 w-full max-w-full overflow-hidden">
           <div className="flex flex-col overflow-hidden max-h-[480px] w-full min-w-0 bg-bg  rounded-xl">
              <div className="bg-black/60 border-b border-border-color px-4 py-2.5 text-[12px] font-mono text-text-dim flex items-center gap-2 shrink-0">
                <TerminalSquare className="w-3.5 h-3.5" />
                Validation Report & Issues IDL
              </div>
              <div className="overflow-auto code-scrollbar text-[12px] font-mono leading-[1.6] flex-1 bg-black/30">
                 <SyntaxHighlighter language="csharp" style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', background: 'transparent', overflow: 'visible', width: 'max-content', minWidth: '100%' }}>
                    {mcpValidationCode}
                 </SyntaxHighlighter>
              </div>
           </div>
           
           <div className="flex flex-col overflow-hidden max-h-[480px] w-full min-w-0 bg-bg  rounded-xl">
              <div className="bg-black/60 border-b border-border-color px-4 py-2.5 text-[12px] font-mono text-text-dim flex items-center gap-2 shrink-0">
                <Box className="w-3.5 h-3.5" />
                Runtime Traces & Artifacts IDL
              </div>
              <div className="overflow-auto code-scrollbar text-[12px] font-mono leading-[1.6] flex-1 bg-black/30">
                 <SyntaxHighlighter language="csharp" style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', background: 'transparent', overflow: 'visible', width: 'max-content', minWidth: '100%' }}>
                    {mcpRuntimeReturnCode}
                 </SyntaxHighlighter>
              </div>
           </div>
        </FadeIn>
      </section>

      {/* Screen 3: Skill Installation returns and usages */}
      <section className="flex flex-col gap-6 md:gap-8 bg-surface  rounded-3xl p-6 md:p-8 lg:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
        <FadeIn>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-[18px] sm:text-[22px] font-medium text-text-main">
                {t('standards.sec33Title')}
              </h2>
              <span className="text-xs font-mono text-accent uppercase tracking-wider">Dynamic Installations & API</span>
            </div>
          </div>
          <p className="text-[14px] text-text-dim leading-relaxed mt-4">
            {t('standards.sec33Desc')}
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="flex flex-col gap-6 w-full max-w-full overflow-hidden">
           <div className="flex flex-col overflow-hidden max-h-[480px] w-full min-w-0 bg-bg  rounded-xl">
              <div className="bg-black/60 border-b border-border-color px-4 py-2.5 text-[12px] font-mono text-text-dim flex items-center gap-2 shrink-0">
                <TerminalSquare className="w-3.5 h-3.5" />
                Installed Skill Manifest IDL
              </div>
              <div className="overflow-auto code-scrollbar text-[12px] font-mono leading-[1.6] flex-1 bg-black/30">
                 <SyntaxHighlighter language="csharp" style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', background: 'transparent', overflow: 'visible', width: 'max-content', minWidth: '100%' }}>
                    {mcpInstallManifestCode}
                 </SyntaxHighlighter>
              </div>
           </div>
           
           <div className="flex flex-col overflow-hidden max-h-[480px] w-full min-w-0 bg-bg  rounded-xl">
              <div className="bg-black/60 border-b border-border-color px-4 py-2.5 text-[12px] font-mono text-text-dim flex items-center gap-2 shrink-0">
                <Play className="w-3.5 h-3.5 text-accent" />
                JavaScript API Usage Example
              </div>
              <div className="overflow-auto code-scrollbar text-[12px] font-mono leading-[1.6] flex-1 bg-black/30">
                 <SyntaxHighlighter language="javascript" style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', background: 'transparent', overflow: 'visible', width: 'max-content', minWidth: '100%' }}>
                    {mcpJsUsageCode}
                 </SyntaxHighlighter>
              </div>
           </div>
        </FadeIn>
      </section>

    </div>
  );
}
