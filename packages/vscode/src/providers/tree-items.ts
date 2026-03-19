import * as vscode from 'vscode';
import type { ScopeResult, ComponentGroup, Item, Scope, ComponentKind } from '@inspect-claude/core';

export type TreeNode =
  | { type: 'scope'; result: ScopeResult }
  | { type: 'group'; group: ComponentGroup; scope: Scope }
  | { type: 'item'; item: Item; kind: ComponentKind; source?: string };

function scopeIcon(s: Scope): string {
  switch (s) {
    case 'managed': return '\u{1F3E2}';
    case 'user': return '\u{1F4E6}';
    case 'project': return '\u{1F4C2}';
    case 'local': return '\u{1F512}';
    default: return '\u{1F4CB}';
  }
}

function kindIcon(kind: ComponentKind): vscode.ThemeIcon {
  switch (kind) {
    case 'Permissions':
      return new vscode.ThemeIcon('shield', new vscode.ThemeColor('charts.purple'));
    case 'Allowed Tools':
      return new vscode.ThemeIcon('tools', new vscode.ThemeColor('charts.blue'));
    case 'File Access':
      return new vscode.ThemeIcon('file-symlink-file', new vscode.ThemeColor('charts.yellow'));
    case 'MCP Servers':
      return new vscode.ThemeIcon('server', new vscode.ThemeColor('charts.green'));
    case 'Hooks':
      return new vscode.ThemeIcon('git-commit', new vscode.ThemeColor('charts.orange'));
    case 'Rules':
      return new vscode.ThemeIcon('law', new vscode.ThemeColor('charts.green'));
    case 'Settings':
      return new vscode.ThemeIcon('gear', new vscode.ThemeColor('charts.green'));
    case 'Skills':
      return new vscode.ThemeIcon('sparkle', new vscode.ThemeColor('charts.green'));
    case 'Plugins':
      return new vscode.ThemeIcon('plug', new vscode.ThemeColor('charts.green'));
    case 'Agents':
      return new vscode.ThemeIcon('robot', new vscode.ThemeColor('charts.green'));
    case 'LSP':
      return new vscode.ThemeIcon('json', new vscode.ThemeColor('charts.green'));
    case 'Commands':
      return new vscode.ThemeIcon('terminal', new vscode.ThemeColor('charts.green'));
    case 'CLAUDE.md':
      return new vscode.ThemeIcon('book', new vscode.ThemeColor('charts.green'));
    case 'Memory':
      return new vscode.ThemeIcon('database', new vscode.ThemeColor('charts.green'));
    default:
      return new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('charts.green'));
  }
}

export function toTreeItem(node: TreeNode): vscode.TreeItem {
  switch (node.type) {
    case 'scope': {
      const item = new vscode.TreeItem(
        `${scopeIcon(node.result.scope)} ${node.result.label}`,
        vscode.TreeItemCollapsibleState.Expanded,
      );
      item.contextValue = 'scope';
      item.tooltip = `Path: ${node.result.path}`;
      return item;
    }
    case 'group': {
      const item = new vscode.TreeItem(
        node.group.kind,
        vscode.TreeItemCollapsibleState.Expanded,
      );
      item.description = node.group.source || '';
      item.contextValue = 'group';
      item.iconPath = kindIcon(node.group.kind);
      if (node.group.source) {
        item.tooltip = `Source: ${node.group.source}`;
      }
      return item;
    }
    case 'item': {
      const treeItem = new vscode.TreeItem(
        node.item.name,
        vscode.TreeItemCollapsibleState.None,
      );
      if (node.item.detail) {
        treeItem.description = node.item.detail;
      }
      treeItem.contextValue = 'item';

      // Single-click opens detail panel
      treeItem.command = {
        command: 'inspectClaude.showDetail',
        title: 'Show Detail',
        arguments: [node],
      };

      const tooltipParts: string[] = [];
      if (node.item.description) tooltipParts.push(node.item.description);
      if (node.item.metadata) {
        for (const [k, v] of Object.entries(node.item.metadata)) {
          tooltipParts.push(`${k}: ${v}`);
        }
      }
      if (node.item.content) {
        tooltipParts.push('---');
        tooltipParts.push(node.item.content);
      }
      if (tooltipParts.length > 0) {
        treeItem.tooltip = new vscode.MarkdownString(tooltipParts.join('\n\n'));
      }

      return treeItem;
    }
  }
}
