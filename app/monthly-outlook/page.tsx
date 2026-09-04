'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CalendarRange, ChevronRight } from 'lucide-react';

import { PageHeading } from '@/components/page-heading';
import { RailShell } from '@/components/rail-shell';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Progress } from '@/components/ui/progress';
import { usePrototype } from '@/components/prototype-provider';
import { cn } from '@/lib/utils';

const weeks = [
  { id: 1, label: '02–08 Sep', date: '2026-09-02', available: 180, requested: 148 },
  { id: 2, label: '09–15 Sep', date: '2026-09-09', available: 170, requested: 160 },
  { id: 3, label: '16–22 Sep', date: '2026-09-16', available: 210, requested: 143 },
  { id: 4, label: '23–29 Sep', date: '2026-09-23', available: 190, requested: 145 },
];

const departments = [
  { name: 'Engineering', tasks: 8, minutes: 285, critical: 2 },
  { name: 'Signal & Telecom', tasks: 5, minutes: 125, critical: 1 },
  { name: 'Electrical — TRD', tasks: 4, minutes: 160, critical: 0 },
];

type DemandMode = 'baseline' | 'high-freight' | 'reduced-teams';

function adjustedAvailable(minutes: number, mode: DemandMode) {
  if (mode === 'high-freight') return Math.max(0, minutes - 15);
  if (mode === 'reduced-teams') return Math.max(0, minutes - 25);
  return minutes;
}

function riskLabel(pressure: number) {
  if (pressure >= 90) return 'Tight';
  if (pressure >= 75) return 'Balanced';
  return 'Flexible';
}

