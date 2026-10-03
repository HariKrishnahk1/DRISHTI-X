import React from 'react';
import { ArrowRight, Database, Cpu, Fingerprint, TrendingDown, ShieldAlert, UserCheck, FileCheck2, History } from 'lucide-react';

const STEPS = [
  { label: 'SOURCE', desc: 'Multi-Contributor', icon: Database },
  { label: 'DATASET', desc: 'Integrity Scan', icon: Database },
  { label: 'MODEL', desc: 'Fingerprinting', icon: Cpu },
  { label: 'INFERENCE', desc: 'Ed25519 Provenance', icon: Fingerprint },
  { label: 'SHIFT', desc: 'Operational Drift', icon: TrendingDown },
  { label: 'ASSURANCE', desc: 'Risk Engine', icon: ShieldAlert },
  { label: 'ANALYST', desc: 'Governance', icon: UserCheck },
  { label: 'REPORT', desc: 'SHA-256 Digest', icon: FileCheck2 },
  { label: 'AUDIT', desc: 'Linked Chain', icon: History },
];

export default function WorkflowBar({ activeStep }: { activeStep?: string }) {
  return (
    <div className="bg-[#0b1021] border border-slate-800 rounded-lg p-3 overflow-x-auto mb-6">
      <div className="flex items-center justify-between min-w-[760px] text-xs">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeStep?.toUpperCase() === step.label;
          return (
            <React.Fragment key={step.label}>
              <div className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded transition whitespace-nowrap ${
                isActive ? 'bg-cyan-950/80 border border-cyan-700 text-cyan-300' : 'text-slate-400'
              }`}>
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="font-mono font-bold tracking-wider">{step.label}</span>
                <span className="text-[10px] text-slate-500 font-normal">({step.desc})</span>
              </div>
              {idx < STEPS.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-700 shrink-0 mx-1" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
