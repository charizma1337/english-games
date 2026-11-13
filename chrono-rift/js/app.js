/* Главный модуль: стартовый экран, интро, карта Парижа, книга времени, достижения, настройки */
(function () {
  const { $, $$, html, esc, show, dialog, modal, toast, wait } = CR.ui;
  CR.games = CR.games || {};
  let P; // state

  /* ===== Фон: Париж ===== */
  function buildWorld() {
    $('#skyline').innerHTML = CR.art.skyline({ seed: 11 });
    updateWorld();
  }
  function updateWorld() {
    const r = CR.progress.restoredRatio();
    CR.art.lightWindows($('#skyline'), r);
    document.documentElement.style.setProperty('--restore', r.toFixed(2));
    document.body.classList.toggle('reduce-motion', !!P.reduceMotion);
    document.body.classList.toggle('story-done', !!P.story.finished);
  }

  /* ===== Стартовый экран ===== */
  function title() {
    show('scr-title');
    const has = CR.progress.hasSave();
    $('#btn-continue').disabled = !has;
    $('#title-greet').textContent = has ? `С возвращением, ${P.name}!` : '';
  }

  function askName() {
    return new Promise((res) => {
      const body = html(`<div class="name-form">
        <div class="name-art">${CR.ui.portrait('ladybug', 'big')}</div>
        <p>Привет! Я Леди Баг. Париж в опасности, и мне нужен напарник. Как тебя зовут?</p>
        <input id="name-input" class="input" maxlength="16" placeholder="Твоё имя" autocomplete="off" value="${esc(P.name || '')}">
        <div class="diff-pick">${diffCards(P.difficulty)}</div>
      </div>`);
      body.addEventListener('click', (e) => { const c = e.target.closest('.diff-card'); if (c) { $$('.diff-card', body).forEach((x) => x.classList.toggle('on', x === c)); CR.sfx.click(); } });
      const m = modal({
        title: 'Новый герой', body, dismiss: false,
        buttons: [{
          label: 'Вперёд!', cls: 'primary', onClick: () => {
            const v = $('#name-input').value.trim();
            if (!v) { CR.ui.shake($('#name-input')); $('#name-input').focus(); return false; }
            P.name = v.slice(0, 16);
            const d = $('.diff-card.on', body); if (d) P.difficulty = d.dataset.d;
            CR.progress.saveNow();
            res();
          }
        }]
      });
      $('#name-input', m.el).addEventListener('keydown', (e) => { if (e.key === 'Enter') $('.modal-foot .btn', m.el).click(); });
    });
  }
  function diffCards(cur) {
    const D = [
      ['easy', 'EASY', 'Подсказки, без жёстких таймеров, меньше глаголов'],
      ['normal', 'NORMAL', 'Меньше подсказок, больше глаголов, мягкие таймеры'],
      ['hero', 'HERO', 'Больше ввода с клавиатуры, редкие глаголы, минимум подсказок']
    ];
    return D.map((d) => `<button type="button" class="diff-card ${d[0]} ${cur === d[0] ? 'on' : ''}" data-d="${d[0]}"><b>${d[1]}</b><small>${d[2]}</small></button>`).join('');
  }

  /* ===== Вступительная сцена ===== */
  async function intro() {
    show('scr-intro');
    const st = $('#intro-stage');
    st.className = 'intro-stage s0';
    st.innerHTML = `
      <div class="intro-sky"></div>
      <div class="intro-clock">${CR.art.clock('big-clock')}</div>
      <div class="intro-portal"><div class="portal"><i></i><i></i><i></i></div></div>
      <div class="intro-hawk"><img src="assets/characters/hawkmoth.jpg" alt="Бражник"></div>
      <div class="intro-phantom">${CR.art.phantom()}</div>
      <div class="intro-butterfly">${CR.art.akuma('', '#7a3bff')}</div>
      <div class="intro-heroes"><img src="assets/characters/duo-action.webp" alt="Леди Баг и Супер-Кот"></div>
      <div class="intro-caption"></div>`;
    const cap = (t) => { $('.intro-caption', st).textContent = t; };
    const set = (c) => () => { st.className = 'intro-stage ' + c; };
    cap('Париж. Полночь. Часы на башне вдруг пошли… назад.');
    CR.sfx.tick();
    await wait(CR.ui.reduced() ? 300 : 1900);
    await dialog([
      { who: 'hawkmoth', text: 'Время — самая сильная вещь на свете. И теперь оно будет моим!', on: set('s1') },
      { who: 'hawkmoth', text: 'Лети, моя маленькая акума! Подари силу тому, кто мечтает повернуть время вспять!', on: set('s2') },
      { who: 'phantom', text: 'Я — ХРОНОФАНТОМ! Прошлое, настоящее, будущее… Я перемешаю всё! Даже английские глаголы потеряют свои формы!', on: () => { set('s3')(); CR.sfx.portal(); } },
      { who: 'ladybug', text: '{name}, ты нам очень нужен! Мои силы работают, только когда глаголы целы: GO — WENT — GONE!', on: set('s4') },
      { who: 'catnoir', text: 'Три формы — три кусочка времени. Соберём их — и разлом закроется. Это будет мур-р-рвелосно!' },
      { who: 'marinette', text: 'Не бойся ошибок: я буду рядом и покажу каждый новый глагол. Вперёд, на карту Парижа!' }
    ]);
    P.introSeen = true; CR.progress.saveNow();
    map();
  }

  /* ===== Карта ===== */
  function map() {
    show('scr-map');
    updateWorld();
    const r = CR.progress.restoredRatio();
    const c = CR.progress.counts();
    const learned = CR.achievements.learned();
    $('#map-player').innerHTML = `<div class="player-card">${CR.ui.portrait('ladybug', 'small')}
      <div><b>${esc(P.name)}</b><small>${diffName(P.difficulty)} · восстановлено ${Math.round(r * 100)}%</small>
      <div class="bar"><i style="width:${(learned / CR.VERBS.length) * 100}%"></i></div>
      <small>${learned} из ${CR.VERBS.length} глаголов знакомы · освоено ${c.mastered}</small></div></div>`;

    const stage = $('#map-stage');
    const L = CR.LOCATIONS;
    let pathD = '';
    L.forEach((l, i) => { pathD += (i ? ' L' : 'M') + l.x * 10 + ',' + l.y * 6; });
    stage.innerHTML = `
      <svg class="map-lines" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
        <path class="seine" d="M-20,520 C 150,470 260,560 420,500 C 560,450 640,540 780,470 C 880,420 960,460 1020,430"/>
        <path class="route" d="${pathD}"/>
        <path class="route done" d="${pathD}" style="stroke-dasharray:${routeDone()} 4000"/>
      </svg>
      ${L.map((l, i) => {
        const done = CR.progress.isDone(l.id), open = CR.progress.isUnlocked(l.id);
        const g = P.games[l.game];
        return `<button class="map-node ${done ? 'done' : open ? 'open' : 'locked'} ${l.id}" data-loc="${l.id}" style="left:${l.x}%;top:${l.y}%" ${open ? '' : 'aria-disabled="true"'}>
          ${!done && open ? '<span class="node-portal"></span>' : ''}
          <span class="node-ico">${CR.icon(open ? l.id : 'lock')}</span>
          <span class="node-label"><b>${i + 1}. ${l.name}</b><small>${l.place}</small>${g && g.stars ? CR.ui.stars(g.stars) : ''}</span>
        </button>`;
      }).join('')}
      <div class="map-phantom ${P.story.finished ? 'gone' : ''}">${CR.art.phantom()}</div>`;
    $$('.map-node', stage).forEach((b) => b.onclick = () => openLocation(b.dataset.loc));
    $('#map-trouble-count').textContent = CR.progress.troubleIds().length || '';
  }
  function routeDone() {
    // длина пройденной части маршрута (примерно)
    const L = CR.LOCATIONS; let len = 0;
    for (let i = 1; i < L.length; i++) {
      if (!CR.progress.isDone(L[i - 1].id)) break;
      len += Math.hypot((L[i].x - L[i - 1].x) * 10, (L[i].y - L[i - 1].y) * 6);
    }
    return len;
  }
  const diffName = (d) => ({ easy: 'EASY', normal: 'NORMAL', hero: 'HERO' }[d]);

  function openLocation(id) {
    const l = CR.LOCATIONS.find((x) => x.id === id);
    if (!CR.progress.isUnlocked(id)) {
      CR.sfx.wrong();
      toast('Эта часть Парижа ещё закрыта временным разломом. Сначала пройди предыдущую локацию!');
      return;
    }
    CR.sfx.click();
    const g = P.games[l.game] || {};
    const extra = l.game === 'rooftop' ? `<div class="mode-pick"><button class="diff-card on" data-m="training"><b>Training</b><small>Без жёсткого таймера: Леди Баг ждёт твоего решения</small></button><button class="diff-card" data-m="challenge"><b>Challenge</b><small>Настоящая погоня: время на реакцию ограничено</small></button></div>` : '';
    const body = html(`<div class="loc-card">
      <div class="loc-head"><span class="loc-ico">${CR.icon(l.id)}</span><div><h3>${l.name}</h3><small>${l.place}</small></div></div>
      <p>${l.desc}</p>${extra}
      <p class="loc-meta">${CR.progress.isDone(id) ? 'Локация восстановлена ✓' : 'Здесь ещё бушует разлом!'} ${g.plays ? ` · сыграно ${g.plays} раз` : ''}</p>
      ${g.stars ? CR.ui.stars(g.stars) : ''}</div>`);
    body.addEventListener('click', (e) => { const c = e.target.closest('.diff-card'); if (c) { $$('.diff-card', body).forEach((x) => x.classList.toggle('on', x === c)); CR.sfx.click(); } });
    modal({
      body, buttons: [{ label: 'Назад', cls: 'ghost' }, {
        label: 'Играть ▸', cls: 'primary', onClick: () => {
          const m = $('.diff-card.on', body);
          launch(l, { mode: m ? m.dataset.m : null });
        }
      }]
    });
  }

  /* ===== Сюжетные реплики ===== */
  const STORY = {
    bridge: {
      pre: [{ who: 'ladybug', text: 'Хрономост над Сеной рассыпался на кусочки времени! Собери формы глаголов — и плиты встанут на место.' },
        { who: 'marinette', text: 'Перетаскивай плитки на платформы. Можно и проще: нажми на плитку, потом на платформу.' }],
      post: [{ who: 'ladybug', text: 'Мост снова цел! Смотри — фонари над Сеной загорелись!' }, { who: 'catnoir', text: 'Миледи, акума удирает по крышам! За ним!' }]
    },
    rooftops: {
      pre: [{ who: 'catnoir', text: 'Акума прыгает по крышам! Над каждой дорожкой — форма глагола.' },
        { who: 'ladybug', text: 'Беги по дорожке с правильной формой! Стрелки, A/D, мышь или кнопки на экране.' }],
      post: [{ who: 'ladybug', text: 'Мы догнали акуму! Он спрятался в старой библиотеке…' }]
    },
    library: {
      pre: [{ who: 'catnoir', text: 'Библиотека воспоминаний! Хронофантом перемешал все страницы прошлого.' },
        { who: 'catnoir', text: 'Открывай карточки и находи ТРИ формы одного глагола: GO, WENT, GONE. Тогда книга вернётся на полку!' }],
      post: [{ who: 'catnoir', text: 'Все книги на местах! Кошачья память — лучшая в Париже.' }, { who: 'hawkmoth', text: 'Неважно! Хронофантом уже переписывает прошлое в часовой башне!' }]
    },
    tower: {
      pre: [{ who: 'hawkmoth', text: 'Я изменил события вчерашнего дня! Теперь в прошлом всё неправильно!' },
        { who: 'ladybug', text: 'Исправим историю! Ставь глаголы в Past Simple, собирай предложения и ищи ошибки.' }],
      post: [{ who: 'ladybug', text: 'Часы снова идут вперёд! Прошлое спасено.' }, { who: 'marinette', text: 'Скорее в мою тайную лабораторию — я нашла устройство для временных кристаллов!' }]
    },
    lab: {
      pre: [{ who: 'marinette', text: 'Это устройство чинит кристаллы времени. Вращай три кольца: V1, V2, V3.' },
        { who: 'marinette', text: 'Когда кольца покажут верную тройку — нажми на рычаг!' }],
      post: [{ who: 'marinette', text: 'Кристаллы сияют! Энергии хватит, чтобы запустить метро времени.' }]
    },
    metro: {
      pre: [{ who: 'ladybug', text: 'Метро времени! Поезда идут в три зоны: V1, V2 и V3.' },
        { who: 'catnoir', text: 'Отправляй слова в правильные вагоны. Если форма подходит в два вагона — оба ответа верные!' }],
      post: [{ who: 'ladybug', text: 'Поезд пробил портал! Теперь путь к центру разлома открыт.' }, { who: 'phantom', text: 'Вам не остановить меня! Встретимся у Эйфелевой башни!' }]
    },
    rift: {
      pre: [{ who: 'phantom', text: 'Добро пожаловать в сердце хроноразлома! Здесь время крутится как я захочу!' },
        { who: 'ladybug', text: '{name}, четыре фазы — и механизм стабилизируется. Мы вместе!' }],
      post: []
    }
  };

  /* ===== Запуск игры ===== */
  let running = null;
  async function launch(loc, opts) {
    opts = opts || {};
    const game = CR.games[loc.game];
    if (!game) { toast('Игра ещё не готова'); return; }
    show('scr-game');
    document.body.dataset.game = loc.game;
    $('#game-title').innerHTML = `${CR.icon(loc.id)} ${loc.name}`;
    const root = $('#game-root');
    root.innerHTML = '';
    root.className = 'game-root g-' + loc.game;
    const story = STORY[loc.id];
    const first = !P.games[loc.game] || !P.games[loc.game].plays;
    if (story && (first || loc.id === 'rift')) await dialog(story.pre);
    const ctx = {
      difficulty: P.difficulty, mode: opts.mode, loc,
      finish: (res) => finishGame(loc, res, opts),
      exit: () => map()
    };
    try {
      running = game.start(root, ctx) || null;
    } catch (e) { console.error(e); toast('Ошибка запуска игры: ' + e.message, 'bad'); }
    CR.ui.onLeave(() => { if (running && running.stop) running.stop(); running = null; document.body.dataset.game = ''; });
  }

  async function finishGame(loc, res, opts) {
    const total = res.total || 1;
    const stars = res.win === false ? 0 : CR.ui.calcStars(res.mistakes, total);
    if (res.win !== false) {
      CR.progress.gameResult(loc.game, stars, res.mistakes, { score: res.score });
      if (loc.game === 'rooftop' && opts.mode === 'challenge') P.stats.challengeWins++;
    }
    const firstClear = res.win !== false && !CR.progress.isDone(loc.id);
    if (firstClear) CR.progress.completeLocation(loc.id);
    if (loc.id === 'rift' && res.win !== false) P.story.finished = true;
    CR.progress.saveNow();
    CR.achievements.check();
    updateWorld();
    if (loc.id === 'rift' && res.win !== false && res.ending !== false) {
      // финальная сцена показывается самим финалом; потом — карта
    }
    const idx = CR.LOCATIONS.indexOf(loc);
    const next = CR.LOCATIONS[idx + 1];
    if (firstClear && STORY[loc.id] && STORY[loc.id].post.length) {
      CR.ui.result({
        win: true, stars, title: res.title || 'Локация восстановлена!', text: res.text, stats: res.stats, review: res.review,
        onMap: async () => { await dialog(STORY[loc.id].post); map(); flashRestore(loc.id); },
        onRetry: () => launch(loc, opts),
        onNext: next ? async () => { await dialog(STORY[loc.id].post); goNext(next); } : null,
        nextLabel: 'К следующей локации ▸'
      });
      return;
    }
    CR.ui.result({
      win: res.win !== false, stars, title: res.title, text: res.text, stats: res.stats, review: res.review,
      onMap: () => map(), onRetry: () => launch(loc, opts),
      onNext: next && CR.progress.isUnlocked(next.id) && res.win !== false ? () => goNext(next) : null
    });
  }
  // Сразу в следующую локацию (для погони — окно выбора режима Training/Challenge)
  function goNext(next) {
    if (next.game === 'rooftop') { map(); setTimeout(() => openLocation(next.id), 350); return; }
    launch(next);
  }
  function flashRestore(id) {
    const n = $(`.map-node[data-loc="${id}"]`);
    if (!n) return;
    n.classList.add('restoring');
    CR.sfx.crystal();
    setTimeout(() => CR.ui.burstAt(n, { n: 28, spread: 120 }), 200);
  }

  /* ===== Книга времени ===== */
  let bookFilter = 'all', bookGroup = 'any';
  function book() {
    show('scr-book');
    const c = CR.progress.counts();
    $('#book-summary').innerHTML = `
      <span class="lv new">Новые: ${c.new}</span><span class="lv learning">Изучаются: ${c.learning}</span>
      <span class="lv familiar">Знакомые: ${c.familiar}</span><span class="lv mastered">Освоены: ${c.mastered}</span>`;
    $('#book-groups').innerHTML = `<option value="any">Все группы</option>` + CR.GROUPS.map((g) => `<option value="${g.id}">${g.title} (${g.ex})</option>`).join('');
    $('#book-groups').value = bookGroup;
    renderBook();
  }
  function renderBook() {
    const q = CR.norm($('#book-search').value);
    const trouble = new Set(CR.progress.troubleIds());
    $$('#book-filters .chip').forEach((b) => b.classList.toggle('on', b.dataset.f === bookFilter));
    const list = CR.VERBS.filter((v) => {
      const lv = CR.progress.level(v.id);
      if (bookFilter === 'mistakes' && !trouble.has(v.id)) return false;
      if (bookFilter !== 'all' && bookFilter !== 'mistakes' && lv !== bookFilter) return false;
      if (bookGroup !== 'any' && !CR.inGroup(v, bookGroup)) return false;
      if (q) {
        const hay = [v.v1, ...v.v2, ...v.v3, v.ru].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => a.v1.localeCompare(b.v1));
    $('#book-grid').innerHTML = list.length ? list.map((v) => {
      const lv = CR.progress.level(v.id);
      return `<button class="verb-card ${lv} ${trouble.has(v.id) ? 'trouble' : ''}" data-v="${v.id}">
        <span class="vc-level">${CR.progress.LEVEL_RU[lv]}</span>
        <b>${v.v1}</b><span class="vc-forms">${CR.formText(v, 2)} · ${CR.formText(v, 3)}</span>
        <small>${esc(v.ru)}</small></button>`;
    }).join('') : `<p class="empty">Ничего не найдено. Попробуй другой фильтр!</p>`;
  }
  function verbDetail(id) {
    const v = CR.BY_ID[id];
    const r = P.verbs[id];
    const lv = CR.progress.level(id);
    const g = CR.GROUPS.find((x) => CR.inGroup(v, x.id));
    modal({
      cls: 'verb-modal ' + lv,
      title: `${v.v1} <small>${esc(v.ru)}</small>`,
      body: `${CR.ui.formsRow(v)}
        <button class="btn ghost small" data-speak="${v.id}">${CR.icon('speaker')} Все три формы</button>
        ${v.note ? `<p class="lesson-note">${CR.icon('bulb')} ${esc(v.note)}</p>` : ''}
        <div class="examples">
          <p><span class="tag">Past Simple</span> ${esc(CR.ui.pastSentence(v))}<small>${esc(v.s.ru)}</small></p>
          ${v.id !== 'be' ? `<p><span class="tag">Did / didn't</span> ${esc(`${v.s.subj} didn't ${v.v1} ${v.s.rest} ${v.s.time}.`)}</p>` : `<p><span class="tag">was / were</span> We were in the park yesterday.</p>`}
          <p><span class="tag">have / has + V3</span> ${esc(perfectEx(v))}</p>
        </div>
        <div class="detail-stats"><span class="lv ${lv}">${CR.progress.LEVEL_RU[lv]}</span>
          ${g ? `<span class="tag">${g.title}</span>` : ''}
          ${r ? `<span>верно: ${r.c} · ошибок: ${r.w}</span>` : '<span>ещё не встречался</span>'}</div>`,
      buttons: [{ label: 'Закрыть', cls: 'primary' }]
    });
  }
  function perfectEx(v) {
    const s = v.s;
    if (v.id === 'be') return 'I have been to Paris.';
    const has = s.plural ? 'have' : 'has';
    return `${s.subj} ${has} ${v.v3[0]} ${s.rest}.`.replace(/ \./, '.');
  }

  /* ===== Достижения ===== */
  function achievements() {
    show('scr-ach');
    const got = P.ach;
    $('#ach-grid').innerHTML = CR.achievements.LIST.map((a) => `
      <div class="ach-card ${got[a.id] ? 'got' : ''}">${CR.art.badge(a.icon, !!got[a.id])}
        <div><b>${a.name}</b><span>${a.ru}</span><small>${a.desc}</small>
        ${got[a.id] ? `<em>Получено ${new Date(got[a.id]).toLocaleDateString('ru-RU')}</em>` : ''}</div></div>`).join('');
    const c = CR.progress.counts();
    $('#ach-stats').innerHTML = `
      <div><b>${P.stats.correct}</b><small>верных ответов</small></div>
      <div><b>${CR.achievements.learned()}</b><small>знакомых глаголов</small></div>
      <div><b>${c.mastered}</b><small>освоено</small></div>
      <div><b>${Object.keys(P.story.done).length}/${CR.LOCATIONS.length}</b><small>локаций</small></div>`;
  }

  /* ===== Настройки ===== */
  function settings() {
    const body = html(`<div class="settings">
      <label class="set-row"><span>Имя игрока</span><input class="input" id="set-name" maxlength="16" value="${esc(P.name || '')}"></label>
      <div class="set-row col"><span>Сложность <small>(прогресс по глаголам не зависит от сложности)</small></span><div class="diff-pick">${diffCards(P.difficulty)}</div></div>
      <label class="set-row"><span>Звуковые эффекты</span><input type="checkbox" class="toggle" id="set-sound" ${P.sound ? 'checked' : ''}></label>
      <label class="set-row"><span>Меньше анимаций</span><input type="checkbox" class="toggle" id="set-motion" ${P.reduceMotion ? 'checked' : ''}></label>
      <label class="set-row"><span>Скорость произношения</span><input type="range" id="set-rate" min="0.6" max="1.1" step="0.05" value="${P.speechRate}"></label>
      <div class="set-row"><span>Проверить голос</span><button class="btn ghost small" id="set-voice">${CR.icon('speaker')} read — read — read</button></div>
      <p class="set-note">${CR.audio.canSpeak() ? 'Английский голос найден.' : 'Английский голос в браузере не найден — используй транскрипцию.'}</p>
    </div>`);
    body.addEventListener('click', (e) => {
      const c = e.target.closest('.diff-card'); if (c) { $$('.diff-card', body).forEach((x) => x.classList.toggle('on', x === c)); CR.sfx.click(); }
      if (e.target.closest('#set-voice')) CR.audio.speakVerb(CR.BY_ID.read);
    });
    modal({
      title: 'Настройки', body,
      buttons: [{ label: 'Отмена', cls: 'ghost' }, {
        label: 'Сохранить', cls: 'primary', onClick: () => {
          const n = $('#set-name', body).value.trim(); if (n) P.name = n;
          const d = $('.diff-card.on', body); if (d) P.difficulty = d.dataset.d;
          P.sound = $('#set-sound', body).checked;
          P.reduceMotion = $('#set-motion', body).checked;
          P.speechRate = +$('#set-rate', body).value;
          CR.progress.saveNow(); updateWorld();
          if (CR.ui.current === 'scr-map') map();
          toast('Настройки сохранены');
        }
      }]
    });
  }

  async function resetAll() {
    if (await CR.ui.confirm('Весь прогресс, имя, глаголы и достижения будут удалены. Начать с чистого листа?', 'Сбросить')) {
      CR.progress.reset(); P = CR.progress.state; updateWorld(); title(); toast('Прогресс сброшен');
    }
  }

  /* ===== Старт ===== */
  function boot() {
    P = CR.progress.load();
    const check = CR.validate();
    if (!check.ok) console.error('Проверка базы глаголов:', check.errors); else console.info(`База глаголов проверена: ${check.count} записей, ошибок нет.`);
    window.__verbCheck = check;
    buildWorld();

    $('#btn-start').onclick = async () => {
      CR.audio.unlock(); CR.sfx.click();
      if (!CR.progress.hasSave()) await askName();
      intro();
    };
    $('#btn-continue').onclick = () => { CR.audio.unlock(); CR.sfx.click(); P.introSeen ? map() : intro(); };
    $('#btn-book-title').onclick = () => { CR.sfx.click(); book(); };
    $('#btn-settings-title').onclick = () => { CR.sfx.click(); settings(); };
    $('#btn-reset').onclick = resetAll;

    $('#map-book').onclick = () => { CR.sfx.click(); book(); };
    $('#map-ach').onclick = () => { CR.sfx.click(); achievements(); };
    $('#map-hunt').onclick = () => { CR.sfx.click(); CR.games.hunt.open(); };
    $('#map-trouble').onclick = () => {
      CR.sfx.click();
      if (!CR.progress.troubleIds().length) { toast('Проблемных глаголов нет — так держать!'); return; }
      CR.games.hunt.open({ preset: 'mistakes' });
    };
    $('#map-settings').onclick = () => { CR.sfx.click(); settings(); };
    $('#map-home').onclick = () => { CR.sfx.click(); title(); };

    $$('.back-to-map').forEach((b) => b.onclick = async () => {
      CR.sfx.click();
      if (CR.ui.current === 'scr-game' && document.body.dataset.game && document.body.dataset.game !== 'hunt') {
        if (!(await CR.ui.confirm('Выйти из мини-игры? Прогресс этого раунда не сохранится, но выученные глаголы останутся.', 'Выйти'))) return;
      }
      CR.progress.hasSave() ? map() : title();
    });
    $('#book-search').oninput = renderBook;
    $('#book-groups').onchange = (e) => { bookGroup = e.target.value; renderBook(); };
    $('#book-filters').onclick = (e) => { const c = e.target.closest('.chip'); if (c) { bookFilter = c.dataset.f; CR.sfx.click(); renderBook(); } };
    $('#book-grid').onclick = (e) => { const c = e.target.closest('.verb-card'); if (c) { CR.sfx.click(); verbDetail(c.dataset.v); } };
    $('#book-study').onclick = () => {
      CR.sfx.click();
      CR.games.hunt.open({ preset: bookGroup !== 'any' ? 'group:' + bookGroup : 'random' });
    };

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const m = $$('.modal-wrap'); if (m.length && !m[m.length - 1].classList.contains('result-modal')) m[m.length - 1].click(); } });
    title();
    // Скрыть экран загрузки
    document.body.classList.add('ready');
  }

  CR.app = { map, book, achievements, settings, launch, title, updateWorld, openLocation, show };
  document.addEventListener('DOMContentLoaded', boot);
})();
