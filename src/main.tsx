import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  // 防守性日志：在嵌入环境或构建时 root 未找到时避免抛出异常
  // 记录以便调试。
  // eslint-disable-next-line no-console
  console.error('Root element with id "root" not found. App did not mount.');
}
