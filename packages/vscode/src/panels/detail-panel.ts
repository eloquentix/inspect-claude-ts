import * as vscode from 'vscode';
import type { Item, ComponentKind } from '@inspect-claude/core';

let currentPanel: vscode.WebviewPanel | undefined;

export function showDetailPanel(
  item: Item,
  kind: ComponentKind,
  source: string | undefined,
  context: vscode.ExtensionContext,
): void {
  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.Beside);
  } else {
    currentPanel = vscode.window.createWebviewPanel(
      'inspectClaude.detail',
      item.name,
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: false },
    );
    currentPanel.onDidDispose(() => {
      currentPanel = undefined;
    }, null, context.subscriptions);
  }

  currentPanel.title = item.name;
  currentPanel.webview.html = buildHtml(item, kind, source);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(item: Item, kind: ComponentKind, source: string | undefined): string {
  const metaRows: string[] = [];
  metaRows.push(`<tr><td class="key">Kind</td><td>${escapeHtml(kind)}</td></tr>`);
  if (source) {
    metaRows.push(`<tr><td class="key">Source</td><td>${escapeHtml(source)}</td></tr>`);
  }
  if (item.detail) {
    metaRows.push(`<tr><td class="key">Detail</td><td>${escapeHtml(item.detail)}</td></tr>`);
  }
  if (item.metadata) {
    for (const [k, v] of Object.entries(item.metadata)) {
      metaRows.push(`<tr><td class="key">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`);
    }
  }

  const descriptionSection = item.description
    ? `<section><h2>Description</h2><p>${escapeHtml(item.description)}</p></section>`
    : '';

  const contentSection = item.content
    ? `<section><h2>Content</h2><pre>${escapeHtml(item.content)}</pre></section>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-editor-foreground);
    background: var(--vscode-editor-background);
    padding: 16px;
    line-height: 1.5;
  }
  h1 { font-size: 1.4em; margin: 0 0 16px; }
  h2 {
    font-size: 1.1em;
    margin: 16px 0 8px;
    color: var(--vscode-descriptionForeground);
  }
  table { border-collapse: collapse; width: 100%; }
  td {
    padding: 4px 12px 4px 0;
    border-bottom: 1px solid var(--vscode-widget-border, #333);
    vertical-align: top;
  }
  .key {
    font-weight: 600;
    white-space: nowrap;
    color: var(--vscode-descriptionForeground);
  }
  pre {
    background: var(--vscode-textCodeBlock-background);
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
</head>
<body>
  <h1>${escapeHtml(item.name)}</h1>
  <section>
    <h2>Metadata</h2>
    <table>${metaRows.join('\n')}</table>
  </section>
  ${descriptionSection}
  ${contentSection}
</body>
</html>`;
}
