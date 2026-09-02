'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarRange,
  Database,
  LayoutDashboard,
  ScrollText,
  TrainFront,
  UserCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { usePrototype } from '@/components/prototype-provider';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  count?: boolean;
};

const navigation: NavItem[] = [
  { label: 'Weekly Plan', href: '/weekly-plan', icon: LayoutDashboard },
  { label: 'Monthly Outlook', href: '/monthly-outlook', icon: CalendarRange },
  { label: 'Maintenance Tasks', href: '/maintenance-tasks', icon: Wrench },
  { label: 'Approvals', href: '/approvals', icon: UserCheck, count: true },
  { label: 'Audit & Data Health', href: '/audit-data-health', icon: ScrollText },
];

function isActive(pathname: string, href: string) {
  if (href === '/weekly-plan') return pathname === '/' || pathname === href;
  return pathname === href;
}

export function RailShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { pendingCount, state } = usePrototype();

  return (
    <div className="min-h-screen bg-[#f3f5f6] text-[#11283a]">
      <div aria-hidden="true" className="grid h-1 grid-cols-3">
        <span className="bg-[#f47a1f]" />
        <span className="bg-white" />
        <span className="bg-[#16835b]" />
      </div>

      <header className="sticky top-0 z-40 flex h-16 items-center border-b border-white/10 bg-[#0c2338] px-4 text-white lg:px-6">
        <Link href="/weekly-plan" className="flex min-w-0 items-center gap-3" aria-label="RailSamanvay home">
          <span className="grid size-9 shrink-0 place-items-center rounded-md border border-white/20 bg-white/10">
            <TrainFront className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold tracking-[0.01em]">
              RailSamanvay
            </span>
            <span className="block truncate text-[10px] font-medium uppercase tracking-[0.14em] text-white/60">
              Ministry of Railways
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <Badge className="hidden rounded-md border-white/15 bg-white/10 px-2.5 text-[10px] uppercase tracking-[0.1em] text-white sm:inline-flex">
            Decision-support prototype
          </Badge>
          <div className="hidden h-7 w-px bg-white/15 sm:block" />
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium">Block Planner</p>
            <p className="max-w-52 truncate text-[10px] text-white/60">{state.division}</p>
          </div>
          <div className="grid size-8 place-items-center rounded-full bg-[#0b737a] text-xs font-semibold">
            BP
          </div>
        </div>
      </header>

      <nav
        aria-label="Mobile navigation"
        className="sticky top-16 z-30 flex gap-1 overflow-x-auto border-b border-[#d9e0e4] bg-white p-2 lg:hidden"
      >
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium',
                active ? 'bg-[#e8f2f4] text-[#075f69]' : 'text-[#526675]',
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {item.label}
              {item.count && pendingCount > 0 ? (
                <span className="rounded bg-[#fff0e2] px-1.5 py-0.5 text-[10px] font-semibold text-[#91450f]">
                  {pendingCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mx-auto grid min-h-[calc(100vh-68px)] max-w-[1680px] lg:grid-cols-[236px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#d9e0e4] bg-white lg:flex lg:flex-col">
          <nav aria-label="Primary navigation" className="sticky top-20 space-y-1 p-3 pt-5">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637483]">
              Planning workspace
            </p>
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-[#e8f2f4] text-[#075f69]'
                      : 'text-[#526675] hover:bg-[#f3f5f6] hover:text-[#11283a]',
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.count && pendingCount > 0 ? (
                    <span className="ml-auto rounded bg-[#fff0e2] px-1.5 py-0.5 text-[10px] font-semibold text-[#91450f]">
                      {pendingCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}

            <div className="mt-8 border-t border-[#e2e7ea] pt-4">
              <div className="rounded-md bg-[#f6f8f9] p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#344b5d]">
                  <Database className="size-3.5" aria-hidden="true" />
                  Synthetic data mode
                </div>
                <p className="mt-1.5 text-xs leading-5 text-[#637483]">
                  Fixture TMS, SMMS, TDMS and COA records. No Railway system is connected.
                </p>
              </div>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-[1320px]">{children}</div>
          <p className="mx-auto mt-8 max-w-[1320px] border-t border-[#d8e0e4] pt-4 text-xs leading-5 text-[#637483]">
            Prototype guardrail: recommendations and officer decisions are simulated decision support only. They do not issue a traffic block, power isolation or Railway-system writeback.
          </p>
        </main>
      </div>
    </div>
  );
}

