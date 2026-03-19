import { join } from 'node:path';
import { dirForScope } from '../config/paths.js';
import type { ComponentGroup, Paths, Scanner, Scope } from '../types.js';
import { scanMDFiles } from './utils.js';

export class RulesScanner implements Scanner {
  kind() { return 'Rules' as const; }
  scopes() { return ['user', 'project'] as const; }

  async scan(scope: Scope, paths: Paths): Promise<ComponentGroup | null> {
    const dir = dirForScope(scope, paths);
    if (!dir) return null;
    return scanMDFiles(join(dir, 'rules'), 'Rules');
  }
}
