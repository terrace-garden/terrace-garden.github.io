import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/checkout/checkout.js', import.meta.url), 'utf8');
const publicConfig = await readFile(new URL('../src/checkout/config.js', import.meta.url), 'utf8');
const transaction = `txn_${'a'.repeat(26)}`;
const href = `https://terrace-garden.github.io/checkout/?_ptxn=${transaction}`;
const sandbox = { enabled: true, environment: 'sandbox', clientToken: `test_${'a'.repeat(24)}` };

function page({ config = sandbox, url = href, paddle, missingFrame = false } = {}) {
  const status = { textContent: '', dataset: {} };
  const frame = { hidden: true };
  const scripts = [];
  const timers = new Map();
  const environments = [];
  const initializations = [];
  let nextTimer = 0;
  const fakePaddle = {
    Environment: { set: value => environments.push(value) },
    Initialize: value => initializations.push(value),
    Checkout: { open: () => { throw new Error('Manual checkout opening is forbidden'); } }
  };
  const window = {
    TERRACE_CHECKOUT_CONFIG: config,
    location: { href: url },
    Paddle: paddle === undefined ? fakePaddle : paddle,
    setTimeout: fn => { const id = ++nextTimer; timers.set(id, fn); return id; },
    clearTimeout: id => timers.delete(id)
  };
  const document = {
    getElementById: id => id === 'checkout-status' ? status : missingFrame ? null : frame,
    createElement: type => {
      assert.equal(type, 'script');
      return { remove() { this.removed = true; } };
    },
    head: { appendChild: script => scripts.push(script) }
  };
  const forbidden = () => { throw new Error('No browser persistence, calls, or native activation'); };
  Object.defineProperty(window, 'localStorage', { get: forbidden });
  Object.defineProperty(window, 'sessionStorage', { get: forbidden });
  window.open = forbidden;
  window.fetch = forbidden;
  const context = vm.createContext({ window, document, URL, console: { log: forbidden, error: forbidden } });
  const run = () => vm.runInContext(source, context);
  run();
  const event = (name, data = {}) => initializations[0].eventCallback({ name, data: { transaction_id: transaction, ...data } });
  return { status, frame, scripts, timers, environments, initializations, window, run, event, context };
}

test('shipped public configuration is Sandbox-only with an intentional public token', () => {
  const p = page({ config: null });
  vm.runInContext(publicConfig, p.context);
  assert.equal(p.window.TERRACE_CHECKOUT_CONFIG.enabled, true);
  assert.equal(p.window.TERRACE_CHECKOUT_CONFIG.environment, 'sandbox');
  assert.equal(p.window.TERRACE_CHECKOUT_CONFIG.clientToken, 'test_d3d42327c85796da766a636f341');
  assert.ok(Object.isFrozen(p.window.TERRACE_CHECKOUT_CONFIG));
});

for (const config of [null, {}, { ...sandbox, enabled: false }, { ...sandbox, enabled: 'true' }]) {
  test(`held/missing configuration never loads remote SDK: ${JSON.stringify(config)}`, () => {
    const p = page({ config });
    assert.equal(p.scripts.length, 0);
    assert.equal(p.status.dataset.phase, 'held');
    assert.equal(p.frame.hidden, true);
  });
}

for (const url of [
  'https://terrace-garden.github.io/checkout/',
  href.replace('txn_', 'TXN_'), href.replace('a'.repeat(26), 'a'.repeat(25)),
  `${href}&price=pri_fake`, `${href}&_ptxn=${transaction}`, `${href}#success`, `${href}#`,
  `${href}&recovery_key=never`, href.replace('_ptxn', '%5Fptxn'),
  href.replace('https://', 'https://name:password@'),
  href.replace('github.io', 'github.io.evil.example'), href.replace('https:', 'http:'),
  href.replace('/checkout/', '/checkout'), 'not a URL'
]) {
  test(`invalid transaction/page/query fails before SDK load: ${url}`, () => {
    const p = page({ url });
    assert.equal(p.scripts.length, 0);
    assert.equal(p.status.dataset.phase, 'unavailable');
    assert.equal(p.frame.hidden, true);
    assert.ok(!p.status.textContent.includes('never'));
  });
}

