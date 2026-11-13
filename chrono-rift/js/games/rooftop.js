/* Мини-игра №2 — «ПОГОНЯ ПО КРЫШАМ»: Canvas-раннер с тремя дорожками */
(function () {
  const { $, esc, wait } = CR.ui;
  const CFG = {
    easy: { q: 8, dmg: 15, travel: 7.5, minTravel: 4.5, newMax: 2 },
    normal: { q: 12, dmg: 20, travel: 6, minTravel: 3.4, newMax: 3 },
    hero: { q: 14, dmg: 25, travel: 4.8, minTravel: 2.8, newMax: 3 }
  };

  CR.games.rooftop = {
    start(root, ctx) {
      const cfg = CFG[ctx.difficulty];
      const training = ctx.mode !== 'challenge';
      const sel = CR.progress.pickVerbs(Math.min(cfg.q, 9), { maxNew: cfg.newMax });
      const queue = [];
      for (let i = 0; i < cfg.q; i++) queue.push(sel.verbs[i % sel.verbs.length]);
      CR.shuffle(queue);

      root.innerHTML = `<div class="roof-game ${training ? 'training' : 'challenge'}">
        <div class="roof-hud">
          <div class="roof-q"><span class="rq-label">${training ? 'TRAINING' : 'CHALLENGE'}</span><div class="rq-forms"></div></div>
          <div class="roof-stats"><div class="energy"><i></i></div><span class="hud-pill rq-count"></span><span class="hud-pill">Очки: <b class="rq-score">0</b></span></div>
        </div>
        <div class="roof-canvas-wrap"><canvas class="roof-canvas" aria-label="Погоня по крышам"></canvas>
          <div class="roof-feedback"></div>
          <div class="roof-start"><button class="btn primary big">Бежим! ▸</button><p>${training ? 'Выбери дорожку: ← → или A / D, мышью или пальцем. Прыжок: ↑, пробел или нажатие на дорожку.' : 'Слова мчатся навстречу! Успей встать на верную дорожку до прыжка.'}</p></div>
        </div>
        <div class="roof-controls">
          <button class="ctrl" data-act="left" aria-label="Влево">${CR.icon('left')}</button>
          ${training ? `<button class="ctrl jump" data-act="jump">Прыжок!</button>` : ''}
          <button class="ctrl" data-act="right" aria-label="Вправо">${CR.icon('right')}</button>
        </div>
      </div>`;

      const canvas = $('.roof-canvas', root), c2 = canvas.getContext('2d');
      const wrap = $('.roof-canvas-wrap', root);
      const img = new Image(); img.src = 'assets/characters/ladybug-cutout.png';
      let W = 0, H = 0, dpr = 1;
      function resize() {
        const r = wrap.getBoundingClientRect();
        dpr = Math.min(2, window.devicePixelRatio || 1);
        W = r.width; H = r.height;
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      }
      resize();
      const ro = new ResizeObserver(resize); ro.observe(wrap);

      // Состояние
      let lane = 1, laneX = 1, energy = 100, score = 0, qi = 0, mistakes = 0, combo = 0;
      let gate = null, running = false, stopped = false, last = 0, time = 0, scroll = 0;
      let jumpT = -1, stumbleT = -1, flash = 0, travel = cfg.travel;
      const review = [];
      const particles = [];
      const hY = () => H * 0.26, pY = () => H * 0.86;
      // ширина дорожки линейна по экранной глубине (t²) — тогда разделители прямые, как в перспективе
      const laneW = (t) => W * (0.07 + 0.25 * t * t) * Math.min(1, 520 / Math.max(W, 1) + 0.35);
      const depthY = (t) => hY() + (pY() - hY()) * t * t;
      const laneCX = (l, t) => W / 2 + (l - 1) * laneW(t);

      function newGate() {
        const v = queue[qi];
        const f = ctx.difficulty === 'hero' && Math.random() < 0.25 ? 1 : (v.group === 'same3' ? 2 : (Math.random() < 0.5 ? 2 : 3));
        const cor = CR.Q.pick(CR.forms(v, f));
        const bad = CR.Q.distractors(v, f, 2);
        const words = CR.shuffle([cor].concat(bad));
        gate = { v, f, words, correctLane: words.indexOf(cor), t: 0, hold: false, resolved: false, shown: true };
        // Вопрос сверху
        const parts = [1, 2, 3].map((x) => x === f ? '<b class="rq-gap">?</b>' : `<span>${esc(CR.formText(v, x).toUpperCase())}</span>`);
        $('.rq-forms', root).innerHTML = parts.join('<i>→</i>') + (ctx.difficulty === 'easy' ? `<small>${esc(v.ru)} · нужна V${f}</small>` : `<small>нужна V${f}</small>`);
        $('.rq-count', root).textContent = `${qi + 1} / ${queue.length}`;
      }

      function move(d) {
        if (!running) return;
        lane = Math.max(0, Math.min(2, lane + d));
        CR.sfx.click();
      }
      function commit() {
        if (!running || !gate || gate.resolved) return;
        if (training && gate.hold) resolve();
      }
      function setLane(l, andCommit) {
        if (!running) return;
        lane = l; CR.sfx.click();
        if (andCommit && training && gate && gate.hold) setTimeout(resolve, 180);
      }

      function resolve() {
        if (!gate || gate.resolved) return;
        gate.resolved = true;
        const ok = lane === gate.correctLane;
        const v = gate.v;
        CR.progress.answer(v.id, gate.f, ok);
        const fb = $('.roof-feedback', root);
        if (ok) {
          combo++; score += 100 + combo * 20;
          jumpT = 0; CR.sfx.jump(); setTimeout(() => CR.sfx.correct(), 150);
          fb.innerHTML = `<b class="ok">${esc(gate.words[gate.correctLane].toUpperCase())} ✓</b>${combo > 2 ? `<small>Серия ×${combo}!</small>` : ''}`;
          for (let i = 0; i < 18; i++) particles.push({ x: laneCX(lane, 1), y: pY() - 40, vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 260, life: 0.8, c: ['#FFD66D', '#F24971', '#4ED9E8'][i % 3] });
          travel = Math.max(cfg.minTravel, travel * 0.95);
        } else {
          combo = 0; mistakes++; energy = Math.max(0, energy - cfg.dmg);
          stumbleT = 0; flash = 1; CR.sfx.stumble();
          if (!review.includes(v)) review.push(v);
          // проблемный глагол вернётся позже в этом же забеге
          if (queue.length < cfg.q + 4) queue.splice(Math.min(queue.length, qi + 3), 0, v);
          fb.innerHTML = `<b class="bad">Ой! Правильно: ${esc(CR.formText(v, gate.f).toUpperCase())}</b><small>${v.v1} — ${CR.formText(v, 2)} — ${CR.formText(v, 3)}</small>`;
        }
        fb.className = 'roof-feedback show';
        $('.rq-score', root).textContent = score;
        $('.energy i', root).style.width = energy + '%';
        $('.energy', root).classList.toggle('low', energy <= 30);
        setTimeout(() => { fb.className = 'roof-feedback'; }, 1500);
        setTimeout(next, ok ? 900 : 1500);
      }
      function next() {
        if (stopped) return;
        if (energy <= 0) return end(false);
        qi++;
        if (qi >= queue.length) return end(true);
        newGate();
      }
      async function end(win) {
        running = false;
        await wait(400);
        if (stopped) return;
        ctx.finish(win ? {
          win: true, mistakes, total: queue.length, review, score,
          title: 'Акума пойман!', text: `Позади ${queue.length} крыш, на счету ${score} очков. Леди Баг поймала акуму!`,
          stats: [['очки', score], ['ошибок', mistakes], ['энергия', energy + '%']]
        } : {
          win: false, mistakes, total: queue.length, review,
          title: 'Акума ускользнул!', text: 'Энергия закончилась, но Леди Баг цела. Повтори глаголы ниже и попробуй ещё раз — в режиме Training можно не торопиться.'
        });
      }

      /* ===== Отрисовка ===== */
      function roundRect(x, y, w, h, r) {
        c2.beginPath(); c2.moveTo(x + r, y); c2.arcTo(x + w, y, x + w, y + h, r); c2.arcTo(x + w, y + h, x, y + h, r);
        c2.arcTo(x, y + h, x, y, r); c2.arcTo(x, y, x + w, y, r); c2.closePath();
      }
      function drawBG() {
        const h0 = hY();
        // дальний город
        c2.fillStyle = 'rgba(20,23,65,.9)';
        let x = 0, k = 0;
        while (x < W) { const w = 30 + ((k * 53) % 40), h = 18 + ((k * 31) % 34); c2.fillRect(x, h0 - h, w, h + 2); x += w + 2; k++; }
        // Эйфелева башня
        const ex = W * 0.72;
        c2.fillStyle = '#1c1f52';
        c2.beginPath(); c2.moveTo(ex - 26, h0); c2.quadraticCurveTo(ex - 6, h0 - 40, ex, h0 - 110); c2.quadraticCurveTo(ex + 6, h0 - 40, ex + 26, h0); c2.fill();
        c2.fillStyle = '#FFD66D'; c2.beginPath(); c2.arc(ex, h0 - 112, 2.5, 0, 7); c2.fill();
        // крыша-дорога
        const g = c2.createLinearGradient(0, h0, 0, H);
        g.addColorStop(0, '#24285e'); g.addColorStop(1, '#3a2f6e');
        c2.fillStyle = g;
        c2.beginPath(); c2.moveTo(laneCX(0, 0) - laneW(0) / 2, h0); c2.lineTo(laneCX(2, 0) + laneW(0) / 2, h0);
        c2.lineTo(laneCX(2, 1.15) + laneW(1.15) / 2, depthY(1.15)); c2.lineTo(laneCX(0, 1.15) - laneW(1.15) / 2, depthY(1.15)); c2.fill();
        // черепица — движущиеся полосы
        c2.strokeStyle = 'rgba(112,69,232,.35)'; c2.lineWidth = 1;
        for (let i = 0; i < 14; i++) {
          const t = ((i / 14) + scroll) % 1;
          const y = depthY(t);
          c2.beginPath(); c2.moveTo(laneCX(0, t) - laneW(t) / 2, y); c2.lineTo(laneCX(2, t) + laneW(t) / 2, y); c2.stroke();
        }
        // разделители дорожек
        c2.strokeStyle = 'rgba(78,217,232,.35)'; c2.lineWidth = 2;
        [0.5, 1.5].forEach((o) => {
          c2.beginPath();
          for (let s = 0; s <= 20; s++) { const t = s / 20 * 1.15; const xx = W / 2 + (o - 1) * laneW(t); const yy = depthY(t); s ? c2.lineTo(xx, yy) : c2.moveTo(xx, yy); }
          c2.stroke();
        });
        // подсветка выбранной дорожки
        c2.fillStyle = 'rgba(242,73,113,.10)';
        c2.beginPath();
        c2.moveTo(laneCX(laneX, 0.35) - laneW(0.35) / 2, depthY(0.35)); c2.lineTo(laneCX(laneX, 0.35) + laneW(0.35) / 2, depthY(0.35));
        c2.lineTo(laneCX(laneX, 1.15) + laneW(1.15) / 2, depthY(1.15)); c2.lineTo(laneCX(laneX, 1.15) - laneW(1.15) / 2, depthY(1.15)); c2.fill();
        // акума впереди
        const ax = W / 2 + Math.sin(time * 1.3) * W * 0.15, ay = h0 - 30 + Math.sin(time * 3) * 6, fl = Math.abs(Math.sin(time * 10));
        c2.fillStyle = '#7a3bff';
        c2.beginPath(); c2.ellipse(ax - 8 * fl - 2, ay, 9 * fl + 1, 7, -0.4, 0, 7); c2.ellipse(ax + 8 * fl + 2, ay, 9 * fl + 1, 7, 0.4, 0, 7); c2.fill();
        c2.fillStyle = '#120a2a'; c2.fillRect(ax - 1.5, ay - 6, 3, 12);
        c2.shadowBlur = 0;
      }
      function drawGate() {
        if (!gate) return;
        const t = gate.t;
        const y = depthY(t);
        const s = 0.35 + 0.75 * t;
        gate.words.forEach((w, l) => {
          const cx = laneCX(l, t), lw = laneW(t) * 0.9;
          // барьер-труба
          const bh = 26 * s;
          c2.fillStyle = gate.resolved && l === gate.correctLane ? '#FFD66D' : '#1a1e4c';
          c2.fillRect(cx - lw / 2, y - bh, lw, bh);
          c2.fillStyle = 'rgba(255,255,255,.12)'; c2.fillRect(cx - lw / 2, y - bh, lw, 4 * s);
          // табличка со словом
          const fs = Math.max(10, 22 * s * Math.min(1, W / 420));
          c2.font = `900 ${fs}px Nunito, system-ui, sans-serif`;
          const tw = Math.min(lw * 1.1, c2.measureText(w.toUpperCase()).width + 18 * s);
          const sy = y - bh - fs * 1.9;
          const glow = gate.resolved ? (l === gate.correctLane ? '#FFD66D' : '#555a8f') : (l === lane ? '#F24971' : '#4ED9E8');
          c2.fillStyle = 'rgba(11,16,38,.88)'; c2.strokeStyle = glow; c2.lineWidth = Math.max(1.5, 3 * s);
          roundRect(cx - tw / 2, sy, tw, fs * 1.55, 8 * s); c2.fill(); c2.stroke();
          c2.fillStyle = gate.resolved && l !== gate.correctLane ? '#8f93c4' : '#F6F3FF';
          c2.textAlign = 'center'; c2.textBaseline = 'middle';
          c2.fillText(w.toUpperCase(), cx, sy + fs * 0.8, lw * 1.05);
        });
      }
      function drawPlayer(dt) {
        laneX += (lane - laneX) * Math.min(1, dt * 12);
        const x = laneCX(laneX, 1);
        const hgt = Math.min(H * 0.34, 210);
        const wdt = hgt * (img.naturalWidth / img.naturalHeight || 0.53);
        let y = pY() + Math.sin(time * 14) * 3;
        let rot = Math.sin(time * 14) * 0.03;
        if (jumpT >= 0) {
          jumpT += dt; const k = jumpT / 0.7;
          y -= Math.sin(Math.min(1, k) * Math.PI) * hgt * 0.45; rot = -k * Math.PI * 2 * (k < 1 ? 1 : 0);
          // нить йо-йо
          c2.strokeStyle = 'rgba(246,243,255,.6)'; c2.lineWidth = 1.5;
          c2.beginPath(); c2.moveTo(x, y - hgt * 0.8); c2.lineTo(x + 40, hY()); c2.stroke();
          if (k >= 1) jumpT = -1;
        }
        let sx = 0;
        if (stumbleT >= 0) { stumbleT += dt; sx = Math.sin(stumbleT * 50) * 6 * (1 - stumbleT / 0.6); rot = 0.25 * (1 - stumbleT / 0.6); if (stumbleT > 0.6) stumbleT = -1; }
        // тень
        c2.fillStyle = 'rgba(0,0,0,.35)'; c2.beginPath(); c2.ellipse(x, pY() + 4, wdt * 0.45, 7, 0, 0, 7); c2.fill();
        c2.save(); c2.translate(x + sx, y); c2.rotate(rot);
        if (img.complete && img.naturalWidth) c2.drawImage(img, -wdt / 2, -hgt, wdt, hgt);
        else { c2.fillStyle = '#F24971'; c2.fillRect(-15, -60, 30, 60); }
        c2.restore();
      }
      function drawParticles(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]; p.life -= dt; if (p.life <= 0) { particles.splice(i, 1); continue; }
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt;
          c2.globalAlpha = Math.max(0, p.life / 0.8); c2.fillStyle = p.c; c2.fillRect(p.x, p.y, 4, 4);
        }
        c2.globalAlpha = 1;
      }

      function frame(ts) {
        if (stopped) return;
        const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
        if (!document.hidden) {
          time += dt;
          const moving = running && !(gate && gate.hold);
          scroll = (scroll + dt * (moving ? 0.9 : 0.25)) % 1;
          if (running && gate && !gate.resolved) {
            const holdAt = 0.62;
            if (training && gate.t >= holdAt) { gate.hold = true; }
            else gate.t += dt / travel * (training ? 0.8 : 1);
            if (!training && gate.t >= 1) resolve();
          } else if (gate && gate.resolved) {
            gate.t = Math.min(1.2, gate.t + dt * 1.2);
          }
          c2.setTransform(dpr, 0, 0, dpr, 0, 0);
          c2.clearRect(0, 0, W, H);
          drawBG();
          drawGate();
          drawPlayer(dt);
          drawParticles(dt);
          if (flash > 0) { c2.fillStyle = `rgba(242,73,113,${flash * 0.25})`; c2.fillRect(0, 0, W, H); flash = Math.max(0, flash - dt * 2); }
          if (gate && gate.hold && !gate.resolved) {
            c2.fillStyle = 'rgba(255,214,109,.9)'; c2.font = '800 15px Nunito, sans-serif'; c2.textAlign = 'center';
            c2.fillText('Выбери дорожку и прыгай!', W / 2, depthY(0.8));
          }
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);

      // Управление
      function key(e) {
        if (CR.ui.current !== 'scr-game') return;
        if (document.querySelector('.modal-wrap, .lesson-wrap, .dialog')) return;
        const k = e.key.toLowerCase();
        if (k === 'arrowleft' || k === 'a' || k === 'ф') { move(-1); e.preventDefault(); }
        else if (k === 'arrowright' || k === 'd' || k === 'в') { move(1); e.preventDefault(); }
        else if (k === 'arrowup' || k === ' ' || k === 'enter' || k === 'w' || k === 'ц') { if (!running) startRun(); else commit(); e.preventDefault(); }
        else if (k === '1' || k === '2' || k === '3') setLane(+k - 1, true);
      }
      document.addEventListener('keydown', key);
      canvas.addEventListener('pointerdown', (e) => {
        if (!running) return;
        const r = canvas.getBoundingClientRect();
        const x = e.clientX - r.left;
        const t = gate ? Math.max(0.5, gate.t) : 0.8;
        let best = 0, bd = 1e9;
        [0, 1, 2].forEach((l) => { const d = Math.abs(laneCX(l, t) - x); if (d < bd) { bd = d; best = l; } });
        setLane(best, true);
      });
      // свайпы
      let sx0 = null;
      wrap.addEventListener('touchstart', (e) => { sx0 = e.touches[0].clientX; }, { passive: true });
      wrap.addEventListener('touchend', (e) => { if (sx0 == null) return; const dx = e.changedTouches[0].clientX - sx0; if (Math.abs(dx) > 50) move(dx > 0 ? 1 : -1); sx0 = null; }, { passive: true });
      root.querySelector('.roof-controls').addEventListener('click', (e) => {
        const b = e.target.closest('.ctrl'); if (!b) return;
        if (!running) return startRun();
        if (b.dataset.act === 'left') move(-1); else if (b.dataset.act === 'right') move(1); else commit();
      });

      function startRun() {
        if (running || stopped) return;
        $('.roof-start', root).classList.add('hide');
        running = true;
        CR.sfx.whoosh();
        newGate();
      }
      (async () => {
        await CR.ui.lesson(sel.fresh);
        $('.roof-start .btn', root).onclick = startRun;
      })();

      return { stop() { stopped = true; running = false; ro.disconnect(); document.removeEventListener('keydown', key); } };
    }
  };
})();
