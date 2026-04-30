#!/usr/bin/env node
// PIPELINE-STATE-2026-0007: Runnable repair tool for orphaned phase deliverables (BR 2.3).
// Usage:
//   node dist/scripts/repair-orphan.js <orphan-path> --add-history
//   node dist/scripts/repair-orphan.js <orphan-path> --archive
//   node dist/scripts/repair-orphan.js <orphan-path> --delete

import * as fs from 'node:fs';
import * as path from 'node:path';
import { mutateManifest, readManifest } from '../lib/manifest.js';

function parsePhaseFromFilename(filename: string): string | null {
  const m = filename.match(/^phase-([0-9]+(?:\.[0-9]+)?|eiw-stage[0-9]+|D[0-9]+)-/);
  return m ? m[1] : null;
}

function parseFrontmatter(content: string): Record<string, string> | null {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const out: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

function main(): void {
  const [orphanPath, action] = process.argv.slice(2);
  if (!orphanPath || !action) {
    process.stderr.write('Usage: repair-orphan <path> --add-history|--archive|--delete\n');
    process.exit(1);
  }

  if (!fs.existsSync(orphanPath)) {
    process.stderr.write(`File not found: ${orphanPath}\n`);
    process.exit(1);
  }

  const runDir = path.dirname(orphanPath);
  const manifestPath = path.join(runDir, 'manifest.json');
  const filename = path.basename(orphanPath);

  switch (action) {
    case '--add-history': {
      const phase = parsePhaseFromFilename(filename);
      if (!phase) {
        process.stderr.write(`Cannot infer phase from filename: ${filename}\n`);
        process.exit(1);
      }
      const fm = parseFrontmatter(fs.readFileSync(orphanPath, 'utf-8'));
      const iteration = Number(fm?.iteration ?? 1);
      mutateManifest(manifestPath, (m) => {
        m.phase_history.push({
          phase,
          status: (fm?.status as 'approved' | 'rejected' | 'in_progress') ?? 'approved',
          iteration,
          started_at: m.last_activity_at,
          completed_at: new Date().toISOString(),
          deliverable_path: filename,
          approved_by: fm?.approved_by ?? 'repair-orphan',
        });
      });
      process.stdout.write(`Added history entry for ${filename}\n`);
      break;
    }
    case '--archive': {
      const orphansDir = path.join(runDir, '..', 'orphans');
      if (!fs.existsSync(orphansDir)) fs.mkdirSync(orphansDir, { recursive: true });
      const target = path.join(orphansDir, filename);
      fs.renameSync(orphanPath, target);
      process.stdout.write(`Archived ${filename} to ${target}\n`);
      break;
    }
    case '--delete': {
      fs.unlinkSync(orphanPath);
      process.stdout.write(`Deleted ${filename}\n`);
      break;
    }
    default:
      process.stderr.write(`Unknown action: ${action}\n`);
      process.exit(1);
  }
}

main();
