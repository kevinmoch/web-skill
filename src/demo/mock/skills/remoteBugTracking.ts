export const REMOTE_BUG_TRACKING_SKILL = {
  name: 'remote-bug-tracker-enhancement',
  source: 'remote',
  root: '/skills/remote-bug-tracker-enhancement',
  'SKILL.md': `---
name: remote-bug-tracker-enhancement
description: Automatically assigns bugs to the most relevant team member based on past resolution history and bug component categorization.
version: 1.1.2
tags: [bugs, triage, automation]
---
# Remote Bug Tracker Enhancement Skill

This skill provides an automated triage mechanism. When a new bug is reported, it analyzes the \`component\` and \`description\` texts to suggest an assignee.
`
};
