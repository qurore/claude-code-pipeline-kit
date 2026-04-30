// PIPELINE-STATE-2026-0006: shared --help renderer (BR 4.3).
import type { HookHelp } from './types.js';

export function printHelp(h: HookHelp): string {
  const lines: string[] = [];
  lines.push(`# ${h.name}`);
  lines.push('');
  lines.push(h.description);
  lines.push('');
  lines.push('## Inputs (read from stdin JSON)');
  for (const i of h.inputs) lines.push(`  - ${i}`);
  lines.push('');
  lines.push('## Exit codes');
  for (const e of h.exitCodes) lines.push(`  ${e.code}: ${e.meaning}`);
  lines.push('');
  if (h.envVars.length > 0) {
    lines.push('## Environment variables');
    for (const v of h.envVars) lines.push(`  ${v.name}: ${v.effect}`);
    lines.push('');
  }
  if (h.bypass.length > 0) {
    lines.push('## Bypass mechanisms');
    for (const b of h.bypass) lines.push(`  - ${b}`);
    lines.push('');
  }
  lines.push(`## Docs`);
  lines.push(`  .claude/hooks/README.md#${h.docsAnchor}`);
  lines.push('');
  lines.push('## Related tests');
  lines.push(`  ${h.testIds.join(', ')}`);
  return lines.join('\n');
}

export function isHelpRequested(argv: string[]): boolean {
  return argv.includes('--help') || argv.includes('-h');
}
