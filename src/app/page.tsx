'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Factory,
  Gem,
  Landmark,
  Mail,
  MessageCircle,
  Scale,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';

const whatsappHref = 'https://wa.me/5541987164811';

export default function HomePage() {
  const slides = useMemo(() => ['hero', 'about', 'solutions', 'consulting', 'segments', 'cta'], []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToSlide = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    const target = container.querySelector<HTMLElement>(`[data-slide-index='${clamped}']`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveIndex(clamped);
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#081f18] text-white">
      <div
        ref={containerRef}
        onScroll={(event) => {
          const element = event.currentTarget;
          const nextIndex = Math.round(element.scrollTop / Math.max(element.clientHeight, 1));
          if (nextIndex !== activeIndex) setActiveIndex(nextIndex);
        }}
        className="presentation-scrollbar h-screen snap-y snap-mandatory overflow-y-auto scroll-smooth"
      >
        <section
          data-slide-index={0}
          className="relative flex min-h-screen snap-start items-center justify-center overflow-hidden px-4 py-16 sm:px-8"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(8,31,24,.88), rgba(15,61,46,.82), rgba(8,31,24,.88)), url('https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1920&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,.20),transparent_35%)]" />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div>
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-[#d4af37]/45 bg-[#0f3d2e]/45 px-4 py-2 backdrop-blur">
                <img src="/logo.png" alt="Torres-Brothers" className="h-7 w-auto" />
                <span className="text-xs font-semibold tracking-[0.2em] text-[#f4df9c]">TORRES-BROTHERS</span>
              </div>

              <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
                Transforme a gestão da sua empresa com contabilidade consultiva premium
              </h1>

              <p className="mt-6 max-w-2xl text-base text-white/82 sm:text-lg">
                Uma experiência institucional moderna, estratégica e orientada a crescimento para empresas que
                valorizam clareza financeira, governança e decisões com inteligência de dados.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-6 py-3 text-sm font-semibold text-[#0f3d2e] shadow-[0_0_32px_rgba(212,175,55,.35)] transition hover:bg-[#e4c761]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Agende uma consulta gratuita
                </Link>
                <button
                  onClick={() => scrollToSlide(1)}
                  className="inline-flex items-center justify-center rounded-xl border border-white/35 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                >
                  Conheça nossa metodologia
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-[#d4af37]/35 bg-white/8 p-6 shadow-2xl backdrop-blur-md sm:p-8">
              <h2 className="text-lg font-semibold text-[#f4df9c]">Consultoria que gera resultado</h2>
              <div className="mt-5 grid gap-3">
                {[
                  'Estratégia financeira orientada por indicadores',
                  'Apoio decisório para crescimento sustentável',
                  'Governança e organização empresarial de alto nível',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl border border-white/15 bg-black/20 p-3">
                    <Gem className="mt-0.5 h-4 w-4 shrink-0 text-[#d4af37]" />
                    <p className="text-sm text-white/90">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section
          data-slide-index={1}
          className="relative flex min-h-screen snap-start items-center justify-center overflow-hidden px-4 py-16 sm:px-8"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(10,34,26,.95), rgba(10,34,26,.90)), url('https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]"
          >
            <div>
              <h2 className="text-3xl font-bold text-[#f4df9c] sm:text-4xl">Sobre nós</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    title: 'Missão',
                    desc: 'Transformar dados financeiros em estratégia empresarial de alto impacto.',
                    icon: <Target className="h-5 w-5 text-[#d4af37]" />,
                  },
                  {
                    title: 'Visão',
                    desc: 'Ser referência nacional em contabilidade consultiva para empresas em expansão.',
                    icon: <TrendingUp className="h-5 w-5 text-[#d4af37]" />,
                  },
                  {
                    title: 'Valores',
                    desc: 'Ética, precisão, proximidade e compromisso absoluto com o resultado do cliente.',
                    icon: <ShieldCheck className="h-5 w-5 text-[#d4af37]" />,
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/15 bg-white/6 p-4 backdrop-blur-sm">
                    {item.icon}
                    <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-white/78">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/55 bg-[#d4af37]/12 px-4 py-2 text-sm text-[#f6e3a8]">
                <BadgeCheck className="h-4 w-4" />
                Certificação de Excelência SEBRAE
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-[#d4af37]/35 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80"
                alt="Equipe corporativa em reunião"
                className="h-[360px] w-full object-cover sm:h-[420px]"
              />
            </div>
          </motion.div>
        </section>

        <section
          data-slide-index={2}
          className="relative flex min-h-screen snap-start items-center justify-center overflow-hidden bg-gradient-to-br from-[#0d3024] via-[#0a261d] to-[#081e17] px-4 py-16 sm:px-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="mx-auto w-full max-w-6xl"
          >
            <h2 className="text-center text-3xl font-bold text-[#f4df9c] sm:text-4xl">Nossas Soluções Contábeis</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { title: 'Gestão de RH', icon: <Users className="h-5 w-5 text-[#d4af37]" /> },
                { title: 'Gestão Patrimonial', icon: <Landmark className="h-5 w-5 text-[#d4af37]" /> },
                { title: 'Gestão Societária', icon: <Building2 className="h-5 w-5 text-[#d4af37]" /> },
                { title: 'Gestão Fiscal', icon: <Scale className="h-5 w-5 text-[#d4af37]" /> },
                { title: 'Valuation', icon: <BarChart3 className="h-5 w-5 text-[#d4af37]" /> },
              ].map((card) => (
                <div
                  key={card.title}
                  className="group rounded-2xl border border-white/12 bg-white/6 p-5 backdrop-blur-sm transition hover:-translate-y-1 hover:border-[#d4af37]/60 hover:shadow-[0_0_26px_rgba(212,175,55,.18)]"
                >
                  <div className="mb-3 inline-flex rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 p-2">{card.icon}</div>
                  <h3 className="text-base font-semibold text-white">{card.title}</h3>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section
          data-slide-index={3}
          className="relative flex min-h-screen snap-start items-center justify-center overflow-hidden px-4 py-16 sm:px-8"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(8,27,20,.94), rgba(8,27,20,.90)), url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 backdrop-blur-[1.5px]" />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="relative mx-auto w-full max-w-6xl"
          >
            <h2 className="text-3xl font-bold text-[#f4df9c] sm:text-4xl">Contabilidade Consultiva</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                'Consultoria estratégica empresarial',
                'Planejamento de negócios detalhado',
                'Diagnóstico empresarial completo',
                'Análise de desempenho avançada',
                'Planejamento tributário e orçamentário',
                'Modelagem e redesenho de processos',
                'Gestão de margens e lucratividade',
              ].map((service) => (
                <div key={service} className="rounded-xl border border-[#d4af37]/35 bg-black/30 p-4">
                  <div className="mb-2 h-px w-14 bg-[#d4af37]/70" />
                  <p className="text-sm text-white/90">{service}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section
          data-slide-index={4}
          className="relative flex min-h-screen snap-start items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f3d2e] via-[#0d3327] to-[#0a261e] px-4 py-16 sm:px-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="mx-auto w-full max-w-5xl"
          >
            <h2 className="text-center text-3xl font-bold text-[#f4df9c] sm:text-4xl">Atendemos empresas</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { title: 'Comércio', icon: <BriefcaseBusiness className="h-6 w-6 text-[#d4af37]" /> },
                { title: 'Indústria', icon: <Factory className="h-6 w-6 text-[#d4af37]" /> },
                { title: 'Serviços', icon: <Building2 className="h-6 w-6 text-[#d4af37]" /> },
              ].map((segment) => (
                <div
                  key={segment.title}
                  className="rounded-2xl border border-white/15 bg-white/8 p-6 text-center backdrop-blur-sm"
                >
                  <div className="mx-auto inline-flex rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/10 p-3">{segment.icon}</div>
                  <h3 className="mt-4 text-lg font-semibold">{segment.title}</h3>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section
          data-slide-index={5}
          className="relative flex min-h-screen snap-start items-center justify-center overflow-hidden px-4 py-16 sm:px-8"
          style={{
            backgroundImage:
              "linear-gradient(130deg, rgba(8,31,24,.90), rgba(15,61,46,.84), rgba(8,31,24,.92)), url('https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1920&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="mx-auto w-full max-w-4xl rounded-3xl border border-[#d4af37]/40 bg-black/35 p-8 text-center shadow-2xl backdrop-blur-md sm:p-12"
          >
            <h2 className="text-3xl font-bold text-[#f4df9c] sm:text-4xl">Pronto para transformar sua gestão?</h2>
            <p className="mt-4 text-white/82">
              Eleve sua tomada de decisão com uma estrutura consultiva que integra estratégia, performance e visão de crescimento.
            </p>

            <div className="mt-7">
              <Link
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-7 py-3 text-base font-semibold text-[#0f3d2e] shadow-[0_0_30px_rgba(212,175,55,.35)] transition hover:bg-[#e4c761]"
              >
                <MessageCircle className="h-5 w-5" />
                Agendar consulta gratuita
              </Link>
            </div>

            <div className="mt-7 space-y-2 text-sm text-white/85">
              <p>
                Site: <span className="font-semibold text-[#f4df9c]">torres-brothers.vercel.app</span>
              </p>
              <p className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#d4af37]" />
                contato@torres-brothers.com.br
              </p>
            </div>
          </motion.div>
        </section>
      </div>

      <div className="pointer-events-none fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 md:flex md:flex-col md:gap-2">
        <button
          onClick={() => scrollToSlide(activeIndex - 1)}
          className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur transition hover:border-[#d4af37]/70 hover:text-[#f4df9c]"
          aria-label="Slide anterior"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => scrollToSlide(activeIndex + 1)}
          className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur transition hover:border-[#d4af37]/70 hover:text-[#f4df9c]"
          aria-label="Próximo slide"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="pointer-events-none fixed bottom-4 right-4 z-30 flex items-center gap-2 md:hidden">
        <button
          onClick={() => scrollToSlide(activeIndex - 1)}
          className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur transition hover:border-[#d4af37]/70 hover:text-[#f4df9c]"
          aria-label="Slide anterior"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => scrollToSlide(activeIndex + 1)}
          className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur transition hover:border-[#d4af37]/70 hover:text-[#f4df9c]"
          aria-label="Próximo slide"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </main>
  );
}
