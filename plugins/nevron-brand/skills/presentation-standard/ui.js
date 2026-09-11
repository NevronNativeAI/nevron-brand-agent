/* Deck navigation. Appended after the core show()/resize() script, so it can
   rely on `slides`, `current` and `show`. Everything here is presentation
   chrome: it never touches slide geometry, and print CSS hides all of it. */
(function () {
  var ui = document.querySelector('.deck-ui');
  var grid = document.getElementById('deck-grid');
  var help = document.getElementById('deck-help');
  var bar = document.getElementById('ui-bar');
  var cur = document.getElementById('ui-cur');
  var built = false, idle, buffer = '', bufferTimer;

  function label(i) {
    var s = slides[i];
    return s.getAttribute('aria-label') || '';
  }

  /* The control bar fades out while a slide is being read, and comes back on
     any pointer movement — a visible toolbar in a projected deck is noise. */
  function wake() {
    if (document.body.classList.contains('overview')) return;
    ui.classList.add('is-visible');
    clearTimeout(idle);
    idle = setTimeout(function () { ui.classList.remove('is-visible'); }, 2600);
  }

  function sync() {
    cur.textContent = current + 1;
    bar.style.width = ((current + 1) / slides.length * 100) + '%';
    ui.querySelector('[data-act="prev"]').disabled = current === 0;
    ui.querySelector('[data-act="next"]').disabled = current === slides.length - 1;
    if (built) {
      var cells = grid.children;
      for (var i = 0; i < cells.length; i++) cells[i].classList.toggle('is-current', i === current);
    }
  }

  var baseShow = show;
  show = function (i) { baseShow(i); sync(); };

  /* Thumbnails are clones, built once on first use. Cloning keeps the stage and
     the print path untouched; `zoom` (not transform) so each thumb takes real
     layout space in the grid. */
  function build() {
    if (built) return;
    var stage = document.querySelector('.stage');
    var k = 232 / (stage.offsetWidth || 960);
    slides.forEach(function (s, i) {
      var cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.setAttribute('aria-label', 'Slide ' + (i + 1) + (label(i) ? ': ' + label(i) : ''));
      var clone = s.cloneNode(true);
      clone.classList.remove('active');
      clone.removeAttribute('id');
      clone.style.zoom = k;
      cell.appendChild(clone);
      var num = document.createElement('span');
      num.className = 'cell__num';
      num.textContent = i + 1;
      cell.appendChild(num);
      if (label(i)) {
        var lab = document.createElement('span');
        lab.className = 'cell__label';
        lab.textContent = label(i);
        cell.appendChild(lab);
      }
      cell.addEventListener('click', function () { show(i); overview(false); });
      grid.appendChild(cell);
    });
    built = true;
  }

  function overview(on) {
    if (on === undefined) on = grid.hidden;
    if (on) build();
    grid.hidden = !on;
    document.body.classList.toggle('overview', on);
    ui.querySelector('[data-act="grid"]').setAttribute('aria-pressed', String(on));
    if (on) {
      sync();
      var c = grid.children[current];
      if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest' });
    }
  }

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }

  ui.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.dataset.act;
    if (act === 'prev') show(current - 1);
    else if (act === 'next') show(current + 1);
    else if (act === 'grid') overview();
    else if (act === 'full') fullscreen();
  });

  addEventListener('keydown', function (e) {
    if (e.key === 'o' || e.key === 'O') { e.preventDefault(); overview(); }
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); fullscreen(); }
    else if (e.key === '?') { e.preventDefault(); help.hidden = !help.hidden; }
    else if (e.key === 'Escape') {
      if (!help.hidden) help.hidden = true;
      else if (!grid.hidden) overview(false);
    } else if (/^[0-9]$/.test(e.key)) {
      // type a number then Enter to jump
      buffer += e.key;
      clearTimeout(bufferTimer);
      bufferTimer = setTimeout(function () { buffer = ''; }, 1200);
      return;
    } else if (e.key === 'Enter' && buffer) {
      var n = Number(buffer); buffer = '';
      if (n > 0 && n <= slides.length) show(n - 1);
    }
    wake();
  });

  /* Touch: swipe horizontally to move between slides. */
  var x0 = null, y0 = null;
  addEventListener('touchstart', function (e) {
    x0 = e.changedTouches[0].clientX; y0 = e.changedTouches[0].clientY;
  }, { passive: true });
  addEventListener('touchend', function (e) {
    if (x0 === null || !grid.hidden) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
    x0 = y0 = null;
  }, { passive: true });

  addEventListener('mousemove', wake);
  addEventListener('click', wake);
  wake();
  sync();
})();
