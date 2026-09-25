/* ------------------------------------------------------------------
   Chapter routing (hash based), sidebar, progress, language tabs.
------------------------------------------------------------------ */
(function () {
  const chapters = Array.from(document.querySelectorAll('section.chapter'));
  const ids = chapters.map(c => c.id);
  const toc = document.getElementById('toc');
  const select = document.getElementById('chapter-select');
  const KEY = 'smi26-visited';
  let visited = new Set();
  try { visited = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { }
  let current = null;
  const decode = (t) => { const x = document.createElement('textarea'); x.innerHTML = t; return x.value; };

  // build nav
  chapters.forEach((c, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + c.id;
    a.dataset.id = c.id;
    a.innerHTML = '<span class="n">' + (i === 0 ? '·' : String(i).padStart(2, '0')) + '</span><span>' + c.dataset.title + '</span>';
    li.appendChild(a); toc.appendChild(li);
    const o = document.createElement('option'); o.value = c.id; o.textContent = (i === 0 ? '' : i + '. ') + decode(c.dataset.title); select.appendChild(o);
  });
  select.addEventListener('change', () => { location.hash = '#' + select.value; });

  // pagers
  chapters.forEach((c, i) => {
    const pager = document.createElement('div'); pager.className = 'pager';
    const prev = i > 0 ? '<a href="#' + ids[i - 1] + '">← ' + chapters[i - 1].dataset.title + '</a>' : '<span></span>';
    const next = i < chapters.length - 1 ? '<a class="next" href="#' + ids[i + 1] + '">' + chapters[i + 1].dataset.title + ' →</a>' : '<span>fin.</span>';
    pager.innerHTML = prev + next;
    c.appendChild(pager);
  });

  function show(id) {
    if (!ids.includes(id)) id = ids[0];
    if (current === id) return;
    chapters.forEach(c => {
      const on = c.id === id;
      if (!on && c.classList.contains('active')) { c.classList.remove('active'); window.Sketches.deactivate(c); window.Demos.deactivate(c); }
    });
    const sec = document.getElementById(id);
    sec.classList.add('active');
    current = id;
    visited.add(id);
    try { localStorage.setItem(KEY, JSON.stringify(Array.from(visited))); } catch (e) { }
    toc.querySelectorAll('a').forEach(a => { a.classList.toggle('active', a.dataset.id === id); a.classList.toggle('done', visited.has(a.dataset.id)); });
    select.value = id;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    // give layout a tick before mounting canvases (they measure their host width)
    requestAnimationFrame(() => { window.Demos.activate(sec); window.Sketches.activate(sec); });
    document.title = decode(sec.dataset.title) + ' · SMI26 Creative Coding Crash Course';
  }

  function route() { show((location.hash || '#start').slice(1)); }
  window.addEventListener('hashchange', route);

  // language tabs
  document.querySelectorAll('.langs').forEach(box => {
    const pres = Array.from(box.querySelectorAll('pre'));
    const tabs = document.createElement('div'); tabs.className = 'tabs';
    const lab = document.createElement('span'); lab.textContent = 'same idea in'; tabs.appendChild(lab);
    pres.forEach((pre, i) => {
      const b = document.createElement('button'); b.textContent = pre.dataset.lang;
      b.addEventListener('click', () => { pres.forEach((p, j) => p.classList.toggle('on', i === j)); tabs.querySelectorAll('button').forEach((x, j) => x.classList.toggle('on', i === j)); });
      if (i === 0) { b.classList.add('on'); pre.classList.add('on'); }
      tabs.appendChild(b);
    });
    box.prepend(tabs);
  });

  // keyboard: ← → to move chapters when not typing
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('.CodeMirror, input, textarea, select')) return;
    const i = ids.indexOf(current);
    if (e.key === 'ArrowRight' && i < ids.length - 1) location.hash = '#' + ids[i + 1];
    if (e.key === 'ArrowLeft' && i > 0) location.hash = '#' + ids[i - 1];
  });

  route();
})();
