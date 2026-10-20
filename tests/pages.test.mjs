import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
const root = new URL('../docs/', import.meta.url);
for (const page of ['index.html', 'privacy/index.html', 'support/index.html', 'community/index.html']) {
  test(`${page}: accessible static document without tracking or personal identity`, async () => {
    const document = new URL(page, root);
    const html = await readFile(document, 'utf8');
    assert.match(html, /<html lang="en">/);
    assert.equal((html.match(/<main\b/g) || []).length, 1);
    assert.match(html, /href="#main">Skip to content/);
    assert.match(html, /prefers-contrast:more/);
    assert.doesNotMatch(html, /<script\b|<iframe\b|<form\b|chatgpt\.site|Kaden|Zheng|gmail\.com|re_[A-Za-z0-9]{16}/i);
    assert.match(html, /Content-Security-Policy/);
    assert.ok(Buffer.byteLength(html) < 32_768, 'A help page should remain small.');
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      if (href.startsWith('mailto:') || href.startsWith('https:')) continue;
      const target = new URL(href, document);
      if (target.hash) assert.ok(html.includes(`id="${target.hash.slice(1)}"`), `Missing anchor ${href}`);
      else assert.ok((await stat(target.pathname.endsWith('/') ? new URL('index.html', target) : target)).isFile(), `Missing page ${href}`);
    }
  });
}
test('privacy covers deletion, encrypted recovery, reports, hosting and support', async () => {
  const html = await readFile(new URL('privacy/index.html', root), 'utf8');
  for (const detail of ['Delete Passport cloud copy', 'revocation marker', 'Delete my shared data', 'GitHub Pages', 'support provider', 'hashed network-address', 'Reports store']) {
    assert.ok(html.includes(detail), `Missing privacy detail: ${detail}`);
  }
});
test('support and community provide the chosen contact and safe recovery guidance', async () => {
  for (const page of ['support', 'community']) {
    const html = await readFile(new URL(`${page}/index.html`, root), 'utf8');
    assert.match(html, /mailto:veil@tryrlay\.com/);
    assert.match(html, /recovery files/);
  }
});
