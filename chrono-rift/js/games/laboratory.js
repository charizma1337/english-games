/* Мини-игра №5 — «ЛАБОРАТОРИЯ ТРЁХ ФОРМ»: вращающиеся кольца-криптекс */
(function () {
  const { $, $$, esc, wait } = CR.ui;
  const CFG = {
    easy: { n: 5, lockV1: true, typed: false, items: 5 },
    normal: { n: 6, lockV1: false, typed: false, items: 5 },
    hero: { n: 7, lockV1: false, typed: true, items: 6 }
  };
  const CRYSTAL_COLORS = ['#4ED9E8', '#F24971', '#FFD66D', '#9BE564', '#B48CFF', '#FF9EC4', '#7FB2FF'];

  function crystalSVG(color, cls) {
    return `<svg class="crystal ${cls || ''}" viewBox="0 0 60 90" aria-hidden="true">
      <defs><linearGradient id="cg${color.slice(1)}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".45" stop-color="${color}"/><stop offset="1" stop-color="#1b1450"/></linearGradient></defs>
      <polygon points="30,2 56,30 30,88 4,30" fill="url(#cg${color.slice(1)})" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>
      <polyline points="4,30 30,40 56,30" fill="none" stroke="#fff" stroke-opacity=".5"/><line x1="30" y1="40" x2="30" y2="88" stroke="#fff" stroke-opacity=".35"/></svg>`;
  }

  CR.games.laboratory = {
    start(root, ctx) {
      const cfg = CFG[ctx.difficulty];
      const sel = CR.progress.pickVerbs(cfg.n, { maxNew: 2, filter: (v) => v.hard || v.group === 'all3' });
      const verbs = sel.verbs;
      let k = 0, mistakes = 0, stopped = false, busy = false;
      const review = [];
      let rings = [];

      root.innerHTML = `<div class="lab-game">
        <div class="game-hud"><div class="hud-left"><span class="hud-pill lab-count"></span></div>
          <div class="hud-right"><span class="hud-pill">Ошибки: <b class="lab-mis">0</b></span></div></div>
        <div class="lab-device">
          <div class="lab-core"><div class="lab-beam"></div><div class="lab-crystal">${crystalSVG('#555a8f', 'dim')}</div></div>
          <div class="lab-target"></div>
          <div class="lab-rings"></div>
          <button class="lab-lever btn primary big">${CR.icon('bolt')} АКТИВИРОВАТЬ</button>
          <p class="lab-help">Крути кольца: стрелки ▲▼, свайп или колёсико мыши. Клавиатура: ← → выбрать кольцо, ↑ ↓ крутить, Enter — рычаг.</p>
        </div>
        <div class="lab-collection"><span>Коллекция кристаллов:</span><div class="lab-crystals"></div></div>
      </div>`;

      function ringOptions(v, f) {
        if (f === 1) {
          const others = CR.shuffle(CR.VERBS.filter((x) => x !== v && (x.group === v.group || x.hard))).slice(0, cfg.items - 1).map((x) => x.v1);
          return { opts: CR.shuffle([v.v1].concat(others)) };
        }
        const cor = CR.Q.pick(CR.forms(v, f));
        return { opts: CR.shuffle([cor].concat(CR.Q.distractors(v, f, cfg.items - 1))) };
      }

      function setup() {
        busy = false;
        const v = verbs[k];
        $('.lab-count', root).textContent = `Кристалл ${k + 1} / ${verbs.length}`;
        const typedF = cfg.typed ? (Math.random() < 0.5 ? 2 : 3) : 0;
        $('.lab-target', root).innerHTML = cfg.lockV1
          ? `<span>Собери формы глагола</span><b>${v.v1.toUpperCase()}</b><small>${esc(v.ru)}</small>`
          : `<span>Собери глагол со значением</span><b class="ru">«${esc(v.ru)}»</b>${ctx.difficulty === 'hero' ? '' : `<small>подсказка: начинается на «${v.v1[0]}»</small>`}`;
        const ringsEl = $('.lab-rings', root);
        rings = [1, 2, 3].map((f) => {
          if (f === 1 && cfg.lockV1) return { f, locked: true, opts: [v.v1], idx: 0 };
          if (f === typedF) return { f, typed: true };
          const { opts } = ringOptions(v, f);
          let idx = Math.floor(Math.random() * opts.length);
          if (CR.Q.valid(v, f, opts[idx])) idx = (idx + 1 + Math.floor(Math.random() * (opts.length - 1))) % opts.length;
          return { f, opts, idx };
        });
        ringsEl.innerHTML = rings.map((r, i) => {
          const label = ['V1', 'V2', 'V3'][r.f - 1];
          if (r.typed) return `<div class="ring typed" data-i="${i}"><small>${label} · впиши</small><input class="input ring-input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="?"></div>`;
          const n = r.opts.length, step = 360 / n, rad = Math.round(29 / Math.tan(Math.PI / n));
          return `<div class="ring ${r.locked ? 'locked' : ''}" data-i="${i}" tabindex="0" aria-label="Кольцо ${label}">
            <small>${label}</small>
            ${r.locked ? '' : `<button class="ring-btn up" data-d="-1" aria-label="Вверх">${CR.icon('up')}</button>`}
            <div class="ring-window"><div class="ring-drum" style="--rad:${rad}px">
              ${r.opts.map((o, j) => `<span class="ring-item" style="transform:rotateX(${-j * step}deg) translateZ(${rad}px)">${esc(o)}</span>`).join('')}
            </div><div class="ring-marker"></div></div>
            ${r.locked ? '<span class="ring-lock">' + CR.icon('lock') + '</span>' : `<button class="ring-btn down" data-d="1" aria-label="Вниз">${CR.icon('down')}</button>`}
          </div>`;
        }).join('');
        rings.forEach((r, i) => { if (!r.typed) spin(i, 0, true); });
        $('.lab-crystal', root).innerHTML = crystalSVG('#555a8f', 'dim');
        $('.lab-device', root).classList.remove('active', 'fail');
        activeRing = rings.findIndex((r) => !r.locked);
        focusRing();
        verbs[k]._tried = false;
      }

      let activeRing = 0;
      function spin(i, d, silent) {
        const r = rings[i]; if (!r || r.locked || r.typed) return;
        r.idx = (r.idx + d + r.opts.length) % r.opts.length;
        r.turns = (r.turns || 0) + d;
        const el = $(`.ring[data-i="${i}"]`, root);
        const step = 360 / r.opts.length;
        // поворот: учитываем накопленные обороты, чтобы барабан крутился в ту же сторону
        const base = r.base == null ? (r.base = r.idx) : r.base;
        $('.ring-drum', el).style.transform = `translateZ(calc(var(--rad) * -1)) rotateX(${(base + r.turns) * step}deg)`;
        $$('.ring-item', el).forEach((it, j) => it.classList.toggle('sel', j === r.idx));
        el.classList.remove('bad', 'good');
        if (!silent) CR.sfx.tick();
      }
      function focusRing() { $$('.ring', root).forEach((el, i) => el.classList.toggle('focus', i === activeRing)); }

      $('.lab-rings', root).addEventListener('click', (e) => {
        const b = e.target.closest('.ring-btn'); const ring = e.target.closest('.ring');
        if (ring) { activeRing = +ring.dataset.i; focusRing(); }
        if (b) spin(+ring.dataset.i, +b.dataset.d);
        else if (ring && e.target.closest('.ring-item')) {
          // нажатие на соседнее слово — повернуть к нему
          const r = rings[+ring.dataset.i]; if (!r || r.locked) return;
          spin(+ring.dataset.i, 1);
        }
      });
      $('.lab-rings', root).addEventListener('wheel', (e) => {
        const ring = e.target.closest('.ring'); if (!ring) return;
        e.preventDefault(); spin(+ring.dataset.i, e.deltaY > 0 ? 1 : -1);
      }, { passive: false });
      let ty = null, tRing = null;
      $('.lab-rings', root).addEventListener('touchstart', (e) => { const ring = e.target.closest('.ring:not(.typed)'); if (!ring) return; ty = e.touches[0].clientY; tRing = +ring.dataset.i; }, { passive: true });
      $('.lab-rings', root).addEventListener('touchmove', (e) => {
        if (ty == null) return;
        const dy = e.touches[0].clientY - ty;
        if (Math.abs(dy) > 28) { spin(tRing, dy < 0 ? 1 : -1); ty = e.touches[0].clientY; }
        e.preventDefault();
      }, { passive: false });
      $('.lab-rings', root).addEventListener('touchend', () => { ty = null; });

      function key(e) {
        if (CR.ui.current !== 'scr-game' || stopped || busy) return;
        if (document.querySelector('.modal-wrap, .lesson-wrap, .dialog')) return;
        const inInput = e.target.tagName === 'INPUT';
        if (e.key === 'Enter') { e.preventDefault(); activate(); return; }
        if (inInput) return;
        if (e.key === 'ArrowUp') { spin(activeRing, -1); e.preventDefault(); }
        else if (e.key === 'ArrowDown') { spin(activeRing, 1); e.preventDefault(); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          const d = e.key === 'ArrowLeft' ? -1 : 1; let n = activeRing;
          for (let s = 0; s < 3; s++) { n = (n + d + 3) % 3; if (!rings[n].locked) break; }
          activeRing = n; focusRing(); if (rings[n].typed) $('.ring-input', root).focus(); e.preventDefault();
        }
      }
      document.addEventListener('keydown', key);

      $('.lab-lever', root).onclick = activate;
      async function activate() {
        if (busy || stopped) return;
        const v = verbs[k];
        const res = rings.map((r) => {
          if (r.typed) { const val = $('.ring-input', root).value; return { r, ok: CR.check(v, r.f, val), val }; }
          const val = r.opts[r.idx];
          return { r, ok: r.f === 1 ? val === v.v1 : CR.Q.valid(v, r.f, val), val };
        });
        if (res.some((x) => x.r.typed && !CR.norm(x.val))) { CR.ui.shake($('.ring.typed', root)); $('.ring-input', root).focus(); return; }
        busy = true;
        CR.sfx.lock();
        $('.lab-lever', root).classList.add('pulled');
        setTimeout(() => $('.lab-lever', root).classList.remove('pulled'), 400);
        const first = !v._tried; v._tried = true;
        if (first) res.forEach((x) => { if (!x.r.locked) CR.progress.answer(v.id, x.r.f, x.ok); });
        res.forEach((x) => { const el = $(`.ring[data-i="${rings.indexOf(x.r)}"]`, root); el.classList.toggle('good', x.ok); el.classList.toggle('bad', !x.ok); });
        if (res.every((x) => x.ok)) {
          const color = CRYSTAL_COLORS[k % CRYSTAL_COLORS.length];
          $('.lab-device', root).classList.add('active');
          $('.lab-crystal', root).innerHTML = crystalSVG(color, 'lit');
          CR.sfx.crystal();
          CR.ui.burstAt($('.lab-crystal', root), { n: 26, spread: 120 });
          CR.ui.comic('CHARGED!', color);
          $('.lab-crystals', root).insertAdjacentHTML('beforeend', `<button class="mini-crystal" data-speak="${v.id}" title="${v.v1} — ${CR.formText(v, 2)} — ${CR.formText(v, 3)}">${crystalSVG(color)}<small>${v.v1}</small></button>`);
          CR.ui.hint(root, 'marinette', `<b>${v.v1.toUpperCase()} — ${CR.formText(v, 2).toUpperCase()} — ${CR.formText(v, 3).toUpperCase()}</b>. ${v.note ? esc(v.note) : 'Кристалл заряжен!'}`, 3200);
          await wait(CR.ui.reduced() ? 600 : 1800);
          k++;
          if (k >= verbs.length) return done();
          setup();
        } else {
          if (first) { mistakes++; if (!review.includes(v)) review.push(v); }
          $('.lab-mis', root).textContent = mistakes;
          $('.lab-device', root).classList.add('fail');
          CR.sfx.wrong();
          const bad = res.filter((x) => !x.ok).map((x) => {
            const other = [1, 2, 3].find((f) => f !== x.r.f && CR.Q.valid(v, f, x.val));
            if (x.r.f === 1) return `в кольце V1 нужен глагол «${esc(v.ru)}»`;
            return other ? `«${esc(x.val)}» — это V${other}, а кольцо просит V${x.r.f}` : `в кольце V${x.r.f} неверная форма`;
          });
          CR.ui.hint(root, 'marinette', 'Искра! ' + bad.join('; ') + '. Красные кольца надо повернуть.', 4200);
          await wait(500);
          $('.lab-device', root).classList.remove('fail');
          busy = false;
          // после двух неудач на EASY подсвечиваем правильный ответ
          if (ctx.difficulty === 'easy' && first === false) {
            CR.ui.hint(root, 'marinette', `Правильная тройка: <b>${v.v1} — ${CR.formText(v, 2)} — ${CR.formText(v, 3)}</b>`, 5000);
          }
        }
      }

      function done() {
        ctx.finish({
          win: true, mistakes, total: verbs.length, review,
          title: 'Кристаллы заряжены!',
          text: 'Ты собрал самые трудные тройки. Все кристаллы — в твоей коллекции.',
          stats: [['кристаллов', verbs.length], ['ошибок', mistakes]]
        });
      }

      (async () => {
        await CR.ui.lesson(sel.fresh);
        if (stopped) return;
        setup();
      })();
      return { stop() { stopped = true; document.removeEventListener('keydown', key); } };
    }
  };
})();
