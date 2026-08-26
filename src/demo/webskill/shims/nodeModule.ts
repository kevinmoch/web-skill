import * as React from 'react';

/**
 * `node:module` 的浏览器 shim。
 *
 * 背景：@webskill/* 发布产物（dist）由 rolldown 打包，其共享 runtime chunk 在模块顶层
 * 执行 `createRequire(import.meta.url)`，并用产出的 `require` 装载被打成 CJS 的依赖
 * （如 react-remove-scroll 等会 `require("react")`）。Vite 对浏览器构建会把 node 内建
 * 模块外部化成「无导出」的空壳，rollup 静态检查发现 `createRequire` 不存在 → 构建失败。
 *
 * 这里提供一个最小可用实现：只有把 CJS 依赖真正初始化时才会被调用的 `require`，
 * 目前只需映射 `react`（其余 id 会在调用时抛出带明确信息的错误，便于发现后补映射）。
 * 已知安全的例外：framer-motion 对 `@emotion/is-prop-valid` 的 require 包在 try/catch 里，
 * 抛错即走降级分支，无需映射。
 */
const registry: Record<string, unknown> = {
  react: React
};

export function createRequire(_url: string | URL): (id: string) => unknown {
  return (id: string) => {
    const mod = registry[id];
    if (!mod) {
      throw new Error(`[node-module-shim] require("${id}") is not available in the browser bundle`);
    }
    return mod;
  };
}

export default { createRequire };
