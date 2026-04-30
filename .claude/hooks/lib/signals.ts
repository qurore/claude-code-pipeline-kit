// PIPELINE-STATE-2026-0006: structured stderr signals for branch observability (NFR-009, BR 4.2).
import type { BranchSignal } from './types.js';

export function emitSignal(s: BranchSignal): void {
  const ctx = s.context
    ? ' ' + Object.entries(s.context).map(([k, v]) => `${k}=${v}`).join(' ')
    : '';
  const docs = s.docsAnchor ? ` | docs: .claude/hooks/README.md#${s.docsAnchor}` : '';
  process.stderr.write(`[${s.hook}] decision=${s.decision} reason=${s.reason}${ctx}${docs}\n`);
}
