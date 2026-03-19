import type { Paths, Scope, ScopeResult } from '../types.js';
import { All } from '../scanner/scanner.js';

interface ScopeDef {
  scope: Scope;
  label: string;
  path: string;
}

/**
 * Runs all scanners across all scopes and returns the results.
 */
export async function collectResults(
  paths: Paths,
  options?: { kindTokens?: string[]; scopes?: Scope[] },
): Promise<ScopeResult[]> {
  const allScopes: ScopeDef[] = [
    { scope: 'managed', label: `Managed (${paths.managedDir})`, path: paths.managedDir },
    { scope: 'user', label: 'User (~/.claude)', path: paths.userDir },
    { scope: 'project', label: `Project (${paths.projectRoot})`, path: paths.projectRoot },
    { scope: 'local', label: 'Local (.claude/settings.local.json)', path: paths.projectDir },
  ];

  const scopeFilter = options?.scopes;
  const kindTokens = options?.kindTokens;

  const scopes = scopeFilter
    ? allScopes.filter(sd => scopeFilter.includes(sd.scope))
    : allScopes;

  const results: ScopeResult[] = [];

  for (const sd of scopes) {
    if (!sd.path) continue;

    const sr: ScopeResult = {
      scope: sd.scope,
      label: sd.label,
      path: sd.path,
      groups: [],
    };

    // Run scanners for this scope in parallel
    const promises = All
      .filter(sc => sc.scopes().includes(sd.scope))
      .filter(sc => !kindTokens || kindTokens.length === 0 || kindMatch(sc.kind(), kindTokens))
      .map(async sc => {
        try {
          return await sc.scan(sd.scope, paths);
        } catch {
          return null;
        }
      });

    const groups = await Promise.all(promises);
    for (const g of groups) {
      if (g) sr.groups.push(g);
    }

    results.push(sr);
  }

  return results;
}

function kindMatch(kind: string, tokens: string[]): boolean {
  const lower = kind.toLowerCase();
  return tokens.some(tok => lower.includes(tok));
}
