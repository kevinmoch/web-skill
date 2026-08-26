import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

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

process.exit(failed ? 1 : 0);
