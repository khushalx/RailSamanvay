export type Department = 'Engineering' | 'Signal & Telecom' | 'Electrical — TRD';

export type PlanningScenario =
  | 'base'
  | 'freight'
  | 'team-unavailable'
  | 'no-safe-window';

export type DataGate = 'ready' | 'stale';
export type RunStatus = 'idle' | 'running' | 'feasible' | 'infeasible' | 'blocked';
export type PlanId = 'A' | 'B' | 'C';
export type ApprovalStatus =
  | 'Submitted'
  | 'Approved (simulated)'
  | 'Changes requested'
  | 'Rejected';

export type Task = {
  id: string;
  department: Department;
  title: string;
  asset: string;
  worksite: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Routine';
  due: string;
  overdueDays: number;
  priority: number;
  factors: Array<{ label: string; value: number }>;
  mandatory: boolean;
  quarantined: boolean;
  quarantineReason?: string;
  source: 'TMS' | 'SMMS' | 'TDMS';
  sourceUpdatedAt: string;
  prescribedMinutes: number;
  p50Minutes: number;
  p90Minutes: number;
  setupMinutes: number;
  restorationMinutes: number;
  blockNeed: string;
  isolationNeed: string;
  resources: string;
  compatibility: string;
  dependency: string;
  confidence: number;
};

export type Plan = {
  id: PlanId;
  label: string;
  window: string;
  start: string;
  end: string;
  protectedMinutes: number;
  impactMinutes: number;
  utilization: number;
  taskIds: string[];
  relationship: string;
  mode: string;
  confidence: number;
  p90Minutes: number;
  rationale: string;
  tradeoff: string;
  objective: Array<{ label: string; value: number }>;
};

export type CandidateWindow = {
  id: 'early' | 'selected' | 'late';
  time: string;
  protectedMinutes: number;
  status: 'Eligible' | 'Rejected';
  trainConflict: string;
  freightConflict: string;
  impactMinutes: number;
  bss: number;
  reason: string;
};

export type Approval = {
  id: string;
  recommendationId: string;
  version: number;
  planId: PlanId;
  selectedTaskIds: string[];
  section: string;
  planningDate: string;
  submittedBy: string;
  submittedAt: string;
  note: string;
  status: ApprovalStatus;
  requestedPlanId?: PlanId;
  officerReason?: string;
  decidedAt?: string;
};

export type AuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  version?: number;
};

export type SourceHealth = {
  id: 'TMS' | 'SMMS' | 'TDMS' | 'COA';
  label: string;
  updatedAt: string;
  status: 'Ready' | 'Stale';
  records: number;
};

export const divisions = [
  'Secunderabad Division',
  'Hyderabad Division',
] as const;

export const sectionsByDivision: Record<string, string[]> = {
  'Secunderabad Division': ['Section A–B · Up line', 'Section B–C · Down line'],
  'Hyderabad Division': ['Section C–D · Up line', 'Section D–E · Down line'],
};

export const scenarioLabels: Record<PlanningScenario, string> = {
  base: 'Base operating snapshot',
  freight: 'Freight path materialises',
  'team-unavailable': 'TRD team unavailable',
  'no-safe-window': 'No safe window available',
};

