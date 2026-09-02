import type { ReactNode } from 'react';

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0b737a]">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-[#102a40] sm:text-[28px]">
          {title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[#526675]">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
