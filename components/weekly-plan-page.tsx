'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Info,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';

import { PageHeading } from '@/components/page-heading';
import { RailShell } from '@/components/rail-shell';
import { StatusBadge } from '@/components/status-badge';
import { TaskDetailDialog } from '@/components/task-detail-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { usePrototype } from '@/components/prototype-provider';
import { formatPlanningDate, formatTimestamp } from '@/lib/format';
import {
  candidateWindows,
  divisions,
  plans,
  scenarioLabels,
  sectionsByDivision,
  type CandidateWindow,
  type PlanId,
  type PlanningScenario,
  type Task,
} from '@/lib/rail-data';
import { cn } from '@/lib/utils';

const planPositions: Record<PlanId, { left: string; width: string }> = {
  A: { left: '38.9%', width: '27.8%' },
  B: { left: '43.1%', width: '27.8%' },
  C: { left: '36.1%', width: '36.1%' },
};

export function WeeklyPlanPage() {
  const {
    state,
    setPlanningField,
    generatePlans,
    selectPlan,
    toggleTask,
    revalidateDraft,
    submitForReview,
    simulateReplan,
  } = usePrototype();
  const [selectedWindowId, setSelectedWindowId] = useState<CandidateWindow['id']>('selected');
  const [taskDetail, setTaskDetail] = useState<Task | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [plannerNote, setPlannerNote] = useState('');
  const [notice, setNotice] = useState('');
  const [validating, setValidating] = useState(false);

  const plan = plans[state.selectedPlanId];
  const selectedTasks = state.tasks.filter((task) =>
    state.selectedTaskIds.includes(task.id),
  );
  const eligibleTasks = state.tasks.filter((task) => !task.quarantined).slice(0, 5);
  const inspectedWindow = useMemo(() => {
    const candidate = candidateWindows.find((window) => window.id === selectedWindowId) ?? candidateWindows[1];
    return candidate.id === 'selected'
      ? { ...candidate, time: plan.window, reason: plan.rationale, impactMinutes: plan.impactMinutes }
      : candidate;
  }, [plan, selectedWindowId]);
  const currentApproval = state.approvals.find(
    (approval) =>
      approval.version === state.recommendationVersion &&
      approval.section === state.section &&
      approval.planningDate === state.planningDate,
  );

  async function handleGenerate() {
    setNotice('');
    const result = await generatePlans();
    setSelectedWindowId('selected');
    setNotice(
      result === 'feasible'
        ? 'Three deterministic alternatives generated and checked against the demo hard constraints.'
        : result === 'infeasible'
          ? 'No hard-feasible recommendation exists for this fixture. Named conflicts are shown below.'
          : 'Generation stopped: the COA snapshot is stale.',
    );
  }

  async function handleRevalidate() {
    setValidating(true);
    const valid = await revalidateDraft();
    setValidating(false);
    setNotice(valid ? 'Task set revalidated against the deterministic demo constraints.' : 'Revalidation is unavailable until data is ready.');
  }

  function handleSubmit() {
    const approvalId = submitForReview(plannerNote);
    if (!approvalId) {
      setNotice('Submission blocked. Generate and validate a feasible draft first.');
      return;
    }
    setReviewOpen(false);
    setPlannerNote('');
    setNotice(`${approvalId} is now in the simulated Control Officer queue.`);
  }

  return (
    <RailShell>
      <PageHeading
        eyebrow={`Weekly planning · ${formatPlanningDate(state.planningDate)}`}
        title="Weekly Block Plan"
        description="Compare protected corridor capacity with Engineering, S&T and TRD maintenance demand."
        action={
          <div className="flex items-center gap-2 text-xs text-[#526675]">
            <Clock3 className="size-3.5" aria-hidden="true" />
            Run {formatTimestamp(state.lastRunAt)} IST
          </div>
        }
      />

      <Card className="mb-4 gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
        <CardContent className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="division" className="text-[11px] uppercase tracking-[0.09em] text-[#637483]">Division</Label>
              <NativeSelect id="division" className="w-full" value={state.division} disabled={state.runStatus === 'running'} onChange={(event) => setPlanningField('division', event.target.value)}>
                {divisions.map((division) => <NativeSelectOption key={division} value={division}>{division}</NativeSelectOption>)}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="section" className="text-[11px] uppercase tracking-[0.09em] text-[#637483]">Railway section</Label>
              <NativeSelect id="section" className="w-full" value={state.section} disabled={state.runStatus === 'running'} onChange={(event) => setPlanningField('section', event.target.value)}>
                {sectionsByDivision[state.division].map((section) => (
                  <NativeSelectOption key={section} value={section}>{section}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="planning-date" className="text-[11px] uppercase tracking-[0.09em] text-[#637483]">Planning date</Label>
              <Input id="planning-date" type="date" value={state.planningDate} disabled={state.runStatus === 'running'} onChange={(event) => setPlanningField('planningDate', event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scenario" className="text-[11px] uppercase tracking-[0.09em] text-[#637483]">Demo scenario</Label>
              <NativeSelect id="scenario" className="w-full" value={state.scenario} disabled={state.runStatus === 'running'} onChange={(event) => setPlanningField('scenario', event.target.value as PlanningScenario)}>
                {(Object.entries(scenarioLabels) as Array<[PlanningScenario, string]>).map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>
          <Button className="h-9 bg-[#0b6871] px-4 text-white hover:bg-[#075860]" onClick={handleGenerate} disabled={state.runStatus === 'running'}>
            {state.runStatus === 'running' ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
            {state.runStatus === 'running' ? 'Checking constraints…' : 'Generate plans'}
          </Button>
        </CardContent>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#e4e9eb] bg-[#f8fafb] px-4 py-2.5 text-xs text-[#526675]">
          <span className="font-semibold uppercase tracking-[0.08em] text-[#91450f]">Simulation</span>
          <span className="flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', state.dataGate === 'ready' ? 'bg-[#21835d]' : 'bg-[#b4443f]')} />
            {state.dataGate === 'ready' ? 'Demo snapshot valid' : 'COA snapshot stale'}
          </span>
          <span>Rule pack Division-X v3.2</span>
          <span className="ml-auto hidden text-[#637483] xl:inline">No live Railway connector</span>
        </div>
        {notice ? <output aria-live="polite" className="border-t border-[#cfe1e2] bg-[#f0f8f8] px-4 py-2 text-xs text-[#075f69]">{notice}</output> : null}
      </Card>

      {state.runStatus === 'running' ? <LoadingState /> : null}
      {state.runStatus === 'idle' ? (
        <EmptyRun onGenerate={handleGenerate} />
      ) : null}
      {state.runStatus === 'blocked' ? (
        <BlockedRun />
      ) : null}
      {state.runStatus === 'infeasible' ? (
        <InfeasibleRun />
      ) : null}

      {state.runStatus === 'feasible' ? (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
            <Card className="gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
              <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-[15px] font-semibold text-[#163247]">Corridor opportunity timeline</CardTitle>
                    <CardDescription className="mt-1 text-xs">{state.section} · 00:00–06:00</CardDescription>
                  </div>
                  <Badge variant="outline" className="rounded-md border-[#b9d3d6] bg-[#f1f8f8] text-[#075f69]">3 candidate windows</Badge>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto px-5 py-5">
                <div className="min-w-[610px]" aria-label={`Plan ${plan.id} uses ${plan.window}; three candidate windows were evaluated`}>
                  <div className="mb-2 grid grid-cols-7 text-xs tabular-nums text-[#637483]">
                    {['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00'].map((time) => <span key={time}>{time}</span>)}
                  </div>
                  <div className="relative h-16 overflow-hidden rounded-md border border-[#d8e0e4] bg-[repeating-linear-gradient(to_right,#f7f9fa_0,#f7f9fa_calc(16.66%-1px),#dfe5e8_calc(16.66%-1px),#dfe5e8_16.66%)]">
                    <span className="absolute top-2 left-[4%] h-3 w-[10%] rounded-sm bg-[#8ea1ae]" />
                    <span className="absolute top-2 left-[36%] h-3 w-[8%] rounded-sm bg-[#8ea1ae]" />
                    <span className="absolute top-2 left-[70%] h-3 w-[13%] rounded-sm bg-[#8ea1ae]" />
                    <span className="absolute bottom-2 rounded bg-[#0b737a] px-2 py-1 text-center text-[11px] font-semibold text-white" style={planPositions[plan.id]}>
                      Plan {plan.id} · {plan.window}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {candidateWindows.map((window) => {
                      const active = selectedWindowId === window.id;
                      const shownTime = window.id === 'selected' ? plan.window : window.time;
                      return (
                        <button
                          key={window.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setSelectedWindowId(window.id)}
                          className={cn(
                            'rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0b737a]/25',
                            active ? 'border-[#0b737a] bg-[#eef7f7]' : 'border-[#d8e0e4] bg-white hover:bg-[#f6f8f9]',
                          )}
                        >
                          <span className="flex items-center justify-between gap-2 text-xs font-semibold text-[#163247]">
                            {shownTime}
                            <span className={window.status === 'Eligible' ? 'text-[#246c50]' : 'text-[#9d403d]'}>{window.status}</span>
                          </span>
                          <span className="mt-1 block text-xs text-[#637483]">BSS {window.bss} · {window.impactMinutes} impact min</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className={cn('mt-3 rounded-md border p-3', inspectedWindow.status === 'Eligible' ? 'border-[#bfd9ca] bg-[#f0f8f3]' : 'border-[#ebc4c1] bg-[#fff7f5]')}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#163247]">{inspectedWindow.time}</p>
                      <StatusBadge status={inspectedWindow.status} />
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#526675]">{inspectedWindow.reason}</p>
                    <p className="mt-2 text-xs text-[#637483]">Train: {inspectedWindow.trainConflict} · Freight: {inspectedWindow.freightConflict} · Snapshot fresh</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0 rounded-lg border-t-[3px] border-t-[#0b737a] py-0 shadow-none ring-[#cddbdd]">
              <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex rounded-lg border border-[#cbd6db] p-0.5" aria-label="Select recommendation plan">
                    {(Object.keys(plans) as PlanId[]).map((planId) => (
                      <Button key={planId} size="sm" variant={state.selectedPlanId === planId ? 'default' : 'ghost'} aria-pressed={state.selectedPlanId === planId} onClick={() => { selectPlan(planId); setSelectedWindowId('selected'); }} className={state.selectedPlanId === planId ? 'bg-[#0b6871] text-white' : 'text-[#526675]'}>
                        Plan {planId}
                      </Button>
                    ))}
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-[#246c50]"><CheckCircle2 className="size-3.5" aria-hidden="true" />Hard-feasible</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge className="rounded-md bg-[#e7f2f3] text-[#075f69]">{plan.label}</Badge>
                  <span className="text-xs text-[#637483]">Synthetic alternative</span>
                </div>
                <CardTitle className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[#102a40]">{plan.window}</CardTitle>
                <CardDescription>{plan.mode}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-5 py-4">
                <div className="grid grid-cols-3 gap-2">
                  <Metric label="Protected" value={`${plan.protectedMinutes} min`} />
                  <Metric label="Train impact" value={`${plan.impactMinutes} min`} />
                  <Metric label="Utilization" value={`${plan.utilization}%`} />
                </div>
                <div className="rounded-md bg-[#f5f8f8] p-3">
                  <p className="text-xs font-semibold text-[#163247]">Why it ranks here</p>
                  <p className="mt-1 text-xs leading-5 text-[#526675]">{plan.rationale}</p>
                  <Button variant="link" className="mt-1 h-auto p-0 text-xs" onClick={() => setWhyOpen(true)}>View explanation <ChevronRight className="size-3" /></Button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e4e9eb] pt-3 text-xs text-[#637483]">
                  <span>{plan.confidence}% confidence · P90 {plan.p90Minutes} min</span>
                  <span>Rec v{state.recommendationVersion}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
            <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-[15px] font-semibold text-[#163247]">Execution sequence</CardTitle>
                  <CardDescription className="mt-1 text-xs">Grouping is conditional; protection, isolation and handback remain explicit.</CardDescription>
                </div>
                <Badge variant="outline" className="rounded-md">P90 {plan.p90Minutes} min</Badge>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto px-5 py-5">
              <div className="min-w-[700px] space-y-2">
                <SequenceRow label="Protect & isolate" width="18%" offset="0%" tone="bg-[#526675]" detail="Protection + TPC confirmation" />
                <SequenceRow label="Engineering E-17" width="55%" offset="14%" tone="bg-[#0b737a]" detail="Mandatory track work" />
                {state.selectedTaskIds.includes('S-08') ? <SequenceRow label="S&T S-08" width="26%" offset="22%" tone="bg-[#f47a1f]" detail="Conditional overlap" /> : null}
                {state.selectedTaskIds.includes('T-11') ? <SequenceRow label="TRD T-11" width="34%" offset="48%" tone="bg-[#405d86]" detail="After isolation confirmation" /> : null}
                <SequenceRow label="Joint handback" width="18%" offset="82%" tone="bg-[#21835d]" detail="Restore + release" />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
            <Card className="gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
              <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-[15px] font-semibold text-[#163247]">Included maintenance work</CardTitle>
                    <CardDescription className="mt-1 text-xs">Change optional work, then revalidate before sending.</CardDescription>
                  </div>
                  {state.draftDirty ? <StatusBadge status="Revalidation required" /> : <Badge className="rounded-md bg-[#edf7f1] text-[#246c50]">Validated</Badge>}
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-[#e4e9eb] px-5 py-0">
                {eligibleTasks.map((task) => {
                  const checked = state.selectedTaskIds.includes(task.id);
                  return (
                    <div key={task.id} className="grid gap-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                      <Checkbox checked={checked} disabled={task.mandatory} onCheckedChange={() => toggleTask(task.id)} aria-label={`${checked ? 'Remove' : 'Include'} ${task.id} ${task.title}`} />
                      <button type="button" className="min-w-0 text-left" onClick={() => setTaskDetail(task)}>
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#0b737a]">{task.id}</span>
                          <span className="text-sm font-medium text-[#163247]">{task.title}</span>
                          {task.mandatory ? <Badge className="rounded-md bg-[#e8f2f4] text-[#075f69]">Mandatory</Badge> : null}
                        </span>
                        <span className="mt-1 block text-xs text-[#637483]">{task.department} · {task.worksite} · P90 {task.p90Minutes} min</span>
                      </button>
                      <Button variant="ghost" size="sm" className="justify-self-start text-[#0b6871] sm:justify-self-end" onClick={() => setTaskDetail(task)}>Details</Button>
                    </div>
                  );
                })}
              </CardContent>
              <div className="flex flex-col gap-3 border-t border-[#e4e9eb] bg-[#f8fafb] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#637483]">Mandatory E-17 cannot be removed. Quarantined tasks are excluded.</p>
                {state.draftDirty ? <Button variant="outline" onClick={handleRevalidate} disabled={validating}>{validating ? <RefreshCw className="animate-spin" /> : <ShieldCheck />}{validating ? 'Validating…' : 'Revalidate draft'}</Button> : null}
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
                <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
                  <CardTitle className="text-[15px] font-semibold text-[#163247]">Illustrative outcome</CardTitle>
                  <CardDescription className="mt-1 text-xs">Before vs recommended fixture</CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-[#e4e9eb] px-5 py-1">
                  <KpiRow label="Possession minutes" before="225" after={`${plan.protectedMinutes}`} />
                  <KpiRow label="Separate blocks" before="3" after="1" />
                  <KpiRow label="Train impact minutes" before="24" after={`${plan.impactMinutes}`} />
                  <KpiRow label="Union utilization" before="66.7%" after={`${plan.utilization}%`} />
                </CardContent>
              </Card>

              <Card className="gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-5 text-[#0b737a]" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-[#163247]">Planner handoff</p>
                      <p className="mt-1 text-xs leading-5 text-[#637483]">Send the validated draft to the simulated Control Officer queue. This does not issue a block.</p>
                    </div>
                  </div>
                  {currentApproval ? (
                    <div className="rounded-md bg-[#f6f8f9] p-3">
                      <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs">{currentApproval.id}</span><StatusBadge status={currentApproval.status} /></div>
                      <Link href="/approvals" className="mt-2 inline-flex text-xs font-medium text-[#0b6871] hover:underline">Open approval record <ChevronRight className="size-3.5" /></Link>
                    </div>
                  ) : (
                    <Button className="w-full bg-[#0b6871] text-white hover:bg-[#075860]" disabled={state.draftDirty} onClick={() => setReviewOpen(true)}><Send />Review & send</Button>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => { simulateReplan(); setNotice('Freight materialisation simulated. A new draft version was created; approved records stayed frozen.'); }}><RefreshCw />Simulate freight replan</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={whyOpen} onOpenChange={setWhyOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Why Plan {plan.id}?</DialogTitle>
            <DialogDescription>Deterministic fixture explanation; no trained ML or live optimizer is used.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md bg-[#f5f8f8] p-3 text-sm leading-6 text-[#344b5d]">{plan.rationale} {plan.tradeoff}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {plan.objective.map((item) => <Metric key={item.label} label={item.label} value={`${item.value} pts`} />)}
            </div>
            <div className="rounded-md border border-[#cfe1e2] p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#163247]"><ShieldCheck className="size-4 text-[#0b737a]" />Non-relaxable checks</p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-[#526675]">
                <li>• Mandatory task P90 duration fits inside protected time.</li>
                <li>• Train-path, worksite, isolation and resource constraints passed.</li>
                <li>• Grouping is conditional, never assumed by department alone.</li>
              </ul>
            </div>
            <p className="text-xs text-[#637483]">Versions: rules v3.2 · source schema v1.4 · deterministic solver fixture v0.3.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Send Plan {plan.id} for officer review</DialogTitle>
            <DialogDescription>Confirm the exact task set and preserve a planner note in the simulated audit trail.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md bg-[#f5f7f8] p-3">
              <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-[#163247]">{plan.window} · {state.section}</span><Badge variant="outline">v{state.recommendationVersion}</Badge></div>
              <ul className="mt-2 space-y-1 text-xs text-[#526675]">
                {selectedTasks.map((task) => <li key={task.id}>• {task.id} · {task.title}</li>)}
              </ul>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="planner-note">Planner note</Label>
              <Textarea id="planner-note" value={plannerNote} onChange={(event) => setPlannerNote(event.target.value)} placeholder="Optional note for the simulated Control Officer" />
            </div>
            <div className="flex items-start gap-2 rounded-md border border-[#e6d5bd] bg-[#fff9f1] p-3 text-xs leading-5 text-[#75431d]">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Submission records a prototype approval request only. It does not request or issue a live block.
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleSubmit}><Send />Send to queue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TaskDetailDialog task={taskDetail} open={Boolean(taskDetail)} onOpenChange={(open) => { if (!open) setTaskDetail(null); }} />
    </RailShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-[#f5f7f8] p-3"><p className="text-[11px] uppercase tracking-[0.07em] text-[#637483]">{label}</p><p className="mt-1 text-sm font-semibold text-[#163247]">{value}</p></div>;
}

function SequenceRow({ label, width, offset, tone, detail }: { label: string; width: string; offset: string; tone: string; detail: string }) {
  return (
    <div className="grid grid-cols-[150px_1fr] items-center gap-3">
      <span className="text-xs font-medium text-[#344b5d]">{label}</span>
      <div className="relative h-8 rounded bg-[#f1f4f5]">
        <span className={cn('absolute inset-y-1 rounded px-2 py-1 text-[10px] font-medium text-white', tone)} style={{ left: offset, width }}>{detail}</span>
      </div>
    </div>
  );
}

function KpiRow({ label, before, after }: { label: string; before: string; after: string }) {
  return <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-3 text-xs"><span className="text-[#526675]">{label}</span><span className="tabular-nums text-[#8a4b1c] line-through">{before}</span><span className="min-w-14 text-right font-semibold tabular-nums text-[#246c50]">{after}</span></div>;
}

function LoadingState() {
  return <Card className="rounded-lg py-12 text-center shadow-none ring-[#d8e0e4]"><CardContent><RefreshCw className="mx-auto size-6 animate-spin text-[#0b737a]" /><p className="mt-3 text-sm font-medium text-[#163247]">Checking task, window, train-path and resource fixtures…</p><p className="mt-1 text-xs text-[#637483]">Hard safety constraints cannot be relaxed.</p></CardContent></Card>;
}

function EmptyRun({ onGenerate }: { onGenerate: () => void }) {
  return <Card className="rounded-lg py-12 text-center shadow-none ring-[#d8e0e4]"><CardContent><Clock3 className="mx-auto size-6 text-[#0b737a]" /><h2 className="mt-3 text-base font-semibold text-[#163247]">Inputs changed</h2><p className="mx-auto mt-1 max-w-lg text-sm text-[#637483]">Generate a new fixture recommendation before reviewing or submitting this context.</p><Button className="mt-4" onClick={onGenerate}>Generate plans</Button></CardContent></Card>;
}

function BlockedRun() {
  return <Card className="rounded-lg border-l-4 border-l-[#b4443f] py-0 shadow-none ring-[#e1c1bf]"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><AlertTriangle className="size-6 shrink-0 text-[#b4443f]" /><div className="flex-1"><h2 className="font-semibold text-[#7f3431]">Fail-closed: COA snapshot is stale</h2><p className="mt-1 text-sm leading-6 text-[#704e4c]">No new recommendation or manual approval shortcut is available. Refresh the synthetic source snapshot first.</p></div><Link href="/audit-data-health" className={buttonVariants({ variant: 'outline' })}>Open data health</Link></CardContent></Card>;
}

function InfeasibleRun() {
  return <Card className="rounded-lg border-l-4 border-l-[#b4443f] py-0 shadow-none ring-[#e1c1bf]"><CardContent className="p-5"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#b4443f]" /><div><h2 className="font-semibold text-[#7f3431]">No hard-feasible plan</h2><p className="mt-1 text-sm leading-6 text-[#704e4c]">Conflict set: mandatory E-17 needs 100 protected minutes including setup/handback; retained windows are 60 and 75 minutes, while the longer band is occupied by a protected train path.</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><div className="rounded-md bg-[#fff7f5] p-3 text-xs text-[#704e4c]"><strong>Closest safe alternative:</strong> move planning date or release a verified 02:20–04:00 corridor window.</div><div className="rounded-md bg-[#fff7f5] p-3 text-xs text-[#704e4c]"><strong>Never suggested:</strong> shortening E-17 below prescribed P90 or relaxing train protection.</div></div></CardContent></Card>;
}
