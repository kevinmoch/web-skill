export interface Project {
  id: string;
  key: string;
  name: string;
  name_en: string;
  status: string;
  status_en?: string;
}

export interface Requirement {
  id: string;
  title: string;
  title_en?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Todo' | 'In Progress' | 'Done';
  description: string;
  description_en?: string;
  reporter: string;
  reporter_en?: string;
  assignee?: string;
  assignee_en?: string;
  epic?: string;
  epic_en?: string;
  storyPoints?: number;
  createdDate?: string;
  projectId: string;
}

export interface Sprint {
  id: string;
  name: string;
  name_en?: string;
  goal?: string;
  goal_en?: string;
  velocity: number;
  progress: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Planned' | 'Completed';
  projectId: string;
}

export interface Bug {
  id: string;
  title: string;
  title_en?: string;
  severity: 'Critical' | 'Major' | 'Minor';
  status: 'Open' | 'Fixed' | 'Closed';
  module: string;
  module_en?: string;
  createdAt: string;
  assignee?: string;
  assignee_en?: string;
  reporter?: string;
  reporter_en?: string;
  projectId: string;
}

export interface TestSuite {
  id: string;
  suite: string;
  suite_en?: string;
  coverage: number;
  passRate: number;
  totalCases: number;
  passed: number;
  failed: number;
  status: 'Passed' | 'Failed';
  type?: 'Automated' | 'Manual';
  projectId: string;
}

export interface Metrics {
  leadTime: number;
  cycleTime: number;
  deploymentFrequency: number;
  failureRate: number;
}

import initialProjectsData from './projects.json';
import initialRequirementsData from './requirements.json';
import initialSprintsData from './sprints.json';
import initialBugsData from './bugs.json';
import initialTestSuitesData from './testSuites.json';
import initialMetricsData from './metrics.json';

export const initialProjects: Project[] = initialProjectsData as Project[];
export const initialRequirements: Requirement[] = initialRequirementsData as Requirement[];
export const initialSprints: Sprint[] = initialSprintsData as Sprint[];
export const initialBugs: Bug[] = initialBugsData as Bug[];
export const initialTestSuites: TestSuite[] = initialTestSuitesData as TestSuite[];
export const initialMetrics: Metrics = initialMetricsData as Metrics;

