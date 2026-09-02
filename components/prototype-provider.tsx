'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  initialApprovals,
  initialAuditEvents,
  initialSources,
  initialTasks,
  plans,
  sectionsByDivision,
  type Approval,
  type AuditEvent,
  type DataGate,
  type Department,
  type PlanId,
  type PlanningScenario,
  type RunStatus,
  type SourceHealth,
  type Task,
} from '@/lib/rail-data';

const STORAGE_KEY = 'railsamanvay-prototype-v4';

type PrototypeState = {
  division: string;
  section: string;
  planningDate: string;
  scenario: PlanningScenario;
  dataGate: DataGate;
  runStatus: RunStatus;
  recommendationVersion: number;
  selectedPlanId: PlanId;
  selectedTaskIds: string[];
  draftDirty: boolean;
  lastRunAt: string;
  tasks: Task[];
  approvals: Approval[];
  auditEvents: AuditEvent[];
  sources: SourceHealth[];
};

type NewTaskInput = {
  department: Department;
  title: string;
  priority: number;
  mandatory: boolean;
};

type DecisionAction = 'approve' | 'changes' | 'reject';

type PrototypeContextValue = {
  state: PrototypeState;
  hydrated: boolean;
  pendingCount: number;
  setPlanningField: (
    field: 'division' | 'section' | 'planningDate' | 'scenario',
    value: string,
  ) => void;
  generatePlans: () => Promise<'feasible' | 'infeasible' | 'blocked'>;
  selectPlan: (planId: PlanId) => void;
  toggleTask: (taskId: string) => void;
  revalidateDraft: () => Promise<boolean>;
  submitForReview: (note: string) => string | null;
  decideApproval: (
    approvalId: string,
    action: DecisionAction,
    reason: string,
    alternatePlanId?: PlanId,
  ) => boolean;
  addTask: (input: NewTaskInput) => string;
  setDataGate: (gate: DataGate) => void;
  refreshSources: () => void;
  simulateReplan: () => void;
  resetPrototype: () => void;
};

function cloneInitialState(): PrototypeState {
  return {
    division: 'Secunderabad Division',
    section: 'Section A–B · Up line',
    planningDate: '2026-09-02',
    scenario: 'base',
    dataGate: 'ready',
    runStatus: 'feasible',
    recommendationVersion: 1,
    selectedPlanId: 'A',
    selectedTaskIds: [...plans.A.taskIds],
    draftDirty: false,
    lastRunAt: '2026-09-01T14:22:00+05:30',
    tasks: initialTasks.map((task) => ({ ...task, factors: [...task.factors] })),
    approvals: initialApprovals.map((approval) => ({
      ...approval,
      selectedTaskIds: [...approval.selectedTaskIds],
    })),
    auditEvents: initialAuditEvents.map((event) => ({ ...event })),
    sources: initialSources.map((source) => ({ ...source })),
  };
}

