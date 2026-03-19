import { readFile, readdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { parse } from '../frontmatter/frontmatter.js';
import type { ComponentGroup, Item, Paths, Scanner, Scope } from '../types.js';
import { shortenHome } from './utils.js';

export class MemoryScanner implements Scanner {
  kind() { return 'Memory' as const; }
  scopes() { return ['user'] as const; }

  async scan(scope: Scope, paths: Paths): Promise<ComponentGroup | null> {
    if (!paths.userDir) return null;

    const projectsDir = join(paths.userDir, 'projects');
    let projectEntries: string[];
    try {
      projectEntries = await readdir(projectsDir);
    } catch {
      return null;
    }

    const items: Item[] = [];
    for (const projectName of projectEntries) {
      const memoryDir = join(projectsDir, projectName, 'memory');
      let memFiles: string[];
      try {
        memFiles = await readdir(memoryDir);
      } catch {
        continue;
      }

      for (const file of memFiles) {
        if (!file.endsWith('.md')) continue;
        if (file.toUpperCase() === 'MEMORY.MD') continue;

        const filePath = join(memoryDir, file);
        try {
          const text = await readFile(filePath, 'utf8');
          const fm = parse(text);

          const name = fm['name'] || basename(file);
          const memType = fm['type'] || '';
          const desc = fm['description'] || '';

          items.push({
            name,
            detail: memType || undefined,
            description: desc || undefined,
            metadata: { project: projectName },
          });
        } catch {
          continue;
        }
      }
    }

    if (items.length === 0) return null;
    return {
      kind: 'Memory',
      items,
      source: shortenHome(join(paths.userDir, 'projects', '*', 'memory')),
    };
  }
}
