'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, MessageSquare, ShieldCheck, XCircle } from 'lucide-react';

import { PageHeading } from '@/components/page-heading';
import { RailShell } from '@/components/rail-shell';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { usePrototype } from '@/components/prototype-provider';
import { formatPlanningDate, formatTimestamp } from '@/lib/format';
import { plans, type ApprovalStatus, type PlanId } from '@/lib/rail-data';
import { cn } from '@/lib/utils';

type QueueFilter = 'All' | ApprovalStatus;

export default function ApprovalsPage() {
  const { state, pendingCount, decideApproval } = usePrototype();
  const [selectedId, setSelectedId] = useState('');
  const [filter, setFilter] = useState<QueueFilter>('All');
  const [reason, setReason] = useState('');
  const [alternatePlan, setAlternatePlan] = useState<PlanId>(
    () => state.approvals.find((approval) => approval.status === 'Submitted')?.planId ?? 'A',
  );
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const visibleApprovals = useMemo(
    () => state.approvals.filter((approval) => filter === 'All' || approval.status === filter),
    [filter, state.approvals],
  );
  const selectedApproval =
    visibleApprovals.find((approval) => approval.id === selectedId) ??
    visibleApprovals.find((approval) => approval.status === 'Submitted') ??
    visibleApprovals[0];
  const selectedPlan = selectedApproval ? plans[selectedApproval.planId] : null;
  const selectedTasks = selectedApproval
    ? state.tasks.filter((task) => selectedApproval.selectedTaskIds.includes(task.id))
    : [];

  function makeDecision(action: 'approve' | 'changes' | 'reject') {
    if (!selectedApproval) return;
    if (action !== 'approve' && !reason.trim()) {
      setError('Enter an officer reason before requesting changes or rejecting.');
      return;
    }
    const success = decideApproval(
      selectedApproval.id,
      action,
      reason,
      action === 'changes' ? alternatePlan : undefined,
    );
    if (!success) {
      setError('This record is no longer pending or the decision is incomplete.');
      return;
    }
    setError('');
    setReason('');
    setNotice(
      action === 'approve'
        ? `${selectedApproval.id} was recorded as approved in the prototype. No block was issued.`
        : action === 'changes'
          ? `${selectedApproval.id} was returned to the planner with an alternative-plan request.`
          : `${selectedApproval.id} was rejected with the required reason.`,
    );
  }

  return (
    <RailShell>
      <PageHeading
        eyebrow="Control Officer demo"
        title="Approvals"
        description="Inspect submitted recommendations and record a simulated officer decision with an auditable reason."
        action={<Badge className="rounded-md bg-[#fff0e2] text-[#91450f]">{pendingCount} pending</Badge>}
      />

      <div className="mb-4 rounded-md border border-[#e6d5bd] bg-[#fff9f1] px-4 py-3 text-sm leading-6 text-[#75431d]">
        <strong>Officer simulation only.</strong> Approval here freezes a prototype record; it is not a sanctioned traffic/power block and performs no BDMS or Railway-system writeback.
      </div>
      {notice ? <output aria-live="polite" className="mb-4 block rounded-md border border-[#cfe1e2] bg-[#f0f8f8] px-4 py-3 text-sm text-[#075f69]">{notice}</output> : null}

      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
          <CardHeader className="border-b border-[#e4e9eb] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div><CardTitle className="text-[15px] font-semibold text-[#163247]">Review queue</CardTitle><CardDescription className="mt-1 text-xs">Derived from persisted prototype records</CardDescription></div>
              <NativeSelect aria-label="Filter approvals" size="sm" value={filter} onChange={(event) => setFilter(event.target.value as QueueFilter)}>
                <NativeSelectOption value="All">All</NativeSelectOption>
                <NativeSelectOption value="Submitted">Submitted</NativeSelectOption>
                <NativeSelectOption value="Approved (simulated)">Approved</NativeSelectOption>
                <NativeSelectOption value="Changes requested">Changes</NativeSelectOption>
                <NativeSelectOption value="Rejected">Rejected</NativeSelectOption>
              </NativeSelect>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-[#e4e9eb] px-0 py-0">
            {visibleApprovals.length ? visibleApprovals.map((approval) => {
              const active = selectedApproval?.id === approval.id;
              return (
                <button key={approval.id} type="button" aria-pressed={active} onClick={() => { setSelectedId(approval.id); setAlternatePlan(approval.planId); setError(''); setReason(''); }} className={cn('w-full px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[#0b737a]/25', active ? 'bg-[#eef7f7]' : 'hover:bg-[#f7f9fa]')}>
                  <span className="flex items-start justify-between gap-2"><span className="font-mono text-xs font-semibold text-[#0b737a]">{approval.id}</span><StatusBadge status={approval.status} /></span>
                  <span className="mt-2 block text-sm font-medium text-[#163247]">Plan {approval.planId} · {approval.section}</span>
                  <span className="mt-1 block text-xs text-[#637483]">{formatPlanningDate(approval.planningDate)} · v{approval.version} · {approval.selectedTaskIds.length} tasks</span>
                </button>
              );
            }) : <div className="p-8 text-center text-sm text-[#637483]">No records match this filter.</div>}
          </CardContent>
        </Card>

        {selectedApproval && selectedPlan ? (
          <div className="space-y-4">
            <Card className="gap-0 rounded-lg border-t-[3px] border-t-[#0b737a] py-0 shadow-none ring-[#cddbdd]">
              <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-semibold text-[#0b737a]">{selectedApproval.recommendationId}</p>
                    <CardTitle className="mt-2 text-xl font-semibold text-[#163247]">Plan {selectedApproval.planId} · {selectedPlan.window}</CardTitle>
                    <CardDescription className="mt-1">{selectedApproval.section} · {formatPlanningDate(selectedApproval.planningDate)}</CardDescription>
                  </div>
                  <StatusBadge status={selectedApproval.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="grid gap-2 sm:grid-cols-4">
                  <Metric label="Protected" value={`${selectedPlan.protectedMinutes} min`} />
                  <Metric label="Train impact" value={`${selectedPlan.impactMinutes} min`} />
                  <Metric label="Utilization" value={`${selectedPlan.utilization}%`} />
                  <Metric label="Confidence" value={`${selectedPlan.confidence}%`} />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="rounded-md border border-[#d8e0e4] p-4">
                    <h2 className="text-sm font-semibold text-[#163247]">Included work</h2>
                    <ul className="mt-3 space-y-2">
                      {selectedTasks.map((task) => <li key={task.id} className="flex items-center justify-between gap-3 text-sm"><span><span className="font-mono text-xs font-semibold text-[#0b737a]">{task.id}</span> · {task.title}</span>{task.mandatory ? <Badge className="rounded-md bg-[#e8f2f4] text-[#075f69]">Mandatory</Badge> : null}</li>)}
                    </ul>
                  </section>
                  <section className="rounded-md border border-[#d8e0e4] p-4">
                    <h2 className="text-sm font-semibold text-[#163247]">Constraint summary</h2>
                    <ul className="mt-3 space-y-2 text-sm text-[#526675]"><li>• Mandatory P90 duration fits protected time</li><li>• Train and forecast freight paths checked</li><li>• Resource and isolation fixture ready</li><li>• Grouping remains conditional</li></ul>
                  </section>
                </div>
                <div className="rounded-md bg-[#f6f8f9] p-3 text-sm leading-6 text-[#526675]"><strong className="text-[#344b5d]">Planner note:</strong> {selectedApproval.note || 'No note supplied.'}</div>
                <div className="flex flex-wrap justify-between gap-2 text-xs text-[#637483]"><span>Submitted by {selectedApproval.submittedBy} · {formatTimestamp(selectedApproval.submittedAt)} IST</span><span>Rules v3.2 · fixture solver v0.3</span></div>
              </CardContent>
            </Card>

            {selectedApproval.status === 'Submitted' ? (
              <Card className="gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
                <CardHeader className="border-b border-[#e4e9eb] px-5 py-4"><CardTitle className="text-[15px] font-semibold text-[#163247]">Record officer decision</CardTitle><CardDescription className="mt-1 text-xs">A reason is mandatory for changes or rejection.</CardDescription></CardHeader>
                <CardContent className="space-y-4 p-5">
                  <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                    <div className="space-y-1.5"><Label htmlFor="alternate-plan">Requested alternative</Label><NativeSelect id="alternate-plan" className="w-full" value={alternatePlan} onChange={(event) => setAlternatePlan(event.target.value as PlanId)}><NativeSelectOption value="A">Plan A</NativeSelectOption><NativeSelectOption value="B">Plan B</NativeSelectOption><NativeSelectOption value="C">Plan C</NativeSelectOption></NativeSelect></div>
                    <div className="space-y-1.5"><Label htmlFor="officer-reason">Officer reason / condition</Label><Textarea id="officer-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for changes or rejection; optional for approval" aria-invalid={Boolean(error)} /></div>
                  </div>
                  {error ? <p role="alert" className="text-sm text-[#9d403d]">{error}</p> : null}
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button variant="destructive" onClick={() => makeDecision('reject')}><XCircle />Reject</Button>
                    <Button variant="outline" onClick={() => makeDecision('changes')}><MessageSquare />Request changes</Button>
                    <Button className="bg-[#0b6871] text-white hover:bg-[#075860]" onClick={() => makeDecision('approve')}><CheckCircle2 />Approve in prototype</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-lg py-0 shadow-none ring-[#d8e0e4]"><CardContent className="flex items-start gap-3 p-5"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#0b737a]" /><div><p className="text-sm font-semibold text-[#163247]">Decision recorded</p><p className="mt-1 text-sm leading-6 text-[#526675]">{selectedApproval.officerReason || 'No officer note supplied.'}</p>{selectedApproval.decidedAt ? <p className="mt-2 text-xs text-[#637483]">Control Officer (simulated) · {formatTimestamp(selectedApproval.decidedAt)} IST</p> : null}</div></CardContent></Card>
            )}
          </div>
        ) : (
          <Card className="rounded-lg py-12 text-center shadow-none ring-[#d8e0e4]"><CardContent><p className="text-sm text-[#637483]">Select or submit an approval record to begin review.</p></CardContent></Card>
        )}
      </div>
    </RailShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-[#f5f7f8] p-3"><p className="text-[11px] uppercase tracking-[0.07em] text-[#637483]">{label}</p><p className="mt-1 text-sm font-semibold text-[#163247]">{value}</p></div>;
}
