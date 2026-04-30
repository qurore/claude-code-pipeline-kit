// PIPELINE-STATE-2026-0009: ergonomic helpers for active-pipeline tracking. Wraps manifest
// mutations and maintains debuggability marker files. Used by pipeline orchestrators (via the
// sentinel-cli wrapper) and by stop.enforce-pipeline-completion.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { mutateManifest, readManifest, writeManifestAtomic } from './manifest.js';
import { findInProgressRuns } from './state-discovery.js';
import type { OutputMode, PipelineKind, PipelineManifest } from './types.js';

const DEFAULT_STATE_ROOT_RELATIVE = '.claude/pipeline-state';
const ACTIVE_PREFIX = '.pipeline-active-';
const ABORTED_PREFIX = '.pipeline-aborted-';
const STALLED_PREFIX = '.pipeline-stalled-';

export interface StartPipelineOpts {
  pipeline: PipelineKind;
  runId: string;
  feature: string;
  currentPhase?: string;
  outputMode?: OutputMode;
  maxIterations?: number;
  stateRoot?: string;
}

export interface ActivePipelineSummary {
  pipeline: PipelineKind;
  runId: string;
  currentPhase: string;
  iteration: number;
  maxIterations: number;
  stopInjections: number;
  startedAt: string;
  lastActivityAt: string;
  runDir: string;
}

export interface PipelineCompletionSummary {
  pipeline: PipelineKind;
  runId: string;
  totalPhases: number;
  totalRestarts: number;
  totalStopInjections: number;
  durationMs: number;
}

// BR2 fix F3: walk up cwd until we find a directory containing .claude/pipeline-state/, so the
// CLI works from any subdirectory. Falls back to cwd-relative if not found.
export function defaultStateRoot(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, DEFAULT_STATE_ROOT_RELATIVE);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), DEFAULT_STATE_ROOT_RELATIVE);
}

function resolveStateRoot(stateRoot?: string): string {
  return stateRoot ?? defaultStateRoot();
}

function runDirFor(runId: string, stateRoot?: string): string {
  return path.join(resolveStateRoot(stateRoot), runId);
}

function manifestPathFor(runId: string, stateRoot?: string): string {
  return path.join(runDirFor(runId, stateRoot), 'manifest.json');
}

export function activeMarkerPath(runId: string, stateRoot?: string): string {
  return path.join(resolveStateRoot(stateRoot), `${ACTIVE_PREFIX}${runId}`);
}

export function abortMarkerPath(runId: string, stateRoot?: string): string {
  return path.join(resolveStateRoot(stateRoot), `${ABORTED_PREFIX}${runId}`);
}

export function stalledMarkerPath(runId: string, stateRoot?: string): string {
  return path.join(resolveStateRoot(stateRoot), `${STALLED_PREFIX}${runId}`);
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeMarkerAtomic(markerPath: string): void {
  ensureDir(path.dirname(markerPath));
  const tmp = `${markerPath}.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tmp, '', { encoding: 'utf-8', mode: 0o644 });
  fs.renameSync(tmp, markerPath);
}

function safeUnlink(p: string): boolean {
  try {
    fs.unlinkSync(p);
    return true;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return false;
    throw err;
  }
}

export function startPipeline(opts: StartPipelineOpts): { manifestPath: string; runDir: string } {
  const stateRoot = resolveStateRoot(opts.stateRoot);
  ensureDir(stateRoot);
  const runDir = runDirFor(opts.runId, stateRoot);
  ensureDir(runDir);
  const manifestPath = manifestPathFor(opts.runId, stateRoot);

  if (!fs.existsSync(manifestPath)) {
    const now = new Date().toISOString();
    const manifest: PipelineManifest = {
      pipeline: opts.pipeline,
      run_id: opts.runId,
      feature: opts.feature,
      started_at: now,
      last_activity_at: now,
      current_phase: opts.currentPhase ?? '0',
      iteration: 1,
      max_iterations: opts.maxIterations ?? 4,
      restart_count: 0,
      status: 'in_progress',
      output_mode: opts.outputMode ?? 'code',
      br_flags: { se_1: false, se_2: false, eiw_1: false, drw_1: false },
      phase_history: [],
      accumulated_feedback: [],
      stop_injections: 0,
    };
    writeManifestAtomic(manifestPath, manifest);
  }

  writeMarkerAtomic(activeMarkerPath(opts.runId, stateRoot));
  return { manifestPath, runDir };
}

export function advancePhase(runId: string, nextPhase: string, stateRoot?: string): PipelineManifest {
  const manifestPath = manifestPathFor(runId, stateRoot);
  return mutateManifest(manifestPath, (m) => {
    m.current_phase = nextPhase;
    m.last_activity_at = new Date().toISOString();
  });
}

export function completePipeline(runId: string, stateRoot?: string): PipelineCompletionSummary | null {
  const manifestPath = manifestPathFor(runId, stateRoot);
  const existing = readManifest(manifestPath);
  if (!existing) return null;
  const startedMs = Date.parse(existing.started_at);
  const endIso = new Date().toISOString();
  const updated = mutateManifest(manifestPath, (m) => {
    m.status = 'completed';
    m.last_activity_at = endIso;
  });
  safeUnlink(activeMarkerPath(runId, stateRoot));
  safeUnlink(abortMarkerPath(runId, stateRoot));
  safeUnlink(stalledMarkerPath(runId, stateRoot));
  return {
    pipeline: updated.pipeline,
    runId: updated.run_id,
    totalPhases: updated.phase_history.length,
    totalRestarts: updated.restart_count,
    totalStopInjections: updated.stop_injections ?? 0,
    durationMs: Number.isNaN(startedMs) ? 0 : Date.parse(endIso) - startedMs,
  };
}

export function abortPipeline(runId: string, _reason?: string, stateRoot?: string): void {
  writeMarkerAtomic(abortMarkerPath(runId, stateRoot));
}

export function getActivePipelines(stateRoot?: string): ActivePipelineSummary[] {
  const root = resolveStateRoot(stateRoot);
  if (!fs.existsSync(root)) return [];
  const runs = findInProgressRuns(root);
  return runs.map((r) => ({
    pipeline: r.manifest.pipeline,
    runId: r.manifest.run_id,
    currentPhase: r.manifest.current_phase,
    iteration: r.manifest.iteration,
    maxIterations: r.manifest.max_iterations,
    stopInjections: r.manifest.stop_injections ?? 0,
    startedAt: r.manifest.started_at,
    lastActivityAt: r.manifest.last_activity_at,
    runDir: r.dir,
  }));
}

export function incrementStopInjections(runId: string, stateRoot?: string): number {
  const manifestPath = manifestPathFor(runId, stateRoot);
  let next = 0;
  mutateManifest(manifestPath, (m) => {
    next = (m.stop_injections ?? 0) + 1;
    m.stop_injections = next;
    m.last_activity_at = new Date().toISOString();
  });
  return next;
}

export function markStalled(runId: string, stateRoot?: string): void {
  writeMarkerAtomic(stalledMarkerPath(runId, stateRoot));
}

export function clearAbortMarker(runId: string, stateRoot?: string): boolean {
  return safeUnlink(abortMarkerPath(runId, stateRoot));
}

export function isAborted(runId: string, stateRoot?: string): boolean {
  return fs.existsSync(abortMarkerPath(runId, stateRoot));
}
