'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUp, CheckCircle2, MessageCircle } from 'lucide-react';

const WHATSAPP = 'https://wa.me/5541987164811';

/* ── Imagens Unsplash (pisos, limpeza, ambientes comerciais) ── */
const IMG = {
  hero:  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&auto=format&fit=crop&q=85',
  s1:    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80',
  s2:    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&auto=format&fit=crop&q=80',
  s3:    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
  about: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1400&auto=format&fit=crop&q=80',
};

const SERVICES = [
  {
    num: '01',
    title: 'Lavagem Mecanizada',
    description: 'Limpeza profunda com esfregadeira automática para galpões, depósitos e grandes áreas comerciais.',
    image: IMG.s1,
  },
  {
    num: '02',
    title: 'Enceramento & Polimento',
    description: 'Politriz de alta rotação para pisos comerciais: brilho intenso, proteção durável e acabamento premium.',
    image: IMG.s2,
  },
  {
    num: '03',
    title: 'Tratamento Especializado',
    description: 'Cerâmica, porcelanato, vinílico ou concreto — técnica e produto certos para cada tipo de piso.',
    image: IMG.s3,
  },
] as const;

const DIFERENCIAIS = [
  'Equipe treinada e pontual',
  'Equipamentos profissionais de alto rendimento',
  'Produtos adequados para cada tipo de piso',
  'Acabamento limpo e elegante para ambientes corporativos',
];

