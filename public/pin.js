(function () {
  var BLOB = {"s":"h5ZP9y3cjGWDaNP+WrUymg==","i":"3FH7/p3DLRB/phBF","c":"Rn2yL0I8iWHF9oth7M/j30VIjLPFttJQfQrLB4RcxXB3cn5QvgkX/UVQn6lSLk4DnwS2Xi+hMBl6P1dVP4ZOLx36sDAxzsduP5lBoizFob41d9LB96Kzzp0UYRr4gWiveRduJexC6j0ZMCNdd19xEEI8FBoYQH7naUsnLltgI4yFsHzytJqX18qE7NvgCA==","n":250000};
  function b64(s) { var r = atob(s), u = new Uint8Array(r.length); for (var i = 0; i < r.length; i++) u[i] = r.charCodeAt(i); return u; }
  function unlock(pin) {
    if (!window.crypto || !crypto.subtle) return Promise.resolve(null);
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']).then(function (km) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(BLOB.s), iterations: BLOB.n, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    }).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(BLOB.i) }, key, b64(BLOB.c));
    }).then(function (buf) { return JSON.parse(new TextDecoder().decode(buf)); }, function () { return null; });
  }
  function store(pin) { try { sessionStorage.setItem('mp', pin); } catch (e) {} }
  function stored() { try { return sessionStorage.getItem('mp'); } catch (e) { return null; } }
  window.MaydayPin = { unlock: unlock, store: store, stored: stored };

  /* Home page: button that asks for the PIN, then opens the private page. */
  function bindForm(form, onOk) {
    var input = form.querySelector('input'), msg = form.querySelector('.pinmsg');
    form.addEventListener('submit', function (e) {
      e.preventDefault(); msg.textContent = '';
      var pin = input.value.trim(); if (!pin) return;
      unlock(pin).then(function (links) {
        if (links) { store(pin); onOk(links); }
        else { msg.textContent = 'Wrong PIN.'; input.value = ''; input.focus(); }
      });
    });
  }
  window.MaydayPin.bindForm = bindForm;

  var open = document.getElementById('private-open');
  if (open) {
    var box = document.getElementById('pin-box');
    open.addEventListener('click', function (e) { e.preventDefault(); box.hidden = !box.hidden; if (!box.hidden) box.querySelector('input').focus(); });
    bindForm(document.getElementById('pin-form'), function () { location.href = '/private.html'; });
  }
})();
