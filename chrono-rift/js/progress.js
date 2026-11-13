/* Прогресс, интервальное повторение, достижения — localStorage */
(function () {
  const KEY = 'chronoRift.save.v1';
  const MIN = 60 * 1000;
  // Интервалы для «коробок» знания: 0 — новое, 1..5
  const INTERVALS = [0, 1 * MIN, 8 * MIN, 45 * MIN, 6 * 60 * MIN, 3 * 24 * 60 * MIN];

  function fresh() {
    return {
      v: 1, name: '', created: Date.now(), introSeen: false,
      difficulty: 'easy', sound: true, reduceMotion: false, speechRate: 0.85,
      story: { done: {}, finished: false },
      games: {},           // id: {plays, stars, perfect, best}
      verbs: {},           // id: {box, due, c, w, f:[ok1,ok2,ok3], intro, last, trouble}
      ach: {},             // id: timestamp
      stats: { answers: 0, correct: 0, hunt: 0, fixed: 0, challengeWins: 0 }
    };
  }

  let S = fresh();
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        S = Object.assign(fresh(), d);
        S.story = Object.assign({ done: {}, finished: false }, d.story);
        S.stats = Object.assign(fresh().stats, d.stats);
      }
    } catch (e) { S = fresh(); }
    return S;
  }
  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 150);
  }
  function saveNow() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* приватный режим */ }
  }
  function hasSave() {
    try { return !!localStorage.getItem(KEY) && !!S.name; } catch (e) { return false; }
  }
  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) { }
    S = fresh();
  }

  function rec(id) {
    if (!S.verbs[id]) S.verbs[id] = { box: 0, due: 0, c: 0, w: 0, f: [0, 0, 0], intro: false, last: 0, trouble: 0 };
    return S.verbs[id];
  }

  // Уровень знания глагола
  function level(id) {
    const r = S.verbs[id];
    if (!r || (r.c + r.w) === 0) return 'new';
    if (r.box >= 4 && r.f[1] >= 2 && r.f[2] >= 2 && r.c >= 5) return 'mastered';
    if (r.box >= 3 && r.f[1] >= 1 && r.f[2] >= 1) return 'familiar';
    return 'learning';
  }
  const LEVEL_RU = { new: 'Новый', learning: 'Изучается', familiar: 'Знакомый', mastered: 'Освоен' };

  /* Ответ ученика.
     form: 1|2|3 — какая форма проверялась (0 — весь глагол/предложение) */
  function answer(id, form, correct) {
    const r = rec(id);
    const now = Date.now();
    r.last = now;
    r.intro = true;
    S.stats.answers++;
    if (correct) {
      r.c++; S.stats.correct++;
      if (form >= 1 && form <= 3) r.f[form - 1]++;
      // Коробка растёт, только если пришло время повторения: так одно случайное
      // попадание не превращает слово в «освоенное».
      if (now >= r.due) {
        r.box = Math.min(5, r.box + 1);
        r.due = now + INTERVALS[r.box];
      }
      if (r.trouble > 0 && r.box >= 3) { r.trouble = 0; S.stats.fixed++; }
    } else {
      r.w++;
      r.trouble = Math.min(9, r.trouble + 1);
      r.box = Math.max(1, r.box - 2);
      r.due = now + INTERVALS[1];
    }
    save();
    CR.achievements && CR.achievements.check();
  }

  function markIntro(ids) { ids.forEach((id) => { rec(id).intro = true; }); save(); }
  function isIntro(id) { return !!(S.verbs[id] && S.verbs[id].intro); }
  function troubleIds() {
    return Object.keys(S.verbs).filter((id) => S.verbs[id].trouble > 0 || (S.verbs[id].w > 0 && level(id) !== 'mastered' && S.verbs[id].w >= S.verbs[id].c))
      .sort((a, b) => (S.verbs[b].trouble - S.verbs[a].trouble));
  }

  /* Подбор глаголов на игру:
     - сначала проблемные и «пора повторить»,
     - затем новые (по учебному плану),
     - остальное — повторение знакомых, освоенные реже. */
  function pickVerbs(n, opts) {
    opts = opts || {};
    const filter = opts.filter || (() => true);
    const maxNew = opts.maxNew != null ? opts.maxNew : 3;
    const exclude = new Set(opts.exclude || []);
    const pool = CR.VERBS.filter((v) => filter(v) && !exclude.has(v.id));
    const now = Date.now();
    const chosen = [];
    const add = (v) => { if (v && !chosen.includes(v) && chosen.length < n) chosen.push(v); };

    const introduced = pool.filter((v) => isIntro(v.id));
    // 1) проблемные
    shuffle(introduced.filter((v) => S.verbs[v.id].trouble > 0)).slice(0, Math.ceil(n / 3)).forEach(add);
    // 2) пора повторить (не освоенные)
    shuffle(introduced.filter((v) => S.verbs[v.id].due <= now && level(v.id) !== 'mastered')).slice(0, Math.ceil(n / 3)).forEach(add);
    // 3) новые по плану
    const fresh = CR.CURRICULUM.map((id) => CR.BY_ID[id]).filter((v) => pool.includes(v) && !isIntro(v.id));
    const newOnes = [];
    for (const v of fresh) { if (newOnes.length >= maxNew || chosen.length >= n) break; add(v); newOnes.push(v); }
    // 4) повторение: знакомые чаще, освоенные реже
    const rest = shuffle(introduced.filter((v) => !chosen.includes(v)));
    rest.sort((a, b) => weight(b.id) - weight(a.id) + (Math.random() - 0.5) * 2);
    rest.forEach(add);
    // 5) если всё ещё мало — добираем новыми
    fresh.forEach(add);
    pool.forEach(add);
    return { verbs: shuffle(chosen.slice()), fresh: newOnes };
  }
  function weight(id) {
    const l = level(id);
    return { new: 3, learning: 2.5, familiar: 1.5, mastered: 0.6 }[l] + (S.verbs[id] ? S.verbs[id].trouble * 0.5 : 0);
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function gameResult(id, stars, mistakes, extra) {
    const g = S.games[id] || (S.games[id] = { plays: 0, stars: 0, perfect: 0, best: 0 });
    g.plays++;
    g.stars = Math.max(g.stars, stars);
    if (mistakes === 0) g.perfect++;
    if (extra && extra.score) g.best = Math.max(g.best || 0, extra.score);
    save();
  }
  function completeLocation(id) { S.story.done[id] = true; save(); }
  function isDone(id) { return !!S.story.done[id]; }
  function isUnlocked(id) {
    const i = CR.LOCATIONS.findIndex((l) => l.id === id);
    if (i <= 0) return true;
    return isDone(CR.LOCATIONS[i - 1].id) || isDone(id);
  }
  function restoredRatio() {
    return CR.LOCATIONS.filter((l) => isDone(l.id)).length / CR.LOCATIONS.length;
  }
  function counts() {
    const c = { new: 0, learning: 0, familiar: 0, mastered: 0 };
    CR.VERBS.forEach((v) => c[level(v.id)]++);
    return c;
  }

  CR.progress = {
    load, save, saveNow, hasSave, reset, get state() { return S; },
    level, LEVEL_RU, answer, markIntro, isIntro, troubleIds, pickVerbs, shuffle,
    gameResult, completeLocation, isDone, isUnlocked, restoredRatio, counts, rec
  };
  CR.shuffle = shuffle;
})();

