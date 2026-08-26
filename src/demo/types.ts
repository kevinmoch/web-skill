import type { SettingsSectionId } from '@webskill/chatbot';

export type Screen = 'overview' | 'requirements' | 'sprints' | 'bugs' | 'tests' | 'metrics' | 'webskill-manager';

/** 导航参数：跳到技能中心（console）时直达某个分区 / run / 候选 */
export interface ScreenParams {
  settings?: SettingsSectionId;
  runId?: string;
  candidateId?: string;
}
