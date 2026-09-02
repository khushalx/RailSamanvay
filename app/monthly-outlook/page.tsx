'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

import { PageHeading } from '@/components/page-heading';
import { RailShell } from '@/components/rail-shell';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Progress } from '@/components/ui/progress';
import { usePrototype } from '@/components/prototype-provider';
import { cn } from '@/lib/utils';

const weeks = [
  { id: 1, label: '02–08 Sep', date: '2026-09-02', demand: 82, available: 180, requested: 148, risk: 'Balanced' },
  { id: 2, label: '09–15 Sep', date: '2026-09-09', demand: 94, available: 170, requested: 160, risk: 'Tight' },
  { id: 3, label: '16–22 Sep', date: '2026-09-16', demand: 68, available: 210, requested: 143, risk: 'Flexible' },
  { id: 4, label: '23–29 Sep', date: '2026-09-23', demand: 76, available: 190, requested: 145, risk: 'Balanced' },
];

const departments = [
  { name: 'Engineering', tasks: 8, minutes: 285, critical: 2, color: 'bg-[#0b737a]' },
  { name: 'Signal & Telecom', tasks: 5, minutes: 125, critical: 1, color: 'bg-[#f47a1f]' },
  { name: 'Electrical — TRD', tasks: 4, minutes: 160, critical: 0, color: 'bg-[#405d86]' },
];

export default function MonthlyOutlookPage() {
  const { state, setPlanningField } = usePrototype();
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [demandMode, setDemandMode] = useState('baseline');
  const week = weeks.find((item) => item.id === selectedWeek) ?? weeks[0];
  const pressure = demandMode === 'high-freight' ? 9 : demandMode === 'reduced-teams' ? 6 : 0;

  return (
    <RailShell>
      <PageHeading
        eyebrow="Four-week capacity view"
        title="Monthly Outlook"
        description="Spot weeks where cross-department maintenance demand is likely to exceed the protected corridor envelope."
        action={<Badge className="rounded-md bg-[#e8f2f4] text-[#075f69]">September 2026 · synthetic</Badge>}
      />

      <Card className="mb-4 gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="outlook-division">Division</Label>
            <NativeSelect id="outlook-division" className="w-full" value={state.division} onChange={(event) => setPlanningField('division', event.target.value)}>
              <NativeSelectOption value="Secunderabad Division">Secunderabad Division</NativeSelectOption>
              <NativeSelectOption value="Hyderabad Division">Hyderabad Division</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="outlook-section">Section</Label>
            <NativeSelect id="outlook-section" className="w-full" value={state.section} onChange={(event) => setPlanningField('section', event.target.value)}>
              <NativeSelectOption value={state.section}>{state.section}</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demand-mode">Planning assumption</Label>
            <NativeSelect id="demand-mode" className="w-full" value={demandMode} onChange={(event) => setDemandMode(event.target.value)}>
              <NativeSelectOption value="baseline">Baseline demand</NativeSelectOption>
              <NativeSelectOption value="high-freight">Higher freight pressure</NativeSelectOption>
              <NativeSelectOption value="reduced-teams">Reduced team availability</NativeSelectOption>
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card className="gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
          <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
            <CardTitle className="text-[15px] font-semibold text-[#163247]">Weekly capacity pressure</CardTitle>
            <CardDescription className="mt-1 text-xs">Select a week to inspect its illustrative maintenance envelope.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
            {weeks.map((item) => {
              const demand = Math.min(100, item.demand + pressure);
              const active = item.id === selectedWeek;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedWeek(item.id)}
                  className={cn(
                    'rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0b737a]/25',
                    active ? 'border-[#0b737a] bg-[#eef7f7]' : 'border-[#d8e0e4] bg-white hover:bg-[#f6f8f9]',
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#163247]">Week {item.id} · {item.label}</span>
                    <span className={cn('text-xs font-semibold', demand >= 90 ? 'text-[#9d403d]' : 'text-[#246c50]')}>{demand}%</span>
                  </span>
                  <Progress value={demand} aria-label={`Week ${item.id} demand pressure`} className={cn('mt-3 [&_[data-slot=progress-indicator]]:h-2 [&_[data-slot=progress-track]]:h-2', demand >= 90 && '[&_[data-slot=progress-indicator]]:bg-[#b4443f]')} />
                  <span className="mt-2 flex justify-between text-xs text-[#637483]"><span>{item.requested + pressure} min requested</span><span>{item.risk}</span></span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-lg border-t-[3px] border-t-[#0b737a] py-0 shadow-none ring-[#cddbdd]">
          <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
            <div className="flex items-center gap-2 text-xs font-medium text-[#246c50]"><CheckCircle2 className="size-4" />Selected envelope</div>
            <CardTitle className="mt-2 text-xl font-semibold text-[#163247]">Week {week.id} · {week.label}</CardTitle>
            <CardDescription>{state.section}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Available" value={`${week.available} min`} />
              <Metric label="Requested" value={`${week.requested + pressure} min`} />
            </div>
            <div className="rounded-md bg-[#f6f8f9] p-3 text-xs leading-5 text-[#526675]">
              Use the weekly workspace to evaluate exact train paths, protected windows and hard constraints. Monthly values are indicative envelopes only.
            </div>
            <Link
              href="/weekly-plan"
              onClick={() => {
                setPlanningField('planningDate', week.date);
                setPlanningField('scenario', demandMode === 'high-freight' ? 'freight' : demandMode === 'reduced-teams' ? 'team-unavailable' : 'base');
              }}
              className={cn(buttonVariants({ variant: 'default' }), 'w-full bg-[#0b6871] text-white')}
            >
              Open in Weekly Plan <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
        <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
          <CardTitle className="text-[15px] font-semibold text-[#163247]">Department demand</CardTitle>
          <CardDescription className="mt-1 text-xs">Aggregated synthetic work for the selected month.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-[#e4e9eb] px-5 py-0">
          {departments.map((department) => (
            <div key={department.name} className="grid gap-3 py-4 sm:grid-cols-[190px_1fr_auto] sm:items-center">
              <div><p className="text-sm font-medium text-[#163247]">{department.name}</p><p className="mt-0.5 text-xs text-[#637483]">{department.tasks} tasks · {department.critical} critical</p></div>
              <Progress value={Math.round((department.minutes / 300) * 100)} aria-label={`${department.name} demand ${department.minutes} minutes`} className={cn('[&_[data-slot=progress-indicator]]:h-2 [&_[data-slot=progress-track]]:h-2', department.color === 'bg-[#f47a1f]' ? '[&_[data-slot=progress-indicator]]:bg-[#f47a1f]' : department.color === 'bg-[#405d86]' ? '[&_[data-slot=progress-indicator]]:bg-[#405d86]' : '')} />
              <span className="text-sm font-semibold tabular-nums text-[#344b5d]">{department.minutes} min</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </RailShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-[#f5f7f8] p-3"><p className="text-[11px] uppercase tracking-[0.08em] text-[#637483]">{label}</p><p className="mt-1 text-lg font-semibold text-[#163247]">{value}</p></div>;
}
