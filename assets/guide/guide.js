// Copy buttons read the command beside them, so the two cannot drift apart.
for (const b of document.querySelectorAll('[data-copy]')) {
  b.addEventListener('click', async () => {
    const text = b.parentElement.querySelector('span').textContent;
    try { await navigator.clipboard.writeText(text); } catch { return; }
    const was = b.textContent;
    b.textContent = 'Copied';
    b.dataset.done = '';
    setTimeout(() => { b.textContent = was; delete b.dataset.done; }, 1400);
  });
}

// Mark the section currently in view in the on-this-page rail.
const links = [...document.querySelectorAll('#toc a')];
if (links.length) {
  const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const seen = new Set();
  const mark = () => {
    const id = [...byId.keys()].filter(i => seen.has(i)).shift();
    for (const a of links) a.classList.toggle('is-active', byId.get(id) === a);
  };
  const spy = new IntersectionObserver(entries => {
    for (const e of entries) e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id);
    mark();
  }, { rootMargin: '-80px 0px -70% 0px' });
  for (const id of byId.keys()) {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  }
}
