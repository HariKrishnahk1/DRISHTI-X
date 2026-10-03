export type UserRole = 'DEFENCE' | 'ANALYST' | 'VENDOR' | 'CONTRIBUTOR' | 'AUDITOR';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  organization: string;
  is_active: boolean;
  created_at: string;
}

export interface Dataset {
  id: string;
  name: string;
  contributor_name: string;
  version: string;
  format: string;
  num_images: number;
  num_labels: number;
  dataset_hash: string;
  status: 'PENDING' | 'ANALYZED' | 'ACCEPTED' | 'REVIEW' | 'QUARANTINED';
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  analysis_summary?: string;
  created_at: string;
  analyzed_at?: string;
}

export interface DatasetSample {
  id: string;
  dataset_id: string;
  filename: string;
  file_path: string;
  file_hash: string;
  label?: string;
  split: string;
  is_suspicious: boolean;
  anomaly_type: 'CLEAN' | 'TRIGGER_CANDIDATE' | 'LABEL_ANOMALY' | 'NEAR_DUPLICATE' | 'OOD_ANOMALY';
  suspicion_score: number;
  similarity_group?: string;
  metadata_json?: string;
  created_at: string;
}

export interface MLModel {
  id: string;
  name: string;
  version: string;
  format: string;
  model_hash: string;
  expected_hash?: string;
  file_size_bytes: number;
  architecture?: string;
  input_shape: string;
  access_level: 'WHITE_BOX' | 'BLACK_BOX';
  status: 'REGISTERED' | 'ANALYZED' | 'ACCEPTED' | 'REVIEW' | 'QUARANTINED';
  is_substituted: boolean;
  substitution_details?: string;
  fingerprint_deviation: number;
  trigger_search_results?: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  contributor_name: string;
  created_at: string;
  analyzed_at?: string;
}

export interface InferenceRecord {
  id: string;
  model_id: string;
  model_name: string;
  model_hash: string;
  input_image_path: string;
  input_hash: string;
  preprocessing_config: string;
  config_hash: string;
  output_data: string;
  output_hash: string;
  timestamp: string;
  nonce: string;
  sequence_number: number;
  signature: string;
  signature_algorithm: string;
  public_key_id: string;
  is_verified: boolean;
  verification_status: 'VERIFIED' | 'INTEGRITY_FAILURE' | 'REPLAY_DETECTED';
  verification_details?: string;
  is_replayed: boolean;
  created_at: string;
}

export interface DistributionShiftRecord {
  id: string;
  baseline_id: string;
  baseline_name: string;
  target_id: string;
  target_name: string;
  shift_score: number;
  shift_classification: 'OPERATIONAL_DRIFT' | 'SUSPICIOUS_MANIPULATION_INDICATOR';
  sensor_variance: number;
  illumination_shift: number;
  feature_divergence: number;
  confidence: number;
  affected_samples?: string;
  explanation: string;
  method: string;
  limitations?: string;
  created_at: string;
}

export interface EvidenceItem {
  id: string;
  asset_id: string;
  asset_type: string;
  evidence_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  detection_method: string;
  description: string;
  observed_value?: string;
  expected_value?: string;
  limitations?: string;
  recommended_action?: string;
  related_samples?: string;
  related_model?: string;
  related_inference?: string;
  created_at: string;
}

export interface AuditEvent {
  id: number;
  event_id: string;
  timestamp: string;
  timestamp_str: string;
  actor: string;
  role: string;
  action: string;
  asset_id?: string;
  details_json?: string;
  previous_event_hash: string;
  current_event_hash: string;
}

export interface AssuranceReport {
  id: string;
  report_hash: string;
  asset_id: string;
  asset_type: string;
  asset_name: string;
  overall_risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  recommended_disposition: 'ACCEPT' | 'REVIEW' | 'QUARANTINE';
  final_disposition: 'ACCEPT' | 'REVIEW' | 'QUARANTINE';
  analyst_id?: string;
  analyst_name: string;
  analyst_notes?: string;
  contributing_evidence_count: number;
  coverage_matrix?: string;
  unsupported_checks?: string;
  limitations?: string;
  full_report_data: string;
  created_at: string;
}
