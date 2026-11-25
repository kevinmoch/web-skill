import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const sdk = process.env.WEBSKILL_SRC;
let failed = false;

const here = require.resolve('react');
console.log(`[doctor] site react: ${here}`);

if (sdk) {
  if (!existsSync(sdk)) {
    console.error(`[doctor] FAIL WEBSKILL_SRC not found: ${sdk}`);
    failed = true;
  } else {
    const there = require.resolve('react', { paths: [sdk] });
    console.log(`[doctor] sdk  react: ${there}`);
    if (here !== there) {
      console.warn('[doctor] WARN two React copies resolved; resolve.dedupe must list react/react-dom');
    }
  }
  for (const f of [
    'packages/ui-kit/dist/ui-kit.css',
    'packages/chatbot/dist/chatbot.css',
    'packages/console/dist/console.css'
  ]) {
    if (!existsSync(`${sdk}/${f}`)) {
      console.error(`[doctor] FAIL missing built CSS: ${f} -> run "pnpm build" in the SDK repo`);
      failed = true;
    }
  }
}

const expectedVersions = ['sdk', 'chatbot', 'console'].map((name) => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.resolve(`@webskill/${name}`)), 'utf8'));
  return `@webskill/${name} ${manifest.version}`;
});

function findVersions(value) {
  if (value === null || typeof value !== 'object') return undefined;
  if (Array.isArray(value.versions)) return value.versions;
  for (const child of Object.values(value)) {
    const versions = findVersions(child);
    if (versions !== undefined) return versions;
  }
  return undefined;
}

for (const locale of ['en', 'zh']) {
  const translations = JSON.parse(readFileSync(new URL(`../src/locales/${locale}.json`, import.meta.url), 'utf8'));
  const actual = findVersions(translations);
  if (JSON.stringify(actual) !== JSON.stringify(expectedVersions)) {
    console.error(`[doctor] FAIL ${locale} guide versions are ${JSON.stringify(actual)}; expected ${JSON.stringify(expectedVersions)}`);
    failed = true;
  }
}

const perception = readFileSync(new URL('../src/demo/webskill/perception.ts', import.meta.url), 'utf8');
for (const forbidden of ['.kd-cq-', '金蝶', 'AGILE_ROLE_HINTS']) {
  if (perception.includes(forbidden)) {
    console.error(`[doctor] FAIL generic perception contains a site-specific role hint: ${forbidden}`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
