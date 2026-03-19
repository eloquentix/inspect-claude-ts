import type { Scope, ScopeResult } from '../types.js';
import { ansiBold, ansiCyan, ansiDim, ansiGreen, ansiYellow, colorize } from './color.js';

export function renderTree(results: ScopeResult[], verbose: boolean): string {
  const lines: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const sr = results[i];
    if (sr.groups.length === 0) continue;

    if (lines.length > 0) lines.push('');

    const icon = scopeIcon(sr.scope);
    lines.push(`${icon} ${colorize(ansiBold + ansiCyan, sr.label)}`);

    for (let gi = 0; gi < sr.groups.length; gi++) {
      const g = sr.groups[gi];
      const isLastGroup = gi === sr.groups.length - 1;
      const prefix = isLastGroup ? '└── ' : '├── ';
      const childPrefix = isLastGroup ? '    ' : '│   ';

      let header = colorize(ansiBold + ansiGreen, g.kind);
      if (g.source) header += ' ' + colorize(ansiDim, `(${g.source})`);
      lines.push(prefix + header);

      // Sort items by name for stable output
      const items = [...g.items].sort((a, b) => a.name.localeCompare(b.name));

      for (let ii = 0; ii < items.length; ii++) {
        const item = items[ii];
        const isLastItem = ii === items.length - 1;
        const itemPrefix = childPrefix + (isLastItem ? '└── ' : '├── ');

        let display = colorize(ansiYellow, item.name);
        if (item.detail) display += ' ' + colorize(ansiDim, `(${item.detail})`);
        lines.push(itemPrefix + display);

        if (verbose) {
          const metaPrefix = childPrefix + (isLastItem ? '    ' : '│   ');
          if (item.description) {
            lines.push(metaPrefix + '  ' + colorize(ansiDim, item.description));
          }
          if (item.metadata) {
            const keys = Object.keys(item.metadata).sort();
            for (const k of keys) {
              lines.push(metaPrefix + '  ' + colorize(ansiDim, `${k}: ${item.metadata[k]}`));
            }
          }
        }
      }
    }
  }

  return lines.join('\n') + '\n';
}

function scopeIcon(s: Scope): string {
  switch (s) {
    case 'managed': return '\u{1F3E2}'; // 🏢
    case 'user': return '\u{1F4E6}'; // 📦
    case 'project': return '\u{1F4C2}'; // 📂
    case 'local': return '\u{1F512}'; // 🔒
    default: return '\u{1F4CB}'; // 📋
  }
}
