'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, CheckCircle2 } from 'lucide-react';

const WHATSAPP = 'https://wa.me/5541987164811';
const YACACODE_URL = 'https://yacacode.com';

const MEDIA = {
  hero: '/media/torres-brothers/supermarket-burnisher-machine.jpeg',
  servicesWash: '/media/torres-brothers/warehouse-auto-scrubber.jpeg',
  servicesPolish: '/media/torres-brothers/store-aisle-floor-scrubbing.jpeg',
  servicesFinish: '/media/torres-brothers/granilite-final-shine.jpeg',
  proofSplit: '/media/torres-brothers/granilite-before-after-split.jpeg',
  proofLabeled: '/media/torres-brothers/granilite-before-after-labeled.jpeg',
  proofLobby: '/media/torres-brothers/lobby-auto-scrubber.jpeg',
  cta: '/media/torres-brothers/food-court-auto-scrubber.jpeg',
  galleryProcess: '/media/torres-brothers/corridor-floor-polishing-process.jpeg',
  galleryHallway: '/media/torres-brothers/hallway-floor-scrubbing.jpeg',
  galleryMachine: '/media/torres-brothers/supermarket-burnisher-front.jpeg',
} as const;

const SERVICES = [
  {
    num: '01',
    title: 'Lavagem mecanizada',
    description:
      'Limpeza técnica para áreas amplas, corredores, salões e pisos de circulação intensa, com equipamento compatível com o tipo de superfície.',
    image: MEDIA.servicesWash,
    alt: 'Lavadora automática em operação sobre piso industrial.',
  },
  {
    num: '02',
    title: 'Polimento e recuperação de brilho',
    description:
      'Tratamento para devolver uniformidade visual, reflexo e sensação de ambiente bem cuidado em espaços comerciais e corporativos.',
    image: MEDIA.servicesPolish,
    alt: 'Politriz trabalhando em piso comercial com aplicação técnica.',
  },
  {
    num: '03',
    title: 'Acabamento sob medida para o piso',
    description:
      'Granilite, concreto e outras superfícies pedem processo certo. A abordagem muda conforme desgaste, uso diário e objetivo final do cliente.',
    image: MEDIA.servicesFinish,
    alt: 'Superfície polida com brilho homogêneo e acabamento final.',
  },
] as const;

const HIGHLIGHTS = [
  'Equipamentos para limpeza pesada, polimento e manutenção de acabamento.',
  'Atendimento para comércios, restaurantes, condomínios, clínicas e galpões.',
  'Execução com foco em organização, segurança e apresentação final do ambiente.',
  'Resultado visual perceptível, com tratamento pensado para o uso real da área.',
] as const;

const PROOF_CARDS = [
  {
    src: MEDIA.proofSplit,
    alt: 'Comparativo visual entre piso sem polimento e piso com polimento.',
    eyebrow: 'comparativo real',
    title: 'Superfície com e sem polimento.',
    chip: 'Antes e depois',
  },
  {
    src: MEDIA.proofLabeled,
    alt: 'Placa comparando superfície não polida e superfície polida.',
    eyebrow: 'leitura do acabamento',
    title: 'Evolução visível do brilho.',
    chip: 'Detalhe do brilho',
  },
  {
    src: MEDIA.proofLobby,
    alt: 'Lavadora automática trabalhando em área interna com piso brilhante.',
    eyebrow: 'operação em ambiente interno',
    title: 'Limpeza mecanizada em alto fluxo.',
    chip: 'Operação real',
  },
] as const;

const PROCESS_GALLERY = [
  {
    src: MEDIA.galleryProcess,
    alt: 'Processo de polimento em piso interno com máquina rotativa.',
    label: 'Polimento técnico',
  },
  {
    src: MEDIA.galleryHallway,
    alt: 'Lavagem localizada em área interna com máquina de piso.',
    label: 'Lavagem localizada',
  },
  {
    src: MEDIA.galleryMachine,
    alt: 'Equipamento profissional de polimento em ambiente comercial.',
    label: 'Equipamento profissional',
  },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay },
  }),
};

const TOTAL = 4;

function WhatsAppIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.03 2a9.88 9.88 0 0 0-8.58 14.77L2 22l5.4-1.41a9.86 9.86 0 0 0 4.63 1.18h.01A9.97 9.97 0 0 0 22 11.88a9.8 9.8 0 0 0-2.95-6.97Zm-7.02 15.19h-.01a8.17 8.17 0 0 1-4.16-1.14l-.3-.18-3.2.84.86-3.12-.2-.32a8.14 8.14 0 0 1-1.28-4.3A8.3 8.3 0 0 1 12.04 3.7a8.06 8.06 0 0 1 5.83 2.43 8.13 8.13 0 0 1 2.42 5.8 8.3 8.3 0 0 1-8.26 8.17Zm4.53-6.1c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.12-.56.12-.17.24-.64.8-.79.96-.15.17-.3.19-.56.07-.25-.13-1.08-.39-2.04-1.24-.75-.67-1.25-1.49-1.4-1.75-.15-.25-.02-.39.11-.51.12-.11.25-.29.38-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.77-1.83-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.43 1.02 2.6.13.17 1.77 2.7 4.29 3.78.6.26 1.08.42 1.45.53.61.19 1.16.16 1.6.1.49-.07 1.47-.6 1.68-1.17.21-.57.21-1.06.15-1.17-.06-.11-.23-.17-.48-.29Z" />
    </svg>
  );
}

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [isWhatsAppExpanded, setIsWhatsAppExpanded] = useState(false);
  const [activeProofCard, setActiveProofCard] = useState(0);
  const selectedProofCard = PROOF_CARDS[activeProofCard] ?? PROOF_CARDS[0];

  const scrollTo = (slide: number) => {
    const container = containerRef.current;
    if (!container) return;

    const nextSlide = Math.max(0, Math.min(TOTAL - 1, slide));
    container
      .querySelector<HTMLElement>(`[data-slide="${nextSlide}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setIdx(nextSlide);
  };

  const sectionBase = 'relative flex h-[100dvh] snap-start flex-col overflow-hidden';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sections = Array.from(
      container.querySelectorAll<HTMLElement>('[data-slide]'),
    );
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let nextIndex: number | null = null;
        let highestRatio = 0;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const slide = Number((entry.target as HTMLElement).dataset.slide);
          if (!Number.isFinite(slide)) continue;

          if (entry.intersectionRatio > highestRatio) {
            highestRatio = entry.intersectionRatio;
            nextIndex = slide;
          }
        }

        if (nextIndex === null) return;

        setIdx((current) => (current === nextIndex ? current : nextIndex));
      },
      {
        root: container,
        threshold: [0.3, 0.45, 0.6, 0.75, 0.9],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <main
      className="relative h-[100dvh] w-full overflow-hidden bg-[#060e0a]"
      style={{ backgroundColor: '#060e0a' }}
    >
      <div
        ref={containerRef}
        className="presentation-scrollbar h-[100dvh] snap-y snap-mandatory overflow-y-auto scroll-smooth"
      >
        <section data-slide="0" className={`${sectionBase} justify-end`}>
          <Image
            src={MEDIA.hero}
            alt=""
            fill
            preload
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(102deg, rgba(4,16,11,0.96) 0%, rgba(6,20,14,0.88) 38%, rgba(6,20,14,0.52) 68%, rgba(6,20,14,0.22) 100%)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 82% 10%, rgba(200,169,110,0.16) 0%, transparent 45%)',
            }}
          />

          <div className="relative z-10 flex h-full flex-col px-6 py-6 sm:px-12 sm:py-7 lg:px-20 lg:py-8">
            <motion.header
              variants={fadeUp}
              custom={0}
              initial="hidden"
              animate="visible"
              className="hidden md:flex md:items-center md:justify-between"
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[8px]"
                  style={{
                    border: '1px solid rgba(200,169,110,0.5)',
                    background: 'rgba(8,26,18,0.82)',
                    boxShadow: '0 0 28px rgba(200,169,110,0.18)',
                  }}
                >
                  <Image
                    src="/logo.png"
                    alt="Torres Brothers"
                    width={36}
                    height={36}
                    className="h-9 w-9 object-contain"
                    loading="eager"
                    fetchPriority="high"
                  />
                </div>
                <div>
                  <p
                    className="text-[1.7rem] font-bold uppercase leading-[1.06] tracking-wide text-[#f3e6cb]"
                    style={{ fontFamily: 'var(--font-amiri)' }}
                  >
                    Torres Brothers
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <div style={{ width: 16, height: 1, backgroundColor: '#c8a96e' }} />
                    <span className="text-[0.62rem] uppercase tracking-[0.3em] text-[#c8a96e]">
                      Limpeza e revitalização de pisos
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[8px] border border-[#c8a96e]/55 bg-[#c8a96e] px-5 py-2.5 text-sm font-semibold text-[#0b2416] shadow-[0_0_22px_rgba(200,169,110,0.28)] transition hover:scale-[1.03]"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                <WhatsAppIcon className="h-4 w-4" />
                Solicitar orçamento
              </Link>
            </motion.header>

            <motion.div
              variants={fadeUp}
              custom={0}
              initial="hidden"
              animate="visible"
              className="flex flex-1 flex-col items-center justify-center gap-4 text-center md:hidden"
            >
              <div
                className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[10px]"
                style={{
                  border: '1px solid rgba(200,169,110,0.5)',
                  background: 'rgba(8,26,18,0.82)',
                  boxShadow: '0 0 28px rgba(200,169,110,0.18)',
                }}
              >
                <Image
                  src="/logo.png"
                  alt="Torres Brothers"
                  width={36}
                  height={36}
                  className="h-12 w-12 object-contain"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
              <div>
                <p
                  className="text-[1.95rem] font-bold uppercase leading-[1.06] tracking-wide text-[#f3e6cb] sm:text-[2.1rem]"
                  style={{ fontFamily: 'var(--font-amiri)' }}
                >
                  Torres Brothers
                </p>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <div style={{ width: 16, height: 1, backgroundColor: '#c8a96e' }} />
                  <span className="text-[0.72rem] uppercase tracking-[0.2em] text-[#c8a96e] sm:text-[0.76rem] sm:tracking-[0.24em]">
                    Limpeza e revitalização de pisos
                  </span>
                </div>
              </div>
            </motion.div>

            <div className="max-w-3xl pb-8 sm:pb-12 md:mt-auto md:pt-10">
              <motion.span
                variants={fadeUp}
                custom={0.18}
                initial="hidden"
                animate="visible"
                className="inline-block border border-[#c8a96e]/45 bg-[#c8a96e]/10 px-4 py-1.5 text-[0.72rem] uppercase tracking-[0.24em] text-[#e3c78b]"
                style={{ borderRadius: 8 }}
              >
                Lavagem técnica, polimento e acabamento profissional
              </motion.span>

              <motion.h1
                variants={fadeUp}
                custom={0.28}
                initial="hidden"
                animate="visible"
                className="mt-4 text-[clamp(1.72rem,5.6vw,4.85rem)] leading-[1.02] text-[#f9f4ea] sm:mt-5"
                style={{ fontFamily: 'var(--font-amiri)' }}
              >
                Pisos bem cuidados valorizam o ambiente antes mesmo do primeiro atendimento.
              </motion.h1>

              <motion.div
                variants={fadeUp}
                custom={0.38}
                initial="hidden"
                animate="visible"
                className="my-4 flex items-center gap-4 sm:my-5"
              >
                <div style={{ width: 52, height: 1.5, backgroundColor: '#c8a96e', borderRadius: 1 }} />
                <span className="text-sm text-[#d7e6de]/85">Curitiba e região</span>
              </motion.div>

              <motion.p
                variants={fadeUp}
                custom={0.44}
                initial="hidden"
                animate="visible"
                className="max-w-2xl text-base leading-relaxed text-[#d8ece4]/88 sm:text-lg"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                A Torres Brothers atua em espaços comerciais, corporativos e de alto fluxo com
                processo mecanizado, leitura técnica da superfície e acabamento pensado para o uso
                real de cada área.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={0.52}
                initial="hidden"
                animate="visible"
                className="mt-6 hidden flex-wrap gap-2 2xl:flex"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {['Lavagem mecanizada', 'Polimento', 'Recuperação de brilho', 'Tratamento de pisos'].map((item) => (
                  <span
                    key={item}
                    className="border border-white/14 bg-black/18 px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.16em] text-[#e7efe9]"
                    style={{ borderRadius: 8 }}
                  >
                    {item}
                  </span>
                ))}
              </motion.div>

              <motion.div
                variants={fadeUp}
                custom={0.6}
                initial="hidden"
                animate="visible"
                className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row"
              >
                <Link
                  href={WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#c8a96e] px-7 py-4 text-sm font-semibold text-[#0b2416] shadow-[0_0_30px_rgba(200,169,110,0.35)] transition hover:scale-[1.02] active:scale-100 sm:w-auto"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Falar com especialista
                </Link>
                <button
                  onClick={() => scrollTo(1)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] border border-[#c8a96e]/45 bg-white/6 px-7 py-4 text-sm font-semibold text-[#f8f3e8] backdrop-blur-sm transition hover:border-[#c8a96e] hover:bg-white/10 sm:w-auto"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  Ver serviços
                  <ArrowDown className="h-4 w-4" />
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        <section
          data-slide="1"
          className={`${sectionBase} items-center justify-center bg-[#071610]`}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(200,169,110,0.08) 0%, transparent 58%)',
            }}
          />

          <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col justify-center px-6 py-6 sm:px-12 sm:py-8 lg:px-20 lg:py-10">
            <motion.div
              variants={fadeUp}
              custom={0}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="mb-5 max-w-3xl md:mb-7"
            >
              <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#c8a96e]">O que a empresa entrega</p>
              <h2
                className="mt-2 text-[clamp(1.9rem,4.6vw,3.8rem)] leading-tight text-[#f8f3e8]"
                style={{ fontFamily: 'var(--font-amiri)' }}
              >
                Serviço certo para cada piso, com imagem real de resultado.
              </h2>
              <p
                className="mt-4 max-w-2xl text-base leading-relaxed text-[#b6d4c4]/88"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                O foco não é apenas limpar. É entregar um piso que suporte a rotina, comunique
                cuidado e mantenha boa apresentação em ambientes de trabalho, venda ou circulação
                intensa.
              </p>
            </motion.div>

            <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory touch-pan-x gap-4 overflow-x-auto px-6 pb-2 overscroll-x-contain sm:-mx-12 sm:px-12 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:snap-none md:overflow-visible md:px-0 md:pb-0">
              {SERVICES.map((service, index) => (
                <motion.article
                  key={service.num}
                  variants={fadeUp}
                  custom={index * 0.1}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.18 }}
                  className="group flex w-[78vw] shrink-0 snap-center flex-col overflow-hidden border border-[#c8a96e]/22 bg-[#0b2418] shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:w-[58vw] md:w-auto md:shrink"
                  style={{ borderRadius: 8 }}
                >
                  <div className="relative aspect-[4/2.9] overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.alt}
                      fill
                      sizes="(max-width: 768px) 82vw, (max-width: 1024px) 62vw, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: 'linear-gradient(180deg, rgba(7,22,16,0.08) 0%, rgba(7,22,16,0.6) 100%)',
                      }}
                    />
                    <span
                      className="absolute left-4 top-4 border border-[#c8a96e]/35 bg-[#071610]/70 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#f3dbab]"
                      style={{ borderRadius: 8, fontFamily: 'var(--font-dm-sans)' }}
                    >
                      {service.num}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-4 md:p-5">
                    <h3
                      className="text-[1.22rem] leading-snug text-[#f8f3e8] md:text-[1.45rem]"
                      style={{ fontFamily: 'var(--font-amiri)' }}
                    >
                      {service.title}
                    </h3>
                    <p
                      className="mt-2.5 flex-1 text-sm leading-relaxed text-[#a8c8b8]/88"
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    >
                      {service.description}
                    </p>
                    <Link
                      href={WHATSAPP}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#c8a96e] transition-all hover:gap-3"
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    >
                      Solicitar avaliação
                      <ArrowDown className="h-3.5 w-3.5 rotate-[-90deg]" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>

            <p className="mt-2 text-center text-[0.65rem] uppercase tracking-[0.18em] text-[#c8a96e]/50 md:hidden">
              deslize para ver os serviços
            </p>
          </div>
        </section>

        <section
          data-slide="2"
          className={`${sectionBase} justify-center bg-[#060f0b]`}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 78% 14%, rgba(200,169,110,0.1) 0%, transparent 48%)',
            }}
          />

          <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col justify-center px-6 py-6 sm:px-12 sm:py-8 lg:px-20 lg:py-10">
            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-8">
              <motion.div
                variants={fadeUp}
                custom={0}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
              >
                <p className="mb-3 text-[0.72rem] uppercase tracking-[0.28em] text-[#c8a96e]">
                  Resultado que aparece
                </p>
                <h2
                  className="text-[clamp(1.85rem,4.2vw,3.55rem)] leading-tight text-[#f8f3e8]"
                  style={{ fontFamily: 'var(--font-amiri)' }}
                >
                  Antes, durante e depois com processo técnico de verdade.
                </h2>

                <div className="my-5" style={{ width: 52, height: 1.5, backgroundColor: '#c8a96e', borderRadius: 1 }} />

                <p
                  className="max-w-xl text-base leading-relaxed text-[#b8d5c4]/90"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  Cada atendimento combina análise da superfície, escolha correta do equipamento e
                  acabamento pensado para o uso diário do ambiente.
                </p>

                <ul className="mt-5 space-y-3">
                  {HIGHLIGHTS.map((item, index) => (
                    <li key={item} className={index === 3 ? 'hidden items-start gap-3 sm:flex' : 'flex items-start gap-3'}>
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#c8a96e]" />
                      <span
                        className="text-sm leading-relaxed text-[#ddf0e6] sm:text-base"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Link
                    href={WHATSAPP}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#c8a96e] px-7 py-4 text-sm font-semibold text-[#0b2416] shadow-[0_0_28px_rgba(200,169,110,0.3)] transition hover:scale-[1.02] sm:w-auto"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Solicitar visita técnica
                  </Link>
                </div>
              </motion.div>

              <motion.div
                variants={fadeUp}
                custom={0.12}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.18 }}
                className="lg:h-[29rem] xl:h-[31rem]"
              >
                <div className="lg:hidden">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p
                      className="text-[0.66rem] uppercase tracking-[0.2em] text-[#dcbf86]"
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    >
                      provas visuais
                    </p>
                    <p
                      className="text-[0.62rem] uppercase tracking-[0.16em] text-[#8fb3a3]"
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    >
                      toque para alternar
                    </p>
                  </div>

                  <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
                    {PROOF_CARDS.map((item, index) => {
                      const isActive = index === activeProofCard;

                      return (
                        <button
                          key={item.title}
                          type="button"
                          onClick={() => setActiveProofCard(index)}
                          className="shrink-0 rounded-full border px-3 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] transition"
                          style={{
                            fontFamily: 'var(--font-dm-sans)',
                            borderColor: isActive ? 'rgba(200,169,110,0.65)' : 'rgba(255,255,255,0.18)',
                            color: isActive ? '#f3dbab' : '#bdd7cb',
                            backgroundColor: isActive ? 'rgba(200,169,110,0.16)' : 'rgba(9,27,19,0.68)',
                          }}
                        >
                          {item.chip}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className="relative overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
                    style={{ borderRadius: 8 }}
                  >
                    <div className="relative aspect-[16/11]">
                      <Image
                        src={selectedProofCard.src}
                        alt={selectedProofCard.alt}
                        fill
                        sizes="100vw"
                        className="object-cover"
                      />
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{ background: 'linear-gradient(180deg, rgba(7,22,16,0.04) 20%, rgba(7,22,16,0.66) 100%)' }}
                      />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p
                          className="text-[0.66rem] uppercase tracking-[0.18em] text-[#dcbf86]"
                          style={{ fontFamily: 'var(--font-dm-sans)' }}
                        >
                          {selectedProofCard.eyebrow}
                        </p>
                        <p
                          className="mt-1 text-[1.42rem] leading-tight text-[#f8f3e8]"
                          style={{ fontFamily: 'var(--font-amiri)' }}
                        >
                          {selectedProofCard.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden gap-3 lg:grid lg:h-full lg:grid-cols-2 lg:grid-rows-[1.12fr_0.88fr]">
                  <div
                    data-proof-desktop-card="split"
                    className="relative h-full overflow-hidden border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.24)] lg:row-span-2"
                    style={{ borderRadius: 8 }}
                  >
                    <Image
                      src={MEDIA.proofSplit}
                      alt="Comparativo visual entre piso sem polimento e piso com polimento."
                      fill
                      sizes="40vw"
                      className="object-cover object-bottom"
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{ background: 'linear-gradient(180deg, rgba(7,22,16,0.05) 20%, rgba(7,22,16,0.62) 100%)' }}
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p
                        className="text-[0.68rem] uppercase tracking-[0.18em] text-[#dcbf86]"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                      >
                        comparativo real
                      </p>
                      <p
                        className="mt-1 text-lg leading-tight text-[#f8f3e8]"
                        style={{ fontFamily: 'var(--font-amiri)' }}
                      >
                        Superfície com e sem polimento.
                      </p>
                    </div>
                  </div>

                  <div
                    data-proof-desktop-card="labeled"
                    className="relative h-full overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
                    style={{ borderRadius: 8 }}
                  >
                    <Image
                      src={MEDIA.proofLabeled}
                      alt="Placa comparando superfície não polida e superfície polida."
                      fill
                      sizes="26vw"
                      className="object-cover object-bottom"
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{ background: 'linear-gradient(180deg, rgba(7,22,16,0.02) 30%, rgba(7,22,16,0.58) 100%)' }}
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p
                        className="text-[0.68rem] uppercase tracking-[0.18em] text-[#dcbf86]"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                      >
                        leitura do acabamento
                      </p>
                      <p
                        className="mt-1 text-lg leading-tight text-[#f8f3e8]"
                        style={{ fontFamily: 'var(--font-amiri)' }}
                      >
                        Evolução visível do brilho.
                      </p>
                    </div>
                  </div>

                  <div
                    data-proof-desktop-card="lobby"
                    className="relative h-full overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
                    style={{ borderRadius: 8 }}
                  >
                    <Image
                      src={MEDIA.proofLobby}
                      alt="Lavadora automática trabalhando em área interna com piso brilhante."
                      fill
                      sizes="26vw"
                      className="object-cover"
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{ background: 'linear-gradient(180deg, rgba(7,22,16,0.05) 10%, rgba(7,22,16,0.62) 100%)' }}
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p
                        className="text-[0.68rem] uppercase tracking-[0.18em] text-[#dcbf86]"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                      >
                        operação em ambiente interno
                      </p>
                      <p
                        className="mt-1 text-lg leading-tight text-[#f8f3e8]"
                        style={{ fontFamily: 'var(--font-amiri)' }}
                      >
                        Limpeza mecanizada em alto fluxo.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section data-slide="3" className={`${sectionBase} justify-center`}>
          <Image
            src={MEDIA.cta}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[center_25%]"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(5,14,10,0.88) 0%, rgba(5,14,10,0.8) 36%, rgba(5,14,10,0.9) 100%)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 28%, rgba(200,169,110,0.1) 0%, transparent 55%)',
            }}
          />

          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-6 py-5 sm:px-10 sm:py-6 lg:px-20 lg:py-7"
          >
            <div className="grid min-h-0 grow items-center gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:gap-7">
            <div className="text-center lg:text-left">
              <div className="mb-4 flex flex-col items-center gap-3 lg:items-start">
                <div
                  className="flex h-[58px] w-[58px] items-center justify-center border border-[#c8a96e]/55 bg-[rgba(10,32,22,0.78)] sm:h-[68px] sm:w-[68px]"
                  style={{ borderRadius: 8, boxShadow: '0 0 36px rgba(200,169,110,0.22)' }}
                >
                  <Image
                    src="/logo.png"
                    alt="Torres Brothers"
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain sm:h-12 sm:w-12"
                  />
                </div>
                <div>
                  <p
                    className="text-[1.75rem] font-bold uppercase leading-none tracking-wide text-[#f3e6cb] sm:text-[1.9rem]"
                    style={{ fontFamily: 'var(--font-amiri)' }}
                  >
                    Torres Brothers
                  </p>
                  <div className="mx-auto mt-3 h-[1.5px] w-11 rounded-full bg-[#c8a96e] lg:mx-0" />
                </div>
              </div>

              <p
                className="text-[0.72rem] uppercase tracking-[0.28em] text-[#d9c089]"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                Orçamento e visita técnica
              </p>
              <h2
                className="mx-auto mt-2 max-w-2xl text-[clamp(1.85rem,4vw,3.15rem)] leading-tight text-[#f9f2e4] lg:mx-0"
                style={{ fontFamily: 'var(--font-amiri)' }}
              >
                Seu piso pode comunicar mais cuidado, mais limpeza e mais padrão logo na entrada.
              </h2>

              <p
                className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#c2ddd0]/90 sm:text-base lg:mx-0"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                Chame no WhatsApp para avaliar o melhor tratamento para o ambiente. A recomendação
                leva em conta o tipo de piso, o desgaste atual e a rotina da área.
              </p>

              <div className="mt-5 hidden flex-wrap justify-center gap-2 xl:flex xl:justify-start" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {['Comercial', 'Corporativo', 'Restaurantes', 'Condomínios', 'Galpões'].map((item) => (
                  <span
                    key={item}
                    className="border border-white/14 bg-black/16 px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.16em] text-[#eef6f1]"
                    style={{ borderRadius: 8 }}
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-5">
                <Link
                  href={WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#c8a96e] px-9 py-4 text-base font-semibold text-[#0b2416] shadow-[0_0_40px_rgba(200,169,110,0.34)] transition hover:scale-[1.03] active:scale-100 sm:w-auto"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Chamar no WhatsApp
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div
                className="relative overflow-hidden border border-white/10 bg-black/14 shadow-[0_20px_60px_rgba(0,0,0,0.22)] sm:col-span-2"
                style={{ borderRadius: 8 }}
              >
                <div className="relative aspect-[16/8.5] sm:aspect-[16/7]">
                  <Image
                    src={MEDIA.cta}
                    alt="Limpeza mecanizada em área interna com acabamento uniforme."
                    fill
                    sizes="(max-width: 640px) 100vw, 52vw"
                    className="object-cover object-[center_25%]"
                  />
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: 'linear-gradient(180deg, rgba(7,22,16,0.04) 10%, rgba(7,22,16,0.62) 100%)' }}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p
                      className="text-[0.66rem] uppercase tracking-[0.18em] text-[#dcbf86]"
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    >
                      atendimento em campo
                    </p>
                    <p
                      className="mt-1 text-lg leading-tight text-[#f8f3e8]"
                      style={{ fontFamily: 'var(--font-amiri)' }}
                    >
                      Equipe, equipamento certo e acabamento pensado para a rotina.
                    </p>
                  </div>
                </div>
              </div>

              {PROCESS_GALLERY.slice(0, 2).map((item) => (
                <div
                  key={item.label}
                  className="relative hidden overflow-hidden border border-white/10 bg-black/14 shadow-[0_20px_60px_rgba(0,0,0,0.22)] sm:block"
                  style={{ borderRadius: 8 }}
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      sizes="26vw"
                      className="object-cover"
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: 'linear-gradient(180deg, rgba(7,22,16,0.04) 20%, rgba(7,22,16,0.64) 100%)',
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <p
                        className="text-[0.66rem] uppercase tracking-[0.18em] text-[#dcbf86]"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                      >
                        {item.label}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>

            <footer
              className="mt-4 border-t border-white/10 bg-black/16 px-4 py-4 backdrop-blur-sm sm:px-5"
              style={{ borderRadius: 8 }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1.5 text-center lg:text-left">
                  <p
                    className="text-[0.72rem] uppercase tracking-[0.2em] text-[#e8d8af]"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    Torres Brothers
                  </p>
                  <p
                    className="text-sm text-[#8fb3a3]"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    Curitiba e região · Atendimento sob agendamento
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3 lg:items-end">
                  <Link
                    href={WHATSAPP}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#dfeee8] transition hover:text-[#f3dbab]"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    WhatsApp comercial
                  </Link>

                  <Link
                    href={YACACODE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-[8px] border border-[#c8a96e]/25 bg-[#0e2018]/72 px-3 py-2 text-sm text-[#d7ebe2] transition hover:border-[#c8a96e]/55 hover:bg-[#11281d]"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    <span className="text-[#8fb3a3]">Desenvolvido por</span>
                    <span className="font-semibold text-[#f3dbab]">YacaCode</span>
                  </Link>
                </div>
              </div>
            </footer>
          </motion.div>
        </section>
      </div>

      <div className="pointer-events-none fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 rounded-[10px] border border-white/12 bg-[#0b1f17] px-2.5 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] md:flex md:flex-col md:gap-3">
        {Array.from({ length: TOTAL }).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            aria-label={`Slide ${index + 1}`}
            className="pointer-events-auto block transition-all duration-300"
            style={{
              width: 7,
              height: index === idx ? 28 : 7,
              borderRadius: 9999,
              background: index === idx ? '#c8a96e' : '#64706a',
              backgroundColor: index === idx ? '#c8a96e' : '#64706a',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              opacity: 1,
              appearance: 'none',
              WebkitAppearance: 'none',
              boxShadow: index === idx ? '0 0 0 1px rgba(200,169,110,0.2), 0 0 18px rgba(200,169,110,0.25)' : 'none',
            }}
          />
        ))}
      </div>

      <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/12 bg-[#0b1f17] px-3 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.24)] md:hidden">
        {Array.from({ length: TOTAL }).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            aria-label={`Slide ${index + 1}`}
            className="pointer-events-auto transition-all duration-300"
            style={{
              width: index === idx ? 20 : 6,
              height: 6,
              borderRadius: 9999,
              background: index === idx ? '#c8a96e' : '#64706a',
              backgroundColor: index === idx ? '#c8a96e' : '#64706a',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              opacity: 1,
              appearance: 'none',
              WebkitAppearance: 'none',
              boxShadow: index === idx ? '0 0 0 1px rgba(200,169,110,0.2), 0 0 14px rgba(200,169,110,0.22)' : 'none',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="pointer-events-none fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6"
      >
        <Link
          href={WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar no WhatsApp"
          onMouseEnter={() => setIsWhatsAppExpanded(true)}
          onMouseLeave={() => setIsWhatsAppExpanded(false)}
          onFocus={() => setIsWhatsAppExpanded(true)}
          onBlur={() => setIsWhatsAppExpanded(false)}
          className={`group pointer-events-auto inline-flex h-14 w-14 items-center justify-center overflow-hidden bg-[#25D366] text-white shadow-[0_14px_32px_rgba(18,97,47,0.28)] transition-[width,transform,box-shadow] duration-300 hover:translate-y-[-1px] hover:shadow-[0_18px_40px_rgba(18,97,47,0.36)] sm:justify-start ${isWhatsAppExpanded ? 'sm:w-[246px]' : 'sm:w-14'}`}
          style={{ borderRadius: 9999, fontFamily: 'var(--font-dm-sans)' }}
        >
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center text-white">
            <WhatsAppIcon className="h-8 w-8" />
          </span>
          <span className={`hidden whitespace-nowrap pr-5 text-[0.98rem] font-semibold tracking-[-0.01em] text-white transition-opacity duration-200 sm:block ${isWhatsAppExpanded ? 'sm:opacity-100' : 'sm:opacity-0'}`}>
            Fale no WhatsApp
          </span>
          <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/8 ring-inset" />
          <span className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_48%)]" />
          <span className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" />
          <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12)_0%,transparent_42%)]" />
          <span className="sr-only">
            Fale no WhatsApp
          </span>
        </Link>
      </motion.div>
    </main>
  );
}
