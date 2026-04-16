// ========================================================================
// Poporing Generator — pixel-art edition (iW Database retro tribute)
// ========================================================================

const SVG_NS = 'http://www.w3.org/2000/svg';
const W = 40, H = 40;

// eye + mouth anchors (in pixel grid coords)
const EYE_L = { x: 14, y: 22 };
const EYE_R = { x: 25, y: 22 };
const MOUTH = { x: 20, y: 27 };

// body shape params
const BODY_CX = 20, BODY_CY = 25;
const BODY_RX = 13, BODY_RY = 10;

const DEFAULTS = {
  name: 'Poppy',
  bodyColor: '#8fbc4a',   // classic poporing green
  eyes: 'round',
  mouth: 'smile',
  cheeks: 'none',
  accessory: 'leaf',
  bgColor: '#0d1a2a',
  bgPreset: 'navy',
  animation: 'bob',
};

const BODY_SWATCHES = [
  '#8fbc4a', '#bee870', '#5a7d2a',   // poporing greens
  '#ff8ac9', '#f05f8f',              // poring pink (!)
  '#f2c94c', '#ff9a3c',              // yellow / orange (drops, santa)
  '#5ec8f0', '#8e7dff',              // blue / lavender
  '#cfcfcf', '#3a3a3a',              // ghost / angeling
];

const BG_PRESETS = {
  solid:   null,
  navy:    '#0d1a2a',  // classic wiki bg
  sky:     '#87ceeb',
  prontera:'#2a6b4e',  // grass
  desert:  '#d6b57a',  // morocc
  dungeon: '#2b1e3a',
  sunset:  '#e08a5f',
  pink:    '#ffc0e0',
};

const CHIP_OPTS = {
  eyes: [
    ['round',  'round'],
    ['dot',    'dot'],
    ['sleepy', 'sleepy'],
    ['star',   'star'],
    ['heart',  'heart'],
    ['dead',   'KO'],
    ['angry',  'angry'],
    ['sparkle','sparkle'],
  ],
  mouth: [
    ['smile',  'smile'],
    ['open',   'open'],
    ['smirk',  'smirk'],
    ['frown',  'frown'],
    ['tongue', ':P'],
    ['o',      'O'],
    ['cat',    ':3'],
  ],
  cheeks: [
    ['none',    'none'],
    ['blush',   'blush'],
    ['freckles','freckles'],
  ],
  accessory: [
    ['none',       'none'],
    ['leaf',       'leaf'],
    ['bow',        'bow'],
    ['crown',      'crown'],
    ['witch',      'witch hat'],
    ['party',      'party hat'],
    ['glasses',    'glasses'],
    ['headphones', 'headphones'],
    ['flower',     'flower'],
    ['halo',       'halo'],
    ['horn',       'horn'],
  ],
  bgPreset: [
    ['solid',    'custom'],
    ['navy',     'navy'],
    ['sky',      'sky'],
    ['prontera', 'prontera'],
    ['desert',   'desert'],
    ['dungeon',  'dungeon'],
    ['sunset',   'sunset'],
    ['pink',     'pink'],
  ],
  animation: [
    ['none',   'none'],
    ['bob',    'bob'],
    ['wiggle', 'wiggle'],
    ['spin',   'spin'],
  ],
};

const state = { ...DEFAULTS };

// ---------- color utilities -------------------------------------------

function hex2rgb(h) {
  const c = h.replace('#', '');
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
  ];
}
function rgb2hex(r, g, b) {
  const h = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}
function lighten(hex, amt) {
  const [r, g, b] = hex2rgb(hex);
  return rgb2hex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}
function darken(hex, amt) {
  const [r, g, b] = hex2rgb(hex);
  return rgb2hex(r * (1 - amt), g * (1 - amt), b * (1 - amt));
}
function isDark(hex) {
  const [r, g, b] = hex2rgb(hex);
  return (r * 0.299 + g * 0.587 + b * 0.114) < 120;
}

