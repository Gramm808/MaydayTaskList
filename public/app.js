(function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function asset(src) {
    return /^(https?:)?\/\//.test(src) || src.charAt(0) === '/' ? src : '/' + src;
  }
  function loadData() {
    return fetch('/tasks.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  function makeCard(t, isDone) {
    var card = el('article', 'card' + (isDone ? ' done' : ''));
    var top = el('div', 'top');
    top.appendChild(el('div', 'num', isDone ? t.id + ' ✓' : t.id));
    var body = el('div');
    body.appendChild(el('div', 'loc', t.location || ''));
    body.appendChild(el('div', 'desc', t.description || ''));
    top.appendChild(body);
    card.appendChild(top);

    var imgs = t.images || [];
    if (imgs.length) {
      var grid = el('div', 'imgs' + (imgs.length > 1 ? ' multi' : ''));
      imgs.forEach(function (src) {
        var a = el('a'); a.href = asset(src); a.target = '_blank'; a.rel = 'noopener';
        var im = el('img'); im.src = asset(src); im.loading = 'lazy';
        im.alt = 'Item ' + t.id + (t.location ? ' – ' + t.location : '');
        a.appendChild(im); grid.appendChild(a);
      });
      card.appendChild(grid);
    }
    return card;
  }

  function renderPunchList(data, category) {
    var list = document.getElementById('list');
    var items = (data.tasks || []).filter(function (t) { return t.category === category; });
    var open = items.filter(function (t) { return !t.done; });
    var done = items.filter(function (t) { return t.done; });

    var sub = [];
    if (data.updated) sub.push('Updated ' + data.updated);
    sub.push(open.length + ' open' + (done.length ? ' · ' + done.length + ' done' : ''));
    document.getElementById('sub').textContent = sub.join(' · ');

    list.textContent = '';
    open.forEach(function (t) { list.appendChild(makeCard(t, false)); });
    if (!open.length) list.appendChild(el('div', 'note center', items.length ? 'No open items.' : 'No items yet.'));

    if (done.length) {
      var det = el('details', 'done-group');
      var sum = el('summary', null, 'Completed ');
      sum.appendChild(el('span', 'count', '(' + done.length + ')'));
      det.appendChild(sum);
      done.forEach(function (t) { det.appendChild(makeCard(t, true)); });
      list.appendChild(det);
    }
  }

  function renderCounts(data) {
    var spans = document.querySelectorAll('[data-open-count]');
    Array.prototype.forEach.call(spans, function (s) {
      var cat = s.getAttribute('data-open-count');
      var n = (data.tasks || []).filter(function (t) { return t.category === cat && !t.done; }).length;
      s.textContent = n + ' open';
    });
  }

  var body = document.body;
  var category = body.getAttribute('data-punchlist');
  var wantsCounts = document.querySelector('[data-open-count]');
  if (!category && !wantsCounts) return;

  loadData().then(function (data) {
    if (category) renderPunchList(data, category);
    if (wantsCounts) renderCounts(data);
  }).catch(function () {
    if (category) {
      var list = document.getElementById('list');
      list.textContent = '';
      list.appendChild(el('div', 'note center', 'Could not load the punch list.'));
    }
  });
})();