export const initialTasks: Task[] = [
  {
    id: 'E-17',
    department: 'Engineering',
    title: 'Track defect removal',
    asset: 'Rail 60 kg · defect UT-442',
    worksite: 'km 44.2–45.4',
    severity: 'Critical',
    due: 'Within 24 hours',
    overdueDays: 0,
    priority: 96,
    factors: [
      { label: 'Safety severity', value: 45 },
      { label: 'Due urgency', value: 31 },
      { label: 'Network criticality', value: 20 },
    ],
    mandatory: true,
    quarantined: false,
    source: 'TMS',
    sourceUpdatedAt: '2026-09-01T14:14:00+05:30',
    prescribedMinutes: 75,
    p50Minutes: 68,
    p90Minutes: 75,
    setupMinutes: 10,
    restorationMinutes: 15,
    blockNeed: 'Traffic block required',
    isolationNeed: 'Not required',
    resources: 'P-Way team PW-3 · ready',
    compatibility: 'May overlap S-08 after protection; separate from T-11 isolation setup',
    dependency: 'Protection must be established first',
    confidence: 92,
  },
  {
    id: 'S-08',
    department: 'Signal & Telecom',
    title: 'Point machine inspection',
    asset: 'Point machine PM-A12',
    worksite: 'A cabin · km 45.0',
    severity: 'High',
    due: 'Overdue by 8 days',
    overdueDays: 8,
    priority: 78,
    factors: [
      { label: 'Safety severity', value: 28 },
      { label: 'Overdue urgency', value: 35 },
      { label: 'Network criticality', value: 15 },
    ],
    mandatory: false,
    quarantined: false,
    source: 'SMMS',
    sourceUpdatedAt: '2026-09-01T14:17:00+05:30',
    prescribedMinutes: 30,
    p50Minutes: 27,
    p90Minutes: 34,
    setupMinutes: 5,
    restorationMinutes: 5,
    blockNeed: 'Protected access required',
    isolationNeed: 'Signal disconnection under S&T procedure',
    resources: 'S&T team ST-2 · ready',
    compatibility: 'Conditional overlap with E-17 after protection',
    dependency: 'Joint handback check with Station Master',
    confidence: 86,
  },
  {
    id: 'T-11',
    department: 'Electrical — TRD',
    title: 'OHE span inspection',
    asset: 'OHE span 44/18–44/24',
    worksite: 'Isolation zone 4',
    severity: 'Medium',
    due: 'Due in 3 days',
    overdueDays: 0,
    priority: 64,
    factors: [
      { label: 'Safety severity', value: 24 },
      { label: 'Due urgency', value: 25 },
      { label: 'Network criticality', value: 15 },
    ],
    mandatory: false,
    quarantined: false,
    source: 'TDMS',
    sourceUpdatedAt: '2026-09-01T14:15:00+05:30',
    prescribedMinutes: 45,
    p50Minutes: 40,
    p90Minutes: 49,
    setupMinutes: 12,
    restorationMinutes: 10,
    blockNeed: 'Traffic block required',
    isolationNeed: 'Power isolation required · zone 4',
    resources: 'TRD team TR-1 · ready',
    compatibility: 'Runs after isolation; may overlap S-08 only with separate work limits',
    dependency: 'TPC isolation confirmation before start',
    confidence: 81,
  },
  {
    id: 'E-22',
    department: 'Engineering',
    title: 'Ultrasonic rail testing',
    asset: 'Rail 60 kg · test batch UT-449',
    worksite: 'km 46.0–46.8',
    severity: 'Medium',
    due: 'Due in 6 days',
    overdueDays: 0,
    priority: 51,
    factors: [
      { label: 'Safety severity', value: 20 },
      { label: 'Due urgency', value: 17 },
      { label: 'Network criticality', value: 14 },
    ],
    mandatory: false,
    quarantined: false,
    source: 'TMS',
    sourceUpdatedAt: '2026-09-01T14:14:00+05:30',
    prescribedMinutes: 35,
    p50Minutes: 31,
    p90Minutes: 38,
    setupMinutes: 5,
    restorationMinutes: 5,
    blockNeed: 'Protected access required',
    isolationNeed: 'Not required',
    resources: 'UT team UT-1 · ready',
    compatibility: 'Separate worksite; compatible with S-08',
    dependency: 'None',
    confidence: 88,
  },
  {
    id: 'S-12',
    department: 'Signal & Telecom',
    title: 'Track-circuit testing',
    asset: 'Track circuit AB-04',
    worksite: 'B cabin · km 45.8',
    severity: 'Routine',
    due: 'Due in 11 days',
    overdueDays: 0,
    priority: 42,
    factors: [
      { label: 'Safety severity', value: 14 },
      { label: 'Due urgency', value: 13 },
      { label: 'Network criticality', value: 15 },
    ],
    mandatory: false,
    quarantined: false,
    source: 'SMMS',
    sourceUpdatedAt: '2026-09-01T14:17:00+05:30',
    prescribedMinutes: 20,
    p50Minutes: 18,
    p90Minutes: 24,
    setupMinutes: 4,
    restorationMinutes: 4,
    blockNeed: 'Protected access required',
    isolationNeed: 'Signal disconnection under S&T procedure',
    resources: 'S&T team ST-4 · ready',
    compatibility: 'Compatible with E-22 at separate worksite',
    dependency: 'None',
    confidence: 79,
  },
  {
    id: 'E-31',
    department: 'Engineering',
    title: 'Bridge bearing inspection',
    asset: 'Bridge BR-19',
    worksite: 'Location missing',
    severity: 'High',
    due: 'Due in 2 days',
    overdueDays: 0,
    priority: 70,
    factors: [
      { label: 'Safety severity', value: 32 },
      { label: 'Due urgency', value: 24 },
      { label: 'Network criticality', value: 14 },
    ],
    mandatory: false,
    quarantined: true,
    quarantineReason: 'Canonical kilometre and worksite limits are missing from the source record.',
    source: 'TMS',
    sourceUpdatedAt: '2026-09-01T14:14:00+05:30',
    prescribedMinutes: 50,
    p50Minutes: 45,
    p90Minutes: 58,
    setupMinutes: 8,
    restorationMinutes: 8,
    blockNeed: 'To be confirmed',
    isolationNeed: 'Not required',
    resources: 'Bridge team · unverified',
    compatibility: 'Not evaluated while quarantined',
    dependency: 'Complete worksite limits before planning',
    confidence: 0,
  },
];

