import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ComponentGroup, Item, Paths, Scanner, Scope } from '../types.js';
import { readJSON, settingsFileForScope } from './utils.js';

export class FileAccessScanner implements Scanner {
  kind() { return 'File Access' as const; }
  scopes() { return ['project'] as const; }

  async scan(scope: Scope, paths: Paths): Promise<ComponentGroup | null> {
    const items: Item[] = [];

    // Collect write/edit permission patterns from all settings scopes
    for (const sc of ['user', 'project', 'local'] as const) {
      const file = settingsFileForScope(sc, paths);
      if (!file) continue;

      const raw = await readJSON(file);
      if (!raw) continue;

      const perms = raw['permissions'] as { allow?: string[]; deny?: string[] } | undefined;
      if (!perms) continue;

      for (const rule of perms.allow || []) {
        const lower = rule.toLowerCase();
        if (lower.includes('write') || lower.includes('edit')) {
          items.push({ name: rule, detail: 'writable' });
        }
      }
      for (const rule of perms.deny || []) {
        const lower = rule.toLowerCase();
        if (lower.includes('write') || lower.includes('edit')) {
          items.push({ name: rule, detail: 'denied' });
        }
      }
    }

    // Parse .claudeignore
    if (paths.projectRoot) {
      try {
        const text = await readFile(join(paths.projectRoot, '.claudeignore'), 'utf8');
        for (const line of text.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            items.push({ name: trimmed, detail: 'ignored' });
          }
        }
      } catch { /* ignore */ }
    }

    if (items.length === 0) return null;
    return { kind: 'File Access', items };
  }
}
