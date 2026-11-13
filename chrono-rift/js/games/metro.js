/* Мини-игра №6 — «МЕТРО ВРЕМЕНИ»: рассади формы по вагонам V1 / V2 / V3 */
(function () {
  const { $, $$, esc, wait } = CR.ui;
  const CFG = {
    easy: { n: 10, time: 0, verbs: 6 },
    normal: { n: 14, time: 9, verbs: 8 },
    hero: { n: 18, time: 6, verbs: 10 }
  };
  const NAMES = ['', 'Infinitive', 'Past Simple', 'Past Participle'];

  CR.games.metro = {
    start(root, ctx) {
      const cfg = CFG[ctx.difficulty];
      const sel = CR.progress.pickVerbs(cfg.verbs, { maxNew: 2 });
      // Очередь слов: равномерно V1/V2/V3, без повторов одного слова
      const words = [];
      const seen = new Set();
      let guard = 0;
      while (words.length < cfg.n && guard++ < 400) {
        const v = sel.verbs[words.length % sel.verbs.length];
        const f = 1 + ((words.length + Math.floor(Math.random() * 3)) % 3);
        const w = CR.Q.pick(CR.forms(v, f));
        if (seen.has(w)) continue;
        seen.add(w);
        words.push({ v, f, w, cats: CR.categoriesOf(w) });
      }
      CR.shuffle(words);

      let i = 0, good = 0, mistakes = 0, stopped = false, lock = false, timer = null, tLeft = 0, dnd = null;
      const review = [];
      root.innerHTML = `<div class="metro-game">
        <div class="game-hud"><div class="hud-left"><span class="hud-pill m-count"></span></div>
          <div class="hud-right"><span class="hud-pill">Энергия поезда: <b class="m-good">0</b> / ${Math.ceil(cfg.n * 0.7)}</span></div></div>
        <div class="metro-station">
          <div class="metro-portal"><div class="portal"><i></i><i></i><i></i></div></div>
          <div class="metro-train">
            <div class="loco"><span class="loco-light"></span><b>CHRONO</b></div>
            ${[1, 2, 3].map((f) => `<button class="wagon w${f}" data-f="${f}"><span class="wagon-label">V${f}</span><small>${NAMES[f]}</small><span class="wagon-seats"></span><span class="wagon-wheels"><i></i><i></i></span></button>`).join('')}
          </div>
          <div class="metro-rails"></div>
        </div>
        <div class="metro-platform">
          <div class="metro-queue"></div>
          <div class="metro-current"></div>
          <div class="metro-timer"><i></i></div>
          <p class="metro-fb"></p>
        </div>
        <p class="metro-help">Перетащи слово в вагон, нажми на вагон или клавиши 1 · 2 · 3.</p>
      </div>`;

      function show() {
        if (stopped) return;
        if (i >= words.length) return depart();
        const cur = words[i];
        $('.m-count', root).textContent = `Пассажир ${i + 1} / ${words.length}`;
        $('.metro-current', root).innerHTML = `<button class="metro-word pop-in" data-w="${esc(cur.w)}">${esc(cur.w.toUpperCase())}${ctx.difficulty === 'easy' ? `<small>${esc(cur.v.ru)}</small>` : ''}</button>`;
        $('.metro-queue', root).innerHTML = words.slice(i + 1, i + 4).map((x) => `<span class="q-word">${esc(x.w)}</span>`).join('');
        lock = false;
        if (cfg.time) startTimer(); else $('.metro-timer', root).style.display = 'none';
      }
      function startTimer() {
        clearInterval(timer);
        tLeft = cfg.time * 1000;
        const bar = $('.metro-timer i', root);
        bar.style.width = '100%';
        timer = setInterval(() => {
          if (document.querySelector('.modal-wrap, .lesson-wrap, .dialog')) return;
          tLeft -= 100;
          bar.style.width = Math.max(0, tLeft / (cfg.time * 1000) * 100) + '%';
          bar.parentElement.classList.toggle('low', tLeft < 2500);
          if (tLeft <= 0) { clearInterval(timer); place(0); }
        }, 100);
      }

      async function place(f) {
        if (lock || stopped || i >= words.length) return;
        lock = true; clearInterval(timer);
        const cur = words[i];
        const ok = cur.cats.includes(f);
        const wordEl = $('.metro-word', root);
        const fb = $('.metro-fb', root);
        const owner = (CR.FORM_INDEX[cur.w] || []).map((x) => `${x.id} (V${x.f})`).filter((x, k, a) => a.indexOf(x) === k).join(', ');
        if (ok) {
          good++;
          CR.progress.answer(cur.v.id, f, true);
          const wagon = $(`.wagon[data-f="${f}"]`, root);
          flyTo(wordEl, wagon);
          wagon.classList.add('bump'); setTimeout(() => wagon.classList.remove('bump'), 400);
          $('.wagon-seats', wagon).insertAdjacentHTML('beforeend', `<i title="${esc(cur.w)}"></i>`);
          CR.sfx.correct();
          fb.className = 'metro-fb ok';
          fb.innerHTML = cur.cats.length > 1
            ? `${esc(cur.w)} подходит в вагоны ${cur.cats.map((x) => 'V' + x).join(' и ')} — твой ответ верный!`
            : `${esc(cur.w)} → ${owner} ✓`;
        } else {
          mistakes++;
          CR.progress.answer(cur.v.id, cur.f, false);
          if (!review.includes(cur.v)) review.push(cur.v);
          CR.sfx.wrong();
          if (f) CR.ui.shake($(`.wagon[data-f="${f}"]`, root));
          if (wordEl) wordEl.classList.add('bad');
          fb.className = 'metro-fb bad';
          fb.innerHTML = `${f ? '' : 'Время вышло! '}<b>${esc(cur.w)}</b> — это ${cur.cats.map((x) => 'V' + x).join(' / ')} от <b>${esc(owner.replace(/ \(V\d\)/g, ''))}</b>: ${cur.v.v1} — ${CR.formText(cur.v, 2)} — ${CR.formText(cur.v, 3)}`;
          // правильные вагоны мигают
          cur.cats.forEach((x) => { const w = $(`.wagon[data-f="${x}"]`, root); w.classList.add('hint'); setTimeout(() => w.classList.remove('hint'), 1400); });
        }
        $('.m-good', root).textContent = good;
        await wait(ok ? 650 : 1700);
        i++;
        show();
      }
      function flyTo(el, target) {
        if (!el || !target || CR.ui.reduced()) return;
        const a = el.getBoundingClientRect(), b = target.getBoundingClientRect();
        el.style.transition = 'transform .45s cubic-bezier(.5,-0.3,.7,1), opacity .45s';
        el.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(.3)`;
        el.style.opacity = '0';
      }

      async function depart() {
        const need = Math.ceil(cfg.n * 0.7);
        $('.metro-current', root).innerHTML = '';
        $('.metro-queue', root).innerHTML = '';
        $('.metro-timer', root).style.display = 'none';
        if (good >= need) {
          $('.metro-fb', root).className = 'metro-fb ok';
          $('.metro-fb', root).textContent = 'Все по местам! Поезд отправляется…';
          CR.sfx.train();
          $('.metro-station', root).classList.add('departing');
          await wait(CR.ui.reduced() ? 400 : 2600);
          if (stopped) return;
          ctx.finish({
            win: true, mistakes, total: cfg.n, review,
            title: 'Поезд прошёл сквозь время!',
            text: `${good} пассажиров доехали до своих временных зон.`,
            stats: [['верно', good], ['ошибок', mistakes]]
          });
        } else {
          CR.sfx.lose();
          $('.metro-fb', root).className = 'metro-fb bad';
          $('.metro-fb', root).textContent = 'Поезду не хватило энергии…';
          await wait(1000);
          if (stopped) return;
          ctx.finish({
            win: false, mistakes, total: cfg.n, review,
            title: 'Поезд застрял в депо',
            text: `Нужно ${need} верных пассажиров, а было ${good}. Повтори глаголы ниже — и в путь!`
          });
        }
      }

      root.addEventListener('click', (e) => { const w = e.target.closest('.wagon'); if (w && dnd && !dnd.selected) place(+w.dataset.f); });
      function key(e) {
        if (CR.ui.current !== 'scr-game' || document.querySelector('.modal-wrap, .lesson-wrap, .dialog')) return;
        if (['1', '2', '3'].includes(e.key)) place(+e.key);
      }
      document.addEventListener('keydown', key);

      (async () => {
        await CR.ui.lesson(sel.fresh);
        if (stopped) return;
        dnd = CR.ui.dnd(root, { item: '.metro-word', target: '.wagon', onDrop: (it, t) => place(+t.dataset.f) });
        show();
      })();
      return { stop() { stopped = true; clearInterval(timer); dnd && dnd.destroy(); document.removeEventListener('keydown', key); } };
    }
  };
})();
