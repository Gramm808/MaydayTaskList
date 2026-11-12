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

  var STATUS = {
    'waiting-material': 'Waiting on material',
    'ready': 'Ready to work',
    'in-progress': 'In progress',
    'waiting-other': 'Waiting on another task or crew',
    'not-started': 'Not started',
    'question': 'Question to answer'
  };
  function field(label, text) {
    var d = el('div', 'field');
    d.appendChild(el('span', 'flabel', label + ': '));
    d.appendChild(document.createTextNode(text));
    return d;
  }

  // Description text; [label](/path) becomes a link (same-site paths or http(s) only).
  function descNode(text) {
    var d = el('div', 'desc');
    var re = /\[([^\]]+)\]\(((?:\/|https?:\/\/)[^)\s]+)\)/g, last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) d.appendChild(document.createTextNode(text.slice(last, m.index)));
      var link = el('a', 'desc-link', m[1]); link.href = m[2];
      if (m[2].charAt(0) !== '/') { link.target = '_blank'; link.rel = 'noopener'; }
      d.appendChild(link);
      last = re.lastIndex;
    }
    if (last < text.length) d.appendChild(document.createTextNode(text.slice(last)));
    return d;
  }

  function makeCard(t, isDone) {
    var card = el('article', 'card' + (isDone ? ' done' : '') + (t.category ? ' cat-' + t.category : ''));
    var top = el('div', 'top');
    top.appendChild(el('div', 'num', isDone ? t.id + ' ✓' : t.id));
    var body = el('div');
    body.appendChild(el('div', 'loc', t.location || ''));
    body.appendChild(descNode(t.description || ''));
    var chips = el('div', 'chips');
    if (t.status && STATUS[t.status]) chips.appendChild(el('span', 'chip status-' + t.status, STATUS[t.status]));
    if (chips.childNodes.length) body.appendChild(chips);
    top.appendChild(body);
    card.appendChild(top);

    var more = el('details', 'more');
    var rows = [];
    if (t.current_state) rows.push(['Current state', t.current_state]);
    if (t.materials) rows.push(['Materials', t.materials]);
    if (t.note) rows.push(['Note', t.note]);
    if (!isDone && t.assigned) rows.push(['Assigned to', t.assigned]);
    if (isDone && t.completed_by) rows.push(['Completed by', t.completed_by]);
    if (rows.length) {
      more.appendChild(el('summary', null, 'Details'));
      rows.forEach(function (r) { more.appendChild(field(r[0], r[1])); });
    }

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
    if (rows.length) card.appendChild(more);
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

  function renderPriorities(data) {
    var box = document.getElementById('priorities');
    var list = document.getElementById('priority-list');
    if (!box || !list) return;
    var byId = {};
    (data.tasks || []).forEach(function (t) { byId[t.id] = t; });
    var items = (data.priorities || []).map(function (id) { return byId[id]; })
      .filter(function (t) { return t && !t.done; });
    list.textContent = '';
    items.forEach(function (t) { list.appendChild(makeCard(t, false)); });
    box.hidden = items.length === 0;
  }

  var body = document.body;
  var category = body.getAttribute('data-punchlist');
  var wantsCounts = document.querySelector('[data-open-count]');
  var wantsPriorities = document.getElementById('priorities');
  if (!category && !wantsCounts && !wantsPriorities) return;

  loadData().then(function (data) {
    if (category) renderPunchList(data, category);
    if (wantsCounts) renderCounts(data);
    if (wantsPriorities) renderPriorities(data);
  }).catch(function () {
    if (category) {
      var list = document.getElementById('list');
      list.textContent = '';
      list.appendChild(el('div', 'note center', 'Could not load the punch list.'));
    }
  });
})();
