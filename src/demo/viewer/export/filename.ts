/**
 * 文件名清洗（0.21.0 分册 15 FR-15.8 / 设计分册 16 §7）。
 *
 * 标题来自技能产出的 HTML，也就是来自模型——它可以是任何东西。
 * 顺序是有意的：先去控制字符再去分隔符，否则 `a\u0000/b` 这类会漏。
 */

const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const MAX_CODE_POINTS = 80;

export type ExportExtension = 'pptx' | 'docx' | 'xlsx';

const FALLBACK: Readonly<Record<ExportExtension, string>> = {
  pptx: 'webskill-slides',
  docx: 'webskill-document',
  xlsx: 'webskill-sheet'
};

export function sanitizeExportFilename(title: string, extension: ExportExtension): string {
  return `${sanitizeExportName(title, extension)}.${extension}`;
}

/** 同一份清洗，但不带扩展名：打印另存 PDF 时浏览器自己补 `.pdf` */
export function sanitizeExportName(title: string, extension: ExportExtension): string {
  let name = title;
  // eslint-disable-next-line no-control-regex -- 就是要按码位剔除控制字符
  name = name.replace(/[\u0000-\u001f\u007f]/g, '');
  name = name.replace(/[\\/:*?"<>|]/g, '');
  name = name.replace(/\s+/g, ' ').trim();
  // `..` 是路径穿越的原料；首尾的点在 Windows 上还会被静默吞掉
  name = name
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    .trim();
  if (RESERVED.test(name)) name = `_${name}`;
  const points = Array.from(name);
  if (points.length > MAX_CODE_POINTS) name = points.slice(0, MAX_CODE_POINTS).join('').trim();
  if (name === '') name = FALLBACK[extension];
  return name;
}
