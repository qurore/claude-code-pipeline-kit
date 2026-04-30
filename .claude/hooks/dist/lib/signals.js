export function emitSignal(s) {
    const ctx = s.context
        ? ' ' + Object.entries(s.context).map(([k, v]) => `${k}=${v}`).join(' ')
        : '';
    const docs = s.docsAnchor ? ` | docs: .claude/hooks/README.md#${s.docsAnchor}` : '';
    process.stderr.write(`[${s.hook}] decision=${s.decision} reason=${s.reason}${ctx}${docs}\n`);
}
