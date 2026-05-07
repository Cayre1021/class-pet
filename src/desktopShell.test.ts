import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('desktop shell metadata', () => {
  it('uses Class Pet as the desktop title', () => {
    const indexHtml = readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const electronMain = readFileSync(path.resolve(process.cwd(), 'electron/main.js'), 'utf8');

    expect(indexHtml).toContain('<title>Class Pet</title>');
    expect(electronMain).toContain("title: 'Class Pet'");
  });
});
