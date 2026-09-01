// 把 mermaid-cli 输出的 width="100%" 替换为显式 width/height（取根 viewBox 宽高）。
// 文档页正文列会把 width=100% 的 SVG 拉伸到整列 688px，导致各图有效字号随 viewBox 宽浮动；
// 显式宽高让 img 按自然尺寸显示，有效字号恒等于 init 里的 fontSize。
// 用法：node normalize-size.mjs <svg...>（重复执行幂等）
import { readFileSync, writeFileSync } from 'node:fs';

for (const file of process.argv.slice(2)) {
  let svg = readFileSync(file, 'utf8');
  const m = /<svg[^>]*viewBox="(-?[\d.]+)[ ,]+(-?[\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)"/.exec(svg);
  if (!m) throw new Error(`root viewBox not found: ${file}`);
  const [, , , w, h] = m;
  if (/width="100%"/.test(svg)) {
    svg = svg.replace('width="100%"', `width="${w}" height="${h}"`);
  } else {
    svg = svg.replace(/<svg([^>]*?)width="[\d.]+" height="[\d.]+"/, `<svg$1width="${w}" height="${h}"`);
  }
  writeFileSync(file, svg);
  console.log(`${file}: ${w} x ${h}`);
}