function palette() {
  const c = state.bodyColor;
  return {
    body:      c,
    highlight: lighten(c, 0.38),
    shadow:    darken(c, 0.25),
    outline:   darken(c, 0.58),
    eye:       '#1a1a22',
    eyeShine:  '#ffffff',
    heart:     '#e63a4d',
    mouth:     '#1a1a22',
    tongue:    '#ff6b8e',
    cheek:     '#ff9fb5',
    freckle:   darken(c, 0.4),
    leaf:      '#8fd672',
    leafDark:  '#3d8b47',
    bow:       '#d94080',
    bowDark:   '#8a2a5c',
    crown:     '#ffd23f',
    crownDark: '#a67a0a',
    witch:     '#3a1a5c',
    witchBand: '#ffd23f',
    party:     '#ff5c8a',
    partyAlt:  '#ffd23f',
    partyRim:  '#ffffff',
    glass:     '#1a1a22',
    hpBand:    '#2a2a2a',
    hpCup:     '#d94080',
    petal:     '#ffe066',
    petalCtr:  '#ff8a3c',
    halo:      '#ffe066',
    horn:      '#c9a66b',
    hornDark:  '#7a5a2c',
    groundShadow: 'rgba(0,0,0,0.38)',
  };
}

// ---------- grid generator --------------------------------------------

function makeGrid() {
  const grid = Array.from({ length: H }, () => Array(W).fill(null));

  // filled body — squashed oval, slightly flatter at bottom
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x + 0.5 - BODY_CX) / BODY_RX;
      const dyFactor = y > BODY_CY ? BODY_RY * 0.98 : BODY_RY;
      const dy = (y + 0.5 - BODY_CY) / dyFactor;
      if (dx * dx + dy * dy < 1.0) grid[y][x] = 'body';
    }
  }

  // bottom flatten: chop a tiny row below y=34
  for (let y = 34; y < H; y++) {
    for (let x = 0; x < W; x++) grid[y][x] = null;
  }

  // shading: lower half of body becomes shadow
  for (let y = BODY_CY + 3; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x] === 'body') grid[y][x] = 'shadow';
    }
  }

  // highlight zone: small ellipse upper-left
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!grid[y][x] || grid[y][x] === 'shadow') continue;
      const hx = (x + 0.5 - 14) / 3.2;
      const hy = (y + 0.5 - 19) / 2.2;
      if (hx * hx + hy * hy < 1) grid[y][x] = 'highlight';
    }
  }

  // outline: any filled pixel adjacent to empty (4-neighborhood)
  const out = grid.map(r => r.slice());
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!grid[y][x]) continue;
      let edge = false;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || !grid[ny][nx]) {
          edge = true; break;
        }
      }
      if (edge) out[y][x] = 'outline';
    }
  }
  return out;
}

// ---------- paint helpers ---------------------------------------------

function paint(grid, x, y, kind) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  grid[y][x] = kind;
}

function paintIfBody(grid, x, y, kind) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const cur = grid[y][x];
  if (cur === 'body' || cur === 'highlight' || cur === 'shadow') grid[y][x] = kind;
}

// ---------- feature painters ------------------------------------------

