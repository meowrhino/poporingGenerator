// ========================================================================
// Poporing Maker — pixel-art with authentic RO sprite shading
// ========================================================================

const SVG_NS = 'http://www.w3.org/2000/svg';
const W = 48, H = 48;

// ── defaults & options ──────────────────────────────────────────────────

const DEFAULTS = {
  name: 'Poppy',
  bodyColor: '#a6c081',
  bodyShape: 'round',
  eyes: 'classic',
  mouth: 'smile',
  cheeks: 'none',
  accessory: 'leaf',
  effect: 'none',
  outlineStyle: 'classic',
  bgPreset: 'transparent',
  bgColor: '#f0ece4',
  animation: 'bob',
};

const BODY_SWATCHES = [
  '#a6c081', '#c8db93', '#6a9a5a',        // poporing greens
  '#f0a0b0', '#e87098', '#c85080',        // poring pinks
  '#f2c94c', '#e0a030', '#ff8a3c',        // drops yellows
  '#80c0f0', '#6090d0', '#a080e0',        // marin blue / deviling purple
  '#e0d0c0', '#505050',                   // ghostring / angeling
];

const BG_PRESETS = {
  transparent: null,
  white:   '#ffffff',
  cream:   '#f8f5f0',
  navy:    '#0d1a2a',
  sky:     '#a0d8f0',
  grass:   '#4a8c3e',
  sunset:  '#e08a5f',
  dungeon: '#2b1e3a',
  pink:    '#ffc0e0',
};

const CHIP_OPTS = {
  bodyShape: [
    ['round',  'round'],
    ['tall',   'tall'],
    ['wide',   'wide'],
    ['tiny',   'tiny'],
  ],
  eyes: [
    ['classic', 'classic'],
    ['round',   'round'],
    ['dot',     'dot'],
    ['sleepy',  'sleepy'],
    ['star',    'star'],
    ['heart',   'heart'],
    ['dead',    'KO'],
    ['angry',   'angry'],
    ['sparkle', 'sparkle'],
    ['wink',    'wink'],
  ],
  mouth: [
    ['smile',  'smile'],
    ['open',   'open'],
    ['smirk',  'smirk'],
    ['frown',  'frown'],
    ['tongue', ':P'],
    ['o',      'O'],
    ['cat',    ':3'],
    ['teeth',  'teeth'],
  ],
  cheeks: [
    ['none',     'none'],
    ['blush',    'blush'],
    ['freckles', 'freckles'],
    ['tears',    'tears'],
  ],
  accessory: [
    ['none',       'none'],
    ['leaf',       'leaf'],
    ['cherry',     'cherry'],
    ['bow',        'bow'],
    ['crown',      'crown'],
    ['witch',      'witch hat'],
    ['santa',      'santa hat'],
    ['party',      'party hat'],
    ['flower',     'flower'],
    ['halo',       'halo'],
    ['horns',      'horns'],
    ['mushroom',   'mushroom'],
    ['headphones', 'headphones'],
  ],
  effect: [
    ['none',     'none'],
    ['sparkles', 'sparkles'],
    ['hearts',   'hearts'],
    ['music',    'music'],
    ['zzz',      'zzz'],
    ['anger',    'anger'],
    ['sweat',    'sweat'],
    ['question', '?'],
  ],
  outlineStyle: [
    ['classic', 'classic'],
    ['dark',    'dark'],
    ['none',    'none'],
  ],
  bgPreset: [
    ['transparent', 'transparent'],
    ['white',       'white'],
    ['cream',       'cream'],
    ['navy',        'navy'],
    ['sky',         'sky'],
    ['grass',       'grass'],
    ['sunset',      'sunset'],
    ['dungeon',     'dungeon'],
    ['pink',        'pink'],
  ],
  animation: [
    ['none',   'none'],
    ['bob',    'bob'],
    ['wiggle', 'wiggle'],
    ['spin',   'spin'],
  ],
};

const state = { ...DEFAULTS };

// ── color utilities ─────────────────────────────────────────────────────

