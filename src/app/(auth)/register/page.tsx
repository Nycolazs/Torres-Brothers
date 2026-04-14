'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { registerSchema } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await signUp(data.name, data.email, data.password);
      toast.success('Conta criada com sucesso! Bem-vindo ao Torres Brothers.');
      router.push('/dashboard');
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/email-already-in-use') {
        toast.error('Este e-mail já está cadastrado. Tente fazer login.');
      } else {
        toast.error('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      toast.success('Conta criada com sucesso!');
      router.push('/dashboard');
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        toast.info('Cadastro cancelado.');
      } else if (firebaseError.code === 'auth/popup-blocked') {
        toast.error('Popup bloqueado pelo navegador. Libere popups para este site e tente novamente.');
      } else if (firebaseError.code === 'auth/unauthorized-domain') {
        toast.error('Domínio não autorizado no Firebase Auth. Adicione este domínio em Authentication > Settings > Authorized domains.');
      } else if (firebaseError.code === 'auth/operation-not-allowed') {
        toast.error('Login com Google está desativado no Firebase. Ative o provedor Google em Authentication > Sign-in method.');
      } else {
        toast.error(`Erro ao cadastrar com Google (${firebaseError.code || 'desconhecido'}).`);
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1B4332] items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B4332] via-[#1B4332] to-[#0D2818]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C4A35A]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#C4A35A]/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="max-w-md text-center relative z-10">
          <div className="mb-8 flex justify-center">
            <Image src="/logo.png" alt="Torres Brothers" width={80} height={80} className="h-20 w-auto drop-shadow-xl" />
          </div>
          <h1 className="font-[family-name:var(--font-amiri)] text-4xl font-bold uppercase tracking-wide text-[#1B4332] mb-2 inline-block bg-white/90 px-3 py-1 rounded-md">
            Torres Brothers
          </h1>
          <p className="text-sm text-[#C4A35A] font-medium tracking-widest uppercase mb-6">ERP Financeiro</p>
          <p className="text-base text-emerald-100/80 mb-10">
            Comece a controlar suas finanças hoje. Configure seu sistema em minutos e tenha
            visibilidade total do seu negócio.
          </p>
          <div className="space-y-3 text-left">
            {[
              'Dashboard com indicadores em tempo real',
              'DRE e relatórios profissionais',
              'Fluxo de caixa e projeções',
              'Contas a pagar e receber automatizadas',
              'Exportação para PDF e Excel',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-emerald-100/80">
                <CheckCircle className="h-4 w-4 text-[#C4A35A] shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="flex justify-center mb-3">
              <Image src="/logo.png" alt="Torres Brothers" width={56} height={56} className="h-14 w-auto" />
            </div>
            <h1 className="font-[family-name:var(--font-amiri)] text-2xl font-bold uppercase tracking-wide text-[#1B4332]">
              Torres Brothers
            </h1>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Criar Conta</CardTitle>
              <CardDescription>
                Preencha os dados abaixo para começar a gerenciar suas finanças
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    {...register('name')}
                    aria-label="Nome completo"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    aria-label="Confirmar senha"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Criando conta...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Criar Conta
                    </span>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou cadastre-se com</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={handleGoogleSignUp}>
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
                Google
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Fazer login
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
