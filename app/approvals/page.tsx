'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import { PageHeading } from '@/components/page-heading';
import { RailShell } from '@/components/rail-shell';
import { StatusBadge } from '@/components/status-badge';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { usePrototype } from '@/components/prototype-provider';
import { formatPlanningDate, formatTimestamp } from '@/lib/format';
import { plans, type Approval, type ApprovalStatus, type PlanId } from '@/lib/rail-data';
import { cn } from '@/lib/utils';

type QueueFilter = 'All' | ApprovalStatus;
type DecisionAction = 'approve' | 'changes' | 'reject';

const planIds: PlanId[] = ['A', 'B', 'C'];

function subscribeToLocation(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

function getApprovalQuery() {
  return new URLSearchParams(window.location.search).get('approval') ?? '';
}

function getServerApprovalQuery() {
  return '';
}

function firstAlternative(approval: Approval | undefined) {
  return planIds.find((planId) => planId !== approval?.planId) ?? 'A';
}

export default function ApprovalsPage() {
  const { state, pendingCount, hydrated, decideApproval } = usePrototype();
  const firstPending = state.approvals.find((approval) => approval.status === 'Submitted');
  const approvalQuery = useSyncExternalStore(
    subscribeToLocation,
    getApprovalQuery,
    getServerApprovalQuery,
  );
  const requestedApproval = state.approvals.find((approval) => approval.id === approvalQuery);
  const [queryDismissed, setQueryDismissed] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [filter, setFilter] = useState<QueueFilter>('Submitted');
  const [decisionAction, setDecisionAction] = useState<DecisionAction | null>(null);
  const [reason, setReason] = useState('');
  const [alternatePlan, setAlternatePlan] = useState<PlanId>(firstAlternative(firstPending));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const queryIsActive = Boolean(requestedApproval && !queryDismissed && !selectedId);
  const activeFilter: QueueFilter = queryIsActive ? 'All' : filter;

  const visibleApprovals = useMemo(
    () => state.approvals.filter((approval) => activeFilter === 'All' || approval.status === activeFilter),
    [activeFilter, state.approvals],
  );
  const selectedApproval =
    visibleApprovals.find((approval) => approval.id === selectedId) ??
    (queryIsActive ? requestedApproval : undefined) ??
    visibleApprovals[0];
  const selectedPlan = selectedApproval ? plans[selectedApproval.planId] : null;
  const selectedTasks = selectedApproval
    ? state.tasks.filter((task) => selectedApproval.selectedTaskIds.includes(task.id))
    : [];

  function chooseApproval(approval: Approval) {
    setQueryDismissed(true);
    setSelectedId(approval.id);
    setAlternatePlan(firstAlternative(approval));
    setDecisionAction(null);
    setReason('');
    setError('');
    setNotice('');
  }

  function reviewDecision(action: DecisionAction) {
    setDecisionAction(action);
    setError('');
    if (action === 'changes') {
      setAlternatePlan(firstAlternative(selectedApproval));
    }
    if (action === 'approve') {
      setConfirmOpen(true);
      return;
    }
    setReason('');
  }

  function openConfirmation() {
    if (!selectedApproval || !decisionAction) return;
    if (decisionAction !== 'approve' && !reason.trim()) {
      setError('Enter an officer reason before continuing.');
      return;
    }
    if (decisionAction === 'changes' && alternatePlan === selectedApproval.planId) {
      setError('Choose a plan different from the submitted plan.');
      return;
    }
    setConfirmOpen(true);
  }

  function confirmDecision() {
    if (!selectedApproval || !decisionAction) return;
    const success = decideApproval(
      selectedApproval.id,
      decisionAction,
      reason,
      decisionAction === 'changes' ? alternatePlan : undefined,
    );
    setConfirmOpen(false);
    if (!success) {
      setError('This request is no longer pending or the decision is incomplete.');
      return;
    }
    setFilter('All');
    setSelectedId(selectedApproval.id);
    setError('');
    setReason('');
    setNotice(
      decisionAction === 'approve'
        ? `${selectedApproval.id} was approved in the prototype. No railway block was issued.`
        : decisionAction === 'changes'
          ? `${selectedApproval.id} was returned with a request for Plan ${alternatePlan}.`
          : `${selectedApproval.id} was rejected with the recorded reason.`,
    );
    setDecisionAction(null);
  }

  const confirmationTitle =
    decisionAction === 'approve'
      ? 'Approve this prototype request?'
      : decisionAction === 'changes'
        ? 'Return this request for changes?'
        : 'Reject this prototype request?';

  return (
    <RailShell>
      <PageHeading
        eyebrow="Control Officer demo"
        title="Approvals"
        description="Review one submitted recommendation at a time and record a clear simulated decision."
        action={<Badge className="rounded-md bg-[#fff0e2] text-[#91450f]">{hydrated ? pendingCount : '—'} pending</Badge>}
      />

      {notice ? <output aria-live="polite" className="mb-4 block rounded-xl border border-[#cfe1e2] bg-[#f0f8f8] px-4 py-3 text-sm text-[#075f69]">{notice}</output> : null}

      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="h-fit gap-0 rounded-xl py-0 shadow-none ring-[#d8e0e4]">
          <CardHeader className="border-b border-[#e4e9eb] px-4 py-4">
            <div className="flex items-end justify-between gap-3">
              <div><h2 className="text-base font-semibold text-[#163247]">Review queue</h2><p className="mt-1 text-xs text-[#657682]">Newest requests first</p></div>
              <NativeSelect aria-label="Filter approvals" className="[&_select]:h-10" value={activeFilter} onChange={(event) => {
                const nextFilter = event.target.value as QueueFilter;
                const nextApproval = state.approvals.find((approval) => nextFilter === 'All' || approval.status === nextFilter);
                setQueryDismissed(true);
                setFilter(nextFilter);
                setSelectedId(nextApproval?.id ?? '');
                setAlternatePlan(firstAlternative(nextApproval));
                setDecisionAction(null);
                setReason('');
                setError('');
                setNotice('');
              }}>
                <NativeSelectOption value="Submitted">Pending</NativeSelectOption>
                <NativeSelectOption value="All">All records</NativeSelectOption>
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
                <button key={approval.id} type="button" aria-pressed={active} onClick={() => chooseApproval(approval)} className={cn('grid min-h-28 w-full grid-cols-[minmax(0,1fr)_24px] items-center gap-3 px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[#0b737a]/25', active ? 'bg-[#eef7f7]' : 'hover:bg-[#f7f9fa]')}>
                  <span>
                    <span className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-xs font-semibold text-[#0b737a]">{approval.id}</span><StatusBadge status={approval.status} /></span>
                    <span className="mt-2 block text-sm font-semibold text-[#163247]">Plan {approval.planId} · {formatPlanningDate(approval.planningDate)}</span>
                    <span className="mt-1 block truncate text-xs text-[#657682]">{approval.section} · {approval.selectedTaskIds.length} tasks</span>
                  </span>
                  <ChevronRight className="size-5 text-[#0b737a]" aria-hidden="true" />
                </button>
              );
            }) : (
              <div className="p-8 text-center"><p className="text-sm text-[#657682]">No records match this filter.</p><Button variant="outline" className="mt-4 h-11" onClick={() => setFilter('All')}>Show all records</Button></div>
            )}
          </CardContent>
        </Card>

        {selectedApproval && selectedPlan ? (
          <div className="space-y-5">
            <Card className="gap-0 rounded-xl border-t-4 border-t-[#0b737a] py-0 shadow-[0_12px_34px_rgba(16,42,64,0.07)] ring-[#cddbdd]">
              <CardHeader className="border-b border-[#e4e9eb] px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-semibold text-[#0b737a]">{selectedApproval.recommendationId}</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[#163247]">Plan {selectedApproval.planId} · {selectedPlan.window}</h2>
                    <p className="mt-1 text-sm text-[#657682]">{selectedApproval.section} · {formatPlanningDate(selectedApproval.planningDate)}</p>
                  </div>
                  <StatusBadge status={selectedApproval.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Metric label="Protected" value={`${selectedPlan.protectedMinutes} min`} />
                  <Metric label="Expected delay" value={`${selectedPlan.impactMinutes} min`} />
                  <Metric label="Safety duration" value={`${selectedPlan.p90Minutes} min`} />
                  <Metric label="Work items" value={String(selectedTasks.length)} />
                </div>
                <section>
                  <h3 className="text-sm font-semibold text-[#163247]">Included work</h3>
                  <ul className="mt-3 grid gap-2 md:grid-cols-2">
                    {selectedTasks.map((task) => <li key={task.id} className="rounded-lg bg-[#f4f6f7] p-3 text-sm text-[#526675]"><span className="font-mono text-xs font-semibold text-[#0b737a]">{task.id}</span><span className="ml-2 font-medium text-[#163247]">{task.title}</span><span className="mt-1 block text-xs">{task.department}</span></li>)}
                  </ul>
                </section>
                <div className="rounded-xl bg-[#f4f6f7] p-4 text-sm leading-6 text-[#526675]"><strong className="text-[#344b5d]">Planner note:</strong> {selectedApproval.note || 'No note supplied.'}</div>
                <p className="text-xs text-[#657682]">Submitted by {selectedApproval.submittedBy} · {formatTimestamp(selectedApproval.submittedAt)} IST · version {selectedApproval.version}</p>
              </CardContent>
            </Card>

            {selectedApproval.status === 'Submitted' ? (
              <Card className="gap-0 rounded-xl py-0 shadow-none ring-[#d8e0e4]">
                <CardHeader className="border-b border-[#e4e9eb] px-5 py-4"><h2 className="text-base font-semibold text-[#163247]">Choose a decision</h2><p className="text-sm text-[#657682]">Only the fields needed for that decision will appear.</p></CardHeader>
                <CardContent className="space-y-4 p-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Button className="h-12 bg-[#0b6871] text-white hover:bg-[#075860]" onClick={() => reviewDecision('approve')}><CheckCircle2 />Approve</Button>
                    <Button variant="outline" className="h-12" onClick={() => reviewDecision('changes')}><MessageSquare />Request changes</Button>
                    <Button variant="outline" className="h-12 border-[#e0b9b6] text-[#9d403d] hover:bg-[#fff3f2]" onClick={() => reviewDecision('reject')}><XCircle />Reject</Button>
                  </div>

                  {decisionAction === 'changes' ? (
                    <div className="space-y-4 rounded-xl border border-[#d8e0e4] bg-[#f8f9fa] p-4">
                      <div className="space-y-1.5"><Label htmlFor="alternate-plan">Requested alternative</Label><NativeSelect id="alternate-plan" className="w-full [&_select]:h-11" value={alternatePlan} onChange={(event) => setAlternatePlan(event.target.value as PlanId)}>{planIds.filter((planId) => planId !== selectedApproval.planId).map((planId) => <NativeSelectOption key={planId} value={planId}>Plan {planId} · {plans[planId].window}</NativeSelectOption>)}</NativeSelect></div>
                      <ReasonField value={reason} onChange={setReason} error={error} placeholder="Explain what the planner should change" />
                      <Button className="h-11 bg-[#0b6871] text-white hover:bg-[#075860]" onClick={openConfirmation}>Review change request</Button>
                    </div>
                  ) : null}

                  {decisionAction === 'reject' ? (
                    <div className="space-y-4 rounded-xl border border-[#e8c8c5] bg-[#fff8f7] p-4">
                      <ReasonField value={reason} onChange={setReason} error={error} placeholder="Explain why this request cannot proceed" />
                      <Button variant="destructive" className="h-11" onClick={openConfirmation}><XCircle />Review rejection</Button>
                    </div>
                  ) : null}
                  <p className="text-xs leading-5 text-[#657682]">Prototype decision only. Approval does not issue a traffic or power block and performs no Railway-system writeback.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-xl py-0 shadow-none ring-[#d8e0e4]"><CardContent className="flex items-start gap-3 p-5"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#0b737a]" /><div><p className="text-sm font-semibold text-[#163247]">Decision recorded</p><p className="mt-1 text-sm leading-6 text-[#526675]">{selectedApproval.officerReason || 'No officer note supplied.'}</p>{selectedApproval.requestedPlanId ? <p className="mt-2 text-sm font-medium text-[#075f69]">Requested alternative: Plan {selectedApproval.requestedPlanId}</p> : null}{selectedApproval.decidedAt ? <p className="mt-2 text-xs text-[#657682]">Control Officer (simulated) · {formatTimestamp(selectedApproval.decidedAt)} IST</p> : null}</div></CardContent></Card>
            )}
          </div>
        ) : (
          <Card className="rounded-xl py-12 text-center shadow-none ring-[#d8e0e4]"><CardContent><p className="text-sm text-[#657682]">Select or submit an approval request to begin review.</p></CardContent></Card>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmationTitle}</AlertDialogTitle>
            <AlertDialogDescription>This records an auditable prototype decision for {selectedApproval?.id}. It cannot be undone without resetting device-local demo data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction className={cn('h-11', decisionAction === 'reject' ? 'bg-[#9d403d] text-white hover:bg-[#843532]' : 'bg-[#0b6871] text-white hover:bg-[#075860]')} onClick={confirmDecision}>
              Confirm {decisionAction === 'changes' ? 'request' : decisionAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RailShell>
  );
}

function ReasonField({ value, onChange, error, placeholder }: { value: string; onChange: (value: string) => void; error: string; placeholder: string }) {
  return <div className="space-y-1.5"><Label htmlFor="officer-reason">Officer reason</Label><Textarea id="officer-reason" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-invalid={Boolean(error)} aria-describedby={error ? 'officer-reason-error' : undefined} />{error ? <p id="officer-reason-error" role="alert" className="text-sm text-[#9d403d]">{error}</p> : null}</div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-[#f2f5f6] p-3"><p className="text-xs text-[#657682]">{label}</p><p className="mt-1 text-base font-semibold tabular-nums text-[#163247]">{value}</p></div>;
}