function hex2rgb(h) {
  const c = h.replace('#', '');
  return [parseInt(c.slice(0,2),16), parseInt(c.slice(2,4),16), parseInt(c.slice(4,6),16)];
}
function rgb2hex(r,g,b) {
  const f = v => Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0');
  return '#' + f(r) + f(g) + f(b);
}
function lighten(hex, amt) {
  const [r,g,b] = hex2rgb(hex);
  return rgb2hex(r+(255-r)*amt, g+(255-g)*amt, b+(255-b)*amt);
}
function darken(hex, amt) {
  const [r,g,b] = hex2rgb(hex);
  return rgb2hex(r*(1-amt), g*(1-amt), b*(1-amt));
}
function computeOutline(hex) {
  const [r,g,b] = hex2rgb(hex);
  return rgb2hex(r*0.95+10, g*0.75+10, b*0.8+15);
}

function palette() {
  const c = state.bodyColor;
  const ol = state.outlineStyle === 'dark' ? darken(c, 0.6)
           : state.outlineStyle === 'none' ? null
           : computeOutline(c);
  return {
    outline: ol,
    s0: darken(c, 0.32),
    s1: darken(c, 0.18),
    s2: c,
    s3: lighten(c, 0.22),
    s4: lighten(c, 0.42),
    s5: lighten(c, 0.62),
    shine: lighten(c, 0.82),
    eye:       '#1a1a22',
    eyeShine:  '#ffffff',
    heart:     '#d84050',
    mouth:     '#1a1a22',
    mouthInner:'#6a2838',
    tongue:    '#d07088',
    cheek:     '#f0a0b5',
    cheekDark: '#d88898',
    freckle:   darken(c, 0.38),
    tear:      '#80c0f0',
    tearShine: '#d0e8ff',
    leaf:      '#7ac06a',
    leafDark:  '#3d7a3a',
    cherry:    '#d83030',
    cherryShine:'#ff8080',
    stem:      '#5a3a20',
    bow:       '#e05080',
    bowDark:   '#a03060',
    bowCenter: '#f0a0c0',
    crown:     '#f0c830',
    crownDark: '#b08810',
    crownGem:  '#4080d0',
    witch:     '#4a2070',
    witchDark: '#2a1050',
    witchBand: '#f0c830',
    witchStar: '#f0e060',
    santa:     '#d03030',
    santaDark: '#a02020',
    santaWhite:'#ffffff',
    santaBall: '#ffffff',
    party:     '#40a0e0',
    partyB:    '#f06080',
    partyC:    '#f0c830',
    partyRim:  '#ffffff',
    petal:     '#ffe860',
    petalCtr:  '#e08030',
    halo:      '#f0e060',
    haloEdge:  '#c0b030',
    horn:      '#b08060',
    hornDark:  '#704830',
    mush:      '#d03030',
    mushDot:   '#ffffff',
    mushStem:  '#e8d8c0',
    hpBand:    '#333',
    hpCup:     '#e05080',
    glass:     '#1a1a22',
    effA:      '#f0e060',
    effB:      '#e05060',
    effC:      '#80c0f0',
    effD:      '#ffffff',
    shadow:    'rgba(0,0,0,0.18)',
  };
}

// ── body shape ──────────────────────────────────────────────────────────

function bodyParams() {
  switch (state.bodyShape) {
    case 'tall':  return { cx:24, cy:24, rx:14, ry:18, nT:2.0, nB:2.5 };
    case 'wide':  return { cx:24, cy:29, rx:21, ry:13, nT:2.0, nB:3.5 };
    case 'tiny':  return { cx:24, cy:32, rx:12, ry:11, nT:2.0, nB:2.8 };
    default:      return { cx:24, cy:26, rx:17, ry:16, nT:2.0, nB:3.0 };
  }
}

// ── grid generation ─────────────────────────────────────────────────────

