import { describe, it, expect } from 'vitest';
import { parse, parseFull } from '../src/frontmatter/frontmatter.js';

describe('frontmatter', () => {
  it('parses metadata and body', () => {
    const text = `---
name: test-memory
type: feedback
description: "A test description"
---

This is the body content.`;

    const result = parseFull(text);
    expect(result.meta).toEqual({
      name: 'test-memory',
      type: 'feedback',
      description: 'A test description',
    });
    expect(result.body).toBe('This is the body content.');
  });

  it('returns empty meta when no frontmatter', () => {
    const text = 'Just some plain text\nWith multiple lines';
    const result = parseFull(text);
    expect(result.meta).toEqual({});
    expect(result.body).toBe(text);
  });

  it('parses only meta with parse()', () => {
    const text = `---
key: value
---
body`;
    expect(parse(text)).toEqual({ key: 'value' });
  });

  it('strips single quotes', () => {
    const text = `---
name: 'quoted value'
---`;
    expect(parse(text)).toEqual({ name: 'quoted value' });
  });

  it('handles empty frontmatter', () => {
    const text = `---
---
body only`;
    const result = parseFull(text);
    expect(result.meta).toEqual({});
    expect(result.body).toBe('body only');
  });
});
