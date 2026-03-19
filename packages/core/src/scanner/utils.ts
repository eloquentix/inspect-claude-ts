import { readFile, readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { homedir } from 'node:os';
import { relative } from 'node:path';
import { parseFull } from '../frontmatter/frontmatter.js';
import type { ComponentGroup, ComponentKind, Item, Paths, Scope } from '../types.js';

/**
 * Returns the settings file path for a given scope.
 */
export function settingsFileForScope(scope: Scope, paths: Paths): string {
  switch (scope) {
    case 'user':
      return paths.userDir ? join(paths.userDir, 'settings.json') : '';
    case 'project':
      return paths.projectDir ? join(paths.projectDir, 'settings.json') : '';
    case 'local':
      return paths.projectDir ? join(paths.projectDir, 'settings.local.json') : '';
    default:
      return '';
  }
}

/**
 * Reads and parses a JSON file, returning null on any error.
 */
export async function readJSON(file: string): Promise<Record<string, unknown> | null> {
  if (!file) return null;
  try {
    const data = await readFile(file, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Scans a directory for .md files and returns a ComponentGroup.
 * Parses frontmatter for description and metadata.
 */
export async function scanMDFiles(dir: string, kind: ComponentKind): Promise<ComponentGroup | null> {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }

  const items: Item[] = [];
  for (const e of entries) {
    if (e.isDirectory() || extname(e.name) !== '.md') continue;
    const name = basename(e.name, '.md');
    const item: Item = { name };

    try {
      const text = await readFile(join(dir, e.name), 'utf8');
      const res = parseFull(text);
      if (res.meta['description']) {
        item.detail = res.meta['description'];
      }
      const meta: Record<string, string> = {};
      for (const [k, v] of Object.entries(res.meta)) {
        if (k !== 'description') meta[k] = v;
      }
      if (Object.keys(meta).length > 0) item.metadata = meta;
      if (res.body) item.content = res.body;
    } catch {
      // ignore
    }

    items.push(item);
  }

  if (items.length === 0) return null;
  return { kind, items };
}

/**
 * Simple glob: returns files matching an extension in a directory.
 */
export async function globDir(dir: string, ext: string): Promise<string[]> {
  try {
    const entries = await readdir(dir);
    return entries.filter(f => f.endsWith(ext)).map(f => join(dir, f));
  } catch {
    return [];
  }
}

/**
 * Replaces home dir prefix with ~
 */
export function shortenHome(p: string): string {
  const home = homedir();
  if (home) {
    const rel = relative(home, p);
    if (rel.length < p.length && !rel.startsWith('..')) {
      return '~/' + rel;
    }
  }
  return p;
}
