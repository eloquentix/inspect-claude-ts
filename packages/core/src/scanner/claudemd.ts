import { readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { ComponentGroup, Item, Paths, Scanner, Scope } from '../types.js';
import { shortenHome } from './utils.js';

export class ClaudeMDScanner implements Scanner {
  kind() { return 'CLAUDE.md' as const; }
  scopes() { return ['user', 'project'] as const; }

  async scan(scope: Scope, paths: Paths): Promise<ComponentGroup | null> {
    const candidates: string[] = [];

    switch (scope) {
      case 'user':
        if (paths.userDir) candidates.push(join(paths.userDir, 'CLAUDE.md'));
        break;
      case 'project':
        if (!paths.projectRoot) return null;
        candidates.push(
          join(paths.projectRoot, 'CLAUDE.md'),
          join(paths.projectRoot, '.claude', 'CLAUDE.md'),
        );
        // Walk parent directories, up to 5 levels
        let dir = dirname(paths.projectRoot);
        for (let i = 0; i < 5 && dir !== '/' && dir !== '.'; i++) {
          candidates.push(join(dir, 'CLAUDE.md'));
          const parent = dirname(dir);
          if (parent === dir) break;
          dir = parent;
        }
        break;
      default:
        return null;
    }

    const items: Item[] = [];
    for (const path of candidates) {
      try {
        await stat(path);
      } catch {
        continue;
      }
      const { lines, firstLine } = await countAndFirstLine(path);
      const item: Item = {
        name: shortenHome(path),
        detail: `${lines} lines`,
      };
      if (firstLine) item.description = firstLine;
      items.push(item);
    }

    if (items.length === 0) return null;
    return { kind: 'CLAUDE.md', items };
  }
}

async function countAndFirstLine(path: string): Promise<{ lines: number; firstLine: string }> {
  try {
    const text = await readFile(path, 'utf8');
    const allLines = text.split('\n');
    let firstLine = '';
    for (const line of allLines) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#')) continue;
      firstLine = trimmed.length > 80 ? trimmed.slice(0, 80) : trimmed;
      break;
    }
    return { lines: allLines.length, firstLine };
  } catch {
    return { lines: 0, firstLine: '' };
  }
}
