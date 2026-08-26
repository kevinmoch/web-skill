import type {
  ConnectEndpointConfig,
  ConnectEndpointView,
  ConnectFacade,
  ConnectPerceptionView,
  ConnectTemporarySkill,
  ConnectTemporarySkillDetail,
  ConnectTestResult,
  ConnectToolView
} from '@webskill/console';
import { messageOf } from '@webskill/sdk';
import { connectRemoteEndpoint } from '@webskill/sdk/mcp';
import type { PagePerceptionPolicy } from '@webskill/sdk/agent';
import { toFrameScopes } from '@webskill/sdk/agent';
import {
  isAgilePageEndpointEnabled,
  isToolOnDemand,
  readAgilePageDisabledTools,
  setAgilePageEndpointEnabled,
  setToolOnDemand,
  writeAgilePageDisabledTools
} from './mcpHost';
import { AGILE_PAGE_ENDPOINT, PAGE_SKILLS } from './pageSkills';
import type { AgileMcpHost } from './mcpHost';
import type { AgileConsentStore } from './consentStore';
import type { Screen } from '../types';

/**
 * console 连接页的门面（ConnectFacade）：
 * - `agile-page` 是本应用内置的进程内端点（页面工具 + 页面临时技能），不可删除；
 * - 用户可以在连接页再加远程 MCP endpoint（配置持久化 localStorage，重开自动重连）；
 * - 端点级/工具级启停经 mcpHost 的 visibility 回调即时生效（模型当轮就看不到）。
 */

const REMOTE_ENDPOINTS_KEY = 'agile.mcp.remote-endpoints';

interface Connection {
  close(): Promise<void>;
  status: 'connected' | 'failed' | 'connecting';
  error?: string;
  toolCount?: number;
}

function loadRemoteConfigs(): ConnectEndpointConfig[] {
  try {
    const raw = localStorage.getItem(REMOTE_ENDPOINTS_KEY);
    return raw ? (JSON.parse(raw) as ConnectEndpointConfig[]) : [];
  } catch {
    return [];
  }
}

