import React from 'react';

interface RiskBadgeProps {
  score?: number;
  level?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function RiskBadge({ score, level = 'LOW', size = 'md' }: RiskBadgeProps) {
  const normLevel = level.toUpperCase();
  
  let colorStyles = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
  let dotColor = 'bg-emerald-400';

  if (normLevel === 'CRITICAL') {
    colorStyles = 'bg-rose-950/80 text-rose-300 border-rose-700 animate-pulse';
    dotColor = 'bg-rose-400';
  } else if (normLevel === 'HIGH') {
    colorStyles = 'bg-orange-950/70 text-orange-300 border-orange-700';
    dotColor = 'bg-orange-400';
  } else if (normLevel === 'MEDIUM') {
    colorStyles = 'bg-amber-950/60 text-amber-300 border-amber-700';
    dotColor = 'bg-amber-400';
  }

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 space-x-1.5',
    lg: 'text-sm px-3.5 py-1.5 space-x-2 font-semibold',
  }[size];

  return (
    <span className={`inline-flex items-center rounded border font-mono tracking-wider uppercase ${colorStyles} ${sizeStyles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{normLevel}</span>
      {score !== undefined && (
        <span className="opacity-90 font-bold ml-1">({score})</span>
      )}
    </span>
  );
}