function makeGrid() {
  const { cx, cy, rx, ry, nT, nB } = bodyParams();
  const grid = Array.from({length:H}, ()=> Array(W).fill(null));
  const clip = Math.min(cy + ry, H - 5);

  for (let y=0; y<H; y++) {
    if (y > clip) continue;
    for (let x=0; x<W; x++) {
      const dx = Math.abs((x+0.5-cx)/rx);
      const dyRaw = (y+0.5-cy)/ry;
      const n = dyRaw < 0 ? nT : nB;
      if (Math.pow(dx,n) + Math.pow(Math.abs(dyRaw),n) < 1) grid[y][x] = 1;
    }
  }

  let bL=W,bR=0,bT=H,bB=0;
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
    if (!grid[y][x]) continue;
    if (x<bL) bL=x; if (x>bR) bR=x; if (y<bT) bT=y; if (y>bB) bB=y;
  }
  const bW = Math.max(1,bR-bL), bH = Math.max(1,bB-bT);

  const out = grid.map(r=>r.slice());
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
    if (!grid[y][x]) continue;
    const nx = (x-bL)/bW, ny = (y-bT)/bH;
    const br = 1.0 - (nx*0.55 + ny*0.45);
    out[y][x] = br>0.82?'s5' : br>0.68?'s4' : br>0.54?'s3' : br>0.38?'s2' : br>0.22?'s1' : 's0';
  }

  const hlCx=cx-rx*0.28, hlCy=cy-ry*0.35, hlRx=Math.max(2,rx*0.22), hlRy=Math.max(2,ry*0.2);
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
    if (!out[y][x]) continue;
    const hx=(x+0.5-hlCx)/hlRx, hy=(y+0.5-hlCy)/hlRy;
    if (hx*hx+hy*hy < 1) out[y][x] = 'shine';
  }

  if (state.outlineStyle !== 'none') {
    for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
      if (!out[y][x]) continue;
      for (const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nx2=x+dx, ny2=y+dy;
        if (nx2<0||ny2<0||nx2>=W||ny2>=H||!grid[ny2][nx2]) { out[y][x]='outline'; break; }
      }
    }
  }

  const eyeY = Math.round(cy - ry*0.2);
  const gap  = Math.round(rx*0.3);
  return {
    grid: out, cx, cy, rx, ry, bT, bB, bL, bR,
    eyeL: { x: cx-gap-1, y: eyeY },
    eyeR: { x: cx+gap,   y: eyeY },
    mouth: { x: cx, y: Math.round(cy+ry*0.12) },
    headTop: bT,
  };
}

// ── pixel painters ──────────────────────────────────────────────────────

function px(grid,x,y,c) { if(x>=0&&y>=0&&x<W&&y<H) grid[y][x]=c; }
function pxBody(grid,x,y,c) {
  if(x>=0&&y>=0&&x<W&&y<H) {
    const v=grid[y][x];
    if(v&&v!=='outline') grid[y][x]=c;
  }
}

// ── eyes ────────────────────────────────────────────────────────────────

const EYES = {
  classic: [
    [0,0,'eye'],[1,0,'eyeShine'],
    [0,1,'eye'],[1,1,'eye'],
    [0,2,'eye'],[1,2,'eye'],
  ],
  round: [
    [0,0,'eye'],[1,0,'eye'],[2,0,'eye'],
    [0,1,'eye'],[1,1,'eye'],[2,1,'eyeShine'],
    [0,2,'eye'],[1,2,'eye'],[2,2,'eye'],
  ],
  dot: [[0,0,'eye']],
  sleepy: [[0,0,'eye'],[1,0,'eye'],[2,0,'eye'],[3,0,'eye']],
  star: [
    [1,0,'eye'],
    [0,1,'eye'],[1,1,'eye'],[2,1,'eye'],
    [1,2,'eye'],
  ],
  heart: [
    [0,0,'heart'],[2,0,'heart'],
    [0,1,'heart'],[1,1,'heart'],[2,1,'heart'],
    [1,2,'heart'],
  ],
  dead: [
    [0,0,'eye'],[2,0,'eye'],
    [1,1,'eye'],
    [0,2,'eye'],[2,2,'eye'],
  ],
  sparkle: [
    [0,0,'eye'],[1,0,'eyeShine'],[2,0,'eye'],
    [0,1,'eye'],[1,1,'eye'],[2,1,'eye'],
    [0,2,'eye'],[1,2,'eyeShine'],[2,2,'eye'],
  ],
};

const EYES_ASYM = {
  angry: {
    left:  [[2,0,'eye'],[0,1,'eye'],[1,1,'eye'],[2,1,'eye'],[0,2,'eye'],[1,2,'eye']],
    right: [[0,0,'eye'],[0,1,'eye'],[1,1,'eye'],[2,1,'eye'],[1,2,'eye'],[2,2,'eye']],
  },
  wink: {
    left:  EYES.classic,
    right: [[0,1,'eye'],[1,1,'eye'],[2,1,'eye']],
  },
};

function applyEyes(grid, info) {
  const sym = EYES[state.eyes];
  const asym = EYES_ASYM[state.eyes];
  if (!sym && !asym) return;
  const paintAt = (anchor, pxs) => {
    for (const [dx,dy,c] of pxs) px(grid, anchor.x+dx, anchor.y+dy, c);
  };
  if (asym) {
    paintAt(info.eyeL, asym.left);
    paintAt(info.eyeR, asym.right);
  } else {
    paintAt(info.eyeL, sym);
    paintAt(info.eyeR, sym);
  }
}

