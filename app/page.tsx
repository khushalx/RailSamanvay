'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  FileCheck2,
  Info,
  LayoutDashboard,
  ListChecks,
  RefreshCw,
  ScrollText,
  Send,
  ShieldCheck,
  TrainFront,
  UserCheck,
  Wrench,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type PlanKey = 'A' | 'B' | 'C';
type WindowKey = 'early' | 'selected' | 'late';

const navigation = [
  { label: 'Weekly Plan', icon: LayoutDashboard, href: '#weekly-plan' },
  { label: 'Monthly Outlook', icon: CalendarRange, href: '#monthly-outlook' },
  { label: 'Maintenance Tasks', icon: Wrench, href: '#maintenance-tasks' },
  { label: 'Approvals', icon: UserCheck, href: '#approvals', count: 2 },
  { label: 'Audit & Data Health', icon: ScrollText, href: '#audit-data-health' },
];

const tasks = [
  {
    id: 'E-17',
    department: 'Engineering',
    detail: 'Track defect work',
    asset: 'Rail · km 44.2–45.4',
    duration: '75 min',
    priority: 96,
    timing: 'Due within 24 h',
    state: 'Mandatory',
    source: 'TMS · 14:14',
    tone: 'bg-[#e8f2f4] text-[#075c66]',
  },
  {
    id: 'S-08',
    department: 'S&T',
    detail: 'Signal equipment inspection',
    asset: 'Point machine · A cabin',
    duration: '30 min',
    priority: 78,
    timing: 'Overdue by 8 days',
    state: 'Overdue',
    source: 'SMMS · 14:17',
    tone: 'bg-[#fff0e2] text-[#9a4b13]',
  },
  {
    id: 'T-11',
    department: 'Traction',
    detail: 'OHE inspection',
    asset: 'OHE span · isolation zone 4',
    duration: '45 min',
    priority: 64,
    timing: 'Due in 3 days',
    state: 'Due soon',
    source: 'TDMS · 14:15',
    tone: 'bg-[#edf0f7] text-[#334a74]',
  },
  {
    id: 'E-22',
    department: 'Engineering',
    detail: 'Ultrasonic rail test',
    asset: 'Rail · km 46.0–46.8',
    duration: '35 min',
    priority: 51,
    timing: 'Due in 6 days',
    state: 'Planned',
    source: 'TMS · 14:14',
    tone: 'bg-[#e8f2f4] text-[#075c66]',
  },
  {
    id: 'S-12',
    department: 'S&T',
    detail: 'Track circuit testing',
    asset: 'Track circuit · AB-04',
    duration: '20 min',
    priority: 42,
    timing: 'Due in 11 days',
    state: 'Optional',
    source: 'SMMS · 14:17',
    tone: 'bg-[#fff0e2] text-[#9a4b13]',
  },
];

const plans = {
  A: {
    label: 'Recommended',
    window: '02:20–04:00',
    duration: 100,
    impact: 8,
    utilization: 75,
    taskIds: ['E-17', 'S-08', 'T-11'],
    left: '38.9%',
    width: '27.8%',
    reason: 'Lowest weighted train impact among windows long enough for all three tasks.',
    mode: 'Traffic block + power isolation',
  },
  B: {
    label: 'Lower churn',
    window: '02:35–04:15',
    duration: 100,
    impact: 11,
    utilization: 75,
    taskIds: ['E-17', 'S-08', 'T-11'],
    left: '43.1%',
    width: '27.8%',
    reason: 'Keeps the previously discussed start band with a modest freight trade-off.',
    mode: 'Traffic block + power isolation',
  },
  C: {
    label: 'Conservative',
    window: '02:10–04:20',
    duration: 130,
    impact: 13,
    utilization: 58,
    taskIds: ['E-17', 'S-08'],
    left: '36.1%',
    width: '36.1%',
    reason: 'Adds restoration buffer and groups fewer tasks for a more conservative option.',
    mode: 'Traffic block',
  },
} as const;

const windowDetails = {
  early: {
    title: '01:10–02:10 · Rejected',
    body: 'The 60-minute opportunity cannot fit the mandatory 75-minute task plus protection and handback.',
    tone: 'border-[#ebc4c1] bg-[#fff7f5] text-[#8e403c]',
  },
  selected: {
    title: 'Selected plan window',
    body: 'The current plan is the lowest-impact hard-feasible option for its included task set.',
    tone: 'border-[#bfd9ca] bg-[#f0f8f3] text-[#235c45]',
  },
  late: {
    title: '04:30–05:45 · Rejected',
    body: 'The critical cluster cannot fit and the window has higher morning passenger sensitivity.',
    tone: 'border-[#ebc4c1] bg-[#fff7f5] text-[#8e403c]',
  },
} as const;

