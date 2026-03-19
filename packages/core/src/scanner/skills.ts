import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { dirForScope } from '../config/paths.js';
import { parseFull } from '../frontmatter/frontmatter.js';
import type { ComponentGroup, Item, Paths, Scanner, Scope } from '../types.js';
import { globDir } from './utils.js';

export class SkillsScanner implements Scanner {
  kind() { return 'Skills' as const; }
  scopes() { return ['user', 'project'] as const; }

  async scan(scope: Scope, paths: Paths): Promise<ComponentGroup | null> {
    const dir = dirForScope(scope, paths);
    if (!dir) return null;
    const skillsDir = join(dir, 'skills');

    let entries: import('node:fs').Dirent[];
    try {
      entries = await readdir(skillsDir, { withFileTypes: true });
    } catch {
      return null;
    }

    const items: Item[] = [];

    // Skill directories with SKILL.md
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const item = await parseSkillFile(join(skillsDir, e.name, 'SKILL.md'), e.name);
      items.push(item);
    }

    // Standalone .md files
    const mdFiles = await globDir(skillsDir, '.md');
    for (const p of mdFiles) {
      const name = basename(p, '.md');
      const item = await parseSkillFile(p, name);
      items.push(item);
    }

    if (items.length === 0) return null;
    return { kind: 'Skills', items };
  }
}

async function parseSkillFile(path: string, name: string): Promise<Item> {
  const item: Item = { name };
  try {
    const text = await readFile(path, 'utf8');
    const res = parseFull(text);
    if (res.meta['description']) item.description = res.meta['description'];
    const meta: Record<string, string> = {};
    for (const [k, v] of Object.entries(res.meta)) {
      if (k !== 'description') meta[k] = v;
    }
    if (Object.keys(meta).length > 0) item.metadata = meta;
    if (res.body) item.content = res.body;
  } catch {
    // missing file
  }
  return item;
}
