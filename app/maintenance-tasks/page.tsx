'use client';

import { useMemo, useState, type SyntheticEvent } from 'react';
import { AlertTriangle, ChevronRight, Plus, Search } from 'lucide-react';

import { PageHeading } from '@/components/page-heading';
import { RailShell } from '@/components/rail-shell';
import { StatusBadge } from '@/components/status-badge';
import { TaskDetailDialog } from '@/components/task-detail-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { usePrototype } from '@/components/prototype-provider';
import type { Department, Task } from '@/lib/rail-data';

type TaskStatusFilter = 'all' | 'eligible' | 'mandatory' | 'overdue' | 'quarantined';

export default function MaintenanceTasksPage() {
  const { state, addTask } = usePrototype();
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState<'all' | Department>('all');
  const [status, setStatus] = useState<TaskStatusFilter>('all');
  const [taskDetail, setTaskDetail] = useState<Task | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [newDepartment, setNewDepartment] = useState<Department>('Engineering');
  const [priority, setPriority] = useState('60');
  const [mandatory, setMandatory] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const overdueCount = state.tasks.filter((task) => task.overdueDays > 0).length;
  const quarantineCount = state.tasks.filter((task) => task.quarantined).length;
  const mandatoryCount = state.tasks.filter((task) => task.mandatory && !task.quarantined).length;

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return state.tasks.filter((task) => {
      const matchesQuery =
        !normalizedQuery ||
        `${task.id} ${task.title} ${task.asset} ${task.worksite}`.toLowerCase().includes(normalizedQuery);
      const matchesDepartment = department === 'all' || task.department === department;
      const matchesStatus =
        status === 'all' ||
        (status === 'eligible' && !task.quarantined) ||
        (status === 'mandatory' && task.mandatory) ||
        (status === 'overdue' && task.overdueDays > 0) ||
        (status === 'quarantined' && task.quarantined);
      return matchesQuery && matchesDepartment && matchesStatus;
    });
  }, [department, query, state.tasks, status]);

  function resetForm() {
    setTitle('');
    setNewDepartment('Engineering');
    setPriority('60');
    setMandatory(false);
    setFormError('');
  }

  function createTask(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericPriority = Number(priority);
    if (!title.trim()) {
      setFormError('Enter a task title.');
      return;
    }
    if (!priority.trim() || !Number.isInteger(numericPriority) || numericPriority < 1 || numericPriority > 100) {
      setFormError('Enter a whole-number priority from 1 to 100.');
      return;
    }
    const id = addTask({ department: newDepartment, title, priority: numericPriority, mandatory });
    setAddOpen(false);
    resetForm();
    setNotice(`${id} was added and quarantined until its planning fields are confirmed.`);
  }

  return (
    <RailShell>
      <PageHeading
        eyebrow="Cross-department register"
        title="Maintenance Tasks"
        description="Review normalized Engineering, Signal & Telecom and Electrical — TRD work before planning."
        action={<Button variant="outline" className="h-11 bg-white px-4" onClick={() => setAddOpen(true)}><Plus />Add demo task</Button>}
      />

      {notice ? <output aria-live="polite" className="mb-4 block rounded-xl border border-[#cfe1e2] bg-[#f0f8f8] px-4 py-3 text-sm text-[#075f69]">{notice}</output> : null}

      <Card className="mb-5 gap-0 rounded-xl py-0 shadow-none ring-[#d8e0e4]">
        <CardContent className="grid grid-cols-2 gap-0 p-0 md:grid-cols-4">
          <Summary label="All tasks" value={state.tasks.length} />
          <Summary label="Mandatory" value={mandatoryCount} />
          <Summary label="Overdue" value={overdueCount} warning={overdueCount > 0} />
          <Summary label="Quarantined" value={quarantineCount} warning={quarantineCount > 0} />
        </CardContent>
      </Card>

      <Card className="mb-4 gap-0 rounded-xl py-0 shadow-none ring-[#d8e0e4]">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_220px_210px]">
          <div className="space-y-1.5">
            <Label htmlFor="task-search">Search</Label>
            <div className="relative"><Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-[#657682]" /><Input id="task-search" className="h-11 pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Task, asset or worksite" /></div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="department-filter">Department</Label>
            <NativeSelect id="department-filter" className="w-full [&_select]:h-11" value={department} onChange={(event) => setDepartment(event.target.value as 'all' | Department)}>
              <NativeSelectOption value="all">All departments</NativeSelectOption>
              <NativeSelectOption value="Engineering">Engineering</NativeSelectOption>
              <NativeSelectOption value="Signal & Telecom">Signal & Telecom</NativeSelectOption>
              <NativeSelectOption value="Electrical — TRD">Electrical — TRD</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status-filter">Show</Label>
            <NativeSelect id="status-filter" className="w-full [&_select]:h-11" value={status} onChange={(event) => setStatus(event.target.value as TaskStatusFilter)}>
              <NativeSelectOption value="all">All tasks</NativeSelectOption>
              <NativeSelectOption value="eligible">Eligible (not quarantined)</NativeSelectOption>
              <NativeSelectOption value="mandatory">Mandatory</NativeSelectOption>
              <NativeSelectOption value="overdue">Overdue</NativeSelectOption>
              <NativeSelectOption value="quarantined">Quarantined</NativeSelectOption>
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#344b5d]">{filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}</p>
        {quarantineCount ? <p className="flex items-center gap-2 text-xs text-[#7c4b48]"><AlertTriangle className="size-4" />Quarantined records stay out of recommendations</p> : null}
      </div>

      {filteredTasks.length ? (
        <Card className="gap-0 rounded-xl py-0 shadow-none ring-[#d8e0e4]">
          <div className="hidden grid-cols-[88px_minmax(240px,1.4fr)_minmax(150px,0.8fr)_110px_90px_24px] gap-4 border-b border-[#e4e9eb] px-5 py-3 lg:grid">
            {['Task', 'Work item', 'Department', 'Status', 'Priority', ''].map((label) => <span key={label} className="text-xs font-semibold uppercase tracking-[0.08em] text-[#657682]">{label}</span>)}
          </div>
          <CardContent className="divide-y divide-[#e4e9eb] px-0 py-0">
            {filteredTasks.map((task) => (
              <button key={task.id} type="button" onClick={() => setTaskDetail(task)} className="grid min-h-24 w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-[#f7f9fa] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[#0b737a]/25 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:grid-cols-[88px_minmax(240px,1.4fr)_minmax(150px,0.8fr)_110px_90px_24px] lg:gap-4">
                <span className="font-mono text-xs font-semibold text-[#0b737a]">{task.id}</span>
                <span><span className="block text-sm font-semibold text-[#163247]">{task.title}</span><span className="mt-1 block text-xs leading-5 text-[#657682]">{task.asset} · {task.worksite}</span></span>
                <span className="text-sm text-[#526675]"><span className="mr-1 text-xs font-medium text-[#657682] lg:hidden">Department:</span>{task.department}</span>
                <span><StatusBadge status={task.quarantined ? 'Quarantined' : task.mandatory ? 'Mandatory' : task.overdueDays ? 'Overdue' : 'Ready'} /></span>
                <span className="text-sm font-semibold tabular-nums text-[#163247]"><span className="mr-1 text-xs font-medium text-[#657682] lg:hidden">Priority:</span>{task.priority}</span>
                <ChevronRight className="size-5 text-[#0b737a]" aria-hidden="true" />
              </button>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl py-12 text-center shadow-none ring-[#d8e0e4]"><CardContent><Search className="mx-auto size-7 text-[#0b737a]" /><h2 className="mt-3 text-lg font-semibold text-[#163247]">No matching tasks</h2><p className="mt-1 text-sm text-[#657682]">Clear the filters to restore the register.</p><Button variant="outline" className="mt-4 h-11" onClick={() => { setQuery(''); setDepartment('all'); setStatus('all'); }}>Clear filters</Button></CardContent></Card>
      )}

      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={createTask}>
            <DialogHeader>
              <DialogTitle>Add a synthetic maintenance task</DialogTitle>
              <DialogDescription>The record stays quarantined until its worksite, protection and resources are confirmed. No Railway source is updated.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5"><Label htmlFor="new-task-title">Task title</Label><Input id="new-task-title" className="h-11" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Turnout geometry check" aria-invalid={Boolean(formError && !title.trim())} aria-describedby={formError ? 'new-task-error' : undefined} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="new-task-department">Department</Label><NativeSelect id="new-task-department" className="w-full [&_select]:h-11" value={newDepartment} onChange={(event) => setNewDepartment(event.target.value as Department)}><NativeSelectOption value="Engineering">Engineering</NativeSelectOption><NativeSelectOption value="Signal & Telecom">Signal & Telecom</NativeSelectOption><NativeSelectOption value="Electrical — TRD">Electrical — TRD</NativeSelectOption></NativeSelect></div>
                <div className="space-y-1.5"><Label htmlFor="new-task-priority">Priority score</Label><Input id="new-task-priority" className="h-11" type="number" min={1} max={100} value={priority} onChange={(event) => setPriority(event.target.value)} aria-describedby={formError ? 'new-task-error' : undefined} /></div>
              </div>
              <Label className="flex min-h-11 items-center gap-3 rounded-lg border border-[#d8e0e4] p-3"><Checkbox checked={mandatory} onCheckedChange={(checked) => setMandatory(Boolean(checked))} />Mandatory safety override</Label>
              {formError ? <p id="new-task-error" role="alert" className="text-sm text-[#9d403d]">{formError}</p> : null}
            </div>
            <DialogFooter className="mt-4">
              <DialogClose render={<Button type="button" variant="outline" className="h-11" />}>Cancel</DialogClose>
              <Button type="submit" className="h-11 bg-[#0b6871] text-white hover:bg-[#075860]"><Plus />Add task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TaskDetailDialog task={taskDetail} open={Boolean(taskDetail)} onOpenChange={(open) => { if (!open) setTaskDetail(null); }} />
    </RailShell>
  );
}

function Summary({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) {
  return <div className="border-b border-r border-[#e4e9eb] p-4 last:border-r-0 md:border-b-0"><p className="text-xs font-medium text-[#657682]">{label}</p><p className={warning ? 'mt-1 text-2xl font-semibold tabular-nums text-[#9d403d]' : 'mt-1 text-2xl font-semibold tabular-nums text-[#163247]'}>{value}</p></div>;
}
