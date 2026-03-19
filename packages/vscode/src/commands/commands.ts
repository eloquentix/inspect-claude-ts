import * as vscode from 'vscode';
import { homedir } from 'node:os';
import type { ComponentKind } from '@inspect-claude/core';
import type { InspectClaudeProvider } from '../providers/tree-provider.js';
import type { TreeNode } from '../providers/tree-items.js';

const ALL_KINDS: ComponentKind[] = [
  'MCP Servers', 'Skills', 'Plugins', 'Hooks', 'Rules', 'Agents',
  'Settings', 'LSP', 'Commands', 'CLAUDE.md', 'Memory',
  'Permissions', 'Allowed Tools', 'File Access',
];

interface KindPickItem extends vscode.QuickPickItem {
  componentKind: ComponentKind | null;
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

    vscode.commands.registerCommand('inspectClaude.filter', async () => {
      const items: KindPickItem[] = [
        { label: '(Show All)', componentKind: null },
        ...ALL_KINDS.map(k => ({ label: k, componentKind: k as ComponentKind })),
      ];
      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Filter by component kind',
      });
      if (picked) {
        provider.setKindFilter(picked.componentKind ? [picked.componentKind] : null);
      }
    }),
  );
}
