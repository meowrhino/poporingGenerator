// ========================================================================
// Poporing Generator — vanilla JS, all visuals via SVG
// ========================================================================

const SVG_NS = 'http://www.w3.org/2000/svg';

const DEFAULTS = {
  name: 'Poppy',
  bodyColor: '#ff8ac9',
  eyes: 'round',
  mouth: 'smile',
  cheeks: 'blush',
  accessory: 'leaf',
  bgColor: '#ffe6f2',
  bgPreset: 'solid',
  sparkles: 'few',
  animation: 'bob',
};

const BODY_SWATCHES = [
  '#ff8ac9', '#ff5c8a', '#ffb347', '#ffe066',
  '#8de68d', '#5ec8f0', '#b084ff', '#ff6b6b',
  '#ffffff', '#3a3a3a',
];

const BG_PRESETS = {
  solid:   { kind: 'solid' },
  rosa:    { kind: 'grad', stops: ['#ffd1e8', '#ffe9c7'] },
  cielo:   { kind: 'grad', stops: ['#cdeaff', '#e9d6ff'] },
  menta:   { kind: 'grad', stops: ['#d1f5e0', '#cdeaff'] },
  atardecer:{ kind: 'grad', stops: ['#ffb199', '#ff6fb3'] },
  lavanda: { kind: 'grad', stops: ['#e0c3fc', '#8ec5fc'] },
  noche:   { kind: 'grad', stops: ['#2b2d6a', '#7d3c98'] },
};

const CHIP_OPTS = {
  eyes: [
    ['round',   'clásicos'],
    ['dot',     'puntitos'],
    ['sleepy',  'dormilón'],
    ['star',    'estrella'],
    ['heart',   'corazón'],
    ['dead',    'KO'],
    ['angry',   'enfado'],
    ['sparkle', 'brillo'],
  ],
  mouth: [
    ['smile',  'sonrisa'],
    ['open',   'abierta'],
    ['smirk',  'pícara'],
    ['frown',  'triste'],
    ['tongue', 'lengua'],
    ['o',      'O'],
    ['cat',    'gatito'],
  ],
  cheeks: [
    ['none',    'sin'],
    ['blush',   'sonrojado'],
    ['freckles','pecas'],
  ],
  accessory: [
    ['none',       'ninguno'],
    ['leaf',       'hojita'],
    ['bow',        'lazo'],
    ['crown',      'corona'],
    ['witch',      'bruja'],
    ['party',      'fiesta'],
    ['glasses',    'gafas'],
    ['headphones', 'cascos'],
    ['flower',     'flor'],
    ['halo',       'aureola'],
  ],
  bgPreset: [
    ['solid',     'sólido'],
    ['rosa',      'rosa'],
    ['cielo',     'cielo'],
    ['menta',     'menta'],
    ['atardecer', 'atardecer'],
    ['lavanda',   'lavanda'],
    ['noche',     'noche'],
  ],
  sparkles: [
    ['none', 'no'],
    ['few',  'pocos'],
    ['many', 'muchos'],
  ],
  animation: [
    ['none',   'estática'],
    ['bob',    'saltar'],
    ['wiggle', 'balancear'],
    ['spin',   'girar'],
  ],
};

const state = { ...DEFAULTS };

// ----- helpers ----------------------------------------------------------

function el(tag, attrs = {}, children = []) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  for (const c of children) n.appendChild(c);
  return n;
}

function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

