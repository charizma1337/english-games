/* Оригинальные SVG-ассеты: Париж, Эйфелева башня, Хронофантом, акума, часы, значки */
(function () {
  const NS = 'http://www.w3.org/2000/svg';

  // Детерминированный генератор, чтобы город выглядел одинаково при каждом запуске
  function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  function eiffel(x, base, hgt, fill) {
    const w = hgt * 0.42;
    const cx = x;
    const p = [
      `M${cx - w / 2},${base} C${cx - w * 0.28},${base - hgt * 0.25} ${cx - w * 0.12},${base - hgt * 0.55} ${cx - 3},${base - hgt * 0.92}`,
      `L${cx},${base - hgt} L${cx + 3},${base - hgt * 0.92}`,
      `C${cx + w * 0.12},${base - hgt * 0.55} ${cx + w * 0.28},${base - hgt * 0.25} ${cx + w / 2},${base}`,
      `L${cx + w * 0.3},${base} Q${cx},${base - hgt * 0.22} ${cx - w * 0.3},${base} Z`
    ].join(' ');
    return `<g class="eiffel"><path d="${p}" fill="${fill}"/>
      <rect x="${cx - w * 0.3}" y="${base - hgt * 0.3}" width="${w * 0.6}" height="${hgt * 0.025}" fill="${fill}"/>
      <rect x="${cx - w * 0.16}" y="${base - hgt * 0.58}" width="${w * 0.32}" height="${hgt * 0.02}" fill="${fill}"/>
      <circle class="eiffel-beacon" cx="${cx}" cy="${base - hgt}" r="3.5" fill="#FFD66D"/></g>`;
  }

  // Силуэт Парижа: слои крыш с мансардами, трубами и окнами
  function skyline(opts) {
    opts = opts || {};
    const W = 1600, H = 420;
    const r = rng(opts.seed || 7);
    let out = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" class="skyline-svg" aria-hidden="true">`;
    out += `<defs><linearGradient id="bldA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f2358"/><stop offset="1" stop-color="#0d1030"/></linearGradient>
      <linearGradient id="bldB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151840"/><stop offset="1" stop-color="#080a1e"/></linearGradient></defs>`;
    // Дальний слой + башня
    out += `<g opacity=".75">`;
    out += eiffel(opts.eiffelX || 1080, H - 80, 330, '#1c1f52');
    let x = -20;
    while (x < W) {
      const w = 40 + r() * 70, h = 80 + r() * 90;
      out += `<rect x="${x}" y="${H - h - 40}" width="${w}" height="${h + 40}" fill="#141741"/>`;
      if (r() > 0.5) out += `<rect x="${x + w * 0.3}" y="${H - h - 52}" width="6" height="14" fill="#141741"/>`;
      x += w - 2;
    }
    out += `</g>`;
    // Ближний слой — дома с мансардами и окнами
    x = -30;
    let n = 0;
    while (x < W) {
      const w = 90 + r() * 110, h = 110 + r() * 100, top = H - h;
      const roofH = 22 + r() * 18;
      out += `<g class="bld">`;
      out += `<path d="M${x},${H} L${x},${top} L${x + 10},${top - roofH} L${x + w - 10},${top - roofH} L${x + w},${top} L${x + w},${H} Z" fill="url(#bldA)"/>`;
      out += `<rect x="${x - 3}" y="${top - 3}" width="${w + 6}" height="5" fill="#2a2f6e"/>`;
      // трубы
      const ch = 1 + Math.floor(r() * 3);
      for (let i = 0; i < ch; i++) {
        const cx = x + 16 + r() * (w - 36);
        out += `<rect x="${cx}" y="${top - roofH - 14 - r() * 8}" width="9" height="${22}" fill="#1a1e4c"/>`;
      }
      // мансардные окна
      for (let wx = x + 18; wx < x + w - 24; wx += 30) {
        out += `<rect class="win" data-k="${(n++ * 37) % 100}" x="${wx}" y="${top - roofH + 7}" width="9" height="11" rx="4"/>`;
      }
      // окна этажей
      for (let wy = top + 14; wy < H - 26; wy += 30) {
        for (let wx = x + 12; wx < x + w - 18; wx += 22) {
          out += `<rect class="win" data-k="${(n++ * 37) % 100}" x="${wx}" y="${wy}" width="10" height="16" rx="1"/>`;
        }
      }
      out += `</g>`;
      x += w + 4 + r() * 10;
    }
    out += `</svg>`;
    return out;
  }

  // Освещённость окон = восстановленность города
  function lightWindows(root, ratio) {
    const lit = 18 + ratio * 70;
    root.querySelectorAll('.win').forEach((w) => {
      w.classList.toggle('lit', +w.dataset.k < lit);
    });
  }

  // Хронофантом — оригинальный злодей: плащ, лицо-циферблат, светящиеся глаза
  function phantom(cls) {
    return `<svg class="phantom ${cls || ''}" viewBox="0 0 200 240" xmlns="${NS}" aria-label="Хронофантом">
      <defs>
        <radialGradient id="phGlow" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#4ED9E8" stop-opacity=".55"/><stop offset="1" stop-color="#4ED9E8" stop-opacity="0"/></radialGradient>
        <linearGradient id="phCloak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2fd0"/><stop offset=".6" stop-color="#2a1677"/><stop offset="1" stop-color="#120a3a" stop-opacity="0"/></linearGradient>
        <radialGradient id="phFace" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#f6f3ff"/><stop offset="1" stop-color="#b9b2ea"/></radialGradient>
      </defs>
      <ellipse cx="100" cy="100" rx="98" ry="110" fill="url(#phGlow)"/>
      <g class="ph-ribbons" fill="none" stroke="#4ED9E8" stroke-width="2.5" stroke-linecap="round" opacity=".8">
        <path d="M30 150 C 10 120, 40 90, 20 60"/><path d="M170 150 C 190 120, 160 90, 180 60"/>
      </g>
      <path d="M100 18 C 55 18, 40 70, 42 110 C 44 150, 22 190, 14 236 L 62 214 L 82 236 L 100 216 L 118 236 L 138 214 L 186 236 C 178 190, 156 150, 158 110 C 160 70, 145 18, 100 18 Z" fill="url(#phCloak)"/>
      <path d="M100 30 C 70 30, 60 62, 60 88 C 60 116, 78 132, 100 132 C 122 132, 140 116, 140 88 C 140 62, 130 30, 100 30 Z" fill="#160c44"/>
      <circle cx="100" cy="86" r="34" fill="url(#phFace)" stroke="#FFD66D" stroke-width="3"/>
      <g stroke="#3b2a8a" stroke-width="2.4" stroke-linecap="round">
        ${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; const r1 = i % 3 === 0 ? 24 : 27; return `<line x1="${100 + Math.sin(a) * r1}" y1="${86 - Math.cos(a) * r1}" x2="${100 + Math.sin(a) * 30}" y2="${86 - Math.cos(a) * 30}"/>`; }).join('')}
      </g>
      <g class="ph-hands" style="transform-origin:100px 86px">
        <line x1="100" y1="86" x2="100" y2="64" stroke="#7045E8" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="100" y1="86" x2="116" y2="94" stroke="#F24971" stroke-width="3" stroke-linecap="round"/>
      </g>
      <ellipse class="ph-eye" cx="88" cy="80" rx="6" ry="3.4" fill="#4ED9E8"/>
      <ellipse class="ph-eye" cx="112" cy="80" rx="6" ry="3.4" fill="#4ED9E8"/>
      <circle cx="100" cy="86" r="3.5" fill="#FFD66D"/>
      <g class="ph-gears" fill="none" stroke="#FFD66D" stroke-width="2" opacity=".85">
        <circle cx="38" cy="40" r="9" stroke-dasharray="4 3"/><circle cx="166" cy="48" r="12" stroke-dasharray="5 3"/><circle cx="160" cy="176" r="7" stroke-dasharray="3 3"/>
      </g>
    </svg>`;
  }

  // Акума — тёмная бабочка
  function akuma(cls, color) {
    const c = color || '#7a3bff';
    return `<svg class="akuma ${cls || ''}" viewBox="0 0 60 44" xmlns="${NS}" aria-hidden="true">
      <g class="wing-l"><path d="M30 22 C 18 2, 2 2, 4 14 C 6 24, 18 24, 30 22 Z" fill="${c}"/><path d="M30 24 C 20 30, 8 40, 14 42 C 22 44, 28 32, 30 24 Z" fill="${c}" opacity=".85"/></g>
      <g class="wing-r"><path d="M30 22 C 42 2, 58 2, 56 14 C 54 24, 42 24, 30 22 Z" fill="${c}"/><path d="M30 24 C 40 30, 52 40, 46 42 C 38 44, 32 32, 30 24 Z" fill="${c}" opacity=".85"/></g>
      <ellipse cx="30" cy="24" rx="2.2" ry="9" fill="#120a2a"/>
    </svg>`;
  }

  function clock(cls) {
    return `<svg class="clock ${cls || ''}" viewBox="0 0 120 120" xmlns="${NS}" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="#191C45" stroke="#FFD66D" stroke-width="5"/>
      <circle cx="60" cy="60" r="48" fill="#F6F3FF"/>
      ${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<line x1="${60 + Math.sin(a) * 40}" y1="${60 - Math.cos(a) * 40}" x2="${60 + Math.sin(a) * 46}" y2="${60 - Math.cos(a) * 46}" stroke="#191C45" stroke-width="${i % 3 ? 2 : 4}"/>`; }).join('')}
      <g class="hand-h" style="transform-origin:60px 60px"><line x1="60" y1="60" x2="60" y2="34" stroke="#191C45" stroke-width="5" stroke-linecap="round"/></g>
      <g class="hand-m" style="transform-origin:60px 60px"><line x1="60" y1="60" x2="60" y2="20" stroke="#F24971" stroke-width="3" stroke-linecap="round"/></g>
      <circle cx="60" cy="60" r="4" fill="#7045E8"/>
    </svg>`;
  }

  // Значки для карты и достижений
  const ICON_PATHS = {
    bridge: '<path d="M2 17h20M4 17V11M20 17V11M2 11c4-5 16-5 20 0M8 17v-4M12 17v-5M16 17v-4"/>',
    rooftops: '<path d="M2 20V12l5-4 5 4v8M12 20v-6l5-4 5 4v6M5 6V3M17 9V6"/>',
    library: '<path d="M4 4h4v16H4zM9 4h4v16H9zM14.5 5l3.8-1 3.2 15-3.8 1z"/>',
    tower: '<circle cx="12" cy="9" r="5"/><path d="M12 6v3l2 1M7 22l2-8M17 22l-2-8M8 22h8"/>',
    lab: '<path d="M9 3h6M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V3"/><path d="M7 15h10"/>',
    metro: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 21l2-4M16 21l-2-4"/><circle cx="9" cy="14" r=".8"/><circle cx="15" cy="14" r=".8"/>',
    rift: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    hunt: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>',
    spark: '<path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zM4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5"/>',
    shield: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/>',
    crown: '<path d="M3 18h18l-2-11-5 5-2-7-2 7-5-5z"/>',
    star: '<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7-6.3-3.6-6.3 3.6 1.5-7L2 9.3l7-.8z"/>',
    portal: '<ellipse cx="12" cy="12" rx="9" ry="10"/><path d="M8 12a4 5 0 1 0 8 0 4 5 0 1 0-8 0"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    heart: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    speaker: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H3c0 3 2 5 4 5M17 6h4c0 3-2 5-4 5"/>',
    map: '<path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3zM9 3v15M15 6v15"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    play: '<path d="M7 4l13 8-13 8z"/>'
  };
  function icon(name, cls) {
    return `<svg class="ico ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
  }

  // Медальон достижения
  function badge(name, got) {
    return `<div class="badge ${got ? 'got' : ''}"><svg viewBox="0 0 80 80" aria-hidden="true">
      <defs><linearGradient id="bg-${name}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${got ? '#FFE9A6' : '#3a3f7a'}"/><stop offset="1" stop-color="${got ? '#E8A93A' : '#23265a'}"/></linearGradient></defs>
      <polygon points="40,3 72,20 72,58 40,77 8,58 8,20" fill="url(#bg-${name})" stroke="${got ? '#fff3c4' : '#4a4f8f'}" stroke-width="2.5"/>
      <polygon points="40,12 64,25 64,54 40,68 16,54 16,25" fill="${got ? '#7045E8' : '#191C45'}"/>
    </svg><span class="badge-ico">${icon(name)}</span></div>`;
  }

  CR.art = { skyline, lightWindows, phantom, akuma, clock, icon, badge, eiffel };
  CR.icon = icon;
})();
