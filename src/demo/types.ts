import { type Requirement, type Sprint, type Bug, type TestSuite, type Metrics } from './mock/staticData';

export type Screen = 'overview' | 'requirements' | 'sprints' | 'bugs' | 'tests' | 'metrics' | 'webskill-manager';

export interface LLMConfig {
  apiKey: string;
  modelName: string;
  endpoint: string;
}

export type OpenUITemplate = 'kpis' | 'kanban' | 'table' | 'chart' | 'metrics' | 'form' | 'dashboard';

export interface OpenUISchema {
  type: OpenUITemplate;
  title: string;
  subtitle?: string;
  formActionId?: string;
  formFields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'select' | 'textarea' | 'radio';
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    defaultValue?: string;
  }>;
  formSubmitText?: string;
  data?: {
    kpis?: Array<{ label: string; value: string | number; change?: string; trend?: 'up' | 'down' | 'neutral'; color?: string }>;
    columns?: Array<{ key: string; label: string }>;
    rows?: Array<Record<string, any>>;
    kanbanGroups?: Array<{
      status: string;
      title: string;
      color: string;
      items: Array<{ id: string; title: string; priority: string; reporter?: string }>;
    }>;
    chartPoints?: Array<{ label: string; value: number; secondaryValue?: number }>;
    chartType?: 'line' | 'bar' | 'donut';
    dashboardData?: {
      donutPoints: Array<{ label: string; value: number }>;
      barPoints: Array<{ label: string; value: number; secondaryValue?: number }>;
      kpis: Array<{ label: string; value: string | number; change?: string; trend?: 'up' | 'down' | 'neutral'; color?: string }>;
      tables?: Array<{
        title: string;
        columns: Array<{ key: string; label: string }>;
        rows: Array<Record<string, any>>;
      }>;
    };
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  uiSchema?: OpenUISchema;
  isStreaming?: boolean;
  timestamp: string;
}

export interface AppState {
  requirements: Requirement[];
  sprints: Sprint[];
  bugs: Bug[];
  testSuites: TestSuite[];
  metrics: Metrics;
  currentScreen: Screen;
  theme: 'light' | 'dark';
  lang: 'zh' | 'en';
  llmConfig: LLMConfig;
  chatHistory: ChatMessage[];
  isLoggedIn: boolean;
}
