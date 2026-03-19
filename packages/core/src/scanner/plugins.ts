import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ComponentGroup, Item, Paths, Scanner, Scope } from '../types.js';

interface PluginInstallation {
  scope?: string;
  installPath?: string;
  version?: string;
  installedAt?: string;
  lastUpdated?: string;
  gitCommitSha?: string;
}

interface InstalledPluginsV2 {
  version: number;
  plugins: Record<string, PluginInstallation[]>;
}

interface MarketplaceEntry {
  source: { source: string; repo?: string; path?: string };
  installLocation?: string;
  lastUpdated?: string;
}

export class PluginsScanner implements Scanner {
  kind() { return 'Plugins' as const; }
  scopes() { return ['user'] as const; }

  async scan(scope: Scope, paths: Paths): Promise<ComponentGroup | null> {
    if (scope !== 'user' || !paths.userDir) return null;

    const pluginsDir = join(paths.userDir, 'plugins');

    // Load blocklist
    const blocklist = new Map<string, string>();
    try {
      const data = JSON.parse(await readFile(join(pluginsDir, 'blocklist.json'), 'utf8'));
      for (const b of data.plugins || []) {
        blocklist.set(b.plugin, b.reason || b.text || '');
      }
    } catch { /* ignore */ }

    // Load enabled plugins from settings
    const enabled = new Set<string>();
    try {
      const settings = JSON.parse(await readFile(join(paths.userDir, 'settings.json'), 'utf8'));
      if (Array.isArray(settings.enabledPlugins)) {
        for (const p of settings.enabledPlugins) enabled.add(p);
      }
    } catch { /* ignore */ }

    const items: Item[] = [];

    // Read installed plugins
    try {
      const raw = await readFile(join(pluginsDir, 'installed_plugins.json'), 'utf8');
      const parsed = JSON.parse(raw);

      if (parsed.version >= 2 && parsed.plugins) {
        // V2 format
        const v2 = parsed as InstalledPluginsV2;
        const names = Object.keys(v2.plugins).sort();

        for (const name of names) {
          const installations = v2.plugins[name];
          if (!installations || installations.length === 0) continue;
          const inst = installations[0];

          const shortName = name.includes('@') ? name.slice(0, name.indexOf('@')) : name;

          let detail: string;
          const meta: Record<string, string> = {};
          if (inst.version) meta['version'] = inst.version;
          if (inst.installedAt) meta['installedAt'] = inst.installedAt;
          if (inst.lastUpdated) meta['lastUpdated'] = inst.lastUpdated;

          let content = '';
          if (inst.installPath) content = inst.installPath;
          if (inst.gitCommitSha) {
            if (content) content += '\n';
            content += 'sha: ' + inst.gitCommitSha;
          }

          if (blocklist.has(name)) {
            detail = '\u26a0 blocked';
            const reason = blocklist.get(name);
            if (reason) meta['reason'] = reason;
          } else if (!enabled.has(shortName) && !enabled.has(name)) {
            detail = '\u2717 disabled';
          } else {
            detail = '\u2713 enabled';
          }

          items.push({ name, detail, metadata: Object.keys(meta).length > 0 ? meta : undefined, content: content || undefined });
        }
      } else {
        // Legacy v1 array format
        const plugins = Array.isArray(parsed) ? parsed : [];
        for (const p of plugins) {
          const display = p.namespace ? `${p.name}@${p.namespace}` : p.name;
          let detail: string;
          const meta: Record<string, string> = {};
          if (p.version) meta['version'] = p.version;

          if (blocklist.has(display)) {
            detail = '\u26a0 blocked';
            const reason = blocklist.get(display);
            if (reason) meta['reason'] = reason;
          } else if (!enabled.has(p.name)) {
            detail = '\u2717 disabled';
          } else {
            detail = '\u2713 enabled';
          }

          items.push({ name: display, detail, metadata: Object.keys(meta).length > 0 ? meta : undefined });
        }
      }
    } catch { /* ignore */ }

    // Read known marketplaces
    try {
      const data = JSON.parse(await readFile(join(pluginsDir, 'known_marketplaces.json'), 'utf8')) as Record<string, MarketplaceEntry>;
      const names = Object.keys(data).sort();

      for (const name of names) {
        const m = data[name];
        const detail = `marketplace (${m.source.source})`;
        const meta: Record<string, string> = {};
        if (m.source.repo) meta['repo'] = m.source.repo;
        if (m.source.path) meta['path'] = m.source.path;
        if (m.lastUpdated) meta['lastUpdated'] = m.lastUpdated;

        items.push({
          name,
          detail,
          metadata: Object.keys(meta).length > 0 ? meta : undefined,
          content: m.installLocation || undefined,
        });
      }
    } catch { /* ignore */ }

    if (items.length === 0) return null;
    return { kind: 'Plugins', items };
  }
}