for (const config of [
  { ...sandbox, clientToken: '' }, { ...sandbox, clientToken: 'test_short' },
  { ...sandbox, clientToken: `live_${'a'.repeat(24)}` },
  { ...sandbox, environment: 'production' }, { ...sandbox, environment: 'staging' },
  { ...sandbox, clientToken: 'test_' + '<script>'.repeat(5) }
]) {
  test(`bad or mixed environment configuration fails closed: ${config.environment}/${config.clientToken.slice(0, 10)}`, () => {
    const p = page({ config });
    assert.equal(p.scripts.length, 0);
    assert.equal(p.status.dataset.phase, 'unavailable');
  });
}

test('valid sandbox loads only pinned Paddle SDK then initializes once, without opening checkout manually', () => {
  const p = page();
  assert.equal(p.scripts.length, 1);
  assert.equal(p.initializations.length, 0);
  assert.equal(p.scripts[0].src, 'https://cdn.paddle.com/paddle/v2/paddle.js');
  assert.equal(p.scripts[0].referrerPolicy, 'no-referrer');
  assert.equal(p.status.dataset.phase, 'loading');
  p.run();
  assert.equal(p.scripts.length, 1);
  const load = p.scripts[0].onload;
  load();
  load();
  assert.deepEqual(p.environments, ['sandbox']);
  assert.equal(p.initializations.length, 1);
  const settings = p.initializations[0].checkout.settings;
  assert.equal(settings.displayMode, 'inline');
  assert.equal(settings.theme, 'light');
  assert.equal(settings.frameTarget, 'checkout-container');
  assert.equal(settings.locale, undefined, 'Browser chooses checkout locale');
  assert.equal(settings.successUrl, undefined, 'No untrusted native return URL');
  assert.equal(p.initializations[0].items, undefined);
  assert.equal(p.initializations[0].transactionId, undefined, 'SDK consumes exact _ptxn automatically');
  assert.equal(p.frame.hidden, false);
  assert.equal(p.timers.size, 1, 'Checkout connection is also bounded after the SDK loads');
  p.event('checkout.loaded');
  assert.equal(p.timers.size, 0);
});

test('production configuration uses matching public token without Sandbox mode', () => {
  const p = page({ config: { enabled: true, environment: 'production', clientToken: `live_${'b'.repeat(24)}` } });
  p.scripts[0].onload();
  assert.equal(p.initializations.length, 1);
  assert.deepEqual(p.environments, []);
});

test('held state cannot be activated by changing configuration after script ran', () => {
  const p = page({ config: { ...sandbox, enabled: false } });
  p.window.TERRACE_CHECKOUT_CONFIG = sandbox;
  p.run();
  assert.equal(p.scripts.length, 0);
  assert.equal(p.status.dataset.phase, 'held');
});

test('configuration replacement or withdrawal during SDK loading prevents initialization', () => {
  for (const replacement of [null, { ...sandbox, enabled: false }, { ...sandbox, clientToken: `live_${'a'.repeat(24)}` }]) {
    const p = page();
    p.window.TERRACE_CHECKOUT_CONFIG = replacement;
    p.scripts[0].onload();
    assert.equal(p.initializations.length, 0);
    assert.equal(p.status.dataset.phase, 'error');
  }
});

test('SDK load failure is quiet, bounded and offers a manual retry', () => {
  const p = page();
  const load = p.scripts[0].onload;
  p.scripts[0].onerror();
  load();
  assert.equal(p.initializations.length, 0);
  assert.equal(p.status.dataset.phase, 'error');
  assert.equal(p.scripts[0].removed, true);
  assert.equal(p.timers.size, 0);
  assert.equal(p.frame.hidden, true);
});

test('SDK timeout does not initialize a late response or spin a retry loop', () => {
  const p = page();
  const load = p.scripts[0].onload;
  [...p.timers.values()][0]();
  load();
  assert.equal(p.initializations.length, 0);
  assert.equal(p.timers.size, 0);
  assert.equal(p.status.dataset.phase, 'error');
});

