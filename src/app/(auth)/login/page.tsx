'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ShieldCheck, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { getAccessRoute } from '@/lib/access';

const floatingDots = [
  { size: 8, top: '8%', duration: 18, delay: 0, opacity: 0.28, drift: -8 },
  { size: 10, top: '16%', duration: 14, delay: 1.1, opacity: 0.22, drift: 10 },
  { size: 6, top: '24%', duration: 16, delay: 0.5, opacity: 0.24, drift: -6 },
  { size: 12, top: '35%', duration: 20, delay: 1.8, opacity: 0.18, drift: 12 },
  { size: 7, top: '44%', duration: 13, delay: 0.2, opacity: 0.3, drift: -7 },
  { size: 14, top: '53%', duration: 22, delay: 2.4, opacity: 0.16, drift: 8 },
  { size: 9, top: '63%', duration: 15, delay: 0.9, opacity: 0.26, drift: -10 },
  { size: 11, top: '72%', duration: 19, delay: 1.6, opacity: 0.2, drift: 7 },
  { size: 5, top: '79%', duration: 12, delay: 0.4, opacity: 0.32, drift: -5 },
  { size: 13, top: '87%', duration: 21, delay: 2.1, opacity: 0.17, drift: 9 },
];

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result) return;

      if (result.profile.accessStatus === 'approved') {
        toast.success('Bem-vindo!');
      } else if (result.profile.accessStatus === 'rejected') {
        toast.error('Seu acesso foi negado pelo administrador.');
      } else {
        toast.warning(
          result.isNewUser
            ? 'Cadastro recebido! Aguarde a aprovação do administrador para acessar o sistema.'
            : 'Seu acesso ainda está aguardando aprovação do administrador.'
        );
      }

      router.push(getAccessRoute(result.profile.accessStatus));
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        toast.info('Login cancelado.');
      } else if (firebaseError.code === 'auth/popup-blocked') {
        toast.error('Popup bloqueado pelo navegador. Libere popups para este site e tente novamente.');
      } else if (firebaseError.code === 'auth/unauthorized-domain') {
        toast.error('Domínio não autorizado no Firebase Auth. Adicione este domínio em Authentication > Settings > Authorized domains.');
      } else if (firebaseError.code === 'auth/operation-not-allowed') {
        toast.error('Login com Google está desativado no Firebase. Ative o provedor Google em Authentication > Sign-in method.');
      } else if (firebaseError.code === 'auth/invalid-api-key') {
        toast.error('API Key do Firebase inválida. Verifique as variáveis NEXT_PUBLIC_FIREBASE_* do projeto.');
      } else if (firebaseError.code === 'auth/app-not-authorized') {
        toast.error('Aplicação não autorizada no Firebase. Confira o domínio e as credenciais do projeto.');
      } else if (firebaseError.code === 'permission-denied') {
        toast.warning('Cadastro recebido! Aguarde a aprovação do administrador para acessar o sistema.');
      } else {
        toast.error(`Erro ao entrar com Google (${firebaseError.code || 'desconhecido'}).`);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-background to-amber-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {floatingDots.map((dot, index) => (
          <motion.span
            key={index}
            className="absolute rounded-full bg-[#C4A35A]"
            style={{
              width: dot.size,
              height: dot.size,
              top: dot.top,
              left: '-10%',
            }}
            animate={{
              left: ['-10%', '110%'],
              y: [0, dot.drift, 0],
              opacity: [0, dot.opacity, dot.opacity, 0],
            }}
            transition={{
              duration: dot.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: dot.delay,
            }}
          />
        ))}
      </div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-16 h-72 w-72 rounded-full bg-[#1B4332]/12 blur-3xl"
        animate={{ x: [0, 18, 0], y: [0, -16, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-[#C4A35A]/20 blur-3xl"
        animate={{ x: [0, -24, 0], y: [0, 12, 0], scale: [1.02, 1, 1.02] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />

      <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <motion.div
          className="w-full max-w-6xl grid lg:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <motion.section
            className="hidden lg:flex relative overflow-hidden rounded-3xl border border-[#1B4332]/10 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              aria-hidden
              className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-[#1B4332]/10 blur-3xl"
              animate={{ scale: [1, 1.08, 1], x: [0, 14, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              aria-hidden
              className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-[#C4A35A]/20 blur-3xl"
              animate={{ scale: [1.06, 1, 1.06], y: [0, -10, 0] }}
              transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative z-10 text-center w-full">
              <motion.div
                className="mb-6 flex justify-center"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Image src="/logo.png" alt="Torres Brothers" width={78} height={78} className="h-20 w-auto" />
              </motion.div>

              <h1 className="font-[family-name:var(--font-amiri)] text-5xl font-bold uppercase tracking-wide text-[#1B4332] leading-tight">
                Torres Brothers
              </h1>

              <p className="text-sm text-[#C4A35A] font-semibold tracking-[0.28em] uppercase mt-2">
                ERP Financeiro
              </p>

              <p className="mt-6 text-[#1B4332]/80 max-w-md mx-auto">
                Plataforma financeira com experiência simples, visual moderno e controle total do seu negócio.
              </p>

              <div className="mt-10 space-y-4 max-w-md mx-auto text-left">
                <div className="flex items-center gap-3 text-[#1B4332]">
                  <span className="rounded-lg bg-[#1B4332]/10 p-2">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium">Segurança e confiabilidade em primeiro lugar</span>
                </div>
                <div className="flex items-center gap-3 text-[#1B4332]">
                  <span className="rounded-lg bg-[#1B4332]/10 p-2">
                    <BarChart3 className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium">Indicadores claros para decisões rápidas</span>
                </div>
                <div className="flex items-center gap-3 text-[#1B4332]">
                  <span className="rounded-lg bg-[#1B4332]/10 p-2">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium">Interface bonita, suave e fácil de usar</span>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center"
          >
            <div className="w-full max-w-md mx-auto">
              <div className="lg:hidden mb-8 text-center">
                <div className="flex justify-center mb-3">
                  <Image src="/logo.png" alt="Torres Brothers" width={56} height={56} className="h-14 w-auto" />
                </div>
                <h1 className="font-[family-name:var(--font-amiri)] text-3xl font-bold uppercase tracking-wide text-[#1B4332]">
                  Torres Brothers
                </h1>
              </div>

              <Card className="shadow-xl border-[#1B4332]/10 backdrop-blur">
                <CardHeader>
                  <CardTitle>Entrar</CardTitle>
                  <CardDescription>
                    O acesso ao sistema acontece exclusivamente com sua conta Google.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Ao entrar com Google pela primeira vez, seu cadastro é criado automaticamente e segue para aprovação do administrador.
                  </div>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Conectando com Google...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        Continuar com Google
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