/* ===== Достижения ===== */
(function () {
  const LIST = [
    { id: 'first', name: 'First Spark', ru: 'Первая искра', desc: 'Пройди первую локацию.', icon: 'spark', test: (S) => Object.keys(S.story.done).length >= 1 },
    { id: 'rookie', name: 'Time Rookie', ru: 'Новичок времени', desc: '10 глаголов на уровне «Знакомый» или выше.', icon: 'clock', test: () => learned() >= 10 },
    { id: 'keeper', name: 'Memory Keeper', ru: 'Хранитель памяти', desc: '25 глаголов на уровне «Знакомый» или выше.', icon: 'book', test: () => learned() >= 25 },
    { id: 'hero', name: 'Irregular Hero', ru: 'Герой исключений', desc: '50 глаголов на уровне «Знакомый» или выше.', icon: 'shield', test: () => learned() >= 50 },
    { id: 'master', name: 'Master of Time', ru: 'Повелитель времени', desc: 'Все 86 глаголов освоены.', icon: 'crown', test: () => CR.VERBS.every((v) => CR.progress.level(v.id) === 'mastered') },
    { id: 'perfect', name: 'Perfect Run', ru: 'Идеальный забег', desc: 'Пройди мини-игру без единой ошибки.', icon: 'star', test: (S) => Object.values(S.games).some((g) => g.perfect > 0) },
    { id: 'guardian', name: 'Chrono Guardian', ru: 'Страж времени', desc: 'Заверши сюжет и закрой хроноразлом.', icon: 'portal', test: (S) => S.story.finished },
    { id: 'speed', name: 'Rooftop Runner', ru: 'Бегун по крышам', desc: 'Пройди погоню в режиме Challenge.', icon: 'bolt', test: (S) => S.stats.challengeWins > 0 },
    { id: 'hunter', name: 'Verb Hunter', ru: 'Охотник за глаголами', desc: '30 верных ответов в «Охоте за глаголами».', icon: 'target', test: (S) => S.stats.hunt >= 30 },
    { id: 'fixer', name: 'Mistake Fixer', ru: 'Исправитель', desc: 'Исправь 10 проблемных глаголов.', icon: 'heart', test: (S) => S.stats.fixed >= 10 }
  ];
  function learned() {
    return CR.VERBS.filter((v) => { const l = CR.progress.level(v.id); return l === 'familiar' || l === 'mastered'; }).length;
  }
  function check() {
    const S = CR.progress.state;
    LIST.forEach((a) => {
      if (!S.ach[a.id] && a.test(S)) {
        S.ach[a.id] = Date.now();
        CR.progress.save();
        CR.ui && CR.ui.achievementToast && CR.ui.achievementToast(a);
      }
    });
  }
  CR.achievements = { LIST, check, learned };
})();
