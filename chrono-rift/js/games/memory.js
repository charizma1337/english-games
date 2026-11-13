/* Мини-игра №3 — «БИБЛИОТЕКА ВОСПОМИНАНИЙ»: Memory из трёх связанных форм */
(function () {
  const { $, $$, esc, wait } = CR.ui;
  const ROUNDS = { easy: [3, 4], normal: [3, 4, 6], hero: [4, 6, 6] };
  const LINES = ['Мяу-гнифицентно!', 'Книга вернулась на полку!', 'Кошачья память не подводит!', 'Ещё одна страница прошлого спасена!', 'Пур-р-рфектно!'];
  const BOOK_COLORS = ['#F24971', '#7045E8', '#4ED9E8', '#FFD66D', '#9BE564', '#FF9EC4'];

  CR.games.memory = {
    start(root, ctx) {
      const rounds = ROUNDS[ctx.difficulty];
      const need = rounds.reduce((a, b) => a + b, 0);
      const sel = CR.progress.pickVerbs(need + 6, { maxNew: ctx.difficulty === 'easy' ? 3 : 4 });
      // Подбор глаголов без совпадающих форм в одном раунде
      const pool = sel.verbs.slice();
      const used = new Set();
      function takeRound(n) {
        const set = []; const words = new Set();
        for (const v of pool) {
          if (set.length >= n) break;
          if (used.has(v.id)) continue;
          const ws = [1, 2, 3].flatMap((f) => CR.forms(v, f));
          if (ws.some((w) => words.has(w))) continue;
          ws.forEach((w) => words.add(w)); set.push(v); used.add(v.id);
        }
        // если не хватило — добрать из всей базы
        if (set.length < n) for (const v of CR.shuffle(CR.VERBS.slice())) {
          if (set.length >= n) break;
          if (used.has(v.id)) continue;
          const ws = [1, 2, 3].flatMap((f) => CR.forms(v, f));
          if (ws.some((w) => words.has(w))) continue;
          ws.forEach((w) => words.add(w)); set.push(v); used.add(v.id);
        }
        return set;
      }
      const plan = rounds.map((n) => takeRound(n));
      const lessonVerbs = sel.fresh.filter((v) => plan.flat().includes(v));

      let r = 0, mistakes = 0, stopped = false, open = [], lock = false, found = 0, totalTriples = 0, moves = 0;
      const review = [];
      root.innerHTML = `<div class="mem-game">
        <div class="game-hud"><div class="hud-left"><span class="hud-pill mem-round"></span><span class="hud-pill">Ходы: <b class="mem-moves">0</b></span></div>
        <div class="hud-right"><span class="hud-pill">Промахи: <b class="mem-mis">0</b></span></div></div>
        <div class="shelf"><div class="shelf-books"></div><div class="shelf-board"></div></div>
        <div class="mem-grid"></div>
        <p class="mem-tip">Открой три карточки одного глагола: V1, V2 и V3.</p>
      </div>`;
      const grid = $('.mem-grid', root);

      function deal() {
        const vs = plan[r];
        found = 0;
        $('.mem-round', root).textContent = `Полка ${r + 1} / ${plan.length}`;
        const cards = CR.shuffle(vs.flatMap((v) => [1, 2, 3].map((f) => ({ v, f }))));
        grid.className = 'mem-grid n' + cards.length;
        const showLabel = ctx.difficulty !== 'hero';
        grid.innerHTML = cards.map((c, i) => `<button class="mcard" data-v="${c.v.id}" data-f="${c.f}" style="--i:${i}" aria-label="Карточка">
          <span class="mcard-in"><span class="mcard-back"><i></i></span>
          <span class="mcard-face">${showLabel ? `<small>V${c.f}</small>` : ''}<b>${esc(CR.formText(c.v, c.f))}</b></span></span></button>`).join('');
      }

      grid.addEventListener('click', async (e) => {
        const card = e.target.closest('.mcard');
        if (!card || lock || stopped || card.classList.contains('open') || card.classList.contains('gone')) return;
        card.classList.add('open'); CR.sfx.flip();
        open.push(card);
        if (open.length >= 2) {
          const vid = open[0].dataset.v;
          if (open.some((c) => c.dataset.v !== vid)) {
            // промах — карточки закрываются
            lock = true; mistakes++; moves++;
            $('.mem-mis', root).textContent = mistakes; $('.mem-moves', root).textContent = moves;
            open.forEach((c) => c.classList.add('miss'));
            CR.sfx.wrong();
            const a = CR.BY_ID[open[0].dataset.v], b = CR.BY_ID[open[open.length - 1].dataset.v];
            if (ctx.difficulty !== 'hero' && mistakes % 2 === 1) CR.ui.hint(root, 'catnoir', `«${open[open.length - 1].querySelector('b').textContent}» — это от <b>${b.v1}</b>, а «${open[0].querySelector('b').textContent}» — от <b>${a.v1}</b>. Запоминай, где что лежит!`, 3500);
            await wait(1000);
            open.forEach((c) => c.classList.remove('open', 'miss'));
            open = []; lock = false;
          } else if (open.length === 3) {
            lock = true; moves++;
            $('.mem-moves', root).textContent = moves;
            const v = CR.BY_ID[vid];
            CR.progress.answer(v.id, 0, true);
            open.forEach((c) => c.classList.add('match'));
            CR.sfx.correct(); CR.ui.burstAt(open[1], { n: 16 });
            await wait(700);
            open.forEach((c) => c.classList.add('gone'));
            addBook(v);
            open = []; lock = false; found++; totalTriples++;
            if (found % 2 === 1 && ctx.difficulty !== 'hero') CR.ui.hint(root, 'catnoir', `${CR.Q.pick(LINES)} <b>${v.v1} — ${CR.formText(v, 2)} — ${CR.formText(v, 3)}</b>`, 2600);
            if (found >= plan[r].length) {
              await wait(700);
              r++;
              if (r >= plan.length) return done();
              CR.ui.comic('Next shelf!', '#4ED9E8');
              deal();
            }
          }
        }
      });

      function addBook(v) {
        const b = document.createElement('button');
        b.className = 'book-spine';
        b.style.setProperty('--bc', BOOK_COLORS[$$('.book-spine', root).length % BOOK_COLORS.length]);
        b.innerHTML = `<span>${v.v1}</span>`;
        b.title = `${v.v1} — ${CR.formText(v, 2)} — ${CR.formText(v, 3)}`;
        b.dataset.speak = v.id;
        $('.shelf-books', root).appendChild(b);
      }

      function done() {
        if (stopped) return;
        const total = plan.flat().length;
        // в Memory промахи — это нормально; звёзды считаем мягче
        const effMistakes = Math.max(0, mistakes - Math.floor(total / 2));
        ctx.finish({
          win: true, mistakes: effMistakes, total, review,
          title: 'Библиотека восстановлена!',
          text: `На полках снова ${total} книг прошлого. Нажимай на корешок книги на полке, чтобы послушать глагол.`,
          stats: [['книг', total], ['ходов', moves], ['промахов', mistakes]]
        });
      }

      (async () => {
        await CR.ui.lesson(lessonVerbs);
        if (stopped) return;
        deal();
      })();
      return { stop() { stopped = true; } };
    }
  };
})();