export default function MonthlyOutlookPage() {
  const { state, setPlanningWeek } = usePrototype();
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [demandMode, setDemandMode] = useState<DemandMode>('baseline');
  const week = weeks.find((item) => item.id === selectedWeek) ?? weeks[0];
  const available = adjustedAvailable(week.available, demandMode);
  const pressure = Math.min(100, Math.round((week.requested / available) * 100));

  return (
    <RailShell>
      <PageHeading
        eyebrow="Four-week capacity view"
        title="Monthly Outlook"
        description="See which weeks need attention, then move one week into detailed block planning."
        action={<Badge className="rounded-md bg-[#e8f2f4] text-[#075f69]">September 2026 · demo</Badge>}
      />

      <Card className="mb-5 gap-0 rounded-xl py-0 shadow-none ring-[#d8e0e4]">
        <CardContent className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#657682]">Planning corridor</p>
            <p className="mt-1 text-sm font-semibold text-[#163247]">{state.division}</p>
            <p className="mt-0.5 text-sm text-[#526675]">{state.section}</p>
          </div>
          <div className="w-full space-y-1.5 sm:w-64">
            <Label htmlFor="demand-mode">Planning assumption</Label>
            <NativeSelect id="demand-mode" className="w-full [&_select]:h-11" value={demandMode} onChange={(event) => setDemandMode(event.target.value as DemandMode)}>
              <NativeSelectOption value="baseline">Baseline capacity</NativeSelectOption>
              <NativeSelectOption value="high-freight">Higher freight pressure</NativeSelectOption>
              <NativeSelectOption value="reduced-teams">Reduced team availability</NativeSelectOption>
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="gap-0 rounded-xl py-0 shadow-none ring-[#d8e0e4]">
          <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
            <h2 className="text-base font-semibold text-[#163247]">Weekly capacity pressure</h2>
            <p className="text-sm text-[#657682]">Select a week to inspect its available protected time.</p>
          </CardHeader>
          <CardContent className="divide-y divide-[#e4e9eb] px-0 py-0">
            {weeks.map((item) => {
              const itemAvailable = adjustedAvailable(item.available, demandMode);
              const itemPressure = Math.min(100, Math.round((item.requested / itemAvailable) * 100));
              const active = item.id === selectedWeek;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedWeek(item.id)}
                  className={cn(
                    'grid min-h-24 w-full gap-3 px-5 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[#0b737a]/25 sm:grid-cols-[150px_minmax(0,1fr)_90px_24px] sm:items-center',
                    active ? 'bg-[#eef7f7]' : 'hover:bg-[#f7f9fa]',
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold text-[#163247]">Week {item.id}</span>
                    <span className="mt-1 block text-xs text-[#657682]">{item.label}</span>
                  </span>
                  <span>
                    <Progress value={itemPressure} aria-label={`Week ${item.id} capacity pressure ${itemPressure} percent`} className={cn('[&_[data-slot=progress-indicator]]:h-2 [&_[data-slot=progress-track]]:h-2', itemPressure >= 90 && '[&_[data-slot=progress-indicator]]:bg-[#b4443f]')} />
                    <span className="mt-2 flex justify-between gap-2 text-xs text-[#657682]"><span>{item.requested} requested</span><span>{itemAvailable} available</span></span>
                  </span>
                  <span className={cn('text-sm font-semibold', itemPressure >= 90 ? 'text-[#9d403d]' : 'text-[#246c50]')}>{itemPressure}%<span className="block text-xs font-normal">{riskLabel(itemPressure)}</span></span>
                  <ChevronRight className="size-5 text-[#0b737a]" aria-hidden="true" />
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-xl border-t-4 border-t-[#0b737a] py-0 shadow-[0_12px_34px_rgba(16,42,64,0.07)] ring-[#cddbdd]">
          <CardHeader className="border-b border-[#e4e9eb] px-5 py-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#075f69]"><CalendarRange className="size-4" />Selected planning week</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[#163247]">Week {week.id} · {week.label}</h2>
            <p className="text-sm text-[#657682]">{state.section}</p>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Pressure" value={`${pressure}%`} />
              <Metric label="Requested" value={`${week.requested} min`} />
              <Metric label="Available" value={`${available} min`} />
            </div>
            <div className={cn('rounded-xl p-4 text-sm leading-6', pressure >= 90 ? 'bg-[#fff3f2] text-[#7c3d39]' : 'bg-[#f2f7f5] text-[#365c4b]')}>
              <strong>{riskLabel(pressure)} week.</strong>{' '}
              {pressure >= 90
                ? 'Detailed path and resource checks are especially important before committing work.'
                : 'The indicative envelope leaves room for detailed constraint screening.'}
            </div>
            <p className="text-sm leading-6 text-[#526675]">Weekly Plan will open with this date and test condition. Generate there to check exact train paths, protection and work compatibility.</p>
            <Link
              href="/weekly-plan"
              onClick={() => {
                setPlanningWeek(
                  week.date,
                  demandMode === 'high-freight'
                    ? 'freight'
                    : demandMode === 'reduced-teams'
                      ? 'team-unavailable'
                      : 'base',
                );
              }}
              className={cn(buttonVariants({ variant: 'default' }), 'h-11 w-full bg-[#0b6871] px-4 text-white hover:bg-[#075860]')}
            >
              Plan this week <ArrowRight />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5 gap-0 rounded-xl py-0 shadow-none ring-[#d8e0e4]">
        <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
          <h2 className="text-base font-semibold text-[#163247]">Department demand</h2>
          <p className="text-sm text-[#657682]">Synthetic work entering the September planning horizon.</p>
        </CardHeader>
        <CardContent className="grid gap-3 p-5 md:grid-cols-3">
          {departments.map((department) => (
            <div key={department.name} className="rounded-xl bg-[#f4f6f7] p-4">
              <p className="text-sm font-semibold text-[#163247]">{department.name}</p>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-[#102a40]">{department.minutes} min</p>
              <p className="mt-1 text-xs text-[#657682]">{department.tasks} tasks · {department.critical} critical</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </RailShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-[#f2f5f6] p-3"><p className="text-xs text-[#657682]">{label}</p><p className="mt-1 text-base font-semibold tabular-nums text-[#163247]">{value}</p></div>;
}