// ── mouth ───────────────────────────────────────────────────────────────

const MOUTHS = {
  smile:  [[-2,0,'mouth'],[-1,1,'mouth'],[0,1,'mouth'],[1,1,'mouth'],[2,0,'mouth']],
  open:   [[-1,0,'mouth'],[0,0,'mouth'],[1,0,'mouth'],
           [-1,1,'mouthInner'],[0,1,'tongue'],[1,1,'mouthInner'],
           [-1,2,'mouth'],[0,2,'mouth'],[1,2,'mouth']],
  smirk:  [[-2,1,'mouth'],[-1,0,'mouth'],[0,0,'mouth'],[1,-1,'mouth'],[2,-1,'mouth']],
  frown:  [[-2,1,'mouth'],[-1,0,'mouth'],[0,0,'mouth'],[1,0,'mouth'],[2,1,'mouth']],
  tongue: [[-2,0,'mouth'],[-1,1,'mouth'],[0,1,'mouth'],[1,1,'mouth'],[2,0,'mouth'],
           [0,2,'tongue'],[1,2,'tongue']],
  o:      [[0,0,'mouth'],[1,0,'mouth'],[0,1,'mouth'],[1,1,'mouth']],
  cat:    [[-2,0,'mouth'],[-1,1,'mouth'],[0,0,'mouth'],[1,1,'mouth'],[2,0,'mouth']],
  teeth:  [[-1,0,'mouth'],[0,0,'mouth'],[1,0,'mouth'],
           [-1,1,'eyeShine'],[0,1,'eyeShine'],[1,1,'eyeShine'],
           [-1,2,'mouth'],[0,2,'mouth'],[1,2,'mouth']],
};

function applyMouth(grid, info) {
  const def = MOUTHS[state.mouth];
  if (!def) return;
  for (const [dx,dy,c] of def) px(grid, info.mouth.x+dx, info.mouth.y+dy, c);
}

// ── cheeks ──────────────────────────────────────────────────────────────

function applyCheeks(grid, info) {
  const y = info.eyeL.y + 4;
  const spread = Math.round(info.rx * 0.55);
  if (state.cheeks === 'blush') {
    for (let d=-1;d<=1;d++) {
      pxBody(grid, info.cx-spread+d, y, 'cheek');
      pxBody(grid, info.cx+spread+d, y, 'cheek');
    }
    pxBody(grid, info.cx-spread, y+1, 'cheek');
    pxBody(grid, info.cx+spread, y+1, 'cheek');
  } else if (state.cheeks === 'freckles') {
    const pts = [[-1,0],[0,1],[1,-1]];
    for (const [dx,dy] of pts) {
      pxBody(grid, info.cx-spread+dx, y+dy, 'freckle');
      pxBody(grid, info.cx+spread+dx, y+dy, 'freckle');
    }
  } else if (state.cheeks === 'tears') {
    for (let d=0;d<4;d++) {
      px(grid, info.eyeL.x, info.eyeL.y+3+d, d<3?'tear':'tearShine');
      px(grid, info.eyeR.x+1, info.eyeR.y+3+d, d<3?'tear':'tearShine');
    }
  }
}

// ── accessories ─────────────────────────────────────────────────────────

