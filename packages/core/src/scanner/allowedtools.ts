import type { ComponentGroup, Paths, Scanner, Scope } from '../types.js';
import { readJSON, settingsFileForScope } from './utils.js';

export class AllowedToolsScanner implements Scanner {
  kind() { return 'Allowed Tools' as const; }
  scopes() { return ['user', 'project', 'local'] as const; }

  async scan(scope: Scope, paths: Paths): Promise<ComponentGroup | null> {
    const file = settingsFileForScope(scope, paths);
    if (!file) return null;

    const raw = await readJSON(file);
    if (!raw) return null;

    const tools = raw['allowedTools'] as string[] | undefined;
    if (!Array.isArray(tools) || tools.length === 0) return null;

    const items = tools.map(tool => ({ name: tool }));
    return { kind: 'Allowed Tools', items };
  }
}
