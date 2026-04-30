// PIPELINE-STATE-2026-0009: tests for stop.enforce-pipeline-completion hook.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { main } from './stop.enforce-pipeline-completion.js';
import {
  abortPipeline,
  incrementStopInjections,
  startPipeline,
  stalledMarkerPath,
} from './lib/pipeline-sentinel.js';
import { readManifest } from './lib/manifest.js';

let stateRoot: string;
let stdout: string;
let stderr: string;
const fixedNow = () => new Date('2026-04-28T17:00:00.000Z');

beforeEach(() => {
  stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'stop-hook-test-'));
  stdout = '';
  stderr = '';
});

afterEach(() => {
  fs.rmSync(stateRoot, { recursive: true, force: true });
});

function deps() {
  return {
    stateRoot,
    env: { } as NodeJS.ProcessEnv,
    now: fixedNow,
    stdoutWrite: (s: string) => { stdout += s; },
    stderrWrite: (s: string) => { stderr += s; },
  };
}

function readLog(): Record<string, unknown>[] {
  const p = path.join(stateRoot, '.stop-hook-log.jsonl');
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, 'utf-8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe('PIPELINE_ENFORCEMENT_DISABLED bypass', () => {
  it('returns 0 with no stdout when env var is set', async () => {
    const d = deps();
    d.env.PIPELINE_ENFORCEMENT_DISABLED = '1';
    const code = await main(d);
    expect(code).toBe(0);
    expect(stdout).toBe('');
    const logs = readLog();
    expect(logs).toHaveLength(1);
    expect(logs[0].decision).toBe('env-disabled');
  });
});

describe('no active pipeline scenarios', () => {
  it('skips when state dir does not exist', async () => {
    const missing = path.join(stateRoot, 'gone');
    const d = deps();
    d.stateRoot = missing;
    const code = await main(d);
    expect(code).toBe(0);
    expect(stdout).toBe('');
  });

  it('skips when state dir empty', async () => {
    const code = await main(deps());
    expect(code).toBe(0);
    expect(stdout).toBe('');
    const logs = readLog();
    expect(logs[logs.length - 1].decision).toBe('skip');
    expect(logs[logs.length - 1].reason).toBe('no-active-run');
  });

  it('skips when only completed runs exist', async () => {
    startPipeline({ pipeline: 'se', runId: 'r1', feature: 'f', stateRoot });
    const manifestPath = path.join(stateRoot, 'r1', 'manifest.json');
    const m = readManifest(manifestPath)!;
    m.status = 'completed';
    fs.writeFileSync(manifestPath, JSON.stringify(m));

    const code = await main(deps());
    expect(code).toBe(0);
    expect(stdout).toBe('');
  });
});

describe('block decision (active pipeline, under cap)', () => {
  it('blocks stop and increments counter on first injection', async () => {
    startPipeline({ pipeline: 'se', runId: 'r1', feature: 'f', currentPhase: '5', stateRoot });

    const code = await main(deps());
    expect(code).toBe(0);

    const parsed = JSON.parse(stdout) as { decision: string; reason: string };
    expect(parsed.decision).toBe('block');
    expect(parsed.reason).toContain('Pipeline se run r1');
    expect(parsed.reason).toContain('phase 5');
    expect(parsed.reason).toContain('Stop injection 1 of 8');
    expect(parsed.reason).toContain('/abort-pipeline');

    const m = readManifest(path.join(stateRoot, 'r1', 'manifest.json'))!;
    expect(m.stop_injections).toBe(1);

    const logs = readLog();
    expect(logs.at(-1)!.decision).toBe('block');
    expect(logs.at(-1)!.injection_count).toBe(1);
  });

  it('reason includes computed next-phase command', async () => {
    startPipeline({ pipeline: 'se', runId: 'r1', feature: 'f', currentPhase: '5', stateRoot });
    await main(deps());
    const parsed = JSON.parse(stdout) as { reason: string };
    expect(parsed.reason).toMatch(/\/se-5/);
  });

  it('honors PIPELINE_MAX_STOP_INJECTIONS override', async () => {
    startPipeline({ pipeline: 'se', runId: 'r1', feature: 'f', currentPhase: '5', stateRoot });
    incrementStopInjections('r1', stateRoot); // counter = 1
    incrementStopInjections('r1', stateRoot); // counter = 2

    const d = deps();
    d.env.PIPELINE_MAX_STOP_INJECTIONS = '2';
    const code = await main(d);
    expect(code).toBe(0);
    expect(stdout).toBe('');
    expect(fs.existsSync(stalledMarkerPath('r1', stateRoot))).toBe(true);
  });

  it('falls back to default 8 on invalid env override', async () => {
    startPipeline({ pipeline: 'se', runId: 'r1', feature: 'f', currentPhase: '5', stateRoot });
    const d = deps();
    d.env.PIPELINE_MAX_STOP_INJECTIONS = 'banana';
    await main(d);
    const parsed = JSON.parse(stdout) as { reason: string };
    expect(parsed.reason).toContain('of 8');
  });
});

