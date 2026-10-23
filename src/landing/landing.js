const worlds = {
  lantern: { image: 'assets/lantern-grove.webp', alt: 'Lantern grove, with peach paper trees and a warm string of lanterns.', description: 'A warm light to come home to. Included free.' },
  woods: { image: 'assets/magical-woods.webp', alt: 'Magical woods, with folded blue trees, sunbeams and blue paper sparkles.', description: 'Sunlight through blue paper woods. Included free.' },
  cloud: { image: 'assets/cloud-observatory.webp', alt: 'Cloud observatory, with paper clouds, a ringed moon and lilac flowers.', description: 'A small corner of the sky. Included free.' },
  orchard: { image: 'assets/sunshower-orchard.webp', alt: 'Sunshower orchard, with folded citrus trees, warm rain and a rainbow.', description: 'Citrus, warm rain and a ribbon of rainbow. Part of Terrace Pro.' }
};
const tabs = [...document.querySelectorAll('[data-world]')];
const panel = document.querySelector('#world-panel');
const picture = document.querySelector('#world-image');
const description = document.querySelector('#world-description');
let request = 0;

async function chooseWorld(tab) {
  const world = worlds[tab.dataset.world];
  if (!world) return;
  const current = ++request;
  const next = new Image();
  next.src = world.image;
  try { await next.decode(); } catch { return; }
  if (current !== request) return;
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  }
  panel.setAttribute('aria-labelledby', tab.id);
  picture.src = world.image;
  picture.alt = world.alt;
  description.textContent = world.description;
  panel.classList.remove('is-changing');
  // Trigger one finite, transform-only arrival after the replacement decodes.
  // No animation loop or background timer remains after this interaction.
  void panel.offsetWidth;
  panel.classList.add('is-changing');
}
for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => chooseWorld(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    tabs[next].focus();
    chooseWorld(tabs[next]);
  });
}
