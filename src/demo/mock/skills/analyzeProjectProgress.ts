import { SHARED_CHART_DATA_JSON } from '../sharedChartData';

export const ANALYZE_PROJECT_PROGRESS_SKILL = {
    name: 'analyze-project-iteration-progress',
    source: 'local',
    root: '/skills/analyze-project-iteration-progress',
    'SKILL.md': `---\nname: analyze-project-iteration-progress\ndescription: 分析项目迭代进展。先生成一个咨询表单展示项目列表，用户选择后根据项目查询数据，分析并生成多图表维度的报告。\nversion: 1.0.0\ntags: [agile, report, chart]\n---\n# 分析项目迭代进展\n\n1. 先使用 OpenUI 引擎生成一个包含所有项目的选择表单给用户\n2. 当用户选择项目后，调用 \`scripts/fetchIterationData.ts\` 获取迭代数据\n3. 结合获取的图表 JSON 数据展示分析并渲染分为三大模块的内容：\n   - A. 当前活跃执行中的迭代细节（名称及规划目标）\n   - B. 迭代当前的已收尾燃尽 SP 指标及迭代容器总速率 SP\n   - C. 使用饼图展示待办、进行中、已关闭三种迭代/看板状态的比例分布，并生成三个表格分别罗列待办、进行中、已关闭里的迭代任务/需求名称。\n`,
    'scripts/fetchIterationData.ts': `export const inputSchema = {
  type: 'object',
  properties: {
    projectId: {
      type: 'string'
    },
    required: ['projectId']
  }
};

export async function run(input: any) {
  const fs = new OpfsProvider()
  const data = JSON.parse(await fs.readText('assets/chart-data.json'));
  const projectId: string = input?.projectId || 'PROJ-CORE';
  
  const projectSprints = data.sprints.filter((s: any) => s.projectId === projectId);
  const projectRequirements = data.requirements ? data.requirements.filter((r: any) => r.projectId === projectId) : [];
  
  const activeSprints = projectSprints.filter((s: any) => s.status === 'Active');
  const activeSprint = activeSprints[0] || projectSprints[0] || { name: '无活跃迭代', velocity: 35, progress: 0, goal: '', goal_en: '' };
  
  // Calculate dynamic SPs based on actual requirement cards status
  const doingList = projectRequirements.filter((r: any) => r.status === 'In Progress');
  const todoList = projectRequirements.filter((r: any) => r.status === 'Todo');
  const doneList = projectRequirements.filter((r: any) => r.status === 'Done');
  
  const burnedSP = doneList.reduce((sum: number, r: any) => sum + (r.storyPoints || 0), 0);
  const velocitySP = activeSprint.velocity || 35;
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        activeSprint: { name: activeSprint.name, goal: activeSprint.goal },
        burnDown: { burnedSP: burnedSP, velocitySP: velocitySP },
        statusCounts: { todo: todoList.length, inProgress: doingList.length, closed: doneList.length },
        sprints: { 
          todo: todoList.map((r: any) => r.title), 
          inProgress: doingList.map((r: any) => r.title), 
          closed: doneList.map((r: any) => r.title) 
        }
      })
    }]
  };
}`,
    'references/iteration-report.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="report-container" id="report-root">
  <h2 class="report-title">{projectName} 迭代进展分析报告</h2>
  
  <div class="metrics-section">
    <div class="metric-card active-card">
      <div class="metric-header">A. 活跃执行中</div>
      <div class="metric-value">{activeSprintName}</div>
      <div class="metric-sub">{activeSprintGoal}</div>
    </div>
    
    <div class="metric-card velocity-card">
      <div class="metric-header">B. 交付燃尽指标</div>
      <div class="metric-row">
        <span class="label">已收尾燃尽:</span>
        <span class="value">{burnedSP} SP</span>
      </div>
      <div class="metric-row">
        <span class="label">迭代容器总速率:</span>
        <span class="value">{velocitySP} SP</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: {completionRate}%"></div>
      </div>
      <div class="completion-text">已交付约 {completionRate}%</div>
    </div>
  </div>

  <div class="chart-section">
    <h3>C. 迭代看板数据占比分布</h3>
    <div class="chart-flex">
      <div class="donut-chart-box">
        <svg viewBox="0 0 42 42" class="donut-svg">
          <circle class="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="transparent"></circle>
          <circle class="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e2e8f0" stroke-width="3"></circle>
          
          <circle class="donut-segment segment-todo" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#3b82f6" stroke-width="3" stroke-dasharray="{todoPercent} {todoRemainPercent}" stroke-dashoffset="100"></circle>
          <circle class="donut-segment segment-doing" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" stroke-width="3" stroke-dasharray="{doingPercent} {doingRemainPercent}" stroke-dashoffset="{doingDashOffset}"></circle>
          <circle class="donut-segment segment-done" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#10b981" stroke-width="3" stroke-dasharray="{donePercent} {doneRemainPercent}" stroke-dashoffset="{doneDashOffset}"></circle>
        </svg>
        <div class="donut-center">
          <span class="total-title">等候/开发/完成</span>
          <span class="total-val">{totalTickets} 个需求</span>
        </div>
      </div>
      
      <div class="chart-legend">
        <div class="legend-item"><span class="bullet todo-bullet"></span> 待办: {todoCount} ({todoPercent}%)</div>
        <div class="legend-item"><span class="bullet doing-bullet"></span> 进行中: {doingCount} ({doingPercent}%)</div>
        <div class="legend-item"><span class="bullet done-bullet"></span> 已关闭: {doneCount} ({donePercent}%)</div>
      </div>
    </div>
  </div>

  <div class="tables-section">
    <div class="table-wrapper todo-table-wrapper">
      <h4>📋 待办队列任务列表 (Planned/Todo)</h4>
      <table>
        <thead>
          <tr>
            <th style="width: 80px;">需求 ID</th>
            <th>任务/需求名称</th>
            <th style="width: 80px; text-align: right;">规划点数</th>
          </tr>
        </thead>
        <tbody>
          {todoRows}
        </tbody>
      </table>
    </div>

    <div class="table-wrapper doing-table-wrapper">
      <h4>🏃‍♂️ 进行中任务列表 (Active/Doing)</h4>
      <table>
        <thead>
          <tr>
            <th style="width: 80px;">需求 ID</th>
            <th>任务/需求名称</th>
            <th style="width: 80px; text-align: right;">规划点数</th>
          </tr>
        </thead>
        <tbody>
          {doingRows}
        </tbody>
      </table>
    </div>

    <div class="table-wrapper done-table-wrapper">
      <h4>📦 已关闭/燃尽任务列表 (Completed/Done)</h4>
      <table>
        <thead>
          <tr>
            <th style="width: 80px;">需求 ID</th>
            <th>任务/需求名称</th>
            <th style="width: 80px; text-align: right;">交付点数</th>
          </tr>
        </thead>
        <tbody>
          {doneRows}
        </tbody>
      </table>
    </div>
  </div>
</div>
</body>
</html>`,
    'references/styles.css': `.report-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 28px; max-width: 900px; margin: 0 auto; color: #1e293b; background: #ffffff; }\n.report-title { font-size: 24px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 24px; }\n.metrics-section { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }\n.metric-card { padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; }\n.active-card { border-left: 5px solid #3b82f6; }\n.velocity-card { border-left: 5px solid #10b981; }\n.metric-header { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px; }\n.metric-value { font-size: 18px; font-weight: 800; color: #1e293b; line-height: 1.3; }\n.metric-sub { font-size: 12px; color: #64748b; margin-top: 6px; font-style: italic; }\n.metric-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }\n.metric-row .label { color: #64748b; }\n.metric-row .value { font-weight: 750; color: #0f172a; }\n.progress-bar-container { background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; margin-top: 12px; }\n.progress-bar-fill { height: 100%; background: #10b981; border-radius: 4px; transition: width 0.3s ease; }\n.completion-text { font-size: 11px; font-weight: 700; text-align: right; color: #10b981; margin-top: 4px; }\n.chart-section { padding: 24px; background: #faf5ff; border: 1px solid #f3e8ff; border-radius: 12px; margin-bottom: 28px; }\n.chart-section h3 { font-size: 16px; font-weight: 750; color: #6b21a8; margin: 0 0 16px 0; }\n.chart-flex { display: flex; align-items: center; justify-content: space-around; gap: 24px; }\n.donut-chart-box { position: relative; width: 140px; height: 140px; }\n.donut-svg { transform: rotate(-90deg); }\n.donut-ring { stroke: #f3e8ff; }\n.donut-segment { fill: none; transition: stroke-dasharray 0.3s ease; }\n.donut-center { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }\n.total-title { font-size: 9px; color: #8b5cf6; text-transform: uppercase; font-weight: 700; }\n.total-val { font-size: 12px; font-weight: 800; color: #5b21b6; }\n.chart-legend { display: flex; flex-direction: column; gap: 12px; }\n.legend-item { display: flex; align-items: center; font-size: 13px; font-weight: 600; color: #475569; }\n.bullet { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; }\n.todo-bullet { background: #3b82f6; }\n.doing-bullet { background: #f59e0b; }\n.done-bullet { background: #10b981; }\n.tables-section { display: flex; flex-direction: column; gap: 24px; }\n.table-wrapper h4 { font-size: 14px; font-weight: 750; margin: 0 0 10px 0; color: #1e293b; display: flex; align-items: center; gap: 6px; }\ntable { width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }\ntr:hover { background-color: #f8fafc; }\nth, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }\nth { background: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }`,
    'assets/chart-data.json': SHARED_CHART_DATA_JSON
};
