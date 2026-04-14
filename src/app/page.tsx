import Link from 'next/link';
import { MessageCircle, CheckCircle2, Sparkles, ShieldCheck, Clock3, MapPin, Phone } from 'lucide-react';

const whatsappNumber = '5541987164811';
const whatsappHref = `https://wa.me/${whatsappNumber}`;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7fbf8] via-[#ffffff] to-[#f7fbf8] text-[#111827] dark:from-[#f7fbf8] dark:via-[#ffffff] dark:to-[#f7fbf8] dark:text-[#111827]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#1B4332]/10 blur-3xl" />
          <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-[#C4A35A]/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#1B4332]/15 bg-[#1B4332]/5 px-4 py-1.5 text-sm font-medium text-[#1B4332]">
                <Sparkles className="h-4 w-4" />
                Torres Brothers
              </span>

              <h1 className="mt-5 text-3xl font-bold leading-tight text-[#1B4332] sm:text-4xl lg:text-5xl">
                Lavagem profissional de mercantis com excelência, agilidade e confiança
              </h1>

              <p className="mt-5 max-w-xl text-base text-[#4b5563] sm:text-lg dark:text-[#4b5563]">
                Somos especializados em lavagem de mercantis, entregando um serviço completo para manter seu negócio
                com aparência impecável, mais higiene e melhor experiência para seus clientes.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1B4332] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#245a44]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar no WhatsApp
                </Link>
                <Link
                  href="#sobre"
                  className="inline-flex items-center justify-center rounded-lg border border-[#1B4332]/20 bg-white px-6 py-3 text-sm font-semibold text-[#1B4332] transition hover:bg-[#1B4332]/5"
                >
                  Conhecer a empresa
                </Link>
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm text-[#4b5563] dark:text-[#4b5563]">
                <Phone className="h-4 w-4 text-[#1B4332]" />
                Contato direto: <span className="font-semibold text-[#111827] dark:text-[#111827]">(41) 98716-4811</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-xl sm:p-8 dark:bg-white">
              <img src="/logo.png" alt="Torres Brothers" className="mx-auto h-20 w-auto sm:h-24" />
              <h2 className="mt-5 text-center font-[family-name:var(--font-amiri)] text-3xl font-bold uppercase tracking-wide text-[#1B4332]">
                Torres Brothers
              </h2>
              <p className="mt-2 text-center text-sm uppercase tracking-[0.25em] text-[#C4A35A]">Lavagem de Mercantis</p>

              <div className="mt-6 space-y-3">
                {[
                  'Atendimento cuidadoso e padronizado',
                  'Equipe experiente e treinada',
                  'Compromisso com qualidade e pontualidade',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-lg border border-[#d1d5db] bg-[#f9fafb] p-3 dark:border-[#d1d5db] dark:bg-[#f9fafb]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1B4332]" />
                    <p className="text-sm text-[#1f2937]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sobre" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 sm:p-8 lg:p-10 dark:border-[#e5e7eb] dark:bg-white">
          <h3 className="text-2xl font-bold text-[#1B4332] sm:text-3xl">Sobre a empresa</h3>
          <p className="mt-4 text-[#4b5563] dark:text-[#4b5563]">
            A Torres Brothers atua com foco em resultados, organização e apresentação visual do seu ambiente comercial.
            Nossa missão é oferecer um serviço de lavagem de mercantis que valorize seu espaço e transmita confiança para
            quem entra no seu estabelecimento.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-[#e5e7eb] p-4 dark:border-[#e5e7eb]">
              <ShieldCheck className="h-5 w-5 text-[#1B4332]" />
              <h4 className="mt-2 font-semibold">Padrão de qualidade</h4>
              <p className="mt-1 text-sm text-[#6b7280] dark:text-[#6b7280]">Processos consistentes para garantir acabamento profissional.</p>
            </div>
            <div className="rounded-xl border border-[#e5e7eb] p-4 dark:border-[#e5e7eb]">
              <Clock3 className="h-5 w-5 text-[#1B4332]" />
              <h4 className="mt-2 font-semibold">Agilidade no atendimento</h4>
              <p className="mt-1 text-sm text-[#6b7280] dark:text-[#6b7280]">Organização para executar o serviço com rapidez e segurança.</p>
            </div>
            <div className="rounded-xl border border-[#e5e7eb] p-4 sm:col-span-2 lg:col-span-1 dark:border-[#e5e7eb]">
              <MapPin className="h-5 w-5 text-[#1B4332]" />
              <h4 className="mt-2 font-semibold">Atendimento próximo</h4>
              <p className="mt-1 text-sm text-[#6b7280] dark:text-[#6b7280]">Comunicação simples e suporte direto pelo WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="rounded-2xl border border-[#1B4332]/15 bg-gradient-to-r from-[#1B4332] to-[#245a44] p-6 text-white sm:p-8 lg:p-10">
          <h3 className="text-2xl font-bold sm:text-3xl">Vamos conversar sobre o seu negócio?</h3>
          <p className="mt-3 max-w-2xl text-white/85">
            Entre em contato agora e receba atendimento rápido para entender a melhor solução de lavagem de mercantis para sua empresa.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#1B4332] transition hover:bg-white/90"
            >
              <MessageCircle className="h-4 w-4" />
              Chamar no WhatsApp
            </Link>
            <p className="text-sm text-white/90">WhatsApp: (41) 98716-4811</p>
          </div>
        </div>
      </section>
    </main>
  );
}
