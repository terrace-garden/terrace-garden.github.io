const worlds = {
  lantern: { image: 'assets/lantern-grove.webp', alt: 'Lantern grove, with peach paper trees and a warm string of lanterns.', description: 'A warm light to come home to. Included free.' },
  woods: { image: 'assets/magical-woods.webp', alt: 'Magical woods, with folded blue trees, sunbeams and blue paper sparkles.', description: 'Sunlight through blue paper woods. Included free.' },
  cloud: { image: 'assets/cloud-observatory.webp', alt: 'Cloud observatory, with paper clouds, a ringed moon and lilac flowers.', description: 'A small corner of the sky. Included free.' },
  orchard: { image: 'assets/sunshower-orchard.webp', alt: 'Sunshower orchard, with folded citrus trees, warm rain and a rainbow.', description: 'Citrus, warm rain and a ribbon of rainbow. Part of Terrace Pro.' }
};
const tabs = [...document.querySelectorAll('[data-world]')];
const panel = document.querySelector('#world-panel');
const picture = document.querySelector('#world-image');
const previous = document.querySelector('#world-previous');
const description = document.querySelector('#world-description');
const lights = [...document.querySelectorAll('.world-lights path')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const compactLayout = matchMedia('(max-width: 900px)');
let request = 0;
let motion = 0;
let animations = [];

function settleMotion() {
  ++motion;
  for (const animation of animations) animation.cancel();
  animations = [];
  previous.hidden = true;
}

function arriveWorld() {
  if (reducedMotion.matches || document.hidden || !picture.animate) return;
  const arrival = ++motion;
  previous.hidden = false;
  const easing = 'cubic-bezier(.22,1,.36,1)';
  animations = [
    previous.animate([
      { opacity: 1, transform: 'translateY(0) scale(1)' },
      { opacity: 0, transform: 'translateY(-7px) scale(.99)' }
    ], { duration: 430, easing, fill: 'both' }),
    picture.animate([
      { opacity: 0, transform: 'translateY(12px) rotateX(6deg) scale(.975)' },
      { opacity: 1, transform: 'translateY(0) rotateX(0) scale(1)' }
    ], { duration: 680, easing }),
    ...lights.map((light, index) => light.animate([
      { opacity: 0, transform: 'scale(.25) rotate(-25deg)' },
      { opacity: .9, transform: 'scale(1) rotate(0)', offset: .35 },
      { opacity: 0, transform: 'scale(.45) rotate(20deg)' }
    ], { duration: 650, delay: 200 + index * 110, easing: 'ease-out' }))
  ];
  // Release the outgoing image and animation effects when the finite arrival ends.
  // The generation check also makes rapid changes safe while cancellation settles.
  Promise.all(animations.map(animation => animation.finished.catch(() => {})))
    .then(() => { if (arrival === motion) settleMotion(); });
}

async function chooseWorld(tab) {
  const world = worlds[tab.dataset.world];
  if (!world) return;
  const current = ++request;
  if (tab.getAttribute('aria-selected') === 'true') {
    panel.setAttribute('aria-busy', 'false');
    description.textContent = world.description;
    return;
  }
  panel.setAttribute('aria-busy', 'true');
  const next = new Image();
  next.src = world.image;
  try { await next.decode(); }
  catch {
    if (current !== request) return;
    panel.setAttribute('aria-busy', 'false');
    description.textContent = 'This world couldn’t load. Your current garden is still here. Please try again.';
    return;
  }
  if (current !== request) return;
  settleMotion();
  previous.src = picture.src;
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  }
  panel.setAttribute('aria-labelledby', tab.id);
  picture.src = world.image;
  picture.alt = world.alt;
  description.textContent = world.description;
  panel.setAttribute('aria-busy', 'false');
  arriveWorld();
}

function updateOrientation() {
  document.querySelector('.world-tabs').setAttribute('aria-orientation', compactLayout.matches ? 'horizontal' : 'vertical');
}
updateOrientation();
compactLayout.addEventListener('change', updateOrientation);
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) settleMotion(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) settleMotion(); });
for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => chooseWorld(tab));
  tab.addEventListener('keydown', event => {
    let next;
    const forward = compactLayout.matches ? 'ArrowRight' : 'ArrowDown';
    const backward = compactLayout.matches ? 'ArrowLeft' : 'ArrowUp';
    if (event.key === forward) next = (index + 1) % tabs.length;
    if (event.key === backward) next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    tabs[next].focus();
    chooseWorld(tabs[next]);
  });
}