export function createAgileConnectFacade(
  host: AgileMcpHost,
  options: { pagePerception?: PagePerceptionPolicy; pageActionConsent?: AgileConsentStore } = {}
): ConnectFacade {
  let remoteConfigs = loadRemoteConfigs();
  const connections = new Map<string, Connection>();
  const listeners = new Set<() => void>();

  const persist = () => localStorage.setItem(REMOTE_ENDPOINTS_KEY, JSON.stringify(remoteConfigs));
  const notify = () => {
    for (const fn of listeners) fn();
  };

  async function connectRemote(config: ConnectEndpointConfig): Promise<void> {
    const prev = connections.get(config.name);
    if (prev) await prev.close().catch(() => undefined);
    connections.set(config.name, { close: () => Promise.resolve(), status: 'connecting' });
    notify();
    try {
      const handle = await connectRemoteEndpoint(host.registry, {
        endpoint: config.name,
        url: config.url,
        ...(config.transport ? { transport: config.transport } : {}),
        ...(config.headers ? { headers: config.headers } : {}),
        allowHttp: config.allowHttp ?? false,
        allowPrivateHosts: config.allowPrivateHosts ?? false
      });
      connections.set(config.name, { close: handle.close, status: 'connected' });
      try {
        const { tools } = await host.registry.get(config.name).listTools();
        connections.set(config.name, { close: handle.close, status: 'connected', toolCount: tools.length });
      } catch {
        // listTools 失败仅缺 toolCount 展示
      }
    } catch (e) {
      connections.set(config.name, { close: () => Promise.resolve(), status: 'failed', error: messageOf(e) });
    }
    notify();
  }

  // 启动时自动重连持久化的远程 endpoints
  for (const config of remoteConfigs) void connectRemote(config);

  const endpointView = (config: ConnectEndpointConfig): ConnectEndpointView => {
    const conn = connections.get(config.name);
    return {
      config,
      status: conn?.status ?? 'unavailable',
      ...(conn?.error !== undefined ? { error: conn.error } : {}),
      ...(conn?.toolCount !== undefined ? { toolCount: conn.toolCount } : {})
    };
  };

  return {
    /**
     * 工具级披露层级（SDK 0.13.0 分册 19）：`on-demand` 的工具不进 LLM 工具表，
     * 但**仍然可执行**——把它当禁用实现会把「只省 token」悄悄变成「限制访问」。
     */
    async setToolDisclosure(endpoint: string, tool: string, disclosure: 'always' | 'on-demand'): Promise<void> {
      setToolOnDemand(endpoint, tool, disclosure === 'on-demand');
      notify();
    },
    async listEndpoints() {
      const builtin: ConnectEndpointView = {
        config: {
          name: AGILE_PAGE_ENDPOINT,
          url: 'in-process://agile-page (page tools & temporary skills)',
          enabled: isAgilePageEndpointEnabled(),
          ...(readAgilePageDisabledTools().length > 0 ? { disabledTools: readAgilePageDisabledTools() } : {})
        },
        status: 'connected',
        toolCount: (
          await host.registry
            .get(AGILE_PAGE_ENDPOINT)
            .listTools()
            .catch(() => ({ tools: [] }))
        ).tools.length
      };
      return [builtin, ...remoteConfigs.map(endpointView)];
    },

    async addEndpoint(config) {
      if (config.name === AGILE_PAGE_ENDPOINT || remoteConfigs.some((c) => c.name === config.name)) {
        throw new Error(`Endpoint "${config.name}" is already configured`);
      }
      remoteConfigs = [...remoteConfigs, config];
      persist();
      await connectRemote(config);
      const conn = connections.get(config.name);
      if (conn?.status === 'failed') throw new Error(conn.error ?? `Failed to connect endpoint "${config.name}"`);
    },

    async removeEndpoint(name) {
      if (name === AGILE_PAGE_ENDPOINT) throw new Error('The built-in agile-page endpoint cannot be removed');
      const conn = connections.get(name);
      if (conn) {
        await conn.close().catch(() => undefined);
        connections.delete(name);
      }
      host.registry.unregister(name);
      remoteConfigs = remoteConfigs.filter((c) => c.name !== name);
      persist();
      notify();
    },

    async reconnect(name) {
      if (name === AGILE_PAGE_ENDPOINT) return;
      const config = remoteConfigs.find((c) => c.name === name);
      if (!config) throw new Error(`Endpoint "${name}" is not configured`);
      await connectRemote(config);
    },

    async setEndpointEnabled(name, enabled) {
      if (name === AGILE_PAGE_ENDPOINT) {
        setAgilePageEndpointEnabled(enabled);
        notify();
        return;
      }
      remoteConfigs = remoteConfigs.map((c) => (c.name === name ? { ...c, enabled } : c));
      persist();
      notify();
    },

    async setToolEnabled(endpoint, tool, enabled) {
      if (endpoint === AGILE_PAGE_ENDPOINT) {
        const disabled = new Set(readAgilePageDisabledTools());
        if (enabled) disabled.delete(tool);
        else disabled.add(tool);
        writeAgilePageDisabledTools([...disabled]);
        notify();
        return;
      }
      remoteConfigs = remoteConfigs.map((c) => {
        if (c.name !== endpoint) return c;
        const disabled = new Set(c.disabledTools ?? []);
        if (enabled) disabled.delete(tool);
        else disabled.add(tool);
        const next = { ...c };
        if (disabled.size > 0) next.disabledTools = [...disabled];
        else delete next.disabledTools;
        return next;
      });
      persist();
      notify();
    },

    async listTools() {
      const out: ConnectToolView[] = [];
      const builtinDisabled = new Set(readAgilePageDisabledTools());
      try {
        const { tools } = await host.registry.get(AGILE_PAGE_ENDPOINT).listTools();
        for (const tool of tools) {
          out.push({
            endpoint: AGILE_PAGE_ENDPOINT,
            name: tool.name,
            enabled: !builtinDisabled.has(tool.name),
            disclosure: isToolOnDemand(AGILE_PAGE_ENDPOINT, tool.name) ? 'on-demand' : 'always',
            ...(tool.description !== undefined ? { description: tool.description } : {}),
            ...(tool.inputSchema !== undefined
              ? { schemaSummary: JSON.stringify(tool.inputSchema).slice(0, 120), inputSchema: tool.inputSchema }
              : {})
          });
        }
      } catch {
        // 端点暂时不可用（换屏重建中）按空清单处理
      }
      for (const config of remoteConfigs) {
        if (connections.get(config.name)?.status !== 'connected') continue;
        try {
          const { tools } = await host.registry.get(config.name).listTools();
          for (const tool of tools) {
            out.push({
              endpoint: config.name,
              name: tool.name,
              enabled: config.disabledTools?.includes(tool.name) !== true,
              disclosure: isToolOnDemand(config.name, tool.name) ? 'on-demand' : 'always',
              ...(tool.description !== undefined ? { description: tool.description } : {}),
              ...(tool.inputSchema !== undefined
                ? { schemaSummary: JSON.stringify(tool.inputSchema).slice(0, 120), inputSchema: tool.inputSchema }
                : {})
            });
          }
        } catch {
          // 单个 endpoint 失败不阻断其他来源
        }
      }
      return out;
    },

    async testEndpoint(name): Promise<ConnectTestResult> {
      const start = Date.now();
      try {
        await host.registry.get(name).listTools();
        return { ok: true, latencyMs: Date.now() - start, checkedAt: new Date().toISOString() };
      } catch (e) {
        return {
          ok: false,
          latencyMs: Date.now() - start,
          error: messageOf(e),
          detail: e instanceof Error ? (e.stack ?? e.message) : String(e),
          checkedAt: new Date().toISOString()
        };
      }
    },

    async temporarySkills(): Promise<ConnectTemporarySkill[]> {
      // 页面技能按屏生灭：console 的检查视图要看到**全部**已声明技能。
      // 若只反映当前屏的服务状态，一切进技能中心屏列表就恒空——用户会以为技能丢了。
      // origin 标所属屏（哪个页面声明了它），比端点名更有区分度。
      return Object.entries(PAGE_SKILLS).flatMap(([screen, skills]) =>
        (skills ?? []).map((skill) => ({
          name: skill.name,
          description: skill.description,
          source: AGILE_PAGE_ENDPOINT,
          origin: screen
        }))
      );
    },

    // 分册 22：行尾「查看详情」模态的数据源。正文从 PAGE_SKILLS 静态定义取——
    // 与临时技能随屏生灭不冲突：这是声明视图，不是当前服务状态
    async temporarySkillDetail(name: string, origin?: string): Promise<ConnectTemporarySkillDetail> {
      const scoped = origin ? (PAGE_SKILLS[origin as Screen] ?? []) : [];
      const def =
        scoped.find((s) => s.name === name) ??
        Object.values(PAGE_SKILLS)
          .flat()
          .find((s) => s.name === name);
      if (!def) throw new Error(`Unknown page skill: ${name}${origin ? ` (origin ${origin})` : ''}`);
      return {
        name: def.name,
        description: def.description,
        source: AGILE_PAGE_ENDPOINT,
        ...(origin ? { origin } : {}),
        body: def.body
      };
    },

    ...(options.pagePerception
      ? {
          pagePerception: async (): Promise<ConnectPerceptionView> => {
            const policy = options.pagePerception!;
            const frames = toFrameScopes(policy.scope);
            const exclude = frames.flatMap((frame) => [...(frame.exclude ?? [])]);
            return {
              enabled: policy.enabled,
              include: frames.flatMap((frame) => [...frame.include]),
              ...(exclude.length > 0 ? { exclude } : {}),
              records: policy.records.map((r) => ({
                at: r.at,
                include: r.include,
                exclude: r.exclude,
                nodeCount: r.nodeCount,
                ...(r.images ? { imageCount: r.images.src + r.images.canvas } : {}),
                ...(r.imagesOmitted !== undefined ? { imagesOmitted: r.imagesOmitted } : {}),
                ...(r.imageFailures !== undefined ? { imageFailures: r.imageFailures } : {})
              }))
            };
          }
        }
      : {}),

    // 未接授权存储时这三个方法整体缺席：console 那一块随之整段不渲染（「不知道 ≠ 没有」）
    ...(options.pageActionConsent
      ? {
          pageActionConsents: () => options.pageActionConsent!.list(),
          forgetPageActionConsent: (id: string) => options.pageActionConsent!.forget(id),
          forgetPageActionConsentScope: (scope: string) => options.pageActionConsent!.forgetScope(scope)
        }
      : {}),

    webmcp: {
      // 真 WebMCP 通道（document.modelContext）：状态如实反映；
      // 本应用经 webMcpTools.ts 声明了 agile_get_current_view（浏览器原生通道的演示）
      isAvailable: () => host.webmcp.isAvailable(),
      isEnabled: () => host.webmcp.isEnabled(),
      setEnabled: (on: boolean) => {
        host.webmcp.setEnabled(on);
        globalThis.localStorage?.setItem('agile.webmcp-enabled', on ? '1' : '0');
      },
      listTools: async (): Promise<ConnectToolView[]> => {
        if (!host.webmcp.isEnabled()) return [];
        const disabled = new Set(readAgilePageDisabledTools());
        const tools = (await host.webmcp.listTools()) ?? [];
        return tools.map((tool) => ({
          endpoint: 'webmcp',
          name: tool.name,
          enabled: !disabled.has(`webmcp:${tool.name}`),
          disclosure: isToolOnDemand('webmcp', tool.name) ? 'on-demand' : 'always',
          ...(tool.description !== undefined ? { description: tool.description } : {}),
          ...(tool.origin !== undefined ? { origin: tool.origin } : {}),
          ...(tool.annotations !== undefined ? { annotations: tool.annotations } : {})
        }));
      },
      setToolEnabled: (tool: string, enabled: boolean) => {
        const disabled = new Set(readAgilePageDisabledTools());
        const key = `webmcp:${tool}`;
        if (enabled) disabled.delete(key);
        else disabled.add(key);
        writeAgilePageDisabledTools([...disabled]);
      },
      /** 披露层级与启停正交：切回 always 只是移出按需名单，不碰禁用名单 */
      setToolDisclosure: (tool: string, disclosure: 'always' | 'on-demand') => {
        setToolOnDemand('webmcp', tool, disclosure === 'on-demand');
      }
    }
  };
}
