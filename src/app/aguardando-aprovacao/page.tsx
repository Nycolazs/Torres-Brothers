'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock3, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { getAccessRoute } from '@/lib/access';
import { toast } from 'sonner';

export default function AguardandoAprovacaoPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const [checking, setChecking] = useState(false);

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

    if (profile?.accessStatus === 'rejected') {
      router.replace('/acesso-negado');
    }
  }, [loading, profile?.accessStatus, router, user]);

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const nextProfile = await refreshProfile();
      if (!nextProfile) {
        router.replace('/login');
        return;
      }

      if (nextProfile.accessStatus === 'approved') {
        toast.success('Acesso liberado!');
        router.push(getAccessRoute(nextProfile.accessStatus));
        return;
      }

      if (nextProfile.accessStatus === 'rejected') {
        router.push(getAccessRoute(nextProfile.accessStatus));
        return;
      }

      toast.info('Seu cadastro ainda está na fila de aprovação.');
    } catch {
      toast.error('Não foi possível atualizar seu status agora.');
    } finally {
      setChecking(false);
    }
  };

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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Clock3 className="h-6 w-6" />
          </div>
          <CardTitle>Aguardando aprovação</CardTitle>
          <CardDescription>
            Seu acesso ao financeiro da Torres Brothers foi criado e agora está na fila de análise do administrador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{profile.name}</p>
            <p>{profile.email}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={handleRefresh} disabled={checking}>
              <RefreshCw className={`mr-2 h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              Verificar acesso
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
