// Type definitions only. Excluded from test coverage per NFR-014.
// PIPELINE-STATE-2026-0006: types for manifest, hook input, signals, banner, repair.

export type PipelineKind = 'se' | 'eiw' | 'drw';
export type PipelineStatus = 'in_progress' | 'completed' | 'cancelled';
export type PhaseStatus = 'draft' | 'approved' | 'rejected' | 'in_progress';
export type OutputMode = 'code' | 'documentation' | 'configuration' | 'mixed';

export interface BarRaiserFlags {
  se_1: boolean;
  se_2: boolean;
  eiw_1: boolean;
  drw_1: boolean;
}

export interface FeedbackIssue {
  description: string;
  location: string;
  required_fix: string;
}

export interface AccumulatedFeedbackEntry {
  iteration: number;
  source: string;
  reviewer: string;
  verdict: 'REJECTED' | 'CRITIQUED';
  critical_issues: FeedbackIssue[];
  major_issues: FeedbackIssue[];
  minor_issues: FeedbackIssue[];
  added_at: string;
}

export interface PhaseHistoryEntry {
  phase: string;
  status: PhaseStatus;
  iteration: number;
  started_at: string;
  completed_at: string | null;
  deliverable_path: string;
  approved_by: string;
}

export interface PipelineManifest {
  pipeline: PipelineKind;
  run_id: string;
  feature: string;
  started_at: string;
  last_activity_at: string;
  current_phase: string;
  iteration: number;
  max_iterations: number;
  restart_count: number;
  status: PipelineStatus;
  output_mode: OutputMode;
  br_flags: BarRaiserFlags;
  phase_history: PhaseHistoryEntry[];
  accumulated_feedback: AccumulatedFeedbackEntry[];
  // PIPELINE-STATE-2026-0009: counter incremented by stop.enforce-pipeline-completion on each
  // injected continuation. Defaults to 0 on read when missing (back-compat for older manifests).
  stop_injections?: number;
}

export interface PhaseFrontmatter {
  phase: string;
  iteration: number;
  status: PhaseStatus;
  approved_by: string;
  created_at: string;
}

export interface HookInput {
  tool_name?: string;
  tool_input?: {
    command?: string;
    file_path?: string;
    old_string?: string;
    new_string?: string;
    content?: string;
    skill?: string;
    args?: string;
    description?: string;
    subagent_type?: string;
    model?: string;
    prompt?: string;
  };
  tool_output?: { output?: string };
  cwd?: string;
  hook_event_name?: string;
}

export interface BranchSignal {
  hook: string;
  decision: 'allow' | 'block' | 'warn' | 'archive' | 'skip';
  reason: string;
  context?: Record<string, string | number>;
  docsAnchor?: string;
}

export interface ResumeBannerEntry {
  pipeline: PipelineKind;
  run_id: string;
  current_phase: string;
  iteration: number;
  max_iterations: number;
  last_activity_at: string;
  is_stale: boolean;
}

export interface ArchivableRun {
  runDir: string;
  reason: 'completed-aged' | 'cancelled';
}

export interface OrphanReport {
  missingDeliverables: { phase: string; expectedPath: string }[];
  orphanedFiles: string[];
}

export interface RepairSuggestion {
  orphan: string;
  classification: 'forward-fill' | 'archive' | 'delete' | 'human-review';
  reason: string;
  command: string | null;
}

export interface UiLintViolation {
  file: string;
  line: number;
  rule: 'title-case' | 'muted-foreground-on-description' | 'button-text-shift';
  snippet: string;
}

export interface HookHelp {
  name: string;
  description: string;
  inputs: string[];
  exitCodes: { code: number; meaning: string }[];
  envVars: { name: string; effect: string }[];
  bypass: string[];
  docsAnchor: string;
  testIds: string[];
}
