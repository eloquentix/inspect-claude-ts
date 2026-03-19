export type Scope = 'managed' | 'user' | 'project' | 'local';

export type ComponentKind =
  | 'MCP Servers'
  | 'Skills'
  | 'Plugins'
  | 'Hooks'
  | 'Rules'
  | 'Agents'
  | 'Settings'
  | 'LSP'
  | 'Commands'
  | 'CLAUDE.md'
  | 'Memory'
  | 'Permissions'
  | 'Allowed Tools'
  | 'File Access';

export interface Item {
  name: string;
  detail?: string;
  description?: string;
  metadata?: Record<string, string>;
  content?: string;
}

export interface ComponentGroup {
  kind: ComponentKind;
  items: Item[];
  source?: string;
}

export interface ScopeResult {
  scope: Scope;
  label: string;
  path: string;
  groups: ComponentGroup[];
}

export interface Paths {
  managedDir: string;
  userDir: string;
  userJSON: string;
  projectRoot: string;
  projectDir: string;
  projectMCP: string;
}

export interface Scanner {
  kind(): ComponentKind;
  scopes(): readonly Scope[];
  scan(scope: Scope, paths: Paths): Promise<ComponentGroup | null>;
}
