/* Режим «ОХОТА ЗА ГЛАГОЛАМИ»: свободная практика с вводом, без таймера */
(function () {
  const { $, $$, esc, show } = CR.ui;
  const MODES = [
    { id: 'v1v2', name: 'V1 → V2' },
    { id: 'v1v3', name: 'V1 → V3' },
    { id: 'all', name: 'Все три формы' }
  ];
  const SOURCES = [
    { id: 'random', name: 'Случайные' },
    { id: 'hard', name: 'Сложные' },
    { id: 'mistakes', name: 'Только ошибки' },
    { id: 'new', name: 'Ещё не изученные' }
  ];
  const LBL = ['', 'V1 · Infinitive', 'V2 · Past Simple', 'V3 · Past Participle'];

  let state = { mode: 'all', source: 'random' };

  function poolFor(src) {
    if (src.startsWith('group:')) { const g = src.slice(6); return CR.VERBS.filter((v) => CR.inGroup(v, g)); }
    if (src === 'hard') return CR.VERBS.filter((v) => v.hard);
    if (src === 'mistakes') return CR.progress.troubleIds().map((id) => CR.BY_ID[id]);
    if (src === 'new') return CR.VERBS.filter((v) => CR.progress.level(v.id) === 'new' || CR.progress.level(v.id) === 'learning');
    return CR.VERBS.slice();
  }

  function open(opts) {
    opts = opts || {};
    if (opts.preset) state.source = opts.preset;
    show('scr-game');
    document.body.dataset.game = 'hunt';
    $('#game-title').innerHTML = `${CR.icon('hunt')} Охота за глаголами`;
    const root = $('#game-root');
    root.className = 'game-root g-hunt';
    let correct = 0, total = 0, cur = null, checked = false, recent = [];
    const groupOpts = CR.GROUPS.map((g) => ({ id: 'group:' + g.id, name: g.title }));

    root.innerHTML = `<div class="hunt">
      <div class="hunt-setup">
        <div class="chips hunt-modes">${MODES.map((m) => `<button class="chip ${state.mode === m.id ? 'on' : ''}" data-m="${m.id}">${m.name}</button>`).join('')}</div>
        <select class="input hunt-src">${SOURCES.concat(groupOpts).map((s) => `<option value="${s.id}" ${state.source === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select>
      </div>
      <div class="hunt-score"><span class="hud-pill">Верно: <b class="h-ok">0</b> / <b class="h-total">0</b></span><span class="hud-pill h-pool"></span></div>
      <div class="hunt-card"></div>
      <p class="hunt-tip">Без таймера. Регистр и лишние пробелы не важны. Для глаголов с двумя вариантами подходит любой.</p>
    </div>`;

    $('.hunt-modes', root).onclick = (e) => { const c = e.target.closest('.chip'); if (!c) return; state.mode = c.dataset.m; $$('.hunt-modes .chip', root).forEach((x) => x.classList.toggle('on', x === c)); CR.sfx.click(); next(); };
    $('.hunt-src', root).onchange = (e) => { state.source = e.target.value; next(); };

    function next() {
      const pool = poolFor(state.source);
      $('.h-pool', root).textContent = `в наборе: ${pool.length}`;
      if (!pool.length) {
        $('.hunt-card', root).innerHTML = `<div class="hunt-empty">${CR.ui.portrait('catnoir', 'big')}<p>${state.source === 'mistakes' ? 'Ошибок нет — ты мур-р-рвелосен! Выбери другой набор.' : 'В этом наборе пока пусто.'}</p></div>`;
        return;
      }
      // интервальное повторение: проблемные и непройденные — чаще
      const weighted = [];
      pool.forEach((v) => {
        if (recent.includes(v.id) && pool.length > 4) return;
        const lv = CR.progress.level(v.id);
        const w = { new: 3, learning: 4, familiar: 2, mastered: 1 }[lv] + ((CR.progress.state.verbs[v.id] || {}).trouble || 0) * 2;
        for (let i = 0; i < w; i++) weighted.push(v);
      });
      const v = CR.Q.pick(weighted.length ? weighted : pool);
      recent.push(v.id); if (recent.length > 4) recent.shift();
      let given, ask;
      if (state.mode === 'v1v2') { given = 1; ask = [2]; }
      else if (state.mode === 'v1v3') { given = 1; ask = [3]; }
      else { given = 1 + Math.floor(Math.random() * 3); ask = [1, 2, 3].filter((f) => f !== given); }
      // если данная форма неоднозначна (cut / read) — всегда показываем V1
      if (given !== 1 && new Set((CR.FORM_INDEX[CR.forms(v, given)[0]] || []).map((x) => x.id)).size > 1) { given = 1; ask = state.mode === 'all' ? [2, 3] : ask; }
      cur = { v, given, ask };
      checked = false;
      $('.hunt-card', root).innerHTML = `<div class="hc pop-in">
        <div class="hc-given"><small>${LBL[given]}</small><b>${esc(CR.formText(v, given).toUpperCase())}</b>
          <button class="speak-btn" data-speak="${v.id}" data-f="${given}">${CR.icon('speaker')}</button></div>
        <button class="btn link small hc-ru">Показать перевод</button>
        <form class="hc-form">${ask.map((f) => `<label class="hc-field"><small>${LBL[f]}</small><input class="input" data-f="${f}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"></label>`).join('')}
          <button class="btn primary big hc-go">Проверить</button></form>
        <div class="hc-fb"></div></div>`;
      $('.hc-ru', root).onclick = (e) => { e.target.outerHTML = `<p class="hc-trans">${esc(v.ru)}</p>`; };
      const inp = $('.hc-form input', root); setTimeout(() => inp && inp.focus(), 50);
      $('.hc-form', root).onsubmit = (e) => { e.preventDefault(); checked ? next() : check(); };
    }

    function check() {
      const { v, ask } = cur;
      const inputs = $$('.hc-form input', root);
      if (inputs.some((i) => !CR.norm(i.value))) { const empty = inputs.find((i) => !CR.norm(i.value)); CR.ui.shake(empty); empty.focus(); return; }
      checked = true;
      let all = true;
      inputs.forEach((i) => {
        const f = +i.dataset.f;
        const ok = CR.check(v, f, i.value);
        CR.progress.answer(v.id, f, ok);
        i.classList.add(ok ? 'ok' : 'bad'); i.readOnly = true;
        if (!ok) all = false;
      });
      total++; if (all) { correct++; CR.progress.state.stats.hunt++; CR.progress.save(); CR.achievements.check(); }
      $('.h-ok', root).textContent = correct; $('.h-total', root).textContent = total;
      all ? CR.sfx.correct() : CR.sfx.wrong();
      if (all) CR.ui.burstAt($('.hc-given', root), { n: 14 });
      const fb = $('.hc-fb', root);
      fb.innerHTML = `<div class="${all ? 'ok' : 'bad'}">${all ? CR.Q.pick(['Точно в цель!', 'Отлично!', 'Супер!', 'Bravo!']) : 'Почти! Вот как правильно:'}</div>
        ${CR.ui.formsRow(v)}
        ${v.note ? `<p class="lesson-note">${CR.icon('bulb')} ${esc(v.note)}</p>` : ''}
        <p class="hc-ex">${esc(CR.ui.pastSentence(v))} <small>${esc(v.s.ru)}</small></p>`;
      $('.hc-go', root).textContent = 'Следующий ▸';
      $('.hc-go', root).focus();
    }
    next();
  }

  CR.games.hunt = { open, start() { open(); } };
})();