function applyAccessory(grid, info) {
  const a = state.accessory;
  if (a==='none') return;
  const top = info.headTop;
  const cx = info.cx;

  if (a==='leaf') {
    px(grid,cx+1,top-5,'leafDark');
    px(grid,cx,top-4,'leaf'); px(grid,cx+1,top-4,'leafDark');
    px(grid,cx-1,top-3,'leaf'); px(grid,cx,top-3,'leaf'); px(grid,cx+1,top-3,'leafDark');
    px(grid,cx-1,top-2,'leaf'); px(grid,cx,top-2,'leafDark');
    px(grid,cx,top-1,'leafDark');
  }
  else if (a==='cherry') {
    px(grid,cx,top-5,'stem'); px(grid,cx+1,top-4,'stem');
    px(grid,cx+1,top-3,'cherry'); px(grid,cx+2,top-3,'cherry');
    px(grid,cx,top-2,'cherry'); px(grid,cx+1,top-2,'cherry'); px(grid,cx+2,top-2,'cherry');
    px(grid,cx+1,top-2,'cherryShine');
    px(grid,cx+1,top-1,'cherry'); px(grid,cx+2,top-1,'cherry');
  }
  else if (a==='bow') {
    const bx = cx+info.rx-3, by = top+1;
    px(grid,bx-2,by,'bow'); px(grid,bx-1,by,'bow');
    px(grid,bx-2,by+1,'bow'); px(grid,bx-1,by+1,'bowCenter'); px(grid,bx,by+1,'bowDark');
    px(grid,bx+1,by,'bow'); px(grid,bx+1,by+1,'bow');
    px(grid,bx-1,by+2,'bow'); px(grid,bx,by+2,'bow');
  }
  else if (a==='crown') {
    for (let i=-5;i<=5;i++) px(grid,cx+i,top,'crownDark');
    for (let i=-4;i<=4;i++) px(grid,cx+i,top-1,'crown');
    px(grid,cx-3,top-2,'crown'); px(grid,cx,top-2,'crown'); px(grid,cx+3,top-2,'crown');
    px(grid,cx-4,top-3,'crown'); px(grid,cx,top-3,'crown'); px(grid,cx+4,top-3,'crown');
    px(grid,cx,top-1,'crownGem'); px(grid,cx-3,top-1,'crownGem');px(grid,cx+3,top-1,'crownGem');
  }
  else if (a==='witch') {
    for (let i=-6;i<=6;i++) px(grid,cx+i,top,'witchDark');
    for (let i=-5;i<=5;i++) px(grid,cx+i,top-1,'witch');
    for (let i=-5;i<=5;i++) px(grid,cx+i,top-2,'witchBand');
    for (let i=-4;i<=4;i++) px(grid,cx+i,top-3,'witch');
    for (let i=-3;i<=3;i++) px(grid,cx+i,top-4,'witch');
    for (let i=-2;i<=2;i++) px(grid,cx+i,top-5,'witch');
    for (let i=-1;i<=1;i++) px(grid,cx+i,top-6,'witch');
    px(grid,cx,top-7,'witch');
    px(grid,cx+2,top-4,'witchStar');
  }
  else if (a==='santa') {
    for (let i=-6;i<=6;i++) px(grid,cx+i,top,'santaWhite');
    for (let i=-5;i<=5;i++) px(grid,cx+i,top-1,'santa');
    for (let i=-4;i<=4;i++) px(grid,cx+i,top-2,'santa');
    for (let i=-3;i<=3;i++) px(grid,cx+i,top-3,'santa');
    for (let i=-2;i<=2;i++) px(grid,cx+i,top-4,'santaDark');
    for (let i=-1;i<=1;i++) px(grid,cx+i,top-5,'santaDark');
    px(grid,cx,top-6,'santaDark');
    px(grid,cx+4,top-6,'santaBall'); px(grid,cx+5,top-6,'santaBall');
    px(grid,cx+4,top-5,'santaBall');
  }
  else if (a==='party') {
    for (let i=-5;i<=5;i++) px(grid,cx+i,top,'partyRim');
    for (let i=-4;i<=4;i++) px(grid,cx+i,top-1,i%2?'party':'partyB');
    for (let i=-3;i<=3;i++) px(grid,cx+i,top-2,i%2?'partyC':'party');
    for (let i=-2;i<=2;i++) px(grid,cx+i,top-3,i%2?'party':'partyB');
    for (let i=-1;i<=1;i++) px(grid,cx+i,top-4,'partyC');
    px(grid,cx,top-5,'partyRim');
  }
  else if (a==='flower') {
    const fx=cx-info.rx+2, fy=top+2;
    px(grid,fx,fy-1,'petal'); px(grid,fx+1,fy-1,'petal');
    px(grid,fx-1,fy,'petal'); px(grid,fx,fy,'petalCtr'); px(grid,fx+1,fy,'petalCtr'); px(grid,fx+2,fy,'petal');
    px(grid,fx,fy+1,'petal'); px(grid,fx+1,fy+1,'petal');
  }
  else if (a==='halo') {
    for (let i=-5;i<=5;i++) { px(grid,cx+i,top-3,'halo'); px(grid,cx+i,top-1,'halo'); }
    px(grid,cx-6,top-2,'haloEdge'); px(grid,cx+6,top-2,'haloEdge');
  }
  else if (a==='horns') {
    const hl=cx-info.rx+2, hr=cx+info.rx-3;
    px(grid,hl,top,'hornDark'); px(grid,hl+1,top,'horn');
    px(grid,hl-1,top-1,'hornDark'); px(grid,hl,top-1,'horn');
    px(grid,hl-2,top-2,'horn');
    px(grid,hr,top,'horn'); px(grid,hr+1,top,'hornDark');
    px(grid,hr+1,top-1,'horn'); px(grid,hr+2,top-1,'hornDark');
    px(grid,hr+3,top-2,'horn');
  }
  else if (a==='mushroom') {
    for (let i=-5;i<=5;i++) px(grid,cx+i,top-1,'mush');
    for (let i=-4;i<=4;i++) px(grid,cx+i,top-2,'mush');
    for (let i=-3;i<=3;i++) px(grid,cx+i,top-3,'mush');
    for (let i=-2;i<=2;i++) px(grid,cx+i,top-4,'mush');
    px(grid,cx-2,top-3,'mushDot'); px(grid,cx+1,top-2,'mushDot'); px(grid,cx+3,top-3,'mushDot');
    px(grid,cx-1,top,'mushStem'); px(grid,cx,top,'mushStem'); px(grid,cx+1,top,'mushStem');
  }
  else if (a==='headphones') {
    for (let i=-info.rx;i<=info.rx;i++) px(grid,cx+i,top-1,'hpBand');
    for (let i=-info.rx+1;i<=info.rx-1;i++) px(grid,cx+i,top-2,'hpBand');
    const ly=info.eyeL.y, ry=info.eyeR.y;
    for (let d=0;d<3;d++) {
      px(grid,info.bL-1,ly+d,'hpCup'); px(grid,info.bL-2,ly+d,'hpCup');
      px(grid,info.bR+1,ly+d,'hpCup'); px(grid,info.bR+2,ly+d,'hpCup');
    }
  }
}

