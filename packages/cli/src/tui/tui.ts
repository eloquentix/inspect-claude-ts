import type { ScopeResult, Scope } from '@inspect-claude/core';
import {
  ansiReset, ansiBold, ansiDim, ansiCyan, ansiGreen, ansiYellow,
  ansiMagenta, ansiRed, ansiReverse,
} from '@inspect-claude/core';
import {
  readKey, getTermSize, enableRawMode,
  clearScreen, moveCursor, hideCursor, showCursor,
  KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT,
  KEY_PGUP, KEY_PGDOWN, KEY_HOME, KEY_END,
} from './term.js';

interface Node {
  level: number;    // 0=scope, 1=group, 2=item
  label: string;
  detail: string;
  expanded: boolean;
  children: number;
  kind: string;
  description: string;
  metadata: Record<string, string>;
  content: string;
}

function scopeIcon(s: Scope): string {
  switch (s) {
    case 'managed': return '\u{1F3E2}';
    case 'user': return '\u{1F4E6}';
    case 'project': return '\u{1F4C2}';
    case 'local': return '\u{1F512}';
    default: return '\u{1F4CB}';
  }
}

function kindColor(kind: string): string {
  switch (kind) {
    case 'Permissions': return ansiMagenta;
    case 'Allowed Tools': return ansiCyan;
    case 'File Access': return ansiYellow;
    default: return ansiGreen;
  }
}

function buildNodes(results: ScopeResult[]): Node[] {
  const nodes: Node[] = [];
  for (const sr of results) {
    if (sr.groups.length === 0) continue;
    nodes.push({
      level: 0,
      label: scopeIcon(sr.scope) + ' ' + sr.label,
      detail: '',
      expanded: true,
      children: sr.groups.length,
      kind: sr.scope,
      description: '',
      metadata: {},
      content: '',
    });

    for (const g of sr.groups) {
      nodes.push({
        level: 1,
        label: g.kind,
        detail: g.source || '',
        expanded: true,
        children: g.items.length,
        kind: g.kind,
        description: '',
        metadata: {},
        content: '',
      });

      for (const item of g.items) {
        nodes.push({
          level: 2,
          label: item.name,
          detail: item.detail || '',
          kind: g.kind,
          description: item.description || '',
          metadata: item.metadata || {},
          content: item.content || '',
          expanded: false,
          children: 0,
        });
      }
    }
  }
  return nodes;
}

function visibleNodes(nodes: Node[]): number[] {
  const visible: number[] = [];
  let skipBelow = -1;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (skipBelow >= 0 && n.level > skipBelow) continue;
    skipBelow = -1;
    visible.push(i);
    if (n.children > 0 && !n.expanded) {
      skipBelow = n.level;
    }
  }
  return visible;
}

function stripAnsi(s: string): string {
  let out = '';
  let inEsc = false;
  for (const ch of s) {
    if (ch === '\x1b') { inEsc = true; continue; }
    if (inEsc) {
      if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) inEsc = false;
      continue;
    }
    out += ch;
  }
  return out;
}

function truncate(s: string, maxCols: number): string {
  const raw = stripAnsi(s);
  if (raw.length <= maxCols) return s;
  let visible = 0;
  let inEsc = false;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\x1b') { inEsc = true; continue; }
    if (inEsc) {
      if ((s[i] >= 'a' && s[i] <= 'z') || (s[i] >= 'A' && s[i] <= 'Z')) inEsc = false;
      continue;
    }
    visible++;
    if (visible >= maxCols) return s.slice(0, i) + ansiReset;
  }
  return s;
}

function detailColor(detail: string): string {
  switch (detail) {
    case 'allow': case 'writable': return ansiGreen;
    case 'deny': case 'denied': return ansiRed;
    case 'ignored': return ansiDim;
    default: return ansiDim;
  }
}

