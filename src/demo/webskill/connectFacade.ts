import type { ConnectFacade, ConnectPerceptionView } from '@webskill/console';
import { createConnectFacade, createLocalStorageRemoteEndpoints } from '@webskill/sdk/mcp';
import type { PageMcpEndpoint } from '@webskill/sdk/mcp';
import type { PagePerceptionPolicy } from '@webskill/sdk/agent';
import { toFrameScopes } from '@webskill/sdk/agent';
import { AGILE_PAGE_ENDPOINT, PAGE_SKILLS } from './pageSkills';
import type { AgileConsentStore } from './consentStore';
import type { Screen } from '../types';

/**
 * console 连接页的门面：
 * - `agile-page` 是本应用内置的进程内端点（页面工具 + 页面临时技能），不可删除；
 * - 用户可以在连接页再加远程 MCP endpoint（配置持久化 localStorage，重开自动重连）；
 * - 端点级/工具级启停经端点句柄的 visibility 存储即时生效（模型当轮就看不到）。
 *
 * 通用部分自 SDK 0.19.0 起由 `createConnectFacade` 提供（原本 360 行手写）。
 * 留在这里的只有本应用特有的三处：页面技能的**声明**视图、只读感知视图、操作授权存储。
 */
export function createAgileConnectFacade(
  host: PageMcpEndpoint,
  options: { pagePerception?: PagePerceptionPolicy; pageActionConsent?: AgileConsentStore } = {}
): ConnectFacade {
  const facade = createConnectFacade({
    host,
    builtinEndpointUrl: 'in-process://agile-page (page tools & temporary skills)',
    remoteEndpoints: createLocalStorageRemoteEndpoints('agile'),

    // 页面技能按屏生灭：console 的检查视图要看到**全部**已声明技能。
    // 若只反映当前屏的服务状态，一进技能中心屏列表就恒空——用户会以为技能丢了。
    // origin 标所属屏（哪个页面声明了它），比端点名更有区分度。
    temporarySkills: () =>
      Object.entries(PAGE_SKILLS).flatMap(([screen, skills]) =>
        (skills ?? []).map((skill) => ({
          name: skill.name,
          description: skill.description,
          source: AGILE_PAGE_ENDPOINT,
          origin: screen
        }))
      ),

    // 行尾「查看详情」模态的数据源。正文从 PAGE_SKILLS 静态定义取——
    // 与临时技能随屏生灭不冲突：这是声明视图，不是当前服务状态
    temporarySkillDetail: (name: string, origin?: string) => {
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
          pagePerception: (): ConnectPerceptionView => {
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
    ...(options.pageActionConsent ? { pageActionConsent: options.pageActionConsent } : {})
  });

  // 结构等价的实赋值：console 给 ConnectFacade 加必填方法时，这一行就是发现它的地方
  return facade;
}
