/**
 * `@webskill/sdk/node`（含 `@webskill/node`）的浏览器空壳。
 *
 * 该子路径在浏览器侧永不可用：其实现顶层 import node:fs 等 Node API。
 * 浏览器侧只有 `import type` 引用它（编译期擦除），运行期不会真正调用这里的任何符号。
 * 与 SDK 仓库 examples/chatbot-playground/nodeStub.ts 同一做法。
 */
export {};
