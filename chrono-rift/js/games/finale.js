/* ФИНАЛ — «СТАБИЛИЗАЦИЯ ХРОНОРАЗЛОМА»: четыре фазы + финальная сцена */
(function () {
  const { $, $$, esc, wait, html } = CR.ui;
  const CFG = { easy: { p1: 3, p2: 3, p3: 4 }, normal: { p1: 4, p2: 4, p3: 5 }, hero: { p1: 5, p2: 4, p3: 6 } };

  CR.games.finale = {
    start(root, ctx) {
      const cfg = CFG[ctx.difficulty];
      const sel = CR.progress.pickVerbs(cfg.p1 + cfg.p2 + 8, { maxNew: 0 });
      const pool = sel.verbs.slice();
      const take = (f) => { const k = pool.findIndex((v) => !f || f(v)); return k >= 0 ? pool.splice(k, 1)[0] : CR.Q.pick(CR.VERBS.filter(f || (() => true))); };
      let mistakes = 0, stopped = false, stab = 0;
      const review = [];
      const miss = (v, f) => { mistakes++; if (v) { CR.progress.answer(v.id, f || 0, false); if (!review.includes(v) && v.id !== 'be') review.push(v); } CR.sfx.wrong(); };
      const hit = (v, f) => { if (v) CR.progress.answer(v.id, f || 0, true); CR.sfx.correct(); };

      root.innerHTML = `<div class="fin-game">
        <div class="fin-portal">
          <div class="fin-ring r1"><span>PAST</span></div><div class="fin-ring r2"><span>PRESENT</span></div><div class="fin-ring r3"><span>PERFECT</span></div>
          <div class="fin-core"><div class="portal"><i></i><i></i><i></i></div></div>
          <div class="fin-phantom">${CR.art.phantom()}</div>
        </div>
        <div class="fin-meter"><span>Стабилизация</span><div class="bar"><i></i></div><b class="fin-pct">0%</b></div>
        <div class="fin-phases">${['Глаголы', 'История', 'Perfect', 'Механизм'].map((t, k) => `<span data-p="${k}">${k + 1}. ${t}</span>`).join('')}</div>
        <div class="fin-stage"></div>
      </div>`;
      const stage = $('.fin-stage', root);
      function setStab(v) {
        stab = Math.min(100, v);
        $('.fin-meter i', root).style.width = stab + '%';
        $('.fin-pct', root).textContent = Math.round(stab) + '%';
      }
      function phase(k) {
        $$('.fin-phases span', root).forEach((s, j) => s.className = j < k ? 'done' : j === k ? 'cur' : '');
        $('.fin-portal', root).dataset.phase = k;
      }

      /* ---- универсальная карточка выбора ---- */
      function choice(opts) {
        return new Promise((resolve) => {
          stage.innerHTML = `<div class="fin-card pop-in">
            ${opts.title ? `<h3>${opts.title}</h3>` : ''}
            <div class="fin-prompt">${opts.prompt}</div>
            ${opts.sub ? `<p class="fin-sub">${opts.sub}</p>` : ''}
            <div class="choice-row big">${opts.options.map((o) => `<button class="chip" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>
            <p class="fin-fb"></p></div>`;
          let first = true;
          $('.choice-row', stage).onclick = async (e) => {
            const b = e.target.closest('.chip'); if (!b || b.disabled) return;
            if (opts.isCorrect(b.dataset.o)) {
              b.classList.add('ok'); $$('.chip', stage).forEach((c) => c.disabled = true);
              if (first) hit(opts.v, opts.form); else CR.sfx.correct();
              CR.ui.burstAt(b, { n: 12 });
              $('.fin-fb', stage).innerHTML = opts.okText || '';
              await wait(opts.okText ? 1400 : 650);
              resolve(first);
            } else {
              b.classList.add('bad'); b.disabled = true; CR.ui.shake(b);
              if (first) miss(opts.v, opts.form); else CR.sfx.wrong();
              first = false;
              $('.fin-fb', stage).innerHTML = `<span class="bad">${opts.badText ? opts.badText(b.dataset.o) : 'Попробуй другой вариант!'}</span>`;
            }
          };
        });
      }

      /* ---- Фаза 1: тройки V1–V2–V3 ---- */
      async function phase1() {
        phase(0);
        await CR.ui.dialog([{ who: 'ladybug', text: 'Фаза 1! Быстро собираем тройки глаголов — кольцо PAST начнёт замедляться.' }]);
        for (let n = 0; n < cfg.p1 && !stopped; n++) {
          const v = take((x) => x.group !== 'same3');
          await triple(v, n);
          setStab(((n + 1) / cfg.p1) * 25);
        }
        $('.fin-ring.r1', root).classList.add('stable');
        CR.ui.comic('PAST — OK!', '#FFD66D');
      }
      function triple(v, n) {
        return new Promise((resolve) => {
          const o2 = CR.shuffle([CR.forms(v, 2)[0]].concat(CR.Q.distractors(v, 2, 2)));
          const o3 = CR.shuffle([CR.forms(v, 3)[0]].concat(CR.Q.distractors(v, 3, 2)));
          stage.innerHTML = `<div class="fin-card pop-in"><h3>Тройка ${n + 1} / ${cfg.p1}</h3>
            <div class="fin-prompt"><b>${v.v1.toUpperCase()}</b> → <span class="slot2">?</span> → <span class="slot3">?</span></div>
            ${ctx.difficulty !== 'hero' ? `<p class="fin-sub">${esc(v.ru)}</p>` : ''}
            <div class="fin-pick"><small>V2 · Past Simple</small><div class="choice-row" data-f="2">${o2.map((o) => `<button class="chip" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div></div>
            <div class="fin-pick"><small>V3 · Past Participle</small><div class="choice-row" data-f="3">${o3.map((o) => `<button class="chip" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div></div>
            <p class="fin-fb"></p></div>`;
          const done = {}; const wrong = {};
          stage.querySelectorAll('.choice-row').forEach((row) => row.onclick = async (e) => {
            const b = e.target.closest('.chip'); const f = +row.dataset.f;
            if (!b || done[f] || b.disabled) return;
            if (CR.Q.valid(v, f, b.dataset.o)) {
              done[f] = true; b.classList.add('ok'); $$('.chip', row).forEach((c) => c.disabled = true);
              $('.slot' + f, stage).textContent = b.dataset.o; $('.slot' + f, stage).classList.add('ok');
              if (!wrong[f]) hit(v, f); else CR.sfx.correct();
              if (done[2] && done[3]) { CR.ui.burstAt($('.fin-prompt', stage), { n: 16 }); await wait(700); resolve(); }
            } else {
              b.classList.add('bad'); b.disabled = true; CR.ui.shake(b);
              if (!wrong[f]) { wrong[f] = true; miss(v, f); } else CR.sfx.wrong();
              const other = [1, 2, 3].find((x) => CR.Q.valid(v, x, b.dataset.o));
              $('.fin-fb', stage).innerHTML = `<span class="bad">${other ? `«${esc(b.dataset.o)}» — это V${other}.` : `«${esc(b.dataset.o)}» — такой формы нет.`}</span>`;
            }
          });
        });
      }

      /* ---- Фаза 2: исправление истории ---- */
      async function phase2() {
        phase(1);
        await CR.ui.dialog([{ who: 'catnoir', text: 'Фаза 2! Хронофантом снова путает прошлое. Исправим предложения — и кольцо PRESENT встанет на место!' }]);
        const kinds = CR.shuffle(['past', 'neg', 'was', 'question']).concat(['past']).slice(0, cfg.p2);
        for (let n = 0; n < kinds.length && !stopped; n++) {
          const t = kinds[n] === 'past' ? CR.Q.gapPast(take((v) => v.id !== 'be')) : kinds[n] === 'neg' ? CR.Q.gapNeg(take(CR.Q.didOK)) : kinds[n] === 'was' ? CR.Q.gapWas() : CR.Q.gapQuestion(take(CR.Q.didOK));
          await choice({
            title: `История ${n + 1} / ${kinds.length}`, v: t.v, form: t.form,
            prompt: `${esc(t.before)} <span class="gap-slot">?</span> ${esc(t.after)}`,
            sub: ctx.difficulty !== 'hero' ? esc(t.ru) : '',
            options: t.options, isCorrect: (o) => t.answer.includes(o),
            okText: `<span class="ok">${esc(t.rule)}</span>`, badText: () => esc(t.rule)
          });
          setStab(25 + ((n + 1) / kinds.length) * 25);
        }
        $('.fin-ring.r2', root).classList.add('stable');
        CR.ui.comic('PRESENT — OK!', '#4ED9E8');
      }

      /* ---- Фаза 3: Perfect Energy ---- */
      async function phase3() {
        phase(2);
        await new Promise((res) => {
          stage.innerHTML = `<div class="fin-card explain pop-in">
            <h3>${CR.icon('bulb')} Perfect Energy — коротко о главном</h3>
            <div class="explain-grid">
              <div><span class="tag">Past Simple · V2</span><p class="en">She <b>went</b> home.</p><p>Она ушла домой (вчера, час назад — это просто факт из прошлого).</p><small>Слова-подсказки: yesterday, last night, ago, in 2015</small></div>
              <div><span class="tag gold">have / has + V3</span><p class="en">She <b>has gone</b> home.</p><p>Она ушла домой — и её сейчас нет здесь (важен результат сейчас).</p><small>Подсказка: перед глаголом стоит have / has</small></div>
            </div>
            <p class="rule-line">Видишь <b>have / has</b> → бери <b>V3</b>. Видишь <b>yesterday / ago / last…</b> → бери <b>V2</b>.</p>
            <button class="btn primary big">Понятно, заряжаем! ▸</button></div>`;
          $('.btn', stage).onclick = res;
        });
        const items = CR.shuffle(CR.PERFECT.slice()).slice(0, cfg.p3);
        for (let n = 0; n < items.length && !stopped; n++) {
          const it = items[n]; const v = CR.BY_ID[it[1]];
          const [b, a] = it[0].split('___');
          await choice({
            title: `Perfect ${n + 1} / ${items.length}: V2 или V3?`, v, form: it[2],
            prompt: `${esc(b)}<span class="gap-slot">?</span>${esc(a)}`,
            sub: ctx.difficulty !== 'hero' ? esc(it[3]) : '',
            options: CR.shuffle([v.v2[0], v.v3[0]]),
            isCorrect: (o) => CR.Q.valid(v, it[2], o),
            okText: `<span class="ok">${it[2] === 3 ? 'Есть have / has → V3!' : 'Маркер прошлого, без have/has → V2!'}</span>`,
            badText: () => it[2] === 3 ? 'Посмотри: в предложении есть have / has. Значит, нужна V3.' : 'Здесь нет have / has, а есть слово про прошлое. Нужна V2.'
          });
          setStab(50 + ((n + 1) / items.length) * 25);
        }
        $('.fin-ring.r3', root).classList.add('stable');
        CR.ui.comic('PERFECT — OK!', '#F24971');
      }

      /* ---- Фаза 4: хрономеханизм из четырёх секторов ---- */
      async function phase4() {
        phase(3);
        await CR.ui.dialog([{ who: 'phantom', text: 'НЕТ! Мой хрономеханизм ещё работает! Попробуйте-ка его остановить!' }, { who: 'ladybug', text: 'Четыре сектора — четыре разных задания. Восстанавливай их по одному!' }]);
        const sectors = [
          { id: 'form', name: 'Выбор формы', run: sectorForm },
          { id: 'link', name: 'Соединение', run: sectorLink },
          { id: 'fix', name: 'Исправление', run: sectorFix },
          { id: 'chain', name: 'Цепочка', run: sectorChain }
        ];
        for (let n = 0; n < sectors.length && !stopped; n++) {
          drawMech(sectors, n);
          await wait(400);
          await sectors[n].run(sectors, n);
          sectors[n].done = true;
          drawMech(sectors, n + 1);
          CR.sfx.crystal();
          setStab(75 + ((n + 1) / 4) * 25);
          await wait(500);
        }
      }
      function drawMech(sectors, cur) {
        let mech = $('.fin-mech', root);
        if (!mech) { mech = html('<div class="fin-mech"></div>'); $('.fin-game', root).insertBefore(mech, stage); }
        mech.innerHTML = sectors.map((s, k) => `<div class="sector s${k} ${s.done ? 'done' : k === cur ? 'cur' : ''}"><span>${k + 1}</span><small>${s.name}</small></div>`).join('') + '<div class="mech-core"></div>';
      }
      async function sectorForm() {
        const v = take((x) => x.hard);
        const f = Math.random() < 0.5 ? 2 : 3;
        await choice({
          title: 'Сектор 1: выбери форму', v, form: f,
          prompt: `<b>${v.v1.toUpperCase()}</b> → V${f} = <span class="gap-slot">?</span>`,
          options: CR.shuffle([CR.forms(v, f)[0]].concat(CR.Q.distractors(v, f, 3))),
          isCorrect: (o) => CR.Q.valid(v, f, o)
        });
      }
      function sectorLink() {
        return new Promise((resolve) => {
          const vs = [take((x) => x.group === 'all3'), take((x) => x.group === 'all3'), take((x) => x.group === 'all3')].filter(Boolean);
          const right = CR.shuffle(vs.slice());
          stage.innerHTML = `<div class="fin-card pop-in"><h3>Сектор 2: соедини V1 и V3</h3>
            <p class="fin-sub">Нажми на глагол слева, потом на его третью форму справа.</p>
            <div class="link-board"><div class="link-col l">${vs.map((v) => `<button class="chip" data-id="${v.id}">${v.v1}</button>`).join('')}</div>
            <svg class="link-lines"></svg>
            <div class="link-col r">${right.map((v) => `<button class="chip" data-id="${v.id}">${CR.formText(v, 3)}</button>`).join('')}</div></div>
            <p class="fin-fb"></p></div>`;
          let pickL = null, made = 0; const wrongs = new Set();
          const board = $('.link-board', stage), svg = $('.link-lines', stage);
          board.onclick = async (e) => {
            const b = e.target.closest('.chip'); if (!b || b.disabled) return;
            if (b.parentElement.classList.contains('l')) { $$('.l .chip', board).forEach((c) => c.classList.remove('selected')); pickL = b; b.classList.add('selected'); CR.sfx.pick(); return; }
            if (!pickL) { CR.ui.shake(b); return; }
            const v = CR.BY_ID[pickL.dataset.id];
            if (b.dataset.id === pickL.dataset.id) {
              if (!wrongs.has(v.id)) hit(v, 3); else CR.sfx.correct();
              pickL.disabled = b.disabled = true; pickL.classList.remove('selected'); pickL.classList.add('ok'); b.classList.add('ok');
              const br = board.getBoundingClientRect(), a1 = pickL.getBoundingClientRect(), a2 = b.getBoundingClientRect();
              svg.insertAdjacentHTML('beforeend', `<line x1="${a1.right - br.left}" y1="${a1.top + a1.height / 2 - br.top}" x2="${a2.left - br.left}" y2="${a2.top + a2.height / 2 - br.top}"/>`);
              pickL = null; made++;
              if (made === vs.length) { await wait(700); resolve(); }
            } else {
              CR.ui.shake(b); if (!wrongs.has(v.id)) { wrongs.add(v.id); miss(v, 3); } else CR.sfx.wrong();
              $('.fin-fb', stage).innerHTML = `<span class="bad">Третья форма глагола ${v.v1} — другая. Подумай: ${v.v1} — ${CR.formText(v, 2)} — ?</span>`;
            }
          };
        });
      }
      function sectorFix() {
        return new Promise((resolve) => {
          let t = null, g = 0; while (!t && g++ < 10) t = CR.Q.error(take((x) => x.v2[0] !== x.v1));
          stage.innerHTML = `<div class="fin-card pop-in"><h3>Сектор 3: исправь предложение</h3>
            <p class="fin-sub">Нажми на неправильное слово.</p>
            <div class="err-line">${t.words.map((w, k) => `<button class="err-word" data-k="${k}">${esc(w)}</button>`).join(' ')}</div>
            <div class="fix-opts"></div><p class="fin-fb"></p></div>`;
          let first = true;
          $('.err-line', stage).onclick = (e) => {
            const b = e.target.closest('.err-word'); if (!b || b.classList.contains('caught')) return;
            if (+b.dataset.k !== t.wrongIndex) { b.classList.add('nope'); CR.ui.shake(b); CR.sfx.wrong(); return; }
            b.classList.add('caught'); CR.sfx.lock();
            const opts = CR.shuffle(CR.Q.uniq([t.answer[0]].concat(CR.Q.distractors(t.v, t.form, 2, { avoid: [t.wrong] }))));
            $('.fix-opts', stage).innerHTML = `<div class="choice-row">${opts.map((o) => `<button class="chip" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
            $('.fix-opts', stage).onclick = async (ev) => {
              const c = ev.target.closest('.chip'); if (!c || c.disabled) return;
              if (t.answer.includes(c.dataset.o)) {
                if (first) hit(t.v, t.form); else CR.sfx.correct();
                b.textContent = c.dataset.o; b.classList.add('ok'); c.classList.add('ok');
                $('.fin-fb', stage).innerHTML = `<span class="ok">${esc(t.rule)}</span>`;
                await wait(1400); resolve();
              } else {
                c.classList.add('bad'); c.disabled = true; if (first) { first = false; miss(t.v, t.form); } else CR.sfx.wrong();
                $('.fin-fb', stage).innerHTML = `<span class="bad">${esc(t.rule)}</span>`;
              }
            };
          };
        });
      }
      function sectorChain() {
        return new Promise((resolve) => {
          const v = take((x) => x.group === 'all3');
          const chain = [1, 2, 3].map((f) => ({ f, w: CR.forms(v, f)[0] }));
          const tiles = CR.shuffle(chain.slice());
          stage.innerHTML = `<div class="fin-card pop-in"><h3>Сектор 4: собери цепочку времени</h3>
            <p class="fin-sub">Нажимай по порядку: V1 → V2 → V3</p>
            <div class="chain-line">${[1, 2, 3].map((f) => `<span class="chain-slot" data-f="${f}">V${f}</span>`).join('<i>→</i>')}</div>
            <div class="choice-row big">${tiles.map((t) => `<button class="chip" data-f="${t.f}">${esc(t.w)}</button>`).join('')}</div>
            <p class="fin-fb"></p></div>`;
          let step = 1, first = true;
          $('.choice-row', stage).onclick = async (e) => {
            const b = e.target.closest('.chip'); if (!b || b.disabled) return;
            const ok = CR.Q.valid(v, step, b.textContent);
            if (ok) {
              b.disabled = true; b.classList.add('ok');
              const s = $(`.chain-slot[data-f="${step}"]`, stage); s.textContent = b.textContent; s.classList.add('ok');
              CR.sfx.lock(); step++;
              if (step > 3) { if (first) hit(v, 0); CR.ui.burstAt($('.chain-line', stage), { n: 20 }); await wait(800); resolve(); }
            } else {
              CR.ui.shake(b); if (first) { first = false; miss(v, step); } else CR.sfx.wrong();
              $('.fin-fb', stage).innerHTML = `<span class="bad">Сейчас нужна V${step}. Это «${esc(b.textContent)}»? Нет — это V${chain.find((c) => c.w === b.textContent).f}.</span>`;
            }
          };
        });
      }

      /* ---- Финальная сцена ---- */
      async function ending() {
        $('.fin-game', root).classList.add('closing');
        CR.sfx.portal();
        await CR.ui.dialog([
          { who: 'phantom', text: 'Невозможно! Время… снова течёт как надо…' },
          { who: 'ladybug', text: 'Больше никаких злодеяний, маленькая акума! Я освобождаю тебя от зла!' },
          { who: 'catnoir', text: 'Пока-пока, бабочка! А я помогу вернуть Парижу огни.' }
        ]);
        const P = CR.progress.state;
        P.story.finished = true; CR.progress.completeLocation('rift'); CR.progress.saveNow();
        CR.app.updateWorld();
        const scene = html(`<div class="ending">
          <div class="ending-rays"></div>
          <div class="ending-butterfly">${CR.art.akuma('', '#ffffff')}</div>
          <img class="ending-hero" src="assets/characters/ladybug-cutout.png" alt="Леди Баг">
          <h1 class="ending-title"><span>MIRACULOUS!</span><b>YOU SAVED TIME!</b></h1>
          <p class="ending-sub">${esc(P.name)}, Париж снова сияет. Спасибо, напарник!</p>
          <button class="btn primary big">Продолжить ▸</button></div>`);
        document.getElementById('overlay-root').appendChild(scene);
        CR.sfx.win();
        for (let n = 0; n < 6; n++) setTimeout(() => CR.ui.burst(window.innerWidth * (0.15 + Math.random() * 0.7), window.innerHeight * (0.2 + Math.random() * 0.4), { n: 30, spread: 180 }), n * 400);
        await new Promise((res) => $('.btn', scene).onclick = res);
        scene.classList.add('out'); setTimeout(() => scene.remove(), 300);
      }

      (async () => {
        await phase1(); if (stopped) return;
        await phase2(); if (stopped) return;
        await phase3(); if (stopped) return;
        await phase4(); if (stopped) return;
        phase(4);
        await ending(); if (stopped) return;
        ctx.finish({
          win: true, mistakes, total: cfg.p1 + cfg.p2 + cfg.p3 + 4, review,
          title: 'Хроноразлом закрыт!',
          text: 'Ты стал Стражем времени! Продолжай тренироваться в «Охоте за глаголами» и в любых локациях — чтобы освоить все 86 глаголов.',
          stats: [['стабилизация', '100%'], ['ошибок', mistakes]]
        });
      })();
      return { stop() { stopped = true; } };
    }
  };
})();
