import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/landing/landing.js', import.meta.url), 'utf8');

// Only the browser boundary is substituted; the actual shipped controller runs.
function browser({ reduced = false, compact = false } = {}) {
  const pending = [], motion = [], events = new Map(), media = new Map();
  const element = (attrs = {}) => ({
    attrs, hidden: false, textContent: '', dataset: {}, handlers: {},
    getAttribute(key) { return this.attrs[key] ?? null; },
    setAttribute(key, value) { this.attrs[key] = value; },
    addEventListener(key, fn) { this.handlers[key] = fn; },
    focus() { document.activeElement = this; },
    animate() {
      let finish, cancel;
      const finished = new Promise((resolve, reject) => { finish = resolve; cancel = reject; });
      const animation = { finished, finish, cancel: () => cancel(new Error('cancelled')) };
      motion.push(animation);
      return animation;
    }
  });
  const tabs = ['lantern', 'woods', 'cloud', 'orchard'].map((world, i) => Object.assign(
    element({ 'aria-selected': String(i === 0) }), { id: `world-${world}`, dataset: { world }, tabIndex: i ? -1 : 0 }
  ));
  const picture = Object.assign(element(), { src: 'assets/lantern-grove.webp' });
  const previous = element(), panel = element(), description = element(), tablist = element();
  const elements = { '#world-panel': panel, '#world-image': picture, '#world-previous': previous, '#world-description': description, '.world-tabs': tablist };
  const document = {
    hidden: false, activeElement: null,
    querySelector: key => elements[key],
    querySelectorAll: key => key === '[data-world]' ? tabs : [element(), element(), element()],
    addEventListener: (key, fn) => events.set(key, fn)
  };
  const context = vm.createContext({ document, Image: class {
    decode() { return new Promise((resolve, reject) => pending.push({ resolve, reject })); }
  }, matchMedia: query => {
    if (!media.has(query)) media.set(query, {
      matches: query.includes('reduced-motion') ? reduced : compact,
      addEventListener(_, fn) { this.change = fn; }
    });
    return media.get(query);
  }});
  vm.runInContext(source, context);
  return { tabs, picture, previous, panel, description, tablist, pending, motion, events, document, media,
    choose: index => tabs[index].handlers.click(),
    async loaded(index = pending.length - 1) { pending[index].resolve(); await new Promise(resolve => setImmediate(resolve)); }
  };
}

test('latest world selection wins even when image decoding completes out of order', async () => {
  const page = browser();
  page.choose(1); page.choose(2);
  await page.loaded(1); await page.loaded(0);
  assert.equal(page.picture.src, 'assets/cloud-observatory.webp');
  assert.equal(page.tabs[2].getAttribute('aria-selected'), 'true');
  assert.equal(page.panel.getAttribute('aria-busy'), 'false');
  assert.equal(page.previous.hidden, false, 'Outgoing art stays during the arrival.');
  for (const animation of page.motion) animation.finish();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.previous.hidden, true);
});

test('reselecting the current garden cancels a pending change without replaying motion', async () => {
  const page = browser();
  page.choose(1); page.choose(0); await page.loaded();
  assert.equal(page.picture.src, 'assets/lantern-grove.webp');
  assert.equal(page.motion.length, 0);
  assert.equal(page.panel.getAttribute('aria-busy'), 'false');
});

test('failed art decoding retains the selected garden and announces recovery without stealing focus', async () => {
  const page = browser();
  page.tabs[1].focus(); page.choose(1);
  page.pending[0].reject(new Error('offline'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.picture.src, 'assets/lantern-grove.webp');
  assert.equal(page.tabs[0].getAttribute('aria-selected'), 'true');
  assert.equal(page.document.activeElement, page.tabs[1]);
  assert.match(page.description.textContent, /couldn’t load/);
  assert.equal(page.panel.getAttribute('aria-busy'), 'false');
});

test('reduced motion keeps the picker functional and compact layout exposes horizontal navigation', async () => {
  const page = browser({ reduced: true, compact: true });
  page.choose(3); await page.loaded();
  assert.equal(page.picture.src, 'assets/sunshower-orchard.webp');
  assert.equal(page.previous.hidden, true);
  assert.equal(page.motion.length, 0);
  assert.equal(page.tablist.getAttribute('aria-orientation'), 'horizontal');
});

test('hiding the page releases in-flight effects without a background timer', async () => {
  const page = browser();
  page.choose(1); await page.loaded();
  page.document.hidden = true; page.events.get('visibilitychange')();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.previous.hidden, true);
  assert.equal(page.picture.src, 'assets/magical-woods.webp');
});

test('horizontal tabs leave vertical arrows for page scrolling and activate with Right', async () => {
  const page = browser({ reduced: true, compact: true });
  let prevented = false;
  page.tabs[0].handlers.keydown({ key: 'ArrowDown', preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
  assert.equal(page.pending.length, 0);
  page.tabs[0].handlers.keydown({ key: 'ArrowRight', preventDefault() { prevented = true; } });
  await page.loaded();
  assert.equal(prevented, true);
  assert.equal(page.document.activeElement, page.tabs[1]);
  assert.equal(page.tabs[1].getAttribute('aria-selected'), 'true');
});
