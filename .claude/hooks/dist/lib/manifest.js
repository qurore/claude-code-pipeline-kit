// PIPELINE-STATE-2026-0006: manifest read/write/mutate with atomic writes and advisory lock.
import * as fs from 'node:fs';
import * as path from 'node:path';
const LOCK_TTL_MS = 10_000;
const MAX_WAIT_MS = 20_000;
/**
 * Read a manifest from disk. Returns null on missing file or malformed JSON.
 * Does NOT throw — callers should handle null as "no active run" or "corrupt manifest".
 */
export function readManifest(manifestPath) {
    try {
        const raw = fs.readFileSync(manifestPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.stop_injections === undefined)
            parsed.stop_injections = 0;
        return parsed;
    }
    catch (err) {
        const code = err.code;
        if (code === 'ENOENT')
            return null;
        return null;
    }
}
/**
 * Atomically replace `manifestPath` with serialized `manifest`. Implementation: write to
 * `<path>.tmp.<pid>.<ts>`, then `renameSync`. Throws on filesystem errors. Does NOT acquire
 * any lock — callers needing serialization MUST wrap in `withLock` or `mutateManifest`.
 */
export function writeManifestAtomic(manifestPath, manifest) {
    const dir = path.dirname(manifestPath);
    const tmp = path.join(dir, `${path.basename(manifestPath)}.tmp.${process.pid}.${Date.now()}`);
    fs.writeFileSync(tmp, JSON.stringify(manifest, null, 2) + '\n', { encoding: 'utf-8', mode: 0o644 });
    fs.renameSync(tmp, manifestPath);
}
function readLockSafely(lockPath) {
    try {
        const raw = fs.readFileSync(lockPath, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function sleepSync(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        // busy-wait — acceptable for sub-100ms backoff
    }
}
/**
 * Acquire an advisory file lock at `lockPath`, run `fn`, and release the lock.
 *
 * - Lock acquisition: creates `lockPath` exclusively (`O_CREAT | O_EXCL`). On EEXIST,
 *   busy-waits (50-150ms jittered backoff) until lock is released, expires, or
 *   the total wait exceeds `ttlMs * 2`.
 * - Stale lock recovery: if `acquired_at + ttlMs < now`, the lock is forcibly removed.
 * - Throws after `ttlMs * 2` if no lock acquired. Throws on filesystem errors other than EEXIST.
 * - Lock is released even if `fn` throws.
 *
 * `ttlMs` defaults to 10s. Callers performing slow I/O inside `fn` should bump it.
 */
export function withLock(lockPath, fn, ttlMs = LOCK_TTL_MS) {
    const start = Date.now();
    while (true) {
        try {
            const fd = fs.openSync(lockPath, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY, 0o600);
            try {
                fs.writeSync(fd, JSON.stringify({ pid: process.pid, acquired_at: Date.now() }));
            }
            finally {
                fs.closeSync(fd);
            }
            try {
                return fn();
            }
            finally {
                try {
                    fs.unlinkSync(lockPath);
                }
                catch { /* lock already removed */ }
            }
        }
        catch (err) {
            const code = err.code;
            if (code !== 'EEXIST')
                throw err;
            const lockData = readLockSafely(lockPath);
            if (lockData && Date.now() - lockData.acquired_at > ttlMs) {
                try {
                    fs.unlinkSync(lockPath);
                }
                catch { /* race: another process removed it */ }
                continue;
            }
            if (Date.now() - start > MAX_WAIT_MS) {
                throw new Error(`Lock acquisition timeout after ${MAX_WAIT_MS}ms: ${lockPath}`);
            }
            sleepSync(50 + Math.floor(Math.random() * 100));
        }
    }
}
/**
 * Lock + read + mutate + atomic write + return. The mutator may EITHER:
 *
 * - Return a new `PipelineManifest` (immutable convention). The returned object is written.
 * - Mutate the input in place and return void. The mutated input is written.
 *
 * Throws if the manifest is missing or the lock cannot be acquired.
 *
 * Side effect: persists the post-mutation manifest atomically. Returns the persisted state.
 */
export function mutateManifest(manifestPath, mutator) {
    return withLock(`${manifestPath}.lock`, () => {
        const m = readManifest(manifestPath);
        if (!m)
            throw new Error(`Manifest not found: ${manifestPath}`);
        const next = (mutator(m) ?? m);
        writeManifestAtomic(manifestPath, next);
        return next;
    });
}
