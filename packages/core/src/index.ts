// Types
export type { Scope, ComponentKind, Item, ComponentGroup, ScopeResult, Paths, Scanner } from './types.js';

// Config
export { resolve, dirForScope } from './config/paths.js';

// Frontmatter
export { parse, parseFull } from './frontmatter/frontmatter.js';

// Scanner registry
export { All as scanners } from './scanner/scanner.js';

// Orchestrator
export { collectResults } from './scan/collect.js';

// Renderers
export { renderTree } from './render/tree.js';
export { renderJSON } from './render/json.js';
export { setColor, initColor, colorize, isColorEnabled } from './render/color.js';
export {
  ansiReset, ansiBold, ansiDim, ansiCyan, ansiGreen, ansiYellow,
  ansiMagenta, ansiRed, ansiReverse,
} from './render/color.js';
