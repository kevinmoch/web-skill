#!/usr/bin/env node
// 用法: node compress.mjs <源图> <目标.png>
// 截图规范：PNG、≤300KB、保持 2x 清晰度（palette 压缩）
import sharp from 'sharp';
import { statSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [src, dest] = process.argv.slice(2);
if (!src || !dest) { console.error('usage: compress.mjs <src> <dest>'); process.exit(1); }
mkdirSync(dirname(dest), { recursive: true });

const img = sharp(src);
const meta = await img.metadata();
// 超过 2880 宽（1440@2x）的裁/缩到 2880
let pipeline = img;
if (meta.width > 2880) pipeline = pipeline.resize({ width: 2880 });
await pipeline.png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(dest);
const size = statSync(dest).size;
console.log(`${dest} ${(size / 1024).toFixed(0)}KB ${size > 300 * 1024 ? 'OVER-300KB!' : 'ok'}`);