function applyEyes(grid) {
  const pair = (fn) => { fn(EYE_L.x, EYE_L.y, false); fn(EYE_R.x, EYE_R.y, true); };

  switch (state.eyes) {
    case 'round':
      pair((x, y) => {
        paint(grid, x,     y,     'eye');
        paint(grid, x + 1, y,     'eye');
        paint(grid, x,     y + 1, 'eye');
        paint(grid, x + 1, y + 1, 'eye');
        paint(grid, x + 1, y,     'eyeShine');
      });
      break;
    case 'dot':
      pair((x, y) => paint(grid, x, y, 'eye'));
      break;
    case 'sleepy':
      pair((x, y) => {
        paint(grid, x - 1, y,     'eye');
        paint(grid, x,     y,     'eye');
        paint(grid, x + 1, y,     'eye');
        paint(grid, x + 2, y,     'eye');
        paint(grid, x,     y - 1, 'eye');
        paint(grid, x + 1, y - 1, 'eye');
      });
      break;
    case 'star':
      pair((x, y) => {
        paint(grid, x,     y - 1, 'eye');
        paint(grid, x - 1, y,     'eye');
        paint(grid, x,     y,     'eye');
        paint(grid, x + 1, y,     'eye');
        paint(grid, x,     y + 1, 'eye');
      });
      break;
    case 'heart':
      pair((x, y) => {
        paint(grid, x - 1, y,     'heart');
        paint(grid, x,     y,     'heart');
        paint(grid, x + 1, y,     'heart');
        paint(grid, x + 2, y,     'heart');
        paint(grid, x,     y + 1, 'heart');
        paint(grid, x + 1, y + 1, 'heart');
        paint(grid, x,     y + 2, 'heart');
      });
      break;
    case 'dead':
      pair((x, y) => {
        paint(grid, x - 1, y - 1, 'eye');
        paint(grid, x + 1, y - 1, 'eye');
        paint(grid, x,     y,     'eye');
        paint(grid, x - 1, y + 1, 'eye');
        paint(grid, x + 1, y + 1, 'eye');
      });
      break;
    case 'angry':
      pair((x, y, right) => {
        if (!right) {
          paint(grid, x - 1, y - 1, 'eye');
          paint(grid, x,     y,     'eye');
          paint(grid, x + 1, y,     'eye');
          paint(grid, x,     y + 1, 'eye');
        } else {
          paint(grid, x + 1, y - 1, 'eye');
          paint(grid, x,     y,     'eye');
          paint(grid, x - 1, y,     'eye');
          paint(grid, x,     y + 1, 'eye');
        }
      });
      break;
    case 'sparkle':
      pair((x, y) => {
        paint(grid, x,     y,     'eye');
        paint(grid, x + 1, y,     'eye');
        paint(grid, x,     y + 1, 'eye');
        paint(grid, x + 1, y + 1, 'eye');
        paint(grid, x + 1, y,     'eyeShine');
        paint(grid, x,     y + 1, 'eyeShine');
      });
      break;
  }
}

function applyMouth(grid) {
  const { x: cx, y: cy } = MOUTH;
  switch (state.mouth) {
    case 'smile':
      paint(grid, cx - 2, cy,     'mouth');
      paint(grid, cx - 1, cy + 1, 'mouth');
      paint(grid, cx,     cy + 1, 'mouth');
      paint(grid, cx + 1, cy + 1, 'mouth');
      paint(grid, cx + 2, cy,     'mouth');
      break;
    case 'open':
      paint(grid, cx - 1, cy,     'mouth');
      paint(grid, cx,     cy,     'mouth');
      paint(grid, cx + 1, cy,     'mouth');
      paint(grid, cx - 1, cy + 1, 'mouth');
      paint(grid, cx,     cy + 1, 'mouth');
      paint(grid, cx + 1, cy + 1, 'mouth');
      break;
    case 'smirk':
      paint(grid, cx - 2, cy + 1, 'mouth');
      paint(grid, cx - 1, cy + 1, 'mouth');
      paint(grid, cx,     cy,     'mouth');
      paint(grid, cx + 1, cy,     'mouth');
      paint(grid, cx + 2, cy - 1, 'mouth');
      break;
    case 'frown':
      paint(grid, cx - 2, cy + 1, 'mouth');
      paint(grid, cx - 1, cy,     'mouth');
      paint(grid, cx,     cy,     'mouth');
      paint(grid, cx + 1, cy,     'mouth');
      paint(grid, cx + 2, cy + 1, 'mouth');
      break;
    case 'tongue':
      paint(grid, cx - 2, cy,     'mouth');
      paint(grid, cx - 1, cy + 1, 'mouth');
      paint(grid, cx,     cy + 1, 'mouth');
      paint(grid, cx + 1, cy + 1, 'mouth');
      paint(grid, cx + 2, cy,     'mouth');
      paint(grid, cx,     cy + 2, 'tongue');
      paint(grid, cx + 1, cy + 2, 'tongue');
      break;
    case 'o':
      paint(grid, cx,     cy,     'mouth');
      paint(grid, cx + 1, cy,     'mouth');
      paint(grid, cx,     cy + 1, 'mouth');
      paint(grid, cx + 1, cy + 1, 'mouth');
      break;
    case 'cat':
      paint(grid, cx - 2, cy,     'mouth');
      paint(grid, cx - 1, cy + 1, 'mouth');
      paint(grid, cx,     cy,     'mouth');
      paint(grid, cx + 1, cy + 1, 'mouth');
      paint(grid, cx + 2, cy,     'mouth');
      break;
  }
}

