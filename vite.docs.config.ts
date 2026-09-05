import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type ConfigEnv, type Plugin, type UserConfig } from 'vite';
import { webskillConfig } from '@webskill/chatbot/vite';
import baseConfig, { webskillConfigFile } from './vite.config';

/**
 * 独立文档构建（pnpm build:docs → dist-docs/）。
 *
 * 产物含三部分：文档外壳（docs.html → index.html，无主站 header/footer、
 * 无 gtag）、demo 页（正文里的 /demo 链接指向它）和 demo 的文档投放面
 * viewer.html。复用主配置的全部 resolve alias / node shim / define
 * （demo 依赖 SDK），只改入口、输出目录、public 目录策略；主站 main 入口不在本产物里。
 *
 * viewer 另有部署前提：`/viewer.html` 的 CSP（含 sandbox 指令）与 `assets/*` 的
 * `Access-Control-Allow-Origin` 必须由托管方下发（dev/preview 由 vite.config.ts
 * 的 viewerRoute 中间件挂）。缺了这两条头 viewer 仍能投出内容，但不在 opaque origin 里跑。
 *
 * 子路径部署：DOCS_BASE=/docs/ pnpm build:docs（markdown 里的根绝对图片与
 * /demo 链接会经 withBase 加上同一前缀）。
 */

/**
 * 文档与 demo 实际引用到的 public 子目录。主配置 publicDir 会整目录拷贝
 * （含 demo 宣传图、skills 之外的主站图片等），违背「产物只含文档内容」，
 * 所以本构建 publicDir:false，只按需拷贝这几个子目录：
 * - docs-assets：文档 markdown 引用的全部截图与示意图
 * - skills：demo 的技能运行时按 /skills/builtin、/skills/user 读取
 * - demo：技能的 .docx/.xlsx 附件（read_linked_document 按 content-type 分派）
 */
const PUBLIC_SUBDIRS = ['docs-assets', 'skills', 'demo'] as const;

const OUT_DIR = 'dist-docs';

/** 产物里不带统计脚本（评审决定）：剥掉 demo.html 里的 gtag 块；docs.html 本来就没有 */
function stripGtag(): Plugin {
  return {
    name: 'webskill-docs-strip-gtag',
    apply: 'build',
    transformIndexHtml(html) {
      const out = html.replace(/\s*<!-- Google tag \(gtag\.js\) -->[\s\S]*?gtag\('config'[^)]*\);\s*<\/script>/, '');
      if (/googletagmanager|gtag\(/.test(out)) {
        // demo.html 的 gtag 块结构变了会导致剥离失败，宁可构建报错也不把统计脚本带进产物
        throw new Error(
          'docs build: failed to strip the gtag snippet from demo.html; update the pattern in vite.docs.config.ts'
        );
      }
      return out;
    }
  };
}

/** 整理产物：入口改名 + demo 目录索引 + 按需拷贝 public 子目录 */
function docsArtifact(): Plugin {
  return {
    name: 'webskill-docs-artifact',
    apply: 'build',
    closeBundle() {
      const out = resolve(__dirname, OUT_DIR);
      // 入口改名：docs.html → index.html，部署到域名根或子路径都能直接访问
      renameSync(resolve(out, 'docs.html'), resolve(out, 'index.html'));
      // demo 复制一份为 demo/index.html：/demo 在任何支持目录索引的静态托管下可用；
      // 根上的 demo.html 保留，供 preview 中间件 /demo → /demo.html 的重写命中。
      // 副本比 demo.html 深一层，相对 base 下 './assets/...' 会解析进 demo/ 里，抬一级。
      mkdirSync(resolve(out, 'demo'), { recursive: true });
      const demoHtml = readFileSync(resolve(out, 'demo.html'), 'utf8');
      writeFileSync(resolve(out, 'demo/index.html'), demoHtml.replace(/(src|href)="\.\//g, '$1="../'));
      for (const dir of PUBLIC_SUBDIRS) {
        const from = resolve(__dirname, 'public', dir);
        if (existsSync(from)) cpSync(from, resolve(out, dir), { recursive: true });
      }
    }
  };
}

export default defineConfig((configEnv: ConfigEnv) => {
  const base = (baseConfig as (env: ConfigEnv) => UserConfig)(configEnv);
  // 本产物只在企业内部分发，所以换掉主配置那个 'omit' 实例，把模型与 apiKey 烘焙进来。
  // 烘焙是混淆不是加密：拿到 dist-docs 的人都能还原出明文 key。
  const plugins = (base.plugins ?? []).filter(
    (plugin) => !(plugin && typeof plugin === 'object' && 'name' in plugin && plugin.name === 'webskill:config')
  );
  return {
    ...base,
    // 子路径部署时用 DOCS_BASE 指定（如 /docs/）；默认根部署
    base: process.env.DOCS_BASE || './',
    publicDir: false as const,
    plugins: [
      ...plugins,
      webskillConfig({ file: webskillConfigFile(true), secrets: 'bake' }),
      stripGtag(),
      docsArtifact()
    ],
    build: {
      ...base.build,
      outDir: OUT_DIR,
      rollupOptions: {
        ...base.build?.rollupOptions,
        // 整体替换主配置的 input：本产物不含主站 main 入口；viewer 是 demo 的文档投放面，必须带上
        input: {
          docs: resolve(__dirname, 'docs.html'),
          demo: resolve(__dirname, 'demo.html'),
          viewer: resolve(__dirname, 'viewer.html')
        }
      }
    }
  };
});
