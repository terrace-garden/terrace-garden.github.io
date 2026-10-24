import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const page = name => readFile(new URL(`../docs/${name}/index.html`, import.meta.url), 'utf8');

test('standalone terms give a clear Mac license without cross-Apple or refund promises', async () => {
  const terms = await page('terms');
  for (const detail of ['Kaden Zheng, trading as Terrace', 'personal or professional purposes',
    'compatible Macs you own or control', 'up to five active Macs',
    'Website Pro and Apple’s App Store purchases are separate',
    'website purchase does not unlock the iPhone edition', 'no separate refund guarantee',
    'mandatory consumer rights', 'mailto:veil@tryrlay.com', 'requires a payment method']) {
    assert.ok(terms.includes(detail), `Missing standalone boundary: ${detail}`);
  }
  assert.doesNotMatch(terms, /optional free 14-day trial is optional/);
  assert.doesNotMatch(terms, /Terrace LLC|Relay LLC|Terrace, Inc\.|arbitration|governed by the laws of|refund within \d+ days/i);
  for (const policy of ['buyer-terms', 'refund-policy']) assert.ok(terms.includes(`https://www.paddle.com/legal/${policy}`));
});

test('trial, grace and offline limits remain bounded across the policy pages', async () => {
  for (const name of ['terms', 'refunds', 'support']) {
    const html = await page(name);
    for (const detail of ['14-day', 'one use per private Pro account', '16 days', '72 hours']) assert.ok(html.includes(detail), `${name}: missing ${detail}`);
    assert.match(html, /trial that never (?:became|converted to)(?: a paid subscription| paid)? (?:does not receive|is not eligible)/i);
    assert.doesNotMatch(html, /one trial per person|unlimited devices|instant(?:ly)? revok/i);
  }
});

test('privacy covers separate billing, restore secrets and optional timer sharing without a real account leak', async () => {
  const privacy = await page('privacy');
  for (const detail of ['random Pro account identifier', 'hash of its recovery secret',
    'provider customer/subscription/transaction identifiers', 'separate from garden and Passport records',
    'does not store card details', 'dedicated Apple Keychain entry', 'up to 72 hours',
    'Local focus observations is off by default', 'cannot erase an offline copy immediately']) assert.ok(privacy.includes(detail), `Missing privacy disclosure: ${detail}`);
  assert.doesNotMatch(privacy, /gmail\.com|harvard\.edu|BEGIN.*PRIVATE KEY|pdl_(?:sdbx|live)_apikey/);
});

test('support has one Relay explanation and safe independent Pro and garden recovery', async () => {
  const support = await page('support');
  assert.equal((support.match(/Why does checkout mention Relay\?/g) || []).length, 1);
  assert.match(support, /existing Paddle merchant account named Relay, with its owner’s authorization/);
  for (const detail of ['Show my restore key', 'Restore Pro', 'Refresh Pro', 'Deactivate this Mac',
    'it cannot recover a garden', 'will not retry an ambiguous charge or infer ownership from an email alone',
    'should not need to disable Gatekeeper or change Mac security settings']) assert.ok(support.includes(detail), `Missing recovery/support boundary: ${detail}`);
  assert.match(support, /In the standalone Mac download, optional protection hides selected apps/);
  assert.match(support, /Mac App Store edition supports focus sessions and gardens, but macOS can limit app hiding there/);
  assert.match(support, /Choose the standalone download for Mac app protection/);
  assert.match(support, /On iPhone and iPad, protection is optional and uses Apple’s Screen Time permission/);
  assert.match(support, /href="https:\/\/paddle.net"/);
});

test('policy-only candidate contains no release-config or download module and enables no live sales', async () => {
  for (const name of ['src/release-config.mjs', 'src/download.mjs']) {
    await assert.rejects(stat(new URL(`../${name}`, import.meta.url)), { code: 'ENOENT' });
  }
  const landing = await readFile(new URL('../docs/index.html', import.meta.url), 'utf8');
  assert.match(landing, /Base prices in USD/);
  assert.match(landing, /href="terms\/">Terms/);
  assert.match(landing, /href="refunds\/">Refunds/);
  assert.doesNotMatch(landing, /Planned US launch prices|href="https:\/\/www\.apple\.com[^"]+">Terms/);
  for (const name of ['terms', 'refunds', 'privacy', 'support']) {
    const html = await page(name);
    assert.match(html, /Public downloads and live website purchases are not available yet/);
    assert.doesNotMatch(html, /(?:href|src)="[^"]*(?:checkout\/|\.zip|\.dmg|checkout\.paddle|buy\.paddle)|live_[a-zA-Z0-9]{16}/);
  }
});
