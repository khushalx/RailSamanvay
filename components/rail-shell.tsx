'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CalendarRange,
  LayoutDashboard,
  ScrollText,
  TrainFront,
  UserCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

import { usePrototype } from '@/components/prototype-provider';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  mobileLabel: string;
  href: string;
  icon: LucideIcon;
  count?: boolean;
};

const navigation: NavItem[] = [
  { label: 'Weekly Plan', mobileLabel: 'Plan', href: '/weekly-plan', icon: LayoutDashboard },
  { label: 'Monthly Outlook', mobileLabel: 'Outlook', href: '/monthly-outlook', icon: CalendarRange },
  { label: 'Maintenance Tasks', mobileLabel: 'Tasks', href: '/maintenance-tasks', icon: Wrench },
  { label: 'Approvals', mobileLabel: 'Approve', href: '/approvals', icon: UserCheck, count: true },
  { label: 'Audit & Data Health', mobileLabel: 'Audit', href: '/audit-data-health', icon: ScrollText },
];

let routesWarmed = false;

function isActive(pathname: string, href: string) {
  if (href === '/weekly-plan') return pathname === '/' || pathname === href;
  return pathname === href;
}

export function RailShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { pendingCount, hydrated, state } = usePrototype();

  useEffect(() => {
    if (routesWarmed) return;
    routesWarmed = true;
    const timer = window.setTimeout(() => {
      navigation.forEach((item) => router.prefetch(item.href));
    }, 80);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-[#11283a]">
      <a href="#main-content" className="sr-only z-50 rounded-md bg-white px-4 py-2 text-[#075f69] focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 flex h-16 items-center border-b border-white/10 bg-[#0c2338] px-4 text-white lg:px-6">
        <Link href="/weekly-plan" prefetch className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60" aria-label="RailSamanvay home">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#0b737a]">
            <TrainFront className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold tracking-[0.01em]">RailSamanvay</span>
            <span className="block truncate text-[11px] text-white/65">Railway maintenance planning</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <span className={cn(
            'hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:flex',
            state.dataGate === 'ready'
              ? 'border-white/15 bg-white/8 text-white/80'
              : 'border-[#f0aaa5]/50 bg-[#9d403d]/20 text-[#ffd8d5]',
          )}>
            <span className={cn('size-2 rounded-full', state.dataGate === 'ready' ? 'bg-[#69c29a]' : 'bg-[#f08f88]')} />
            {state.dataGate === 'ready' ? 'Demo data ready' : 'Planning blocked'}
          </span>
          <div className="hidden text-right md:block">
            <p className="text-xs font-medium">Block Planner</p>
            <p className="max-w-52 truncate text-[11px] text-white/60">{state.division}</p>
          </div>
        </div>
      </header>

      {!hydrated ? (
        <output aria-live="polite" className="fixed inset-x-0 top-16 z-50 border-b border-[#cfe1e2] bg-[#eef7f7] px-4 py-2 text-center text-sm font-medium text-[#075f69] shadow-sm">
          Preparing the demo…
        </output>
      ) : null}

      <div inert={!hydrated} className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1560px] lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#dce3e6] bg-white lg:block">
          <nav aria-label="Primary navigation" className="sticky top-20 space-y-1 p-3 pt-5">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#657682]">Workspace</p>
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  prefetch
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0b737a]/20',
                    active
                      ? 'bg-[#e8f2f4] text-[#075f69]'
                      : 'text-[#526675] hover:bg-[#f3f5f6] hover:text-[#11283a]',
                  )}
                >
                  {active ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#0b737a]" /> : null}
                  <Icon className="size-4" strokeWidth={1.9} aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.count && hydrated && pendingCount > 0 ? (
                    <span className="ml-auto min-w-5 rounded-full bg-[#fff0e2] px-1.5 py-0.5 text-center text-[11px] font-semibold text-[#91450f]">{pendingCount}</span>
                  ) : null}
                </Link>
              );
            })}
            <p className="mx-3 mt-8 border-t border-[#e3e8ea] pt-4 text-xs leading-5 text-[#657682]">
              Synthetic prototype<br />No live Railway systems
            </p>
          </nav>
        </aside>

        <main id="main-content" className="min-w-0 px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-[1180px]">{children}</div>
        </main>
      </div>

      <nav inert={!hydrated} aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#dce3e6] bg-white/95 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_rgba(12,35,56,0.08)] backdrop-blur lg:hidden">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link key={item.label} href={item.href} prefetch aria-current={active ? 'page' : undefined} className={cn('relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b737a]/30', active ? 'text-[#075f69]' : 'text-[#657682]')}>
              <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
              <span>{item.mobileLabel}</span>
              {item.count && hydrated && pendingCount > 0 ? (
                <span className="absolute right-[22%] top-1.5 grid min-w-4 place-items-center rounded-full bg-[#f47a1f] px-1 text-[9px] font-semibold text-white">{pendingCount}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
