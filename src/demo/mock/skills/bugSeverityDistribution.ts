import { SHARED_CHART_DATA_JSON } from '../sharedChartData';

export const BUG_SEVERITY_DISTRIBUTION_SKILL = {
    name: 'bug-severity-distribution',
    source: 'local',
    root: '/skills/bug-severity-distribution',
    'SKILL.md': `---\nname: bug-severity-distribution\ndescription: 分析项目缺陷严重程度分布。先生成一个咨询表单展示项目列表，用户选择后根据项目查询数据，分析并生成多图表维度的报告。\nversion: 1.1.0\ntags: [bug, quality, charts]\n---\n# 分析项目缺陷严重程度分布\n\n1. 先使用 OpenUI 引擎生成一个包含所有项目的选择表单给用户\n2. 当用户选择项目后，调用 \`scripts/fetchBugSeverity.ts\` 获取当前项目的未解决缺陷数据\n3. 结合获取的分析统计数据展示并渲染分为三大模块的内容：\n   - A. 当前项目下挂起缺陷概览指标（包含总未解决缺陷数）\n   - B. 致命中断、严重故障、一般轻微等不同严重程度分类的数量统计\n   - C. 使用圆环图展示缺陷严重等级的占比分布比例，并生成三个明细表格分别详细罗列出致命中断、重要严重、一般轻微里的缺陷故障名称。\n`,
    'scripts/fetchBugSeverity.ts': `export interface Input {
  projectId: string;
}

export async function run(input: Input) {
  const fs = new OpfsProvider()
  const data = JSON.parse(await fs.readText('assets/chart-data.json'));
  const projectId: string = input?.projectId || 'PROJ-CORE';
  const projectObj = data.projects.find((p: any) => p.id === projectId) || { name: '未知项目', name_en: 'Unknown Project' };
  
  const projectBugs = data.bugs.filter((b: any) => b.projectId === projectId);
  const openBugs = projectBugs.filter((b: any) => b.status === 'Open');
  
  const criticalList = openBugs.filter((b: any) => b.severity === 'Critical');
  const majorList = openBugs.filter((b: any) => b.severity === 'Major');
  const minorList = openBugs.filter((b: any) => b.severity === 'Minor');
  
  const total = openBugs.length;
  const criticalCount = criticalList.length;
  const majorCount = majorList.length;
  const minorCount = minorList.length;
  
  const criticalPercent = total > 0 ? Math.round((criticalCount / total) * 100) : 0;
  const majorPercent = total > 0 ? Math.round((majorCount / total) * 100) : 0;
  const minorPercent = total > 0 ? Math.round((minorCount / total) * 100) : 0;
  
  const criticalRemain = 100 - criticalPercent;
  const majorRemain = 100 - majorPercent;
  const minorRemain = 100 - minorPercent;
  
  const majorDashOffset = 100 - criticalPercent;
  const minorDashOffset = 100 - criticalPercent - majorPercent;
  
  const criticalRows = criticalList.map((b: any) => "<tr><td>" + b.id + "</td><td>" + b.title + "</td><td>" + b.module + "</td></tr>").join('\\n') || '<tr><td colspan="3" class="text-center">暂无致命中断缺陷 (Critical)</td></tr>';
  const majorRows = majorList.map((b: any) => "<tr><td>" + b.id + "</td><td>" + b.title + "</td><td>" + b.module + "</td></tr>").join('\\n') || '<tr><td colspan="3" class="text-center">暂无重要严重缺陷 (Major)</td></tr>';
  const minorRows = minorList.map((b: any) => "<tr><td>" + b.id + "</td><td>" + b.title + "</td><td>" + b.module + "</td></tr>").join('\\n') || '<tr><td colspan="3" class="text-center">暂无轻微故障缺陷 (Minor)</td></tr>';
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        projectName: projectObj.name,
        projectNameEn: projectObj.name_en,
        totalBugs: total,
        criticalCount,
        majorCount,
        minorCount,
        criticalPercent,
        majorPercent,
        minorPercent,
        criticalRemainPercent: criticalRemain,
        majorRemainPercent: majorRemain,
        minorRemainPercent: minorRemain,
        majorDashOffset,
        minorDashOffset,
        criticalRows,
        majorRows,
        minorRows
      })
    }]
  };
}`,
    'references/bug-report.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="report-container" id="report-root">
  <h2 class="report-title">{projectName} 缺陷严重程度分析报告</h2>
  
  <div class="metrics-section">
    <div class="metric-card unresolved-card">
      <div class="metric-header">A. 挂起缺陷概览 (Open Issues)</div>
      <div class="metric-value">{totalBugs} 个未解决缺陷</div>
      <div class="metric-sub">数据源同步: 智云协同核心缺陷库 (Real-time Sync)</div>
    </div>
    
    <div class="metric-card severity-card">
      <div class="metric-header">B. 严重故障分布</div>
      <div class="metric-row">
        <span class="label">🔴 致命中断 (Critical):</span>
        <span class="value">{criticalCount} 个</span>
      </div>
      <div class="metric-row">
        <span class="label">🟡 严重故障 (Major):</span>
        <span class="value">{majorCount} 个</span>
      </div>
      <div class="metric-row">
        <span class="label">🟢 一般轻微 (Minor):</span>
        <span class="value">{minorCount} 个</span>
      </div>
    </div>
  </div>

  <div class="chart-section">
    <h3>C. 缺陷严重等级占比分布 (Bug Density Chart)</h3>
    <div class="chart-flex">
      <div class="donut-chart-box">
        <svg viewBox="0 0 42 42" class="donut-svg">
          <circle class="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="transparent"></circle>
          <circle class="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e2e8f0" stroke-width="3"></circle>
          
          <circle class="donut-segment segment-critical" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#ef4444" stroke-width="3" stroke-dasharray="{criticalPercent} {criticalRemainPercent}" stroke-dashoffset="100"></circle>
          <circle class="donut-segment segment-major" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" stroke-width="3" stroke-dasharray="{majorPercent} {majorRemainPercent}" stroke-dashoffset="{majorDashOffset}"></circle>
          <circle class="donut-segment segment-minor" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#10b981" stroke-width="3" stroke-dasharray="{minorPercent} {minorRemainPercent}" stroke-dashoffset="{minorDashOffset}"></circle>
        </svg>
        <div class="donut-center">
          <span class="total-title">致命/重要/轻微</span>
          <span class="total-val">{totalBugs} 个缺陷</span>
        </div>
      </div>
      
      <div class="chart-legend">
        <div class="legend-item"><span class="bullet critical-bullet"></span> 致命: {criticalCount} ({criticalPercent}%)</div>
        <div class="legend-item"><span class="bullet major-bullet"></span> 重要: {majorCount} ({majorPercent}%)</div>
        <div class="legend-item"><span class="bullet minor-bullet"></span> 轻微: {minorCount} ({minorPercent}%)</div>
      </div>
    </div>
  </div>

  <div class="tables-section">
    <div class="table-wrapper critical-table-wrapper">
      <h4>🔴 致命中断缺陷列表 (Critical Bugs)</h4>
      <table>
        <thead>
          <tr>
            <th style="width: 100px;">缺陷 ID</th>
            <th>缺陷故障名称</th>
            <th style="width: 150px;">所属业务模块</th>
          </tr>
        </thead>
        <tbody>
          {criticalRows}
        </tbody>
      </table>
    </div>

    <div class="table-wrapper major-table-wrapper">
      <h4>🟡 严重故障缺陷列表 (Major Bugs)</h4>
      <table>
        <thead>
          <tr>
            <th style="width: 100px;">缺陷 ID</th>
            <th>缺陷故障名称</th>
            <th style="width: 150px;">所属业务模块</th>
          </tr>
        </thead>
        <tbody>
          {majorRows}
        </tbody>
      </table>
    </div>

    <div class="table-wrapper minor-table-wrapper">
      <h4>🟢 一般轻微缺陷列表 (Minor Bugs)</h4>
      <table>
        <thead>
          <tr>
            <th style="width: 100px;">缺陷 ID</th>
            <th>缺陷故障名称</th>
            <th style="width: 150px;">所属业务模块</th>
          </tr>
        </thead>
        <tbody>
          {minorRows}
        </tbody>
      </table>
    </div>
  </div>
</div>
</body>
</html>`,
    'references/styles.css': `.report-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 28px; max-width: 900px; margin: 0 auto; color: #1e293b; background: #ffffff; }\n.report-title { font-size: 24px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 24px; }\n.metrics-section { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }\n.metric-card { padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; }\n.unresolved-card { border-left: 5px solid #ef4444; }\n.severity-card { border-left: 5px solid #f59e0b; }\n.metric-header { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px; }\n.metric-value { font-size: 18px; font-weight: 800; color: #1e293b; line-height: 1.3; }\n.metric-sub { font-size: 12px; color: #64748b; margin-top: 6px; font-style: italic; }\n.metric-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }\n.metric-row .label { color: #64748b; }\n.metric-row .value { font-weight: 750; color: #0f172a; }\n.chart-section { padding: 24px; background: #fff5f5; border: 1px solid #fee2e2; border-radius: 12px; margin-bottom: 28px; }\n.chart-section h3 { font-size: 16px; font-weight: 750; color: #991b1b; margin: 0 0 16px 0; }\n.chart-flex { display: flex; align-items: center; justify-content: space-around; gap: 24px; }\n.donut-chart-box { position: relative; width: 140px; height: 140px; }\n.donut-svg { transform: rotate(-90deg); }\n.donut-ring { stroke: #fee2e2; }\n.donut-segment { fill: none; transition: stroke-dasharray 0.3s ease; }\n.donut-center { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }\n.total-title { font-size: 9px; color: #b91c1c; text-transform: uppercase; font-weight: 700; }\n.total-val { font-size: 12px; font-weight: 800; color: #991b1b; }\n.chart-legend { display: flex; flex-direction: column; gap: 12px; }\n.legend-item { display: flex; align-items: center; font-size: 13px; font-weight: 600; color: #475569; }\n.bullet { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; }\n.critical-bullet { background: #ef4444; }\n.major-bullet { background: #f59e0b; }\n.minor-bullet { background: #10b981; }\n.tables-section { display: flex; flex-direction: column; gap: 24px; }\n.table-wrapper h4 { font-size: 14px; font-weight: 750; margin: 0 0 10px 0; color: #1e293b; display: flex; align-items: center; gap: 6px; }\ntable { width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }\ntr:hover { background-color: #f8fafc; }\nth, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }\nth { background: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }\n.text-center { text-align: center; color: #94a3b8; font-style: italic; }`,
    'assets/chart-data.json': SHARED_CHART_DATA_JSON
};
