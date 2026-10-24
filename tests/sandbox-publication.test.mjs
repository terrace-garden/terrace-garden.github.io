import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../docs/${path}`, import.meta.url), 'utf8');

test('Sandbox preparation adds no public app download or checkout link to existing pages', async () => {
  const landing = await read('index.html');
  assert.match(landing, /isn’t publicly available yet/);
  assert.doesNotMatch(landing, /(?:href|src)="[^"]*(?:checkout\/|\.zip|\.dmg|buy\.paddle|checkout\.paddle)/i);
  for (const path of ['privacy/index.html', 'support/index.html', 'community/index.html']) {
    assert.doesNotMatch(await read(path), /(?:href|src)="[^"]*checkout\//);
  }
});

test('shipped test page is explicit, uses only the public Sandbox token and keeps the authority on the server', async () => {
  const html = await read('checkout/index.html');
  const config = await read('checkout/config.js');
  const script = await read('checkout/checkout.js');
  assert.match(html, /<title>Terrace Pro — Sandbox test<\/title>/);
  assert.match(html, /Sandbox test · No real charge/);
  assert.match(html, /No real money is charged/);
  assert.match(html, /noindex, nofollow/);
  assert.match(config, /enabled: true/);
  assert.match(config, /environment: 'sandbox'/);
  assert.match(config, /clientToken: 'test_d3d42327c85796da766a636f341'/);
  assert.doesNotMatch(config + html, /live_[a-z0-9]{16}|pdl_ntfset_|pdl_(?:sdbx|live)_apikey|BEGIN.*PRIVATE KEY|recovery_key|license_key/);
  assert.doesNotMatch(script, /fetch\(|localStorage|sessionStorage|location\.(?:assign|replace)|window\.open|console\./);
});
