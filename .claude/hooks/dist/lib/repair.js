import * as path from 'node:path';
const RECENT_THRESHOLD_MS = 30 * 60 * 1000;
const STALE_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000;
/**
 * Classify an orphaned phase deliverable file and suggest a remediation action.
 *
 * Heuristics:
 * - `.draft.` in filename → delete (drafts are non-authoritative).
 * - File age <30 min AND filename phase matches `manifest.current_phase` → forward-fill
 *   (likely a Step D crash before manifest update).
 * - File age >14 days → archive (likely abandoned).
 * - Otherwise → human-review (no command suggested).
 *
 * Returns `RepairSuggestion` with classification, reason, and optional shell command.
 */
export function suggestRepair(orphanPath, manifest, fsStat, now = Date.now()) {
    const filename = path.basename(orphanPath);
    if (filename.includes('.draft.')) {
        return {
            orphan: filename,
            classification: 'delete',
            reason: 'Draft files are not authoritative deliverables.',
            command: `rm "${orphanPath}"`,
        };
    }
    const phaseMatch = filename.match(/^phase-([0-9]+(?:\.[0-9]+)?|[A-Z][0-9]+|eiw-stage[0-9]+)-/);
    const filePhase = phaseMatch?.[1];
    const ageMs = now - fsStat.mtimeMs;
    if (ageMs < RECENT_THRESHOLD_MS && filePhase && filePhase === manifest.current_phase) {
        return {
            orphan: filename,
            classification: 'forward-fill',
            reason: 'Recent file matching current phase. Likely a Step D crash before manifest update.',
            command: `node .claude/hooks/scripts/repair-orphan.ts "${orphanPath}" --add-history`,
        };
    }
    if (ageMs > STALE_THRESHOLD_MS) {
        return {
            orphan: filename,
            classification: 'archive',
            reason: 'Old file with no history entry. Likely abandoned.',
            command: `mv "${orphanPath}" .claude/pipeline-state/orphans/`,
        };
    }
    return {
        orphan: filename,
        classification: 'human-review',
        reason: 'Cannot infer disposition automatically.',
        command: null,
    };
}
