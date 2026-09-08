'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Info,
  ListChecks,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';

import { PageHeading } from '@/components/page-heading';
import { RailShell } from '@/components/rail-shell';
import { StatusBadge } from '@/components/status-badge';
import { TaskDetailDialog } from '@/components/task-detail-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  evaluateDraft,
  plans,
  scenarioLabels,
  type PlanId,
  type PlanningScenario,
  type Task,
} from '@/lib/rail-data';
import { cn } from '@/lib/utils';

function taskSignature(taskIds: string[]) {
  return [...taskIds].sort().join('|');
}

export function WeeklyPlanPage() {
  const {
    state,
    setPlanningField,
    generatePlans,
    selectPlan,
    toggleTask,
    revalidateDraft,
    submitForReview,
  } = usePrototype();
  const [taskDetail, setTaskDetail] = useState<Task | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [plannerNote, setPlannerNote] = useState('');
  const [notice, setNotice] = useState('');
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);

  const plan = plans[state.selectedPlanId];
  const draftEvaluation = evaluateDraft(
    state.selectedPlanId,
    state.selectedTaskIds,
    state.tasks,
    state.scenario,
  );
  const selectedTasks = state.tasks.filter((task) =>
    state.selectedTaskIds.includes(task.id),
  );
  const eligibleTasks = useMemo(
    () =>
      state.tasks
        .filter((task) => !task.quarantined)
        .sort((left, right) => {
          const leftSelected = state.selectedTaskIds.includes(left.id) ? 1 : 0;
          const rightSelected = state.selectedTaskIds.includes(right.id) ? 1 : 0;
          return rightSelected - leftSelected || right.priority - left.priority;
        }),
    [state.selectedTaskIds, state.tasks],
  );
  const signature = taskSignature(state.selectedTaskIds);
  const currentApproval = state.approvals.find(
    (approval) =>
      approval.version === state.recommendationVersion &&
      approval.section === state.section &&
      approval.planningDate === state.planningDate &&
      approval.planId === state.selectedPlanId &&
      taskSignature(approval.selectedTaskIds) === signature,
  );
  const canGenerate =
    state.runStatus !== 'running' &&
    state.dataGate === 'ready' &&
    Boolean(state.planningDate);

  async function handleGenerate() {
    if (!canGenerate) return;
    setNotice('');
    const result = await generatePlans();
    setNotice(
      result === 'feasible'
        ? 'Recommendation ready. Review the plan, selected work and safety details below.'
        : result === 'infeasible'
          ? 'No safe recommendation exists for this test condition. The blocking conflicts are shown below.'
          : 'Generation stopped because the planning data gate is blocked.',
    );
  }

  async function handleRevalidate() {
    setValidating(true);
    const valid = await revalidateDraft();
    setValidating(false);
    setNotice(
      valid
        ? 'The edited task set passed the demo hard-constraint check.'
        : draftEvaluation.issues[0] ?? 'The edited task set does not fit this plan.',
    );
  }

  function handleSubmit() {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    const approvalId = submitForReview(plannerNote);
    if (!approvalId) {
      setNotice('Submission blocked. Generate and validate a safe draft first.');
    } else {
      setReviewOpen(false);
      setPlannerNote('');
      setNotice(`${approvalId} is now in the simulated Control Officer queue.`);
    }
    window.setTimeout(() => {
      submitLock.current = false;
      setSubmitting(false);
    }, 250);
  }

  return (
    <RailShell>
      <PageHeading
        eyebrow={`Weekly planning · ${formatPlanningDate(state.planningDate)}`}
        title="Weekly Block Plan"
        description="Turn cross-department maintenance demand into one clear, reviewable railway block recommendation."
        action={
          state.lastRunAt ? (
            <div className="flex items-center gap-2 text-xs text-[#526675]">
              <Clock3 className="size-4" aria-hidden="true" />
              Last checked {formatTimestamp(state.lastRunAt)} IST
            </div>
          ) : null
        }
      />

      <Card className="mb-5 gap-0 rounded-xl py-0 shadow-none ring-[#d8e0e4]">
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(260px,1fr)_200px_240px_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#657682]">Planning corridor</p>
            <p className="mt-1 text-sm font-semibold text-[#163247]">{state.division}</p>
            <p className="mt-0.5 text-sm text-[#526675]">{state.section}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="planning-date">Planning date</Label>
            <Input
              id="planning-date"
              className="h-11"
              type="date"
              required
              value={state.planningDate}
              disabled={state.runStatus === 'running'}
              aria-invalid={!state.planningDate}
              onChange={(event) => setPlanningField('planningDate', event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scenario">Test condition</Label>
            <NativeSelect
              id="scenario"
              className="w-full [&_select]:h-11"
              value={state.scenario}
              disabled={state.runStatus === 'running'}
              onChange={(event) =>
                setPlanningField('scenario', event.target.value as PlanningScenario)
              }
            >
              {(Object.entries(scenarioLabels) as Array<[PlanningScenario, string]>).map(
                ([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ),
              )}
            </NativeSelect>
          </div>
          <Button
            className={cn(
              'h-11 px-4',
              state.runStatus === 'feasible'
                ? 'border-[#b9c8ce] bg-white text-[#163247] hover:bg-[#f1f4f5]'
                : 'bg-[#0b6871] text-white hover:bg-[#075860]',
            )}
            variant={state.runStatus === 'feasible' ? 'outline' : 'default'}
            disabled={!canGenerate}
            aria-busy={state.runStatus === 'running'}
            onClick={handleGenerate}
          >
            {state.runStatus === 'running' ? (
              <RefreshCw className="size-4 motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="size-4" aria-hidden="true" />
            )}
            {state.runStatus === 'running'
              ? 'Checking…'
              : state.runStatus === 'feasible'
                ? 'Regenerate'
                : 'Generate recommendation'}
          </Button>
        </CardContent>

        {state.dataGate !== 'ready' ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#efc8c5] bg-[#fff6f5] px-4 py-3 text-sm text-[#7c3d39]">
            <span className="flex items-center gap-2">
              <AlertTriangle className="size-4" aria-hidden="true" />
              Control Office data is stale, so new planning is blocked.
            </span>
            <Link href="/audit-data-health" className="font-semibold text-[#8f3834] underline underline-offset-4">
              Refresh data
            </Link>
          </div>
        ) : !state.planningDate ? (
          <p role="alert" className="border-t border-[#efc8c5] bg-[#fff6f5] px-4 py-3 text-sm text-[#7c3d39]">
            Choose a planning date to continue.
          </p>
        ) : null}

        {notice ? (
          <output aria-live="polite" className="block border-t border-[#cfe1e2] bg-[#f0f8f8] px-4 py-3 text-sm text-[#075f69]">
            {notice}
          </output>
        ) : null}
      </Card>

      {state.runStatus === 'running' ? <LoadingState /> : null}
      {state.runStatus === 'idle' ? <EmptyState /> : null}
      {state.runStatus === 'blocked' ? <BlockedState /> : null}
      {state.runStatus === 'infeasible' ? <InfeasibleState /> : null}

      {state.runStatus === 'feasible' ? (
        <div className="space-y-5">
          <Card className="gap-0 rounded-xl border-t-4 border-t-[#0b737a] py-0 shadow-[0_12px_34px_rgba(16,42,64,0.07)] ring-[#cddbdd]">
            <CardHeader className="border-b border-[#e4e9eb] px-5 py-5 sm:px-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-md bg-[#e8f2f4] text-[#075f69]">{plan.label}</Badge>
                    <StatusBadge status={state.draftDirty ? 'Revalidation required' : 'Ready'} />
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[#102a40]">
                    Plan {plan.id} · {plan.window}
                  </h2>
                  <p className="mt-1 text-sm text-[#526675]">
                    {selectedTasks.length} work items across {new Set(selectedTasks.map((task) => task.department)).size} departments
                  </p>
                </div>
                <p className="max-w-xl text-sm leading-6 text-[#526675]">{plan.rationale}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric label="Protected time" value={`${plan.protectedMinutes} min`} />
                <Metric label="Expected delay" value={`${draftEvaluation.impactMinutes} min`} />
                <Metric label="Safety duration" value={`${draftEvaluation.safetyMinutes} min`} />
                <Metric label="Capacity used" value={`${draftEvaluation.utilization}%`} />
              </div>

              <fieldset>
                <legend className="text-sm font-semibold text-[#163247]">Compare safe alternatives</legend>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {(Object.values(plans) as Array<(typeof plans)[PlanId]>).map((alternative) => {
                    const active = alternative.id === state.selectedPlanId;
                    const alternativeEvaluation = evaluateDraft(
                      alternative.id,
                      alternative.taskIds,
                      state.tasks,
                      state.scenario,
                    );
                    const shownEvaluation = active
                      ? draftEvaluation
                      : alternativeEvaluation;
                    const shownTaskCount = active
                      ? state.selectedTaskIds.length
                      : alternative.taskIds.length;
                    return (
                      <button
                        key={alternative.id}
                        type="button"
                        aria-pressed={active}
                        disabled={!active && !alternativeEvaluation.valid}
                        onClick={() => {
                          selectPlan(alternative.id);
                          setNotice('');
                        }}
                        className={cn(
                          'min-h-28 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0b737a]/25',
                          active
                            ? 'border-[#0b737a] bg-[#eef7f7]'
                            : alternativeEvaluation.valid
                              ? 'border-[#d8e0e4] bg-white hover:border-[#afc2c9] hover:bg-[#f7f9fa]'
                              : 'border-[#e1e5e7] bg-[#f5f6f7] opacity-65',
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#163247]">Plan {alternative.id}</span>
                          {active ? <CheckCircle2 className="size-4 text-[#0b737a]" aria-hidden="true" /> : null}
                        </span>
                        <span className="mt-2 block text-base font-semibold text-[#102a40]">{alternative.window}</span>
                        <span className="mt-1 block text-xs leading-5 text-[#526675]">
                          {shownEvaluation.valid
                            ? `${shownEvaluation.impactMinutes} min expected delay · ${shownTaskCount} tasks`
                            : shownEvaluation.issues[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-[#657682]">Selecting another plan restores its fixture-supported work set.</p>
              </fieldset>

              <section aria-labelledby="selected-work-heading">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h3 id="selected-work-heading" className="text-base font-semibold text-[#163247]">Selected maintenance work</h3>
                    <p className="mt-1 text-sm text-[#526675]">Mandatory work stays locked. Optional edits must be revalidated.</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-[#075f69]">{selectedTasks.length} selected</span>
                </div>
                <div className="mt-3 divide-y divide-[#e4e9eb] overflow-hidden rounded-xl border border-[#d8e0e4] bg-white">
                  {eligibleTasks.map((task) => {
                    const checked = state.selectedTaskIds.includes(task.id);
                    const unavailableForScenario =
                      state.scenario === 'team-unavailable' &&
                      task.department === 'Electrical — TRD';
                    return (
                      <div key={task.id} className="flex min-h-16 items-center gap-3 px-4 py-3">
                        <Checkbox
                          id={`plan-task-${task.id}`}
                          checked={checked}
                          disabled={task.mandatory || validating || unavailableForScenario}
                          aria-label={`${checked ? 'Remove' : 'Add'} ${task.id} ${task.title}`}
                          onCheckedChange={() => toggleTask(task.id)}
                        />
                        <label htmlFor={`plan-task-${task.id}`} className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#0b737a]">{task.id}</span>
                            <span className="text-sm font-medium text-[#163247]">{task.title}</span>
                            {task.mandatory ? <Badge className="rounded-md bg-[#fff0e2] text-[#91450f]">Mandatory</Badge> : null}
                            {unavailableForScenario ? <Badge className="rounded-md bg-[#fff0ef] text-[#9d403d]">Team unavailable</Badge> : null}
                          </span>
                          <span className="mt-1 block text-xs text-[#657682]">{task.department} · safety duration {task.p90Minutes} min</span>
                        </label>
                        <Button variant="ghost" className="h-10 px-2 text-[#075f69]" onClick={() => setTaskDetail(task)}>
                          View <ChevronRight className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </section>

              {state.draftDirty ? (
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#e6d5bd] bg-[#fff9f1] p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm font-semibold text-[#75431d]">Revalidation required</p>
                    <p className="mt-1 text-sm text-[#7b5a3c]">
                      {draftEvaluation.valid
                        ? 'The selected work changed after the recommendation was generated.'
                        : draftEvaluation.issues[0]}
                    </p>
                  </div>
                  <Button variant="outline" className="h-11 bg-white" disabled={validating} onClick={handleRevalidate}>
                    {validating ? <RefreshCw className="motion-safe:animate-spin" /> : <ShieldCheck />}
                    {validating ? 'Checking…' : 'Revalidate work'}
                  </Button>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-[#e4e9eb] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#163247]">
                    {currentApproval
                      ? 'This exact draft already has an approval record.'
                      : !draftEvaluation.valid
                        ? 'Resolve the constraint conflict before review'
                        : state.draftDirty
                          ? 'Revalidate the edited work before review'
                          : 'Ready for Control Officer review'}
                  </p>
                  <p className="mt-1 text-xs text-[#657682]">Prototype only · no traffic or power block is issued</p>
                </div>
                {currentApproval ? (
                  <Link
                    href={`/approvals?approval=${encodeURIComponent(currentApproval.id)}`}
                    className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-4')}
                  >
                    Open {currentApproval.id} <ArrowRight />
                  </Link>
                ) : (
                  <Button
                    className="h-11 bg-[#0b6871] px-4 text-white hover:bg-[#075860]"
                    disabled={state.draftDirty || state.dataGate !== 'ready' || !draftEvaluation.valid}
                    onClick={() => setReviewOpen(true)}
                  >
                    <Send /> Review and send
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-xl py-0 shadow-none ring-[#d8e0e4]">
            <CardContent className="px-5 py-1 sm:px-6">
              <Accordion>
                <AccordionItem value="windows">
                  <AccordionTrigger className="min-h-12 no-underline hover:no-underline">
                    <span><strong className="text-[#163247]">Window screening</strong><span className="ml-2 text-[#657682]">Why this time was retained</span></span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="grid gap-3 md:grid-cols-3">
                      {candidateWindows.map((window) => {
                        const shownTime = window.id === 'selected' ? plan.window : window.time;
                        const selected = window.id === 'selected';
                        return (
                          <div key={window.id} className={cn('rounded-lg border p-4', selected ? 'border-[#b9d3d6] bg-[#f1f8f8]' : 'border-[#d8e0e4] bg-[#f8f9fa]')}>
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-[#163247]">{shownTime}</p>
                              <StatusBadge status={selected ? 'Eligible' : 'Rejected'} />
                            </div>
                            <p className="mt-2 text-sm leading-6 text-[#526675]">{selected ? plan.rationale : window.reason}</p>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="sequence">
                  <AccordionTrigger className="min-h-12 no-underline hover:no-underline">
                    <span><strong className="text-[#163247]">Work sequence and impact</strong><span className="ml-2 text-[#657682]">A simple handback order</span></span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <ol className="grid gap-3 md:grid-cols-2">
                      {selectedTasks.map((task, index) => (
                        <li key={task.id} className="flex gap-3 rounded-lg border border-[#d8e0e4] p-4">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e8f2f4] text-xs font-semibold text-[#075f69]">{index + 1}</span>
                          <div><p className="text-sm font-semibold text-[#163247]">{task.title}</p><p className="mt-1 text-xs leading-5 text-[#657682]">{task.department} · {task.p90Minutes} min safety duration · {task.dependency}</p></div>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-3 text-sm text-[#526675]">Expected train delay is {draftEvaluation.impactMinutes} minutes. Actual execution remains subject to Railway operating authority and field confirmation.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="safety">
                  <AccordionTrigger className="min-h-12 no-underline hover:no-underline">
                    <span><strong className="text-[#163247]">Safety and source details</strong><span className="ml-2 text-[#657682]">Definitions and guardrails</span></span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="grid gap-3 text-sm leading-6 text-[#526675] md:grid-cols-3">
                      <Detail label="Safety duration (P90)" text="A conservative demo duration that 90% of comparable work is expected to finish within." />
                      <Detail label="Control Office snapshot" text="Synthetic train-path data used to screen candidate windows. Stale data blocks new planning." />
                      <Detail label="Block suitability" text="A transparent comparison of task priority, usable capacity, train impact and plan stability." />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Send Plan {plan.id} for simulated review?</DialogTitle>
            <DialogDescription>
              This creates an auditable, device-local request. It does not sanction a railway block or write to any live system.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-[#d8e0e4] bg-[#f7f9fa] p-4">
            <p className="text-sm font-semibold text-[#163247]">{state.section} · {plan.window}</p>
            <p className="mt-1 text-sm text-[#526675]">{selectedTasks.length} tasks · {draftEvaluation.impactMinutes} min expected delay · version {state.recommendationVersion}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="planner-note">Planner note (optional)</Label>
            <Textarea id="planner-note" value={plannerNote} onChange={(event) => setPlannerNote(event.target.value)} placeholder="Add a coordination note for the simulated Control Officer" />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="h-11" />}>Cancel</DialogClose>
            <Button className="h-11 bg-[#0b6871] text-white hover:bg-[#075860]" disabled={submitting} aria-busy={submitting} onClick={handleSubmit}>
              {submitting ? <RefreshCw className="motion-safe:animate-spin" /> : <Send />}
              {submitting ? 'Sending…' : 'Send for review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TaskDetailDialog task={taskDetail} open={Boolean(taskDetail)} onOpenChange={(open) => { if (!open) setTaskDetail(null); }} />
    </RailShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f2f5f6] p-4">
      <p className="text-xs font-medium text-[#657682]">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-[#163247]">{value}</p>
    </div>
  );
}

function Detail({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg bg-[#f5f7f8] p-4">
      <p className="font-semibold text-[#163247]">{label}</p>
      <p className="mt-1">{text}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <Card className="rounded-xl py-14 text-center shadow-none ring-[#d8e0e4]" aria-busy="true">
      <CardContent>
        <RefreshCw className="mx-auto size-7 text-[#0b737a] motion-safe:animate-spin" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold text-[#163247]">Checking safe planning options</h2>
        <p className="mt-1 text-sm text-[#526675]">Screening protected time, mandatory work and train paths.</p>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="rounded-xl py-14 text-center shadow-none ring-[#d8e0e4]">
      <CardContent>
        <ListChecks className="mx-auto size-8 text-[#0b737a]" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold text-[#163247]">Choose a date and test condition</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#526675]">Generate one recommendation, then compare alternatives and adjust optional maintenance work.</p>
      </CardContent>
    </Card>
  );
}

function BlockedState() {
  return (
    <Card className="rounded-xl border border-[#efc8c5] bg-[#fff8f7] py-0 shadow-none ring-0">
      <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <AlertTriangle className="size-7 shrink-0 text-[#a33f3a]" aria-hidden="true" />
        <div className="flex-1"><h2 className="text-lg font-semibold text-[#6f302d]">Planning is safely blocked</h2><p className="mt-1 text-sm leading-6 text-[#7c4b48]">Refresh the synthetic Control Office snapshot before generating another recommendation.</p></div>
        <Link href="/audit-data-health" className={cn(buttonVariants({ variant: 'outline' }), 'h-11 bg-white px-4')}>Open data health <ArrowRight /></Link>
      </CardContent>
    </Card>
  );
}

function InfeasibleState() {
  return (
    <Card className="rounded-xl border border-[#e9c5c2] bg-white py-0 shadow-none ring-0">
      <CardContent className="p-6">
        <div className="flex items-start gap-3"><Info className="mt-0.5 size-6 shrink-0 text-[#a33f3a]" aria-hidden="true" /><div><h2 className="text-lg font-semibold text-[#163247]">No safe window in this test condition</h2><p className="mt-1 text-sm leading-6 text-[#526675]">The demo engine did not relax a hard railway constraint to force a result.</p></div></div>
        <ul className="mt-5 grid gap-3 text-sm text-[#526675] md:grid-cols-3">
          <li className="rounded-lg bg-[#f7f9fa] p-4"><strong className="block text-[#163247]">Mandatory work</strong><span className="mt-1 block">E-17 needs its full safety duration.</span></li>
          <li className="rounded-lg bg-[#f7f9fa] p-4"><strong className="block text-[#163247]">Train paths</strong><span className="mt-1 block">Protected passenger paths cannot be displaced.</span></li>
          <li className="rounded-lg bg-[#f7f9fa] p-4"><strong className="block text-[#163247]">Operating authority</strong><span className="mt-1 block">No manual override is available in this prototype.</span></li>
        </ul>
      </CardContent>
    </Card>
  );
}
