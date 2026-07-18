import { motion } from 'motion/react';
import { FadeIn } from '../components/FadeIn';
import { 
  Network, Zap, ShieldAlert, Cpu, Layers, Workflow, Activity, Database, CheckCircle2, ArrowRight,
  Server, HardDrive, Box, Lock, RefreshCw, LayoutTemplate, CloudUpload, MonitorPlay, Globe, UserCheck
} from 'lucide-react';
import { TrinityDiagram } from '../components/TrinityDiagram';

const ICONS: Record<string, any> = {
  Cpu,
  Workflow,
  Activity,
  Database,
  CheckCircle2,
  Network,
  Zap,
  ShieldAlert,
};

const highlightWebSkill = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(WebSkill)/gi);
  return parts.map((part, i) => 
    part.toLowerCase() === 'webskill' 
      ? <span key={i} className="text-accent font-semibold">WebSkill</span>
      : part
  );
};

export default function Home({ t, lang }: { t: any, lang: string }) {
  const isZh = lang.startsWith('zh');
  const imgSrc = '/images/' + (isZh ? 'zh' : 'en') + '/12.gif';
  
  const scenarios = (t('home.agentSkillScenarios', { returnObjects: true }) as any[]) || [];
  const problems = (t('home.problemsSolved', { returnObjects: true }) as any[]) || [];
  const features = (t('home.webskillFeatures', { returnObjects: true }) as any[]) || [];
  const compHeaders = (t('home.compTableHeaders', { returnObjects: true }) as any[]) || [];
  const compRows = (t('home.compRows', { returnObjects: true }) as any[]) || [];
  const explanationTitle = t('home.architectureExplanationTitle');
  const explanationIntro = t('home.architectureExplanationIntro');
  const explanationSteps = (t('home.architectureExplanationSteps', { returnObjects: true }) as any[]) || [];

  return (
    <div className="flex flex-col gap-12 md:gap-16 w-full max-w-[1024px] mx-auto px-4 sm:px-6 md:px-8 lg:px-0 pb-16">
      
      {/* Screen 1: Hero & Architecture Diagram */}
      <section className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center mt-6 md:mt-12 mb-4 md:mb-8">
        <div className="flex-1 px-2 sm:px-4 lg:px-0 lg:pr-8 text-center lg:text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-[32px] sm:text-[42px] md:text-[56px] font-medium tracking-tight leading-[1.1] mb-6">
              WebSkill <br />
              <span className="text-text-dim text-[24px] sm:text-[30px] md:text-[40px]">{t('hero.title1')}</span> <br />
              <span className="text-accent text-[20px] sm:text-[26px] md:text-[36px]">{t('hero.title2')}</span>
            </h1>
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-[15px] md:text-[18px] text-text-dim max-w-[480px] leading-[1.6] mx-auto lg:mx-0">
            {t('hero.description')}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="mt-8 flex flex-wrap justify-center lg:justify-start gap-3">
            <div className="px-4 py-1  rounded-full text-xs font-mono text-text-dim tracking-wide">{t('hero.tags.0')}</div>
            <div className="px-4 py-1  rounded-full text-xs font-mono text-text-dim tracking-wide">{t('hero.tags.1')}</div>
          </motion.div>
        </div>
        <div className="flex-1 w-full max-w-md lg:max-w-none flex justify-center">
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-none">
            <TrinityDiagram t={t} className="scale-[0.9] sm:scale-100 origin-center lg:origin-right mt-0" />
          </div>
        </div>
      </section>

      {/* Screen 2: What is Agent Skill */}
      <section className="flex flex-col gap-6 md:gap-8">
        <div className="px-2 text-center max-w-3xl mx-auto mb-2 md:mb-4">
          <FadeIn>
            <h2 className="text-[26px] sm:text-[28px] md:text-[32px] font-medium tracking-tight mb-4">{t('home.agentSkillTitle')}</h2>
            <p className="text-[14px] sm:text-[16px] text-text-dim leading-relaxed">
              {t('home.agentSkillDesc')}
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl p-5 sm:p-8 bg-surface flex flex-col gap-6">
            <FadeIn delay={0.1}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center shrink-0">
                  <Workflow className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-[16px] sm:text-[18px] font-medium text-text-main">{t('home.agentSkillScenariosTitle')}</h3>
              </div>
              <div className="flex flex-col gap-5 mt-2">
                {scenarios.map((s, i) => (
                  <div key={i} className="flex flex-col gap-1.5 border-l-2 border-accent/30 pl-4">
                    <span className="text-[14px] sm:text-[15px] text-text-main font-medium">{s.title}</span>
                    <span className="text-[13px] sm:text-[14px] text-text-dim leading-relaxed">{s.desc}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
          
          <div className="rounded-2xl p-5 sm:p-8 bg-[#0A0A0A] flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
            <FadeIn delay={0.2}>
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-[16px] sm:text-[18px] font-medium text-text-main">{t('home.problemsSolvedTitle')}</h3>
              </div>
              <div className="flex flex-col gap-4 mt-2 relative z-10">
                {problems.map((p, i) => (
                  <div key={i} className="flex gap-3 sm:gap-4 items-start bg-surface p-4 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0"></div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[13px] sm:text-[14px] text-text-main font-medium">{p.title}</span>
                      <span className="text-[12px] sm:text-[13px] text-text-dim leading-relaxed">{p.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Screen 3: What is WebSkill */}
      <section className="flex flex-col gap-6 md:gap-8">
        <div className="rounded-3xl p-6 sm:p-8 md:p-12 bg-gradient-to-b from-surface/50 to-[#0A0A0A] relative overflow-hidden text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
          <FadeIn>
            <Layers className="w-10 h-10 text-accent mx-auto mb-6 opacity-80" />
            <h2 className="text-[26px] sm:text-[28px] md:text-[32px] font-medium mb-4 relative z-10 tracking-tight">{t('home.webskillTitle')}</h2>
            <p className="text-[14px] sm:text-[16px] md:text-[18px] text-text-dim leading-relaxed max-w-3xl mx-auto relative z-10">
              {t('home.webskillDesc')}
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const icons = [Zap, ShieldAlert, Network];
            const Icon = icons[i] || Cpu;
            return (
              <FadeIn key={i} delay={0.1 * i}>
                <div className="flex flex-col gap-4 p-6 sm:p-8 rounded-2xl bg-surface h-full hover:bg-surface-hover transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-bg flex items-center justify-center shadow-lg shadow-black/20">
                    <Icon className="w-5 h-5 text-accent opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="text-[16px] sm:text-[18px] text-text-main font-medium mt-2">{f.title}</h4>
                  <p className="text-[13px] sm:text-[14px] text-text-dim leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* Screen 4: Trinity Architecture */}
      <section className="flex flex-col gap-6 md:gap-8">
        <div className="px-2 text-center max-w-3xl mx-auto mb-2 md:mb-4">
          <FadeIn>
            <h2 className="text-[26px] sm:text-[28px] md:text-[32px] font-medium tracking-tight mb-4">{t('home.trinityTitle')}</h2>
            <p className="text-[14px] sm:text-[16px] text-text-dim leading-relaxed">
              {t('home.trinityDesc')}
            </p>
          </FadeIn>
        </div>

        <div className="rounded-3xl bg-[#0A0A0A] p-5 sm:p-8 md:p-12 overflow-hidden flex flex-col items-center">
          <FadeIn delay={0.1} className="w-full max-w-3xl mx-auto mt-2 mb-6">
             <TrinityDiagram t={t} className="my-2" />
          </FadeIn>
          
          <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto relative z-10 mt-6">
             <FadeIn delay={0.2} className="p-4 sm:p-5 rounded-2xl bg-surface  hover:border-accent/20 hover:bg-surface transition-all">
               <p className="text-[13px] sm:text-[14px] text-text-dim leading-relaxed">{highlightWebSkill(t('home.diagramAnnotation1'))}</p>
             </FadeIn>
             <FadeIn delay={0.3} className="p-4 sm:p-5 rounded-2xl bg-surface  hover:border-accent/20 hover:bg-surface transition-all">
               <p className="text-[13px] sm:text-[14px] text-text-dim leading-relaxed">{highlightWebSkill(t('home.diagramAnnotation2'))}</p>
             </FadeIn>
             <FadeIn delay={0.4} className="p-4 sm:p-5 rounded-2xl bg-surface  hover:border-accent/20 hover:bg-surface transition-all">
               <p className="text-[13px] sm:text-[14px] text-text-dim leading-relaxed">{highlightWebSkill(t('home.diagramAnnotation3'))}</p>
             </FadeIn>
          </div>

          {explanationTitle && (
            <div className="w-full max-w-3xl mx-auto mt-10 pt-8 relative z-10 text-left">
              <FadeIn delay={0.5}>
                <h3 className="text-[18px] sm:text-[20px] font-medium text-text-main mb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-accent" />
                  {explanationTitle}
                </h3>
                <p className="text-[13px] sm:text-[14px] text-text-dim mb-6 leading-relaxed">
                  {explanationIntro}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {explanationSteps.map((step: any, idx: number) => (
                    <div key={idx} className="bg-surface rounded-xl p-4 flex gap-3 hover:bg-surface-hover transition-all">
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[11px] font-bold text-accent shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[13px] sm:text-[14px] font-semibold text-text-main">{step.title}</span>
                        <span className="text-[12px] sm:text-[13px] text-text-dim leading-relaxed">{step.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>
          )}
        </div>
      </section>

      {/* Screen 5: WebSkill vs Backend Skill Table */}
      <section className="flex flex-col gap-6 md:gap-8">
        <div className="px-2 text-center max-w-3xl mx-auto mb-2 md:mb-4">
          <FadeIn>
            <h2 className="text-[26px] sm:text-[28px] md:text-[32px] font-medium tracking-tight mb-4">{t('home.comparisonTitle')}</h2>
            <p className="text-[14px] sm:text-[16px] text-text-dim leading-relaxed">
              {t('home.comparisonDesc')}
            </p>
          </FadeIn>
        </div>

        {/* Desktop View: Standard HTML Table */}
        <div className="hidden md:block">
          <FadeIn delay={0.1}>
            <div className="rounded-2xl bg-surface overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-color bg-black/40">
                    {compHeaders.map((h, i) => (
                      <th key={i} className={`p-5 text-[13px] font-mono uppercase tracking-wider ${i === 2 ? 'text-accent' : 'text-text-main'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color/50">
                  {compRows.map((row, i) => {
                    const RowIcon = [Database, Box, Network, RefreshCw, CloudUpload, Globe][i] || Cpu;
                    const BackendIcon = [Server, Box, Network, RefreshCw, CloudUpload, Globe][i] || Cpu;
                    const WebSkillIcon = [HardDrive, ShieldAlert, Lock, LayoutTemplate, MonitorPlay, UserCheck][i] || Cpu;
                    return (
                      <tr key={i} className="hover:bg-surface-hover transition-colors">
                        <td className="p-5 text-[14px] font-medium text-text-main w-[25%]">
                          <div className="flex items-center gap-2">
                            <RowIcon className="w-4 h-4 text-text-dim shrink-0" />
                            {row.feature}
                          </div>
                        </td>
                        <td className="p-5 text-[14px] text-text-dim w-[37.5%]">
                          <div className="flex items-start md:items-center gap-2 flex-col md:flex-row">
                            <BackendIcon className="w-4 h-4 text-text-dim/70 shrink-0 mt-0.5 md:mt-0" />
                            <span>{row.backend}</span>
                          </div>
                        </td>
                        <td className="p-5 text-[14px] text-accent/90 w-[37.5%] border-l border-accent/10 bg-accent/5">
                          <div className="flex items-start md:items-center gap-2 flex-col md:flex-row">
                            <WebSkillIcon className="w-4 h-4 text-accent/70 shrink-0 mt-0.5 md:mt-0" />
                            <span>{row.webskill}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>

        {/* Mobile View: Beautiful List Cards (Avoids horizontal scroll overflow) */}
        <div className="flex flex-col gap-4 md:hidden">
          {compRows.map((row, i) => {
            const RowIcon = [Database, Box, Network, RefreshCw, CloudUpload, Globe][i] || Cpu;
            const BackendIcon = [Server, Box, Network, RefreshCw, CloudUpload, Globe][i] || Cpu;
            const WebSkillIcon = [HardDrive, ShieldAlert, Lock, LayoutTemplate, MonitorPlay, UserCheck][i] || Cpu;
            return (
              <FadeIn key={i} delay={0.1 * (i % 3)}>
                <div className="rounded-2xl bg-surface overflow-hidden flex flex-col">
                  {/* Card Title Header */}
                  <div className="px-4 py-3.5 border-b border-border-color bg-black/40 flex items-center gap-2.5">
                    <RowIcon className="w-4 h-4 text-accent" />
                    <span className="text-[14px] font-medium text-text-main">{row.feature}</span>
                  </div>
                  {/* Details Stack */}
                  <div className="p-4 flex flex-col gap-4">
                    {/* Backend column */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-text-dim flex items-center gap-1.5">
                        <BackendIcon className="w-3.5 h-3.5" />
                        {compHeaders[1]}
                      </span>
                      <p className="text-[13px] text-text-dim leading-relaxed pl-5">
                        {row.backend}
                      </p>
                    </div>
                    {/* WebSkill column */}
                    <div className="flex flex-col gap-1 bg-accent/5 p-3 rounded-xl border border-accent/10">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-accent/80 flex items-center gap-1.5">
                        <WebSkillIcon className="w-3.5 h-3.5" />
                        {compHeaders[2]}
                      </span>
                      <p className="text-[13px] text-accent/90 leading-relaxed pl-5">
                        {row.webskill}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* Screen 6: Live Demo */}
      <section className="flex flex-col gap-8">
        <FadeIn>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
            <a href="/demo" className="flex items-center gap-3 px-6 py-4 bg-accent/10 border border-accent/30 text-accent rounded-full font-medium hover:bg-accent hover:text-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.15)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] shrink-0 w-full sm:w-auto justify-center">
              {t('home.demoBtnTitle')}
              <ArrowRight className="w-4 h-4" />
            </a>
            <span className="text-[12px] sm:text-[13px] text-text-dim font-mono bg-surface-hover px-3 py-2 rounded-lg text-center sm:whitespace-nowrap">
              {t('home.demoRemark')}
            </span>
          </div>
          <div className="rounded-3xl p-2 md:p-4 bg-gradient-to-br from-surface to-bg relative overflow-hidden group">
            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="rounded-2xl overflow-hidden bg-black/80 shadow-2xl relative z-10">
              <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-black/60 to-transparent pointer-events-none flex items-center px-4">
                 <div className="flex space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-border-color/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-border-color/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-border-color/80" />
                 </div>
              </div>
              <img src={imgSrc} alt="WebSkill Demo" className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>
        </FadeIn>
      </section>

    </div>
  );
}
