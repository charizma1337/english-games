/* Звуковые эффекты (Web Audio API) и произношение (SpeechSynthesis) */
(function () {
  let ctx = null, master = null;
  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.32;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const on = () => CR.progress.state.sound;

  function tone(freq, dur, opt) {
    if (!on()) return;
    const c = ac(); if (!c) return;
    opt = opt || {};
    const t0 = c.currentTime + (opt.delay || 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = opt.type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (opt.to) o.frequency.exponentialRampToValueAtTime(opt.to, t0 + dur);
    const vol = opt.vol == null ? 0.6 : opt.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(dur, opt) {
    if (!on()) return;
    const c = ac(); if (!c) return;
    opt = opt || {};
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = opt.filter || 'bandpass'; f.frequency.value = opt.freq || 1200;
    const g = c.createGain(); g.gain.value = opt.vol || 0.3;
    s.connect(f); f.connect(g); g.connect(master);
    s.start(c.currentTime + (opt.delay || 0));
  }

  const sfx = {
    click() { tone(660, 0.06, { type: 'triangle', vol: 0.25 }); },
    pick() { tone(520, 0.08, { type: 'triangle', vol: 0.3, to: 780 }); },
    drop() { tone(380, 0.09, { type: 'triangle', vol: 0.35, to: 300 }); },
    correct() { [523, 659, 784].forEach((f, i) => tone(f, 0.18, { type: 'triangle', delay: i * 0.07, vol: 0.4 })); },
    wrong() { tone(220, 0.25, { type: 'sine', vol: 0.35, to: 160 }); },
    flip() { noise(0.08, { freq: 2500, vol: 0.15 }); },
    whoosh() { noise(0.35, { freq: 800, vol: 0.25, filter: 'lowpass' }); },
    jump() { tone(300, 0.2, { type: 'square', vol: 0.12, to: 900 }); },
    stumble() { tone(180, 0.18, { type: 'sawtooth', vol: 0.12, to: 90 }); noise(0.15, { freq: 300, vol: 0.2 }); },
    lock() { tone(1200, 0.05, { type: 'square', vol: 0.12 }); tone(800, 0.08, { type: 'square', vol: 0.12, delay: 0.05 }); },
    tick() { tone(1500, 0.03, { type: 'square', vol: 0.06 }); },
    crystal() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.4, { type: 'sine', delay: i * 0.09, vol: 0.3 })); },
    portal() { tone(110, 1.2, { type: 'sawtooth', vol: 0.08, to: 55 }); tone(220, 1.2, { type: 'sine', vol: 0.2, to: 880 }); },
    train() { tone(392, 0.5, { type: 'square', vol: 0.1 }); tone(330, 0.6, { type: 'square', vol: 0.1, delay: 0.5 }); noise(1.2, { freq: 400, vol: 0.18, filter: 'lowpass', delay: 0.3 }); },
    win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.25, { type: 'triangle', delay: i * 0.12, vol: 0.4 })); },
    achieve() { [880, 1109, 1319, 1760].forEach((f, i) => tone(f, 0.3, { type: 'sine', delay: i * 0.08, vol: 0.3 })); },
    lose() { [392, 349, 311, 262].forEach((f, i) => tone(f, 0.3, { type: 'triangle', delay: i * 0.15, vol: 0.3 })); }
  };

  /* ===== Произношение ===== */
  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => /en-GB/i.test(v.lang) && /female|libby|sonia|hazel|serena|kate/i.test(v.name)) ||
      vs.find((v) => /en-GB/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
    return voice;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }
  function canSpeak() { return 'speechSynthesis' in window && (voice || pickVoice()); }

  function say(text, rate) {
    if (!('speechSynthesis' in window)) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = (voice && voice.lang) || 'en-GB';
      if (voice) u.voice = voice;
      u.rate = rate || CR.progress.state.speechRate || 0.85;
      speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }
  // Произнести форму f (1..3) глагола v — с учётом омографов (read → [red])
  function speakForm(v, f) {
    const list = v.speak ? [v.speak[f - 1]] : CR.forms(v, f);
    return say(list.join('. '));
  }
  function speakVerb(v) {
    const parts = [1, 2, 3].map((f) => (v.speak ? v.speak[f - 1] : CR.forms(v, f).join(', ')));
    return say(parts.join('... '), 0.8);
  }

  CR.audio = { sfx, say, speakForm, speakVerb, canSpeak, unlock: ac };
  CR.sfx = sfx;
})();