function applyCheeks(grid) {
  if (state.cheeks === 'blush') {
    [9, 10, 11].forEach(x => paintIfBody(grid, x, 25, 'cheek'));
    [28, 29, 30].forEach(x => paintIfBody(grid, x, 25, 'cheek'));
  } else if (state.cheeks === 'freckles') {
    [[10, 24], [9, 25], [11, 26], [28, 24], [30, 25], [29, 26]]
      .forEach(([x, y]) => paintIfBody(grid, x, y, 'freckle'));
  }
}

function applyAccessory(grid) {
  const a = state.accessory;
  if (a === 'none') return;

  if (a === 'leaf') {
    // small sprout, 4 pixels tall, curves right
    paint(grid, 20, 13, 'leafDark');
    paint(grid, 19, 13, 'leaf');
    paint(grid, 19, 12, 'leaf');
    paint(grid, 20, 12, 'leafDark');
    paint(grid, 20, 11, 'leafDark');
    paint(grid, 21, 11, 'leaf');
    paint(grid, 21, 10, 'leafDark');
  }
  else if (a === 'bow') {
    // bow on the right-top
    paint(grid, 26, 13, 'bow'); paint(grid, 27, 13, 'bow');
    paint(grid, 25, 14, 'bow'); paint(grid, 26, 14, 'bowDark'); paint(grid, 27, 14, 'bow');
    paint(grid, 28, 14, 'bow');
    paint(grid, 26, 15, 'bow'); paint(grid, 27, 15, 'bow');
  }
  else if (a === 'crown') {
    // zigzag + band on top of head
    paint(grid, 14, 12, 'crown');
    paint(grid, 15, 13, 'crown');
    paint(grid, 16, 12, 'crown');
    paint(grid, 17, 13, 'crown');
    paint(grid, 18, 11, 'crown');
    paint(grid, 19, 13, 'crown');
    paint(grid, 20, 12, 'crown');
    paint(grid, 21, 13, 'crown');
    paint(grid, 22, 11, 'crown');
    paint(grid, 23, 13, 'crown');
    paint(grid, 24, 12, 'crown');
    paint(grid, 25, 13, 'crown');
    paint(grid, 26, 12, 'crown');
    for (let x = 14; x <= 26; x++) paint(grid, x, 14, 'crownDark');
  }
  else if (a === 'witch') {
    // pointy purple hat
    paint(grid, 20, 6, 'witch');
    paint(grid, 19, 7, 'witch'); paint(grid, 20, 7, 'witch'); paint(grid, 21, 7, 'witch');
    paint(grid, 19, 8, 'witch'); paint(grid, 20, 8, 'witch'); paint(grid, 21, 8, 'witch');
    paint(grid, 18, 9, 'witch'); paint(grid, 19, 9, 'witch'); paint(grid, 20, 9, 'witch'); paint(grid, 21, 9, 'witch'); paint(grid, 22, 9, 'witch');
    paint(grid, 17, 10, 'witch'); paint(grid, 18, 10, 'witch'); paint(grid, 19, 10, 'witch'); paint(grid, 20, 10, 'witch'); paint(grid, 21, 10, 'witch'); paint(grid, 22, 10, 'witch'); paint(grid, 23, 10, 'witch');
    for (let x = 16; x <= 24; x++) paint(grid, x, 11, 'witchBand');
    for (let x = 14; x <= 26; x++) paint(grid, x, 12, 'witch');
    for (let x = 14; x <= 26; x++) paint(grid, x, 13, 'witch');
    // tiny star
    paint(grid, 22, 8, 'crown');
  }
  else if (a === 'party') {
    // striped cone
    paint(grid, 20, 6, 'partyRim');
    paint(grid, 19, 7, 'party'); paint(grid, 20, 7, 'party'); paint(grid, 21, 7, 'party');
    paint(grid, 18, 8, 'partyAlt'); paint(grid, 19, 8, 'partyAlt'); paint(grid, 20, 8, 'partyAlt'); paint(grid, 21, 8, 'partyAlt'); paint(grid, 22, 8, 'partyAlt');
    paint(grid, 17, 9, 'party'); paint(grid, 18, 9, 'party'); paint(grid, 19, 9, 'party'); paint(grid, 20, 9, 'party'); paint(grid, 21, 9, 'party'); paint(grid, 22, 9, 'party'); paint(grid, 23, 9, 'party');
    paint(grid, 16, 10, 'partyAlt'); paint(grid, 17, 10, 'partyAlt'); paint(grid, 18, 10, 'partyAlt'); paint(grid, 19, 10, 'partyAlt'); paint(grid, 20, 10, 'partyAlt'); paint(grid, 21, 10, 'partyAlt'); paint(grid, 22, 10, 'partyAlt'); paint(grid, 23, 10, 'partyAlt'); paint(grid, 24, 10, 'partyAlt');
    for (let x = 15; x <= 25; x++) paint(grid, x, 11, 'party');
    for (let x = 14; x <= 26; x++) paint(grid, x, 12, 'partyRim');
  }
  else if (a === 'glasses') {
    const { x: lx, y: ly } = EYE_L;
    const { x: rx, y: ry } = EYE_R;
    // left frame (square ring around 2x2 eye)
    paint(grid, lx - 1, ly - 1, 'glass'); paint(grid, lx, ly - 1, 'glass'); paint(grid, lx + 1, ly - 1, 'glass'); paint(grid, lx + 2, ly - 1, 'glass');
    paint(grid, lx - 1, ly,     'glass'); paint(grid, lx + 2, ly,     'glass');
    paint(grid, lx - 1, ly + 1, 'glass'); paint(grid, lx + 2, ly + 1, 'glass');
    paint(grid, lx - 1, ly + 2, 'glass'); paint(grid, lx, ly + 2, 'glass'); paint(grid, lx + 1, ly + 2, 'glass'); paint(grid, lx + 2, ly + 2, 'glass');
    // right frame
    paint(grid, rx - 1, ry - 1, 'glass'); paint(grid, rx, ry - 1, 'glass'); paint(grid, rx + 1, ry - 1, 'glass'); paint(grid, rx + 2, ry - 1, 'glass');
    paint(grid, rx - 1, ry,     'glass'); paint(grid, rx + 2, ry,     'glass');
    paint(grid, rx - 1, ry + 1, 'glass'); paint(grid, rx + 2, ry + 1, 'glass');
    paint(grid, rx - 1, ry + 2, 'glass'); paint(grid, rx, ry + 2, 'glass'); paint(grid, rx + 1, ry + 2, 'glass'); paint(grid, rx + 2, ry + 2, 'glass');
    // bridge
    paint(grid, lx + 3, ly, 'glass');
    paint(grid, lx + 4, ly, 'glass');
  }
  else if (a === 'headphones') {
    // arch band
    for (let x = 10; x <= 30; x++) paint(grid, x, 13, 'hpBand');
    for (let x = 11; x <= 29; x++) paint(grid, x, 12, 'hpBand');
    paint(grid, 9, 14, 'hpBand'); paint(grid, 31, 14, 'hpBand');
    // ear cups
    for (let y = 18; y <= 21; y++) {
      paint(grid, 7, y, 'hpCup');
      paint(grid, 8, y, 'hpCup');
      paint(grid, 32, y, 'hpCup');
      paint(grid, 33, y, 'hpCup');
    }
  }
  else if (a === 'flower') {
    // small flower floating left-top of head
    paint(grid, 9, 14, 'petal'); paint(grid, 10, 14, 'petal');
    paint(grid, 8, 15, 'petal'); paint(grid, 9, 15, 'petalCtr'); paint(grid, 10, 15, 'petal');
    paint(grid, 9, 16, 'petal'); paint(grid, 10, 16, 'petal');
  }
  else if (a === 'halo') {
    // horizontal oval above head
    for (let x = 15; x <= 25; x++) paint(grid, x, 10, 'halo');
    paint(grid, 14, 11, 'halo'); paint(grid, 26, 11, 'halo');
    for (let x = 15; x <= 25; x++) paint(grid, x, 12, 'halo');
    // hollow center
    for (let x = 16; x <= 24; x++) paint(grid, x, 11, null);
  }
  else if (a === 'horn') {
    // single devilish horn on right-top
    paint(grid, 23, 11, 'horn');
    paint(grid, 24, 11, 'hornDark');
    paint(grid, 24, 12, 'horn');
    paint(grid, 25, 12, 'hornDark');
    paint(grid, 25, 13, 'horn');
  }
}

