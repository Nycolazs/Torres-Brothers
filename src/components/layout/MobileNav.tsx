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
      <SheetContent side="left" className="p-0 w-[90vw] max-w-[360px] border-r border-emerald-100 bg-white">
        <SheetHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-4 py-4">
          <Link
            href="/dashboard"
            onClick={onClose}
            title="Ir para Visão Geral"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Image src="/logo.png" alt="Torres Brothers" width={30} height={30} className="h-7.5 w-auto" />
            <SheetTitle className="font-[family-name:var(--font-amiri)] text-[15px] font-bold uppercase tracking-wide text-[#1B4332]">
              Torres Brothers
            </SheetTitle>
          </Link>
        </SheetHeader>
        <Sidebar className="w-full border-r-0" onNavigate={onClose} showBrand={false} />
      </SheetContent>
    </Sheet>
  );
}