function auditEvent(
  actor: string,
  action: string,
  detail: string,
  version?: number,
): AuditEvent {
  return {
    id: `AUD-${Date.now()}-${Math.round(Math.random() * 999)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    detail,
    version,
  };
}

function sectionCode(section: string) {
  const match = section.match(/Section ([A-Z])–([A-Z])/);
  return match ? `${match[1]}${match[2]}` : 'SEC';
}

function includeMandatory(taskIds: string[], tasks: Task[]) {
  const mandatoryIds = tasks
    .filter((task) => task.mandatory && !task.quarantined)
    .map((task) => task.id);
  return Array.from(new Set([...taskIds, ...mandatoryIds]));
}

const PrototypeContext = createContext<PrototypeContextValue | null>(null);

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PrototypeState>(cloneInitialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as PrototypeState;
          if (
            Array.isArray(parsed.tasks) &&
            Array.isArray(parsed.approvals) &&
            Array.isArray(parsed.auditEvents) &&
            Array.isArray(parsed.sources)
          ) {
            setState(parsed);
          }
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [hydrated, state]);

  const pendingCount = state.approvals.filter(
    (approval) => approval.status === 'Submitted',
  ).length;

  function setPlanningField(
    field: 'division' | 'section' | 'planningDate' | 'scenario',
    value: string,
  ) {
    setState((previous) => {
      const next = { ...previous, [field]: value } as PrototypeState;
      if (field === 'division') {
        next.section = sectionsByDivision[value]?.[0] ?? previous.section;
      }
      return {
        ...next,
        runStatus: 'idle',
      };
    });
  }

  async function generatePlans(): Promise<'feasible' | 'infeasible' | 'blocked'> {
    if (state.dataGate !== 'ready' || !state.planningDate) {
      setState((previous) => ({
        ...previous,
        runStatus: 'blocked',
        auditEvents: [
          auditEvent(
            'Data quality gate',
            'Generation blocked',
            previous.dataGate !== 'ready'
              ? 'COA snapshot is stale. No recommendation was produced.'
              : 'A planning date is required. No recommendation was produced.',
            previous.recommendationVersion,
          ),
          ...previous.auditEvents,
        ],
      }));
      return 'blocked';
    }

    setState((previous) => ({ ...previous, runStatus: 'running' }));
    await new Promise((resolve) => window.setTimeout(resolve, 650));

    if (state.scenario === 'no-safe-window') {
      setState((previous) => {
        const version = previous.recommendationVersion + 1;
        return {
          ...previous,
          runStatus: 'infeasible',
          recommendationVersion: version,
          lastRunAt: new Date().toISOString(),
          auditEvents: [
            auditEvent(
              'RailSamanvay demo engine',
              'No feasible recommendation',
              'All retained windows conflict with the mandatory task P90 duration or protected train paths.',
              version,
            ),
            ...previous.auditEvents,
          ],
        };
      });
      return 'infeasible';
    }

    const selectedPlanId: PlanId =
      state.scenario === 'freight'
        ? 'B'
        : state.scenario === 'team-unavailable'
          ? 'C'
          : 'A';

    setState((previous) => {
      const version = previous.recommendationVersion + 1;
      return {
        ...previous,
        runStatus: 'feasible',
        recommendationVersion: version,
        selectedPlanId,
        selectedTaskIds: includeMandatory(plans[selectedPlanId].taskIds, previous.tasks),
        draftDirty: false,
        lastRunAt: new Date().toISOString(),
        auditEvents: [
          auditEvent(
            'RailSamanvay demo engine',
            'Recommendation generated',
            `Plan ${selectedPlanId} generated for ${previous.section} using the ${previous.scenario} fixture.`,
            version,
          ),
          ...previous.auditEvents,
        ],
      };
    });
    return 'feasible';
  }

  function selectPlan(planId: PlanId) {
    setState((previous) => {
      if (previous.selectedPlanId === planId) return previous;
      return {
        ...previous,
        selectedPlanId: planId,
        selectedTaskIds: includeMandatory(plans[planId].taskIds, previous.tasks),
        draftDirty: false,
        auditEvents: [
          auditEvent(
            'Demo Planner',
            'Alternative selected',
            `Plan ${planId} selected; its fixture-supported task set replaced manual draft edits.`,
            previous.recommendationVersion,
          ),
          ...previous.auditEvents,
        ],
      };
    });
  }

  function toggleTask(taskId: string) {
    setState((previous) => {
      const task = previous.tasks.find((item) => item.id === taskId);
      if (!task || task.mandatory || task.quarantined) return previous;
      const included = previous.selectedTaskIds.includes(taskId);
      return {
        ...previous,
        selectedTaskIds: included
          ? previous.selectedTaskIds.filter((id) => id !== taskId)
          : [...previous.selectedTaskIds, taskId],
        draftDirty: true,
        auditEvents: [
          auditEvent(
            'Demo Planner',
            included ? 'Task removed from draft' : 'Task added to draft',
            `${taskId} changed; hard constraints require revalidation before submission.`,
            previous.recommendationVersion,
          ),
          ...previous.auditEvents,
        ],
      };
    });
  }

  async function revalidateDraft() {
    if (state.dataGate !== 'ready' || state.runStatus !== 'feasible') return false;
    const selectedTasks = state.tasks.filter((task) =>
      state.selectedTaskIds.includes(task.id),
    );
    const mandatoryMissing = state.tasks.some(
      (task) => task.mandatory && !task.quarantined && !state.selectedTaskIds.includes(task.id),
    );
    const hasQuarantined = selectedTasks.some((task) => task.quarantined);
    const exceedsFixtureCapacity = selectedTasks.length > 4;
    const valid =
      Boolean(selectedTasks.length) &&
      !mandatoryMissing &&
      !hasQuarantined &&
      !exceedsFixtureCapacity;
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    setState((previous) => {
      const detail = valid
        ? `${selectedTasks.length} selected tasks passed the deterministic fixture constraint check.`
        : exceedsFixtureCapacity
          ? `${selectedTasks.length} tasks exceed this fixture's four-work-item coordination limit.`
          : 'The draft is missing mandatory work or contains an ineligible source record.';
      return {
        ...previous,
        draftDirty: !valid,
        auditEvents: [
          auditEvent(
            'RailSamanvay demo engine',
            valid ? 'Draft revalidated' : 'Draft validation failed',
            detail,
            previous.recommendationVersion,
          ),
          ...previous.auditEvents,
        ],
      };
    });
    return valid;
  }

  function submitForReview(note: string) {
    if (
      state.runStatus !== 'feasible' ||
      state.draftDirty ||
      !state.planningDate ||
      state.selectedTaskIds.length === 0 ||
      state.selectedTaskIds.length > 4
    ) return null;
    const mandatoryTasks = state.tasks.filter(
      (task) => task.mandatory && !task.quarantined,
    );
    if (
      mandatoryTasks.some((task) => !state.selectedTaskIds.includes(task.id))
    ) {
      return null;
    }

    const version = state.recommendationVersion;
    const recommendationId = `RS-${sectionCode(state.section)}-${state.planningDate.replaceAll('-', '')}-V${version}`;
    const signature = [...state.selectedTaskIds].sort().join('|');
    const existing = state.approvals.find(
      (approval) =>
        approval.recommendationId === recommendationId &&
        approval.planId === state.selectedPlanId &&
        [...approval.selectedTaskIds].sort().join('|') === signature,
    );
    const approvalId = existing?.id ?? `APR-${String(state.approvals.length + 41).padStart(3, '0')}`;
    const submittedAt = new Date().toISOString();
    const record: Approval = {
      id: approvalId,
      recommendationId,
      version,
      planId: state.selectedPlanId,
      selectedTaskIds: [...state.selectedTaskIds],
      section: state.section,
      planningDate: state.planningDate,
      submittedBy: 'Demo Planner',
      submittedAt,
      note: note.trim(),
      status: 'Submitted',
    };

    setState((previous) => ({
      ...previous,
      approvals: existing
        ? previous.approvals.map((approval) =>
            approval.id === approvalId ? record : approval,
          )
        : [record, ...previous.approvals],
      auditEvents: [
        auditEvent(
          'Demo Planner',
          'Recommendation submitted',
          `${recommendationId} sent to the simulated Control Officer queue with ${record.selectedTaskIds.length} tasks.`,
          version,
        ),
        ...previous.auditEvents,
      ],
    }));
    return approvalId;
  }

  function decideApproval(
    approvalId: string,
    action: DecisionAction,
    reason: string,
    alternatePlanId?: PlanId,
  ) {
    const approval = state.approvals.find((item) => item.id === approvalId);
    if (!approval || approval.status !== 'Submitted') return false;
    if (action !== 'approve' && !reason.trim()) return false;

    const status =
      action === 'approve'
        ? 'Approved (simulated)'
        : action === 'changes'
          ? 'Changes requested'
          : 'Rejected';
    const selectedPlanId = alternatePlanId ?? approval.planId;
    const detail =
      action === 'approve'
        ? `${approval.recommendationId} Plan ${selectedPlanId} recorded as approved in the prototype. No block was issued.`
        : action === 'changes'
          ? `${approval.recommendationId} returned for changes; Plan ${selectedPlanId} was requested.`
          : `${approval.recommendationId} rejected with an officer reason.`;

    setState((previous) => ({
      ...previous,
      approvals: previous.approvals.map((item) =>
        item.id === approvalId
          ? {
              ...item,
              requestedPlanId: action === 'changes' ? selectedPlanId : undefined,
              status,
              officerReason: reason.trim() || 'Illustrative officer review completed.',
              decidedAt: new Date().toISOString(),
            }
          : item,
      ),
      auditEvents: [
        auditEvent(
          'Control Officer (simulated)',
          status,
          detail,
          approval.version,
        ),
        ...previous.auditEvents,
      ],
    }));
    return true;
  }

  function addTask(input: NewTaskInput) {
    const prefix =
      input.department === 'Engineering'
        ? 'E'
        : input.department === 'Signal & Telecom'
          ? 'S'
          : 'T';
    const departmentCount = state.tasks.filter((task) =>
      task.id.startsWith(`${prefix}-`),
    ).length;
    const id = `${prefix}-${40 + departmentCount + 1}`;
    const source =
      input.department === 'Engineering'
        ? 'TMS'
        : input.department === 'Signal & Telecom'
          ? 'SMMS'
          : 'TDMS';
    const now = new Date().toISOString();
    const task: Task = {
      id,
      department: input.department,
      title: input.title.trim(),
      asset: 'Demo asset record',
      worksite: state.section,
      severity: input.priority >= 80 ? 'High' : input.priority >= 55 ? 'Medium' : 'Routine',
      due: 'Due in 7 days',
      overdueDays: 0,
      priority: input.priority,
      factors: [
        { label: 'Safety severity', value: Math.round(input.priority * 0.4) },
        { label: 'Due urgency', value: Math.round(input.priority * 0.35) },
        { label: 'Network criticality', value: Math.round(input.priority * 0.25) },
      ],
      mandatory: input.mandatory,
      quarantined: true,
      quarantineReason: 'New demo records need confirmed worksite limits, protection and resources before planning.',
      source,
      sourceUpdatedAt: now,
      prescribedMinutes: 30,
      p50Minutes: 27,
      p90Minutes: 35,
      setupMinutes: 5,
      restorationMinutes: 5,
      blockNeed: 'Protected access required',
      isolationNeed: input.department === 'Electrical — TRD' ? 'Power isolation to be confirmed' : 'Not required',
      resources: 'Demo team · ready',
      compatibility: 'Requires planner confirmation before grouping',
      dependency: 'None recorded',
      confidence: 0,
    };

    setState((previous) => ({
      ...previous,
      tasks: [task, ...previous.tasks],
      runStatus: 'idle',
      auditEvents: [
        auditEvent(
          'Demo Planner',
          'Maintenance task added',
          `${id} added from the prototype form. Recommendation regeneration is required.`,
          previous.recommendationVersion,
        ),
        ...previous.auditEvents,
      ],
    }));
    return id;
  }

  function setDataGate(gate: DataGate) {
    if (gate !== 'stale') return;
    setState((previous) => ({
      ...previous,
      dataGate: 'stale',
      runStatus: 'blocked',
      sources: previous.sources.map((source) =>
        source.id === 'COA'
          ? { ...source, status: 'Stale' }
          : source,
      ),
      auditEvents: [
        auditEvent(
          'Data quality gate',
          'COA marked stale',
          'New recommendations are blocked until the demo snapshot is refreshed.',
          previous.recommendationVersion,
        ),
        ...previous.auditEvents,
      ],
    }));
  }

  function refreshSources() {
    const now = new Date().toISOString();
    setState((previous) => ({
      ...previous,
      dataGate: 'ready',
      runStatus: 'idle',
      sources: previous.sources.map((source) => ({
        ...source,
        updatedAt: now,
        status: 'Ready',
      })),
      auditEvents: [
        auditEvent(
          'Demo Planner',
          'Synthetic sources refreshed',
          'All fixture timestamps advanced. Existing decisions were preserved; a new run is required.',
          previous.recommendationVersion,
        ),
        ...previous.auditEvents,
      ],
    }));
  }

  function simulateReplan() {
    setState((previous) => {
      const version = previous.recommendationVersion + 1;
      const nextPlan: PlanId = 'B';
      return {
        ...previous,
        scenario: 'freight',
        runStatus: 'feasible',
        recommendationVersion: version,
        selectedPlanId: nextPlan,
        selectedTaskIds: includeMandatory(plans[nextPlan].taskIds, previous.tasks),
        draftDirty: false,
        lastRunAt: new Date().toISOString(),
        auditEvents: [
          auditEvent(
            'RailSamanvay demo engine',
            'Replan produced',
            `A freight path materialised. Draft moved to Plan ${nextPlan}; any already approved record remains frozen and unchanged.`,
            version,
          ),
          ...previous.auditEvents,
        ],
      };
    });
  }

  function resetPrototype() {
    window.localStorage.removeItem(STORAGE_KEY);
    setState(cloneInitialState());
  }

  const value: PrototypeContextValue = {
    state,
    hydrated,
    pendingCount,
    setPlanningField,
    generatePlans,
    selectPlan,
    toggleTask,
    revalidateDraft,
    submitForReview,
    decideApproval,
    addTask,
    setDataGate,
    refreshSources,
    simulateReplan,
    resetPrototype,
  };

  return (
    <PrototypeContext.Provider value={value}>
      {children}
    </PrototypeContext.Provider>
  );
}

export function usePrototype() {
  const context = useContext(PrototypeContext);
  if (!context) {
    throw new Error('usePrototype must be used within PrototypeProvider');
  }
  return context;
}