// ── effects ─────────────────────────────────────────────────────────────

function applyEffects(grid, info) {
  const e = state.effect;
  if (e==='none') return;

  if (e==='sparkles') {
    const pts = [[5,6],[info.bR+3,info.headTop-2],[info.bR+5,info.headTop+8]];
    for (const [sx,sy] of pts) {
      px(grid,sx,sy-1,'effA'); px(grid,sx-1,sy,'effA'); px(grid,sx,sy,'effA');
      px(grid,sx+1,sy,'effA'); px(grid,sx,sy+1,'effA');
    }
  }
  else if (e==='hearts') {
    const draw = (sx,sy)=>{
      px(grid,sx,sy,'effB'); px(grid,sx+2,sy,'effB');
      px(grid,sx,sy+1,'effB'); px(grid,sx+1,sy+1,'effB'); px(grid,sx+2,sy+1,'effB');
      px(grid,sx+1,sy+2,'effB');
    };
    draw(info.bR+2, info.headTop-2);
    draw(4, info.headTop+2);
  }
  else if (e==='music') {
    const draw = (sx,sy)=>{
      px(grid,sx+1,sy,'effA'); px(grid,sx+1,sy+1,'effA');
      px(grid,sx+1,sy+2,'effA'); px(grid,sx,sy+2,'effA'); px(grid,sx,sy+3,'effA');
    };
    draw(info.bR+2, info.headTop-4);
    draw(info.bR+5, info.headTop);
  }
  else if (e==='zzz') {
    const draw = (sx,sy,s)=>{
      for (let i=0;i<s;i++) px(grid,sx+i,sy,'effD');
      px(grid,sx+s-1,sy+1,'effD');
      for (let i=0;i<s;i++) px(grid,sx+i,sy+2,'effD');
    };
    draw(info.bR+2, info.headTop-5, 3);
    draw(info.bR+4, info.headTop-1, 2);
  }
  else if (e==='anger') {
    const sx=info.bR-2, sy=info.headTop-1;
    px(grid,sx,sy,'effB'); px(grid,sx+2,sy,'effB');
    px(grid,sx+1,sy+1,'effB');
    px(grid,sx,sy+2,'effB'); px(grid,sx+2,sy+2,'effB');
  }
  else if (e==='sweat') {
    const sx=info.bR+1, sy=info.headTop;
    px(grid,sx,sy,'effC'); px(grid,sx,sy+1,'effC'); px(grid,sx,sy+2,'effC');
    px(grid,sx-1,sy+3,'effC'); px(grid,sx,sy+3,'effC');
  }
  else if (e==='question') {
    const sx=info.cx+2, sy=info.headTop-7;
    px(grid,sx,sy,'effD'); px(grid,sx+1,sy,'effD'); px(grid,sx+2,sy,'effD');
    px(grid,sx+2,sy+1,'effD'); px(grid,sx+1,sy+2,'effD');
    px(grid,sx+1,sy+4,'effD');
  }
}

