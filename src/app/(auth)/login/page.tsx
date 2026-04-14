'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, Sparkles, ShieldCheck, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loginSchema } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';

type LoginFormData = z.infer<typeof loginSchema>;

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
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      toast.success('Bem-vindo de volta!');
      router.push('/dashboard');
    } catch {
      toast.error('E-mail ou senha inválidos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Bem-vindo!');
      router.push('/dashboard');
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
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
      } else {
        toast.error(`Erro ao entrar com Google (${firebaseError.code || 'desconhecido'}).`);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast.error('Digite seu e-mail para recuperar a senha.');
      return;
    }
    try {
      await resetPassword(resetEmail);
      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setShowForgotPassword(false);
    } catch {
      toast.error('Erro ao enviar e-mail de recuperação.');
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

              {showForgotPassword ? (
                <Card className="shadow-xl border-[#1B4332]/10 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Recuperar Senha</CardTitle>
                    <CardDescription>
                      Digite seu e-mail e enviaremos um link para redefinir sua senha.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">E-mail</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                    </div>
                    <Button className="w-full bg-[#1B4332] hover:bg-[#245a44]" onClick={handleResetPassword}>
                      Enviar Link de Recuperação
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      Voltar ao login
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-xl border-[#1B4332]/10 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-xl">Entrar</CardTitle>
                    <CardDescription>Acesse sua conta para gerenciar suas finanças</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          {...register('email')}
                          aria-label="Endereço de e-mail"
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            {...register('password')}
                            aria-label="Senha"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-sm text-destructive">{errors.password.message}</p>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-sm text-primary hover:underline"
                          onClick={() => setShowForgotPassword(true)}
                        >
                          Esqueceu sua senha?
                        </button>
                      </div>

                      <Button type="submit" className="w-full bg-[#1B4332] hover:bg-[#245a44]" disabled={isLoading}>
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Entrando...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <LogIn className="h-4 w-4" />
                            Entrar
                          </span>
                        )}
                      </Button>
                    </form>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading}
                    >
                      {isGoogleLoading ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
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
                      )}
                      Google
                    </Button>

                    <p className="text-center text-sm text-muted-foreground mt-6">
                      Não tem uma conta?{' '}
                      <Link href="/register" className="text-primary hover:underline font-medium">
                        Criar conta grátis
                      </Link>
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
