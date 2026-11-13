/* Мини-игра №1 — «ХРОНОМОСТ»: собери секции моста из форм глагола */
(function () {
  const { $, $$, html, esc, wait } = CR.ui;
  const CFG = {
    easy: { sections: 5, extra: 2, newMax: 3, hints: 99, givenPlan: [2, 2, 1, 1, 0] },
    normal: { sections: 6, extra: 3, newMax: 3, hints: 3, givenPlan: [2, 1, 1, 0, 0, 0] },
    hero: { sections: 7, extra: 4, newMax: 4, hints: 0, givenPlan: [1, 1, 0, 0, 0, 0, 0] }
  };
  const LABEL = ['', 'V1 · Infinitive', 'V2 · Past Simple', 'V3 · Past Participle'];

  CR.games.bridge = {
    start(root, ctx) {
      const cfg = CFG[ctx.difficulty];
      const sel = CR.progress.pickVerbs(cfg.sections, { maxNew: cfg.newMax });
      const verbs = sel.verbs;
      let idx = 0, mistakes = 0, hintsLeft = cfg.hints, stopped = false, dnd = null, busy = false;
      const review = [];

      root.innerHTML = `<div class="bridge-game">
        <div class="game-hud"><div class="hud-sections"></div>
          <div class="hud-right"><span class="hud-pill">Ошибки: <b class="hud-mis">0</b></span>
          ${cfg.hints ? `<button class="btn ghost small hint-btn">${CR.icon('bulb')} Подсказка</button>` : ''}</div></div>
        <div class="bridge-scene">
          <div class="bridge-glow"></div>
          <div class="bridge-track"></div>
          <div class="river"><i></i><i></i><i></i></div>
          <img class="bridge-hero" src="assets/characters/ladybug-cutout.png" alt="Леди Баг" draggable="false">
        </div>
        <div class="bridge-task"><div class="bridge-verb"></div><p class="bridge-instr"></p></div>
        <div class="tiles"></div>
      </div>`;
      const track = $('.bridge-track', root), tilesEl = $('.tiles', root), hero = $('.bridge-hero', root);

      // Секции моста
      track.innerHTML = verbs.map((v, i) => `<div class="b-section" data-i="${i}">
        <div class="b-pier left"></div>
        ${[1, 2, 3].map((f) => `<div class="b-slot" data-f="${f}"><small>${LABEL[f]}</small><span class="b-word"></span></div>`).join('')}
        <div class="b-pier right"></div><div class="b-rail"></div></div>`).join('') + `<div class="b-section goal"><div class="goal-flag">${CR.icon('star')}<b>Другой берег!</b></div></div>`;
      $('.hud-sections', root).innerHTML = verbs.map((_, i) => `<i data-i="${i}"></i>`).join('');

      function setup() {
        const v = verbs[idx];
        const given = cfg.givenPlan[idx] != null ? cfg.givenPlan[idx] : 0;
        // какие формы открыты
        let open = [];
        if (given === 2) open = [1, Math.random() < 0.5 ? 2 : 3];
        if (given === 1) open = [ctx.difficulty === 'hero' ? 1 + Math.floor(Math.random() * 3) : 1];
        const missing = [1, 2, 3].filter((f) => !open.includes(f));
        const sec = $(`.b-section[data-i="${idx}"]`, track);
        $$('.b-slot', sec).forEach((s) => {
          const f = +s.dataset.f;
          if (open.includes(f)) { s.classList.add('given', 'filled'); $('.b-word', s).textContent = CR.formText(v, f); }
          else { s.classList.add('empty'); s.dataset.need = '1'; }
        });
        sec.classList.add('current');
        $$('.hud-sections i', root).forEach((d, i) => d.className = i < idx ? 'done' : i === idx ? 'cur' : '');
        track.style.transform = `translateX(${-idx * 100}%)`;

        // Плитки: правильные + ловушки, которые не подходят ни к одному пустому месту
        const correct = missing.map((f) => CR.forms(v, f)[Math.floor(Math.random() * CR.forms(v, f).length)]);
        const bad = [];
        missing.forEach((f) => CR.Q.distractors(v, f, 6).forEach((d) => {
          if (!missing.some((m) => CR.Q.valid(v, m, d)) && !bad.includes(d) && !correct.includes(d)) bad.push(d);
        }));
        const tiles = CR.shuffle(correct.concat(CR.shuffle(bad).slice(0, cfg.extra + (missing.length === 1 ? 1 : 0))));
        tilesEl.innerHTML = tiles.map((t) => `<button class="tile" data-w="${esc(t)}">${esc(t)}</button>`).join('');
        $('.bridge-verb', root).innerHTML = `<b>${v.v1.toUpperCase()}</b>${ctx.difficulty !== 'hero' ? `<small>${esc(v.ru)}</small>` : ''}<button class="speak-btn" data-speak="${v.id}">${CR.icon('speaker')}</button>`;
        $('.bridge-instr', root).textContent = missing.length === 3
          ? 'Собери все три формы: перетащи плитки на платформы моста.'
          : missing.length === 2 ? 'Не хватает двух плит. Поставь формы на свои места.' : 'Почини последнюю плиту!';
        sec._v = v; sec._wrong = {};
        hero.className = 'bridge-hero idle';
      }

      async function onDrop(tile, slot) {
        if (busy || stopped) return;
        const sec = slot.closest('.b-section');
        if (!sec || !sec.classList.contains('current') || !slot.dataset.need || slot.classList.contains('filled')) return;
        const v = sec._v, f = +slot.dataset.f, w = tile.dataset.w;
        if (CR.Q.valid(v, f, w)) {
          slot.classList.remove('empty'); slot.classList.add('filled', 'snap');
          $('.b-word', slot).textContent = w;
          tile.classList.add('used');
          CR.sfx.drop(); CR.sfx.correct();
          CR.ui.burstAt(slot, { n: 10 });
          if (!sec._wrong[f]) CR.progress.answer(v.id, f, true);
          if ($$('.b-slot.empty', sec).length === 0) await complete(sec);
        } else {
          CR.sfx.wrong(); CR.ui.shake(tile); CR.ui.shake(slot);
          if (!sec._wrong[f]) { sec._wrong[f] = 1; mistakes++; CR.progress.answer(v.id, f, false); if (!review.includes(v)) review.push(v); }
          $('.hud-mis', root).textContent = mistakes;
          CR.ui.hint(root, 'marinette', explain(v, f, w));
        }
      }
      function explain(v, f, w) {
        const other = [1, 2, 3].find((x) => CR.Q.valid(v, x, w));
        if (other) return `«${w}» — это V${other} глагола ${v.v1}. А здесь нужна V${f} (${LABEL[f].split('· ')[1]}).`;
        const owner = CR.FORM_INDEX[w];
        if (owner) return `«${w}» — форма другого глагола (${owner[0].id}). Ищи форму от ${v.v1.toUpperCase()}!`;
        return `«${w}» — так не говорят! ${v.v1} — неправильный глагол, «-ed» тут не работает.`;
      }

      async function complete(sec) {
        busy = true;
        sec.classList.add('complete');
        $('.tiles', root).classList.add('fade');
        CR.ui.comic(CR.Q.pick(['Bravo!', 'Super!', 'Lucky!', 'Wow!']), '#FFD66D');
        hero.className = 'bridge-hero run';
        CR.sfx.jump();
        await wait(CR.ui.reduced() ? 300 : 1250);
        sec.classList.remove('current'); sec.classList.add('passed');
        idx++;
        $('.tiles', root).classList.remove('fade');
        if (idx >= verbs.length) {
          track.style.transform = `translateX(${-idx * 100}%)`;
          hero.className = 'bridge-hero arrive';
          $$('.hud-sections i', root).forEach((d) => d.className = 'done');
          tilesEl.innerHTML = '';
          $('.bridge-verb', root).innerHTML = '<b>Мост восстановлен!</b>';
          $('.bridge-instr', root).textContent = '';
          await wait(900);
          if (!stopped) ctx.finish({
            win: true, mistakes, total: verbs.length, review,
            title: 'Хрономост восстановлен!',
            text: mistakes ? 'Мост стоит крепко! Повтори глаголы, где были ошибки.' : 'Ни одной ошибки — идеальная постройка!',
            stats: [['секций', verbs.length], ['ошибок', mistakes]]
          });
          return;
        }
        busy = false;
        setup();
      }

      const hb = $('.hint-btn', root);
      if (hb) hb.onclick = () => {
        const sec = $('.b-section.current', track); if (!sec) return;
        if (hintsLeft <= 0) { CR.ui.hint(root, 'marinette', 'Подсказки закончились — ты справишься сам!'); return; }
        hintsLeft--;
        const v = sec._v; const empty = $('.b-slot.empty', sec); if (!empty) return;
        const f = +empty.dataset.f; const ans = CR.forms(v, f)[0];
        CR.ui.hint(root, 'marinette', `Для V${f} глагола <b>${v.v1}</b> ищи плитку на «${ans[0].toUpperCase()}…» из ${ans.length} букв.${v.note ? ' ' + esc(v.note) : ''}`, 6000);
        const t = $$('.tile', tilesEl).find((x) => !x.classList.contains('used') && CR.Q.valid(v, f, x.dataset.w));
        if (t && ctx.difficulty === 'easy') t.classList.add('glow-hint');
      };

      async function begin() {
        await CR.ui.lesson(sel.fresh);
        if (stopped) return;
        dnd = CR.ui.dnd(root, { item: '.tile', target: '.b-slot', onDrop });
        setup();
        if (ctx.difficulty === 'easy') CR.ui.hint(root, 'marinette', 'Перетащи плитку на пустую платформу. Или нажми на плитку, а потом на платформу!', 5000);
      }
      begin();
      return { stop() { stopped = true; dnd && dnd.destroy(); } };
    }
  };
})();