// ── render to SVG ───────────────────────────────────────────────────────

function renderAll() {
  const info = makeGrid();
  const grid = info.grid;
  applyCheeks(grid, info);
  applyEyes(grid, info);
  applyMouth(grid, info);
  applyAccessory(grid, info);

  const effGrid = Array.from({length:H}, ()=>Array(W).fill(null));
  applyEffects(effGrid, info);

  const colors = palette();
  const layer = document.getElementById('bodyLayer');
  while (layer.firstChild) layer.removeChild(layer.firstChild);
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
    const k = grid[y][x];
    if (!k) continue;
    const color = colors[k];
    if (!color) continue;
    const r = document.createElementNS(SVG_NS,'rect');
    r.setAttribute('x',x); r.setAttribute('y',y);
    r.setAttribute('width',1); r.setAttribute('height',1);
    r.setAttribute('fill',color);
    layer.appendChild(r);
  }

  const effLayer = document.getElementById('effectLayer');
  while (effLayer.firstChild) effLayer.removeChild(effLayer.firstChild);
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
    const k = effGrid[y][x];
    if (!k) continue;
    const color = colors[k];
    if (!color) continue;
    const r = document.createElementNS(SVG_NS,'rect');
    r.setAttribute('x',x); r.setAttribute('y',y);
    r.setAttribute('width',1); r.setAttribute('height',1);
    r.setAttribute('fill',color);
    effLayer.appendChild(r);
  }

  // ground shadow
  const sl = document.getElementById('shadowLayer');
  while (sl.firstChild) sl.removeChild(sl.firstChild);
  const shCx=info.cx, shCy=info.bB+3, shRx=Math.round(info.rx*0.7), shRy=1.5;
  for (let y=shCy-2;y<=shCy+2;y++) for (let x=0;x<W;x++) {
    const dx=(x+0.5-shCx)/shRx, dy=(y+0.5-shCy)/shRy;
    if (dx*dx+dy*dy<1) {
      const r = document.createElementNS(SVG_NS,'rect');
      r.setAttribute('x',x); r.setAttribute('y',y);
      r.setAttribute('width',1); r.setAttribute('height',1);
      r.setAttribute('fill',colors.shadow);
      sl.appendChild(r);
    }
  }

  // bg
  const bgRect = document.getElementById('bgRect');
  if (state.bgPreset==='transparent') {
    bgRect.setAttribute('fill','url(#checker)');
  } else if (state.bgPreset==='solid') {
    bgRect.setAttribute('fill',state.bgColor);
  } else {
    bgRect.setAttribute('fill', BG_PRESETS[state.bgPreset] || state.bgColor);
  }

  // animation
  const bob = document.getElementById('bobGroup');
  bob.classList.remove('bob','wiggle','spin');
  if (state.animation!=='none') bob.classList.add(state.animation);

  // name
  document.getElementById('nameInput').value = state.name;
}

// ── UI ──────────────────────────────────────────────────────────────────

function buildChips() {
  document.querySelectorAll('.chips').forEach(c => {
    const field = c.dataset.field;
    const opts = CHIP_OPTS[field]||[];
    c.innerHTML = '';
    opts.forEach(([id,label])=>{
      const b = document.createElement('button');
      b.type='button'; b.className='chip'; b.textContent=label; b.dataset.value=id;
      b.addEventListener('click', ()=>{ state[field]=id; markActive(c,id); renderAll(); });
      c.appendChild(b);
    });
    markActive(c, state[field]);
  });
}
function markActive(c,v) {
  c.querySelectorAll('.chip').forEach(b=>b.classList.toggle('active',b.dataset.value===v));
}

function buildSwatches() {
  const box = document.getElementById('swatches');
  box.innerHTML='';
  BODY_SWATCHES.forEach(color=>{
    const b = document.createElement('button');
    b.type='button'; b.style.background=color; b.title=color;
    b.addEventListener('click',()=>{ state.bodyColor=color; document.getElementById('bodyColor').value=color; renderAll(); });
    box.appendChild(b);
  });
}

