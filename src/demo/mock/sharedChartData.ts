export const SHARED_CHART_DATA_JSON = `{
  "projects": [
    {
      "id": "PROJ-CORE",
      "key": "CORE",
      "name": "智云协同核心业务平台",
      "name_en": "SmartCloud Core Platform",
      "status": "迭代活跃中",
      "status_en": "Sprint Active"
    },
    {
      "id": "PROJ-CD",
      "key": "DEVOPS",
      "name": "低代码自动化交付流水线",
      "name_en": "Low-Code Automated Pipeline",
      "status": "架构优化中",
      "status_en": "Arch Optimization"
    },
    {
      "id": "PROJ-AGENT",
      "key": "AGENT",
      "name": "智能协同研发助手系统",
      "name_en": "AI Dev Large Model Assistant",
      "status": "需求设计中",
      "status_en": "Backlog Designing"
    }
  ],
  "sprints": [
    {
      "id": "CORE-SPR-01",
      "name": "CORE Iteration 1: 基础骨架与身份校验",
      "name_en": "CORE Iteration 1: Skeleton & Auth",
      "goal": "完成底层单点登录链路对接并打多租户落盘加密数据通道",
      "goal_en": "Finish underlying SSO links and multi-tenant encrypted channels.",
      "velocity": 28,
      "progress": 100,
      "startDate": "2026-05-01",
      "endDate": "2026-05-14",
      "status": "Completed",
      "projectId": "PROJ-CORE"
    },
    {
      "id": "CORE-SPR-02",
      "name": "CORE Iteration 2: 智能卡片与协作视图开发",
      "name_en": "CORE Iteration 2: Smart Cards & Collaboration Views",
      "goal": "研发流式对话大模型渲染引擎，交付看板、甘特多重视图交互",
      "goal_en": "Develop streaming LLM rendering engine, deliver Kanban & Gantt view interactions.",
      "velocity": 35,
      "progress": 72,
      "status": "Active",
      "projectId": "PROJ-CORE"
    },
    {
      "id": "CORE-SPR-03",
      "name": "CORE Iteration 3: CI跑跑自动化安全核对上线",
      "name_en": "CORE Iteration 3: CI Testing & Security Checks",
      "goal": "并入跑测自动化容错机制，完成高等级RBAC数据防越权加壳上线",
      "goal_en": "Merge test auto-retries and launch high-level RBAC data protection boundaries.",
      "velocity": 42,
      "progress": 0,
      "startDate": "2026-05-29",
      "endDate": "2026-06-11",
      "status": "Planned",
      "projectId": "PROJ-CORE"
    }
  ],
  "requirements": [
    {
      "id": "CORE-101",
      "title": "企业单点登录 (SSO) 安全保护对接",
      "title_en": "Enterprise SSO Security Integration",
      "priority": "High",
      "status": "In Progress",
      "storyPoints": 5,
      "projectId": "PROJ-CORE"
    },
    {
      "id": "CORE-102",
      "title": "团队敏捷工作台流式大模型对话卡片渲染",
      "title_en": "Streaming LLM Card Rendering in Agile Workspace",
      "priority": "High",
      "status": "In Progress",
      "storyPoints": 8,
      "projectId": "PROJ-CORE"
    },
    {
      "id": "CORE-111",
      "title": "夜间模式深度适配及性能优化",
      "title_en": "Dark Mode Adaptation & Performance Tuning",
      "priority": "Low",
      "status": "In Progress",
      "storyPoints": 2,
      "projectId": "PROJ-CORE"
    },
    {
      "id": "CORE-103",
      "title": "项目多重视图与排期时间轴切换",
      "title_en": "Multi-View and Timeline Toggle in Projects",
      "priority": "Medium",
      "status": "Todo",
      "storyPoints": 5,
      "projectId": "PROJ-CORE"
    },
    {
      "id": "CORE-106",
      "title": "跨租户数据同步接口",
      "title_en": "Cross-tenant Data Sync APIs",
      "priority": "High",
      "status": "Todo",
      "storyPoints": 5,
      "projectId": "PROJ-CORE"
    },
    {
      "id": "CORE-110",
      "title": "全局快捷键调度模块",
      "title_en": "Global Hotkey Scheduler Module",
      "priority": "Medium",
      "status": "Todo",
      "storyPoints": 3,
      "projectId": "PROJ-CORE"
    },
    {
      "id": "CORE-104",
      "title": "双机沙箱数据库多租户数据落盘加密",
      "title_en": "Dual-Box Sandbox Database Multi-Tenant Encryption",
      "priority": "High",
      "status": "Done",
      "storyPoints": 5,
      "projectId": "PROJ-CORE"
    },
    {
      "id": "CORE-105",
      "title": "敏捷持续跑测测试套件自动化重试机制",
      "title_en": "CI Auto Retries for Test Suites",
      "priority": "Medium",
      "status": "Done",
      "storyPoints": 2,
      "projectId": "PROJ-CORE"
    },
    {
      "id": "CORE-112",
      "title": "数据大盘图表懒加载优化",
      "title_en": "Dashboard Charts Lazy Loading Optimization",
      "priority": "Low",
      "status": "Done",
      "storyPoints": 3,
      "projectId": "PROJ-CORE"
    }
  ],
  "bugs": [
    {
      "id": "CORE-BUG-01",
      "title": "弱网环境下大模型流式输出在 React 渲染时发生 DOM 断裂崩溃",
      "title_en": "Streaming LLM outputs crash DOM in weak networks",
      "severity": "Critical",
      "status": "Open",
      "module": "智能大模型卡片引擎",
      "module_en": "Smart Card Engine",
      "createdAt": "2026-05-22",
      "assignee": "孙雪",
      "assignee_en": "Xue Sun",
      "reporter": "王建国",
      "reporter_en": "John Wang",
      "projectId": "PROJ-CORE"
    },
    {
      "id": "DEVOPS-BUG-03",
      "title": "历史构建日志加载超时卡死浏览器",
      "title_en": "Historical build logs load timeout freezes browser",
      "severity": "Critical",
      "status": "Open",
      "module": "日志展示大盘",
      "module_en": "Log Display",
      "createdAt": "2026-05-23",
      "assignee": "全栈优化组",
      "assignee_en": "Fullstack Opt",
      "reporter": "大客户",
      "reporter_en": "VIP Client",
      "projectId": "PROJ-CD"
    },
    {
      "id": "DEVOPS-BUG-04",
      "title": "环境变量配置无法删除最后一条",
      "title_en": "Cannot delete the last item in env vars config",
      "severity": "Minor",
      "status": "Open",
      "module": "发布配置模块",
      "module_en": "Release Config",
      "createdAt": "2026-05-22",
      "assignee": "前端小李",
      "assignee_en": "Li (FE)",
      "reporter": "测试小王",
      "reporter_en": "Wang (QA)",
      "projectId": "PROJ-CD"
    },
    {
      "id": "DEVOPS-BUG-05",
      "title": "金丝雀流量分发偶发不均衡",
      "title_en": "Canary traffic distribution occasionally uneven",
      "severity": "Major",
      "status": "Fixed",
      "module": "流量网关",
      "module_en": "Traffic Gateway",
      "createdAt": "2026-05-21",
      "assignee": "网关研发组",
      "assignee_en": "Gateway Devs",
      "reporter": "线上告警",
      "reporter_en": "Prod Alert",
      "projectId": "PROJ-CD"
    },
    {
      "id": "AGENT-BUG-02",
      "title": "知识库同步存在脏数据残留",
      "title_en": "Dirty data remains after KB sync",
      "severity": "Major",
      "status": "Open",
      "module": "知识抽取模块",
      "module_en": "Knowledge Extractor",
      "createdAt": "2026-05-23",
      "assignee": "引擎组",
      "assignee_en": "Engine Team",
      "reporter": "测试李四",
      "reporter_en": "Li Si (QA)",
      "projectId": "PROJ-AGENT"
    },
    {
      "id": "AGENT-BUG-03",
      "title": "代码片段生成缺少换行符",
      "title_en": "Code snippet generation missing newlines",
      "severity": "Minor",
      "status": "Fixed",
      "module": "UI渲染器",
      "module_en": "UI Renderer",
      "createdAt": "2026-05-22",
      "assignee": "体验组",
      "assignee_en": "Exp Team",
      "reporter": "内测用户",
      "reporter_en": "Beta Tester",
      "projectId": "PROJ-AGENT"
    },
    {
      "id": "AGENT-BUG-04",
      "title": "大模型对过长的报错日志解析中断",
      "title_en": "LLM parse interrupts for overly long error logs",
      "severity": "Critical",
      "status": "Open",
      "module": "文本分块服务",
      "module_en": "Text Chunking",
      "createdAt": "2026-05-20",
      "assignee": "AI工程师",
      "assignee_en": "AI Engineer",
      "reporter": "核心测试",
      "reporter_en": "Core QA",
      "projectId": "PROJ-AGENT"
    }
  ]
}`;
