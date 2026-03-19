import type { ComponentGroup, Item, Paths, Scanner, Scope } from '../types.js';
import { readJSON, settingsFileForScope } from './utils.js';

interface HookEntry {
  type?: string;
  command?: string;
  timeout?: number;
  matcher?: string;
  hooks?: HookEntry[];
}

export class HooksScanner implements Scanner {
  kind() { return 'Hooks' as const; }
  scopes() { return ['user', 'project', 'local'] as const; }

  async scan(scope: Scope, paths: Paths): Promise<ComponentGroup | null> {
    const file = settingsFileForScope(scope, paths);
    if (!file) return null;

    const raw = await readJSON(file);
    if (!raw) return null;

    const hooks = raw['hooks'] as Record<string, HookEntry[]> | undefined;
    if (!hooks || typeof hooks !== 'object') return null;

    const items: Item[] = [];
    for (const [event, hookData] of Object.entries(hooks)) {
      if (!Array.isArray(hookData)) continue;
      for (const entry of hookData) {
        if (entry.hooks && entry.hooks.length > 0) {
          for (const inner of entry.hooks) {
            items.push(hookToItem(event, entry.matcher || '', inner));
          }
        } else {
          items.push(hookToItem(event, '', entry));
        }
      }
    }

    if (items.length === 0) return null;
    return { kind: 'Hooks', items };
  }
}

function hookToItem(event: string, matcher: string, h: HookEntry): Item {
  let detail = h.command || '';
  if (detail.length > 50) detail = detail.slice(0, 47) + '...';

  const meta: Record<string, string> = {};
  if (h.type) meta['type'] = h.type;
  if (matcher) meta['matcher'] = matcher;
  if (h.timeout && h.timeout > 0) meta['timeout'] = `${h.timeout}ms`;

  return {
    name: event,
    detail,
    content: h.command || undefined,
    metadata: Object.keys(meta).length > 0 ? meta : undefined,
  };
}
