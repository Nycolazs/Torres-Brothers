'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  LayoutDashboard,
  Receipt,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  BarChart3,
  FileText,
  Tag,
  Landmark,
  Building,
  PieChart,
  Settings,
  CircleHelp,
  Users,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

const mainNavItems = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard, hint: 'Indicadores principais da operação' },
  { href: '/lancamentos', label: 'Lançamentos', icon: Receipt, hint: 'Cadastre receitas, custos e despesas' },
  { href: '/contas-pagar', label: 'Contas a Pagar', icon: ArrowUpCircle, hint: 'Controle vencimentos e pagamentos' },
  { href: '/contas-receber', label: 'Contas a Receber', icon: ArrowDownCircle, hint: 'Acompanhe recebimentos e inadimplência' },
  { href: '/fluxo-caixa', label: 'Fluxo de Caixa', icon: Wallet, hint: 'Entradas e saídas no período' },
  { href: '/dre', label: 'DRE', icon: BarChart3, hint: 'Resultado do exercício por período' },
  { href: '/relatorios', label: 'Relatórios', icon: FileText, hint: 'Exporte informações em PDF e Excel' },
  { href: '/ajuda', label: 'Ajuda', icon: CircleHelp, hint: 'Guia rápido de uso do sistema' },
];

const cadastrosNavItems = [
  { href: '/categorias', label: 'Categorias', icon: Tag, hint: 'Organize os tipos de lançamentos' },
  { href: '/contas-bancarias', label: 'Contas Bancárias', icon: Landmark, hint: 'Gerencie contas e saldos' },
  { href: '/centros-custo', label: 'Centros de Custo', icon: Building, hint: 'Separe resultados por área' },
  { href: '/orcamento', label: 'Orçamento', icon: PieChart, hint: 'Defina metas e limites por categoria' },
];

const accountNavItems = [
  { href: '/perfil', label: 'Configurações', icon: Settings, hint: 'Perfil, segurança e preferências' },
];

const adminNavItems = [
  { href: '/usuarios', label: 'Usuários', icon: Users, hint: 'Aprove acessos e gerencie permissões' },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  showBrand?: boolean;
}

export function Sidebar({ className, onNavigate, showBrand = true }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const itemBaseClass =
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-all';
  const itemActiveClass =
    'bg-primary text-primary-foreground font-semibold shadow-sm';
  const itemInactiveClass =
    'text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground';

  return (
    <aside
      className={cn(
        'flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
        className
      )}
    >
      {showBrand && (
        <>
          {/* Logo */}
          <Link
            href="/dashboard"
            onClick={onNavigate}
            title="Ir para Visão Geral"
            className="h-16 flex items-center gap-3 px-5 shrink-0 cursor-pointer hover:bg-sidebar-accent/40 transition-colors"
          >
            <Image src="/logo.png" alt="Torres Brothers" width={36} height={36} className="h-9 w-auto shrink-0" />
            <div>
              <h1 className="font-[family-name:var(--font-amiri)] font-bold uppercase tracking-wide text-sm leading-tight text-sidebar-foreground">
                Torres Brothers
              </h1>
            </div>
          </Link>

          <Separator className="bg-sidebar-border" />
        </>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-1.5 px-3">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={item.hint}
                className={cn(
                  itemBaseClass,
                  isActive ? itemActiveClass : itemInactiveClass
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 pt-5 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Cadastros
          </p>
        </div>

        <nav className="space-y-1.5 px-3">
          {cadastrosNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={item.hint}
                className={cn(
                  itemBaseClass,
                  isActive ? itemActiveClass : itemInactiveClass
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 pt-5 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Conta
          </p>
        </div>

        <nav className="space-y-1.5 px-3 pb-4">
          {accountNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={item.hint}
                className={cn(
                  itemBaseClass,
                  isActive ? itemActiveClass : itemInactiveClass
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <>
            <div className="px-5 pt-5 pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                Administração
              </p>
            </div>

            <nav className="space-y-1.5 px-3 pb-4">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={item.hint}
                    className={cn(
                      itemBaseClass,
                      isActive ? itemActiveClass : itemInactiveClass
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </>
        )}
      </ScrollArea>
    </aside>
  );
}
