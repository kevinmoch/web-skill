import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path, { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { viewerCspHeader } from '@webskill/sdk/browser';
import { webskillConfig } from '@webskill/chatbot/vite';

/**
 * viewer 路由（文档投放面）。**这是宿主的部署责任**，不是纯客户端能力：
 * `sandbox` 指令只有走 HTTP 响应头才生效，`<meta>` 里会被忽略。
 * 两条头缺一不可：
 * 1. viewer 文档的 CSP —— 白名单必须写明宿主来源，'self' 在 opaque origin 下匹配不上任何东西；
 * 2. viewer 资源的 `Access-Control-Allow-Origin` —— 模块脚本带 crossorigin，缺了就直接 CORS 失败。
 * dev 与 preview 都要挂。
 */
function viewerRoute(): Plugin {
  const middleware = (
    req: {
      url?: string;
      headers: Record<string, string | string[] | undefined>;
      // Node 的 socket 是 net.Socket，只有 TLS 连接才有 encrypted。不能声明成 `{ encrypted?: boolean }`：
      // 那样和 IncomingMessage 没有公共属性，整个中间件反而装不进 vite
      socket?: unknown;
    },
    res: { setHeader(k: string, v: string): void },
    next: () => void
  ) => {
    const p = (req.url ?? '').split('?')[0] ?? '';
    if (p.endsWith('/viewer.html')) {
      // CSP 的来源必须和页面**实际**来源逐字符相同（协议 + 主机 + 端口），差一样脚本就全被拦、
      // 页面只剩静态外壳，握手永不返回、SDK 只能报超时。
      // HTTP/2（https dev）不发 host 头，只有 :authority；协议也不能写死 http。
      const authority = req.headers[':authority'] ?? req.headers['host'];
      const encrypted = (req.socket as { encrypted?: unknown } | undefined)?.encrypted;
      const scheme = encrypted === true ? 'https' : 'http';
      const host = typeof authority === 'string' && authority !== '' ? authority : undefined;
      if (host === undefined) {
        // 猜一个来源等于发一份必定对不上的 CSP：宁可不下发，也好过静默把 viewer 变成空白页
        throw new Error('viewer route: request carries neither ":authority" nor "host"; cannot derive the CSP origin');
      }
      const origin = `${scheme}://${host}`;
      const isDev = process.env.NODE_ENV !== 'production';
      let csp = viewerCspHeader({
        hostOrigin: origin,
        // dev server 会给 HTML 注入内联 preamble 并连 HMR websocket；只影响 dev，生产构建都不需要
        ...(isDev ? { connectSrc: [`${scheme === 'https' ? 'wss' : 'ws'}://${host}`] } : {})
      });
      // 受信外壳里的 echarts（viewer 组件的 Chart）需要 eval；技能内容经 postMessage + innerHTML
      // 进入、其中 <script> 本就不执行，所以 eval 的实际受益方只有外壳自身。
      // dev 另加 'unsafe-inline'：vite 给 HTML 注入的内联 preamble 需要它。
      csp = csp.replace(`script-src ${origin}`, `script-src ${origin} 'unsafe-eval'${isDev ? " 'unsafe-inline'" : ''}`);
      res.setHeader('Content-Security-Policy', csp);
    }
    // viewer 在 opaque origin 里，模块脚本带 crossorigin → Origin: null 的跨源请求，
    // 缺了这条头就直接 CORS 失败（页面一片空白）。构建产物与 dev 模块都是公开静态资源，
    // 放行跨源读取不引入新的暴露面。
    if (p.startsWith('/assets/') || p.startsWith('/src/') || p.startsWith('/@') || p.startsWith('/node_modules/')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    next();
  };
  return {
    name: 'webskill-viewer-route',
    configureServer: (server) => {
      server.middlewares.use(middleware);
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(middleware);
    }
  };
}

/**
 * 静态附件的 MIME 补丁表。vite 自带的 mime 表（mrmime）**没有 OOXML 扩展名**，
 * 命中不到就发空 Content-Type，而 `read_linked_document` 按 content-type 分派格式、
 * 从不按扩展名猜格式，空值只会被判成「不支持的类型」。
 */
const STATIC_MIME_PATCH: ReadonlyArray<readonly [string, string]> = [
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
];

/**
 * demo 页路由 + 附件 MIME。**dev 与 preview 都要挂**：
 * 只挂 dev 的话，`pnpm build && pnpm preview` 下需求表的 .docx 附件会以空 Content-Type 发出，
 * 技能读文档全线失败，而 dev 一切正常——最难查的那类 dev/prod 分叉。
 */
function demoRewrite(req: { url?: string }, res: { setHeader(k: string, v: string): void }, next: () => void): void {
  if (req.url === '/demo' || req.url === '/demo/') {
    req.url = '/demo.html';
  }
  const path = ((req.url ?? '').split('?')[0] ?? '').toLowerCase();
  const patch = STATIC_MIME_PATCH.find(([ext]) => path.endsWith(ext));
  if (patch !== undefined) {
    res.setHeader('Content-Type', patch[1]);
  }
  next();
}

/** SDK 仓库根目录；不设即走发布档 */
const SDK = process.env.WEBSKILL_SRC;
/** 'dist' 走产物档，其余走源码档 */
const LINK_DIST = process.env.WEBSKILL_LINK === 'dist';

if (SDK && !existsSync(SDK)) {
  throw new Error(`WEBSKILL_SRC does not exist: ${SDK}`);
}

/** @webskill/sdk 子路径 → SDK 仓库内部包目录名（与 SDK 仓 scripts/sdkAliases.mjs 单一事实源一致） */
const SUBPATHS: Record<string, string> = {
  browser: 'browser',
  mcp: 'mcp',
  ui: 'ui',
  'ui-react': 'ui-react',
  'ui-vue': 'ui-vue',
  governance: 'governance',
  agent: 'agent'
};

const INTERNAL = ['core', 'runtime', 'browser', 'ui', 'ui-react', 'ui-kit', 'governance', 'agent', 'mcp'];

function webskillAlias() {
  if (!SDK) return [];
  const pkg = (name: string) => resolve(SDK, 'packages', name, LINK_DIST ? 'dist/index.js' : 'src/index.ts');
  // `@webskill/sdk` 根 barrel 合并 core+runtime，testing/node 亦为其自有子 barrel，
  // 必须指向 packages/sdk 本身，而不是 runtime（runtime 缺 core 导出，如 messageOf）
  const sdkBarrel = (sub: string) => resolve(SDK, 'packages', 'sdk', LINK_DIST ? `dist/${sub}.js` : `src/${sub}.ts`);

  const alias: { find: string; replacement: string }[] = [];

  // CSS 只有产物形态，源码档也指向 dist
  alias.push({ find: '@webskill/ui-kit/ui-kit.css', replacement: resolve(SDK, 'packages/ui-kit/dist/ui-kit.css') });
  alias.push({ find: '@webskill/chatbot/chatbot.css', replacement: resolve(SDK, 'packages/chatbot/dist/chatbot.css') });
  alias.push({ find: '@webskill/console/console.css', replacement: resolve(SDK, 'packages/console/dist/console.css') });

  // 子路径必须排在根路径之前，否则 '@webskill/sdk/agent' 会被前缀匹配成 sdk + '/agent'
  alias.push({ find: '@webskill/sdk/testing', replacement: sdkBarrel('testing') });
  for (const [sub, name] of Object.entries(SUBPATHS)) {
    alias.push({ find: `@webskill/sdk/${sub}`, replacement: pkg(name) });
  }
  alias.push({ find: '@webskill/sdk', replacement: sdkBarrel('index') });

  // 同理，chatbot 的子路径也要排在包名之前。`@webskill/chatbot/vite` 不在此列：
  // vite.config.ts 由 vite 自己的 config loader 从 node_modules 解析，别名管不到它。
  alias.push({
    find: '@webskill/chatbot/config',
    replacement: resolve(SDK, 'packages/chatbot', LINK_DIST ? 'dist/config.js' : 'src/config/index.ts')
  });
  alias.push({ find: '@webskill/chatbot', replacement: pkg('chatbot') });
  alias.push({ find: '@webskill/console', replacement: pkg('console') });

  // ui-kit 的 charts 子路径（chatbot/console 源码会 import）
  alias.push({
    find: '@webskill/ui-kit/charts',
    replacement: resolve(SDK, 'packages/ui-kit', LINK_DIST ? 'dist/charts.js' : 'src/charts.ts')
  });

  // 源码档下 chatbot/console 的源码会 import 这些内部包
  if (!LINK_DIST) {
    // 更具体的子路径在前：'@webskill/runtime/testing' 若排在包名之后会被前缀匹配成 index.ts/testing
    alias.push({ find: '@webskill/runtime/testing', replacement: resolve(SDK, 'packages/runtime/src/testing.ts') });
    for (const name of INTERNAL) {
      alias.push({ find: `@webskill/${name}`, replacement: pkg(name) });
    }
  }
  return alias;
}

/**
 * 出厂设置在入库的 config.json 里，模型定义与 apiKey 单独放 models.json（gitignored）。
 * 公网产物不合并 models.json：有模型定义却没有 key，访客一开口就报错，还不如让他自己配。
 * 插件只认路径，所以合并结果得先落盘。
 */
export function webskillConfigFile(withModels: boolean): string {
  const base = path.resolve(__dirname, 'config.json');
  const models = path.resolve(__dirname, 'models.json');
  if (!withModels || !existsSync(models)) return base;
  const merged = {
    ...(JSON.parse(readFileSync(base, 'utf8')) as Record<string, unknown>),
    ...(JSON.parse(readFileSync(models, 'utf8')) as Record<string, unknown>)
  };
  const out = path.resolve(__dirname, 'node_modules/.webskill/config.merged.json');
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(merged));
  return out;
}

export default defineConfig(({ command }) => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      viewerRoute(),
      // 只有 dev 带模型与 key；`pnpm build` 的产物结构上就不含凭据，不靠 CI 上恰好没有那个文件
      webskillConfig({
        file: webskillConfigFile(command === 'serve'),
        secrets: command === 'serve' ? 'bake' : 'omit'
      }),
      {
        name: 'demo-rewrite',
        configureServer(server) {
          server.middlewares.use(demoRewrite);
        },
        // preview 也要挂：vite 打包进来的 mime 表没有 OOXML 扩展名，
        // 少了这条 dist 里的 .docx 会以空 Content-Type 发出，read_linked_document 只能判成不支持的类型
        configurePreviewServer(server) {
          server.middlewares.use(demoRewrite);
        }
      }
    ],
    base: '/',
    resolve: {
      // 数组形式保证顺序：先 '@'，再 webskill（其内部顺序见 webskillAlias）
      alias: [
        { find: '@', replacement: path.resolve(__dirname, '.') },
        // 发布产物（dist）里的 rolldown CJS runtime 顶层调用 createRequire，浏览器无此 API；
        // 同时 vfile 等 CJS 依赖需要 node:path / node:url / node:process 的少量函数。
        // 用 shim 让 T0/T2 能构建。详见各 shim 文件注释。
        { find: 'node:module', replacement: path.resolve(__dirname, 'src/demo/webskill/shims/nodeModule.ts') },
        { find: 'node:path', replacement: path.resolve(__dirname, 'src/demo/webskill/shims/nodePath.ts') },
        { find: 'node:url', replacement: path.resolve(__dirname, 'src/demo/webskill/shims/nodeUrl.ts') },
        { find: 'node:process', replacement: path.resolve(__dirname, 'src/demo/webskill/shims/nodeProcess.ts') },
        // @webskill/sdk/node（含 @webskill/node）在浏览器侧永不可用，一律 alias 到空壳，
        // 与 SDK 仓库 examples/chatbot-playground 的做法一致。
        { find: '@webskill/sdk/node', replacement: path.resolve(__dirname, 'src/demo/webskill/shims/nodeStub.ts') },
        { find: '@webskill/node/testing', replacement: path.resolve(__dirname, 'src/demo/webskill/shims/nodeStub.ts') },
        { find: '@webskill/node', replacement: path.resolve(__dirname, 'src/demo/webskill/shims/nodeStub.ts') },
        ...webskillAlias()
      ],
      // 单一 React：alias 进来的源码会从 SDK 目录解析 react，不 dedupe 就是两份
      dedupe: ['react', 'react-dom', 'zod']
    },
    optimizeDeps: {
      // 已安装的可选渲染档 peer（A2UI / OpenUI），声明后 dev server 启动时一次优化完，
      // 避免会话中途 re-optimize 打断请求（见 @webskill/chatbot README「Vite integration」）。
      include: [
        '@a2ui/web_core/v0_9',
        '@a2ui/lit/v0_9',
        '@a2ui/markdown-it',
        '@lit/context',
        'lit',
        'zod',
        'zod/v3',
        '@openuidev/react-lang'
      ],
      // 预打包会把 alias 后的源码按「第三方」冻结，改了不生效；
      // 排除全部内部包，让 dev 下 alias 在源码与预打包阶段一致生效
      exclude: SDK
        ? [
            '@webskill/sdk',
            '@webskill/chatbot',
            '@webskill/console',
            '@webskill/core',
            '@webskill/runtime',
            '@webskill/browser',
            '@webskill/ui',
            '@webskill/ui-react',
            '@webskill/ui-kit',
            '@webskill/governance',
            '@webskill/node',
            '@webskill/mcp',
            '@webskill/agent'
          ]
        : []
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          demo: path.resolve(__dirname, 'demo.html'),
          viewer: path.resolve(__dirname, 'viewer.html')
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // 允许读工程目录之外的 SDK 源码
      fs: { allow: SDK ? ['.', SDK] : ['.'] }
    }
  };
});
