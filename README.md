# inspect-claude

Scan and display [Claude Code](https://claude.ai/code) configuration across all scopes (managed, user, project, local).

Inspects MCP servers, skills, plugins, hooks, rules, agents, settings, LSP config, commands, CLAUDE.md files, memory, permissions, allowed tools, and file access settings.

## Packages

| Package | Description |
|---------|-------------|
| [`@inspect-claude/core`](packages/core) | Shared library — all scanning logic |
| [`inspect-claude`](packages/cli) | CLI binary with tree, JSON, and TUI output |
| [`inspect-claude-vscode`](packages/vscode) | VS Code extension with sidebar tree view |

## Installation

### CLI

```bash
npm install -g inspect-claude
```

### VS Code Extension

Build and install from source:

```bash
pnpm install && pnpm build
cd packages/vscode && make package && make install-ext
```

### Library

```bash
npm install @inspect-claude/core
```

## CLI Usage

```
inspect-claude [options]

Options:
  --json        Output as JSON
  --browse      Interactive TUI mode
  --user        Show only user scope
  --project     Show only project scope
  --kind <k>    Filter by component kind (comma-separated)
  --verbose     Show full details
  --no-color    Disable color output
```

## VS Code Extension

The extension adds an **Inspect Claude** sidebar with a tree view of all Claude Code configuration.

- **Color-coded icons** — each component kind has a distinct icon and color
- **Detail panel** — click any item to open a webview with metadata, description, and content
- **Filter by kind** — multi-select filter from the title bar
- **Filter by scope** — show only managed, user, project, or local scopes
- **Open source file** — right-click a group to open its config file
- **Copy value** — right-click an item to copy its content

## What It Inspects

MCP Servers, Skills, Plugins, Hooks, Rules, Agents, Settings, LSP, Commands, CLAUDE.md, Memory, Permissions, Allowed Tools, File Access

## Development

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm clean            # Clean all dist/ outputs
```

## License

[MIT](LICENSE)
