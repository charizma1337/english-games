/* Генерация заданий: ловушки-формы, предложения Past Simple, did/didn't, was/were, поиск ошибок */
(function () {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const uniq = (a) => a.filter((x, i) => a.indexOf(x) === i);

  // Подходит ли строка для формы f глагола v
  function valid(v, f, s) { return v.accept['v' + f].includes(CR.norm(s)); }
  function validAny(v, s) { return [1, 2, 3].some((f) => valid(v, f, s)); }

  // Похожие глаголы — для правдоподобных ловушек
  function similar(v) {
    const end = v.v1.slice(-3);
    const same = CR.VERBS.filter((x) => x !== v && (x.v1.slice(-3) === end || x.v1.slice(-2) === v.v1.slice(-2)));
    const grp = CR.VERBS.filter((x) => x !== v && x.group === v.group);
    return uniq(CR.shuffle(same).concat(CR.shuffle(grp)));
  }

  /* n неправильных вариантов для слота f глагола v.
     Никогда не возвращает форму, которая правильна для этого слота. */
  function distractors(v, f, n, opts) {
    opts = opts || {};
    const out = [];
    const push = (s) => {
      if (!s) return;
      s = CR.norm(s);
      if (valid(v, f, s) || out.includes(s) || (opts.avoid || []).includes(s)) return;
      if (opts.notValidElsewhere && validAny(v, s)) return; // в многослотных заданиях — без двусмысленности
      out.push(s);
    };
    // другие формы того же глагола (главная ловушка V2 ↔ V3)
    if (!opts.notValidElsewhere) [1, 2, 3].filter((x) => x !== f).forEach((x) => CR.forms(v, x).forEach(push));
    // «как у правильных глаголов»
    push(CR.regularize(v.v1));
    if (f === 3) { push(v.v1 + 'en'); push(v.v2[0] + 'en'); }
    if (f === 2 && v.v1 !== 'be') push(v.v3[0].endsWith('n') ? v.v3[0] : null);
    // та же форма похожих глаголов
    similar(v).forEach((x) => CR.forms(x, f).forEach(push));
    // перемешиваем: сначала «умные» ловушки, но не всегда одинаково
    const smart = out.slice(0, 3), rest = CR.shuffle(out.slice(3));
    const res = CR.shuffle(smart).concat(rest).slice(0, n);
    // «ed»-подделки слишком очевидны на HERO — убираем, если есть замена
    return res;
  }

  /* ===== Предложения ===== */
  const PREP = ['in', 'on', 'to', 'for', 'about', 'at', 'into', 'over', 'across', 'next', 'from', 'of'];
  function chunksOf(rest) {
    const w = rest.split(' ');
    if (w.length < 3) return [rest];
    const k = w.findIndex((x, i) => i > 0 && PREP.includes(x));
    if (k > 0 && k < w.length) return [w.slice(0, k).join(' '), w.slice(k).join(' ')];
    return [rest];
  }
  const T = {
    pastRule: 'Past Simple (yesterday, last night, … ago) → вторая форма глагола, V2.',
    didRule: 'После did / didn\'t глагол возвращается в начальную форму — V1.',
    v3Rule: 'V3 (Past Participle) нужна после have / has. В обычном прошедшем — V2.',
    wasRule: 'was — I / he / she / it; were — you / we / they (и несколько людей).'
  };

  function base(v) { return { v, ru: v.s.ru }; }

  // Пропуск в Past Simple
  function gapPast(v) {
    const s = v.s;
    const answer = v.id === 'be' ? ['was'] : v.v2;
    return Object.assign(base(v), {
      type: 'gap', kind: 'past', form: 2,
      before: `${s.subj}`, after: `${s.rest} ${s.time}.`,
      answer, options: CR.shuffle([answer[0]].concat(distractors(v, 2, 3))),
      rule: T.pastRule
    });
  }
  // didn't + V1
  function gapNeg(v) {
    const s = v.s;
    return Object.assign(base(v), {
      type: 'gap', kind: 'neg', form: 1,
      before: `${s.subj} didn't`, after: `${s.rest} ${s.time}.`,
      answer: [v.v1], options: CR.shuffle(uniq([v.v1, v.v2[0], v.v3[0], CR.regularize(v.v1)]).filter((x, i) => i === 0 || x !== v.v1).slice(0, 4)),
      rule: T.didRule, ru: 'Отрицание: ' + s.ru.replace(/\.$/, '') + ' — НЕ так.'
    });
  }
  // Did …? + V1
  function gapQuestion(v) {
    const s = v.s;
    return Object.assign(base(v), {
      type: 'gap', kind: 'q', form: 1,
      before: `Did ${s.subj.replace(/^The /, 'the ')}`, after: `${s.rest} ${s.time}?`,
      answer: [v.v1], options: CR.shuffle(uniq([v.v1, v.v2[0], v.v3[0], CR.regularize(v.v1)]).slice(0, 4)),
      rule: T.didRule, ru: 'Вопрос: ' + s.ru.replace(/\.$/, '?')
    });
  }
  // was / were
  function gapWas() {
    const it = pick(CR.WASWERE);
    const [b, a] = it[0].split('___');
    return { v: CR.BY_ID.be, type: 'gap', kind: 'was', form: 2, before: b.trim(), after: a.trim(), answer: [it[1]], options: CR.shuffle(['was', 'were']), rule: T.wasRule, ru: it[2] };
  }

  // Составить предложение из блоков
  function build(v, mode, extra) {
    const s = v.s;
    let parts, accepted, decoy = null;
    const restC = chunksOf(s.rest);
    if (mode === 'neg') {
      parts = [s.subj, 'didn\'t', v.v1].concat(restC, [s.time]);
      accepted = [parts.join(' '), [s.time].concat(parts.slice(0, -1)).join(' ')];
      if (extra) decoy = v.v2[0] !== v.v1 ? v.v2[0] : null;
    } else {
      const v2 = v.id === 'be' ? 'was' : v.v2[0];
      parts = [s.subj, v2].concat(restC, [s.time]);
      accepted = [parts.join(' '), [s.time].concat(parts.slice(0, -1)).join(' ')];
      if (extra) decoy = v.v3[0] !== v2 && !valid(v, 2, v.v3[0]) ? v.v3[0] : (v.v1 !== v2 ? v.v1 : null);
    }
    // если в предложении несколько глаголов-форм (let … go) — блоки всё равно однозначны
    const tiles = parts.slice();
    if (decoy && !tiles.includes(decoy)) tiles.push(decoy);
    return Object.assign(base(v), {
      type: 'build', kind: mode, parts, tiles: CR.shuffle(tiles.slice()), decoy,
      accepted: accepted.map((x) => CR.norm(x)),
      rule: mode === 'neg' ? T.didRule + ' Порядок: кто + didn\'t + глагол + остальное.' : T.pastRule + ' Порядок: кто + глагол + что/где + когда.',
      ru: mode === 'neg' ? 'Составь отрицание: «' + s.ru.replace(/\.$/, '') + '» — НЕ было.' : s.ru
    });
  }

  // Найди ошибку
  function error(v) {
    const s = v.s;
    const neg = Math.random() < 0.4 && v.v2[0] !== v.v1 && v.id !== 'be';
    let words, wrong, correct, why;
    if (neg) {
      words = `${s.subj} didn't ${v.v2[0]} ${s.rest} ${s.time}.`.split(' ');
      wrong = v.v2[0]; correct = [v.v1]; why = T.didRule;
    } else {
      const v2 = v.id === 'be' ? 'was' : v.v2[0];
      const cands = [v.v3[0], CR.regularize(v.v1), v.v1].filter((x) => !valid(v, 2, x) && x !== v2);
      if (!cands.length) return null;
      wrong = v.v3[0] !== v2 && !valid(v, 2, v.v3[0]) && Math.random() < 0.55 ? v.v3[0] : cands[Math.floor(Math.random() * cands.length)];
      words = `${s.subj} ${wrong} ${s.rest} ${s.time}.`.split(' ');
      correct = v.id === 'be' ? ['was'] : v.v2;
      why = wrong === v.v3[0] ? T.v3Rule : wrong === v.v1 ? T.pastRule : `«${wrong}» — такой формы нет! ${v.v1} — неправильный глагол: ${v.v1} — ${CR.formText(v, 2)} — ${CR.formText(v, 3)}.`;
    }
    const subjN = s.subj.split(' ').length;
    const idx = neg ? subjN + 1 : subjN;
    return Object.assign(base(v), { type: 'error', words, wrongIndex: idx, wrong, answer: correct, rule: why, form: neg ? 1 : 2 });
  }

  // Perfect Energy (V2 или V3 по контексту)
  function perfect() {
    const it = pick(CR.PERFECT);
    const v = CR.BY_ID[it[1]];
    const [b, a] = it[0].split('___');
    const opts = CR.shuffle([v.v2[0], v.v3[0]]);
    return {
      v, type: 'gap', kind: 'perfect', form: it[2], before: b.trim(), after: a.trim(),
      answer: CR.forms(v, it[2]), options: opts, ru: it[3],
      rule: it[2] === 3 ? 'Есть have / has → нужна V3 (Past Participle).' : 'Есть слово-маркер прошлого (yesterday, ago, last…) и нет have/has → V2.'
    };
  }

  // Карточка-вопрос «форма»: дана одна форма, найти другую (для финала/охоты)
  function formQ(v, given, ask) { return { v, given, ask, answer: CR.forms(v, ask) }; }

  // Глаголы, пригодные для did-заданий
  const didOK = (v) => v.id !== 'be' && v.v2[0] !== v.v1;

  CR.Q = { distractors, valid, validAny, gapPast, gapNeg, gapQuestion, gapWas, build, error, perfect, formQ, didOK, pick, uniq, T };
})();
