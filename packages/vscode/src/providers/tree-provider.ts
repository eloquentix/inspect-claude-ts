import * as vscode from 'vscode';
import { resolve, collectResults, setColor } from '@inspect-claude/core';
import type { ScopeResult, ComponentKind, Scope } from '@inspect-claude/core';
import type { TreeNode } from './tree-items.js';
import { toTreeItem } from './tree-items.js';

export class InspectClaudeProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private results: ScopeResult[] = [];
  private kindFilter: Set<ComponentKind> | null = null;
  private scopeFilter: Set<Scope> | null = null;

  constructor() {
    // Disable color for VS Code — we use TreeItem styling instead
    setColor(false);
  }

  refresh(): void {
    this.results = [];
    this._onDidChangeTreeData.fire();
  }

  setKindFilter(kinds: ComponentKind[] | null): void {
    this.kindFilter = kinds ? new Set(kinds) : null;
    this.refresh();
  }

  setScopeFilter(scopes: Scope[] | null): void {
    this.scopeFilter = scopes ? new Set(scopes) : null;
    this.refresh();
  }

  getTreeItem(node: TreeNode): vscode.TreeItem {
    return toTreeItem(node);
  }

  async getChildren(element?: TreeNode): Promise<TreeNode[]> {
    if (!element) {
      // Root level: return scopes
      if (this.results.length === 0) {
        await this.load();
      }
      return this.results
        .filter(r => r.groups.length > 0)
        .filter(r => !this.scopeFilter || this.scopeFilter.has(r.scope))
        .map(result => ({ type: 'scope' as const, result }));
    }

    switch (element.type) {
      case 'scope': {
        let groups = element.result.groups;
        if (this.kindFilter) {
          groups = groups.filter(g => this.kindFilter!.has(g.kind));
        }
        return groups.map(group => ({
          type: 'group' as const,
          group,
          scope: element.result.scope,
        }));
      }
      case 'group':
        return element.group.items.map(item => ({
          type: 'item' as const,
          item,
          kind: element.group.kind,
          source: element.group.source,
        }));
      case 'item':
        return [];
    }
  }

  private async load(): Promise<void> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const paths = resolve(workspaceRoot);
    this.results = await collectResults(paths);
  }
}
