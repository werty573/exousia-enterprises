(() => {
  'use strict';
  const EX = window.EX, { money, esc } = EX;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- demo sign in ---------- */
  const gate = $('#gate'), app = $('#app');
  const enter = () => { gate.hidden = true; app.hidden = false; try { sessionStorage.setItem('ex-owner', '1'); } catch (e) {} render(); };
  $('#signIn').addEventListener('click', enter);

  let P = EX.products(), O = EX.orders();
  let tab = 'products', pFilter = 'all', oFilter = 'all';
  const saveP = () => EX.saveProducts(P);

  /* ---------- render ---------- */
  const chips = (el, list, cur) => { el.innerHTML = list.map(([k, t]) => `<button class="chip" type="button" aria-pressed="${k === cur}" data-f="${k}">${t}</button>`).join(''); };
  function render() {
    $('#stNew').textContent = O.filter(o => o.status === 'new').length;
    $('#stPaid').textContent = O.filter(o => o.status === 'paid').length;
    $('#stLow').textContent = P.filter(p => p.s <= EX.LOW).length;
    $('.a-tabs').dataset.tab = tab;
    $$('.a-tabs [role=tab]').forEach(t => t.setAttribute('aria-selected', t.dataset.tab === tab));
    $$('.dock [data-tab]').forEach(t => t.setAttribute('aria-current', t.dataset.tab === tab));
    $('#panelProducts').hidden = tab !== 'products';
    $('#panelOrders').hidden = tab !== 'orders';
    $('#addBtn').style.visibility = tab === 'products' ? '' : 'hidden';

    chips($('#pFilters'), [['all', 'All'], ['health', 'Health'], ['home', 'Home'], ['low', 'Low stock'], ['hidden', 'Hidden']], pFilter);
    const pl = P.filter(p => pFilter === 'all' || (pFilter === 'low' ? p.s <= EX.LOW : pFilter === 'hidden' ? p.hidden : p.w === pFilter));
    $('#pRows').innerHTML = pl.length ? pl.map(p => `<li data-id="${esc(p.id)}" class="${p.hidden ? 'is-hidden' : ''}">
      <img src="${esc(EX.img(p, 160))}" alt="" width="56" height="56" loading="lazy">
      <div><div class="r-name">${esc(p.n)}</div><div class="r-meta">${money(p.p)} · ${p.w === 'health' ? 'Health' : 'Home'}</div>
        <div class="r-flags">${p.s < 1 ? '<span class="flag out">Sold out</span>' : p.s <= EX.LOW ? '<span class="flag low">Low stock</span>' : ''}${p.hidden ? '<span class="flag">Hidden</span>' : ''}</div></div>
      <div class="r-act">
        <div class="qty" role="group" aria-label="Stock of ${esc(p.n)}"><button type="button" data-stock="-1" aria-label="One less in stock"${p.s < 1 ? ' disabled' : ''}><i class="ph-light ph-minus" aria-hidden="true"></i></button><span>${p.s}</span><button type="button" data-stock="1" aria-label="One more in stock"><i class="ph-light ph-plus" aria-hidden="true"></i></button></div>
        <div class="r-tools"><button class="icon-btn" type="button" data-eye aria-label="${p.hidden ? 'Show on the shop' : 'Hide from the shop'}"><i class="ph-light ph-${p.hidden ? 'eye-slash' : 'eye'}" aria-hidden="true"></i></button><button class="icon-btn" type="button" data-edit aria-label="Edit ${esc(p.n)}"><i class="ph-light ph-pencil-simple" aria-hidden="true"></i></button></div>
      </div></li>`).join('') : '<li class="empty-list">No products here yet.</li>';

    chips($('#oFilters'), [['all', 'All'], ['new', 'New'], ['paid', 'Paid'], ['delivered', 'Delivered']], oFilter);
    const ol = O.filter(o => oFilter === 'all' || o.status === oFilter);
    const label = { new: 'New', paid: 'Paid', delivered: 'Delivered' };
    $('#oRows').innerHTML = ol.length ? ol.map(o => `<li class="order" data-no="${esc(o.no)}">
      <div class="o-head"><span class="o-no">${esc(o.no)}</span><span class="flag ${o.status === 'delivered' ? '' : o.status}">${label[o.status]}</span></div>
      <div class="o-who">${esc(o.name)} · ${esc(o.recv)}<br>${new Date(o.at).toLocaleString('en-TT', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · ${o.pay === 'online' ? 'Paid online by card' : 'Pays on delivery or pickup'}${o.note ? '<br>Note: ' + esc(o.note) : ''}</div>
      <div class="o-items">${o.items.map(i => `${i.q} x ${esc(i.n)}`).join('<br>')}</div>
      <div class="o-foot"><span class="o-total">${money(o.total)}</span>${o.status === 'new' ? '<button class="btn btn-primary" type="button" data-mark="paid">Mark paid</button>' : o.status === 'paid' ? '<button class="btn btn-primary" type="button" data-mark="delivered">Mark delivered</button>' : '<span class="hint">Done</span>'}</div>
    </li>`).join('') : '<li class="empty-list">No orders in this list.</li>';
  }

  /* ---------- actions ---------- */
  const setTab = t => { tab = t; render(); };
  $('.a-tabs').addEventListener('click', e => { const t = e.target.closest('[data-tab]'); if (t) setTab(t.dataset.tab); });
  $('.dock').addEventListener('click', e => { const t = e.target.closest('[data-tab]'); if (t) { setTab(t.dataset.tab); scrollTo(0, 0); } });
  $('.stats').addEventListener('click', e => {
    const s = e.target.closest('[data-go]'); if (!s) return;
    const [t, f] = s.dataset.go.split(':'); tab = t; if (t === 'orders') oFilter = f; else pFilter = f; render();
  });
  $('#pFilters').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) { pFilter = c.dataset.f; render(); } });
  $('#oFilters').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) { oFilter = c.dataset.f; render(); } });
  $('#pRows').addEventListener('click', e => {
    const li = e.target.closest('li[data-id]'); if (!li) return;
    const p = P.find(x => x.id === li.dataset.id); if (!p) return;
    const st = e.target.closest('[data-stock]');
    if (st) { p.s = Math.max(0, Math.min(9999, p.s + (+st.dataset.stock))); saveP(); render(); return; }
    if (e.target.closest('[data-eye]')) { p.hidden = !p.hidden; saveP(); render(); return; }
    if (e.target.closest('[data-edit]')) openSheet(p);
  });
  $('#oRows').addEventListener('click', e => {
    const b = e.target.closest('[data-mark]'); if (!b) return;
    const o = O.find(x => x.no === b.closest('.order').dataset.no); if (!o) return;
    o.status = b.dataset.mark; EX.saveOrders(O); render();
  });
  $('#resetBtn').addEventListener('click', () => { EX.reset(); P = EX.products(); O = EX.orders(); render(); });

  /* ---------- add / edit sheet ---------- */
  const sheet = $('#sheet'), scrim = $('#scrim'), form = $('#pForm');
  let editing = null, photo = null, closeT, armed = false;
  function fillShelves(w, cur) {
    const list = EX.CATS[w];
    $('#fC').innerHTML = list.map(c => `<option${c === cur ? ' selected' : ''}>${esc(c)}</option>`).join('');
  }
  function setPhoto(src) {
    photo = src;
    const pv = $('#photoPrev');
    pv.style.backgroundImage = src ? `url("${src}")` : '';
    pv.classList.toggle('has', !!src);
  }
  function openSheet(p) {
    clearTimeout(closeT);
    editing = p || null; armed = false;
    $('#sheetTitle').textContent = p ? 'Edit product' : 'Add product';
    $('#fN').value = p ? p.n : ''; $('#fM').value = p ? p.m : '';
    $('#fP').value = p ? p.p : ''; $('#fS').value = p ? p.s : '';
    form.w.value = p ? p.w : 'health'; fillShelves(form.w.value, p && p.c);
    $('#fShow').checked = p ? !p.hidden : true;
    $('#fPhoto').value = '';
    setPhoto(p ? EX.img(p, 300) : null); if (p && !p.photo) photo = null;
    $('#delBtn').hidden = !p; $('#delBtn').textContent = 'Delete product';
    $('#errN').hidden = true; $('#errP').hidden = true;
    sheet.hidden = false; scrim.hidden = false; void sheet.offsetWidth;
    sheet.classList.add('on'); scrim.classList.add('on');
    document.body.style.paddingRight = (innerWidth - document.documentElement.clientWidth) + 'px';
    document.body.classList.add('locked');
    $('.sheet-body', sheet).scrollTop = 0;
  }
  function closeSheet() {
    sheet.classList.remove('on'); scrim.classList.remove('on');
    document.body.classList.remove('locked'); document.body.style.paddingRight = '';
    closeT = setTimeout(() => { sheet.hidden = true; scrim.hidden = true; }, 430);
  }
  $('#addBtn').addEventListener('click', () => openSheet());
  $('#dockAdd').addEventListener('click', () => { tab = 'products'; render(); openSheet(); });
  $('#closeSheet').addEventListener('click', closeSheet);
  scrim.addEventListener('click', closeSheet);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.classList.contains('on')) closeSheet(); });
  form.addEventListener('change', e => { if (e.target.name === 'w') fillShelves(form.w.value); });

  // shrink a phone photo to a 900px JPEG before it is stored
  $('#fPhoto').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => {
      const k = Math.min(1, 900 / Math.max(im.width, im.height));
      const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      setPhoto(c.toDataURL('image/jpeg', 0.72)); URL.revokeObjectURL(url);
    };
    im.src = url;
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const n = $('#fN').value.trim(), price = parseFloat($('#fP').value.replace(/[^0-9.]/g, ''));
    $('#errN').hidden = !!n; $('#errP').hidden = price > 0;
    if (!n) { $('#fN').focus(); return; }
    if (!(price > 0)) { $('#fP').focus(); return; }
    const data = { n, m: $('#fM').value.trim(), p: Math.round(price * 100) / 100, s: Math.max(0, parseInt($('#fS').value, 10) || 0), w: form.w.value, c: $('#fC').value, hidden: !$('#fShow').checked };
    if (editing) { Object.assign(editing, data); if (photo) editing.photo = photo; }
    else P.unshift({ id: 'p' + Date.now().toString(36), ...data, photo: photo || undefined, i: '1556911220-bff31c812dba' });
    if (!saveP()) {
      // storage full: keep the product, drop the heavy photo
      (editing || P[0]).photo = undefined; saveP();
      alert('That photo was too large to keep in this demo, so the product was saved without it.');
    }
    pFilter = 'all'; closeSheet(); render();
  });
  $('#delBtn').addEventListener('click', () => {
    if (!editing) return;
    if (!armed) { armed = true; $('#delBtn').textContent = 'Tap again to delete'; return; }
    P = P.filter(x => x !== editing); saveP(); closeSheet(); render();
  });

  /* ---------- theme + live sync with the shop ---------- */
  const root = document.documentElement, themeBtn = $('#themeBtn');
  const paintTheme = () => {
    const dark = root.dataset.theme === 'dark';
    themeBtn.innerHTML = `<i class="ph-light ph-${dark ? 'sun' : 'moon'}" aria-hidden="true"></i>`;
    $('meta[name=theme-color]').content = dark ? '#121018' : '#FAF9FE';
  };
  themeBtn.addEventListener('click', () => { root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('ex-theme', root.dataset.theme); } catch (e) {} paintTheme(); });
  const pull = () => { if (sheet.classList.contains('on')) return; P = EX.products(); O = EX.orders(); render(); };
  addEventListener('storage', pull);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(); });

  paintTheme();
  let signed = false; try { signed = sessionStorage.getItem('ex-owner') === '1'; } catch (e) {}
  if (signed) enter();
})();
