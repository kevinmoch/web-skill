/**
 * WebEntity 核心错误码集合。
 *
 * 这些码用于跨运行时、Node、Browser、MCP 和治理包传递稳定的失败原因，避免调用方依赖易变的错误文案。
 */
export type WebEntityErrorCode =
  | 'FS_NOT_FOUND'
  | 'FS_PERMISSION_DENIED'
  | 'FS_PATH_OUTSIDE_ROOT'
  | 'SKILL_INVALID_METADATA'
  | 'SKILL_DUPLICATE_NAME'
  | 'SKILL_NOT_FOUND'
  | 'SKILL_UNSUPPORTED_SCRIPT'
  | 'VALIDATION_FAILED'
  | 'ROUTE_NO_MATCH'
  | 'TOOL_NOT_FOUND'
  | 'TOOL_EXECUTION_FAILED'
  | 'TOOL_UNSUPPORTED'
  | 'MCP_ENDPOINT_UNAVAILABLE'
  | 'MCP_TOOL_NOT_FOUND'
  | 'UI_REQUIRED'
  | 'RUN_INTERRUPTED'
  | 'RUN_CANCELLED'
  | 'RUN_TIMEOUT'
  | 'INSTALL_FAILED'
  | 'UNSUPPORTED_RUNTIME';

/**
 * WebEntity 统一错误类型。
 *
 * 业务层抛出该错误时会携带稳定 `code`、可选 `details` 和底层 `cause`，便于 HTTP/API 适配器把内部失败映射成可诊断的结构化响应。
 */
export class WebEntityError extends Error {
  readonly code: WebEntityErrorCode;
  readonly details?: unknown;
  override readonly cause?: unknown;

  /**
   * 创建 WebEntityError 实例，并注入运行所需依赖或配置，使同一实现可以在测试、浏览器或 Node 环境中复用。
   */
  constructor(code: WebEntityErrorCode, message: string, options?: { details?: unknown; cause?: unknown }) {
    super(message);
    this.name = 'WebEntityError';
    this.code = code;
    this.details = options?.details;
    this.cause = options?.cause;
  }
}
