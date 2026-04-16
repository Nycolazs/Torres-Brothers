'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  User,
  Building2,
  Shield,
  Download,
  Trash2,
  Moon,
  Sun,
  Save,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  deleteUser,
  GoogleAuthProvider,
  linkWithPopup,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { profileSchema } from '@/lib/validations';
import { auth } from '@/lib/firebase';
import { USER_ACCESS_STATUS_LABELS } from '@/constants';

type ProfileFormData = z.infer<typeof profileSchema>;

export default function PerfilPage() {
  const { user, profile, updateUserProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  const providerIds = user?.providerData?.map((p) => p.providerId) ?? [];
  const hasGoogleLinked = providerIds.includes('google.com');

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isDirty: profileDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || user?.displayName || '',
      email: profile?.email || user?.email || '',
      phone: profile?.phone || '',
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateUserProfile({ name: data.name, phone: data.phone });
      toast.success('Perfil atualizado!');
    } catch {
      toast.error('Erro ao atualizar perfil.');
    }
  };

  const handleLinkGoogle = async () => {
    if (!auth.currentUser) return;

    setLinkingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await linkWithPopup(auth.currentUser, provider);
      toast.success('Conta Google vinculada com sucesso!');
      router.refresh();
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/provider-already-linked') {
        toast.info('Esta conta já está vinculada ao Google.');
      } else if (firebaseError.code === 'auth/credential-already-in-use') {
        toast.error('Esta conta Google já está vinculada a outro usuário.');
      } else if (firebaseError.code === 'auth/popup-closed-by-user') {
        toast.info('Vinculação cancelada.');
      } else {
        toast.error('Erro ao vincular Google. Tente novamente.');
      }
    } finally {
      setLinkingGoogle(false);
    }
  };

  const handleExportData = () => {
    toast.info('A exportação completa de dados será disponibilizada em breve.');
  };

  const handleDeleteAccount = async () => {
    try {
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
        toast.success('Conta excluída.');
        router.push('/login');
      }
    } catch {
      toast.error('Erro ao excluir conta. Faça login novamente e tente de novo.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie seu perfil e preferências</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input {...registerProfile('name')} />
                  {profileErrors.name && <p className="text-sm text-destructive">{profileErrors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input {...registerProfile('email')} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input {...registerProfile('phone')} placeholder="(11) 99999-9999" />
                </div>
                <Button type="submit" disabled={!profileDirty}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Tab */}
        <TabsContent value="company" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Dados da Empresa
              </CardTitle>
              <CardDescription>
                Este financeiro trabalha com uma empresa principal unica.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input value={profile?.companyName || 'Torres Brothers'} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Status do seu acesso</Label>
                <div>
                  <Badge variant="secondary">
                    {USER_ACCESS_STATUS_LABELS[profile?.accessStatus || 'pending']}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                O acesso ao dashboard e aos dados financeiros e controlado pela aprovacao do administrador.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Acesso com Google
              </CardTitle>
              <CardDescription>
                O login no sistema acontece exclusivamente pela sua conta Google.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Se a sua conta ja estiver conectada ao Google, esse e o unico metodo de entrada habilitado no sistema.
              </p>
              {hasGoogleLinked ? (
                <Badge>Google conectado</Badge>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Para manter acesso depois de sair da sessao atual, conecte sua conta ao Google agora.
                  </p>
                  <Button onClick={handleLinkGoogle} disabled={linkingGoogle}>
                    {linkingGoogle ? 'Conectando...' : 'Conectar com Google'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Zona de Perigo</CardTitle>
              <CardDescription>Ações irreversíveis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Exportar Dados</p>
                  <p className="text-xs text-muted-foreground">Baixe todos os seus dados</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-destructive">Excluir Conta</p>
                  <p className="text-xs text-muted-foreground">Esta ação é irreversível</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aparência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <div>
                    <p className="text-sm font-medium">Modo Escuro</p>
                    <p className="text-xs text-muted-foreground">Alterne entre tema claro e escuro</p>
                  </div>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir Conta"
        description="Tem certeza que deseja excluir sua conta? Todos os seus dados serão perdidos permanentemente. Esta ação não pode ser desfeita."
        confirmLabel="Sim, Excluir Minha Conta"
        variant="destructive"
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
