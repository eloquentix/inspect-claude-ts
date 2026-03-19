import { execSync } from 'node:child_process';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import type { Paths, Scope } from '../types.js';

/**
 * Resolve computes all Claude Code configuration paths.
 * Optionally accepts a projectRoot override (used by VS Code extension).
 */
export function resolve(projectRootOverride?: string): Paths {
  // Managed directory
  const managedDir = platform() === 'darwin'
    ? '/Library/Application Support/ClaudeCode'
    : '/etc/claude-code';

  // User directory
  const home = homedir();
  const userDir = home ? join(home, '.claude') : '';
  const userJSON = home ? join(home, '.claude.json') : '';

  // Project root: use override, try git, fall back to cwd
  const projectRoot = projectRootOverride || detectProjectRoot();
  const projectDir = projectRoot ? join(projectRoot, '.claude') : '';
  const projectMCP = projectRoot ? join(projectRoot, '.mcp.json') : '';

  return { managedDir, userDir, userJSON, projectRoot, projectDir, projectMCP };
}

function detectProjectRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  } catch {
    return process.cwd();
  }
}

/**
 * Returns the base directory for a given scope.
 */
export function dirForScope(scope: Scope, paths: Paths): string {
  switch (scope) {
    case 'managed': return paths.managedDir;
    case 'user': return paths.userDir;
    case 'project': return paths.projectDir;
    case 'local': return paths.projectDir;
  }
}
