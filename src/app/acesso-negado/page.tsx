'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldX, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function AcessoNegadoPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (profile?.accessStatus === 'approved') {
      router.replace('/dashboard');
      return;
    }

    if (profile?.accessStatus === 'pending') {
      router.replace('/aguardando-aprovacao');
    }
  }, [loading, profile?.accessStatus, router, user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldX className="h-6 w-6" />
          </div>
          <CardTitle>Acesso não aprovado</CardTitle>
          <CardDescription>
            Seu usuário não foi aprovado para acessar o financeiro da Torres Brothers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{profile.name}</p>
            <p>{profile.email}</p>
          </div>

          <Button className="w-full" variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Voltar para o login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
