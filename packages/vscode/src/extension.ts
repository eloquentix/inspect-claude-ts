import * as vscode from 'vscode';
import { InspectClaudeProvider } from './providers/tree-provider.js';
import { createConfigWatchers } from './watchers/config-watcher.js';
import { registerCommands } from './commands/commands.js';

export function activate(context: vscode.ExtensionContext): void {
  const provider = new InspectClaudeProvider();

  const treeView = vscode.window.createTreeView('inspectClaude', {
    treeDataProvider: provider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  createConfigWatchers(context, () => provider.refresh());
  registerCommands(context, provider);
}

export function deactivate(): void {
  // cleanup if needed
}