function StatusDot({ className }: { className: string }) {
  return <span className={`size-1.5 rounded-full ${className}`} />;
}

export default function Home() {
  const [planKey, setPlanKey] = useState<PlanKey>('A');
  const [windowKey, setWindowKey] = useState<WindowKey>('selected');
  const [lastRefreshed, setLastRefreshed] = useState('14:26 IST');
  const [runNotice, setRunNotice] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [decisionNote, setDecisionNote] = useState('');

  const plan = plans[planKey];
  const planTasks = tasks.filter((task) => plan.taskIds.includes(task.id as never));
  const inspectedWindow = windowDetails[windowKey];

  function generatePlans() {
    setLastRefreshed('just now');
    setRunNotice('Plans regenerated from the latest synthetic operating snapshot.');
    setSubmitted(false);
  }

  function submitForReview() {
    setSubmitted(true);
    setReviewOpen(false);
  }

  return (
    <main className="min-h-screen bg-[#f3f5f6] text-[#11283a]">
      <div aria-hidden="true" className="grid h-1 grid-cols-3">
        <span className="bg-[#f47a1f]" />
        <span className="bg-white" />
        <span className="bg-[#16835b]" />
      </div>

      <header className="sticky top-0 z-40 flex h-16 items-center border-b border-white/10 bg-[#0c2338] px-4 text-white lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-md border border-white/20 bg-white/10">
            <TrainFront className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-[0.01em]">
              RailSamanvay
            </p>
            <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-white/55">
              Ministry of Railways
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Badge className="hidden rounded-md border-white/15 bg-white/10 px-2.5 text-[10px] uppercase tracking-[0.1em] text-white sm:inline-flex">
            SIH prototype
          </Badge>
          <div className="hidden h-7 w-px bg-white/15 sm:block" />
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium">Block Planner</p>
            <p className="text-[10px] text-white/55">Secunderabad Division</p>
          </div>
          <div className="grid size-8 place-items-center rounded-full bg-[#0b737a] text-xs font-semibold">
            BP
          </div>
        </div>
      </header>

      <nav
        aria-label="Mobile navigation"
        className="flex gap-1 overflow-x-auto border-b border-[#d9e0e4] bg-white p-2 lg:hidden"
      >
        {navigation.map((item, index) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-[11px] font-medium ${
                index === 0 ? 'bg-[#e8f2f4] text-[#075f69]' : 'text-[#526675]'
              }`}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="mx-auto grid min-h-[calc(100vh-68px)] max-w-[1680px] lg:grid-cols-[228px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#d9e0e4] bg-white lg:flex lg:flex-col">
          <nav aria-label="Primary navigation" className="sticky top-20 space-y-1 p-3 pt-5">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#71808c]">
              Planning workspace
            </p>
            {navigation.map((item, index) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex h-10 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition-colors ${
                    index === 0
                      ? 'bg-[#e8f2f4] text-[#075f69]'
                      : 'text-[#526675] hover:bg-[#f3f5f6] hover:text-[#11283a]'
                  }`}
                >
                  <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.count ? (
                    <span className="ml-auto rounded bg-[#fff0e2] px-1.5 py-0.5 text-[10px] font-semibold text-[#9a4b13]">
                      {item.count}
                    </span>
                  ) : null}
                </a>
              );
            })}

            <div className="mt-8 border-t border-[#e2e7ea] pt-4">
              <div className="rounded-md bg-[#f6f8f9] p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#344b5d]">
                  <Database className="size-3.5" aria-hidden="true" />
                  Sample data mode
                </div>
                <p className="mt-1.5 text-[11px] leading-4 text-[#71808c]">
                  Synthetic TMS, SMMS, TDMS and COA records only.
                </p>
              </div>
            </div>
          </nav>
        </aside>

        <section id="weekly-plan" className="min-w-0 scroll-mt-24 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-[1320px]">
            <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0b737a]">
                  Weekly planning
                  <ChevronRight className="size-3" aria-hidden="true" />
                  01–07 Sep 2026
                </div>
                <h1 className="text-2xl font-semibold tracking-[-0.025em] text-[#102a40] sm:text-[28px]">
                  Weekly Block Plan
                </h1>
                <p className="mt-1 text-sm text-[#637483]">
                  Compare corridor capacity with cross-department maintenance demand.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#5b6f7d]">
                {submitted ? (
                  <Badge className="mr-1 rounded-md bg-[#edf7f1] text-[#277356]">
                    <Send className="size-3" aria-hidden="true" /> Sent for officer review
                  </Badge>
                ) : null}
                <Clock3 className="size-3.5" aria-hidden="true" />
                Last refreshed {lastRefreshed}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-[#0b737a] hover:bg-[#e8f2f4] hover:text-[#075f69]"
                  aria-label="Refresh planning data"
                  onClick={generatePlans}
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              </div>
            </div>

            <Card className="mb-4 gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
              <CardContent className="flex flex-col gap-4 p-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="grid flex-1 gap-3 sm:grid-cols-3">
                  <label className="space-y-1.5">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#71808c]">
                      Division
                    </span>
                    <NativeSelect className="w-full" aria-label="Division">
                      <NativeSelectOption>Secunderabad Division</NativeSelectOption>
                      <NativeSelectOption>Hyderabad Division</NativeSelectOption>
                    </NativeSelect>
                  </label>
                  <label className="space-y-1.5">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#71808c]">
                      Railway section
                    </span>
                    <NativeSelect className="w-full" aria-label="Railway section">
                      <NativeSelectOption>Section A–B · Up line</NativeSelectOption>
                      <NativeSelectOption>Section B–C · Down line</NativeSelectOption>
                    </NativeSelect>
                  </label>
                  <label className="space-y-1.5">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#71808c]">
                      Planning date
                    </span>
                    <div className="flex h-8 items-center gap-2 rounded-lg border border-input px-2.5 text-sm">
                      <CalendarDays className="size-3.5 text-[#71808c]" aria-hidden="true" />
                      02 Sep 2026
                    </div>
                  </label>
                </div>
                <Button
                  className="h-9 bg-[#0b6871] px-4 text-white hover:bg-[#075860]"
                  onClick={generatePlans}
                >
                  Generate plans
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </CardContent>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#e4e9eb] bg-[#f8fafb] px-4 py-2.5 text-[11px] text-[#526675]">
                <span className="flex items-center gap-2 font-semibold uppercase tracking-[0.09em] text-[#9a4b13]">
                  <StatusDot className="bg-[#f47a1f]" />
                  Simulation
                </span>
                <span className="flex items-center gap-2">
                  <StatusDot className="bg-[#21835d]" />
                  Operational data fresh
                </span>
                <span className="flex items-center gap-2">
                  <StatusDot className="bg-[#21835d]" />
                  Rule pack Division-X v3.2 active
                </span>
                <span className="ml-auto hidden text-[#7c8b95] xl:inline">
                  No live Railway system is connected
                </span>
              </div>
              {runNotice ? (
                <output
                  aria-live="polite"
                  className="border-t border-[#cfe1e2] bg-[#f0f8f8] px-4 py-2 text-[11px] text-[#075f69]"
                >
                  {runNotice}
                </output>
              ) : null}
            </Card>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
              <Card className="gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
                <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-[15px] font-semibold text-[#163247]">
                        Corridor opportunity timeline
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        Section A–B · Up line · 00:00–06:00
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className="rounded-md border-[#b9d3d6] bg-[#f1f8f8] text-[10px] text-[#075f69]"
                    >
                      3 candidate windows
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="overflow-x-auto px-5 pb-5 pt-4">
                  <div className="min-w-[560px]">
                    <div className="mb-3 ml-[98px] grid grid-cols-7 text-[10px] tabular-nums text-[#82909a]">
                      {['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00'].map(
                        (time) => (
                          <span key={time} className="-translate-x-1/2 first:translate-x-0 last:-translate-x-full">
                            {time}
                          </span>
                        ),
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <TimelineRow label="Train paths">
                        <span className="absolute inset-y-1 left-[4%] w-[10%] rounded-sm bg-[#8ea1ae]" />
                        <span className="absolute inset-y-1 left-[36%] w-[8%] rounded-sm bg-[#8ea1ae]" />
                        <span className="absolute inset-y-1 left-[70%] w-[13%] rounded-sm bg-[#8ea1ae]" />
                      </TimelineRow>
                      <TimelineRow label="Freight forecast">
                        <span className="absolute inset-y-1 left-[51%] w-[10%] rounded-sm border border-dashed border-[#9b6b3f] bg-[#fff5ea]" />
                      </TimelineRow>
                      <TimelineRow label="Candidate 1">
                        <Button
                          variant="outline"
                          aria-label="Inspect rejected window from 01:10 to 02:10"
                          aria-pressed={windowKey === 'early'}
                          onClick={() => setWindowKey('early')}
                          className="absolute inset-y-0 left-[19.4%] h-auto w-[16.7%] rounded-sm border-[#df9c9c] bg-[#fff4f2] p-0 text-[9px] font-semibold text-[#a74642] hover:bg-[#fdebea] aria-pressed:ring-2 aria-pressed:ring-[#a74642]/30"
                        >
                          Too short
                        </Button>
                      </TimelineRow>
                      <TimelineRow label={`Plan ${planKey}`}>
                        <Button
                          aria-label={`Inspect Plan ${planKey} window ${plan.window}`}
                          aria-pressed={windowKey === 'selected'}
                          onClick={() => setWindowKey('selected')}
                          className="absolute inset-y-0 h-auto rounded-sm bg-[#0b737a] p-0 text-[9px] font-semibold text-white shadow-sm hover:bg-[#075f69] aria-pressed:ring-2 aria-pressed:ring-[#0b737a]/30"
                          style={{ left: plan.left, width: plan.width }}
                        >
                          {plan.window}
                        </Button>
                      </TimelineRow>
                      <TimelineRow label="Candidate 3">
                        <Button
                          variant="outline"
                          aria-label="Inspect rejected window from 04:30 to 05:45"
                          aria-pressed={windowKey === 'late'}
                          onClick={() => setWindowKey('late')}
                          className="absolute inset-y-0 left-[75%] h-auto w-[20.8%] rounded-sm border-[#df9c9c] bg-[#fff4f2] p-0 text-[9px] font-semibold text-[#a74642] hover:bg-[#fdebea] aria-pressed:ring-2 aria-pressed:ring-[#a74642]/30"
                        >
                          High impact
                        </Button>
                      </TimelineRow>
                    </div>

                    <div className={`mt-4 rounded-md border px-3 py-2.5 ${inspectedWindow.tone}`}>
                      <p className="text-[11px] font-semibold">{inspectedWindow.title}</p>
                      <p className="mt-0.5 text-[10px] leading-4 opacity-80">{inspectedWindow.body}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#e7ecee] pt-4 text-[10px] text-[#637483]">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-sm bg-[#0b737a]" /> Recommended window
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-sm border border-[#df9c9c] bg-[#fff4f2]" /> Rejected window
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-sm bg-[#8ea1ae]" /> Train occupancy
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-0 rounded-lg border-t-[3px] border-t-[#0b737a] py-0 shadow-none ring-[#cddbdd]">
                <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <ButtonGroup aria-label="Select recommendation plan">
                      {(['A', 'B', 'C'] as PlanKey[]).map((key) => (
                        <Button
                          key={key}
                          size="sm"
                          variant={planKey === key ? 'default' : 'outline'}
                          aria-pressed={planKey === key}
                          onClick={() => {
                            setPlanKey(key);
                            setWindowKey('selected');
                            setSubmitted(false);
                          }}
                          className={
                            planKey === key
                              ? 'bg-[#0b6871] text-white hover:bg-[#075860]'
                              : 'border-[#cbd6db] text-[#526675]'
                          }
                        >
                          Plan {key}
                        </Button>
                      ))}
                    </ButtonGroup>
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#277356]">
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      Feasible
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge className="rounded-md bg-[#e7f2f3] text-[10px] uppercase tracking-[0.09em] text-[#075f69]">
                      {plan.label}
                    </Badge>
                    <span className="text-[10px] text-[#71808c]">Synthetic alternative</span>
                  </div>
                  <CardTitle className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-[#102a40]">
                    {plan.window}
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-xs">
                    Section A–B · Up line · {plan.duration}-minute possession
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-4">
                  <div className="mb-4 flex items-start gap-2.5 rounded-md border border-[#bfd9ca] bg-[#f0f8f3] p-3">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#277356]" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-semibold text-[#235c45]">Hard constraints passed</p>
                      <p className="mt-0.5 text-[10px] leading-4 text-[#557264]">
                        Isolation, duration, resources and protected sub-zones validated.
                      </p>
                    </div>
                  </div>

                  <dl className="mb-4 grid grid-cols-3 divide-x divide-[#e2e7ea] rounded-md border border-[#e2e7ea] bg-[#fafbfb] py-3 text-center">
                    <div>
                      <dt className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#7d8a94]">Tasks</dt>
                      <dd className="mt-1 text-lg font-semibold text-[#183449]">{planTasks.length}</dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#7d8a94]">Train impact</dt>
                      <dd className="mt-1 text-lg font-semibold text-[#183449]">
                        {plan.impact}<span className="ml-0.5 text-[10px] font-medium">min</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#7d8a94]">Utilization</dt>
                      <dd className="mt-1 text-lg font-semibold text-[#183449]">{plan.utilization}%</dd>
                    </div>
                  </dl>

                  <div className="space-y-2">
                    {planTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 rounded-md border border-[#e2e7ea] px-3 py-2.5">
                        <span className={`grid size-8 shrink-0 place-items-center rounded text-[10px] font-bold ${task.tone}`}>
                          {task.id}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[#294357]">{task.department}</p>
                          <p className="truncate text-[10px] text-[#71808c]">{task.detail}</p>
                        </div>
                        <span className="text-[10px] font-medium tabular-nums text-[#526675]">{task.duration}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <WhyPlanDialog planKey={planKey} plan={plan} />

                    <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                      <DialogTrigger
                        render={
                          <Button className="h-9 bg-[#0b6871] text-white hover:bg-[#075860]" />
                        }
                      >
                        Review & send
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
                        <DialogHeader>
                          <div className="mb-1 flex items-center gap-2 text-[#0b6871]">
                            <FileCheck2 className="size-4" aria-hidden="true" />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">Planner check</span>
                          </div>
                          <DialogTitle className="text-xl text-[#102a40]">
                            Send Plan {planKey} for officer review
                          </DialogTitle>
                          <DialogDescription>
                            Confirm the synthetic task and resource facts before creating a simulated review request.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="rounded-md border border-[#eed6be] bg-[#fffaf4] p-3 text-[11px] leading-4 text-[#765436]">
                          This action does not approve, issue or write back a traffic or power block. Final authority remains with the Control Officer.
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#71808c]">Included work</p>
                          {planTasks.map((task) => (
                            <label
                              key={task.id}
                              className="flex cursor-pointer items-center gap-3 rounded-md border border-[#e2e7ea] p-3"
                            >
                              <Checkbox defaultChecked aria-label={`Include task ${task.id}`} />
                              <span className={`grid size-8 place-items-center rounded text-[10px] font-bold ${task.tone}`}>
                                {task.id}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-semibold text-[#294357]">{task.department}</span>
                                <span className="block truncate text-[10px] text-[#71808c]">{task.detail} · {task.duration}</span>
                              </span>
                            </label>
                          ))}
                        </div>

                        <label className="space-y-1.5">
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#71808c]">
                            Planner note
                          </span>
                          <Textarea
                            value={decisionNote}
                            onChange={(event) => setDecisionNote(event.target.value)}
                            placeholder="Add context for the Control Officer (optional)"
                          />
                        </label>

                        <div className="grid gap-2 rounded-md bg-[#f7f9fa] p-3 text-[11px] text-[#526675] sm:grid-cols-2">
                          <span><strong className="text-[#294357]">Possession:</strong> {plan.window}</span>
                          <span><strong className="text-[#294357]">Mode:</strong> {plan.mode}</span>
                          <span><strong className="text-[#294357]">Train impact:</strong> {plan.impact} weighted min</span>
                          <span><strong className="text-[#294357]">Rule pack:</strong> Division-X v3.2</span>
                        </div>

                        <DialogFooter>
                          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                          <Button
                            className="bg-[#0b6871] text-white hover:bg-[#075860]"
                            onClick={submitForReview}
                          >
                            <Send className="size-3.5" aria-hidden="true" />
                            Send simulated request
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-md border border-[#eed6be] bg-[#fffaf4] px-3 py-2.5 text-[10px] leading-4 text-[#765436]">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[#b8611e]" aria-hidden="true" />
              <p>
                Decision support only — applicable Railway rules and authorized officers prevail. Recommendations do not issue traffic or power blocks.
              </p>
            </div>

            <div className="mt-8 grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.65fr)]">
              <Card
                id="maintenance-tasks"
                className="scroll-mt-24 gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]"
              >
                <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-[#163247]">
                        <ListChecks className="size-4 text-[#0b737a]" aria-hidden="true" />
                        Maintenance demand
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        Normalized task view for Section A–B
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="rounded-md text-[10px] text-[#526675]">
                      5 eligible tasks
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#f7f9fa] hover:bg-[#f7f9fa]">
                        <TableHead className="pl-5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#71808c]">Task</TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#71808c]">Maintenance need</TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#71808c]">Priority</TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#71808c]">Timing</TableHead>
                        <TableHead className="pr-5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#71808c]">Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="pl-5">
                            <div className="flex items-center gap-2.5">
                              <span className={`grid size-8 place-items-center rounded text-[10px] font-bold ${task.tone}`}>
                                {task.id}
                              </span>
                              <span className="text-xs font-semibold text-[#294357]">{task.department}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs font-medium text-[#294357]">{task.detail}</p>
                            <p className="mt-0.5 text-[10px] text-[#7a8993]">{task.asset} · {task.duration}</p>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs font-semibold tabular-nums text-[#183449]">{task.priority}</span>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-[#526675]">{task.timing}</p>
                            <p className="mt-0.5 text-[10px] text-[#9a4b13]">{task.state}</p>
                          </TableCell>
                          <TableCell className="pr-5 text-[10px] text-[#71808c]">{task.source}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card
                  id="monthly-outlook"
                  className="scroll-mt-24 gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]"
                >
                  <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
                    <CardTitle className="text-[15px] font-semibold text-[#163247]">September corridor outlook</CardTitle>
                    <CardDescription className="mt-1 text-xs">Reserved maintenance capacity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 px-5 py-4">
                    {[
                      ['01–07 Sep', 72, 'High-priority week'],
                      ['08–14 Sep', 54, 'Balanced demand'],
                      ['15–21 Sep', 63, 'OHE cycle due'],
                      ['22–30 Sep', 41, 'Capacity available'],
                    ].map(([week, value, note]) => (
                      <div key={week as string}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px]">
                          <span className="font-semibold text-[#344b5d]">{week}</span>
                          <span className="text-[#71808c]">{note}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#e8edef]">
                          <div className="h-full rounded-full bg-[#0b737a]" style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card
                  id="approvals"
                  className="scroll-mt-24 gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]"
                >
                  <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-[15px] font-semibold text-[#163247]">Officer review queue</CardTitle>
                      <Badge className="rounded-md bg-[#fff0e2] text-[#9a4b13]">2 pending</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 px-5 py-4">
                    <div className="flex items-center gap-3 rounded-md border border-[#e2e7ea] p-3">
                      <span className="grid size-8 place-items-center rounded bg-[#eef2f4] text-[#526675]">
                        <FileCheck2 className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#294357]">RS-0902-A1 · Section A–B</p>
                        <p className="mt-0.5 text-[10px] text-[#71808c]">
                          {submitted ? 'Sent by Block Planner · just now' : 'Draft · planner review pending'}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`rounded-md text-[9px] ${submitted ? 'border-[#bfd9ca] text-[#277356]' : 'text-[#71808c]'}`}
                      >
                        {submitted ? 'Sent' : 'Draft'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 rounded-md border border-[#e2e7ea] p-3">
                      <span className="grid size-8 place-items-center rounded bg-[#eef2f4] text-[#526675]">
                        <FileCheck2 className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#294357]">RS-0903-C2 · Section B–C</p>
                        <p className="mt-0.5 text-[10px] text-[#71808c]">Awaiting Traction facts</p>
                      </div>
                      <Badge variant="outline" className="rounded-md text-[9px] text-[#9a4b13]">Hold</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  id="audit-data-health"
                  className="scroll-mt-24 gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]"
                >
                  <CardHeader className="border-b border-[#e4e9eb] px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-[15px] font-semibold text-[#163247]">Data health</CardTitle>
                        <CardDescription className="mt-1 text-xs">Freshness gate for recommendation</CardDescription>
                      </div>
                      <CheckCircle2 className="size-5 text-[#277356]" aria-hidden="true" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 py-4">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-2xl font-semibold tracking-tight text-[#183449]">4 / 4</p>
                        <p className="mt-0.5 text-[10px] text-[#71808c]">Required sources within policy</p>
                      </div>
                      <Badge className="rounded-md bg-[#edf7f1] text-[#277356]">Gate passed</Badge>
                    </div>
                    <Progress value={100} className="mt-3 [&_[data-slot=progress-indicator]]:bg-[#21835d]" />
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-[#526675]">
                      <span>TMS · 12 min ago</span>
                      <span>SMMS · 9 min ago</span>
                      <span>TDMS · 11 min ago</span>
                      <span>COA · 2 min ago</span>
                    </div>
                    <p className="mt-3 border-t border-[#e7ecee] pt-3 text-[10px] leading-4 text-[#71808c]">
                      If COA exceeds the approved freshness threshold, new recommendations fail closed and manual planning takes over.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <footer className="mt-8 border-t border-[#d8e0e4] py-5 text-center text-[10px] leading-4 text-[#71808c]">
              RailSamanvay SIH prototype · Synthetic scenario only · No live Railway system or operational authority connected
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function TimelineRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2.5">
      <span className="text-[10px] font-medium text-[#526675]">{label}</span>
      <div className="relative h-7 overflow-hidden rounded-sm bg-[repeating-linear-gradient(to_right,#edf1f3_0,#edf1f3_1px,transparent_1px,transparent_16.666%)] ring-1 ring-inset ring-[#e3e8ea]">
        {children}
      </div>
    </div>
  );
}

function WhyPlanDialog({
  planKey,
  plan,
}: {
  planKey: PlanKey;
  plan: (typeof plans)[PlanKey];
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" className="h-9 border-[#cbd6db] text-[#355064]" />
        }
      >
        Why this plan?
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2 text-[#0b6871]">
            <Info className="size-4" aria-hidden="true" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">Explanation payload</span>
          </div>
          <DialogTitle className="text-xl text-[#102a40]">Why Plan {planKey} ranked here</DialogTitle>
          <DialogDescription>
            A traceable explanation from the synthetic inputs, hard constraints and objective terms used in this run.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border-l-[3px] border-[#0b737a] bg-[#eef6f6] p-3 text-xs leading-5 text-[#294357]">
          {plan.reason}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold text-[#183449]">Binding hard constraints</h3>
            <ul className="mt-2 space-y-2 text-[11px] leading-4 text-[#526675]">
              {[
                'Mandatory E-17 completed before its 24-hour deadline',
                `Possession and isolation mode: ${plan.mode}`,
                'Protection, minimum duration and handback margins',
                'Approved worksite separation and resource calendars',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#277356]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#183449]">Operational trade-off</h3>
            <dl className="mt-2 space-y-2 rounded-md bg-[#f6f8f9] p-3 text-[11px]">
              <div className="flex justify-between gap-3"><dt className="text-[#71808c]">Weighted train impact</dt><dd className="font-semibold text-[#294357]">{plan.impact} min</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[#71808c]">Possession duration</dt><dd className="font-semibold text-[#294357]">{plan.duration} min</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[#71808c]">Productive-span utilization</dt><dd className="font-semibold text-[#294357]">{plan.utilization}%</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[#71808c]">Solver status</dt><dd className="font-semibold text-[#277356]">Feasible</dd></div>
            </dl>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[#183449]">Rejected opportunities</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border border-[#ebc4c1] bg-[#fff7f5] p-3">
              <p className="text-[11px] font-semibold text-[#8e403c]">01:10–02:10 · Too short</p>
              <p className="mt-1 text-[10px] leading-4 text-[#7a5b59]">Cannot fit the 75-minute critical task plus protection.</p>
            </div>
            <div className="rounded-md border border-[#ebc4c1] bg-[#fff7f5] p-3">
              <p className="text-[11px] font-semibold text-[#8e403c]">04:30–05:45 · Higher impact</p>
              <p className="mt-1 text-[10px] leading-4 text-[#7a5b59]">Critical cluster cannot fit; morning passenger sensitivity is higher.</p>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-[#e2e7ea] p-3 text-[10px] leading-4 text-[#71808c]">
          Provenance: synthetic TMS/SMMS/TDMS tasks · COA snapshot 14:24 IST · Division-X rule pack v3.2 · CP-SAT demonstration run RS-0902-1426
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