test('checkout connection remains bounded after SDK success and can recover on its late loaded event', () => {
  const p = page();
  p.scripts[0].onload();
  [...p.timers.values()][0]();
  assert.equal(p.status.dataset.phase, 'error');
  assert.equal(p.frame.hidden, true);
  p.event('checkout.loaded');
  assert.equal(p.status.dataset.phase, 'ready');
  assert.equal(p.frame.hidden, false);
  assert.equal(p.timers.size, 0);
  assert.equal(p.initializations.length, 1);
});

for (const paddle of [null, {}, { Initialize() { throw Error('offline'); }, Environment: { set() {} } }]) {
  test(`SDK initialization errors fail closed: ${String(paddle)}`, () => {
    const p = page({ paddle });
    p.scripts[0].onload();
    assert.equal(p.status.dataset.phase, 'error');
    assert.equal(p.frame.hidden, true);
    assert.equal(p.timers.size, 0);
  });
}

test('checkout events update only minimal status for the expected transaction', () => {
  const p = page();
  p.scripts[0].onload();
  p.event('checkout.loaded');
  assert.equal(p.status.dataset.phase, 'ready');
  assert.equal(p.status.textContent, 'Review your plan below.');
  p.event('checkout.completed', { transaction_id: `txn_${'z'.repeat(26)}` });
  p.event('subscription.active', { license_key: 'never-display-or-persist' });
  assert.equal(p.status.dataset.phase, 'ready');
  p.event('checkout.payment.failed');
  assert.equal(p.status.dataset.phase, 'payment-error');
  assert.equal(p.status.textContent, 'Checkout could not finish. Check the details below or try another payment method.');
  p.event('checkout.closed');
  assert.equal(p.status.dataset.phase, 'closed');
  p.event('checkout.completed', { customer: { email: 'never-display@example.test' }, custom_data: { recovery_key: 'never' } });
  assert.equal(p.status.textContent, 'Checkout complete. Return to Terrace.');
  p.event('checkout.closed');
  assert.equal(p.status.dataset.phase, 'complete');
  assert.equal(p.window.location.href, href);
  assert.equal(p.window.Pro, undefined);
});

for (const [flow, total] of [['paid', 3.99], ['14-day free trial', 0]]) {
  test(`${flow} completion is accurate without claiming a charge or granting Pro`, () => {
    const p = page();
    p.scripts[0].onload();
    const originalWindowKeys = Object.keys(p.window);
    p.event('checkout.completed', { totals: { total }, currency_code: 'USD' });
    assert.equal(p.status.textContent, 'Checkout complete. Return to Terrace.');
    assert.equal(p.status.dataset.phase, 'complete');
    assert.equal(p.window.location.href, href);
    assert.equal(p.window.Pro, undefined);
    assert.deepEqual(Object.keys(p.window), originalWindowKeys);
    assert.equal(p.scripts.length, 1);
    assert.equal(p.initializations.length, 1);
    assert.equal(p.timers.size, 0);
    p.event('checkout.closed');
    assert.equal(p.status.dataset.phase, 'complete');
  });
}

test('checkout source has no licensing authority, persistent storage, redirect, event data logging or API secret', () => {
  assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage|document\.cookie|location\s*=|location\.(?:assign|replace)|window\.open|console\.|license_key|recovery_key|\.Checkout\.open\(/);
  assert.doesNotMatch(publicConfig, /pdl_ntfset_|pdl_(?:sdbx|live)_apikey|BEGIN.*PRIVATE KEY/);
});

test('built test page is accessible, labels Sandbox clearly and has only existing policy links', async () => {
  const html = await readFile(new URL('../docs/checkout/index.html', import.meta.url), 'utf8');
  assert.match(html, /Sandbox test · No real charge/);
  assert.match(html, /role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
  assert.match(html, /class="checkout-container" id="checkout-container"[^>]* hidden/);
  assert.doesNotMatch(html, /src="https:|<form\b|autofocus|onload=|<iframe|terrace:\/\//);
  for (const pageName of ['support', 'privacy']) assert.ok(html.includes(`href="../${pageName}/"`));
  assert.doesNotMatch(html, /href="[^"]*(?:terms|refunds)/);
  assert.match(html, /No real money is charged/);

});