function wireTabs() {
  document.querySelectorAll('.tab').forEach(t=>{
    t.addEventListener('click',()=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(x=>x.classList.add('hidden'));
      t.classList.add('active');
      document.getElementById('panel-'+t.dataset.tab).classList.remove('hidden');
    });
  });
}

function wireInputs() {
  document.getElementById('nameInput').addEventListener('input', e=>{ state.name=e.target.value; });
  document.getElementById('bodyColor').addEventListener('input', e=>{ state.bodyColor=e.target.value; renderAll(); });
  document.getElementById('bgColor').addEventListener('input', e=>{
    state.bgColor=e.target.value; state.bgPreset='solid';
    const c=document.querySelector('[data-field="bgPreset"]');
    if(c) markActive(c,'solid');
    renderAll();
  });
  document.getElementById('randomBtn').addEventListener('click', randomize);
  document.getElementById('resetBtn').addEventListener('click', reset);
  document.getElementById('pngBtn').addEventListener('click', exportPNG);
  document.getElementById('jsonBtn').addEventListener('click', exportJSON);
  document.getElementById('loadJson').addEventListener('change', loadJSON);
}

// ── actions ─────────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

function randomize() {
  state.bodyColor = pick(BODY_SWATCHES);
  for (const k of Object.keys(CHIP_OPTS)) state[k] = pick(CHIP_OPTS[k])[0];
  if (state.bgPreset==='solid') state.bgColor = pick(['#f0ece4','#0d1a2a','#a0d8f0','#ffc0e0']);
  document.getElementById('bodyColor').value = state.bodyColor;
  document.querySelectorAll('.chips').forEach(c=>markActive(c,state[c.dataset.field]));
  renderAll();
}

function reset() {
  Object.assign(state, DEFAULTS);
  document.getElementById('bodyColor').value = state.bodyColor;
  document.getElementById('bgColor').value = state.bgColor;
  document.querySelectorAll('.chips').forEach(c=>markActive(c,state[c.dataset.field]));
  renderAll();
}

function downloadBlob(blob,name) {
  const url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}

function exportPNG() {
  const svg = document.getElementById('poporing');
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns',SVG_NS);
  clone.setAttribute('width',W); clone.setAttribute('height',H);
  const bob = clone.querySelector('#bobGroup');
  if (bob) bob.removeAttribute('class');
  if (state.bgPreset==='transparent') {
    clone.querySelector('#bgRect').setAttribute('fill','none');
  }
  const str = new XMLSerializer().serializeToString(clone);
  const blob = new Blob(['<?xml version="1.0"?>\n',str],{type:'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = ()=>{
    const nat = document.createElement('canvas');
    nat.width=W; nat.height=H;
    const nc = nat.getContext('2d');
    nc.imageSmoothingEnabled=false;
    nc.drawImage(img,0,0,W,H);
    const SIZE=768;
    const out = document.createElement('canvas');
    out.width=SIZE; out.height=SIZE;
    const oc = out.getContext('2d');
    oc.imageSmoothingEnabled=false;
    oc.drawImage(nat,0,0,SIZE,SIZE);
    out.toBlob(b=>{ downloadBlob(b,`${(state.name||'poporing').replace(/\s+/g,'_')}.png`); URL.revokeObjectURL(url); },'image/png');
  };
  img.onerror = ()=>{ URL.revokeObjectURL(url); alert('Export failed'); };
  img.src = url;
}

function exportJSON() {
  const data = JSON.stringify({version:3,...state},null,2);
  downloadBlob(new Blob([data],{type:'application/json'}), `${(state.name||'poporing').replace(/\s+/g,'_')}.json`);
}

function loadJSON(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = ()=>{
    try {
      const d = JSON.parse(r.result);
      for (const k of Object.keys(DEFAULTS)) if (k in d) state[k]=d[k];
      document.getElementById('bodyColor').value=state.bodyColor;
      document.getElementById('bgColor').value=state.bgColor;
      document.querySelectorAll('.chips').forEach(c=>markActive(c,state[c.dataset.field]));
      renderAll();
    } catch(err) { alert('Invalid JSON'); }
  };
  r.readAsText(f);
  e.target.value='';
}

// ── init ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', ()=>{
  buildSwatches();
  buildChips();
  wireTabs();
  wireInputs();
  renderAll();
});