export const plans: Record<PlanId, Plan> = {
  A: {
    id: 'A',
    label: 'Recommended',
    window: '02:20–04:00',
    start: '02:20',
    end: '04:00',
    protectedMinutes: 100,
    impactMinutes: 8,
    utilization: 75,
    taskIds: ['E-17', 'S-08', 'T-11'],
    relationship: 'Sequential protection and isolation setup; conditional task overlap at separate work limits',
    mode: 'Traffic block + power isolation',
    confidence: 87,
    p90Minutes: 96,
    rationale: 'Lowest weighted train impact among the hard-feasible windows that retain all due work.',
    tradeoff: 'Requires coordinated Engineering, S&T and TRD handback.',
    objective: [
      { label: 'Priority coverage', value: 46 },
      { label: 'Utilization', value: 25 },
      { label: 'Low train impact', value: 21 },
      { label: 'Plan stability', value: 8 },
    ],
  },
  B: {
    id: 'B',
    label: 'Lower churn',
    window: '02:35–04:15',
    start: '02:35',
    end: '04:15',
    protectedMinutes: 100,
    impactMinutes: 11,
    utilization: 75,
    taskIds: ['E-17', 'S-08', 'T-11'],
    relationship: 'Same conditional grouping with a later coordinated start',
    mode: 'Traffic block + power isolation',
    confidence: 85,
    p90Minutes: 98,
    rationale: 'Preserves the previously discussed operating band and avoids one forecast freight path.',
    tradeoff: 'Three additional illustrative train-impact minutes versus Plan A.',
    objective: [
      { label: 'Priority coverage', value: 46 },
      { label: 'Utilization', value: 25 },
      { label: 'Low train impact', value: 17 },
      { label: 'Plan stability', value: 12 },
    ],
  },
  C: {
    id: 'C',
    label: 'Conservative',
    window: '02:10–04:20',
    start: '02:10',
    end: '04:20',
    protectedMinutes: 130,
    impactMinutes: 13,
    utilization: 58,
    taskIds: ['E-17', 'S-08'],
    relationship: 'Sequential protection with two work groups; TRD work remains unscheduled',
    mode: 'Traffic block',
    confidence: 91,
    p90Minutes: 104,
    rationale: 'Adds restoration buffer and avoids cross-discipline power isolation coordination.',
    tradeoff: 'Higher possession time and leaves T-11 for a later safe window.',
    objective: [
      { label: 'Priority coverage', value: 39 },
      { label: 'Utilization', value: 18 },
      { label: 'Low train impact', value: 15 },
      { label: 'Plan stability', value: 18 },
    ],
  },
};

