import {
  EndpointRegistry,
  McpRuntimePlugin,
  TemporarySkillProvider,
  MessageChannelTransport,
  serveSkillAsMcp,
  ExperimentalWebMcpAdapter
} from '@webskill/sdk/mcp';
import type { BrowserModelContextLike, McpClientLike, MessagePortLike } from '@webskill/sdk/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { fromJSONSchema } from 'zod';
import type { ExternalSkillProvider, ExternalToolSource } from '@webskill/sdk';
import type { Screen } from '../types';
import { AGILE_PAGE_ENDPOINT, PAGE_SKILLS, PAGE_TOOLS } from './pageSkills';

/**
 * 进程内 MCP 端点（agile-page）：页面工具与页面临时技能经真实 MCP 通道供给，
 * chatbot 的 pageSkillSource 与 console 的 ConnectFacade 共用同一个 EndpointRegistry，
 * 端点/工具的启停对两侧同时生效——「治理在工作」因此是可演示的事实，不是两张皮。
 *
 * 换屏即换一批技能：用新的 MessageChannel + Server/Client 重建端点并 registry.set
 * 热替换（与 playground 的 iframe 重载同款处置）。
 */

const ENABLED_KEY = 'agile.mcp.agile-page.enabled';
const DISABLED_TOOLS_KEY = 'agile.mcp.agile-page.disabled-tools';

