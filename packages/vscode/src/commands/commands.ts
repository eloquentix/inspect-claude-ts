import * as vscode from 'vscode';
import { homedir } from 'node:os';
import type { ComponentKind, Scope } from '@inspect-claude/core';
import type { InspectClaudeProvider } from '../providers/tree-provider.js';
import type { TreeNode } from '../providers/tree-items.js';
import { showDetailPanel } from '../panels/detail-panel.js';

const ALL_KINDS: ComponentKind[] = [
  'MCP Servers', 'Skills', 'Plugins', 'Hooks', 'Rules', 'Agents',
  'Settings', 'LSP', 'Commands', 'CLAUDE.md', 'Memory',
  'Permissions', 'Allowed Tools', 'File Access',
];

const ALL_SCOPES: { label: string; scope: Scope }[] = [
  { label: 'Managed', scope: 'managed' },
  { label: 'User', scope: 'user' },
  { label: 'Project', scope: 'project' },
  { label: 'Local', scope: 'local' },
];

interface KindPickItem extends vscode.QuickPickItem {
  componentKind: ComponentKind;
}

interface ScopePickItem extends vscode.QuickPickItem {
  scope: Scope;
}

export function registerCommands(
  context: vscode.ExtensionContext,
  provider: InspectClaudeProvider,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('inspectClaude.refresh', () => {
      provider.refresh();
    }),

    vscode.commands.registerCommand('inspectClaude.openFile', (node: TreeNode) => {
      if (node.type === 'group' && node.group.source) {
        const source = node.group.source;
        const resolved = source.startsWith('~/')
          ? source.replace('~', homedir())
          : source;
        vscode.workspace.openTextDocument(resolved).then(
          doc => vscode.window.showTextDocument(doc),
          () => vscode.window.showWarningMessage(`Could not open: ${source}`),
        );
      }
    }),

    vscode.commands.registerCommand('inspectClaude.copyValue', (node: TreeNode) => {
      if (node.type === 'item') {
        const text = node.item.content || node.item.name;
        vscode.env.clipboard.writeText(text);
        vscode.window.showInformationMessage(`Copied: ${node.item.name}`);
      }
    }),

    vscode.commands.registerCommand('inspectClaude.showDetail', (node: TreeNode) => {
      if (node.type === 'item') {
        showDetailPanel(node.item, node.kind, node.source, context);
      }
    }),

    vscode.commands.registerCommand('inspectClaude.filter', async () => {
      const items: KindPickItem[] = ALL_KINDS.map(k => ({
        label: k,
        componentKind: k,
      }));
      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Filter by component kind (select none to show all)',
        canPickMany: true,
      });
      if (picked) {
        provider.setKindFilter(picked.length > 0 ? picked.map(p => p.componentKind) : null);
      }
    }),

    vscode.commands.registerCommand('inspectClaude.filterByScope', async () => {
      const items: ScopePickItem[] = ALL_SCOPES.map(s => ({
        label: s.label,
        scope: s.scope,
      }));
      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Filter by scope (select none to show all)',
        canPickMany: true,
      });
      if (picked) {
        provider.setScopeFilter(picked.length > 0 ? picked.map(p => p.scope) : null);
      }
    }),
  );
}