function renderNode(n: Node, cols: number): string {
  const indent = '  '.repeat(n.level);
  let line = '';

  switch (n.level) {
    case 0: {
      const arrow = n.expanded ? '▼ ' : '▶ ';
      line = indent + arrow + ansiBold + ansiCyan + n.label + ansiReset;
      break;
    }
    case 1: {
      const arrow = n.expanded ? '▼ ' : '▶ ';
      const kc = kindColor(n.kind);
      line = indent + '├── ' + arrow + ansiBold + kc + n.label + ansiReset;
      if (n.detail) line += ' ' + ansiDim + '(' + n.detail + ')' + ansiReset;
      break;
    }
    case 2: {
      line = indent + '    ├── ' + ansiYellow + n.label + ansiReset;
      if (n.detail) {
        const dc = detailColor(n.detail);
        line += ' ' + dc + '(' + n.detail + ')' + ansiReset;
      }
      break;
    }
  }

  // Truncate then pad to exactly cols visible characters
  const raw = stripAnsi(line);
  if (raw.length > cols) {
    line = truncate(line, cols);
  }
  const rawLen = stripAnsi(line).length;
  if (rawLen < cols) {
    line += ' '.repeat(cols - rawLen);
  }
  return line;
}

function buildDetailLines(n: Node, cols: number): string[] {
  const lines: string[] = [];

  if (Object.keys(n.metadata).length > 0) {
    lines.push(ansiBold + 'Metadata' + ansiReset);
    const keys = Object.keys(n.metadata).sort();
    for (const k of keys) {
      lines.push('  ' + ansiCyan + k + ansiReset + ': ' + n.metadata[k]);
    }
    lines.push('');
  }

  if (n.description) {
    lines.push(ansiBold + 'Description' + ansiReset);
    lines.push('  ' + ansiDim + n.description + ansiReset);
    lines.push('');
  }

  if (n.content) {
    lines.push(ansiBold + 'Content' + ansiReset);
    lines.push('─'.repeat(cols));
    for (const l of n.content.split('\n')) {
      lines.push(l);
    }
  }

  if (lines.length === 0) {
    lines.push(ansiDim + 'No additional details available.' + ansiReset);
  }

  return lines;
}

function applyFilter(nodes: Node[], query: string): Node[] {
  if (!query) {
    return nodes.map(n => ({ ...n }));
  }

  const q = query.toLowerCase();
  const matched = new Array(nodes.length).fill(false);

  // Mark matching items
  for (let i = 0; i < nodes.length; i++) {
    if (
      nodes[i].label.toLowerCase().includes(q) ||
      nodes[i].detail.toLowerCase().includes(q) ||
      nodes[i].kind.toLowerCase().includes(q)
    ) {
      matched[i] = true;
    }
  }

  // Propagate up: if a child matches, mark ancestors
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (!matched[i]) continue;
    let level = nodes[i].level;
    for (let j = i - 1; j >= 0; j--) {
      if (nodes[j].level < level) {
        matched[j] = true;
        level = nodes[j].level;
        if (level === 0) break;
      }
    }
  }

  // Include children of matched parents
  for (let i = 0; i < nodes.length; i++) {
    if (!matched[i]) continue;
    if (nodes[i].children > 0) {
      for (let j = i + 1; j < nodes.length && nodes[j].level > nodes[i].level; j++) {
        matched[j] = true;
      }
    }
  }

  const result: Node[] = [];
  for (let i = 0; i < nodes.length; i++) {
    if (matched[i]) {
      result.push({ ...nodes[i], expanded: true });
    }
  }

  // Recount children for filtered set
  for (let i = 0; i < result.length; i++) {
    if (result[i].children > 0) {
      let count = 0;
      for (let j = i + 1; j < result.length && result[j].level > result[i].level; j++) {
        if (result[j].level === result[i].level + 1) count++;
      }
      result[i].children = count;
    }
  }

  return result;
}

