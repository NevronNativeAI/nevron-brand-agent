/* ==========================================================================
   Nevron document paginator
   Runs inside the page (headless Chrome) before --print-to-pdf fires.

   Chrome's own page-breaking can't tell us which page a heading landed on,
   and the table of contents needs exactly that. So we lay the flow out
   ourselves: fill fixed-height .page__content boxes one block at a time,
   split what overflows, then read the page numbers off the result.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.NEVRON_DOC || {};
  var pagesRoot = document.getElementById('pages');
  var flow = document.getElementById('flow');
  var tocFlow = document.getElementById('tocflow');

  // ---- metrics ----------------------------------------------------------

  function mmToPx(mm) {
    var probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;height:' + mm + 'mm';
    document.body.appendChild(probe);
    var px = probe.getBoundingClientRect().height;
    probe.remove();
    return px;
  }

  var LIMIT = mmToPx(227);   // content height: 297 − 35 − 35
  var SLACK = 0.5;           // sub-pixel rounding tolerance

  function lineHeight(el) {
    var lh = parseFloat(getComputedStyle(el).lineHeight);
    if (!isNaN(lh) && lh > 0) return lh;
    return parseFloat(getComputedStyle(el).fontSize) * 1.25;
  }

  /** Space left on the page once `block` is taken out — measured the same way
   *  the overflow check measures, so the two can't disagree. */
  function spaceFor(content, block) {
    var next = block.nextSibling;
    content.removeChild(block);
    var used = content.scrollHeight;
    content.insertBefore(block, next);
    return LIMIT - used;
  }

  // ---- splitting --------------------------------------------------------

  var SPLITTABLE = /\b(Paragraph|Bulletlist|Numbering|disclaimer)/;

  /** Split a text block so its head fits in `space` px, keeping at least two
   *  lines on each side. Returns [head, tail] or null. */
  function splitText(el, space) {
    var lh = lineHeight(el);
    if (space < lh * 2) return null;

    var words = el.textContent.split(/(\s+)/);
    if (words.length < 9) return null;

    var probe = el.cloneNode(false);
    probe.removeAttribute('id');
    probe.removeAttribute('data-toc');
    el.parentNode.insertBefore(probe, el);

    var lo = 0, hi = words.length, best = -1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      probe.textContent = words.slice(0, mid).join('');
      if (probe.getBoundingClientRect().height <= space + SLACK) { best = mid; lo = mid + 1; }
      else { hi = mid - 1; }
    }

    if (best < 0) { probe.remove(); return null; }

    // Widow control: the tail must be worth at least two lines too.
    probe.textContent = words.slice(best).join('').replace(/^\s+/, '');
    var tailFits = probe.getBoundingClientRect().height >= lh * 2 - SLACK;
    probe.remove();

    var headText = words.slice(0, best).join('').replace(/\s+$/, '');
    var tailText = words.slice(best).join('').replace(/^\s+/, '');
    if (!headText || !tailText || !tailFits) return null;

    var head = el.cloneNode(false);
    var tail = el.cloneNode(false);
    head.removeAttribute('data-toc');
    tail.removeAttribute('id');
    tail.removeAttribute('data-toc');
    tail.classList.add('is-continuation');
    head.textContent = headText;
    tail.textContent = tailText;
    return [head, tail];
  }

  /** Split a table on a row boundary, repeating the header. */
  function splitTable(el, space) {
    var bodyRows = el.querySelectorAll('tbody > tr');
    if (bodyRows.length < 2) return null;

    var probe = el.cloneNode(true);
    var probeRows = probe.querySelectorAll('tbody > tr');
    el.parentNode.insertBefore(probe, el);

    var keep = 0;
    for (var i = 0; i < probeRows.length; i++) {
      probeRows[i].style.display = '';
      for (var j = i + 1; j < probeRows.length; j++) probeRows[j].style.display = 'none';
      if (probe.getBoundingClientRect().height <= space + SLACK) keep = i + 1;
      else break;
    }
    probe.remove();
    if (keep === 0 || keep >= bodyRows.length) return null;

    var head = el.cloneNode(true);
    var tail = el.cloneNode(true);
    var hr = head.querySelectorAll('tbody > tr');
    var tr = tail.querySelectorAll('tbody > tr');
    for (var a = hr.length - 1; a >= keep; a--) hr[a].remove();
    for (var b = keep - 1; b >= 0; b--) tr[b].remove();
    tail.classList.add('is-continuation');
    return [head, tail];
  }

  function splitBlock(el, space) {
    if (el.tagName === 'TABLE') return splitTable(el, space);
    if (!SPLITTABLE.test(el.className)) return null;
    if (el.querySelector('img')) return null;
    return splitText(el, space);
  }

  function isHeading(el) {
    return !!el && /\bTitle[ABC]\b/.test(el.className);
  }

  // ---- page shells ------------------------------------------------------

  function makePage(kind) {
    var page = document.createElement('section');
    page.className = 'page' + (kind ? ' page--' + kind : '');
    page.innerHTML = CFG.chromeHTML || '';
    var content = document.createElement('div');
    content.className = 'page__content';
    page.appendChild(content);
    pagesRoot.appendChild(page);
    return content;
  }

  // ---- the paginator ----------------------------------------------------

  function paginate(source, kind) {
    var queue = [].slice.call(source.children);
    var content = makePage(kind);
    var produced = [content];

    function newPage() {
      content = makePage(kind);
      produced.push(content);
      return content;
    }

    while (queue.length) {
      var block = queue.shift();

      if (block.classList && block.classList.contains('pagebreak')) {
        if (content.children.length) newPage();
        continue;
      }

      content.appendChild(block);
      if (content.scrollHeight <= LIMIT + SLACK) continue;

      // Overflowed. First try to fill the remaining space by splitting.
      var space = spaceFor(content, block);
      var parts = splitBlock(block, space);
      if (parts) {
        content.replaceChild(parts[0], block);
        newPage();
        queue.unshift(parts[1]);
        continue;
      }

      // Not splittable here — push it (and any heading it belongs to) over.
      if (content.children.length > 1) {
        content.removeChild(block);
        var trailing = [];
        while (isHeading(content.lastElementChild)) {
          trailing.unshift(content.removeChild(content.lastElementChild));
        }
        newPage();
        for (var t = 0; t < trailing.length; t++) content.appendChild(trailing[t]);
        content.appendChild(block);
        if (content.scrollHeight <= LIMIT + SLACK) continue;

        // Alone on a fresh page and still too tall.
        var parts2 = splitBlock(block, spaceFor(content, block));
        if (parts2) {
          content.replaceChild(parts2[0], block);
          newPage();
          queue.unshift(parts2[1]);
          continue;
        }
      }
      // Unsplittable and page-sized (an oversized image, usually). Leave it —
      // better a slightly long page than lost content. The builder warns.
      if (block.querySelector && block.querySelector('img')) {
        console.warn('[nevron-document] block taller than the text area:', block.textContent.slice(0, 60));
      }
    }

    source.classList.add('is-done');
    return produced;
  }

  // ---- run --------------------------------------------------------------

  // The cover title is anchored by its baseline and grows upward, so a long
  // one would climb into the frame's bottom-left bracket. Shrink to fit — the
  // InDesign spec gives the title a 40–44pt range, so scaling is in the design.
  (function fitCoverTitle() {
    var title = document.querySelector('.cover__title');
    if (!title) return;
    var page = title.closest('.page');
    if (!page) return;
    var floor = mmToPx(193.9);            // frame bottom 189.9mm + 4mm clearance
    var size = 40;
    while (size > 22) {
      var top = title.getBoundingClientRect().top - page.getBoundingClientRect().top;
      if (top >= floor) break;
      size -= 1;
      title.style.fontSize = size + 'pt';
    }
  })();

  var fixedPages = pagesRoot.querySelectorAll('.page').length;   // cover, intro
  var tocPages = tocFlow ? paginate(tocFlow, 'toc').length : 0;
  var bodyPages = paginate(flow, 'body');

  // Page numbers. The cover carries none (w:titlePg in the template).
  var first = CFG.firstPageNumber == null ? 1 : CFG.firstPageNumber;
  [].slice.call(pagesRoot.querySelectorAll('.page')).forEach(function (page, i) {
    var slot = page.querySelector('.rfoot__page');
    if (slot) slot.textContent = String(first + i);
  });

  // TOC page numbers, read off where the headings actually landed.
  if (tocFlow) {
    var offset = fixedPages + tocPages;
    bodyPages.forEach(function (content, i) {
      var pageNo = first + offset + i;
      [].slice.call(content.querySelectorAll('[data-toc]')).forEach(function (h) {
        var entry = document.querySelector('[data-toc-for="' + h.getAttribute('data-toc') + '"]');
        if (entry) entry.textContent = String(pageNo);
      });
    });
  }

  document.documentElement.setAttribute('data-paginated', '1');
})();
