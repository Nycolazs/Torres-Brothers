'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { getAccessRoute } from '@/lib/access';
import { registerSchema, type RegisterSchemaType } from '@/lib/validations';

export default function RegisterPage() {
  const router = useRouter();
  const { registerWithEmail } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterSchemaType) => {
    setIsSubmitting(true);
    try {
      const result = await registerWithEmail(data.name, data.email, data.password);

      if (!result) return;

      if (result.profile.accessStatus === 'approved') {
        toast.success('Cadastro criado e aprovado!');
      } else {
        toast.warning('Cadastro recebido! Aguarde a aprovação do administrador para acessar o sistema.');
      }

      router.push(getAccessRoute(result.profile.accessStatus));
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/email-already-in-use') {
        toast.error('Esse e-mail já está em uso.');
      } else if (firebaseError.code === 'auth/weak-password') {
        toast.error('A senha é muito fraca. Use uma senha com mais caracteres.');
      } else if (firebaseError.code === 'auth/operation-not-allowed') {
        toast.error('Cadastro com e-mail e senha está desativado no Firebase. Ative Email/Password em Authentication > Sign-in method.');
      } else if (firebaseError.code === 'auth/invalid-api-key') {
        toast.error('API Key do Firebase inválida. Verifique a configuração do Firebase.');
      } else {
        toast.error(`Erro ao criar cadastro (${firebaseError.code || 'desconhecido'}).`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden overflow-y-auto flex items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-amber-50 p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#1B4332]">Criar cadastro</h1>
          <p className="text-sm text-muted-foreground mt-2">Preencha os dados para solicitar acesso ao sistema.</p>
        </div>

        <Card className="shadow-xl border-[#1B4332]/10 backdrop-blur">
          <CardHeader>
            <CardTitle>Cadastro</CardTitle>
            <CardDescription>Seu primeiro acesso será avaliado pelo administrador.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" className="pl-10" placeholder="Seu nome" {...register('name')} />
                </div>
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" autoComplete="email" className="pl-10" placeholder="seu@email.com" {...register('email')} />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" autoComplete="new-password" className="pl-10" placeholder="Mínimo de 6 caracteres" {...register('password')} />
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="confirmPassword" type="password" autoComplete="new-password" className="pl-10" placeholder="Repita sua senha" {...register('confirmPassword')} />
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Criando cadastro...' : 'Criar cadastro'}
              </Button>
            </form>

            <p className="text-sm text-center text-muted-foreground mt-4">
              Já tem conta?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Voltar para o login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