// ---------- render to SVG ---------------------------------------------

function renderGrid() {
  const grid = makeGrid();
  applyCheeks(grid);
  applyEyes(grid);
  applyMouth(grid);
  applyAccessory(grid);

  const layer = document.getElementById('bodyLayer');
  while (layer.firstChild) layer.removeChild(layer.firstChild);
  const colors = palette();

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const k = grid[y][x];
      if (!k) continue;
      const color = colors[k];
      if (!color) continue;
      const r = document.createElementNS(SVG_NS, 'rect');
      r.setAttribute('x', x);
      r.setAttribute('y', y);
      r.setAttribute('width', 1);
      r.setAttribute('height', 1);
      r.setAttribute('fill', color);
      layer.appendChild(r);
    }
  }
}

function renderGroundShadow() {
  const layer = document.getElementById('shadowLayer');
  while (layer.firstChild) layer.removeChild(layer.firstChild);
  const color = palette().groundShadow;
  // elongated horizontal ellipse at y=35
  const cx = 20, cy = 35, rx = 11, ry = 1.3;
  for (let y = 34; y <= 37; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy < 1) {
        const r = document.createElementNS(SVG_NS, 'rect');
        r.setAttribute('x', x);
        r.setAttribute('y', y);
        r.setAttribute('width', 1);
        r.setAttribute('height', 1);
        r.setAttribute('fill', color);
        layer.appendChild(r);
      }
    }
  }
}

