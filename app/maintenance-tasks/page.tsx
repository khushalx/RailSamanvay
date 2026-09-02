'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Plus, Search, ShieldCheck } from 'lucide-react';

import { PageHeading } from '@/components/page-heading';
import { RailShell } from '@/components/rail-shell';
import { StatusBadge } from '@/components/status-badge';
import { TaskDetailDialog } from '@/components/task-detail-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
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

type TaskStatusFilter = 'all' | 'ready' | 'mandatory' | 'overdue' | 'quarantined';

export default function MaintenanceTasksPage() {
  const { state, addTask } = usePrototype();
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState<'all' | Department>('all');
  const [status, setStatus] = useState<TaskStatusFilter>('all');
  const [taskDetail, setTaskDetail] = useState<Task | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [newDepartment, setNewDepartment] = useState<Department>('Engineering');
  const [priority, setPriority] = useState(60);
  const [mandatory, setMandatory] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return state.tasks.filter((task) => {
      const matchesQuery =
        !normalizedQuery ||
        `${task.id} ${task.title} ${task.asset} ${task.worksite}`.toLowerCase().includes(normalizedQuery);
      const matchesDepartment = department === 'all' || task.department === department;
      const matchesStatus =
        status === 'all' ||
        (status === 'ready' && !task.quarantined) ||
        (status === 'mandatory' && task.mandatory) ||
        (status === 'overdue' && task.overdueDays > 0) ||
        (status === 'quarantined' && task.quarantined);
      return matchesQuery && matchesDepartment && matchesStatus;
    });
  }, [department, query, state.tasks, status]);

  function createTask() {
    if (!title.trim()) {
      setFormError('Enter a task title.');
      return;
    }
    if (priority < 1 || priority > 100) {
      setFormError('Priority must be between 1 and 100.');
      return;
    }
    const id = addTask({ department: newDepartment, title, priority, mandatory });
    setAddOpen(false);
    setTitle('');
    setPriority(60);
    setMandatory(false);
    setFormError('');
    setNotice(`${id} added to the synthetic task register. Weekly recommendations now require regeneration.`);
  }

  return (
    <RailShell>
      <PageHeading
        eyebrow="Cross-department register"
        title="Maintenance Tasks"
        description="Review normalized Engineering, Signal & Telecom and Electrical — TRD work before it enters block planning."
        action={<Button onClick={() => setAddOpen(true)}><Plus />Add demo task</Button>}
      />

      {notice ? <output aria-live="polite" className="mb-4 block rounded-md border border-[#cfe1e2] bg-[#f0f8f8] px-4 py-3 text-sm text-[#075f69]">{notice}</output> : null}

      <Card className="mb-4 gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_220px_180px]">
          <div className="space-y-1.5">
            <Label htmlFor="task-search">Search tasks</Label>
            <div className="relative"><Search className="pointer-events-none absolute top-2 left-2.5 size-4 text-[#637483]" /><Input id="task-search" className="pl-8" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID, asset or worksite" /></div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="department-filter">Department</Label>
            <NativeSelect id="department-filter" className="w-full" value={department} onChange={(event) => setDepartment(event.target.value as 'all' | Department)}>
              <NativeSelectOption value="all">All departments</NativeSelectOption>
              <NativeSelectOption value="Engineering">Engineering</NativeSelectOption>
              <NativeSelectOption value="Signal & Telecom">Signal & Telecom</NativeSelectOption>
              <NativeSelectOption value="Electrical — TRD">Electrical — TRD</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status-filter">Status</Label>
            <NativeSelect id="status-filter" className="w-full" value={status} onChange={(event) => setStatus(event.target.value as TaskStatusFilter)}>
              <NativeSelectOption value="all">All statuses</NativeSelectOption>
              <NativeSelectOption value="ready">Planning-ready</NativeSelectOption>
              <NativeSelectOption value="mandatory">Mandatory</NativeSelectOption>
              <NativeSelectOption value="overdue">Overdue</NativeSelectOption>
              <NativeSelectOption value="quarantined">Quarantined</NativeSelectOption>
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#344b5d]">{filteredTasks.length} of {state.tasks.length} tasks</p>
        <p className="flex items-center gap-2 text-xs text-[#637483]"><ShieldCheck className="size-4 text-[#0b737a]" />Mandatory override and provenance preserved</p>
      </div>

      {filteredTasks.length ? (
        <Card className="gap-0 rounded-lg py-0 shadow-none ring-[#d8e0e4]">
          <CardHeader className="hidden border-b border-[#e4e9eb] px-5 py-3 md:grid md:grid-cols-[110px_minmax(260px,1.4fr)_minmax(190px,1fr)_90px_120px_80px] md:gap-4">
            {['Task', 'Work item', 'Department', 'P90', 'Status', 'Priority'].map((label) => <span key={label} className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#637483]">{label}</span>)}
          </CardHeader>
          <CardContent className="divide-y divide-[#e4e9eb] px-0 py-0">
            {filteredTasks.map((task) => (
              <button key={task.id} type="button" onClick={() => setTaskDetail(task)} className="grid w-full gap-2 px-5 py-4 text-left transition-colors hover:bg-[#f7f9fa] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[#0b737a]/25 md:grid-cols-[110px_minmax(260px,1.4fr)_minmax(190px,1fr)_90px_120px_80px] md:items-center md:gap-4">
                <span className="font-mono text-xs font-semibold text-[#0b737a]">{task.id}</span>
                <span><span className="block text-sm font-medium text-[#163247]">{task.title}</span><span className="mt-0.5 block text-xs text-[#637483]">{task.asset} · {task.worksite}</span></span>
                <span className="text-xs text-[#526675]">{task.department}</span>
                <span className="text-xs tabular-nums text-[#526675]">{task.p90Minutes} min</span>
                <span><StatusBadge status={task.quarantined ? 'Quarantined' : task.mandatory ? 'Mandatory' : task.overdueDays ? 'Overdue' : 'Ready'} /></span>
                <span className="text-right text-lg font-semibold tabular-nums text-[#163247] md:text-left">{task.priority}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-lg py-12 text-center shadow-none ring-[#d8e0e4]"><CardContent><Search className="mx-auto size-6 text-[#0b737a]" /><h2 className="mt-3 font-semibold text-[#163247]">No matching tasks</h2><p className="mt-1 text-sm text-[#637483]">Clear or change the filters to restore the register.</p><Button variant="outline" className="mt-4" onClick={() => { setQuery(''); setDepartment('all'); setStatus('all'); }}>Clear filters</Button></CardContent></Card>
      )}

      <div className="mt-4 flex items-start gap-3 rounded-md border border-[#e8c8c5] bg-[#fff7f5] p-4 text-sm leading-6 text-[#704e4c]">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#b4443f]" />
        <p><strong>Quarantine is fail-safe.</strong> A task with missing canonical worksite, duration or protection fields remains visible for correction but cannot enter a recommendation.</p>
      </div>

      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) setFormError(''); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a synthetic maintenance task</DialogTitle>
            <DialogDescription>This creates a device-local demo record and an audit event. No Railway source is updated.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="new-task-title">Task title</Label><Input id="new-task-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. turnout geometry check" aria-invalid={Boolean(formError && !title.trim())} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="new-task-department">Department</Label><NativeSelect id="new-task-department" className="w-full" value={newDepartment} onChange={(event) => setNewDepartment(event.target.value as Department)}><NativeSelectOption value="Engineering">Engineering</NativeSelectOption><NativeSelectOption value="Signal & Telecom">Signal & Telecom</NativeSelectOption><NativeSelectOption value="Electrical — TRD">Electrical — TRD</NativeSelectOption></NativeSelect></div>
              <div className="space-y-1.5"><Label htmlFor="new-task-priority">Priority score</Label><Input id="new-task-priority" type="number" min={1} max={100} value={priority} onChange={(event) => setPriority(Number(event.target.value))} /></div>
            </div>
            <Label className="rounded-md border border-[#d8e0e4] p-3"><Checkbox checked={mandatory} onCheckedChange={(checked) => setMandatory(Boolean(checked))} />Mandatory safety override</Label>
            {formError ? <p role="alert" className="text-sm text-[#9d403d]">{formError}</p> : null}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={createTask}><Plus />Add task</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <TaskDetailDialog task={taskDetail} open={Boolean(taskDetail)} onOpenChange={(open) => { if (!open) setTaskDetail(null); }} />
    </RailShell>
  );
}
