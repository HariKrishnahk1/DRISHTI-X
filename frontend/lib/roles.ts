export type UserRole = 'DEFENCE' | 'ANALYST' | 'VENDOR' | 'CONTRIBUTOR' | 'AUDITOR';

export interface RoleConfig {
  role: UserRole;
  title: string;
  badge: string;
  clearanceLevel: string;
  unit: string;
  theme: {
    accent: string;
    border: string;
    bg: string;
    pillBg: string;
    pillBorder: string;
    pillText: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
  };
  allowedNav: string[];
  banner: {
    title: string;
    tag: string;
    description: string;
    primaryActionLabel: string;
    primaryActionHref: string;
  };
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  DEFENCE: {
    role: 'DEFENCE',
    title: 'Defence Commander',
    badge: 'COMMAND CLEARANCE',
    clearanceLevel: 'LEVEL 5 // STRATEGIC COMMAND',
    unit: 'Indian Army / DGIS HQ',
    theme: {
      accent: 'text-amber-400',
      border: 'border-amber-500/50',
      bg: 'bg-amber-950/40',
      pillBg: 'bg-gradient-to-r from-amber-950/80 to-[#1a1405]',
      pillBorder: 'border-amber-500/60',
      pillText: 'text-amber-300',
      badgeBg: 'bg-amber-950/80',
      badgeBorder: 'border-amber-600',
      badgeText: 'text-amber-300',
    },
    allowedNav: [
      '/dashboard',
      '/datasets',
      '/models',
      '/inference',
      '/shift-analysis',
      '/evidence',
      '/audit',
      '/reports',
      '/settings'
    ],
    banner: {
      title: 'COMMAND POST // STRATEGIC READINESS',
      tag: 'LEVEL 5 AUTHORIZATION',
      description: 'Strategic oversight across all military AI vision pipelines, operational quarantine approval, and model mission clearance.',
      primaryActionLabel: 'REVIEW QUARANTINES',
      primaryActionHref: '/evidence'
    }
  },
  ANALYST: {
    role: 'ANALYST',
    title: 'Lead Assurance Analyst',
    badge: 'ANALYST CLEARANCE',
    clearanceLevel: 'LEVEL 4 // FORENSIC ASSURANCE',
    unit: 'Defence AI Assurance Wing',
    theme: {
      accent: 'text-cyan-400',
      border: 'border-cyan-500/50',
      bg: 'bg-cyan-950/40',
      pillBg: 'bg-gradient-to-r from-cyan-950/80 to-[#041924]',
      pillBorder: 'border-cyan-500/60',
      pillText: 'text-cyan-300',
      badgeBg: 'bg-cyan-950/80',
      badgeBorder: 'border-cyan-600',
      badgeText: 'text-cyan-300',
    },
    allowedNav: [
      '/dashboard',
      '/datasets',
      '/models',
      '/inference',
      '/shift-analysis',
      '/evidence',
      '/reports'
    ],
    banner: {
      title: 'ASSURANCE FORENSICS WORKBENCH',
      tag: 'TROJAN & SHIFT LAB',
      description: 'Deep neural Trojan trigger detection, feature-attribution forensics, distribution shift scanners, and synthetic test battery evaluation.',
      primaryActionLabel: 'DISTRIBUTION SHIFT FORENSICS',
      primaryActionHref: '/shift-analysis'
    }
  },
  VENDOR: {
    role: 'VENDOR',
    title: 'Defence AI Vendor',
    badge: 'VENDOR CLEARANCE',
    clearanceLevel: 'LEVEL 2 // CERTIFIED SUPPLIER',
    unit: 'Bharat Defence Systems Ltd',
    theme: {
      accent: 'text-purple-400',
      border: 'border-purple-500/50',
      bg: 'bg-purple-950/40',
      pillBg: 'bg-gradient-to-r from-purple-950/80 to-[#140824]',
      pillBorder: 'border-purple-500/60',
      pillText: 'text-purple-300',
      badgeBg: 'bg-purple-950/80',
      badgeBorder: 'border-purple-600',
      badgeText: 'text-purple-300',
    },
    allowedNav: [
      '/dashboard',
      '/models',
      '/datasets',
      '/reports'
    ],
    banner: {
      title: 'VENDOR SUBMISSION & ATTESTATION PORTAL',
      tag: 'MODEL VERIFICATION GATE',
      description: 'Upload certified ONNX/PyTorch model weights, generate cryptographic SHA-256 fingerprints, and review automated defence test certificates.',
      primaryActionLabel: 'SUBMIT MODEL FOR ATTESTATION',
      primaryActionHref: '/models'
    }
  },
  CONTRIBUTOR: {
    role: 'CONTRIBUTOR',
    title: 'Field Recon Operator',
    badge: 'TACTICAL CLEARANCE',
    clearanceLevel: 'LEVEL 2 // RECON TELEMETRY',
    unit: 'Northern Command Recon Unit',
    theme: {
      accent: 'text-emerald-400',
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-950/40',
      pillBg: 'bg-gradient-to-r from-emerald-950/80 to-[#041c10]',
      pillBorder: 'border-emerald-500/60',
      pillText: 'text-emerald-300',
      badgeBg: 'bg-emerald-950/80',
      badgeBorder: 'border-emerald-600',
      badgeText: 'text-emerald-300',
    },
    allowedNav: [
      '/dashboard',
      '/datasets',
      '/inference',
      '/reports'
    ],
    banner: {
      title: 'FIELD RECON DATASET INGESTION TERMINAL',
      tag: 'TACTICAL INGESTION',
      description: 'Ingest raw multi-sensor battlefield surveillance feeds, detect label anomalies, and verify cryptographic data integrity signatures.',
      primaryActionLabel: 'INGEST BATTLEFIELD DATASET',
      primaryActionHref: '/datasets'
    }
  },
  AUDITOR: {
    role: 'AUDITOR',
    title: 'External Defence Auditor',
    badge: 'CAG AUDIT CLEARANCE',
    clearanceLevel: 'LEVEL 3 // COMPLIANCE & CAG',
    unit: 'Defence Audit Directorate / CAG',
    theme: {
      accent: 'text-yellow-400',
      border: 'border-yellow-500/50',
      bg: 'bg-yellow-950/40',
      pillBg: 'bg-gradient-to-r from-yellow-950/80 to-[#221804]',
      pillBorder: 'border-yellow-500/60',
      pillText: 'text-yellow-300',
      badgeBg: 'bg-yellow-950/80',
      badgeBorder: 'border-yellow-600',
      badgeText: 'text-yellow-300',
    },
    allowedNav: [
      '/dashboard',
      '/audit',
      '/evidence',
      '/reports',
      '/settings'
    ],
    banner: {
      title: 'CAG COMPLIANCE & IMMUTABLE AUDIT CONSOLE',
      tag: 'TAMPER-PROOF LEDGER',
      description: 'Validate Merkle roots, inspect cryptographic SHA-256 block chains, verify non-repudiation certificates, and export statutory compliance reports.',
      primaryActionLabel: 'VERIFY CRYPTOGRAPHIC LEDGER',
      primaryActionHref: '/audit'
    }
  }
};

export function getRoleConfig(roleName?: string): RoleConfig {
  const roleKey = (roleName?.toUpperCase() as UserRole) || 'DEFENCE';
  return ROLE_CONFIGS[roleKey] || ROLE_CONFIGS.DEFENCE;
}
