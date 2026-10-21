import { FadeIn } from '../components/FadeIn';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  CheckCircle2,
  Code,
  Cpu,
  Layers,
  Lock,
  Package,
  RefreshCw,
  ShieldAlert,
  TerminalSquare,
  Workflow,
  Zap
} from 'lucide-react';

interface TextCard {
  title: string;
  desc: string;
}

interface SupportRow {
  env: string;
  esm: string;
  iife: string;
  notes: string;
}

const esmCode = `import { createLlmClient, installWebSkillPolyfill } from '@webskill/polyfill';

const llm = createLlmClient({
  provider: 'openai-compatible',
  baseUrl: 'https://your-llm-endpoint/v1',
  model: 'your-model'
});

// Native first: install only when navigator.webskill is absent.
const ws = navigator.webskill ?? installWebSkillPolyfill({ roots: ['/skills'], llm });

if (ws) {
  const catalog = await ws.discover('/skills');
  const doc = await ws.read('greeter');
  const report = await ws.validate('/skills');
  const run = await ws.run('Use the greeter skill.');

  console.log(catalog.entries, doc.metadata.description, report.ok);
  console.log(run.status, run.activeSkillNames, run.trace, run.artifacts);
}`;

const iifeCode = `<script src="/assets/polyfill.js"></script>
<script>
  const llm = WebSkillPolyfill.createLlmClient(config);
  const ws = navigator.webskill ?? WebSkillPolyfill.install({ roots: ['/skills'], llm });

  if (ws) {
    ws.discover('/skills').then((catalog) => console.log(catalog.entries));
  }
</script>`;

const localScriptCode = `export const description = 'Greet someone by name.';

export const inputSchema = {
  type: 'object',
  properties: { text: { type: 'string' } },
  required: ['text']
};

export async function run(input, context) {
  const message = 'Hello, ' + input.text + '!';
  await context.writeArtifact('greeting.json', JSON.stringify({ message }), {
    mimeType: 'application/json'
  });
  return [{ type: 'text', text: message }];
}`;

const METHODS = ['discover', 'read', 'validate', 'run', 'install', 'uninstall'];

function SectionHeading({ kicker, title, desc }: { kicker: string; title: string; desc?: string }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 text-center">
      <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-accent">{kicker}</span>
      <h2 className="text-[26px] font-medium tracking-tight text-text-main sm:text-[28px] md:text-[32px]">{title}</h2>
      {desc && <p className="text-[15px] leading-relaxed text-text-dim sm:text-[16px]">{desc}</p>}
    </div>
  );
}

function TextCardView({ card, icon, delay = 0 }: { card: TextCard; icon: React.ReactNode; delay?: number }) {
  return (
    <FadeIn delay={delay}>
      <article className="flex h-full flex-col gap-4 rounded-2xl border border-border-color bg-surface p-6 transition-colors hover:bg-surface-hover sm:p-7">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">{icon}</div>
        <h3 className="text-[16px] font-semibold text-text-main sm:text-[18px]">{card.title}</h3>
        <p className="text-[14px] leading-relaxed text-text-dim">{card.desc}</p>
      </article>
    </FadeIn>
  );
}

function CodePanel({
  title,
  desc,
  language,
  code,
  scrollLabel
}: {
  title: string;
  desc: string;
  language: string;
  code: string;
  scrollLabel: string;
}) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border-color bg-bg">
      <figcaption className="flex items-center gap-2 border-b border-border-color bg-surface px-4 py-3 text-[14px] text-text-dim">
        <TerminalSquare className="h-4 w-4 shrink-0 text-accent" />
        <span className="font-medium text-text-main">{title}</span>
        <span className="sr-only">{desc}</span>
      </figcaption>
      <div className="overflow-x-auto code-scrollbar" tabIndex={0} aria-label={scrollLabel}>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '1.25rem 1.5rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: 1.7,
            minWidth: '100%',
            width: 'max-content'
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </figure>
  );
}