function renderBackground() {
  const rect = document.getElementById('bgRect');
  if (state.bgPreset === 'solid') {
    rect.setAttribute('fill', state.bgColor);
  } else {
    rect.setAttribute('fill', BG_PRESETS[state.bgPreset] || state.bgColor);
  }
}

function renderAnimation() {
  const g = document.getElementById('bobGroup');
  g.classList.remove('bob', 'wiggle', 'spin');
  if (state.animation !== 'none') g.classList.add(state.animation);
}

function renderName() {
  const n = state.name || '';
  document.getElementById('nameLabel').textContent = n;
  document.getElementById('statName').textContent = n;
}

function renderStats() {
  // flavor stats derived deterministically from body color + name
  const seed = (state.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
             + hex2rgb(state.bodyColor).reduce((a, b) => a + b, 0);
  const rnd = (min, max) => min + (seed * 7 % (max - min + 1));
  document.getElementById('statLevel').textContent = 20 + (seed % 40);
  document.getElementById('statHp').textContent   = 300 + (seed * 3 % 700);
  document.getElementById('statExp').textContent  = (150 + seed % 250) + ' / ' + (180 + seed % 300);
  const elements = ['Poison 1', 'Earth 1', 'Neutral 1', 'Holy 1', 'Dark 1', 'Fire 1', 'Water 1'];
  document.getElementById('statElement').textContent = elements[seed % elements.length];
}

function renderAll() {
  renderBackground();
  renderGroundShadow();
  renderGrid();
  renderAnimation();
  renderName();
  renderStats();
}

// ---------- UI --------------------------------------------------------

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
        updateActive(container, id);
        renderAll();
      });
      container.appendChild(b);
    });
    updateActive(container, state[field]);
  });
}

