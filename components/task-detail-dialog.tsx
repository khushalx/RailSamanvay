'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/status-badge';
import { formatTimestamp } from '@/lib/format';
import type { Task } from '@/lib/rail-data';

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        {task ? (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <span className="font-mono text-xs font-semibold text-[#0b737a]">{task.id}</span>
                <StatusBadge status={task.quarantined ? 'Quarantined' : task.mandatory ? 'Mandatory' : task.due} />
              </div>
              <DialogTitle className="text-lg">{task.title}</DialogTitle>
              <DialogDescription>
                {task.department} · {task.asset} · {task.worksite}
              </DialogDescription>
            </DialogHeader>

            {task.quarantined ? (
              <div className="rounded-md border border-[#e8b8b5] bg-[#fff5f4] p-3 text-sm text-[#8e403c]">
                Excluded from planning: {task.quarantineReason}
              </div>
            ) : null}

            <section aria-labelledby="priority-heading" className="rounded-lg border border-[#d8e0e4] p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 id="priority-heading" className="text-sm font-semibold text-[#163247]">Priority breakdown</h2>
                  <p className="mt-1 text-xs text-[#637483]">Transparent fixture score; mandatory status is a separate hard override.</p>
                </div>
                <span className="text-2xl font-semibold text-[#102a40]">{task.priority}</span>
              </div>
              <Progress value={task.priority} className="mt-3" aria-label={`Priority score ${task.priority} out of 100`} />
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {task.factors.map((factor) => (
                  <div key={factor.label} className="rounded-md bg-[#f5f7f8] p-2.5">
                    <p className="text-xs text-[#637483]">{factor.label}</p>
                    <p className="mt-0.5 font-semibold text-[#163247]">+{factor.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Duration" value={`${task.prescribedMinutes} min prescribed · P50 ${task.p50Minutes} · P90 ${task.p90Minutes}`} />
              <Detail label="Protection allowance" value={`${task.setupMinutes} min setup · ${task.restorationMinutes} min restoration`} />
              <Detail label="Block need" value={task.blockNeed} />
              <Detail label="Isolation" value={task.isolationNeed} />
              <Detail label="Resource readiness" value={task.resources} />
              <Detail label="Dependency" value={task.dependency} />
            </div>
            <Detail label="Compatibility" value={task.compatibility} />

            <div className="flex flex-wrap justify-between gap-2 border-t border-[#e2e7ea] pt-3 text-xs text-[#637483]">
              <span>{task.source} provenance · {formatTimestamp(task.sourceUpdatedAt)} IST</span>
              <span>{task.confidence}% duration confidence</span>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#f6f8f9] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#637483]">{label}</p>
      <p className="mt-1 text-sm leading-5 text-[#1f3b4d]">{value}</p>
    </div>
  );
}

