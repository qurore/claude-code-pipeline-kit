// PIPELINE-STATE-2026-0006: state discovery — runs, orphans, stale, archive.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { readManifest, mutateManifest } from './manifest.js';
const STALE_THRESHOLD_DAYS = 30;
const ARCHIVE_AFTER_DAYS = 14;
const RECENT_RESUME_DAYS = 7;
export function listRunDirs(stateRoot) {
    if (!fs.existsSync(stateRoot))
        return [];
    return fs.readdirSync(stateRoot, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'orphans')
        .map((d) => path.join(stateRoot, d.name));
}
export function findInProgressRuns(stateRoot) {
    const out = [];
    for (const dir of listRunDirs(stateRoot)) {
        const m = readManifest(path.join(dir, 'manifest.json'));
        if (m && m.status === 'in_progress')
            out.push({ dir, manifest: m });
    }
    return out;
}
export function findMostRecentlyActiveRun(stateRoot) {
    const runs = findInProgressRuns(stateRoot);
    if (runs.length === 0)
        return null;
    runs.sort((a, b) => Date.parse(b.manifest.last_activity_at) - Date.parse(a.manifest.last_activity_at));
    return runs[0];
}
export function isStale(manifest, nowMs = Date.now(), thresholdDays = STALE_THRESHOLD_DAYS) {
    const last = Date.parse(manifest.last_activity_at);
    if (Number.isNaN(last))
        return false;
    return (nowMs - last) > thresholdDays * 24 * 60 * 60 * 1000;
}
export function isRecent(manifest, nowMs = Date.now(), windowDays = RECENT_RESUME_DAYS) {
    const last = Date.parse(manifest.last_activity_at);
    if (Number.isNaN(last))
        return false;
    return (nowMs - last) <= windowDays * 24 * 60 * 60 * 1000;
}
export function manifestToResumeEntry(manifest, nowMs = Date.now()) {
    return {
        pipeline: manifest.pipeline,
        run_id: manifest.run_id,
        current_phase: manifest.current_phase,
        iteration: manifest.iteration,
        max_iterations: manifest.max_iterations,
        last_activity_at: manifest.last_activity_at,
        is_stale: isStale(manifest, nowMs),
    };
}
export function detectOrphans(runDir, manifest) {
    const referenced = new Set(manifest.phase_history.map((h) => h.deliverable_path));
    const referencedNonNull = new Set([...referenced].filter(Boolean));
    const missingDeliverables = [];
    for (const entry of manifest.phase_history) {
        if (!entry.deliverable_path)
            continue;
        const full = path.join(runDir, entry.deliverable_path);
        if (!fs.existsSync(full)) {
            missingDeliverables.push({ phase: entry.phase, expectedPath: entry.deliverable_path });
        }
    }
    const orphanedFiles = [];
    if (fs.existsSync(runDir)) {
        for (const f of fs.readdirSync(runDir)) {
            if (!f.startsWith('phase-') || !f.endsWith('.md'))
                continue;
            if (f.includes('.draft.'))
                continue;
            if (!referencedNonNull.has(f))
                orphanedFiles.push(f);
        }
    }
    return { missingDeliverables, orphanedFiles };
}
export function archivableRuns(stateRoot, now = Date.now(), archiveAfterDays = ARCHIVE_AFTER_DAYS) {
    const out = [];
    for (const dir of listRunDirs(stateRoot)) {
        const m = readManifest(path.join(dir, 'manifest.json'));
        if (!m)
            continue;
        if (m.status === 'cancelled') {
            out.push({ runDir: dir, reason: 'cancelled' });
            continue;
        }
        if (m.status === 'completed') {
            const last = Date.parse(m.last_activity_at);
            if (!Number.isNaN(last) && (now - last) > archiveAfterDays * 24 * 60 * 60 * 1000) {
                out.push({ runDir: dir, reason: 'completed-aged' });
            }
        }
    }
    return out;
}
/**
 * Move `runDir` into `archiveRoot`. Creates `archiveRoot` if missing. On collision
 * (target already exists), appends `.archived-<timestamp>` suffix to disambiguate.
 * Uses `renameSync` — atomic on the same filesystem; cross-device moves throw.
 */
export function archiveRun(runDir, archiveRoot) {
    if (!fs.existsSync(archiveRoot))
        fs.mkdirSync(archiveRoot, { recursive: true });
    const target = path.join(archiveRoot, path.basename(runDir));
    if (fs.existsSync(target)) {
        const ts = Date.now();
        fs.renameSync(runDir, `${target}.archived-${ts}`);
        return;
    }
    fs.renameSync(runDir, target);
}
export function appendPhaseHistory(manifestPath, entry) {
    return mutateManifest(manifestPath, (m) => {
        m.phase_history.push(entry);
        m.last_activity_at = new Date().toISOString();
    });
}
export function setBarRaiserFlag(manifestPath, flag, value) {
    return mutateManifest(manifestPath, (m) => {
        m.br_flags[flag] = value;
        m.last_activity_at = new Date().toISOString();
    });
}
