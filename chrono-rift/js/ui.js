/* Общие элементы интерфейса: экраны, диалоги, окна, перетаскивание, уроки, результаты */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  function html(str) {
    const t = document.createElement('template');
    t.innerHTML = str.trim();
    return t.content.firstElementChild;
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduced = () => CR.progress.state.reduceMotion;

  /* ===== Экраны ===== */
  let current = null;
  const leaveHandlers = [];
  function show(id) {
    // Остановить игру, если уходим с её экрана
    while (leaveHandlers.length) { try { leaveHandlers.pop()(); } catch (e) { console.error(e); } }
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    current = id;
    document.body.dataset.screen = id;
    window.scrollTo(0, 0);
  }
  function onLeave(fn) { leaveHandlers.push(fn); }

  /* ===== Портреты ===== */
  function portrait(who, cls) {
    const c = CR.CHARACTERS[who] || CR.CHARACTERS.ladybug;
    if (who === 'phantom') return `<div class="portrait phantom-portrait ${cls || ''}" style="--pc:${c.color}">${CR.art.phantom()}</div>`;
    return `<div class="portrait ${cls || ''}" style="--pc:${c.color}"><img src="${c.img}" alt="${esc(c.name)}" draggable="false"></div>`;
  }

  /* ===== Диалоги ===== */
  function dialog(lines, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      const root = $('#overlay-root');
      const box = html(`<div class="dialog ${opts.scene ? 'with-scene' : ''}" role="dialog" aria-live="polite">
        <div class="dialog-card">
          <div class="dialog-portrait"></div>
          <div class="dialog-body"><div class="dialog-name"></div><div class="dialog-text"></div>
          <div class="dialog-foot"><button class="btn ghost small dlg-skip">Пропустить</button><button class="btn primary small dlg-next">Дальше ▸</button></div></div>
        </div></div>`);
      root.appendChild(box);
      let i = -1, typing = null, full = '';
      const txt = $('.dialog-text', box);
      function next() {
        if (typing) { clearInterval(typing); typing = null; txt.textContent = full; return; }
        i++;
        if (i >= lines.length) return close();
        const L = lines[i];
        const ch = CR.CHARACTERS[L.who] || CR.CHARACTERS.ladybug;
        $('.dialog-portrait', box).innerHTML = portrait(L.who, 'big');
        $('.dialog-name', box).textContent = ch.name;
        $('.dialog-name', box).style.color = ch.color;
        box.querySelector('.dialog-card').style.setProperty('--pc', ch.color);
        full = L.text.replace(/\{name\}/g, CR.progress.state.name || 'друг');
        if (L.on) try { L.on(); } catch (e) { }
        if (reduced()) { txt.textContent = full; return; }
        txt.textContent = '';
        let k = 0;
        typing = setInterval(() => {
          k += 2; txt.textContent = full.slice(0, k);
          if (k >= full.length) { clearInterval(typing); typing = null; }
        }, 22);
        CR.sfx.click();
      }
      function close() {
        if (typing) clearInterval(typing);
        box.classList.add('out');
        document.removeEventListener('keydown', key);
        setTimeout(() => { box.remove(); resolve(); }, 200);
      }
      function key(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } if (e.key === 'Escape') close(); }
      box.addEventListener('click', (e) => { if (e.target.closest('.dlg-skip')) return close(); next(); });
      document.addEventListener('keydown', key);
      next();
    });
  }

  /* ===== Модальные окна ===== */
  function modal(opts) {
    const root = $('#overlay-root');
    const m = html(`<div class="modal-wrap ${opts.cls || ''}"><div class="modal" role="dialog" aria-modal="true">
      ${opts.title ? `<h2 class="modal-title">${opts.title}</h2>` : ''}
      <div class="modal-body"></div><div class="modal-foot"></div></div></div>`);
    const body = $('.modal-body', m);
    if (typeof opts.body === 'string') body.innerHTML = opts.body; else if (opts.body) body.appendChild(opts.body);
    const foot = $('.modal-foot', m);
    function close() { m.classList.add('out'); setTimeout(() => m.remove(), 180); }
    (opts.buttons || []).forEach((b) => {
      const btn = html(`<button class="btn ${b.cls || ''}">${b.label}</button>`);
      btn.onclick = () => { CR.sfx.click(); if (b.onClick && b.onClick(close) === false) return; close(); };
      foot.appendChild(btn);
    });
    if (opts.dismiss !== false) m.addEventListener('click', (e) => { if (e.target === m) close(); });
    root.appendChild(m);
    const first = $('input, .btn.primary', m); if (first && opts.focus !== false) setTimeout(() => first.focus(), 60);
    return { el: m, close };
  }
  function confirm(text, yes, no) {
    return new Promise((res) => modal({
      title: 'Ты уверен?', body: `<p>${text}</p>`,
      buttons: [{ label: no || 'Отмена', cls: 'ghost', onClick: () => res(false) }, { label: yes || 'Да', cls: 'danger', onClick: () => res(true) }],
      dismiss: false
    }));
  }

  /* ===== Тосты ===== */
  function toast(msg, type) {
    const t = html(`<div class="toast ${type || ''}">${msg}</div>`);
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3000);
  }
  function achievementToast(a) {
    CR.sfx.achieve();
    const t = html(`<div class="toast ach">${CR.art.badge(a.icon, true)}<div><b>Достижение!</b><br>${a.name}<small>${a.ru}</small></div></div>`);
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 3800);
    setTimeout(() => t.remove(), 4300);
  }

  /* ===== Частицы ===== */
  function burst(x, y, opts) {
    opts = opts || {};
    if (reduced()) return;
    const n = opts.n || 14;
    const colors = opts.colors || ['#FFD66D', '#4ED9E8', '#F24971', '#7045E8', '#F6F3FF'];
    const layer = $('#fx-layer');
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'particle' + (opts.dots ? ' dot' : '');
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * (opts.spread || 70);
      p.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % colors.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
      layer.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  }
  function burstAt(el, opts) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, opts);
  }
  function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  function comic(text, color) {
    const layer = $('#fx-layer');
    const c = html(`<div class="comic-pop" style="--c:${color || '#FFD66D'}">${text}</div>`);
    layer.appendChild(c);
    setTimeout(() => c.remove(), 1100);
  }

  /* ===== Подсказка-компаньон внутри игры ===== */
  function hint(container, who, text, ms) {
    const old = $('.companion', container); if (old) old.remove();
    const ch = CR.CHARACTERS[who];
    const el = html(`<div class="companion" style="--pc:${ch.color}">${portrait(who, 'tiny')}<div class="companion-text"><b>${ch.name}:</b> ${text}</div></div>`);
    container.appendChild(el);
    el.addEventListener('click', () => el.remove());
    if (ms !== 0) setTimeout(() => el.classList.add('out'), ms || 4200);
    setTimeout(() => { if (el.classList.contains('out')) el.remove(); }, (ms || 4200) + 400);
    return el;
  }

  /* ===== Перетаскивание (мышь + касание) и «нажми-нажми» ===== */
  function dnd(root, opts) {
    let start = null, ghost = null, item = null, dragging = false, selected = null, overT = null, suppressClick = false;
    const isItem = (el) => el && el.closest(opts.item);
    function down(e) {
      const it = isItem(e.target);
      if (!it || !root.contains(it) || it.classList.contains('used') || it.disabled) return;
      if (e.button !== undefined && e.button !== 0) return;
      item = it; start = { x: e.clientX, y: e.clientY }; dragging = false;
      try { it.setPointerCapture && it.setPointerCapture(e.pointerId); } catch (er) { }
    }
    function move(e) {
      if (!item) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!dragging && Math.hypot(dx, dy) > 8) {
        dragging = true;
        const r = item.getBoundingClientRect();
        ghost = item.cloneNode(true);
        ghost.classList.add('drag-ghost');
        ghost.style.width = r.width + 'px'; ghost.style.height = r.height + 'px';
        ghost._ox = start.x - r.left; ghost._oy = start.y - r.top;
        document.body.appendChild(ghost);
        item.classList.add('drag-src');
        CR.sfx.pick();
        select(null);
      }
      if (dragging) {
        e.preventDefault();
        ghost.style.transform = `translate(${e.clientX - ghost._ox}px, ${e.clientY - ghost._oy}px) rotate(-3deg) scale(1.06)`;
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const t = under && under.closest(opts.target);
        if (t !== overT) { overT && overT.classList.remove('drop-over'); overT = t && root.contains(t) ? t : null; overT && overT.classList.add('drop-over'); }
      }
    }
    function up(e) {
      if (!item) return;
      const it = item; item = null;
      if (dragging) {
        suppressClick = true; setTimeout(() => (suppressClick = false), 50);
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const t = under && under.closest(opts.target);
        ghost && ghost.remove(); ghost = null;
        it.classList.remove('drag-src');
        overT && overT.classList.remove('drop-over'); overT = null;
        dragging = false;
        if (t && root.contains(t)) opts.onDrop(it, t);
      }
    }
    function select(it) {
      if (selected) selected.classList.remove('selected');
      selected = it;
      if (it) { it.classList.add('selected'); CR.sfx.pick(); }
      opts.onSelect && opts.onSelect(it);
    }
    function click(e) {
      if (suppressClick) return;
      const it = isItem(e.target);
      if (it && root.contains(it) && !it.classList.contains('used')) { select(selected === it ? null : it); return; }
      const t = e.target.closest(opts.target);
      if (t && root.contains(t) && selected) { const s = selected; select(null); opts.onDrop(s, t); }
    }
    root.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    root.addEventListener('click', click);
    return {
      select, get selected() { return selected; },
      destroy() {
        root.removeEventListener('pointerdown', down);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        root.removeEventListener('click', click);
        ghost && ghost.remove();
      }
    };
  }

  /* ===== Карточка трёх форм ===== */
  function formsRow(v, opts) {
    opts = opts || {};
    const labels = ['V1 · Infinitive', 'V2 · Past Simple', 'V3 · Past Participle'];
    return `<div class="forms-row">${[1, 2, 3].map((f) => `
      <div class="form-cell f${f}">
        <small>${labels[f - 1]}</small>
        <b>${CR.formText(v, f)}</b>
        ${opts.ipa !== false ? `<i>[${v.ipa[f - 1]}]</i>` : ''}
        <button class="speak-btn" data-speak="${v.id}" data-f="${f}" aria-label="Произнести">${CR.icon('speaker')}</button>
      </div>`).join('<span class="form-arrow">→</span>')}</div>`;
  }
  // Глобальная кнопка «произнести»
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-speak]');
    if (!b) return;
    e.stopPropagation();
    const v = CR.BY_ID[b.dataset.speak];
    if (!v) return;
    const ok = b.dataset.f ? CR.audio.speakForm(v, +b.dataset.f) : CR.audio.speakVerb(v);
    if (!ok) toast('Озвучка недоступна в этом браузере — смотри транскрипцию в скобках.');
    b.classList.add('pulse'); setTimeout(() => b.classList.remove('pulse'), 500);
  }, true);

  /* ===== Урок Маринетт: знакомство с новыми глаголами ===== */
  function lesson(verbs) {
    if (!verbs || !verbs.length) return Promise.resolve();
    return new Promise((resolve) => {
      const root = $('#overlay-root');
      const box = html(`<div class="lesson-wrap"><div class="lesson">
        <div class="lesson-head">${portrait('marinette', 'small')}<div><b>Урок Маринетт</b><span class="lesson-count"></span></div>
        <button class="btn ghost small lesson-skip">Пропустить урок</button></div>
        <div class="lesson-body"></div></div></div>`);
      root.appendChild(box);
      let i = 0;
      const body = $('.lesson-body', box);
      function step() {
        if (i >= verbs.length) return done();
        const v = verbs[i];
        $('.lesson-count', box).textContent = `Новый глагол ${i + 1} из ${verbs.length}`;
        body.innerHTML = `<div class="lesson-card pop-in">
          <div class="lesson-ru">${esc(v.ru)}</div>
          ${formsRow(v)}
          <button class="btn ghost small" data-speak="${v.id}">${CR.icon('speaker')} Послушать все три формы</button>
          ${v.note ? `<p class="lesson-note">${CR.icon('bulb')} ${esc(v.note)}</p>` : ''}
          <p class="lesson-ex"><span>${esc(pastSentence(v))}</span><small>${esc(v.s.ru)}</small></p>
          <div class="lesson-task"></div>
        </div>`;
        const ask = v.group === 'same3' ? 2 : (Math.random() < 0.5 ? 2 : 3);
        const task = $('.lesson-task', body);
        const opts = CR.shuffle([1, 2, 3].map((f) => CR.formText(v, f)).filter((x, k, a) => a.indexOf(x) === k));
        task.innerHTML = `<p><b>Мини-проверка:</b> нажми на форму <b>V${ask}</b> ${ask === 2 ? '(Past Simple — «что было вчера»)' : '(Past Participle — после have / has)'}.</p>
          <div class="choice-row">${opts.map((o) => `<button class="chip" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
        task.addEventListener('click', (e) => {
          const b = e.target.closest('.chip'); if (!b || task.dataset.done) return;
          const ok = CR.formText(v, ask) === b.dataset.o;
          if (ok) {
            task.dataset.done = 1; b.classList.add('ok'); CR.sfx.correct(); burstAt(b, { n: 10 });
            task.insertAdjacentHTML('beforeend', `<button class="btn primary lesson-next">${i + 1 < verbs.length ? 'Следующий глагол ▸' : 'Я готов! ▸'}</button>`);
            $('.lesson-next', task).onclick = () => { i++; step(); };
            $('.lesson-next', task).focus();
          } else {
            b.classList.add('bad'); CR.sfx.wrong(); shake(b);
            task.querySelector('p').innerHTML += `<br><span class="hint-line">Почти! Это V${[1, 2, 3].find((f) => CR.formText(v, f) === b.dataset.o)}. Посмотри на подписи сверху.</span>`;
          }
        });
      }
      function done() {
        CR.progress.markIntro(verbs.map((v) => v.id));
        box.classList.add('out');
        setTimeout(() => { box.remove(); resolve(); }, 200);
      }
      $('.lesson-skip', box).onclick = done;
      step();
    });
  }

  /* ===== Предложения ===== */
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function pastSentence(v, which) {
    const s = v.s;
    if (v.id === 'be') return `${s.subj} was ${s.rest} ${s.time}.`;
    const v2 = which || v.v2[0];
    return `${s.subj} ${v2} ${s.rest} ${s.time}.`;
  }

  /* ===== Экран результата ===== */
  function stars(n, max) {
    max = max || 3;
    return `<div class="stars">${Array.from({ length: max }, (_, i) => `<span class="star ${i < n ? 'on' : ''}" style="--d:${i * 0.18}s">${CR.icon('star')}</span>`).join('')}</div>`;
  }
  function calcStars(mistakes, total) {
    if (mistakes === 0) return 3;
    if (mistakes <= Math.max(1, Math.round(total * 0.2))) return 2;
    return 1;
  }
  function result(o) {
    const win = o.win !== false;
    win ? CR.sfx.win() : CR.sfx.lose();
    const review = (o.review || []).filter((x, i, a) => a.findIndex((y) => y.id === x.id) === i);
    const body = `<div class="result ${win ? 'win' : 'lose'}">
      <div class="result-art">${win ? `<img src="assets/characters/duo-action.webp" alt="">` : `<img src="assets/characters/duo-shocked.jpg" alt="">`}</div>
      <h2 class="result-title">${o.title || (win ? 'Победа!' : 'Не сдаёмся!')}</h2>
      ${win ? stars(o.stars || 1) : ''}
      <p class="result-text">${o.text || ''}</p>
      ${o.stats ? `<div class="result-stats">${o.stats.map((s) => `<div><b>${s[1]}</b><small>${s[0]}</small></div>`).join('')}</div>` : ''}
      ${review.length ? `<div class="result-review"><h4>Повтори эти глаголы:</h4>${review.map((v) => `<div class="review-row"><b>${v.v1}</b> — ${CR.formText(v, 2)} — ${CR.formText(v, 3)} <small>${esc(v.ru)}</small><button class="speak-btn" data-speak="${v.id}">${CR.icon('speaker')}</button></div>`).join('')}</div>` : ''}
    </div>`;
    const buttons = [];
    buttons.push({ label: 'На карту', cls: 'ghost', onClick: () => o.onMap && o.onMap() });
    if (o.onRetry) buttons.push({ label: win ? 'Ещё раз' : 'Попробовать снова', cls: win ? 'ghost' : 'primary', onClick: () => o.onRetry() });
    if (win && o.onNext) buttons.push({ label: o.nextLabel || 'Дальше ▸', cls: 'primary', onClick: () => o.onNext() });
    const m = modal({ body, buttons, dismiss: false, cls: 'result-modal' });
    if (win) setTimeout(() => burstAt($('.result-title', m.el), { n: 30, spread: 160 }), 200);
    return m;
  }

  CR.ui = {
    $, $$, html, esc, wait, show, onLeave, portrait, dialog, modal, confirm, toast, achievementToast,
    burst, burstAt, shake, comic, hint, dnd, formsRow, lesson, pastSentence, cap, stars, calcStars, result,
    get current() { return current; }, reduced
  };
})();
