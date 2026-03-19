import { parseArgs } from 'node:util';
import {
  resolve, collectResults, renderTree, renderJSON,
  initColor, setColor,
} from '@inspect-claude/core';
import { runTUI } from './tui/tui.js';

async function main() {
  const { values } = parseArgs({
    options: {
      user: { type: 'boolean', default: false },
      project: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      verbose: { type: 'boolean', default: false },
      kind: { type: 'string', default: '' },
      'no-color': { type: 'boolean', default: false },
      browse: { type: 'boolean', default: false },
    },
    strict: true,
  });

  initColor();
  if (values['no-color'] || values.json) {
    setColor(false);
  }

  // Parse kind filter
  let kindTokens: string[] | undefined;
  if (values.kind) {
    kindTokens = values.kind.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  }

  // Scope filter
  let scopes: ('user' | 'project')[] | undefined;
  if (values.user) scopes = ['user'];
  else if (values.project) scopes = ['project'];

  const paths = resolve();
  const results = await collectResults(paths, { kindTokens, scopes });

  if (values.browse) {
    await runTUI(results);
  } else if (values.json) {
    process.stdout.write(renderJSON(results));
  } else {
    process.stdout.write(renderTree(results, values.verbose || false));
  }
}

main().catch(err => {
  process.stderr.write(`error: ${err}\n`);
  process.exit(1);
});