export function isAgilePageEndpointEnabled(): boolean {
  try {
    return globalThis.localStorage?.getItem(ENABLED_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setAgilePageEndpointEnabled(enabled: boolean): void {
  globalThis.localStorage?.setItem(ENABLED_KEY, enabled ? '1' : '0');
}

export function readAgilePageDisabledTools(): string[] {
  try {
    const raw = globalThis.localStorage?.getItem(DISABLED_TOOLS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function writeAgilePageDisabledTools(tools: string[]): void {
  globalThis.localStorage?.setItem(DISABLED_TOOLS_KEY, JSON.stringify(tools));
}

/**
 * 按需披露名单（SDK 分册 19）。与禁用名单正交：禁用优先，切回“已启用”只是移出本名单。
 * 键形 `<endpoint>/<tool>`，WebMCP 用 `webmcp/<tool>`——禁用名单那边丢了 endpoint，
 * 新名单不再踩同一个坑（不同端点的同名工具会串）。
 */
const ON_DEMAND_TOOLS_KEY = 'agile.mcp.on-demand-tools';

export function readOnDemandTools(): string[] {
  try {
    const raw = globalThis.localStorage?.getItem(ON_DEMAND_TOOLS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function isToolOnDemand(endpoint: string, tool: string): boolean {
  return readOnDemandTools().includes(`${endpoint}/${tool}`);
}

export function setToolOnDemand(endpoint: string, tool: string, onDemand: boolean): void {
  const list = new Set(readOnDemandTools());
  const key = `${endpoint}/${tool}`;
  if (onDemand) list.add(key);
  else list.delete(key);
  globalThis.localStorage?.setItem(ON_DEMAND_TOOLS_KEY, JSON.stringify([...list]));
}

export interface AgileMcpHost {
  registry: EndpointRegistry<McpClientLike>;
  plugin: McpRuntimePlugin;
  pageSkills: TemporarySkillProvider;
  /** 真 WebMCP 通道适配器（document.modelContext；Chrome 150+） */
  webmcp: ExperimentalWebMcpAdapter;
  /** chatbot adapter 的 pageSkillSource（工具源 + 技能提供者，同一对象两个 port） */
  pageSkillSource: ExternalToolSource & ExternalSkillProvider;
}

let cached: AgileMcpHost | undefined;

export function getAgileMcpHost(): AgileMcpHost {
  if (cached) return cached;
  const registry = new EndpointRegistry<McpClientLike>();
  const pageSkills = new TemporarySkillProvider({ registry, endpoint: AGILE_PAGE_ENDPOINT });
  // 真 WebMCP（浏览器原生通道）：惰性解析 modelContext，页面注入后即可用；
  // 开关态持久化，插件的 webMcp 列表与 console 的 WebMCP 页读的是同一个适配器。
  // 缺省开启（'0' 才是显式关闭）：demo 要求新用户零配置即见 WebMCP 工具。
  const webmcp = new ExperimentalWebMcpAdapter(
    () => {
      const doc = (globalThis as { document?: { modelContext?: BrowserModelContextLike } }).document;
      const nav = (globalThis as { navigator?: { modelContext?: BrowserModelContextLike } }).navigator;
      return doc?.modelContext ?? nav?.modelContext;
    },
    { enabled: globalThis.localStorage?.getItem('agile.webmcp-enabled') !== '0' }
  );
  // 启停状态实时读 localStorage：console 改完即生效，不需要重建插件。
  const plugin = new McpRuntimePlugin({
    registry,
    webMcp: [webmcp],
    endpoints: [AGILE_PAGE_ENDPOINT],
    visibility: {
      isEndpointEnabled: (endpoint) => (endpoint === AGILE_PAGE_ENDPOINT ? isAgilePageEndpointEnabled() : true),
      isEndpointToolEnabled: (_endpoint, tool) => !readAgilePageDisabledTools().includes(tool),
      isWebMcpToolEnabled: (tool) => !readAgilePageDisabledTools().includes(`webmcp:${tool}`),
      // 分册 19：undefined = 本层没意见，交给下一层（端点级 / 缺省 always）
      endpointToolDisclosure: (endpoint, tool) => (isToolOnDemand(endpoint, tool) ? 'on-demand' : undefined),
      webMcpToolDisclosure: (tool) => (isToolOnDemand('webmcp', tool) ? 'on-demand' : undefined)
    }
  });
  const pageSkillSource: ExternalToolSource & ExternalSkillProvider = {
    kind: 'mcp',
    listToolSpecs: () => plugin.listToolSpecs(),
    canHandle: (name) => plugin.canHandle(name),
    call: (name, args) => plugin.call(name, args),
    listSkills: () => pageSkills.listSkills(),
    loadSkill: (name) => pageSkills.loadSkill(name),
    readFile: (name, path) => pageSkills.readFile(name, path)
  };
  cached = { registry, plugin, pageSkills, webmcp, pageSkillSource };
  return cached;
}

let current: { server: McpServer; client: Client } | undefined;
let serving: Promise<void> | undefined;

/** 换屏重建端点内容（技能随屏切换，工具常驻）。串行执行避免并发双通道。 */
export function serveAgilePageEndpoint(screen: Screen): Promise<void> {
  // catch 在前：任何一次失败都不能让后续重挂永久静默跳过
  serving = (serving ?? Promise.resolve()).catch(() => undefined).then(() => serveAgilePageEndpointNow(screen));
  return serving;
}

async function serveAgilePageEndpointNow(screen: Screen): Promise<void> {
  const host = getAgileMcpHost();

  // 先建后换：新通道握手成功前，旧注册保持可用；失败则旧端点原样保留
  const server = new McpServer({ name: 'agile-page', version: '1.0.0' });

  // 页面工具（常驻）
  for (const tool of PAGE_TOOLS) {
    server.registerTool(
      tool.spec.name,
      {
        description: tool.spec.description ?? '',
        ...(tool.spec.inputSchema ? { inputSchema: fromJSONSchema(tool.spec.inputSchema as never) } : {})
      },
      async (args) => {
        const value = await tool.run((args ?? {}) as Record<string, unknown>);
        const content = [{ type: 'text' as const, text: JSON.stringify(value ?? null) }];
        // structuredContent 必须是对象（MCP 规范用 z.record），数组/标量不适用
        return value !== null && typeof value === 'object' && !Array.isArray(value)
          ? { content, structuredContent: value as Record<string, unknown> }
          : { content };
      }
    );
  }

  // 当前屏的临时技能（prompts → TemporarySkillProvider → catalog）
  for (const skill of PAGE_SKILLS[screen] ?? []) {
    await serveSkillAsMcp(server, { name: skill.name, description: skill.description, body: skill.body });
  }

  // 端口一旦转移就归对方所有：每次挂载新建一对
  const channel = new MessageChannel();
  await server.connect(new MessageChannelTransport(channel.port2 as unknown as MessagePortLike));
  const client = new Client({ name: 'agile-host', version: '1.0.0' });
  await client.connect(new MessageChannelTransport(channel.port1 as unknown as MessagePortLike));

  // set 而非 register：换屏热替换同名端点，register 会抛「已注册」
  host.registry.set(AGILE_PAGE_ENDPOINT, client as never);

  // 注册成功后再关旧通道
  const prev = current;
  current = { server, client };
  if (prev) {
    await prev.client.close().catch(() => undefined);
    await prev.server.close().catch(() => undefined);
  }
}
