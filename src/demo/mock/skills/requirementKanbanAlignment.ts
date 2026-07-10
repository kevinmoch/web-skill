import { SHARED_CHART_DATA_JSON } from '../sharedChartData';

export const REQUIREMENT_KANBAN_ALIGNMENT_SKILL = {
    name: 'requirement-kanban-alignment',
    source: 'local',
    root: '/skills/requirement-kanban-alignment',
    'SKILL.md': `---\nname: requirement-kanban-alignment\ndescription: 产品需求优先级分布梳理。先生成一个咨询表单展示项目列表，用户选择后根据项目查询数据，分析并生成多图表维度的报告。\nversion: 1.1.0\ntags: [kanban, requirements, agile]\n---\n# 分析项目需求优先级分布\n\n1. 先使用 OpenUI 引擎生成一个包含所有项目的选择表单给用户\n2. 当用户选择项目后，调用 \`scripts/alignKanbanBacklog.js\` 获取需求Backbone序列和状态\n3. 结合获取的分析统计数据展示并渲染分为三大模块的内容：\n   - A. 当前项目产品需求规划概览指标（包含总规划需求数）\n   - B. 高优先级(High)、中优先级(Medium)、低优先级(Low)分类的数量统计\n   - C. 使用圆环图展示需求优先级的占比分布比例，并生成三个明细表格依据高、中、低优先级分栏详细罗列每个需求事务的当前执行状态。\n`,
    'scripts/alignKanbanBacklog.js': `/**
 * 运行函数
 * @param {Object} input - 输入对象
 * @param {string} input.projectId - 项目ID
 */
export async function run(input) {
  const fs = new OpfsProvider()
  const data = JSON.parse(await fs.readText('assets/chart-data.json'));
  const projectId = input?.projectId || 'PROJ-CORE';
  const projectObj = data.projects.find(p => p.id === projectId) || { name: '未知项目', name_en: 'Unknown Project' };
  
  const projectRequirements = data.requirements ? data.requirements.filter(r => r.projectId === projectId) : [];
  
  const highList = projectRequirements.filter(r => r.priority === 'High');
  const mediumList = projectRequirements.filter(r => r.priority === 'Medium');
  const lowList = projectRequirements.filter(r => r.priority === 'Low');
  
  const total = projectRequirements.length;
  const highCount = highList.length;
  const mediumCount = mediumList.length;
  const lowCount = lowList.length;
  
  const highPercent = total > 0 ? Math.round((highCount / total) * 100) : 0;
  const mediumPercent = total > 0 ? Math.round((mediumCount / total) * 100) : 0;
  const lowPercent = total > 0 ? Math.round((lowCount / total) * 100) : 0;
  
  const highRemain = 100 - highPercent;
  const mediumRemain = 100 - mediumPercent;
  const lowRemain = 100 - lowPercent;
  
  const mediumDashOffset = 100 - highPercent;
  const lowDashOffset = 100 - highPercent - mediumPercent;
  
  const highRows = highList.map(r => {
    const statusText = r.status === 'Done' ? '已完成 🟢' : r.status === 'In Progress' ? '开发中 🏃‍♂️' : '待开发 📌';
    return "<tr><td>" + r.id + "</td><td>" + r.title + "</td><td>" + statusText + "</td></tr>";
  }).join('\\n') || '<tr><td colspan="3" class="text-center">暂无顶级高优先级需求 (High)</td></tr>';
  
  const mediumRows = mediumList.map(r => {
    const statusText = r.status === 'Done' ? '已完成 🟢' : r.status === 'In Progress' ? '开发中 🏃‍♂️' : '待开发 📌';
    return "<tr><td>" + r.id + "</td><td>" + r.title + "</td><td>" + statusText + "</td></tr>";
  }).join('\\n') || '<tr><td colspan="3" class="text-center">暂无中级日常迭代需求 (Medium)</td></tr>';
  
  const lowRows = lowList.map(r => {
    const statusText = r.status === 'Done' ? '已完成 🟢' : r.status === 'In Progress' ? '开发中 🏃‍♂️' : '待开发 📌';
    return "<tr><td>" + r.id + "</td><td>" + r.title + "</td><td>" + statusText + "</td></tr>";
  }).join('\\n') || '<tr><td colspan="3" class="text-center">暂无低级排期体验优化 (Low)</td></tr>';
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        projectName: projectObj.name,
        projectNameEn: projectObj.name_en,
        totalRequirements: total,
        highCount,
        mediumCount,
        lowCount,
        highPercent,
        mediumPercent,
        lowPercent,
        highRemainPercent: highRemain,
        mediumRemainPercent: mediumRemain,
        lowRemainPercent: lowRemain,
        mediumDashOffset,
        lowDashOffset,
        highRows,
        mediumRows,
        lowRows
      })
    }]
  };
}`,
    'references/kanban-outline.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="report-container" id="report-root">
  <h2 class="report-title">{projectName} 产品需求优先级分析报告</h2>
  
  <div class="metrics-section">
    <div class="metric-card requirements-card">
      <div class="metric-header">A. 产品需求规划概览</div>
      <div class="metric-value">{totalRequirements} 个规划需求</div>
      <div class="metric-sub">数据源同步: 智云敏捷项目需求库 (Backbone Repository)</div>
    </div>
    
    <div class="metric-card priority-card">
      <div class="metric-header">B. 优先级分布统计</div>
      <div class="metric-row">
        <span class="label">🔴 高阻断较高排期 (High):</span>
        <span class="value">{highCount} 个</span>
      </div>
      <div class="metric-row">
        <span class="label">🟡 中度日常渐进 (Medium):</span>
        <span class="value">{mediumCount} 个</span>
      </div>
      <div class="metric-row">
        <span class="label">🟢 低级排期体验 (Low):</span>
        <span class="value">{lowCount} 个</span>
      </div>
    </div>
  </div>

  <div class="chart-section">
    <h3>C. 需求优先级占比分布 (Priority Distribution)</h3>
    <div class="chart-flex">
      <div class="donut-chart-box">
        <svg viewBox="0 0 42 42" class="donut-svg">
          <circle class="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="transparent"></circle>
          <circle class="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e2e8f0" stroke-width="3"></circle>
          
          <circle class="donut-segment segment-high" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#ef4444" stroke-width="3" stroke-dasharray="{highPercent} {highRemainPercent}" stroke-dashoffset="100"></circle>
          <circle class="donut-segment segment-medium" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" stroke-width="3" stroke-dasharray="{mediumPercent} {mediumRemainPercent}" stroke-dashoffset="{mediumDashOffset}"></circle>
          <circle class="donut-segment segment-low" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#10b981" stroke-width="3" stroke-dasharray="{lowPercent} {lowRemainPercent}" stroke-dashoffset="{lowDashOffset}"></circle>
        </svg>
        <div class="donut-center">
          <span class="total-title">高/中/低</span>
          <span class="total-val">{totalRequirements} 个需求</span>
        </div>
      </div>
      
      <div class="chart-legend">
        <div class="legend-item"><span class="bullet high-bullet"></span> 高优先级: {highCount} ({highPercent}%)</div>
        <div class="legend-item"><span class="bullet medium-bullet"></span> 中优先级: {mediumCount} ({mediumPercent}%)</div>
        <div class="legend-item"><span class="bullet low-bullet"></span> 低优先级: {lowCount} ({lowPercent}%)</div>
      </div>
    </div>
  </div>

  <div class="tables-section">
    <div class="table-wrapper high-table-wrapper">
      <h4>🔴 高优先级需求列表 (High Priority)</h4>
      <table>
        <thead>
          <tr>
            <th style="width: 100px;">需求 ID</th>
            <th>需求事务名称</th>
            <th style="width: 150px;">当前状态</th>
          </tr>
        </thead>
        <tbody>
          {highRows}
        </tbody>
      </table>
    </div>

    <div class="table-wrapper medium-table-wrapper">
      <h4>🟡 中优先级需求列表 (Medium Priority)</h4>
      <table>
        <thead>
          <tr>
            <th style="width: 100px;">需求 ID</th>
            <th>需求事务名称</th>
            <th style="width: 150px;">当前状态</th>
          </tr>
        </thead>
        <tbody>
          {mediumRows}
        </tbody>
      </table>
    </div>

    <div class="table-wrapper low-table-wrapper">
      <h4>🟢 低优先级需求列表 (Low Priority)</h4>
      <table>
        <thead>
          <tr>
            <th style="width: 100px;">需求 ID</th>
            <th>需求事务名称</th>
            <th style="width: 150px;">当前状态</th>
          </tr>
        </thead>
        <tbody>
          {lowRows}
        </tbody>
      </table>
    </div>
  </div>
</div>
</body>
</html>`,
    'references/styles.css': `.report-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 28px; max-width: 900px; margin: 0 auto; color: #1e293b; background: #ffffff; }\n.report-title { font-size: 24px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 24px; }\n.metrics-section { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }\n.metric-card { padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; }\n.requirements-card { border-left: 5px solid #6366f1; }\n.priority-card { border-left: 5px solid #f59e0b; }\n.metric-header { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px; }\n.metric-value { font-size: 18px; font-weight: 800; color: #1e293b; line-height: 1.3; }\n.metric-sub { font-size: 12px; color: #64748b; margin-top: 6px; font-style: italic; }\n.metric-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }\n.metric-row .label { color: #64748b; }\n.metric-row .value { font-weight: 750; color: #0f172a; }\n.chart-section { padding: 24px; background: #eef2ff; border: 1px solid #e0e7ff; border-radius: 12px; margin-bottom: 28px; }\n.chart-section h3 { font-size: 16px; font-weight: 750; color: #4338ca; margin: 0 0 16px 0; }\n.chart-flex { display: flex; align-items: center; justify-content: space-around; gap: 24px; }\n.donut-chart-box { position: relative; width: 140px; height: 140px; }\n.donut-svg { transform: rotate(-90deg); }\n.donut-ring { stroke: #e0e7ff; }\n.donut-segment { fill: none; transition: stroke-dasharray 0.3s ease; }\n.donut-center { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }\n.total-title { font-size: 9px; color: #4338ca; text-transform: uppercase; font-weight: 700; }\n.total-val { font-size: 12px; font-weight: 800; color: #3730a3; }\n.chart-legend { display: flex; flex-direction: column; gap: 12px; }\n.legend-item { display: flex; align-items: center; font-size: 13px; font-weight: 600; color: #475569; }\n.bullet { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; }\n.high-bullet { background: #ef4444; }\n.medium-bullet { background: #f59e0b; }\n.low-bullet { background: #10b981; }\n.tables-section { display: flex; flex-direction: column; gap: 24px; }\n.table-wrapper h4 { font-size: 14px; font-weight: 750; margin: 0 0 10px 0; color: #1e293b; display: flex; align-items: center; gap: 6px; }\ntable { width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }\ntr:hover { background-color: #f8fafc; }\nth, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }\nth { background: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }\n.text-center { text-align: center; color: #94a3b8; font-style: italic; }`,
    'assets/chart-data.json': SHARED_CHART_DATA_JSON
};
