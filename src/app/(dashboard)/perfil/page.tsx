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
  Link,
  Download,
  Trash2,
  Moon,
  Sun,
  Save,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { profileSchema, companySettingsSchema } from '@/lib/validations';
import { auth } from '@/lib/firebase';

type ProfileFormData = z.infer<typeof profileSchema>;
type CompanyFormData = z.infer<typeof companySettingsSchema>;

export default function PerfilPage() {
  const { user, profile, updateUserProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  const providerIds = user?.providerData?.map((p) => p.providerId) ?? [];
  const hasGoogleLinked = providerIds.includes('google.com');
  const hasPasswordProvider = providerIds.includes('password');

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

  const {
    register: registerCompany,
    handleSubmit: handleCompanySubmit,
    formState: { errors: companyErrors, isDirty: companyDirty },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      companyName: profile?.companyName || '',
      companyDocument: profile?.companyDocument || '',
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

  const onCompanySubmit = async (data: CompanyFormData) => {
    try {
      await updateUserProfile({
        companyName: data.companyName,
        companyDocument: data.companyDocument,
        phone: data.phone,
      });
      toast.success('Dados da empresa atualizados!');
    } catch {
      toast.error('Erro ao atualizar empresa.');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirm) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setChangingPassword(true);
    try {
      if (auth.currentUser) {
        if (!hasPasswordProvider) {
          if (!auth.currentUser.email) {
            toast.error('Não foi possível identificar o e-mail da conta para criar senha.');
            return;
          }

          const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            passwordForm.newPassword
          );

          await linkWithCredential(auth.currentUser, credential);
          toast.success('Senha criada com sucesso! Agora você pode entrar com e-mail e senha.');
          router.refresh();
        } else {
          await updatePassword(auth.currentUser, passwordForm.newPassword);
          toast.success('Senha alterada com sucesso!');
        }

        setPasswordForm({ newPassword: '', confirm: '' });
      }
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/requires-recent-login') {
        toast.error('Por segurança, faça login novamente e tente de novo.');
      } else if (firebaseError.code === 'auth/provider-already-linked') {
        toast.info('Sua conta de senha já está vinculada.');
      } else {
        toast.error('Erro ao salvar senha. Tente novamente.');
      }
    } finally {
      setChangingPassword(false);
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
        router.push('/');
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
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompanySubmit(onCompanySubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input {...registerCompany('companyName')} placeholder="Torres Brothers" />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input {...registerCompany('companyDocument')} placeholder="00.000.000/0001-00" />
                  {companyErrors.companyDocument && <p className="text-sm text-destructive">{companyErrors.companyDocument.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input {...registerCompany('phone')} placeholder="(11) 99999-9999" />
                </div>
                <Button type="submit" disabled={!companyDirty}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Alterar Senha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmar Nova Senha</Label>
                <Input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              {!hasPasswordProvider && (
                <p className="text-xs text-muted-foreground">
                  Sua conta usa login social. Defina uma senha para também entrar com e-mail e senha.
                </p>
              )}
              <Button onClick={handleChangePassword} disabled={changingPassword}>
                {changingPassword
                  ? hasPasswordProvider
                    ? 'Alterando...'
                    : 'Criando...'
                  : hasPasswordProvider
                    ? 'Alterar Senha'
                    : 'Criar Senha'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Link className="h-4 w-4" />
                Vincular Google
              </CardTitle>
              <CardDescription>
                Facilite seu acesso conectando sua conta atual ao Google.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant={hasGoogleLinked ? 'outline' : 'default'}
                onClick={handleLinkGoogle}
                disabled={linkingGoogle || hasGoogleLinked}
              >
                {hasGoogleLinked
                  ? 'Google já vinculado'
                  : linkingGoogle
                    ? 'Vinculando...'
                    : 'Vincular com Google'}
              </Button>
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
