import type { ComponentGroup, Item, Paths, Scanner, Scope } from '../types.js';
import { readJSON, settingsFileForScope } from './utils.js';

const interestingKeys = [
  'model', 'env', 'customApiKeyResponses',
  'apiKeyHelper', 'hasTrustDialogAccepted', 'autoUpdaterStatus',
  'preferredNotifChannel',
];

export class SettingsScanner implements Scanner {
  kind() { return 'Settings' as const; }
  scopes() { return ['user', 'project', 'local'] as const; }

  async scan(scope: Scope, paths: Paths): Promise<ComponentGroup | null> {
    const file = settingsFileForScope(scope, paths);
    if (!file) return null;

    const raw = await readJSON(file);
    if (!raw) return null;

    const items: Item[] = [];
    for (const key of interestingKeys) {
      if (!(key in raw)) continue;
      const display = formatSettingValue(key, raw[key]);
      if (display) items.push({ name: display });
    }

    if (items.length === 0) return null;
    return { kind: 'Settings', items };
  }
}

function formatSettingValue(key: string, val: unknown): string {
  if (typeof val === 'string') {
    return `${key}: ${val}`;
  }
  if (Array.isArray(val) && val.length > 0 && val.every(v => typeof v === 'string')) {
    return `${key}: [${val.join(', ')}]`;
  }
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const parts = Object.entries(val as Record<string, string>).map(([k, v]) => `${k}=${v}`);
    if (parts.length > 0) return `${key}: [${parts.join(', ')}]`;
  }
  if (typeof val === 'boolean') {
    return `${key}: ${val}`;
  }
  return '';
}
