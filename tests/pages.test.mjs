import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
const root = new URL('../docs/', import.meta.url);
for (const page of ['privacy/index.html', 'support/index.html', 'community/index.html', 'terms/index.html', 'refunds/index.html']) {
  test(`${page}: accessible static document without tracking or private account details`, async () => {
    const document = new URL(page, root);
    const html = await readFile(document, 'utf8');
    assert.match(html, /<html lang="en">/);
    assert.equal((html.match(/<main\b/g) || []).length, 1);
    assert.match(html, /href="#main">Skip to content/);
    assert.match(html, /prefers-contrast:more/);
    assert.doesNotMatch(html, /<script\b|<iframe\b|<form\b|chatgpt\.site|gmail\.com|harvard\.edu|re_[A-Za-z0-9]{16}/i);
    if (page !== 'community/index.html') {
      assert.equal((html.match(/Kaden Zheng, trading as Terrace/g) || []).length, 1);
      assert.match(html, /Public downloads and live website purchases are not available yet/);
      assert.doesNotMatch(html, /\bdraft\b|awaiting confirmation|supplier.*unknown/i);
      for (const policy of ['terms', 'refunds', 'privacy', 'support']) assert.ok(html.includes(`href="../${policy}/"`), `Missing policy navigation: ${policy}`);
    } else assert.doesNotMatch(html, /Kaden|Zheng/);
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
test('landing page has honest launch actions, local assets and accessible world choices', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.equal((html.match(/<main\b/g) || []).length, 1);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /href="#main">Skip to content/);
  assert.doesNotMatch(html, /class="eyebrow|chatgpt\.site|Kaden|Zheng|gmail\.com|<iframe\b|<form\b|\son[a-z]+\s*=|Download now|Join the waitlist/);
  assert.match(html, /It isn’t publicly available yet/);
  assert.match(html, /mailto:veil@tryrlay\.com\?subject=Terrace%20launch%20news/);
  assert.match(html, /\$3\.99/);
  assert.match(html, /\$29\.99 billed yearly/);
  assert.match(html, /14-day trial/);
  assert.match(html, /script-src 'self'/);
  assert.doesNotMatch(html, /'unsafe-inline'|script[^>]*src="https?:/);
  assert.equal((html.match(/role="tab" /g) || []).length, 4);
  assert.equal((html.match(/role="tab" aria-selected="true"/g) || []).length, 1);
  for (const [, target] of html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
    if (target.startsWith('mailto:') || target.startsWith('https:')) continue;
    const url = new URL(target, new URL('index.html', root));
    assert.ok((await stat(url.pathname.endsWith('/') ? new URL('index.html', url) : url)).isFile(), `Missing landing destination: ${target}`);
  }
  const css = await readFile(new URL('landing.css', root), 'utf8');
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /prefers-contrast:more/);
  const js = await readFile(new URL('landing.js', root), 'utf8');
  assert.doesNotMatch(js, /fetch\(|setInterval|requestAnimationFrame|localStorage|document\.cookie|eval\(/);
});
test('privacy covers deletion, encrypted recovery, reports, hosting and support', async () => {
  const html = await readFile(new URL('privacy/index.html', root), 'utf8');
  for (const detail of ['Delete Passport cloud copy', 'revocation marker', 'Delete my shared data', 'GitHub Pages', 'Resend', 'Google-hosted support mailbox', 'random message identifiers', 'hashed network-address', 'Reports store', 'Apple-verified subscription status', 'not sent to the Terrace garden service']) {
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