describe('cap reached → allow stop with stalled marker', () => {
  it('writes stalled marker, stderr message, and allows stop when at cap', async () => {
    startPipeline({ pipeline: 'se', runId: 'r1', feature: 'f', currentPhase: '5', stateRoot });
    for (let i = 0; i < 8; i++) incrementStopInjections('r1', stateRoot);

    const code = await main(deps());
    expect(code).toBe(0);
    expect(stdout).toBe('');
    expect(stderr).toContain('stalled at phase 5');
    expect(stderr).toContain('/abort-pipeline');
    expect(fs.existsSync(stalledMarkerPath('r1', stateRoot))).toBe(true);

    const logs = readLog();
    expect(logs.at(-1)!.decision).toBe('stalled');
    expect(logs.at(-1)!.injection_count).toBe(8);
  });
});

describe('abort marker honored → cancel run, allow stop', () => {
  it('sets manifest status to cancelled and removes abort marker', async () => {
    startPipeline({ pipeline: 'se', runId: 'r1', feature: 'f', currentPhase: '5', stateRoot });
    abortPipeline('r1', 'user', stateRoot);

    const code = await main(deps());
    expect(code).toBe(0);
    expect(stdout).toBe('');

    const m = readManifest(path.join(stateRoot, 'r1', 'manifest.json'))!;
    expect(m.status).toBe('cancelled');

    const logs = readLog();
    expect(logs.at(-1)!.decision).toBe('aborted');
  });
});

describe('fail-open on errors', () => {
  it('does not crash when manifest is corrupt — most-recently-active returns null', async () => {
    const runDir = path.join(stateRoot, 'corrupt-run');
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(path.join(runDir, 'manifest.json'), 'not json');

    const code = await main(deps());
    expect(code).toBe(0);
    expect(stdout).toBe('');
  });
});

describe('JSONL log entries are well-formed', () => {
  it('every log entry contains required keys', async () => {
    startPipeline({ pipeline: 'se', runId: 'r1', feature: 'f', currentPhase: '5', stateRoot });
    await main(deps());
    const logs = readLog();
    for (const entry of logs) {
      expect(entry).toHaveProperty('ts');
      expect(entry).toHaveProperty('run_id');
      expect(entry).toHaveProperty('pipeline');
      expect(entry).toHaveProperty('phase');
      expect(entry).toHaveProperty('decision');
      expect(entry).toHaveProperty('injection_count');
      expect(entry).toHaveProperty('reason');
    }
  });
});

describe('reason format vs requirements', () => {
  it('reason is single concatenated string with key facts', async () => {
    startPipeline({ pipeline: 'eiw', runId: 'eiw-test-1', feature: 'f', currentPhase: 'eiw-stage4', stateRoot });
    const manifestPath = path.join(stateRoot, 'eiw-test-1', 'manifest.json');
    const m = readManifest(manifestPath)!;
    m.iteration = 2;
    fs.writeFileSync(manifestPath, JSON.stringify(m));

    await main(deps());
    const parsed = JSON.parse(stdout) as { reason: string };
    expect(parsed.reason).toContain('Pipeline eiw run eiw-test-1');
    expect(parsed.reason).toContain('iteration 2/4');
    expect(parsed.reason).toContain('phase eiw-stage4');
    expect(parsed.reason).toMatch(/Resume now by invoking/);
  });

  it('reason routes drw runs to /defect-fix', async () => {
    startPipeline({ pipeline: 'drw', runId: 'd1', feature: 'f', currentPhase: 'D3', stateRoot });
    await main(deps());
    const parsed = JSON.parse(stdout) as { reason: string };
    expect(parsed.reason).toContain('/defect-fix');
  });
});

describe('--help', () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('prints help text when --help is in argv', async () => {
    process.argv = ['node', 'stop.enforce-pipeline-completion.js', '--help'];
    const code = await main(deps());
    expect(code).toBe(0);
    expect(stdout).toContain('stop.enforce-pipeline-completion');
    expect(stdout).toContain('PIPELINE_ENFORCEMENT_DISABLED');
    expect(stdout).toContain('PIPELINE_MAX_STOP_INJECTIONS');
    expect(stdout).toContain('/abort-pipeline');
  });
});

describe('JSONL log resilience', () => {
  it('does not crash when log directory cannot be created', async () => {
    const broken = path.join(stateRoot, 'no-write');
    fs.mkdirSync(broken, { recursive: true });
    fs.chmodSync(broken, 0o555);
    try {
      const d = deps();
      d.stateRoot = path.join(broken, 'sub');
      const code = await main(d);
      expect(code).toBe(0);
    } finally {
      fs.chmodSync(broken, 0o755);
    }
  });
});
