'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent side="left" className="p-0 w-[280px] border-r border-sidebar-border bg-sidebar">
        <SheetHeader className="border-b border-sidebar-border bg-sidebar px-4 py-3.5">
          <Link
            href="/dashboard"
            onClick={onClose}
            title="Ir para Visão Geral"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Image src="/logo.png" alt="Torres Brothers" width={28} height={28} className="h-7 w-auto" />
            <SheetTitle className="font-[family-name:var(--font-amiri)] text-[15px] font-bold uppercase tracking-wide text-sidebar-foreground">
              Torres Brothers
            </SheetTitle>
          </Link>
        </SheetHeader>
        <Sidebar className="w-full border-r-0" onNavigate={onClose} showBrand={false} />
      </SheetContent>
    </Sheet>
  );
}
