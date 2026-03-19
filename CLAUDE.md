# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Does

**inspect-claude** is a tool that scans and displays Claude Code configuration across all scopes (managed, user, project, local). It inspects MCP servers, skills, plugins, hooks, rules, agents, settings, LSP config, commands, CLAUDE.md files, memory, permissions, allowed tools, and file access settings. Available as a CLI, a VS Code extension, and a core library.

## Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages (via Turbo)
pnpm test             # Run all tests (via Turbo)
pnpm clean            # Clean all dist/ outputs

# Core package only
cd packages/core
pnpm test             # Run vitest
pnpm build            # Build with tsup

# Run a single test file
cd packages/core && npx vitest run __tests__/frontmatter.test.ts
```

## Architecture

Monorepo managed by **pnpm workspaces** + **Turborepo** with three packages:

- **`packages/core`** (`@inspect-claude/core`) — Shared library. All scanning logic lives here.
- **`packages/cli`** (`inspect-claude`) — CLI binary that consumes core. Supports `--json`, `--browse` (TUI), `--user`/`--project` scope filters, `--kind` filter, `--verbose`.
- **`packages/vscode`** (`inspect-claude-vscode`) — VS Code extension providing a sidebar tree view of Claude config.

### Core package structure

- **`config/paths.ts`** — `resolve()` computes all Claude Code config paths (managed, user, project dirs). `dirForScope()` maps a scope to its directory.
- **`scanner/`** — Each `*Scanner` class implements the `Scanner` interface (`kind()`, `scopes()`, `scan()`). All scanners are registered in `scanner.ts` as the `All` array.
- **`scan/collect.ts`** — `collectResults()` orchestrates: iterates scopes, runs matching scanners in parallel, collects `ComponentGroup` results.
- **`render/`** — `tree.ts` (colored text output), `json.ts` (JSON output), `color.ts` (ANSI helpers).
- **`frontmatter/`** — YAML frontmatter parser for skill/agent files.
- **`types.ts`** — Core types: `Scope`, `ComponentKind`, `Item`, `ComponentGroup`, `ScopeResult`, `Paths`, `Scanner`.

### Adding a new scanner

1. Create `packages/core/src/scanner/yourscanner.ts` implementing the `Scanner` interface.
2. Register it in `packages/core/src/scanner/scanner.ts` by adding to the `All` array.
3. Add the new `ComponentKind` to the union in `types.ts`.

## Tech Stack

- TypeScript (ES2022, Node16 module resolution, strict mode)
- ESM throughout (`"type": "module"` in all packages)
- **tsup** for building core and CLI
- **esbuild** for building the VS Code extension
- **vitest** for testing (core package only)
