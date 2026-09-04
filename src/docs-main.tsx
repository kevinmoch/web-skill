import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import DocsApp from './pages/docs/DocsApp.tsx';
import './index.css';
import './i18n';

// 独立文档构建（vite.docs.config.ts → docs.html）的入口，只挂载文档外壳
const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <DocsApp />
    </StrictMode>
  );
} else {
  // eslint-disable-next-line no-console
  console.error('Root element with id "root" not found. DocsApp did not mount.');
}
