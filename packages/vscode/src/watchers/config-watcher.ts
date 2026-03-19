import * as vscode from 'vscode';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Creates file system watchers for Claude Code config files and triggers
 * the refresh callback when changes are detected.
 */
export function createConfigWatchers(
  context: vscode.ExtensionContext,
  onRefresh: () => void,
): void {
  const home = homedir();

  // Watch patterns
  const patterns = [
    new vscode.RelativePattern(join(home, '.claude'), '**/*'),
    new vscode.RelativePattern(join(home), '.claude.json'),
  ];

  // Add workspace-relative patterns
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (workspaceRoot) {
    patterns.push(
      new vscode.RelativePattern(workspaceRoot, '.claude/**/*'),
      new vscode.RelativePattern(workspaceRoot, '.mcp.json'),
      new vscode.RelativePattern(workspaceRoot, 'CLAUDE.md'),
      new vscode.RelativePattern(workspaceRoot, '.claudeignore'),
    );
  }

  for (const pattern of patterns) {
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);
    watcher.onDidChange(onRefresh);
    watcher.onDidCreate(onRefresh);
    watcher.onDidDelete(onRefresh);
    context.subscriptions.push(watcher);
  }
}
