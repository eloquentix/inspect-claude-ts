import type { ComponentGroup, Item, Paths, Scanner, Scope } from '../types.js';
import { readJSON, settingsFileForScope } from './utils.js';

export class PermissionsScanner implements Scanner {
  kind() { return 'Permissions' as const; }
  scopes() { return ['user', 'project', 'local'] as const; }

  async scan(scope: Scope, paths: Paths): Promise<ComponentGroup | null> {
    const file = settingsFileForScope(scope, paths);
    if (!file) return null;

    const raw = await readJSON(file);
    if (!raw) return null;

    const perms = raw['permissions'] as { allow?: string[]; deny?: string[] } | undefined;
    if (!perms) return null;

    const items: Item[] = [];
    for (const rule of perms.allow || []) {
      items.push({ name: rule, detail: 'allow' });
    }
    for (const rule of perms.deny || []) {
      items.push({ name: rule, detail: 'deny' });
    }

    if (items.length === 0) return null;
    return { kind: 'Permissions', items };
  }
}
