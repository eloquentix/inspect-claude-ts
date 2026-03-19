import type { ScopeResult } from '../types.js';

export function renderJSON(results: ScopeResult[]): string {
  const nonEmpty = results.filter(r => r.groups.length > 0);
  return JSON.stringify(nonEmpty, null, 2) + '\n';
}
