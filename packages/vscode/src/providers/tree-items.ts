import * as vscode from 'vscode';
import type { ScopeResult, ComponentGroup, Item, Scope } from '@inspect-claude/core';

export type TreeNode =
  | { type: 'scope'; result: ScopeResult }
  | { type: 'group'; group: ComponentGroup; scope: Scope }
  | { type: 'item'; item: Item; source?: string };

function scopeIcon(s: Scope): string {
  switch (s) {
    case 'managed': return '\u{1F3E2}';
    case 'user': return '\u{1F4E6}';
    case 'project': return '\u{1F4C2}';
    case 'local': return '\u{1F512}';
    default: return '\u{1F4CB}';
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
