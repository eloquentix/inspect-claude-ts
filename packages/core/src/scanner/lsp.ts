import { join } from 'node:path';
import type { ComponentGroup, Item, Paths, Scanner, Scope } from '../types.js';
import { readJSON } from './utils.js';

interface LSPEntry {
  command: string;
  args?: string[];
  extensionToLanguage?: Record<string, string>;
}

export class LSPScanner implements Scanner {
  kind() { return 'LSP' as const; }
  scopes() { return ['user'] as const; }

  async scan(scope: Scope, paths: Paths): Promise<ComponentGroup | null> {
    if (scope !== 'user' || !paths.userDir) return null;

    const raw = await readJSON(join(paths.userDir, 'lsp.json'));
    if (!raw) return null;

    const lspMap = raw as Record<string, LSPEntry>;
    const langs = Object.keys(lspMap).sort();

    const items: Item[] = [];
    for (const lang of langs) {
      const cfg = lspMap[lang];
      if (!cfg || typeof cfg !== 'object' || !cfg.command) continue;

      const meta: Record<string, string> = {};

      if (cfg.extensionToLanguage && Object.keys(cfg.extensionToLanguage).length > 0) {
        const exts = Object.entries(cfg.extensionToLanguage)
          .map(([ext, langName]) => `${ext} → ${langName}`)
          .sort();
        meta['extensions'] = exts.join(', ');
      }

      if (cfg.args && cfg.args.length > 0) {
        meta['args'] = cfg.args.join(' ');
      }

      let content: string | undefined;
      if (cfg.args && cfg.args.length > 0) {
        content = cfg.command + ' ' + cfg.args.join(' ');
      }

      items.push({
        name: lang,
        detail: cfg.command,
        metadata: Object.keys(meta).length > 0 ? meta : undefined,
        content,
      });
    }

    if (items.length === 0) return null;
    return { kind: 'LSP', items };
  }
}
