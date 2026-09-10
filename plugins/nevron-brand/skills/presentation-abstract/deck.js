(function() {
  const deck = document.getElementById('deck');
  const slides = Array.from(document.querySelectorAll('.slide'));
  if (!deck) return;
  function currentIdx() { return Math.round(deck.scrollTop / window.innerHeight); }
  function goTo(idx) { const t = Math.max(0, Math.min(slides.length - 1, idx)); deck.scrollTo({ top: t * window.innerHeight, behavior: 'smooth' }); }
  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const idx = currentIdx();
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); goTo(idx + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goTo(idx - 1); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(slides.length - 1); }
  });
})();