export default function Polyfill({ t }: { t: any }) {
  const whatCards = (t('polyfill.whatCards', { returnObjects: true }) as TextCard[]) || [];
  const lifecycle = (t('polyfill.lifecycle', { returnObjects: true }) as TextCard[]) || [];
  const guarantees = (t('polyfill.guarantees', { returnObjects: true }) as TextCard[]) || [];
  const supportRows = (t('polyfill.supportRows', { returnObjects: true }) as SupportRow[]) || [];
  const whatIcons = [Layers, Code, Cpu];
  const guaranteeIcons = [CheckCircle2, Zap, RefreshCw, Lock, ShieldAlert, Package];

  return (
    <div className="mx-auto flex w-full max-w-[1024px] flex-col gap-14 px-4 pb-16 pt-8 sm:px-6 md:gap-16 md:px-8 md:pt-12 lg:px-0">
      {/* Hero */}
      <section className="flex flex-col gap-8" aria-labelledby="polyfill-title">
        <FadeIn className="flex max-w-2xl flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs font-semibold text-accent">
              {t('polyfill.badge')}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            <h1 id="polyfill-title" className="text-[34px] font-medium leading-[1.08] tracking-tight text-text-main sm:text-[44px] md:text-[56px]">
              {t('polyfill.title')}
            </h1>
            <p className="max-w-xl text-[15px] leading-[1.65] text-text-dim md:text-[18px]">{t('polyfill.subtitle')}</p>
            <a
              href={t('polyfill.explainerUrl')}
              target="_blank"
              rel="noreferrer"
              className="w-fit border-b border-accent/40 text-[14px] font-medium text-accent transition-colors hover:border-accent"
            >
              {t('polyfill.explainerCta')} ↗
            </a>
          </div>
        </FadeIn>
      </section>

      {/* What it is */}
      <section className="flex flex-col gap-8" aria-labelledby="polyfill-what">
        <FadeIn>
          <div id="polyfill-what">
            <SectionHeading
              kicker={t('polyfill.whatKicker')}
              title={t('polyfill.whatTitle')}
              desc={t('polyfill.whatDesc')}
            />
          </div>
        </FadeIn>
        <div className="grid gap-4 md:grid-cols-3">
          {whatCards.map((card, index) => {
            const Icon = whatIcons[index] || Layers;
            return <TextCardView key={card.title} card={card} icon={<Icon className="h-5 w-5" />} delay={0.08 * index} />;
          })}
        </div>
      </section>

      {/* Install lifecycle */}
      <section className="flex flex-col gap-8" aria-labelledby="polyfill-lifecycle">
        <FadeIn>
          <div id="polyfill-lifecycle">
            <SectionHeading
              kicker={t('polyfill.lifecycleKicker')}
              title={t('polyfill.lifecycleTitle')}
              desc={t('polyfill.lifecycleDesc')}
            />
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lifecycle.map((item, index) => (
              <li key={item.title} className="rounded-2xl border border-border-color bg-surface p-5">
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 font-mono text-sm font-bold text-accent">
                  {index + 1}
                </div>
                <h3 className="mb-2 text-[15px] font-semibold text-text-main">{item.title}</h3>
                <p className="text-[14px] leading-relaxed text-text-dim">{item.desc}</p>
              </li>
            ))}
          </ol>
        </FadeIn>
      </section>

      {/* Design guarantees */}
      <section className="flex flex-col gap-8" aria-labelledby="polyfill-guarantees">
        <FadeIn>
          <div id="polyfill-guarantees">
            <SectionHeading
              kicker={t('polyfill.guaranteesKicker')}
              title={t('polyfill.guaranteesTitle')}
              desc={t('polyfill.guaranteesDesc')}
            />
          </div>
        </FadeIn>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guarantees.map((card, index) => {
            const Icon = guaranteeIcons[index] || CheckCircle2;
            return <TextCardView key={card.title} card={card} icon={<Icon className="h-5 w-5" />} delay={0.06 * index} />;
          })}
        </div>
      </section>

      {/* Code examples */}
      <section className="flex flex-col gap-8" aria-labelledby="polyfill-examples">
        <FadeIn>
          <div id="polyfill-examples">
            <SectionHeading
              kicker={t('polyfill.examplesKicker')}
              title={t('polyfill.examplesTitle')}
              desc={t('polyfill.examplesDesc')}
            />
          </div>
        </FadeIn>
        <div className="grid gap-6 lg:grid-cols-2">
          <FadeIn delay={0.1} className="min-w-0">
            <CodePanel
              title={t('polyfill.esmExampleTitle')}
              desc={t('polyfill.esmExampleDesc')}
              scrollLabel={t('polyfill.esmExampleScroll')}
              language="javascript"
              code={esmCode}
            />
          </FadeIn>
          <FadeIn delay={0.18} className="min-w-0">
            <CodePanel
              title={t('polyfill.iifeExampleTitle')}
              desc={t('polyfill.iifeExampleDesc')}
              scrollLabel={t('polyfill.iifeExampleScroll')}
              language="html"
              code={iifeCode}
            />
          </FadeIn>
        </div>
        <FadeIn delay={0.25}>
          <div className="flex gap-3 rounded-2xl border border-accent/20 bg-accent/10 p-4 text-[14px] leading-relaxed text-text-dim">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p>{t('polyfill.examplesCredentialNote')}</p>
          </div>
        </FadeIn>
      </section>

      {/* Local skill */}
      <section className="grid gap-8 lg:grid-cols-5 lg:items-start" aria-labelledby="polyfill-local-skill">
        <FadeIn className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <div id="polyfill-local-skill">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {t('polyfill.localKicker')}
            </span>
            <h2 className="mt-3 text-[26px] font-medium tracking-tight text-text-main sm:text-[28px]">
              {t('polyfill.localTitle')}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-text-dim">{t('polyfill.localDesc')}</p>
          </div>
          <div className="rounded-2xl border border-border-color bg-surface p-5">
            <h3 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-text-main">
              <Workflow className="h-4 w-4 text-accent" />
              {t('polyfill.methodsTitle')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {METHODS.map((method) => (
                <code key={method} className="rounded-md border border-accent/20 bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent">
                  {method}
                </code>
              ))}
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={0.15} className="min-w-0 lg:col-span-3">
          <CodePanel
            title={t('polyfill.localScriptTitle')}
            desc={t('polyfill.localScriptDesc')}
            scrollLabel={t('polyfill.localScriptScroll')}
            language="javascript"
            code={localScriptCode}
          />
        </FadeIn>
      </section>

      {/* Support matrix */}
      <section className="flex flex-col gap-8" aria-labelledby="polyfill-support">
        <FadeIn>
          <div id="polyfill-support">
            <SectionHeading
              kicker={t('polyfill.supportKicker')}
              title={t('polyfill.supportTitle')}
              desc={t('polyfill.supportDesc')}
            />
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div className="overflow-x-auto rounded-2xl border border-border-color bg-surface code-scrollbar">
            <table className="w-full min-w-[46rem] border-collapse text-left text-[14px]">
              <caption className="sr-only">{t('polyfill.supportCaption')}</caption>
              <thead className="border-b border-border-color bg-bg text-text-dim">
                <tr>
                  <th scope="col" className="px-5 py-4 font-semibold">{t('polyfill.supportHeaders.0')}</th>
                  <th scope="col" className="px-5 py-4 font-semibold">{t('polyfill.supportHeaders.1')}</th>
                  <th scope="col" className="px-5 py-4 font-semibold">{t('polyfill.supportHeaders.2')}</th>
                  <th scope="col" className="px-5 py-4 font-semibold">{t('polyfill.supportHeaders.3')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color/60">
                {supportRows.map((row) => (
                  <tr key={row.env} className="align-top">
                    <th scope="row" className="px-5 py-4 font-semibold text-text-main">{row.env}</th>
                    <td className="px-5 py-4 text-accent">{row.esm}</td>
                    <td className="px-5 py-4 text-accent">{row.iife}</td>
                    <td className="px-5 py-4 leading-relaxed text-text-dim">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
