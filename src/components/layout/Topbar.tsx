'use client';

import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import { Moon, Sun, LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const pageLabels: Record<string, { title: string; helper: string }> = {
    '/dashboard': { title: 'Visão Geral', helper: 'Acompanhe os principais indicadores' },
    '/lancamentos': { title: 'Lançamentos', helper: 'Cadastre e acompanhe movimentações' },
    '/contas-pagar': { title: 'Contas a Pagar', helper: 'Organize vencimentos e pagamentos' },
    '/contas-receber': { title: 'Contas a Receber', helper: 'Controle recebimentos e inadimplência' },
    '/fluxo-caixa': { title: 'Fluxo de Caixa', helper: 'Visualize entradas e saídas do período' },
    '/dre': { title: 'DRE', helper: 'Analise resultado operacional e lucro líquido' },
    '/relatorios': { title: 'Relatórios', helper: 'Exporte dados e análises do sistema' },
    '/categorias': { title: 'Categorias', helper: 'Classifique receitas, custos e despesas' },
    '/contas-bancarias': { title: 'Contas Bancárias', helper: 'Gerencie saldo e contas conectadas' },
    '/centros-custo': { title: 'Centros de Custo', helper: 'Separe resultados por área' },
    '/orcamento': { title: 'Orçamento', helper: 'Defina metas e compare realizado x previsto' },
    '/perfil': { title: 'Configurações', helper: 'Atualize dados da conta e preferências' },
    '/ajuda': { title: 'Ajuda', helper: 'Aprenda a usar o sistema de forma simples' },
  };

  const currentPage = pageLabels[pathname] ?? {
    title: 'Painel Financeiro',
    helper: 'Gerencie sua operação com simplicidade',
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Até logo!');
      router.push('/');
    } catch {
      toast.error('Erro ao sair. Tente novamente.');
    }
  };

  const initials = (profile?.name || user?.displayName || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Abrir menu"
          title="Abrir menu lateral"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="hidden md:block">
          <p className="text-sm font-semibold leading-none">{currentPage.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{currentPage.helper}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Alternar tema"
          title="Alternar tema claro/escuro"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-9 w-9 rounded-full cursor-pointer outline-none">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={profile?.photoUrl || user?.photoURL || undefined}
                alt={profile?.name || 'Usuário'}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.photoUrl || user?.photoURL || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-medium">{profile?.name || user?.displayName || 'Usuário'}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/perfil')}>
              <User className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
