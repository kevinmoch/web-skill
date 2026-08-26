import { createRoot } from 'react-dom/client';
// 本项目自带的 Tailwind 编译产物必须排在包样式之前：同层同优先级规则按源码顺序定胜负，
// 排在后面时我们的 .grid-cols-1 会盖掉 console.css 的 lg:grid-cols-[...]（编辑器右面板/拖拽点消失）。
// 与 SDK 仓库 examples/chatbot-playground/src/main.tsx 的样式排序约定一致。
import './index.css';
import App from './App.tsx';
import { installWebMcpTools } from './webskill/webMcpTools.ts';

// WebMCP 工具声明（浏览器原生通道）：页面级工具随文档装配即声明，
// SDK 的 WebMCP 适配器每次调用都惰性重读，无需等引擎起来
installWebMcpTools();

// 注意：不要包 StrictMode——chatbot 的引擎装配 effect（`useEffect(() => () => engine.dispose(), [engine])`）
// 会被 StrictMode 的挂载期 effect 双跑（setup → cleanup → setup）当场 dispose 掉，
// 首次真实对话即报 "This ChatEngine was disposed"。SDK 自己的 playground 也不用 StrictMode。
createRoot(document.getElementById('root')!).render(<App />);
