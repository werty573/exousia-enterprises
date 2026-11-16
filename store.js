/* Exousia Enterprises demo store. Shared by the shop and the owner page through localStorage.
   At launch this file is swapped for Supabase calls with the same shape. */
(() => {
  'use strict';
  const SEED = [
    { id: 'omega', w: 'health', c: 'Supplements', n: 'Omega-3 Fish Oil', m: '120 softgels', p: 145, s: 24, i: '1512069772995-ec65ed45afd6' },
    { id: 'multi', w: 'health', c: 'Supplements', n: 'Daily Multivitamin', m: '90 capsules', p: 120, s: 18, i: '1584362917165-526a968579e8' },
    { id: 'zinc', w: 'health', c: 'Supplements', n: 'Zinc and Vitamin C', m: '60 tablets', p: 95, s: 4, i: '1584308666744-24d5c474f2ae' },
    { id: 'honey', w: 'health', c: 'Natural care', n: 'Raw Honey', m: '500 g jar', p: 85, s: 12, i: '1558642452-9d2a7deb7f62' },
    { id: 'mint', w: 'health', c: 'Natural care', n: 'Peppermint Essential Oil', m: '30 ml dropper', p: 70, s: 9, i: '1608571423902-eed4a5ad8108' },
    { id: 'serum', w: 'health', c: 'Body and skin', n: 'Vitamin C Face Serum', m: '30 ml', p: 165, s: 7, i: '1576426863848-c21f53c60b19' },
    { id: 'roller', w: 'health', c: 'Body and skin', n: 'Facial Roller Set', m: 'Roller, gua sha and oil', p: 130, s: 0, i: '1600428877878-1a0fd85beda8' },
    { id: 'lotion', w: 'health', c: 'Body and skin', n: 'Hydrating Body Lotion', m: '250 ml pump', p: 110, s: 15, i: '1540555700478-4be289fbecef' },
    { id: 'blend', w: 'home', c: 'Kitchen', n: 'Glass Jug Blender', m: '1.5 L, 600 W', p: 399, s: 8, i: '1585515320310-259814833e62' },
    { id: 'mixer', w: 'home', c: 'Kitchen', n: 'Stand Mixer', m: '5 L bowl, 6 speeds', p: 1899, s: 3, i: '1578643463396-0997cb5328c1' },
    { id: 'hand', w: 'home', c: 'Kitchen', n: 'Hand Mixer', m: '5 speeds, 2 beaters', p: 249, s: 11, i: '1583241475880-083f84372725' },
    { id: 'kettle', w: 'home', c: 'Kitchen', n: 'Stovetop Kettle', m: '2.5 L stainless steel', p: 189, s: 14, i: '1594213114663-d94db9b17125' },
    { id: 'fan', w: 'home', c: 'Cooling', n: 'Desk Fan', m: '8 inch, 3 speeds', p: 229, s: 20, i: '1618941716939-553df3c6c278' },
    { id: 'fridge', w: 'home', c: 'Cooling', n: 'Retro Fridge', m: '10 cu ft, top freezer', p: 5499, s: 2, i: '1571175443880-49e1d25b2bc5' },
    { id: 'wash', w: 'home', c: 'Laundry and cleaning', n: 'Front Load Washer', m: '7 kg, 15 programmes', p: 3299, s: 5, i: '1626806787461-102c1bfaaea1' },
    { id: 'vac', w: 'home', c: 'Laundry and cleaning', n: 'Robot Vacuum', m: 'Self docking', p: 1499, s: 6, i: '1558317374-067fb5f30001' }
  ];
  const day = 864e5;
  const SEED_ORDERS = [
    { no: 'EX-1041', at: Date.now() - 0.2 * day, name: 'Anjali Mohammed', recv: 'Delivery to Chaguanas', note: '', pay: 'online', status: 'paid', total: 544, items: [{ n: 'Glass Jug Blender', q: 1, p: 399 }, { n: 'Omega-3 Fish Oil', q: 1, p: 145 }] },
    { no: 'EX-1040', at: Date.now() - 1.1 * day, name: 'Marcus Joseph', recv: 'Pickup', note: 'After 4 pm', pay: 'cod', status: 'new', total: 255, items: [{ n: 'Raw Honey', q: 3, p: 85 }] },
    { no: 'EX-1039', at: Date.now() - 2.4 * day, name: 'Renee Baptiste', recv: 'Delivery to Arima', note: '', pay: 'online', status: 'delivered', total: 229, items: [{ n: 'Desk Fan', q: 1, p: 229 }] }
  ];
  const K = { p: 'ex-products', o: 'ex-orders', q: 'ex-seq' };
  const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  window.EX = {
    WA: '18682770650',
    PHONE: '868-277-0650',
    LOW: 5,
    CATS: { health: ['Supplements', 'Natural care', 'Body and skin'], home: ['Kitchen', 'Cooling', 'Laundry and cleaning'] },
    money: n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    esc: s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    img(p, s = 600) { return p.photo || `https://images.unsplash.com/photo-${p.i}?auto=format&fit=crop&w=${s}&h=${s}&q=70`; },
    products() { const p = read(K.p, null); return Array.isArray(p) && p.length ? p : SEED.map(x => ({ ...x })); },
    saveProducts(p) { return write(K.p, p); },
    orders() { const o = read(K.o, null); return Array.isArray(o) ? o : SEED_ORDERS.map(x => ({ ...x })); },
    saveOrders(o) { return write(K.o, o); },
    // lines: [{id, q}]. Lowers stock, gives the next order number, and files the order for the owner page.
    placeOrder({ lines, name, recv, note, pay }) {
      const ps = this.products(), items = [];
      let total = 0;
      lines.forEach(l => {
        const p = ps.find(x => x.id === l.id); if (!p) return;
        const q = Math.min(l.q, p.s); if (q < 1) return;
        p.s -= q; total += q * p.p;
        items.push({ n: p.n, m: p.m, q, p: p.p });
      });
      if (!items.length) return null;
      const seq = read(K.q, 1041) + 1;
      const order = { no: 'EX-' + seq, at: Date.now(), name, recv, note: note || '', pay, status: pay === 'online' ? 'paid' : 'new', total, items };
      const os = this.orders(); os.unshift(order);
      write(K.q, seq); this.saveProducts(ps); this.saveOrders(os);
      return order;
    },
    reset() { try { Object.values(K).forEach(k => localStorage.removeItem(k)); } catch (e) {} }
  };
})();
