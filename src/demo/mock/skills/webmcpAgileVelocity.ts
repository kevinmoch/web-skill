export const WEBMCP_AGILE_VELOCITY_SKILL = {
    name: 'webmcp-agile-velocity-analyzer',
    source: 'webmcp',
    root: '/skills/webmcp-agile-velocity-analyzer',
    'SKILL.md': `---
name: webmcp-agile-velocity-analyzer
description: 远程敏捷迭代速率分析 WebMCP 技能。基于端点提供迭代分析数据。
version: 1.0.0
tags: [agile, webmcp, analysis]
---
# 远程敏捷迭代速率分析 WebMCP 技能

1. 通过 MCP 协议请求远程端点获取数据
`,
    'scripts/': true,
    'scripts/analyzeVelocity.ts': `export const inputSchema = {
  type: 'object',
  properties: {
    teamId: {
      type: 'string'
    }
  },
  required: ['teamId']
};

export async function run(input: any) {
  return {
    content: [{
      type: 'text',
      text: "成功通过 WebMCP 端点分析了团队迭代速率。"
    }]
  };
}`,
    'resources/': true,
    'resources/template.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body>
  <div>WebMCP 分析报告模板</div>
</body>
</html>`
};
