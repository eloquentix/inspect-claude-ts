import { join } from 'node:path';
import { dirForScope } from '../config/paths.js';
import type { ComponentGroup, Paths, Scanner, Scope } from '../types.js';
import { scanMDFiles } from './utils.js';

export class CommandsScanner implements Scanner {
  kind() { return 'Commands' as const; }
  scopes() { return ['user', 'project'] as const; }

  async scan(scope: Scope, paths: Paths): Promise<ComponentGroup | null> {
    const dir = dirForScope(scope, paths);
    if (!dir) return null;
    return scanMDFiles(join(dir, 'commands'), 'Commands');
  }
}
