const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('drishti_token') : null;
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('drishti_token');
      localStorage.removeItem('drishti_user');
      window.location.href = '/login';
    }
  }

  return response;
}

export const api = {
  // Auth
  login: async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },
  getCurrentUser: async () => {
    const res = await fetchWithAuth('/auth/me');
    return res.json();
  },

  // Datasets
  getDatasets: async () => {
    const res = await fetchWithAuth('/datasets');
    return res.json();
  },
  getDataset: async (id: string) => {
    const res = await fetchWithAuth(`/datasets/${id}`);
    return res.json();
  },
  getDatasetSamples: async (id: string, suspiciousOnly: boolean = false) => {
    const res = await fetchWithAuth(`/datasets/${id}/samples?suspicious_only=${suspiciousOnly}`);
    return res.json();
  },
  analyzeDataset: async (id: string) => {
    const res = await fetchWithAuth(`/datasets/${id}/analyze`, { method: 'POST' });
    return res.json();
  },
  uploadDataset: async (formData: FormData) => {
    const res = await fetchWithAuth('/datasets/upload', {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  // Models
  getModels: async () => {
    const res = await fetchWithAuth('/models');
    return res.json();
  },
  getModel: async (id: string) => {
    const res = await fetchWithAuth(`/models/${id}`);
    return res.json();
  },
  analyzeModel: async (id: string) => {
    const res = await fetchWithAuth(`/models/${id}/analyze`, { method: 'POST' });
    return res.json();
  },
  uploadModel: async (formData: FormData) => {
    const res = await fetchWithAuth('/models/upload', {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  // Inference & Provenance
  getInferences: async () => {
    const res = await fetchWithAuth('/inference');
    return res.json();
  },
  getInference: async (id: string) => {
    const res = await fetchWithAuth(`/inference/${id}`);
    return res.json();
  },
  runInference: async (formData: FormData) => {
    const res = await fetchWithAuth('/inference/run', {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },
  verifyInference: async (id: string) => {
    const res = await fetchWithAuth(`/inference/${id}/verify`, { method: 'POST' });
    return res.json();
  },
  tamperInference: async (id: string) => {
    const res = await fetchWithAuth(`/inference/${id}/tamper`, { method: 'POST' });
    return res.json();
  },
  replayInference: async (id: string) => {
    const res = await fetchWithAuth(`/inference/${id}/replay`, { method: 'POST' });
    return res.json();
  },

  // Distribution Shift
  getShiftRecords: async () => {
    const res = await fetchWithAuth('/shift');
    return res.json();
  },
  runShiftAnalysis: async (baselineId: string, targetId: string) => {
    const res = await fetchWithAuth('/shift/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseline_id: baselineId, target_id: targetId }),
    });
    return res.json();
  },

  // Evidence
  getEvidence: async (severity?: string, assetId?: string) => {
    let url = '/evidence';
    const params = new URLSearchParams();
    if (severity) params.set('severity', severity);
    if (assetId) params.set('asset_id', assetId);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetchWithAuth(url);
    return res.json();
  },

  // Analyst Governance / Dispositions
  acceptAsset: async (id: string, reason: string, notes?: string) => {
    const res = await fetchWithAuth(`/assets/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACCEPTED', reason, analyst_notes: notes }),
    });
    return res.json();
  },
  reviewAsset: async (id: string, reason: string, notes?: string) => {
    const res = await fetchWithAuth(`/assets/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REVIEW', reason, analyst_notes: notes }),
    });
    return res.json();
  },
  quarantineAsset: async (id: string, reason: string, notes?: string) => {
    const res = await fetchWithAuth(`/assets/${id}/quarantine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'QUARANTINED', reason, analyst_notes: notes }),
    });
    return res.json();
  },

  // Audit
  getAuditEvents: async () => {
    const res = await fetchWithAuth('/audit');
    return res.json();
  },
  verifyAuditChain: async () => {
    const res = await fetchWithAuth('/audit/verify', { method: 'POST' });
    return res.json();
  },
  tamperAuditTest: async () => {
    const res = await fetchWithAuth('/audit/tamper-test', { method: 'POST' });
    return res.json();
  },

  // Reports
  getReports: async () => {
    const res = await fetchWithAuth('/reports');
    return res.json();
  },
  getReport: async (id: string) => {
    const res = await fetchWithAuth(`/reports/${id}`);
    return res.json();
  },
  generateReport: async (assetId: string, assetType: string, notes?: string, finalDisposition?: string) => {
    const res = await fetchWithAuth('/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asset_id: assetId,
        asset_type: assetType,
        analyst_notes: notes,
        final_disposition: finalDisposition,
      }),
    });
    return res.json();
  },
  verifyReportHash: async (id: string) => {
    const res = await fetchWithAuth(`/reports/${id}/verify-hash`, { method: 'POST' });
    return res.json();
  },

  // Demo & Guided Scenarios
  seedDemo: async () => {
    const res = await fetchWithAuth('/demo/seed', { method: 'POST' });
    return res.json();
  },
  getScenarios: async () => {
    const res = await fetchWithAuth('/demo/scenarios');
    return res.json();
  },
  runScenario: async (scenarioId: string) => {
    const res = await fetchWithAuth(`/demo/scenarios/${scenarioId}/run`, { method: 'POST' });
    return res.json();
  },
};