function darken(hex, amt = 0.3) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const d = v => Math.max(0, Math.min(255, Math.round(v * (1 - amt))));
  return '#' + [d(r), d(g), d(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

function lighten(hex, amt = 0.3) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const l = v => Math.max(0, Math.min(255, Math.round(v + (255 - v) * amt)));
  return '#' + [l(r), l(g), l(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

function isDark(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) < 140;
}

function isBgDark() {
  if (state.bgPreset === 'solid') return isDark(state.bgColor);
  const p = BG_PRESETS[state.bgPreset];
  return p && p.stops && isDark(p.stops[0]) && isDark(p.stops[1]);
}

function starPath(cx, cy, rOuter, rInner, points = 5, startDeg = -90) {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (startDeg + (i * 180) / points) * Math.PI / 180;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    d += (i === 0 ? 'M ' : ' L ') + x.toFixed(2) + ' ' + y.toFixed(2);
  }
  return d + ' Z';
}

function heartPath(cx, cy, s) {
  return `M ${cx} ${cy + s * 0.5}
          C ${cx - s * 1.2} ${cy - s * 0.2}, ${cx - s * 0.9} ${cy - s * 1.1}, ${cx} ${cy - s * 0.3}
          C ${cx + s * 0.9} ${cy - s * 1.1}, ${cx + s * 1.2} ${cy - s * 0.2}, ${cx} ${cy + s * 0.5} Z`;
}

function sparklePath(cx, cy, s) {
  return `M ${cx} ${cy - s}
          Q ${cx + s * 0.18} ${cy - s * 0.18} ${cx + s} ${cy}
          Q ${cx + s * 0.18} ${cy + s * 0.18} ${cx} ${cy + s}
          Q ${cx - s * 0.18} ${cy + s * 0.18} ${cx - s} ${cy}
          Q ${cx - s * 0.18} ${cy - s * 0.18} ${cx} ${cy - s} Z`;
}

// ----- renderers --------------------------------------------------------

function renderBody() {
  const body = document.getElementById('bodyShape');
  body.setAttribute('fill', state.bodyColor);
}

function renderEyes() {
  const g = document.getElementById('eyes');
  clear(g);
  const lx = 118, rx = 182, y = 175;
  const ink = '#2a1a28';

  const addBoth = (fn) => [lx, rx].forEach((x, i) => fn(x, i));

  switch (state.eyes) {
    case 'round':
      addBoth(x => {
        g.appendChild(el('ellipse', { cx: x, cy: y, rx: 10, ry: 13, fill: ink }));
        g.appendChild(el('circle', { cx: x - 3, cy: y - 4, r: 3.5, fill: '#fff' }));
      });
      break;
    case 'dot':
      addBoth(x => g.appendChild(el('circle', { cx: x, cy: y, r: 5, fill: ink })));
      break;
    case 'sleepy':
      addBoth(x => g.appendChild(el('path', {
        d: `M ${x - 11} ${y + 2} Q ${x} ${y - 9}, ${x + 11} ${y + 2}`,
        stroke: ink, 'stroke-width': 3.5, fill: 'none', 'stroke-linecap': 'round',
      })));
      break;
    case 'star':
      addBoth(x => g.appendChild(el('path', {
        d: starPath(x, y, 11, 4.8, 5, -90), fill: ink,
      })));
      break;
    case 'heart':
      addBoth(x => g.appendChild(el('path', {
        d: heartPath(x, y - 1, 9), fill: '#e63a70',
      })));
      break;
    case 'dead':
      addBoth(x => {
        const attr = { stroke: ink, 'stroke-width': 3, 'stroke-linecap': 'round' };
        g.appendChild(el('line', { x1: x - 8, y1: y - 8, x2: x + 8, y2: y + 8, ...attr }));
        g.appendChild(el('line', { x1: x - 8, y1: y + 8, x2: x + 8, y2: y - 8, ...attr }));
      });
      break;
    case 'angry':
      addBoth((x, i) => {
        g.appendChild(el('ellipse', { cx: x, cy: y + 2, rx: 9, ry: 11, fill: ink }));
        g.appendChild(el('circle', { cx: x - 2, cy: y - 2, r: 2.5, fill: '#fff' }));
        const bx1 = i === 0 ? x - 12 : x - 4;
        const bx2 = i === 0 ? x + 4  : x + 12;
        const by1 = i === 0 ? y - 16 : y - 10;
        const by2 = i === 0 ? y - 10 : y - 16;
        g.appendChild(el('line', {
          x1: bx1, y1: by1, x2: bx2, y2: by2,
          stroke: ink, 'stroke-width': 4.5, 'stroke-linecap': 'round',
        }));
      });
      break;
    case 'sparkle':
      addBoth(x => {
        g.appendChild(el('ellipse', { cx: x, cy: y, rx: 10, ry: 13, fill: ink }));
        g.appendChild(el('circle', { cx: x - 3, cy: y - 4, r: 3.8, fill: '#fff' }));
        g.appendChild(el('circle', { cx: x + 4, cy: y + 5, r: 1.8, fill: '#fff' }));
      });
      break;
  }
}

function renderMouth() {
  const g = document.getElementById('mouth');
  clear(g);
  const cx = 150, cy = 215;
  const ink = '#2a1a28';

  switch (state.mouth) {
    case 'smile':
      g.appendChild(el('path', {
        d: `M ${cx - 14} ${cy - 2} Q ${cx} ${cy + 10}, ${cx + 14} ${cy - 2}`,
        stroke: ink, 'stroke-width': 3.5, fill: 'none', 'stroke-linecap': 'round',
      }));
      break;
    case 'open':
      g.appendChild(el('path', {
        d: `M ${cx - 12} ${cy - 3} Q ${cx} ${cy + 14}, ${cx + 12} ${cy - 3} Q ${cx} ${cy + 2}, ${cx - 12} ${cy - 3} Z`,
        fill: ink,
      }));
      g.appendChild(el('path', {
        d: `M ${cx - 6} ${cy + 5} Q ${cx} ${cy + 11}, ${cx + 6} ${cy + 5} Q ${cx} ${cy + 8}, ${cx - 6} ${cy + 5} Z`,
        fill: '#ff6fa8',
      }));
      break;
    case 'smirk':
      g.appendChild(el('path', {
        d: `M ${cx - 14} ${cy} Q ${cx - 4} ${cy + 8}, ${cx + 14} ${cy - 4}`,
        stroke: ink, 'stroke-width': 3.5, fill: 'none', 'stroke-linecap': 'round',
      }));
      break;
    case 'frown':
      g.appendChild(el('path', {
        d: `M ${cx - 12} ${cy + 5} Q ${cx} ${cy - 6}, ${cx + 12} ${cy + 5}`,
        stroke: ink, 'stroke-width': 3.5, fill: 'none', 'stroke-linecap': 'round',
      }));
      break;
    case 'tongue':
      g.appendChild(el('path', {
        d: `M ${cx - 12} ${cy - 2} Q ${cx} ${cy + 6}, ${cx + 12} ${cy - 2}`,
        stroke: ink, 'stroke-width': 3.5, fill: 'none', 'stroke-linecap': 'round',
      }));
      g.appendChild(el('path', {
        d: `M ${cx - 3} ${cy + 4} Q ${cx} ${cy + 14}, ${cx + 5} ${cy + 5} L ${cx + 3} ${cy + 2} Z`,
        fill: '#ff6fa8',
      }));
      break;
    case 'o':
      g.appendChild(el('ellipse', { cx, cy: cy + 3, rx: 5, ry: 6, fill: ink }));
      break;
    case 'cat':
      g.appendChild(el('path', {
        d: `M ${cx - 12} ${cy} Q ${cx - 6} ${cy + 6}, ${cx} ${cy + 1} Q ${cx + 6} ${cy + 6}, ${cx + 12} ${cy}`,
        stroke: ink, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      }));
      break;
  }
}

function renderCheeks() {
  const g = document.getElementById('cheeks');
  clear(g);
  if (state.cheeks === 'none') return;
  if (state.cheeks === 'blush') {
    [90, 210].forEach(x => g.appendChild(el('ellipse', {
      cx: x, cy: 205, rx: 14, ry: 7, fill: '#ff6fa8', opacity: 0.55,
    })));
  } else if (state.cheeks === 'freckles') {
    const dots = [
      [90, 200], [96, 207], [86, 210],
      [210, 200], [204, 207], [214, 210],
    ];
    dots.forEach(([x, y]) => g.appendChild(el('circle', {
      cx: x, cy: y, r: 1.8, fill: darken(state.bodyColor, 0.35),
    })));
  }
}

function renderAccessory() {
  const g = document.getElementById('accessory');
  clear(g);
  const a = state.accessory;
  if (a === 'none') return;

  if (a === 'leaf') {
    // classic poporing leaf
    g.appendChild(el('path', {
      d: `M 150 75 C 140 55, 145 35, 160 25 C 165 45, 162 65, 150 75 Z`,
      fill: '#6fcf73',
    }));
    g.appendChild(el('path', {
      d: `M 155 30 Q 152 50, 150 72`,
      stroke: '#3d8b47', 'stroke-width': 1.5, fill: 'none', 'stroke-linecap': 'round',
    }));
  }
  else if (a === 'bow') {
    const cx = 185, cy = 82;
    g.appendChild(el('path', {
      d: `M ${cx} ${cy} Q ${cx - 22} ${cy - 16}, ${cx - 26} ${cy} Q ${cx - 22} ${cy + 16}, ${cx} ${cy} Z`,
      fill: '#ff5c8a',
    }));
    g.appendChild(el('path', {
      d: `M ${cx} ${cy} Q ${cx + 22} ${cy - 16}, ${cx + 26} ${cy} Q ${cx + 22} ${cy + 16}, ${cx} ${cy} Z`,
      fill: '#ff5c8a',
    }));
    g.appendChild(el('circle', { cx, cy, r: 5, fill: '#ff86a8' }));
  }
  else if (a === 'crown') {
    g.appendChild(el('path', {
      d: `M 110 70 L 125 40 L 140 62 L 150 35 L 160 62 L 175 40 L 190 70 Z`,
      fill: '#ffd23f', stroke: '#c98d0e', 'stroke-width': 1.5, 'stroke-linejoin': 'round',
    }));
    [125, 150, 175].forEach(x => g.appendChild(el('circle', {
      cx: x, cy: 58, r: 3, fill: '#ff5c8a',
    })));
  }
  else if (a === 'witch') {
    g.appendChild(el('path', {
      d: `M 100 82 L 200 82 L 190 70 L 110 70 Z`,
      fill: '#3a1a5c',
    }));
    g.appendChild(el('path', {
      d: `M 115 70 L 150 10 L 185 70 Z`,
      fill: '#4a2377',
    }));
    g.appendChild(el('path', {
      d: `M 150 10 Q 160 25, 148 38`,
      stroke: '#2a0f47', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round',
    }));
    g.appendChild(el('rect', { x: 105, y: 76, width: 90, height: 4, fill: '#ffd23f' }));
    g.appendChild(el('path', {
      d: starPath(140, 55, 4, 1.8, 5, -90), fill: '#ffd23f',
    }));
  }
  else if (a === 'party') {
    g.appendChild(el('path', {
      d: `M 120 78 L 150 15 L 180 78 Z`,
      fill: '#5ec8f0',
    }));
    [[135, 55], [160, 40], [145, 30], [170, 60]].forEach(([x, y], i) => {
      const colors = ['#ff5c8a', '#ffd23f', '#b084ff', '#8de68d'];
      g.appendChild(el('circle', { cx: x, cy: y, r: 3, fill: colors[i % colors.length] }));
    });
    g.appendChild(el('circle', { cx: 150, cy: 14, r: 5, fill: '#ffd23f' }));
  }
  else if (a === 'glasses') {
    const y = 175;
    g.appendChild(el('circle', { cx: 118, cy: y, r: 18, fill: 'rgba(255,255,255,0.4)', stroke: '#2a1a28', 'stroke-width': 3 }));
    g.appendChild(el('circle', { cx: 182, cy: y, r: 18, fill: 'rgba(255,255,255,0.4)', stroke: '#2a1a28', 'stroke-width': 3 }));
    g.appendChild(el('line', { x1: 136, y1: y, x2: 164, y2: y, stroke: '#2a1a28', 'stroke-width': 3 }));
  }
  else if (a === 'headphones') {
    g.appendChild(el('path', {
      d: `M 60 180 Q 60 60, 150 60 Q 240 60, 240 180`,
      stroke: '#3a3a3a', 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round',
    }));
    g.appendChild(el('rect', { x: 48, y: 165, width: 26, height: 36, rx: 10, fill: '#ff5c8a' }));
    g.appendChild(el('rect', { x: 226, y: 165, width: 26, height: 36, rx: 10, fill: '#ff5c8a' }));
  }
  else if (a === 'flower') {
    const cx = 62, cy = 150;
    const petals = 6;
    for (let i = 0; i < petals; i++) {
      const a = (i * 360 / petals) * Math.PI / 180;
      const px = cx + Math.cos(a) * 11;
      const py = cy + Math.sin(a) * 11;
      g.appendChild(el('circle', { cx: px, cy: py, r: 7, fill: '#fff3b0' }));
    }
    g.appendChild(el('circle', { cx, cy, r: 6, fill: '#ffb347' }));
  }
  else if (a === 'halo') {
    g.appendChild(el('ellipse', {
      cx: 150, cy: 55, rx: 42, ry: 10,
      fill: 'none', stroke: '#ffd23f', 'stroke-width': 4,
    }));
    g.appendChild(el('ellipse', {
      cx: 150, cy: 55, rx: 42, ry: 10,
      fill: 'none', stroke: '#fff6c4', 'stroke-width': 1.5,
    }));
  }
}

function ensureGradientDef(name, stops) {
  const defs = document.querySelector('#poporing defs');
  const id = `grad_${name}`;
  let existing = document.getElementById(id);
  if (existing) return id;
  const grad = el('linearGradient', { id, x1: '0%', y1: '0%', x2: '0%', y2: '100%' }, [
    el('stop', { offset: '0%',   'stop-color': stops[0] }),
    el('stop', { offset: '100%', 'stop-color': stops[1] }),
  ]);
  defs.appendChild(grad);
  return id;
}

function renderBackground() {
  const rect = document.getElementById('bgRect');
  const preset = BG_PRESETS[state.bgPreset] || BG_PRESETS.solid;
  if (preset.kind === 'solid') {
    rect.setAttribute('fill', state.bgColor);
  } else {
    const id = ensureGradientDef(state.bgPreset, preset.stops);
    rect.setAttribute('fill', `url(#${id})`);
  }
}

function renderSparkles() {
  const g = document.getElementById('sparkles');
  clear(g);
  if (state.sparkles === 'none') return;
  const positions = [
    [45, 55], [258, 68], [32, 210], [272, 220], [62, 260], [240, 110],
  ];
  const n = state.sparkles === 'few' ? 3 : 6;
  const fill = isBgDark() ? '#fff6c4' : '#ffe680';
  for (let i = 0; i < n; i++) {
    const [x, y] = positions[i];
    const size = 9 + (i % 2) * 4;
    g.appendChild(el('path', {
      class: 'sparkle',
      d: sparklePath(x, y, size),
      fill,
      opacity: 0.9,
    }));
  }
}

function renderAnimation() {
  const g = document.getElementById('bobGroup');
  g.classList.remove('bob', 'wiggle', 'spin');
  if (state.animation !== 'none') g.classList.add(state.animation);
}

function renderName() {
  const t = document.getElementById('nameLabel');
  t.textContent = state.name || '';
  t.setAttribute('fill', isBgDark() ? '#ffe4f1' : '#7a3f62');
}

function renderAll() {
  renderBackground();
  renderSparkles();
  renderBody();
  renderCheeks();
  renderEyes();
  renderMouth();
  renderAccessory();
  renderAnimation();
  renderName();
}

// ----- UI construction --------------------------------------------------

function buildChips() {
  document.querySelectorAll('.chips').forEach(container => {
    const field = container.dataset.field;
    const opts = CHIP_OPTS[field] || [];
    container.innerHTML = '';
    opts.forEach(([id, label]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = label;
      b.dataset.value = id;
      b.addEventListener('click', () => {
        state[field] = id;
        if (field === 'bgPreset' && id !== 'solid') {
          // keep bgColor input as-is, but render uses gradient
        }
        updateChipActive(container, id);
        renderAll();
      });
      container.appendChild(b);
    });
    updateChipActive(container, state[field]);
  });
}

function updateChipActive(container, value) {
  container.querySelectorAll('.chip').forEach(c => {
    c.classList.toggle('active', c.dataset.value === value);
  });
}

function buildSwatches() {
  const box = document.getElementById('swatches');
  box.innerHTML = '';
  BODY_SWATCHES.forEach(color => {
    const b = document.createElement('button');
    b.type = 'button';
    b.style.background = color;
    b.title = color;
    b.addEventListener('click', () => {
      state.bodyColor = color;
      document.getElementById('bodyColor').value = color;
      renderAll();
    });
    box.appendChild(b);
  });
}

// ----- events -----------------------------------------------------------

function wireInputs() {
  document.getElementById('nameInput').addEventListener('input', e => {
    state.name = e.target.value;
    renderName();
  });
  document.getElementById('bodyColor').addEventListener('input', e => {
    state.bodyColor = e.target.value;
    renderBody();
    renderCheeks();
  });
  document.getElementById('bgColor').addEventListener('input', e => {
    state.bgColor = e.target.value;
    state.bgPreset = 'solid';
    updateChipActive(document.getElementById('bgChips'), 'solid');
    renderAll();
  });

  document.getElementById('randomBtn').addEventListener('click', randomize);
  document.getElementById('resetBtn').addEventListener('click', reset);
  document.getElementById('pngBtn').addEventListener('click', exportPNG);
  document.getElementById('jsonBtn').addEventListener('click', exportJSON);
  document.getElementById('loadJson').addEventListener('change', loadJSON);
}

function syncUIFromState() {
  document.getElementById('nameInput').value = state.name;
  document.getElementById('bodyColor').value = state.bodyColor;
  document.getElementById('bgColor').value = state.bgColor;
  document.querySelectorAll('.chips').forEach(c => {
    updateChipActive(c, state[c.dataset.field]);
  });
}

// ----- actions ----------------------------------------------------------

function randomize() {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  state.bodyColor = pick(BODY_SWATCHES);
  state.eyes = pick(CHIP_OPTS.eyes)[0];
  state.mouth = pick(CHIP_OPTS.mouth)[0];
  state.cheeks = pick(CHIP_OPTS.cheeks)[0];
  state.accessory = pick(CHIP_OPTS.accessory)[0];
  state.bgPreset = pick(CHIP_OPTS.bgPreset)[0];
  state.sparkles = pick(CHIP_OPTS.sparkles)[0];
  state.animation = pick(CHIP_OPTS.animation)[0];
  if (state.bgPreset === 'solid') {
    const bgs = ['#ffe6f2', '#e6f4ff', '#e9ffe9', '#fff4d6', '#f2e6ff'];
    state.bgColor = pick(bgs);
  }
  syncUIFromState();
  renderAll();
}

function reset() {
  Object.assign(state, DEFAULTS);
  syncUIFromState();
  renderAll();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportPNG() {
  const svg = document.getElementById('poporing');
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', SVG_NS);
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  const bob = clone.querySelector('#bobGroup');
  if (bob) bob.removeAttribute('class'); // drop animation for static export

  const svgStr = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob(
    ['<?xml version="1.0" standalone="no"?>\n', svgStr],
    { type: 'image/svg+xml;charset=utf-8' }
  );
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    canvas.toBlob(blob => {
      downloadBlob(blob, `${(state.name || 'poporing').replace(/\s+/g, '_')}.png`);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    alert('No se pudo exportar el PNG.');
  };
  img.src = url;
}

function exportJSON() {
  const data = JSON.stringify({ version: 1, ...state }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  downloadBlob(blob, `${(state.name || 'poporing').replace(/\s+/g, '_')}.json`);
}

function loadJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      // only accept known fields
      for (const k of Object.keys(DEFAULTS)) {
        if (k in data) state[k] = data[k];
      }
      syncUIFromState();
      renderAll();
    } catch (err) {
      alert('Archivo JSON inválido 😢');
    }
  };
  reader.readAsText(file);
  e.target.value = ''; // allow reloading same file
}

// ----- init -------------------------------------------------------------

function init() {
  buildSwatches();
  buildChips();
  wireInputs();
  syncUIFromState();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
