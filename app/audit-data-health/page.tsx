'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, RefreshCw, RotateCcw, ScrollText, ShieldCheck } from 'lucide-react';

import { PageHeading } from '@/components/page-heading';
import { RailShell } from '@/components/rail-shell';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePrototype } from '@/components/prototype-provider';
import { formatTimestamp } from '@/lib/format';

export default function AuditDataHealthPage() {
  const { state, refreshSources, setDataGate, resetPrototype } = usePrototype();
  const [notice, setNotice] = useState('');

  function handleRefresh() {
    refreshSources();
    setNotice('Synthetic source timestamps refreshed. Generate a new weekly recommendation to use the snapshot.');
  }

  function handleReset() {
    resetPrototype();
    setNotice('Device-local prototype data was reset to the original SIH demo fixture.');
  }

  return (
    <RailShell>
      <PageHeading
        eyebrow="Traceability and fail-closed controls"
        title="Audit & Data Health"
        description="Inspect source freshness and every meaningful planning or officer action recorded by this device-local prototype."
        action={<Button onClick={handleRefresh}><RefreshCw />Refresh demo sources</Button>}
      />

      {notice ? <output aria-live="polite" className="mb-4 block rounded-md border border-[#cfe1e2] bg-[#f0f8f8] px-4 py-3 text-sm text-[#075f69]">{notice}</output> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <Card className="gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
          <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><CardTitle className="text-[15px] font-semibold text-[#163247]">Source freshness</CardTitle><CardDescription className="mt-1 text-xs">Synthetic connector snapshots; no live API calls</CardDescription></div>
              <StatusBadge status={state.dataGate === 'ready' ? 'Ready' : 'Stale'} />
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-[#e4e9eb] px-5 py-0">
            {state.sources.map((source) => (
              <div key={source.id} className="grid gap-2 py-4 sm:grid-cols-[70px_minmax(0,1fr)_150px_90px] sm:items-center">
                <span className="font-mono text-xs font-semibold text-[#0b737a]">{source.id}</span>
                <span><span className="block text-sm font-medium text-[#163247]">{source.label}</span><span className="mt-0.5 block text-xs text-[#637483]">{source.records} fixture records</span></span>
                <span className="text-xs text-[#526675]">{formatTimestamp(source.updatedAt)} IST</span>
                <span><StatusBadge status={source.status} /></span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="gap-0 rounded-lg border-t-[3px] border-t-[#0b737a] py-0 shadow-none ring-[#cddbdd]">
            <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#163247]"><ShieldCheck className="size-5 text-[#0b737a]" />Planning data gate</div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3 rounded-md bg-[#f6f8f9] p-3">
                {state.dataGate === 'ready' ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#21835d]" /> : <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#b4443f]" />}
                <div><p className="text-sm font-semibold text-[#163247]">{state.dataGate === 'ready' ? 'Fixture snapshot accepted' : 'New planning is blocked'}</p><p className="mt-1 text-xs leading-5 text-[#637483]">{state.dataGate === 'ready' ? 'A new deterministic run may proceed; hard constraints still apply.' : 'Stale COA data fails closed. There is no manual bypass in the prototype.'}</p></div>
              </div>
              <Label className="flex items-center justify-between rounded-md border border-[#d8e0e4] p-3">
                <span><span className="block text-sm font-medium text-[#163247]">Simulate stale COA</span><span className="mt-1 block text-xs font-normal leading-5 text-[#637483]">Demonstrate fail-closed behavior</span></span>
                <Switch checked={state.dataGate === 'stale'} onCheckedChange={(checked) => { setDataGate(checked ? 'stale' : 'ready'); setNotice(checked ? 'COA marked stale. Weekly generation is now blocked.' : 'COA gate restored. A fresh weekly run is required.'); }} aria-label="Simulate stale COA data" />
              </Label>
            </CardContent>
          </Card>

          <Card className="rounded-lg py-0 shadow-none ring-[#d8e0e4]">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start gap-3"><Database className="mt-0.5 size-5 shrink-0 text-[#0b737a]" /><div><p className="text-sm font-semibold text-[#163247]">Prototype storage</p><p className="mt-1 text-xs leading-5 text-[#637483]">Tasks, requests and audit events persist in this browser only. There is no shared production database.</p></div></div>
              <Button variant="outline" className="w-full" onClick={handleReset}><RotateCcw />Reset prototype data</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-4 gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
        <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><CardTitle className="text-[15px] font-semibold text-[#163247]">Action audit</CardTitle><CardDescription className="mt-1 text-xs">Newest first · actor, action, detail and recommendation version</CardDescription></div>
            <span className="flex items-center gap-2 text-xs text-[#637483]"><ScrollText className="size-4" />{state.auditEvents.length} events</span>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-[#e4e9eb] px-5 py-0">
          {state.auditEvents.slice(0, 30).map((event) => (
            <article key={event.id} className="grid gap-2 py-4 md:grid-cols-[150px_190px_minmax(0,1fr)_60px] md:items-start md:gap-4">
              <time className="text-xs tabular-nums text-[#637483]" dateTime={event.timestamp}>{formatTimestamp(event.timestamp)} IST</time>
              <div><p className="text-sm font-medium text-[#163247]">{event.action}</p><p className="mt-0.5 text-xs text-[#637483]">{event.actor}</p></div>
              <p className="text-sm leading-6 text-[#526675]">{event.detail}</p>
              <span className="text-right font-mono text-xs text-[#637483]">{event.version ? `v${event.version}` : '—'}</span>
            </article>
          ))}
        </CardContent>
      </Card>
    </RailShell>
  );
}

