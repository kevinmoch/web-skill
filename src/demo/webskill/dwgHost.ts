/**
 * DWG 宿主实现（0.22.0 分册 19，FR-19.4 / FR-19.5 / FR-19.6）。
 *
 * 两件事：把字节交给 Worker 解析、把几何投到查看器。
 */

import { WebSkillError } from '@webskill/sdk';
import type { DocumentSurfaceHost } from '@webskill/sdk';
import type { DwgDocumentContent, DwgOmission, DwgProjectedDrawing, DwgProjection } from '@webskill/sdk/agent';
import type { DwgWorkerRequest, DwgWorkerResponse } from './dwgWorker';

/** 解析超时。`2D.dwg`（17 MB）实测 3.6 s；留足余量，但不能没有上界 */
const PARSE_TIMEOUT_MS = 120_000;

export interface AgileDwgHostDeps {
  /** 投放面。与 pptx / 图表共用同一个受信外壳，不另开窗口 */
  surface: () => DocumentSurfaceHost;
  /** 界面语言，**每次投放时现读**：装配期快照会把语言钉死在开面板那一刻 */
  locale: () => 'zh' | 'en';
}

interface Pending {
  resolve(document: DwgDocumentContent): void;
  reject(error: unknown): void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Worker 是**懒起**的：没人开 DWG 就不该为它付出一份 acad-ts 的解析与内存开销。
 * 起来之后常驻，连续对比两份图纸复用同一个。
 */
function createParser(): (bytes: Uint8Array) => Promise<DwgDocumentContent> {
  let worker: Worker | undefined;
  const pending = new Map<number, Pending>();
  let nextId = 1;

  const settle = (id: number, run: (p: Pending) => void): void => {
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    clearTimeout(entry.timer);
    run(entry);
  };

  const ensure = (): Worker => {
    if (worker) return worker;
    const created = new Worker(new URL('./dwgWorker.ts', import.meta.url), { type: 'module' });
    created.addEventListener('message', (event: MessageEvent<DwgWorkerResponse>) => {
      const data = event.data;
      settle(data.id, (p) => {
        if (data.ok) p.resolve(data.document as DwgDocumentContent);
        else p.reject(new WebSkillError('TOOL_EXECUTION_FAILED', `Could not read the DWG file: ${data.message}`));
      });
    });
    // Worker 整个挂掉时，所有在途请求都不会再有回音——必须逐个回绝，
    // 否则调用方就是无限期挂起（而模型那一侧看到的是「工具没返回」）
    created.addEventListener('error', (event) => {
      worker = undefined;
      const reason = new WebSkillError('TOOL_EXECUTION_FAILED', `The DWG reader crashed: ${event.message}`);
      for (const id of [...pending.keys()]) settle(id, (p) => p.reject(reason));
    });
    worker = created;
    return created;
  };

  return (bytes) =>
    new Promise<DwgDocumentContent>((resolve, reject) => {
      const id = nextId++;
      const timer = setTimeout(() => {
        settle(id, (p) => p.reject(new WebSkillError('TOOL_EXECUTION_FAILED', 'Reading the DWG file timed out.')));
      }, PARSE_TIMEOUT_MS);
      pending.set(id, { resolve, reject, timer });
      const request: DwgWorkerRequest = { id, bytes };
      // 字节转移而不是拷贝：17 MB 拷一份是白拷
      ensure().postMessage(request, [bytes.buffer as ArrayBuffer]);
    });
}

const SHELL_CSS = `
:root { color-scheme: dark; }
#dwg-root { position: fixed; inset: 0; background: #12161c; }
#dwg-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
/* 面板轨（FR-35.4）：两块面板加图层栈竖着摆，装不下就整轨滚。
   下边界留在量测工具栏之上，面板再多也压不住工具栏 */
#dwg-rail {
  position: fixed; top: 56px; left: 12px; width: 232px; bottom: 64px;
  display: flex; flex-direction: column; gap: 8px; overflow: auto; z-index: 6;
}
.dwg-panel {
  flex: none; display: flex; flex-direction: column; gap: 8px; padding: 10px 12px;
  max-height: 100%;
  background: #1f2329e6; color: #e5e7eb; border-radius: 10px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.32); font: 12px/1.5 system-ui, sans-serif;
}
.dwg-panel h2 { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .02em; }
.dwg-panel .dwg-sub { color: #9ca3af; }
/* 文件名（FR-34.8）：单行截断。图纸名动辄「A-某某项目-一层平面图-第三版.dwg」，
   换行会把三个页签挤下去；完整值在 title 里 */
.dwg-file {
  margin: 0; flex: none; font-weight: 600; color: #f3f4f6;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.dwg-dense:empty { display: none; }
.dwg-dense { color: #fbbf24; margin: 0; }
.dwg-tabs { display: flex; gap: 2px; border-bottom: 1px solid #374151; flex: none; }
.dwg-tabs button {
  flex: 1; border: 0; border-bottom: 2px solid transparent; background: transparent;
  color: #9ca3af; border-radius: 0; padding: 4px 2px; cursor: pointer; font: inherit;
}
.dwg-tabs button:hover { color: #e5e7eb; }
.dwg-tabs button[aria-selected='true'] { color: #e5e7eb; border-bottom-color: #3b82f6; }
/* 分页要能自己滚：图层多到 213 个时，撑破的是这一页而不是整块面板 */
.dwg-page { display: flex; flex-direction: column; gap: 8px; overflow: auto; min-height: 0; }
.dwg-page[hidden] { display: none; }
.dwg-layers { overflow: auto; display: flex; flex-direction: column; gap: 1px; margin: 0; padding: 0; list-style: none; }
.dwg-layers li { display: flex; align-items: center; gap: 6px; }
.dwg-layers label { display: flex; align-items: center; gap: 6px; cursor: pointer; min-width: 0; }
.dwg-layers .dwg-swatch { width: 9px; height: 9px; border-radius: 2px; flex: none; }
.dwg-layers .dwg-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dwg-views { display: flex; flex-direction: column; gap: 2px; }
/* 分组标题要和上一组拉开，不然「模型空间」贴在最后一条 Layout 上，两组看着像一组（FR-26.4）*/
.dwg-views .dwg-group { color: #9ca3af; font-size: 12px; font-weight: 600; margin-top: 14px; }
.dwg-views .dwg-group:first-child { margin-top: 2px; }
.dwg-views button {
  display: block; width: 100%; text-align: left; border: 1px solid transparent;
  background: transparent; color: #e5e7eb; border-radius: 5px; padding: 2px 6px;
  cursor: pointer; font: inherit; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.dwg-views button:hover { background: #374151; }
.dwg-views button[aria-current='true'] { background: #2563eb; border-color: #3b82f6; }
.dwg-views button .dwg-count { color: #9ca3af; }
.dwg-views button[aria-current='true'] .dwg-count { color: #dbeafe; }
#dwg-empty { color: #9ca3af; position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  font: 13px/1.6 system-ui, sans-serif; pointer-events: none; z-index: 5; }
#dwg-empty:empty { display: none; }
.dwg-panel .dwg-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
/* 复选框行（FR-36.5）：结构要和图层表里的 label 一样，
   否则这一个框跟下面那一列框差一两像素，看着就是没对齐 */
.dwg-panel .dwg-check { display: flex; align-items: center; gap: 6px; cursor: pointer; min-width: 0; }
.dwg-panel button {
  border: 1px solid #4b5563; background: #374151; color: #f9fafb;
  border-radius: 6px; padding: 3px 8px; cursor: pointer; font: inherit;
}
.dwg-panel button[aria-pressed='true'] { background: #2563eb; border-color: #3b82f6; }
.dwg-panel .dwg-note { color: #fbbf24; margin: 0; }
/* 图层栈（FR-35.5）：只在打开两份时出现，行序就是叠放顺序，第一行在最上面 */
#dwg-stack-list { display: flex; flex-direction: column; gap: 2px; margin: 0; padding: 0; list-style: none; }
#dwg-stack-list li { display: flex; align-items: center; gap: 6px; min-width: 0; }
#dwg-stack-list .dwg-stack-tint { width: 9px; height: 9px; border-radius: 2px; flex: none; }
#dwg-stack-list .dwg-stack-pick {
  flex: 1; min-width: 0; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
/* 选中层（FR-35.6）：画布上那条提示与这里的高亮是同一件事的两处显示 */
#dwg-active {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 6px; padding: 4px 12px 4px 8px;
  background: #1f2329e6; color: #e5e7eb; border-radius: 999px; border-left: 4px solid currentColor;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.32); font: 12px/1.5 system-ui, sans-serif;
  z-index: 7; pointer-events: none; max-width: 60vw;
}
#dwg-active[hidden] { display: none; }
#dwg-active .dwg-active-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #f3f4f6; }
/* 量测工具栏（FR-31.5）：钉在画面下方居中，不随画布平移缩放动，与左侧面板同一种定位 */
#dwg-tools {
  position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 4px; padding: 6px 8px;
  background: #1f2329e6; color: #e5e7eb; border-radius: 10px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.32); font: 12px/1.5 system-ui, sans-serif; z-index: 7;
}
#dwg-tools .dwg-tools-gap { width: 1px; align-self: stretch; background: #374151; margin: 0 4px; }
#dwg-tools button {
  border: 1px solid #4b5563; background: #374151; color: #f9fafb;
  border-radius: 6px; padding: 4px 10px; cursor: pointer; font: inherit;
}
#dwg-tools button:hover { background: #4b5563; }
#dwg-tools button[aria-pressed='true'] { background: #2563eb; border-color: #3b82f6; }
#dwg-tools button[disabled] { opacity: .45; cursor: not-allowed; }
#dwg-tools-panel {
  position: fixed; bottom: 64px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 8px 12px; max-width: 420px;
  background: #1f2329e6; color: #e5e7eb; border-radius: 10px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.32); font: 12px/1.5 system-ui, sans-serif; z-index: 7;
}
#dwg-tools-panel[hidden] { display: none; }
#dwg-tools-panel p { margin: 0; }
#dwg-tools-panel .dwg-sub { color: #9ca3af; flex-basis: 100%; }
#dwg-tools-panel .dwg-row { display: flex; align-items: center; gap: 6px; }
#dwg-tools-panel [hidden] { display: none; }
#dwg-tools-panel #dwg-tools-hint:empty { display: none; }
#dwg-tools-panel input {
  width: 56px; border: 1px solid #4b5563; background: #374151; color: #f9fafb;
  border-radius: 6px; padding: 2px 6px; font: inherit;
}
#dwg-tools-panel button {
  border: 1px solid #4b5563; background: #374151; color: #f9fafb;
  border-radius: 6px; padding: 3px 8px; cursor: pointer; font: inherit;
}
/* 汇总（FR-39.4）。用面板正文色，比覆盖率那行的灰重一档——
   明细表撤下后（FR-39.17）这行是面板上唯一的全局结论 */
#dwg-diff-summary { margin: 0; color: #e5e7eb; }
#dwg-diff-notice { margin: 0; }
/* 明细表撤下后（FR-39.17）这块里再没有会自己滚的子元素，压它就是把文字挤出
   卡片背景。轨自己能滚，汇总靠 scrollIntoView 送进视野（FR-39.1） */
#dwg-diff { flex: none; }
#dwg-diff label { display: flex; align-items: center; gap: 6px; }
#dwg-diff input[type='number'] {
  width: 64px; border: 1px solid #4b5563; background: #374151; color: #f9fafb;
  border-radius: 6px; padding: 2px 6px; font: inherit;
}
#dwg-diff[hidden] { display: none; }
#dwg-diff button[disabled] { opacity: .45; cursor: not-allowed; }
/* 比对选框（FR-37.6）：框体本身不吃指针，框内照旧能平移缩放画布；
   能抓的只有顶上那条标签栏（拖着挪整个框）与八个控制点（改大小） */
#dwg-diff-box {
  position: absolute; z-index: 4; pointer-events: none;
  border: 1px solid #f59e0b; background: rgb(245 158 11 / 0.06);
}
#dwg-diff-box[hidden] { display: none; }
#dwg-diff-box .dwg-diff-bar {
  position: absolute; left: -1px; top: -23px; pointer-events: auto; cursor: move;
  display: flex; align-items: center; gap: 6px; padding: 2px 8px; white-space: nowrap;
  background: #1f2329e6; color: #e5e7eb; border-radius: 6px;
  font: 12px/1.5 system-ui, sans-serif; box-shadow: 0 4px 16px rgb(0 0 0 / 0.32);
}
#dwg-diff-box .dwg-diff-grip {
  position: absolute; width: 11px; height: 11px; margin: -6px 0 0 -6px; pointer-events: auto;
  background: #f59e0b; border: 1px solid #12161c; border-radius: 2px;
}
/* 差异说明的悬停提示（FR-39.18）。不吃指针，否则提示一出来就把
   它解释的那个圆圈遮掉，鼠标再往前挪一点反而丢了命中 */
#dwg-diff-tip {
  position: absolute; z-index: 5; pointer-events: none; max-width: 280px;
  padding: 4px 8px; border-radius: 6px; white-space: normal;
  background: #1f2329f2; color: #e5e7eb;
  font: 12px/1.5 system-ui, sans-serif; box-shadow: 0 4px 16px rgb(0 0 0 / 0.32);
}
#dwg-diff-tip[hidden] { display: none; }
`;

/** 窗口标题的长度上限。标题栏本来就显示不下，过长的名字只会把有用的前缀挤出可视区 */
const TITLE_LIMIT = 120;

/**
 * 投放窗口的标题（FR-31.4）。取不到名字就返回空串 —— viewer 那边据此**不动**标题，
 * 而不是显示一个空标题。
 *
 * 两份图纸时两个名字并排，用户在窗口列表里才分得出这是哪一次对照。
 */
export function viewerWindowTitle(input: DwgProjection): string {
  const joined = input.drawings
    .map((d) => d.fileName ?? '')
    // eslint-disable-next-line no-control-regex -- 控制字符正是要剔除的目标
    .map((name) => name.replace(/[\u0000-\u001f\u007f]/g, '').trim())
    .filter((name) => name !== '')
    .join(' · ');
  return joined.length > TITLE_LIMIT ? joined.slice(0, TITLE_LIMIT) : joined;
}

/**
 * 面板内元素的 id。
 *
 * 第一块面板不加后缀：单份图纸时 DOM 与分册 34 同名（AC-35.4）。
 * 后缀只在真有第二块面板时出现——`aria-controls` 指向的 id 必须全文档唯一。
 */
function pid(base: string, index: number): string {
  return index === 0 ? base : `${base}-${index}`;
}

/** 一块图纸面板：文件名 + 视图 / 图层 / 属性（FR-35.1） */
function panelHtml(drawing: DwgProjectedDrawing, index: number, zh: boolean): string {
  // 面板顶部那一行只认真名（FR-34.8）。`title` 是形如 `doc-a1b2c3` 的取件号，
  // 摆在最显眼的位置是噪声；取不到名字就说「图纸」，不拿 id 冒充
  const fileLabel = drawing.fileName ?? (zh ? '图纸' : 'Drawing');
  const modeNote = zh
    ? '二维视图：滚轮缩放，拖动平移。左侧可切换图纸空间与模型空间。'
    : '2D view: scroll to zoom, drag to pan. Switch between sheets and model space on the left.';

  const omissions = drawing.document.omissions ?? [];
  const count = (match: (o: DwgOmission) => boolean): number =>
    omissions.filter(match).reduce((total, o) => total + o.count, 0);
  const notes = count((o) => o.reason === 'acis-not-tessellated');
  // 呈现不了的东西要在界面上说出来，不只是在给模型的摘要里说（AC-19.9）；
  // 「画了但画得不准」与「压根没画」是两回事，分开说（AC-23.6）
  const degraded = count((o) => o.severity === 'degraded');
  const dropped = count((o) => o.severity !== 'degraded' && o.reason !== 'acis-not-tessellated');
  const lines = [
    notes > 0
      ? zh
        ? `另有 ${notes} 个 ACIS 三维实体无法显示：本读取器不做 ACIS 曲面镶嵌。`
        : `${notes} ACIS solid(s) are not shown: this reader does not tessellate ACIS surfaces.`
      : '',
    dropped > 0 ? (zh ? `另有 ${dropped} 个图元未绘制。` : `${dropped} entity/entities are not drawn.`) : '',
    degraded > 0
      ? zh
        ? `有 ${degraded} 处内容是近似绘制（填充图案按线段展开、线型缺定义时退回实线），形状可信，细节不可信。`
        : `${degraded} item(s) are drawn approximately (hatch patterns exploded to line segments, missing line types fall back to solid). Shapes are reliable, fine detail is not.`
      : ''
  ].filter((line) => line !== '');
  const acisNote = lines.map((line) => `<p class="dwg-note">${line}</p>`).join('');

  return `<aside class="dwg-panel" id="${pid('dwg-panel', index)}" data-layer="${index}">
  <p class="dwg-file" id="${pid('dwg-file', index)}" title="${escapeHtml(fileLabel)}">${escapeHtml(fileLabel)}</p>
  <div class="dwg-tabs" id="${pid('dwg-tabs', index)}" role="tablist" aria-label="${escapeHtml(zh ? '面板' : 'Panel')}">
    <button id="${pid('dwg-tab-views', index)}" type="button" role="tab" aria-controls="${pid(
      'dwg-page-views',
      index
    )}" aria-selected="true">${escapeHtml(zh ? '视图' : 'Views')}</button>
    <button id="${pid('dwg-tab-layers', index)}" type="button" role="tab" aria-controls="${pid(
      'dwg-page-layers',
      index
    )}" aria-selected="false">${escapeHtml(zh ? '图层' : 'Layers')}</button>
    <button id="${pid('dwg-tab-props', index)}" type="button" role="tab" aria-controls="${pid(
      'dwg-page-props',
      index
    )}" aria-selected="false">${escapeHtml(zh ? '属性' : 'Properties')}</button>
  </div>
  <div class="dwg-page" id="${pid('dwg-page-views', index)}" role="tabpanel" aria-labelledby="${pid(
    'dwg-tab-views',
    index
  )}">
    <nav class="dwg-views" id="${pid('dwg-views', index)}" aria-label="${escapeHtml(zh ? '视图' : 'Views')}"></nav>
  </div>
  <div class="dwg-page" id="${pid('dwg-page-layers', index)}" role="tabpanel" aria-labelledby="${pid(
    'dwg-tab-layers',
    index
  )}" hidden>
    <div class="dwg-row">
      <label class="dwg-check"><input id="${pid('dwg-layers-all', index)}" type="checkbox" checked>${escapeHtml(
        zh ? '全选图层' : 'All layers'
      )}</label>
    </div>
    <ul class="dwg-layers" id="${pid('dwg-layers', index)}"></ul>
  </div>
  <div class="dwg-page" id="${pid('dwg-page-props', index)}" role="tabpanel" aria-labelledby="${pid(
    'dwg-tab-props',
    index
  )}" hidden>
    <p class="dwg-sub">${escapeHtml(modeNote)}</p>
    ${acisNote}
    <p class="dwg-dense dwg-note" id="${pid('dwg-dense', index)}"></p>
    <div class="dwg-row">
      <button id="${pid('dwg-fit', index)}" type="button">${escapeHtml(zh ? '适应窗口' : 'Fit')}</button>
    </div>
  </div>
</aside>`;
}

/**
 * 图层栈（FR-35.5 / FR-35.7 / FR-35.8）。
 *
 * 只在打开两份时出现：一份图纸没有「谁压谁」可言，放一块只有一行的面板是噪声。
 */
function stackHtml(zh: boolean): string {
  return `<aside class="dwg-panel" id="dwg-stack">
  <h2>${escapeHtml(zh ? '叠放' : 'Stack')}</h2>
  <ul id="dwg-stack-list" aria-label="${escapeHtml(zh ? '叠放顺序' : 'Stacking order')}"></ul>
  <div class="dwg-row" id="dwg-stack-actions">
    <button id="dwg-stack-align" type="button" aria-pressed="false">${escapeHtml(zh ? '对位' : 'Align')}</button>
    <button id="dwg-stack-swap" type="button">${escapeHtml(zh ? '换序' : 'Reorder')}</button>
    <button id="dwg-stack-tint" type="button" aria-pressed="true">${escapeHtml(zh ? '染色' : 'Tint')}</button>
    <button id="dwg-stack-align-reset" type="button">${escapeHtml(zh ? '归零' : 'Reset')}</button>
  </div>
  <p class="dwg-sub" id="dwg-stack-hint"></p>
</aside>`;
}

/**
 * 按构件比差异（分册 37，FR-37.19 / FR-37.22；分册 39 补汇总与导出）。
 *
 * 与图层栈同理，只在打开两份时出现：一份图纸没有可比的对象（AC-37.5）。
 * 真正决定按钮能不能点的是查看器：解析器没产出构件清单时，整块面板不显示。
 *
 * 汇总与覆盖率都摆在表格**上方**（FR-39.6）：它们回答的是「一共差几处、这个数字多可信」，
 * 摆在一张会滚动的长表后面等于没人看得见。
 */
function diffHtml(zh: boolean): string {
  return `<aside class="dwg-panel" id="dwg-diff" hidden>
  <h2 id="dwg-diff-title">${escapeHtml(zh ? '比差异' : 'Differences')}</h2>
  <div class="dwg-row">
    <button id="dwg-diff-run" type="button">${escapeHtml(zh ? '对比差异' : 'Compare')}</button>
    <button id="dwg-diff-export" type="button" hidden>${escapeHtml(zh ? '导出差异' : 'Export')}</button>
  </div>
  <label id="dwg-diff-tolerance-row" hidden>
    <span id="dwg-diff-tolerance-label">${escapeHtml(zh ? '容差（毫米）' : 'Tolerance (mm)')}</span>
    <input id="dwg-diff-tolerance" type="number" min="1" step="10" value="200" />
  </label>
  <p class="dwg-sub" id="dwg-diff-scope"></p>
  <p class="dwg-note" id="dwg-diff-refusal"></p>
  <p id="dwg-diff-summary"></p>
  <p class="dwg-sub" id="dwg-diff-coverage"></p>
  <p class="dwg-sub" id="dwg-diff-notice"></p>
</aside>`;
}

/** 投放面的骨架。几何**不**进 HTML，走 `document.data` 的结构化克隆 */
function shellHtml(input: DwgProjection, zh: boolean): string {
  const windowTitle = viewerWindowTitle(input);
  const toolbar = `
<div id="dwg-tools" role="toolbar" aria-label="${escapeHtml(zh ? '量测' : 'Measure')}">
  ${(
    [
      ['distance', zh ? '距离' : 'Distance'],
      ['area', zh ? '区域' : 'Area'],
      ['point', zh ? '坐标' : 'Coordinate'],
      ['angle', zh ? '角度' : 'Angle'],
      ['erase', zh ? '删除' : 'Delete']
    ] as const
  )
    .map(([id, label]) => `<button type="button" data-tool="${id}" aria-pressed="false">${escapeHtml(label)}</button>`)
    .join('')}
  <span class="dwg-tools-gap"></span>
  <button type="button" id="dwg-tools-settings" aria-expanded="false">${escapeHtml(zh ? '设置' : 'Settings')}</button>
  <button type="button" id="dwg-tools-clear">${escapeHtml(zh ? '清除' : 'Clear')}</button>
</div>
<div id="dwg-tools-panel" hidden>
  <label for="dwg-tools-decimals">${escapeHtml(zh ? '小数位' : 'Decimals')}</label>
  <input id="dwg-tools-decimals" type="number" min="0" max="4" step="1" value="2" />
  <p id="dwg-tools-units" class="dwg-sub"></p>
  <div class="dwg-row"><button type="button" id="dwg-tools-calibrate">${escapeHtml(
    zh ? '校准' : 'Calibrate'
  )}</button><input id="dwg-tools-length" type="number" min="0" step="any" hidden aria-label="${escapeHtml(
    zh ? '基准段的实际长度' : 'Real length of the reference segment'
  )}" /></div>
  <p id="dwg-tools-hint" class="dwg-sub"></p>
</div>`;
  const stacked = input.drawings.length > 1;
  // 选中层的提示钉在画面上方：图层栈里的高亮只在面板内可见，
  // 而「我现在在操作哪一层」得在看图时一眼可见（FR-35.6）
  const activeBadge = stacked ? `<p id="dwg-active" hidden><span class="dwg-active-name"></span></p>` : '';
  return `<div id="dwg-root" data-viewer-mode="dwg" data-viewer-chrome="hidden"${
    windowTitle === '' ? '' : ` data-viewer-title="${escapeHtml(windowTitle)}"`
  }>
  <canvas id="dwg-canvas"></canvas>
  <p id="dwg-empty"></p>
</div>${toolbar}${activeBadge}
<div id="dwg-rail">
${input.drawings.map((drawing, index) => panelHtml(drawing, index, zh)).join('\n')}${
    stacked ? `\n${stackHtml(zh)}\n${diffHtml(zh)}` : ''
  }
</div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function createAgileDwgHost(deps: AgileDwgHostDeps): {
  read(bytes: Uint8Array, name: string): Promise<DwgDocumentContent>;
  project(input: DwgProjection): Promise<void>;
} {
  const parse = createParser();
  return {
    read: async (bytes, name) => {
      try {
        return await parse(bytes);
      } catch (error) {
        if (error instanceof WebSkillError) throw error;
        const message = error instanceof Error ? error.message : String(error);
        throw new WebSkillError('TOOL_EXECUTION_FAILED', `Could not read "${name}" as a DWG file: ${message}`);
      }
    },
    project: async (input) => {
      const zh = deps.locale() === 'zh';
      await deps.surface().open({
        skillName: 'view_dwg',
        dataSource: input.drawings.map((d) => d.title).join(', '),
        document: {
          html: shellHtml(input, zh),
          css: SHELL_CSS,
          // 几何只走 `data`：塞进 HTML 要先序列化成字符串再解析回来，
          // 2D.dwg 那种量级（8043 个实体、2.4 万个点）光序列化就是几十兆字符
          data: { kind: 'dwg', lang: zh ? 'zh' : 'en', drawings: input.drawings.map((d) => d.document) }
        }
      });
    }
  };
}