export async function runTUI(results: ScopeResult[]): Promise<void> {
  const nodes = buildNodes(results);
  if (nodes.length === 0) {
    console.log('No configuration found.');
    return;
  }

  const restore = enableRawMode();
  hideCursor();

  const cleanup = () => {
    showCursor();
    restore();
  };

  try {
    let cursor = 0;
    let scrollOff = 0;
    let searchMode = false;
    let searchQuery = '';
    let filteredNodes = nodes.map(n => ({ ...n }));
    let detailMode = false;
    let detailScroll = 0;
    let detailLines: string[] | null = null;
    let detailNode: Node | null = null;

    while (true) {
      const { rows, cols } = getTermSize();
      const headerLines = 2;
      const footerLines = 1;
      let bodyLines = rows - headerLines - footerLines;
      if (bodyLines < 1) bodyLines = 1;

      clearScreen();
      moveCursor(1, 1);

      if (detailMode && detailNode) {
        // Detail view
        const header = ansiBold + ansiYellow + detailNode.label + ansiReset + '  ' +
          ansiDim + detailNode.kind + ansiReset;
        process.stdout.write(truncate(header, cols));
        moveCursor(2, 1);
        process.stdout.write('─'.repeat(cols));

        if (!detailLines) {
          detailLines = buildDetailLines(detailNode, cols);
        }

        let maxScroll = detailLines.length - bodyLines;
        if (maxScroll < 0) maxScroll = 0;
        if (detailScroll > maxScroll) detailScroll = maxScroll;
        if (detailScroll < 0) detailScroll = 0;

        for (let i = 0; i < bodyLines; i++) {
          const li = detailScroll + i;
          moveCursor(headerLines + i + 1, 1);
          if (li < detailLines.length) {
            process.stdout.write(truncate(detailLines[li], cols));
            const rawLen = stripAnsi(detailLines[li]).length;
            if (rawLen < cols) process.stdout.write(' '.repeat(cols - rawLen));
          } else {
            process.stdout.write(' '.repeat(cols));
          }
        }

        moveCursor(rows, 1);
        const footer = ansiDim + ' [↑↓ scroll] [u/d page] [esc back]' + ansiReset;
        process.stdout.write(truncate(footer, cols));

        const key = await readKey();
        switch (key) {
          case 27: case 113: // Esc or q
            detailMode = false;
            detailLines = null;
            detailNode = null;
            detailScroll = 0;
            break;
          case KEY_UP: case 107: // k
            if (detailScroll > 0) detailScroll--;
            break;
          case KEY_DOWN: case 106: // j
            detailScroll++;
            break;
          case KEY_PGUP: case 117: // u
            detailScroll -= bodyLines;
            if (detailScroll < 0) detailScroll = 0;
            break;
          case KEY_PGDOWN: case 100: // d
            detailScroll += bodyLines;
            break;
          case KEY_HOME:
            detailScroll = 0;
            break;
          case KEY_END:
            detailScroll = detailLines ? detailLines.length : 0;
            break;
          case 3: // Ctrl-C
            clearScreen();
            moveCursor(1, 1);
            return;
        }
        continue;
      }

      const vis = visibleNodes(filteredNodes);

      // Clamp cursor
      if (cursor >= vis.length) cursor = vis.length - 1;
      if (cursor < 0) cursor = 0;

      // Adjust scroll
      if (cursor < scrollOff) scrollOff = cursor;
      if (cursor >= scrollOff + bodyLines) scrollOff = cursor - bodyLines + 1;

      // Header
      const header = ansiBold + ansiCyan + 'inspect-claude' + ansiReset + '  ' +
        ansiDim + '[↑↓ navigate] [u/d page] [enter view/expand] [/ search] [q quit]' + ansiReset;
      process.stdout.write(truncate(header, cols));
      moveCursor(2, 1);
      process.stdout.write('─'.repeat(cols));

      // Body
      for (let i = 0; i < bodyLines; i++) {
        const vi = scrollOff + i;
        moveCursor(headerLines + i + 1, 1);
        if (vi >= vis.length) {
          process.stdout.write(' '.repeat(cols));
          continue;
        }
        const idx = vis[vi];
        const n = filteredNodes[idx];
        let line = renderNode(n, cols);
        if (vi === cursor) {
          line = ansiReverse + line + ansiReset;
        }
        process.stdout.write(line);
      }

      // Footer
      moveCursor(rows, 1);
      if (searchMode) {
        const footer = ansiBold + '/' + searchQuery + ansiReset + ansiDim + '  (esc to cancel)' + ansiReset;
        process.stdout.write(truncate(footer, cols));
      } else {
        let status = ` ${cursor + 1}/${vis.length} items`;
        if (searchQuery) status += `  filter: "${searchQuery}"`;
        process.stdout.write(ansiDim + truncate(status, cols) + ansiReset);
      }

      // Input
      const key = await readKey();

      if (searchMode) {
        switch (key) {
          case 27: // ESC
            searchMode = false;
            break;
          case 127: case 8: // Backspace
            if (searchQuery.length > 0) {
              searchQuery = searchQuery.slice(0, -1);
              filteredNodes = applyFilter(nodes, searchQuery);
              cursor = 0;
              scrollOff = 0;
            }
            break;
          case 13: // Enter
            searchMode = false;
            break;
          default:
            if (key >= 32 && key < 127) {
              searchQuery += String.fromCharCode(key);
              filteredNodes = applyFilter(nodes, searchQuery);
              cursor = 0;
              scrollOff = 0;
            }
        }
        continue;
      }

      switch (key) {
        case 113: case 3: // q or Ctrl-C
          clearScreen();
          moveCursor(1, 1);
          return;
        case 27: // ESC
          if (searchQuery) {
            searchQuery = '';
            filteredNodes = nodes.map(n => ({ ...n }));
            cursor = 0;
            scrollOff = 0;
          } else {
            clearScreen();
            moveCursor(1, 1);
            return;
          }
          break;
        case 47: // /
          searchMode = true;
          searchQuery = '';
          break;
        case KEY_UP: case 107: // k
          if (cursor > 0) cursor--;
          break;
        case KEY_DOWN: case 106: // j
          if (cursor < vis.length - 1) cursor++;
          break;
        case KEY_PGUP: case 117: // u
          cursor -= bodyLines;
          if (cursor < 0) cursor = 0;
          break;
        case KEY_PGDOWN: case 100: // d
          cursor += bodyLines;
          if (cursor >= vis.length) cursor = vis.length - 1;
          break;
        case KEY_HOME:
          cursor = 0;
          break;
        case KEY_END:
          cursor = vis.length - 1;
          break;
        case 13: case KEY_RIGHT: // Enter or Right
          if (vis.length > 0 && cursor < vis.length) {
            const idx = vis[cursor];
            const n = filteredNodes[idx];
            if (n.children > 0) {
              filteredNodes[idx].expanded = !filteredNodes[idx].expanded;
            } else if (n.level === 2 && (n.description || Object.keys(n.metadata).length > 0 || n.content)) {
              detailMode = true;
              detailScroll = 0;
              detailLines = null;
              detailNode = n;
            }
          }
          break;
        case KEY_LEFT: // collapse
          if (vis.length > 0 && cursor < vis.length) {
            const idx = vis[cursor];
            const n = filteredNodes[idx];
            if (n.children > 0 && n.expanded) {
              filteredNodes[idx].expanded = false;
            } else if (n.level > 0) {
              for (let ci = cursor - 1; ci >= 0; ci--) {
                const pidx = vis[ci];
                if (filteredNodes[pidx].level < n.level) {
                  cursor = ci;
                  break;
                }
              }
            }
          }
          break;
      }
    }
  } finally {
    cleanup();
  }
}