function updateActive(container, value) {
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

function wireInputs() {
  document.getElementById('nameInput').addEventListener('input', e => {
    state.name = e.target.value;
    renderName();
    renderStats();
  });
  document.getElementById('bodyColor').addEventListener('input', e => {
    state.bodyColor = e.target.value;
    renderAll();
  });
  document.getElementById('bgColor').addEventListener('input', e => {
    state.bgColor = e.target.value;
    state.bgPreset = 'solid';
    updateActive(document.getElementById('bgChips'), 'solid');
    renderBackground();
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
    updateActive(c, state[c.dataset.field]);
  });
}

// ---------- actions ---------------------------------------------------

function randomize() {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  state.bodyColor = pick(BODY_SWATCHES);
  state.eyes = pick(CHIP_OPTS.eyes)[0];
  state.mouth = pick(CHIP_OPTS.mouth)[0];
  state.cheeks = pick(CHIP_OPTS.cheeks)[0];
  state.accessory = pick(CHIP_OPTS.accessory)[0];
  state.bgPreset = pick(CHIP_OPTS.bgPreset)[0];
  state.animation = pick(CHIP_OPTS.animation)[0];
  if (state.bgPreset === 'solid') {
    state.bgColor = pick(['#0d1a2a', '#15263c', '#2b1e3a', '#2a6b4e', '#d6b57a']);
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
  clone.setAttribute('width', W);
  clone.setAttribute('height', H);
  const bob = clone.querySelector('#bobGroup');
  if (bob) bob.removeAttribute('class');

  const svgStr = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob(
    ['<?xml version="1.0" standalone="no"?>\n', svgStr],
    { type: 'image/svg+xml;charset=utf-8' }
  );
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    // render to small native canvas first, then scale up pixel-perfect
    const native = document.createElement('canvas');
    native.width = W;
    native.height = H;
    const nctx = native.getContext('2d');
    nctx.imageSmoothingEnabled = false;
    nctx.drawImage(img, 0, 0, W, H);

    const SIZE = 640; // 16x scale
    const out = document.createElement('canvas');
    out.width = SIZE;
    out.height = SIZE;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = false;
    octx.drawImage(native, 0, 0, SIZE, SIZE);

    out.toBlob(blob => {
      downloadBlob(blob, `${(state.name || 'poporing').replace(/\s+/g, '_')}.png`);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    alert('PNG export failed.');
  };
  img.src = url;
}

function exportJSON() {
  const data = JSON.stringify({ version: 2, ...state }, null, 2);
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
      for (const k of Object.keys(DEFAULTS)) {
        if (k in data) state[k] = data[k];
      }
      syncUIFromState();
      renderAll();
    } catch (err) {
      alert('Invalid JSON file.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ---------- init ------------------------------------------------------

function init() {
  buildSwatches();
  buildChips();
  wireInputs();
  syncUIFromState();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
