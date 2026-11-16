(() => {
  'use strict';
  const WA = '18686832333';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const img = (id, s = 600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${s}&h=${s}&q=70`;
  const money = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // Sample catalogue. Replace with real stock at launch.
  const CATS = {
    health: ['Supplements', 'Natural care', 'Body and skin'],
    home: ['Kitchen', 'Cooling', 'Laundry and cleaning']
  };
  const P = [
    { id: 'omega', w: 'health', c: 'Supplements', n: 'Omega-3 Fish Oil', m: '120 softgels', p: 145, i: '1512069772995-ec65ed45afd6', a: 'Fish oil softgels and tablets' },
    { id: 'multi', w: 'health', c: 'Supplements', n: 'Daily Multivitamin', m: '90 capsules', p: 120, i: '1584362917165-526a968579e8', a: 'Capsules in a small glass dish' },
    { id: 'zinc', w: 'health', c: 'Supplements', n: 'Zinc and Vitamin C', m: '60 tablets', p: 95, i: '1584308666744-24d5c474f2ae', a: 'Tablets in blister packs' },
    { id: 'honey', w: 'health', c: 'Natural care', n: 'Raw Honey', m: '500 g jar', p: 85, i: '1558642452-9d2a7deb7f62', a: 'Honey dripping from a dipper into a jar' },
    { id: 'mint', w: 'health', c: 'Natural care', n: 'Peppermint Essential Oil', m: '30 ml dropper', p: 70, i: '1608571423902-eed4a5ad8108', a: 'Amber dropper bottle of essential oil' },
    { id: 'serum', w: 'health', c: 'Body and skin', n: 'Vitamin C Face Serum', m: '30 ml', p: 165, i: '1576426863848-c21f53c60b19', a: 'White serum bottle with a gold collar' },
    { id: 'roller', w: 'health', c: 'Body and skin', n: 'Facial Roller Set', m: 'Roller, gua sha and oil', p: 130, i: '1600428877878-1a0fd85beda8', a: 'Rose quartz facial roller with face oil' },
    { id: 'lotion', w: 'health', c: 'Body and skin', n: 'Hydrating Body Lotion', m: '250 ml pump', p: 110, i: '1540555700478-4be289fbecef', a: 'White pump bottle of lotion beside a towel and tulips' },
    { id: 'blend', w: 'home', c: 'Kitchen', n: 'Glass Jug Blender', m: '1.5 L, 600 W', p: 399, i: '1585515320310-259814833e62', a: 'Blender jug filled with cut fruit' },
    { id: 'mixer', w: 'home', c: 'Kitchen', n: 'Stand Mixer', m: '5 L bowl, 6 speeds', p: 1899, i: '1578643463396-0997cb5328c1', a: 'Cream stand mixer with a steel bowl' },
    { id: 'hand', w: 'home', c: 'Kitchen', n: 'Hand Mixer', m: '5 speeds, 2 beaters', p: 249, i: '1583241475880-083f84372725', a: 'White hand mixer beside eggs and butter' },
    { id: 'kettle', w: 'home', c: 'Kitchen', n: 'Stovetop Kettle', m: '2.5 L stainless steel', p: 189, i: '1594213114663-d94db9b17125', a: 'Stainless steel kettle' },
    { id: 'fan', w: 'home', c: 'Cooling', n: 'Desk Fan', m: '8 inch, 3 speeds', p: 229, i: '1618941716939-553df3c6c278', a: 'Black desk fan on a table' },
    { id: 'fridge', w: 'home', c: 'Cooling', n: 'Retro Fridge', m: '10 cu ft, top freezer', p: 5499, i: '1571175443880-49e1d25b2bc5', a: 'Teal retro fridge beside house plants' },
    { id: 'wash', w: 'home', c: 'Laundry and cleaning', n: 'Front Load Washer', m: '7 kg, 15 programmes', p: 3299, i: '1626806787461-102c1bfaaea1', a: 'White front load washing machine' },
    { id: 'vac', w: 'home', c: 'Laundry and cleaning', n: 'Robot Vacuum', m: 'Self docking', p: 1499, i: '1558317374-067fb5f30001', a: 'Robot vacuum on a rug' }
  ];
  const byId = Object.fromEntries(P.map(p => [p.id, p]));

  let world = store.get('ex-world', 'health');
  if (!CATS[world]) world = 'health';
  let filter = 'All';
  let cart = store.get('ex-cart', {});
  Object.keys(cart).forEach(k => { if (!byId[k] || !(cart[k] > 0)) delete cart[k]; });

  const grid = $('#grid'), filters = $('#filters'), sw = $('.switch');

  /* ---------- shop ---------- */
  const controlHTML = id => cart[id]
    ? `<div class="qty" role="group" aria-label="Quantity of ${byId[id].n}"><button type="button" data-step="-1" aria-label="Remove one"><i class="ph-light ph-minus" aria-hidden="true"></i></button><span>${cart[id]}</span><button type="button" data-step="1" aria-label="Add one more"><i class="ph-light ph-plus" aria-hidden="true"></i></button></div>`
    : `<button class="add" type="button" data-step="1" aria-label="Add ${byId[id].n} to basket"><i class="ph-light ph-plus" aria-hidden="true"></i></button>`;

  function renderFilters() {
    filters.innerHTML = ['All', ...CATS[world]].map(c => `<button class="chip" type="button" aria-pressed="${c === filter}" data-f="${c}">${c}</button>`).join('');
  }
  function renderGrid(animate) {
    const list = P.filter(p => p.w === world && (filter === 'All' || p.c === filter));
    grid.innerHTML = list.map(p => `<article class="card" data-id="${p.id}">
      <div class="card-img"><img src="${img(p.i)}" alt="${p.a}" width="600" height="600" loading="lazy" decoding="async"></div>
      <h3>${p.n}</h3><p class="card-meta">${p.m}</p>
      <div class="card-row"><span class="price">${money(p.p)}</span><span class="ctl">${controlHTML(p.id)}</span></div>
    </article>`).join('');
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
    const q = Math.max(0, Math.min(99, (cart[id] || 0) + d));
    if (q) cart[id] = q; else delete cart[id];
    store.set('ex-cart', cart);
    const card = $(`.card[data-id="${id}"] .ctl`, grid);
    if (card) card.innerHTML = controlHTML(id);
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
    $('#empty').hidden = n > 0;
    $('#filled').hidden = n === 0;
    $('#sheetFoot').hidden = n === 0;
    renderLines();
  }
  function renderLines() {
    $('#lines').innerHTML = Object.keys(cart).map(id => {
      const p = byId[id];
      return `<li data-id="${id}"><img src="${img(p.i, 160)}" alt="" width="52" height="52">
        <div><div class="line-name">${p.n}</div><div class="line-price">${money(p.p)} each</div></div>${controlHTML(id)}</li>`;
    }).join('');
  }
  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-step]'); if (!b) return;
    const id = b.closest('.card').dataset.id, d = +b.dataset.step;
    step(id, d);
    const next = $(`.card[data-id="${id}"] [data-step="${cart[id] ? d : 1}"]`, grid);
    if (next && e.detail === 0) next.focus();
  });
  $('#lines').addEventListener('click', e => {
    const b = e.target.closest('[data-step]'); if (!b) return;
    step(b.closest('li').dataset.id, +b.dataset.step);
  });

  /* ---------- sheet ---------- */
  const sheet = $('#sheet'), scrim = $('#scrim');
  let lastFocus, closeT;
  function openSheet() {
    clearTimeout(closeT);
    lastFocus = document.activeElement;
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
    closeT = setTimeout(() => { sheet.hidden = true; scrim.hidden = true; }, 430);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  $('#openBasket').addEventListener('click', openSheet);
  bar.addEventListener('click', openSheet);
  $('#closeBasket').addEventListener('click', closeSheet);
  scrim.addEventListener('click', closeSheet);
  $('#emptyBrowse').addEventListener('click', () => { closeSheet(); $('#shop').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
  document.addEventListener('keydown', e => {
    if (!sheet.classList.contains('on')) return;
    if (e.key === 'Escape') closeSheet();
    if (e.key === 'Tab') {
      const f = $$('button, [href], input, textarea', sheet).filter(el => el.offsetParent !== null);
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
  const form = $('#orderForm'), fName = $('#fName'), errName = $('#errName');
  form.addEventListener('change', () => { $('#areaField').hidden = form.recv.value !== 'Delivery'; });
  fName.addEventListener('input', () => { if (fName.value.trim()) { fName.removeAttribute('aria-invalid'); errName.hidden = true; } });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = fName.value.trim();
    if (!name) { fName.setAttribute('aria-invalid', 'true'); errName.hidden = false; fName.focus(); return; }
    const { t } = totals();
    const lines = Object.keys(cart).map(id => `- ${cart[id]} x ${byId[id].n} (${byId[id].m}): ${money(cart[id] * byId[id].p)}`);
    const recv = form.recv.value === 'Delivery' ? 'Delivery' + (form.area.value.trim() ? ' to ' + form.area.value.trim() : '') : 'Pickup';
    const msg = ['Hello Exousia Enterprises, I would like to order:', '', ...lines, '', 'Total: TT' + money(t), 'Name: ' + name, 'Receive by: ' + recv];
    if (form.note.value.trim()) msg.push('Note: ' + form.note.value.trim());
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(msg.join('\n')), '_blank', 'noopener');
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

  /* ---------- init ---------- */
  sw.dataset.world = world;
  $$('[role=tab]', sw).forEach(t => { const on = t.dataset.world === world; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
  paintTheme(); renderFilters(); renderGrid(false); sync(false);
})();
