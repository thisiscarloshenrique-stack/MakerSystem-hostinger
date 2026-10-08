/* VENDE+ · página principal /vende-mais/ (08/10/2026): animações e interações.
   Sem bibliotecas e sem rastreamento. Sem JavaScript, as telas ficam paradas no estado final. */
(() => {
  'use strict';
  const d = document;
  const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const IO = 'IntersectionObserver' in window;
  const brl = v => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const ease = p => 1 - Math.pow(1 - p, 3);
  const watch = (els, fn, opts) => {
    if (!IO) return null;
    const io = new IntersectionObserver(es => es.forEach(e => fn(e, io)), opts);
    els.forEach(el => el && io.observe(el));
    return io;
  };

  /* tween com cancelamento guardado no dono (a cena), para reiniciar sem sobrar animação velha */
  function tween(owner, from, to, dur, fn) {
    if (RM) { fn(to); return; }
    const t0 = performance.now();
    let id = 0;
    const step = t => { const p = Math.min(1, (t - t0) / dur); fn(from + (to - from) * ease(p)); if (p < 1) id = requestAnimationFrame(step); };
    id = requestAnimationFrame(step);
    if (owner) (owner._c = owner._c || []).push(() => cancelAnimationFrame(id));
  }
  const cancelAll = owner => { (owner._c || []).forEach(f => f()); owner._c = []; };

  /* 1. Revelar ao rolar */
  d.querySelectorAll('.vh-list').forEach(ul => ul.querySelectorAll('li').forEach((li, i) => li.style.setProperty('--i', i)));
  const reveal = [...d.querySelectorAll('[data-r]')];
  if (!IO || RM) reveal.forEach(el => el.classList.add('in'));
  else watch(reveal, (e, io) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

  /* 2. Números que contam */
  const nums = [...d.querySelectorAll('[data-num]')];
  if (IO && !RM) {
    nums.forEach(n => { n.textContent = '0'; });
    watch(nums, (e, io) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      tween(null, 0, +el.dataset.num, 1100, v => { el.textContent = Math.round(v); });
      io.unobserve(el);
    }, { threshold: 0.6 });
  }

  /* 3. Rajada de alertas no topo (Venda · Cobrança · Condicional · Comissão) */
  const notes = [...d.querySelectorAll('.vh-notes .nt')];
  const words = [...d.querySelectorAll('.vh-burst li')];
  const stage = d.querySelector('.vh-stage');
  if (notes.length && !RM) {
    let i = 0, timer = 0, visible = true;
    const show = () => {
      notes.forEach((n, k) => { n.dataset.p = String((i - k + notes.length) % notes.length); });
      words.forEach((w, k) => w.classList.toggle('on', k === i));
    };
    const play = () => { if (!timer) timer = setInterval(() => { i = (i + 1) % notes.length; show(); }, 2400); };
    const pause = () => { clearInterval(timer); timer = 0; };
    show();
    if (IO) watch([stage], e => { visible = e.isIntersecting; visible ? play() : pause(); }, { threshold: 0.15 });
    else play();
    d.addEventListener('visibilitychange', () => { d.hidden ? pause() : (visible && play()); });
  }

  /* 4. Cenas: cada tela trabalha quando entra na tela e recomeça em ciclo */
  const typeIn = (s, el, text, speed) => {
    if (!el) return;
    clearInterval(el._t);
    if (RM) { el.textContent = text; return; }
    let k = 0;
    el.textContent = '';
    el._t = setInterval(() => { el.textContent = text.slice(0, ++k); if (k >= text.length) clearInterval(el._t); }, speed);
  };
  const setTot = (s, v) => s.querySelectorAll('[data-tot]').forEach(e => { e.textContent = brl(v); });
  const countTot = (s, to) => { const from = s._tot || 0; s._tot = to; tween(s, from, to, 700, v => setTot(s, v)); };
  const chance = (s, idx) => {
    const b = s.querySelectorAll('[data-chance]')[idx];
    if (b) tween(s, 0, +b.dataset.chance, 900, v => { b.textContent = Math.round(v) + '%'; });
  };
  const money = s => {
    s.querySelectorAll('[data-money]').forEach(b => tween(s, 0, +b.dataset.money, 1300, v => { b.textContent = brl(v); }));
    const r = s.querySelector('[data-ring]');
    if (r) {
      const lab = r.querySelector('b');
      tween(s, 0, +r.dataset.ring, 1300, v => {
        r.style.setProperty('--v', v.toFixed(2));
        lab.textContent = v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
      });
    }
  };
  const SCENES = {
    pdv: {
      len: 12500,
      reset: s => { const t = s.querySelector('.ui-type'); clearInterval(t && t._t); if (t) t.textContent = ''; s._tot = 0; setTot(s, 0); },
      steps: [[250, 1], [1200, 0, s => typeIn(s, s.querySelector('.ui-type'), 'camisa jeans', 75)], [2500, 2],
        [3800, 3, s => countTot(s, 214.9)], [5100, 4], [6100, 5, s => countTot(s, 429.8)], [7600, 6], [8800, 7]]
    },
    cond: { len: 10500, steps: [[250, 1], [1100, 2], [1800, 3], [3100, 4], [4400, 5]] },
    gat: {
      len: 11500,
      reset: s => s.querySelectorAll('[data-chance]').forEach(b => { b.textContent = '0%'; }),
      steps: [[250, 1], [1200, 2, s => chance(s, 0)], [2300, 3, s => { chance(s, 1); chance(s, 2); }], [3700, 4], [5100, 5]]
    },
    chat: { len: 13500, steps: [[350, 1], [1200, 2], [2900, 3], [4700, 4], [5600, 5], [7100, 6], [8300, 7]] },
    din: {
      len: 10500,
      reset: s => {
        s.querySelectorAll('[data-money]').forEach(b => { b.textContent = brl(0); });
        const r = s.querySelector('[data-ring]');
        if (r) { r.style.setProperty('--v', '0'); r.querySelector('b').textContent = '0,0%'; }
      },
      steps: [[250, 1, money], [1900, 2], [3000, 3], [4200, 4]]
    },
    est: { len: 10500, steps: [[250, 1], [1100, 2], [2500, 3], [3700, 4], [4800, 5]] }
  };
  function scene(el, def) {
    let timers = [], running = false;
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    const reset = () => {
      cancelAll(el);
      el.classList.remove(...[...el.classList].filter(c => /^s\d+$/.test(c)));
      if (def.reset) def.reset(el);
    };
    const apply = ([, n, fn]) => { if (n) el.classList.add('s' + n); if (fn) fn(el); };
    const run = () => {
      clear(); reset();
      def.steps.forEach(st => timers.push(setTimeout(() => apply(st), st[0])));
      timers.push(setTimeout(() => { if (running) run(); }, def.len));
    };
    return {
      start() { if (!running) { running = true; run(); } },
      stop() { running = false; clear(); },
      finish() { clear(); reset(); def.steps.forEach(apply); }
    };
  }
  const scenes = [...d.querySelectorAll('[data-scene]')].map(el => {
    const def = SCENES[el.dataset.scene];
    if (!def) return null;
    const sc = scene(el, def);
    el._scene = sc;
    if (RM || !IO) sc.finish();
    return el;
  }).filter(Boolean);
  if (IO && !RM) {
    watch(scenes, e => { const sc = e.target._scene; e.isIntersecting ? sc.start() : sc.stop(); }, { threshold: 0.3 });
  }

  /* 5. Navegação dos capítulos: capítulo atual e barra de progresso */
  const nav = d.querySelector('.vh-chnav');
  const chs = d.querySelector('.vh-chs');
  if (nav && chs) {
    const inner = nav.querySelector('.vh-chnav__in');
    const bar = nav.querySelector('.vh-chnav__bar');
    const links = [...inner.querySelectorAll('a')];
    let current = '';
    const center = (box, item) => {
      const dx = item.getBoundingClientRect().left - box.getBoundingClientRect().left - (box.clientWidth - item.offsetWidth) / 2;
      box.scrollBy({ left: dx, behavior: RM ? 'auto' : 'smooth' });
    };
    const activate = id => {
      if (id === current) return;
      current = id;
      links.forEach(a => {
        const on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('on', on);
        if (on) { a.setAttribute('aria-current', 'step'); center(inner, a); } else a.removeAttribute('aria-current');
      });
    };
    watch(links.map(a => d.getElementById(a.getAttribute('href').slice(1))), e => { if (e.isIntersecting) activate(e.target.id); }, { rootMargin: '-42% 0px -52% 0px' });
    let raf = 0;
    const progress = () => {
      raf = 0;
      const r = chs.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.5 - r.top) / r.height));
      if (r.top > innerHeight * 0.5 && links[0]) activate(links[0].getAttribute('href').slice(1));
      bar.style.setProperty('--p', p.toFixed(4));
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(progress); }, { passive: true });
    addEventListener('resize', progress, { passive: true });
    progress();
  }

  /* 6. Abas dos tipos de loja (teclado: setas, Home e End) */
  const tabs = [...d.querySelectorAll('.seg-tabs [role="tab"]')];
  const tabList = d.querySelector('.seg-tabs');
  const select = (t, focus) => {
    tabs.forEach(x => {
      const on = x === t;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      const p = d.getElementById(x.getAttribute('aria-controls'));
      if (p) p.classList.toggle('on', on);
    });
    if (focus) t.focus({ preventScroll: true });
    const dx = t.getBoundingClientRect().left - tabList.getBoundingClientRect().left - (tabList.clientWidth - t.offsetWidth) / 2;
    tabList.scrollBy({ left: dx, behavior: RM ? 'auto' : 'smooth' });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const k = e.key;
      const j = k === 'ArrowRight' ? i + 1 : k === 'ArrowLeft' ? i - 1 : k === 'Home' ? 0 : k === 'End' ? tabs.length - 1 : null;
      if (j === null) return;
      e.preventDefault();
      select(tabs[(j + tabs.length) % tabs.length], true);
    });
  });

  /* 7. Barra fixa no celular: aparece depois do topo e some perto do fim da página */
  const bar = d.getElementById('vh-bar');
  const hero = d.querySelector('.vh-hero');
  const ends = [d.querySelector('.vh-final'), d.querySelector('.ft')].filter(Boolean);
  if (bar && hero && IO) {
    const seen = new Set();
    const upd = () => bar.classList.toggle('on', !seen.size);
    watch([hero, ...ends], e => { e.isIntersecting ? seen.add(e.target) : seen.delete(e.target); upd(); }, { threshold: 0 });
  }
})();
