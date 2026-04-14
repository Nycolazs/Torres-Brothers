"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Globe, MessageCircle } from 'lucide-react';

const SITE_URL = 'https://torres-brothers.vercel.app';
const WHATSAPP_URL = 'https://wa.me/5541987164811';

export default function LinksPage() {
  return (
    <main
      className="relative flex h-dvh w-full items-center justify-center overflow-hidden px-5"
      style={{
        background:
          'radial-gradient(ellipse at 85% 10%, rgba(200,169,110,0.20) 0%, transparent 46%), linear-gradient(165deg, #06150f 0%, #0a2117 55%, #06150f 100%)',
      }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-55"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 22%, rgba(200,169,110,0.16) 0%, transparent 38%), radial-gradient(circle at 82% 78%, rgba(53,110,82,0.28) 0%, transparent 44%)',
          backgroundSize: '140% 140%',
        }}
        animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-14 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: 'rgba(200,169,110,0.22)' }}
        animate={{ x: [0, 36, 0], y: [0, 28, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-6 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: 'rgba(28,94,68,0.30)' }}
        animate={{ x: [0, -30, 0], y: [0, -24, 0], scale: [1.05, 1, 1.05] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div
          className="absolute -left-20 bottom-8 h-56 w-56 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(200,169,110,0.25)' }}
        />
      </div>

      <section
        className="relative z-10 w-full max-w-sm rounded-3xl border border-[#c8a96e]/35 bg-[#0b2418]/70 p-6 text-center shadow-[0_0_45px_rgba(200,169,110,0.22)] backdrop-blur-xl"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        <div className="mb-5 flex flex-col items-center">
          <div
            className="mb-3 flex h-[84px] w-[84px] items-center justify-center rounded-2xl"
            style={{
              border: '1.5px solid rgba(200,169,110,0.65)',
              background: 'rgba(8,26,18,0.88)',
              boxShadow: '0 0 26px rgba(200,169,110,0.25), inset 0 1px 0 rgba(200,169,110,0.2)',
            }}
          >
            <Image
              src="/logo.png"
              alt="Logo Torres Brothers"
              width={60}
              height={60}
              priority
              className="h-[60px] w-[60px] object-contain"
            />
          </div>

          <h1
            className="text-[2rem] font-bold uppercase leading-none tracking-wide text-[#f3e6cb]"
            style={{ fontFamily: 'var(--font-amiri)' }}
          >
            Torres Brothers
          </h1>
          <p className="mt-2 text-sm text-[#cfe0d8]">Escolha para onde você quer ir</p>
        </div>

        <div className="space-y-3.5">
          <Link
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#c8a96e]/60 bg-[#c8a96e] px-4 py-3 text-sm font-semibold text-[#0b2416] transition active:scale-[0.99]"
          >
            <Globe className="h-4 w-4" />
            Acessar site
          </Link>

          <Link
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#c8a96e]/45 bg-white/5 px-4 py-3 text-sm font-semibold text-[#f3e6cb] backdrop-blur transition active:scale-[0.99]"
          >
            <MessageCircle className="h-4 w-4" />
            Falar no WhatsApp
          </Link>
        </div>
      </section>
    </main>
  );
}
