(() => {
  'use strict';
  const EX = window.EX, { money, esc } = EX;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  let P = [], byId = {};
  function load() { P = EX.products(); byId = Object.fromEntries(P.map(p => [p.id, p])); }
  load();

  let world = store.get('ex-world', 'health');
  if (!EX.CATS[world]) world = 'health';
  let filter = 'All';
  let cart = store.get('ex-cart', {});
  function clampCart() {
    Object.keys(cart).forEach(k => {
      const p = byId[k];
      if (!p || p.hidden || p.s < 1) delete cart[k]; else if (cart[k] > p.s) cart[k] = p.s;
      if (cart[k] !== undefined && !(cart[k] > 0)) delete cart[k];
    });
  }
  clampCart();

  const grid = $('#grid'), filters = $('#filters'), sw = $('.switch');

  /* ---------- shop ---------- */
  function controlHTML(id) {
    const p = byId[id];
    if (p.s < 1) return '<span class="sold-tag">Sold out</span>';
    const q = cart[id];
    return q
      ? `<div class="qty" role="group" aria-label="Quantity of ${esc(p.n)}"><button type="button" data-step="-1" aria-label="Remove one"><i class="ph-light ph-minus" aria-hidden="true"></i></button><span>${q}</span><button type="button" data-step="1" aria-label="Add one more"${q >= p.s ? ' disabled' : ''}><i class="ph-light ph-plus" aria-hidden="true"></i></button></div>`
      : `<button class="add" type="button" data-step="1" aria-label="Add ${esc(p.n)} to basket"><i class="ph-light ph-plus" aria-hidden="true"></i></button>`;
  }
  function renderFilters() {
    const cats = [...new Set(P.filter(p => p.w === world && !p.hidden).map(p => p.c))];
    const ordered = EX.CATS[world].filter(c => cats.includes(c)).concat(cats.filter(c => !EX.CATS[world].includes(c)));
    if (filter !== 'All' && !ordered.includes(filter)) filter = 'All';
    filters.innerHTML = ['All', ...ordered].map(c => `<button class="chip" type="button" aria-pressed="${c === filter}" data-f="${esc(c)}">${esc(c)}</button>`).join('');
  }
  function renderGrid(animate) {
    const list = P.filter(p => p.w === world && !p.hidden && (filter === 'All' || p.c === filter));
    grid.innerHTML = list.length ? list.map(p => `<article class="card${p.s < 1 ? ' is-sold' : ''}" data-id="${esc(p.id)}">
      <div class="card-img"><img src="${esc(EX.img(p))}" alt="${esc(p.n)}" width="600" height="600" loading="lazy" decoding="async"></div>
      <h3>${esc(p.n)}</h3><p class="card-meta">${esc(p.m)}</p>${p.s > 0 && p.s <= EX.LOW ? `<p class="left">Only ${p.s} left</p>` : ''}
      <div class="card-row"><span class="price">${money(p.p)}</span><span class="ctl">${controlHTML(p.id)}</span></div>
    </article>`).join('') : '<p class="none">Nothing on this shelf right now. Check the other side of the shop.</p>';
    grid.setAttribute('aria-labelledby', 'tab-' + world);
    if (animate && grid.animate) $$('.card', grid).forEach((c, i) => c.animate(
      reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
      { duration: 360, delay: i * 35, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'backwards' }));
  }
  let swapT;
  function swap() {
    clearTimeout(swapT);
    grid.classList.add('out');
    swapT = setTimeout(() => { renderGrid(true); grid.classList.remove('out'); }, 120);
  }
  function setWorld(w, focusTab) {
    if (w === world && !focusTab) return;
    world = w; filter = 'All'; store.set('ex-world', w);
    sw.dataset.world = w;
    $$('[role=tab]', sw).forEach(t => { const on = t.dataset.world === w; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (on && focusTab) t.focus(); });
    renderFilters(); swap();
  }
  sw.addEventListener('click', e => { const t = e.target.closest('[role=tab]'); if (t) setWorld(t.dataset.world); });
  sw.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setWorld(world === 'health' ? 'home' : 'health', true); }
  });
  filters.addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c || c.dataset.f === filter) return;
    filter = c.dataset.f;
    $$('.chip', filters).forEach(x => x.setAttribute('aria-pressed', x === c));
    swap();
  });
  $$('.door').forEach(d => d.addEventListener('click', () => {
    setWorld(d.dataset.world);
    $('#shop').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }));

  /* ---------- basket ---------- */
  const countEl = $('#count'), bar = $('#bar');
  const totals = () => {
    let n = 0, t = 0;
    for (const k in cart) { n += cart[k]; t += cart[k] * byId[k].p; }
    return { n, t };
  };
  function step(id, d) {
    const p = byId[id]; if (!p) return;
    const q = Math.max(0, Math.min(p.s, 99, (cart[id] || 0) + d));
    if (q) cart[id] = q; else delete cart[id];
    store.set('ex-cart', cart);
    const ctl = $(`.card[data-id="${CSS.escape(id)}"] .ctl`, grid);
    if (ctl) ctl.innerHTML = controlHTML(id);
    sync(d > 0);
  }
  function sync(bump) {
    const { n, t } = totals();
    countEl.textContent = n;
    countEl.classList.toggle('has', n > 0);
    if (bump) { countEl.classList.remove('bump'); void countEl.offsetWidth; countEl.classList.add('bump'); }
    $('#barCount').textContent = n + (n === 1 ? ' item' : ' items');
    $('#barTotal').textContent = money(t);
    $('#total').textContent = money(t);
    bar.hidden = n === 0;
    if (view === 'basket') showView('basket');
    $('#lines').innerHTML = Object.keys(cart).map(id => {
      const p = byId[id];
      return `<li data-id="${esc(id)}"><img src="${esc(EX.img(p, 160))}" alt="" width="52" height="52">
        <div><div class="line-name">${esc(p.n)}</div><div class="line-price">${money(p.p)} each</div></div>${controlHTML(id)}</li>`;
    }).join('');
  }
  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-step]'); if (!b) return;
    const id = b.closest('.card').dataset.id, d = +b.dataset.step;
    step(id, d);
    const next = $(`.card[data-id="${CSS.escape(id)}"] [data-step="${cart[id] ? d : 1}"]`, grid);
    if (next && e.detail === 0) next.focus();
  });
  $('#lines').addEventListener('click', e => {
    const b = e.target.closest('[data-step]'); if (!b) return;
    step(b.closest('li').dataset.id, +b.dataset.step);
  });

  /* ---------- sheet and its three views ---------- */
  const sheet = $('#sheet'), scrim = $('#scrim');
  let view = 'basket', lastFocus, closeT;
  function showView(v) {
    view = v;
    const has = totals().n > 0;
    $('#empty').hidden = !(v === 'basket' && !has);
    $('#filled').hidden = !(v === 'basket' && has);
    $('#sheetFoot').hidden = !(v === 'basket' && has);
    $('#payView').hidden = v !== 'pay';
    $('#doneView').hidden = v !== 'done';
    $('#sheetTitle').textContent = v === 'pay' ? 'Card payment' : v === 'done' ? 'Thank you' : 'Your basket';
    if (v !== 'basket') $('.sheet-body').scrollTop = 0;
  }
  function openSheet() {
    clearTimeout(closeT);
    lastFocus = document.activeElement;
    if (view === 'done') showView('basket');
    sheet.hidden = false; scrim.hidden = false;
    void sheet.offsetWidth;
    sheet.classList.add('on'); scrim.classList.add('on');
    document.body.style.paddingRight = (innerWidth - document.documentElement.clientWidth) + 'px';
    document.body.classList.add('locked');
    bar.classList.add('away');
    $('#closeBasket').focus({ preventScroll: true });
  }
  function closeSheet() {
    sheet.classList.remove('on'); scrim.classList.remove('on');
    document.body.classList.remove('locked');
    document.body.style.paddingRight = '';
    barWatch();
    closeT = setTimeout(() => { sheet.hidden = true; scrim.hidden = true; if (view !== 'basket') showView('basket'); }, 430);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  $('#openBasket').addEventListener('click', openSheet);
  bar.addEventListener('click', openSheet);
  $('#closeBasket').addEventListener('click', closeSheet);
  scrim.addEventListener('click', closeSheet);
  const toShop = () => { closeSheet(); $('#shop').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); };
  $('#emptyBrowse').addEventListener('click', toShop);
  $('#doneShop').addEventListener('click', toShop);
  document.addEventListener('keydown', e => {
    if (!sheet.classList.contains('on')) return;
    if (e.key === 'Escape') closeSheet();
    if (e.key === 'Tab') {
      const f = $$('button, [href], input, textarea', sheet).filter(el => el.offsetParent !== null && !el.disabled);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  // the phone basket bar steps aside near the page end so it never covers the contact rows or footer
  let nearEnd = false;
  function barWatch() { bar.classList.toggle('away', nearEnd || sheet.classList.contains('on')); }
  if ('IntersectionObserver' in window) {
    const seen = new Set();
    const io = new IntersectionObserver(es => {
      es.forEach(en => en.isIntersecting ? seen.add(en.target) : seen.delete(en.target));
      nearEnd = seen.size > 0; barWatch();
    }, { rootMargin: '0px 0px -40px 0px' });
    io.observe($('#contact')); io.observe($('#foot'));
  }

  /* ---------- order ---------- */
  const form = $('#orderForm'), fName = $('#fName'), errName = $('#errName'), sendBtn = $('#sendBtn');
  function paintForm() {
    const pickup = form.recv.value !== 'Delivery', online = form.pay.value === 'online';
    $('#areaField').hidden = pickup;
    $('#codLabel').textContent = pickup ? 'Pay on pickup' : 'Pay on delivery';
    $('#payHint').textContent = online ? 'Pay by card now. Your order is confirmed right away.' : (pickup ? 'Pay when you collect your order.' : 'Pay when your order arrives.');
    sendBtn.innerHTML = online ? '<i class="ph-light ph-credit-card" aria-hidden="true"></i>Continue to payment' : '<i class="ph-light ph-whatsapp-logo" aria-hidden="true"></i>Send order on WhatsApp';
    $('#fine').textContent = online ? 'Next step: a secure card payment page.' : 'Opens WhatsApp with your order ready to send. Nothing is charged here.';
  }
  form.addEventListener('change', paintForm);
  fName.addEventListener('input', () => { if (fName.value.trim()) { fName.removeAttribute('aria-invalid'); errName.hidden = true; } });
  const details = () => ({
    name: fName.value.trim(),
    recv: form.recv.value === 'Delivery' ? 'Delivery' + (form.area.value.trim() ? ' to ' + form.area.value.trim() : '') : 'Pickup',
    note: form.note.value.trim()
  });
  function waLink(o) {
    const msg = ['Hello Exousia Enterprises, this is my order ' + o.no + ':', '',
      ...o.items.map(i => `- ${i.q} x ${i.n} (${i.m}): ${money(i.q * i.p)}`), '',
      'Total: TT' + money(o.total), 'Payment: ' + (o.pay === 'online' ? 'Paid online by card' : (o.recv === 'Pickup' ? 'Pay on pickup' : 'Pay on delivery')),
      'Name: ' + o.name, 'Receive by: ' + o.recv];
    if (o.note) msg.push('Note: ' + o.note);
    return 'https://wa.me/' + EX.WA + '?text=' + encodeURIComponent(msg.join('\n'));
  }
  function finish(pay) {
    load(); clampCart();
    const order = EX.placeOrder({ lines: Object.keys(cart).map(id => ({ id, q: cart[id] })), pay, ...details() });
    if (!order) { sync(false); showView('basket'); return null; }
    cart = {}; store.set('ex-cart', cart);
    load(); renderGrid(false);
    $('#doneNo').textContent = order.no;
    $('#doneText').textContent = pay === 'online'
      ? 'Your card payment of TT' + money(order.total) + ' went through. We will message you to arrange ' + (order.recv === 'Pickup' ? 'pickup.' : 'delivery.')
      : 'Your order is in. Send the WhatsApp message and we will confirm stock and ' + (order.recv === 'Pickup' ? 'pickup.' : 'delivery.');
    $('#doneWa').href = waLink(order);
    $('#doneWaText').textContent = pay === 'online' ? 'Send receipt on WhatsApp' : 'Open WhatsApp again';
    view = 'done'; sync(false); showView('done');
    return order;
  }
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!fName.value.trim()) { fName.setAttribute('aria-invalid', 'true'); errName.hidden = false; fName.focus(); return; }
    if (form.pay.value === 'online') {
      const { t } = totals();
      $('#payTotal').textContent = 'TT' + money(t);
      $('#payBtnAmt').textContent = 'Pay TT' + money(t);
      $('#cName').value = fName.value.trim();
      showView('pay');
      return;
    }
    const order = finish('cod');
    if (order) window.open(waLink(order), '_blank', 'noopener');
  });
  $('#payBack').addEventListener('click', () => showView('basket'));
  const payBtn = $('#payBtn');
  payBtn.addEventListener('click', () => {
    if (payBtn.classList.contains('busy')) return;
    payBtn.classList.add('busy'); payBtn.setAttribute('aria-busy', 'true');
    setTimeout(() => { payBtn.classList.remove('busy'); payBtn.removeAttribute('aria-busy'); finish('online'); }, 1300);
  });

  /* ---------- theme ---------- */
  const themeBtn = $('#themeBtn'), root = document.documentElement;
  function paintTheme() {
    const dark = root.dataset.theme === 'dark';
    themeBtn.innerHTML = `<i class="ph-light ph-${dark ? 'sun' : 'moon'}" aria-hidden="true"></i>`;
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    $('meta[name=theme-color]').content = dark ? '#121018' : '#FAF9FE';
  }
  themeBtn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('ex-theme', root.dataset.theme); } catch (e) {}
    paintTheme();
  });

  /* ---------- reveal ---------- */
  if ('IntersectionObserver' in window) {
    const ro = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach(el => ro.observe(el));
  } else $$('.rv').forEach(el => el.classList.add('in'));

  /* ---------- live stock: the owner page writes to the same store ---------- */
  function refresh() { load(); clampCart(); store.set('ex-cart', cart); renderFilters(); renderGrid(false); sync(false); }
  addEventListener('storage', e => { if (e.key === 'ex-products' || e.key === null) refresh(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !sheet.classList.contains('on')) refresh(); });

  /* ---------- init ---------- */
  sw.dataset.world = world;
  $$('[role=tab]', sw).forEach(t => { const on = t.dataset.world === world; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
  paintTheme(); paintForm(); renderFilters(); renderGrid(false); sync(false);
})();