export const candidateWindows: CandidateWindow[] = [
  {
    id: 'early',
    time: '01:10–02:10',
    protectedMinutes: 60,
    status: 'Rejected',
    trainConflict: 'No direct conflict',
    freightConflict: 'None forecast',
    impactMinutes: 5,
    bss: 41,
    reason: 'Cannot fit mandatory E-17 P90 duration plus protection and handback.',
  },
  {
    id: 'selected',
    time: '02:20–04:00',
    protectedMinutes: 100,
    status: 'Eligible',
    trainConflict: 'One regulated path',
    freightConflict: 'Forecast path clears by 02:16',
    impactMinutes: 8,
    bss: 91,
    reason: 'Hard-feasible with the highest illustrative block suitability score.',
  },
  {
    id: 'late',
    time: '04:30–05:45',
    protectedMinutes: 75,
    status: 'Rejected',
    trainConflict: 'Morning passenger sensitivity',
    freightConflict: 'One likely freight path',
    impactMinutes: 19,
    bss: 38,
    reason: 'Critical task cluster does not fit and passenger impact is higher.',
  },
];

export const initialSources: SourceHealth[] = [
  { id: 'TMS', label: 'Track Maintenance System', updatedAt: '2026-09-01T14:14:00+05:30', status: 'Ready', records: 42 },
  { id: 'SMMS', label: 'Signal Maintenance System', updatedAt: '2026-09-01T14:17:00+05:30', status: 'Ready', records: 18 },
  { id: 'TDMS', label: 'Traction Distribution', updatedAt: '2026-09-01T14:15:00+05:30', status: 'Ready', records: 12 },
  { id: 'COA', label: 'Control Office snapshot', updatedAt: '2026-09-01T14:21:00+05:30', status: 'Ready', records: 126 },
];

export const initialApprovals: Approval[] = [
  {
    id: 'APR-040',
    recommendationId: 'RS-CD-20260907-V2',
    version: 2,
    planId: 'B',
    selectedTaskIds: ['E-17', 'S-08'],
    section: 'Section C–D · Up line',
    planningDate: '2026-09-07',
    submittedBy: 'Demo Planner',
    submittedAt: '2026-09-01T13:40:00+05:30',
    note: 'Please verify the later start against the freight forecast.',
    status: 'Submitted',
  },
  {
    id: 'APR-039',
    recommendationId: 'RS-AB-20260902-V1',
    version: 1,
    planId: 'A',
    selectedTaskIds: ['E-17', 'S-08', 'T-11'],
    section: 'Section A–B · Up line',
    planningDate: '2026-09-02',
    submittedBy: 'Demo Planner',
    submittedAt: '2026-08-31T17:15:00+05:30',
    note: 'Joint handback confirmed in the simulation.',
    status: 'Approved (simulated)',
    officerReason: 'Illustrative officer review completed.',
    decidedAt: '2026-08-31T17:42:00+05:30',
  },
];

export const initialAuditEvents: AuditEvent[] = [
  {
    id: 'AUD-003',
    timestamp: '2026-09-01T14:22:00+05:30',
    actor: 'RailSamanvay demo engine',
    action: 'Recommendation generated',
    detail: 'Plan A retained for Section A–B after hard-constraint validation.',
    version: 1,
  },
  {
    id: 'AUD-002',
    timestamp: '2026-09-01T14:21:00+05:30',
    actor: 'Data quality gate',
    action: 'Snapshot accepted',
    detail: 'Synthetic TMS, SMMS, TDMS and COA snapshots passed freshness checks.',
  },
  {
    id: 'AUD-001',
    timestamp: '2026-09-01T14:20:00+05:30',
    actor: 'Demo Planner',
    action: 'Planning context selected',
    detail: 'Secunderabad Division · Section A–B · 02 Sep 2026.',
  },
];
