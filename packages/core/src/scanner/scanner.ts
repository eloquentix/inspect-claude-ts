import type { Scanner } from '../types.js';
import { MCPScanner } from './mcp.js';
import { SkillsScanner } from './skills.js';
import { PluginsScanner } from './plugins.js';
import { HooksScanner } from './hooks.js';
import { RulesScanner } from './rules.js';
import { AgentsScanner } from './agents.js';
import { SettingsScanner } from './settings.js';
import { LSPScanner } from './lsp.js';
import { CommandsScanner } from './commands.js';
import { ClaudeMDScanner } from './claudemd.js';
import { MemoryScanner } from './memory.js';
import { PermissionsScanner } from './permissions.js';
import { AllowedToolsScanner } from './allowedtools.js';
import { FileAccessScanner } from './fileaccess.js';

/** Global registry of scanners, ordered for display. */
export const All: Scanner[] = [
  new MCPScanner(),
  new SkillsScanner(),
  new PluginsScanner(),
  new HooksScanner(),
  new RulesScanner(),
  new AgentsScanner(),
  new SettingsScanner(),
  new LSPScanner(),
  new CommandsScanner(),
  new ClaudeMDScanner(),
  new MemoryScanner(),
  new PermissionsScanner(),
  new AllowedToolsScanner(),
  new FileAccessScanner(),
];
