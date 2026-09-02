'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  RefreshCw,
  RotateCcw,
  ScrollText,
} from 'lucide-react';

import { PageHeading } from '@/components/page-heading';
import { RailShell } from '@/components/rail-shell';
import { StatusBadge } from '@/components/status-badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { usePrototype } from '@/components/prototype-provider';
import { formatTimestamp } from '@/lib/format';

export default function AuditDataHealthPage() {
  const { state, refreshSources, setDataGate, resetPrototype } = usePrototype();
  const [notice, setNotice] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const visibleEvents = showAll ? state.auditEvents.slice(0, 30) : state.auditEvents.slice(0, 5);

  function handleRefresh() {
    refreshSources();
    setNotice('Synthetic source timestamps refreshed. Generate a new weekly recommendation to use the snapshot.');
  }

  function handleStale() {
    setDataGate('stale');
    setNotice('Control Office data is now stale. Weekly generation is blocked until you refresh the sources.');
  }

  function handleReset() {
    resetPrototype();
    setResetOpen(false);
    setShowAll(false);
    setNotice('Device-local prototype data was restored to the original demo fixture.');
  }

  return (
    <RailShell>
      <PageHeading
        eyebrow="Traceability and fail-closed controls"
        title="Audit & Data Health"
        description="Check whether planning data is ready and review the actions recorded by this device-local prototype."
        action={state.dataGate === 'stale' ? <Button className="h-11 bg-[#0b6871] px-4 text-white hover:bg-[#075860]" onClick={handleRefresh}><RefreshCw />Refresh sources</Button> : undefined}
      />

      {notice ? <output aria-live="polite" className="mb-4 block rounded-xl border border-[#cfe1e2] bg-[#f0f8f8] px-4 py-3 text-sm text-[#075f69]">{notice}</output> : null}

      <Card className={state.dataGate === 'ready' ? 'mb-5 gap-0 rounded-xl border-l-4 border-l-[#21835d] py-0 shadow-none ring-[#cfe0d5]' : 'mb-5 gap-0 rounded-xl border-l-4 border-l-[#b4443f] bg-[#fff9f8] py-0 shadow-none ring-[#e8c8c5]'}>
        <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            {state.dataGate === 'ready' ? <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-[#21835d]" /> : <AlertTriangle className="mt-0.5 size-6 shrink-0 text-[#b4443f]" />}
            <div>
              <h2 className="text-lg font-semibold text-[#163247]">{state.dataGate === 'ready' ? 'All 4 demo sources are ready' : 'Planning is blocked'}</h2>
              <p className="mt-1 text-sm leading-6 text-[#526675]">{state.dataGate === 'ready' ? 'A new deterministic planning run may proceed. Hard constraints still apply.' : 'The Control Office snapshot is stale. Refreshing the sources is the only way to restore planning.'}</p>
            </div>
          </div>
          <StatusBadge status={state.dataGate === 'ready' ? 'Ready' : 'Stale'} />
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <Card className="gap-0 rounded-xl py-0 shadow-none ring-[#d8e0e4]">
          <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-base font-semibold text-[#163247]">Recent activity</h2><p className="mt-1 text-sm text-[#657682]">Newest events first</p></div>
              <span className="flex items-center gap-2 text-xs text-[#657682]"><ScrollText className="size-4" />{state.auditEvents.length} events</span>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-[#e4e9eb] px-0 py-0">
            {visibleEvents.map((event) => (
              <article key={event.id} className="grid gap-2 px-5 py-4 md:grid-cols-[140px_170px_minmax(0,1fr)_50px] md:items-start md:gap-4">
                <time className="text-xs tabular-nums text-[#657682]" dateTime={event.timestamp}>{formatTimestamp(event.timestamp)} IST</time>
                <div><p className="text-sm font-semibold text-[#163247]">{event.action}</p><p className="mt-0.5 text-xs text-[#657682]">{event.actor}</p></div>
                <p className="text-sm leading-6 text-[#526675]">{event.detail}</p>
                <span className="text-left font-mono text-xs text-[#657682] md:text-right">{event.version ? `v${event.version}` : '—'}</span>
              </article>
            ))}
            {state.auditEvents.length > 5 ? (
              <div className="p-4 text-center"><Button variant="outline" className="h-11" onClick={() => setShowAll((value) => !value)}>{showAll ? 'Show latest 5' : `Show all ${Math.min(30, state.auditEvents.length)}`}</Button></div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="h-fit gap-0 rounded-xl py-0 shadow-none ring-[#d8e0e4]">
          <CardContent className="px-5 py-1">
            <Accordion>
              <AccordionItem value="sources">
                <AccordionTrigger className="min-h-12 no-underline hover:no-underline"><span className="flex items-center gap-2"><Database className="size-4 text-[#0b737a]" /><strong className="text-[#163247]">Source details</strong></span></AccordionTrigger>
                <AccordionContent className="pb-5">
                  <div className="divide-y divide-[#e4e9eb] rounded-xl border border-[#d8e0e4]">
                    {state.sources.map((source) => (
                      <div key={source.id} className="flex items-start justify-between gap-3 p-3">
                        <div><p className="text-sm font-semibold text-[#163247]"><span className="mr-2 font-mono text-xs text-[#0b737a]">{source.id}</span>{source.label}</p><p className="mt-1 text-xs leading-5 text-[#657682]">{source.records} fixture records · {formatTimestamp(source.updatedAt)} IST</p></div>
                        <StatusBadge status={source.status} />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="controls">
                <AccordionTrigger className="min-h-12 no-underline hover:no-underline"><span className="flex items-center gap-2"><RotateCcw className="size-4 text-[#0b737a]" /><strong className="text-[#163247]">Demo controls</strong></span></AccordionTrigger>
                <AccordionContent className="space-y-3 pb-5">
                  <p className="text-sm leading-6 text-[#526675]">Use these controls to demonstrate fail-closed planning or restore the original device-local fixture.</p>
                  <Button variant="outline" className="h-11 w-full justify-start" disabled={state.dataGate === 'stale'} onClick={handleStale}><AlertTriangle />{state.dataGate === 'stale' ? 'COA already stale' : 'Simulate stale COA data'}</Button>
                  {state.dataGate === 'stale' ? <Button className="h-11 w-full justify-start bg-[#0b6871] text-white hover:bg-[#075860]" onClick={handleRefresh}><RefreshCw />Refresh and restore readiness</Button> : null}
                  <Button variant="outline" className="h-11 w-full justify-start border-[#e0b9b6] text-[#9d403d] hover:bg-[#fff3f2]" onClick={() => setResetOpen(true)}><RotateCcw />Reset prototype data</Button>
                  <p className="text-xs leading-5 text-[#657682]">Nothing here writes to a shared database or live Railway system.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all prototype data?</AlertDialogTitle>
            <AlertDialogDescription>This removes device-local tasks, requests and audit events created during this demo and restores the original fixture.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Keep data</AlertDialogCancel>
            <AlertDialogAction className="h-11 bg-[#9d403d] text-white hover:bg-[#843532]" onClick={handleReset}>Reset prototype</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RailShell>
  );
}
