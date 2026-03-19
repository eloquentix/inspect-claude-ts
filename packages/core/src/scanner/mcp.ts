import type { ComponentGroup, Paths, Scanner, Scope } from '../types.js';
import { readJSON } from './utils.js';

export class MCPScanner implements Scanner {
  kind() { return 'MCP Servers' as const; }
  scopes() { return ['user', 'project'] as const; }

  async scan(scope: Scope, paths: Paths): Promise<ComponentGroup | null> {
    let file: string;
    switch (scope) {
      case 'user': file = paths.userJSON; break;
      case 'project': file = paths.projectMCP; break;
      default: return null;
    }
    if (!file) return null;

    const raw = await readJSON(file);
    if (!raw) return null;

    const servers = raw['mcpServers'] as Record<string, { type?: string; command?: string; url?: string }> | undefined;
    if (!servers || typeof servers !== 'object') return null;

    const items = Object.entries(servers).map(([name, srv]) => {
      let typ = srv.type || '';
      if (!typ) {
        if (srv.command) typ = 'stdio';
        else if (srv.url) typ = 'http';
      }
      return { name, detail: typ || undefined };
    });

    if (items.length === 0) return null;

    const source = scope === 'user' ? '~/.claude.json' : '.mcp.json';
    return { kind: 'MCP Servers', items, source };
  }
}
