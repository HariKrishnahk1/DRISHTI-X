import React from 'react';

interface DispositionBadgeProps {
  status: string;
}

export default function DispositionBadge({ status }: DispositionBadgeProps) {
  const s = (status || 'PENDING').toUpperCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (s === 'ACCEPT' || s === 'ACCEPTED') {
    styles = 'bg-emerald-950/70 text-emerald-300 border-emerald-700';
  } else if (s === 'REVIEW') {
    styles = 'bg-amber-950/70 text-amber-300 border-amber-700';
  } else if (s === 'QUARANTINE' || s === 'QUARANTINED') {
    styles = 'bg-rose-950/80 text-rose-300 border-rose-700 font-bold';
  } else if (s === 'ANALYZED') {
    styles = 'bg-cyan-950/70 text-cyan-300 border-cyan-700';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-mono tracking-wider uppercase border ${styles}`}>
      {s}
    </span>
  );
}
