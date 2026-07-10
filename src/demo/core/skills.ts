import { WebEntityError } from './errors.js';

/**
 * 技能元数据。
 *
 * 字段来自 `SKILL.md` frontmatter，用于路由、展示、版本识别和技能治理，是技能目录的最小描述单元。
 */
export interface SkillMetadata {
  name: string;
  description: string;
  version?: string;
  tags?: string[];
  author?: string;
  license?: string;
  [key: string]: unknown;
}

/**
 * 技能文档在文件系统中的位置。
 *
 * 位置对象保留根目录和 `SKILL.md` 路径，方便错误报告、资源读取和后续归档管理定位源文件。
 */
export interface SkillLocation {
  root: string;
  skillFile: string;
}

/**
 * 解析后的技能文档。
 *
 * 同时保留 metadata、正文、原始文本和位置，既满足运行时路由，也支持管理界面查看原始技能说明。
 */
export interface SkillDocument {
  metadata: SkillMetadata;
  body: string;
  raw: string;
  location: SkillLocation;
}

/**
 * 技能目录条目。
 *
 * 目录只保存路由和管理所需的摘要信息，避免运行时在每次路由时读取完整 `SKILL.md` 或脚本内容。
 */
export interface SkillCatalogEntry {
  name: string;
  description: string;
  version?: string;
  tags?: string[];
  root: string;
  hasScripts: boolean;
  hasReferences: boolean;
  hasAssets: boolean;
  source: 'local' | 'mcp' | 'generated' | 'installed';
}

/**
 * 技能目录快照。
 *
 * 该对象表示一次发现结果，包含生成时间，便于前端、路由器和评估工具判断当前使用的是哪一版技能集合。
 */
export interface SkillCatalog {
  entries: SkillCatalogEntry[];
  generatedAt: string;
}

/**
 * 解析 `SKILL.md` 文档。
 *
 * 从 frontmatter 中提取名称、描述、版本和标签，并保留正文；缺少必填元数据时会抛出结构化错误，防止无效技能进入目录。
 */
export function parseSkillMarkdown(raw: string, location: SkillLocation = { root: '.', skillFile: 'SKILL.md' }): SkillDocument {
  if (!raw.startsWith('---')) {
    throw new WebEntityError('SKILL_INVALID_METADATA', 'SKILL.md must start with YAML front matter');
  }

  const end = raw.indexOf('\n---', 3);
  if (end === -1) {
    throw new WebEntityError('SKILL_INVALID_METADATA', 'SKILL.md front matter is not closed');
  }

  const yaml = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, '');
  const metadata = parseSimpleYaml(yaml);

  if (typeof metadata.name !== 'string' || metadata.name.trim() === '') {
    throw new WebEntityError('SKILL_INVALID_METADATA', 'SKILL.md metadata must include non-empty name');
  }
  if (typeof metadata.description !== 'string' || metadata.description.trim() === '') {
    throw new WebEntityError('SKILL_INVALID_METADATA', 'SKILL.md metadata must include non-empty description');
  }
  return { metadata: metadata as unknown as SkillMetadata, body, raw, location };
}

function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const line of yaml.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const index = trimmed.indexOf(':');
    if (index === -1) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();

    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      result[key] = rawValue
        .slice(1, -1)
        .split(',')
        .map((item) => stripQuotes(item.trim()))
        .filter(Boolean);
    } else {
      result[key] = stripQuotes(rawValue);
    }
  }

  return result;
}

function stripQuotes(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}
