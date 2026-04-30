import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { emitSignal } from './signals.js';

let stderrBuf: string;
let originalWrite: typeof process.stderr.write;

beforeEach(() => {
  stderrBuf = '';
  originalWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderrBuf += typeof chunk === 'string' ? chunk : chunk.toString();
    return true;
  }) as typeof process.stderr.write;
});

afterEach(() => {
  process.stderr.write = originalWrite;
});

describe('emitSignal', () => {
  it('emits hook + decision + reason', () => {
    emitSignal({ hook: 'h', decision: 'allow', reason: 'r' });
    expect(stderrBuf).toBe('[h] decision=allow reason=r\n');
  });

  it('includes context fields', () => {
    emitSignal({ hook: 'h', decision: 'block', reason: 'r', context: { foo: 'bar', n: 1 } });
    expect(stderrBuf).toContain('foo=bar');
    expect(stderrBuf).toContain('n=1');
  });

  it('includes docs anchor when present (BR 4.2)', () => {
    emitSignal({ hook: 'h', decision: 'allow', reason: 'r', docsAnchor: 'phase-gate' });
    expect(stderrBuf).toContain('docs: .claude/hooks/README.md#phase-gate');
  });
});