/* ── Framer variants ─────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay: d } }),
};

const OVERLAY_HERO =
  'linear-gradient(108deg, rgba(6,20,14,0.97) 0%, rgba(8,26,18,0.88) 42%, rgba(8,26,18,0.48) 68%, rgba(6,20,14,0.15) 100%)';

const TOTAL = 4;

/* ════════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  const scrollTo = (i: number) => {
    const c = containerRef.current;
    if (!c) return;
    const n = Math.max(0, Math.min(TOTAL - 1, i));
    c.querySelector<HTMLElement>(`[data-slide="${n}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setIdx(n);
  };

  const sBase =
    'relative flex min-h-screen snap-start flex-col overflow-hidden';

  return (
    <main
      className="relative h-screen w-full overflow-hidden"
      style={{ backgroundColor: '#060e0a' }}
    >
      {/* ── Scrollable snap container ── */}
      <div
        ref={containerRef}
        className="presentation-scrollbar h-screen snap-y snap-mandatory overflow-y-auto scroll-smooth"
        onScroll={(e) => {
          const el = e.currentTarget;
          const n = Math.round(el.scrollTop / Math.max(el.clientHeight, 1));
          if (n !== idx) setIdx(n);
        }}
      >

        {/* ════════════════════════════
            SLIDE 0 — HERO
        ════════════════════════════ */}
        <section
          data-slide="0"
          className={sBase}
          style={{
            backgroundImage: `${OVERLAY_HERO}, url('${IMG.hero}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
          }}
        >
          {/* Brilho dourado sutil no canto */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 85% 8%, rgba(200,169,110,0.12) 0%, transparent 50%)' }}
          />

          <div className="relative z-10 flex flex-1 flex-col px-6 py-8 sm:px-12 lg:px-20">

            {/* ── Header ── */}
            <motion.header
              variants={fadeUp} custom={0} initial="hidden" animate="visible"
              className="flex items-center justify-between"
            >
              {/* Logo + nome */}
              <div className="flex items-center gap-4">
                <div
                  className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    border: '1.5px solid rgba(200,169,110,0.55)',
                    background: 'rgba(8,26,18,0.85)',
                    boxShadow: '0 0 28px rgba(200,169,110,0.20), inset 0 1px 0 rgba(200,169,110,0.12)',
                  }}
                >
                  <Image src="/logo.png" alt="Torres Brothers" width={36} height={36} className="h-9 w-9 object-contain" priority />
                </div>
                <div>
                  <p
                    className="text-[1.7rem] font-bold uppercase leading-[1.1] tracking-wide text-[#f3e6cb]"
                    style={{ fontFamily: 'var(--font-amiri)' }}
                  >
                    Torres Brothers
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <div style={{ width: 16, height: 1, backgroundColor: '#c8a96e' }} />
                    <span className="text-[0.62rem] uppercase tracking-[0.30em] text-[#c8a96e]">
                      Pisos & Conservação
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA desktop */}
              <Link
                href={WHATSAPP} target="_blank" rel="noopener noreferrer"
                className="hidden items-center gap-2 rounded-xl border border-[#c8a96e]/55 bg-[#c8a96e] px-5 py-2.5 text-sm font-semibold text-[#0b2416] shadow-[0_0_22px_rgba(200,169,110,0.28)] transition hover:scale-[1.04] md:inline-flex"
              >
                <MessageCircle className="h-4 w-4" />
                Solicitar orçamento
              </Link>
            </motion.header>

            {/* ── Conteúdo hero (inferior esquerdo) ── */}
            <div className="mt-auto max-w-2xl pb-4">
              <motion.span
                variants={fadeUp} custom={0.18} initial="hidden" animate="visible"
                className="mb-6 inline-block rounded-full border border-[#c8a96e]/50 bg-[#c8a96e]/10 px-4 py-1.5 text-[0.7rem] uppercase tracking-[0.24em] text-[#e3c78b]"
              >
                Solução profissional em limpeza de pisos
              </motion.span>

              <motion.h1
                variants={fadeUp} custom={0.28} initial="hidden" animate="visible"
                className="text-[clamp(2.4rem,6.5vw,5.2rem)] leading-[1.06] text-[#f9f4ea]"
                style={{ fontFamily: 'var(--font-amiri)' }}
              >
                Sua empresa com aparência impecável e brilho premium.
              </motion.h1>

              {/* Divisor dourado */}
              <motion.div
                variants={fadeUp} custom={0.38} initial="hidden" animate="visible"
                className="my-6 flex items-center gap-4"
              >
                <div style={{ width: 48, height: 1.5, backgroundColor: '#c8a96e', borderRadius: 1 }} />
                <span className="text-sm text-[#d7e6de]/80">Curitiba e região</span>
              </motion.div>

              <motion.p
                variants={fadeUp} custom={0.42} initial="hidden" animate="visible"
                className="text-base leading-relaxed text-[#d8ece4]/85 sm:text-lg"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                Atendemos ambientes comerciais e industriais com equipe treinada,
                equipamentos profissionais e processos confiáveis.
              </motion.p>

              <motion.div
                variants={fadeUp} custom={0.54} initial="hidden" animate="visible"
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  href={WHATSAPP} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c8a96e] px-7 py-3.5 text-sm font-semibold text-[#0b2416] shadow-[0_0_32px_rgba(200,169,110,0.40)] transition hover:scale-[1.03] active:scale-100"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar com especialista
                </Link>
                <button
                  onClick={() => scrollTo(1)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#c8a96e]/50 bg-white/5 px-7 py-3.5 text-sm font-semibold text-[#f8f3e8] backdrop-blur-sm transition hover:border-[#c8a96e] hover:bg-white/8"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  Ver serviços
                  <ArrowDown className="h-4 w-4" />
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════
            SLIDE 1 — SERVIÇOS
        ════════════════════════════ */}
        <section
          data-slide="1"
          className={`${sBase} items-center justify-center`}
          style={{ backgroundColor: '#071610' }}
        >
          {/* Textura radial */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(200,169,110,0.07) 0%, transparent 55%)' }}
          />

          <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 sm:px-12 lg:px-20">
            <motion.div
              variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
              className="mb-10 text-center"
            >
              <p className="text-[0.7rem] uppercase tracking-[0.28em] text-[#c8a96e]">O que fazemos</p>
              <h2
                className="mt-2 text-[clamp(2rem,4.5vw,3.6rem)] leading-tight text-[#f8f3e8]"
                style={{ fontFamily: 'var(--font-amiri)' }}
              >
                Serviços Torres Brothers
              </h2>
              <div className="mx-auto mt-3 flex justify-center">
                <div style={{ width: 48, height: 1.5, backgroundColor: '#c8a96e', borderRadius: 1 }} />
              </div>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-3">
              {SERVICES.map((s, i) => (
                <motion.article
                  key={s.num}
                  variants={fadeUp} custom={i * 0.1} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                  className="group flex flex-col overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-2"
                  style={{ border: '1px solid rgba(200,169,110,0.25)', backgroundColor: '#0c2b1e' }}
                >
                  {/* Imagem */}
                  <div
                    className="h-52 origin-center transition duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(7,22,16,0.05) 0%, rgba(7,22,16,0.65) 100%), url('${s.image}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  {/* Texto */}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className="text-4xl leading-none text-[#c8a96e]/40"
                        style={{ fontFamily: 'var(--font-amiri)' }}
                      >
                        {s.num}
                      </span>
                      <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(200,169,110,0.25)' }} />
                    </div>
                    <h3
                      className="text-[1.5rem] leading-snug text-[#f8f3e8]"
                      style={{ fontFamily: 'var(--font-amiri)' }}
                    >
                      {s.title}
                    </h3>
                    <p
                      className="mt-2.5 flex-1 text-sm leading-relaxed text-[#a8c8b8]/85"
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    >
                      {s.description}
                    </p>
                    <Link
                      href={WHATSAPP} target="_blank" rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#c8a96e] transition-all hover:gap-3"
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    >
                      Solicitar serviço <ArrowDown className="h-3.5 w-3.5 rotate-[-90deg]" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════
            SLIDE 2 — POR QUE NÓS
        ════════════════════════════ */}
        <section
          data-slide="2"
          className={`${sBase} items-center justify-center`}
          style={{
            backgroundImage: `linear-gradient(to right, rgba(6,20,14,1) 0%, rgba(6,20,14,0.95) 38%, rgba(6,20,14,0.60) 62%, rgba(6,20,14,0.10) 100%), url('${IMG.about}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
          }}
        >
          <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 px-6 py-16 sm:px-12 lg:grid-cols-2 lg:px-20">

            <motion.div
              variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}
            >
              <p className="mb-3 text-[0.7rem] uppercase tracking-[0.28em] text-[#c8a96e]">Por que a Torres Brothers?</p>
              <h2
                className="text-[clamp(2rem,4.5vw,3.6rem)] leading-tight text-[#f8f3e8]"
                style={{ fontFamily: 'var(--font-amiri)' }}
              >
                Imagem profissional começa pelo chão do seu negócio.
              </h2>

              <div className="my-6" style={{ width: 48, height: 1.5, backgroundColor: '#c8a96e', borderRadius: 1 }} />

              <p
                className="max-w-lg text-base leading-relaxed text-[#b8d5c4]/90"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                Trabalhamos com padrão técnico e foco em resultado visual real.
                Cada atendimento é planejado para reforçar a percepção de
                cuidado e qualidade da sua empresa.
              </p>

              <ul className="mt-7 space-y-4">
                {DIFERENCIAIS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#c8a96e]" />
                    <span
                      className="text-[#ddf0e6]"
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-9">
                <Link
                  href={WHATSAPP} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c8a96e] px-7 py-3.5 text-sm font-semibold text-[#0b2416] shadow-[0_0_28px_rgba(200,169,110,0.35)] transition hover:scale-[1.03]"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Solicitar visita técnica
                </Link>
              </div>
            </motion.div>

            {/* Coluna direita vazia — a imagem de fundo aparece aqui */}
            <div />
          </div>
        </section>

        {/* ════════════════════════════
            SLIDE 3 — CTA FINAL
        ════════════════════════════ */}
        <section
          data-slide="3"
          className={`${sBase} items-center justify-center`}
          style={{ backgroundColor: '#060e0a' }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(200,169,110,0.10) 0%, transparent 60%)' }}
          />

          <motion.div
            variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}
            className="relative z-10 mx-auto w-full max-w-3xl px-6 py-16 text-center sm:px-10"
          >
            {/* Logo + nome centrado */}
            <div className="mb-10 flex flex-col items-center gap-3">
              <div
                className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl"
                style={{
                  border: '1.5px solid rgba(200,169,110,0.55)',
                  background: 'rgba(10,32,22,0.80)',
                  boxShadow: '0 0 36px rgba(200,169,110,0.24), inset 0 1px 0 rgba(200,169,110,0.14)',
                }}
              >
                <Image src="/logo.png" alt="Torres Brothers" width={48} height={48} className="h-12 w-12 object-contain" />
              </div>
              <p
                className="text-[2.1rem] font-bold uppercase leading-none tracking-wide text-[#f3e6cb]"
                style={{ fontFamily: 'var(--font-amiri)' }}
              >
                Torres Brothers
              </p>
              <div style={{ width: 44, height: 1.5, backgroundColor: '#c8a96e', borderRadius: 1 }} />
            </div>

            <h2
              className="text-[clamp(2rem,4.5vw,3.5rem)] leading-tight text-[#f9f2e4]"
              style={{ fontFamily: 'var(--font-amiri)' }}
            >
              Transforme a aparência do seu ambiente com acabamento profissional.
            </h2>

            <p
              className="mx-auto mt-5 max-w-xl text-[#b8d5c4]/90"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              Envie uma mensagem e receba atendimento rápido para orçamento e planejamento do serviço.
            </p>

            <div className="mt-9">
              <Link
                href={WHATSAPP} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c8a96e] px-9 py-4 text-base font-semibold text-[#0b2416] shadow-[0_0_40px_rgba(200,169,110,0.45)] transition hover:scale-[1.04] active:scale-100"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                <MessageCircle className="h-5 w-5" />
                Chamar no WhatsApp
              </Link>
            </div>

            {/* Rodapé discreto */}
            <p
              className="mt-12 text-[0.68rem] uppercase tracking-[0.24em] text-[#4a7060]"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              Curitiba e região · torres-brothers.vercel.app
            </p>
          </motion.div>
        </section>

      </div>{/* fim do scroll container */}

      {/* ── Dots laterais ── */}
      <div className="pointer-events-none fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 md:flex">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            aria-label={`Slide ${i + 1}`}
            className="pointer-events-auto block transition-all duration-300"
            style={{
              width: 7,
              height: i === idx ? 28 : 7,
              borderRadius: 9999,
              backgroundColor: i === idx ? '#c8a96e' : 'rgba(245,240,230,0.25)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      ── Setas cima/baixo ──
      <div className="pointer-events-none fixed right-5 top-1/2 z-40 mt-24 hidden -translate-y-1/2 flex-col gap-2 md:flex">
        <button
          onClick={() => scrollTo(idx - 1)}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition hover:border-[#c8a96e]/70 hover:text-[#c8a96e]"
          aria-label="Slide anterior"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => scrollTo(idx + 1)}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition hover:border-[#c8a96e]/70 hover:text-[#c8a96e]"
          aria-label="Próximo slide"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Setas mobile (canto inferior direito) ── */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex items-center gap-2 md:hidden">
        <button
          onClick={() => scrollTo(idx - 1)}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur"
          aria-label="Slide anterior"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => scrollTo(idx + 1)}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur"
          aria-label="Próximo slide"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </div>

    </main>
  );
}
