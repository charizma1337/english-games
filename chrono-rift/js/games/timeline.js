/* Мини-игра №4 — «ИСПРАВЬ ПРОШЛОЕ»: пропуски, сборка предложений, did/didn't, was/were, поиск ошибок */
(function () {
  const { $, $$, esc, wait, html } = CR.ui;
  const PLAN = {
    easy: ['gap', 'build', 'was', 'neg', 'gap', 'error'],
    normal: ['gap', 'build', 'was', 'neg', 'error', 'buildneg', 'question', 'gap'],
    hero: ['gaptype', 'build', 'was', 'buildneg', 'error', 'question', 'gaptype', 'error', 'build', 'neg']
  };
  const WHO = { 'Ladybug': 'ladybug', 'Cat Noir': 'catnoir', 'Marinette': 'marinette', 'Hawk Moth': 'hawkmoth' };
  const TYPE_TITLE = {
    gap: 'Вставь пропущенный глагол', gaptype: 'Впиши глагол сам', build: 'Собери предложение', buildneg: 'Собери отрицание',
    was: 'was или were?', neg: 'Отрицание с didn\'t', question: 'Вопрос с Did', error: 'Найди ошибку Бражника'
  };

  CR.games.timeline = {
    start(root, ctx) {
      const plan = PLAN[ctx.difficulty];
      const sel = CR.progress.pickVerbs(plan.length + 2, { maxNew: 2, filter: (v) => v.id !== 'be' });
      const vq = sel.verbs.slice();
      let i = 0, mistakes = 0, stopped = false, dnd = null;
      const review = [];

      root.innerHTML = `<div class="tl-game">
        <div class="tl-track">${plan.map((_, k) => `<span class="tl-node" data-k="${k}">${CR.icon('clock')}</span>`).join('<i class="tl-link"></i>')}</div>
        <div class="tl-stage"></div>
      </div>`;
      const stage = $('.tl-stage', root);

      function nextVerb(filter) {
        const k = vq.findIndex((v) => !filter || filter(v));
        if (k >= 0) return vq.splice(k, 1)[0];
        return CR.Q.pick(CR.VERBS.filter((v) => CR.progress.isIntro(v.id) && (!filter || filter(v)))) || CR.Q.pick(CR.VERBS.filter(filter || (() => true)));
      }

      function makeTask(type) {
        switch (type) {
          case 'gap': return CR.Q.gapPast(nextVerb());
          case 'gaptype': return Object.assign(CR.Q.gapPast(nextVerb()), { typed: true });
          case 'build': return CR.Q.build(nextVerb(), 'past', ctx.difficulty !== 'easy');
          case 'buildneg': return CR.Q.build(nextVerb(CR.Q.didOK), 'neg', ctx.difficulty === 'hero');
          case 'was': return CR.Q.gapWas();
          case 'neg': return CR.Q.gapNeg(nextVerb(CR.Q.didOK));
          case 'question': return CR.Q.gapQuestion(nextVerb(CR.Q.didOK));
          case 'error': { let t = null, guard = 0; while (!t && guard++ < 10) t = CR.Q.error(nextVerb()); return t; }
        }
      }

      function sceneArt(task) {
        const subj = task.v && task.v.s ? task.v.s.subj : '';
        const who = WHO[subj] || (task.kind === 'was' ? 'duo' : null);
        return who ? CR.ui.portrait(who, 'scene') : `<div class="portrait scene clock-scene">${CR.art.clock('mini-clock')}</div>`;
      }

      function render() {
        if (stopped) return;
        if (i >= plan.length) return done();
        $$('.tl-node', root).forEach((n, k) => n.className = 'tl-node' + (k < i ? ' fixed' : k === i ? ' cur' : ''));
        const task = makeTask(plan[i]);
        task.tries = 0;
        stage.innerHTML = `<div class="tl-card glitch pop-in">
          <div class="tl-head"><span class="tl-type">${TYPE_TITLE[plan[i]]}</span><span class="tl-num">Событие ${i + 1} / ${plan.length}</span></div>
          <div class="tl-scene">${sceneArt(task)}<div class="tl-distort">${CR.icon('clock')}<span>ИСКАЖЁННОЕ ПРОШЛОЕ</span></div></div>
          <div class="tl-sentence"></div>
          ${ctx.difficulty !== 'hero' && task.ru ? `<p class="tl-ru">${esc(task.ru)}</p>` : ''}
          <div class="tl-work"></div>
          <div class="tl-feedback"></div>
        </div>`;
        const ui = { sent: $('.tl-sentence', stage), work: $('.tl-work', stage), fb: $('.tl-feedback', stage) };
        if (task.type === 'gap') renderGap(task, ui);
        else if (task.type === 'build') renderBuild(task, ui);
        else renderError(task, ui);
      }

      /* --- Пропуск --- */
      function renderGap(task, ui) {
        ui.sent.innerHTML = `${esc(task.before)} <span class="gap-slot">&nbsp;?&nbsp;</span> ${esc(task.after)}`;
        if (task.typed) {
          ui.work.innerHTML = `<form class="type-row"><input class="input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="напиши форму глагола" aria-label="Ответ"><button class="btn primary">Проверить</button></form>
            <p class="tl-hint-small">Глагол: <b>${task.v.v1}</b> (${esc(task.v.ru)})</p>`;
          const f = $('form', ui.work), inp = $('input', f);
          setTimeout(() => inp.focus(), 50);
          f.onsubmit = (e) => { e.preventDefault(); const val = inp.value; if (!CR.norm(val)) return; check(task, ui, task.answer.includes(CR.norm(val)) || (task.kind === 'past' && CR.check(task.v, 2, val)), val); };
        } else {
          ui.work.innerHTML = `<div class="tiles">${task.options.map((o) => `<button class="tile" data-w="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
          dnd && dnd.destroy();
          dnd = CR.ui.dnd(stage, {
            item: '.tile', target: '.gap-slot', onDrop: (tile) => {
              const w = tile.dataset.w;
              check(task, ui, task.answer.includes(w), w, tile);
            }
          });
          // двойной клик / повторное нажатие на ту же плитку — тоже ставит её в пропуск
          ui.work.addEventListener('dblclick', (e) => { const t = e.target.closest('.tile'); if (t) check(task, ui, task.answer.includes(t.dataset.w), t.dataset.w, t); });
        }
      }

      /* --- Сборка предложения --- */
      function renderBuild(task, ui) {
        ui.sent.innerHTML = `<div class="build-line" aria-label="Собранное предложение"><span class="build-ph">Нажимай на блоки по порядку…</span></div>`;
        ui.work.innerHTML = `<div class="tiles build-tiles">${task.tiles.map((t, k) => `<button class="tile" data-k="${k}">${esc(t)}</button>`).join('')}</div>
          <div class="build-actions"><button class="btn ghost small b-clear">Сбросить</button><button class="btn primary b-check">Проверить</button></div>
          ${task.decoy ? '<p class="tl-hint-small">Осторожно: один блок — лишний!</p>' : ''}`;
        const line = $('.build-line', ui.sent);
        const placed = [];
        function draw() {
          line.innerHTML = placed.length ? placed.map((k, n) => `<button class="tile placed" data-k="${k}">${esc(n === 0 ? CR.ui.cap(task.tiles[k]) : task.tiles[k])}</button>`).join('') + '<span class="build-dot">.</span>' : '<span class="build-ph">Нажимай на блоки по порядку…</span>';
          $$('.build-tiles .tile', ui.work).forEach((b) => b.classList.toggle('used', placed.includes(+b.dataset.k)));
        }
        ui.work.querySelector('.build-tiles').addEventListener('click', (e) => {
          const b = e.target.closest('.tile'); if (!b || b.classList.contains('used')) return;
          placed.push(+b.dataset.k); CR.sfx.pick(); draw();
        });
        line.addEventListener('click', (e) => {
          const b = e.target.closest('.tile'); if (!b) return;
          placed.splice(placed.indexOf(+b.dataset.k), 1); CR.sfx.drop(); draw();
        });
        $('.b-clear', ui.work).onclick = () => { placed.length = 0; draw(); };
        $('.b-check', ui.work).onclick = () => {
          if (!placed.length) return;
          const s = CR.norm(placed.map((k) => task.tiles[k]).join(' '));
          check(task, ui, task.accepted.includes(s), s);
        };
      }

      /* --- Найди ошибку --- */
      function renderError(task, ui) {
        ui.sent.innerHTML = `<div class="err-line">${task.words.map((w, k) => `<button class="err-word" data-k="${k}">${esc(w)}</button>`).join(' ')}</div>`;
        ui.work.innerHTML = `<p class="tl-hint-small">Бражник подменил одно слово. Нажми на него!</p>`;
        let found = false;
        ui.sent.addEventListener('click', (e) => {
          const b = e.target.closest('.err-word'); if (!b || found || task.solved) return;
          const k = +b.dataset.k;
          if (k === task.wrongIndex) {
            found = true; b.classList.add('caught'); CR.sfx.lock();
            const opts = CR.shuffle(CR.Q.uniq([task.answer[0]].concat(CR.Q.distractors(task.v, task.form, 3, { avoid: [task.wrong] }))).slice(0, 4));
            if (ctx.difficulty === 'hero') {
              ui.work.innerHTML = `<p class="tl-hint-small">Нашёл! Как будет правильно?</p><form class="type-row"><input class="input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="правильная форма"><button class="btn primary">Исправить</button></form>`;
              const f = $('form', ui.work); setTimeout(() => $('input', f).focus(), 50);
              f.onsubmit = (ev) => { ev.preventDefault(); const val = $('input', f).value; if (!CR.norm(val)) return; check(task, ui, task.answer.includes(CR.norm(val)) || CR.check(task.v, task.form, val), val); };
            } else {
              ui.work.innerHTML = `<p class="tl-hint-small">Нашёл! Выбери правильное слово:</p><div class="tiles">${opts.map((o) => `<button class="tile" data-w="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
              ui.work.onclick = (ev) => { const t = ev.target.closest('.tile'); if (t) check(task, ui, task.answer.includes(t.dataset.w), t.dataset.w, t); };
            }
          } else {
            b.classList.add('nope'); CR.sfx.wrong(); CR.ui.shake(b);
            if (!task.missFind) { task.missFind = true; CR.ui.hint(root, 'marinette', 'Это слово в порядке. Ищи глагол — Бражник любит портить именно его!', 3000); }
          }
        });
      }

      /* --- Проверка и оживление сцены --- */
      async function check(task, ui, ok, val, tile) {
        if (task.solved) return;
        const v = task.v;
        if (ok) {
          task.solved = true;
          if (task.tries === 0) CR.progress.answer(v.id, task.form || 2, true);
          CR.sfx.correct();
          const card = $('.tl-card', stage);
          card.classList.remove('glitch'); card.classList.add('fixed');
          if (task.type === 'gap') { const s = $('.gap-slot', ui.sent); s.textContent = task.answer.includes(CR.norm(val)) ? CR.norm(val) : task.answer[0]; s.classList.add('ok'); }
          if (task.type === 'error') { const w = $('.err-word.caught', ui.sent); w.textContent = CR.norm(val); w.classList.add('ok'); }
          if (task.type === 'build') $('.build-line', ui.sent).classList.add('ok');
          $('.tl-distort span', stage).textContent = 'ПРОШЛОЕ ИСПРАВЛЕНО';
          CR.ui.comic('FIXED!', '#9BE564');
          CR.ui.burstAt(ui.sent, { n: 20 });
          ui.fb.innerHTML = `<p class="ok">${CR.icon('check')} ${esc(task.rule)}</p>`;
          ui.work.innerHTML = `<button class="btn primary tl-next">Дальше ▸</button>`;
          $('.tl-next', ui.work).onclick = () => { i++; render(); };
          $('.tl-next', ui.work).focus();
        } else {
          task.tries++;
          CR.sfx.wrong();
          if (tile) CR.ui.shake(tile);
          if (task.tries === 1) {
            mistakes++; CR.progress.answer(v.id, task.form || 2, false);
            if (!review.includes(v) && v.id !== 'be') review.push(v);
            vq.push(v); // вернётся позже
            ui.fb.innerHTML = `<p class="bad">Не совсем. ${esc(task.rule)} Попробуй ещё раз!</p>`;
            if (task.type === 'gap' && task.typed) { const inp = $('input', ui.work); inp && inp.select(); }
          } else {
            // показываем правильный ответ
            task.solved = true;
            const right = task.type === 'build' ? CR.ui.cap(task.parts.join(' ')) + '.' : task.answer.join(' / ');
            ui.fb.innerHTML = `<p class="bad">Правильно: <b>${esc(right)}</b></p><p>${esc(task.rule)}</p>${v.id !== 'be' ? `<p class="tl-hint-small">${v.v1} — ${CR.formText(v, 2)} — ${CR.formText(v, 3)}</p>` : ''}`;
            ui.work.innerHTML = `<button class="btn primary tl-next">Понятно, дальше ▸</button>`;
            $('.tl-next', ui.work).onclick = () => { i++; render(); };
          }
        }
      }

      function done() {
        ctx.finish({
          win: true, mistakes, total: plan.length, review,
          title: 'Прошлое исправлено!',
          text: 'Часы на башне снова идут вперёд. Помни: Past Simple → V2, а после did / didn\'t → V1.',
          stats: [['событий', plan.length], ['ошибок', mistakes]]
        });
      }

      (async () => {
        await CR.ui.lesson(sel.fresh);
        if (stopped) return;
        render();
      })();
      return { stop() { stopped = true; dnd && dnd.destroy(); } };
    }
  };
})();
