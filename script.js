// ========================================================================
// Poporing Maker — chunky 8-bit pixel art + RPG menu UI
// ========================================================================

const SVG_NS = 'http://www.w3.org/2000/svg';
const W = 32, H = 32;

// ── state ───────────────────────────────────────────────────────────────

const DEFAULTS = {
  name: 'Poppy',
  bodyColor: '#a6c081',
  bodyShape: 'round',
  bodyTexture: 'normal',
  eyes: 'classic',
  mouth: 'smile',
  cheeks: 'none',
  headTop: 'leaf',
  headwear: 'none',
  wings: 'none',
  effect: 'none',
  outlineStyle: 'classic',
  bgPreset: 'transparent',
  bgColor: '#181830',
  animation: 'bob',
};

const state = { ...DEFAULTS };

// ── options ─────────────────────────────────────────────────────────────

const BODY_SWATCHES = [
  '#a6c081','#6a9a5a','#d4e8a0',
  '#f0a0b0','#e06888','#c04870',
  '#f2c94c','#e0a030','#ff8a3c',
  '#80c0f0','#5090d0','#a080e0',
  '#f0e8d8','#a0a0b8','#505060',
];

const BG_PRESETS = {
  transparent:null, white:'#f0f0f0', navy:'#0a0e27',
  sky:'#88c8e8', grass:'#306828', sunset:'#d07848',
  dungeon:'#201030', pink:'#e8a0c0',
};

const PRESETS = {
  Poporing:  {bodyColor:'#a6c081',headTop:'leaf',  headwear:'none',wings:'none',eyes:'classic',mouth:'smile',bodyTexture:'normal'},
  Poring:    {bodyColor:'#f0a0b0',headTop:'droplet',headwear:'none',wings:'none',eyes:'round', mouth:'smile',bodyTexture:'normal'},
  Drops:     {bodyColor:'#f2c94c',headTop:'spike', headwear:'none',wings:'none',eyes:'classic',mouth:'smile',bodyTexture:'normal'},
  Marin:     {bodyColor:'#80c0f0',headTop:'droplet',headwear:'none',wings:'none',eyes:'round', mouth:'o',    bodyTexture:'normal'},
  Angeling:  {bodyColor:'#f0e8d8',headTop:'none',  headwear:'halo',wings:'angel',eyes:'sparkle',mouth:'smile',bodyTexture:'normal'},
  Ghostring: {bodyColor:'#c8c8d0',headTop:'none',  headwear:'none',wings:'none',eyes:'dead',  mouth:'o',    bodyTexture:'ghost'},
  Deviling:  {bodyColor:'#505060',headTop:'spike', headwear:'none',wings:'demon',eyes:'angry', mouth:'teeth',bodyTexture:'normal'},
  Metaling:  {bodyColor:'#a0a0b8',headTop:'antenna',headwear:'none',wings:'none',eyes:'dot',  mouth:'frown',bodyTexture:'metallic'},
};

const CHIP_OPTS = {
  bodyShape:   [['round','ROUND'],['tall','TALL'],['wide','WIDE'],['tiny','TINY']],
  bodyTexture: [['normal','NORMAL'],['ghost','GHOST'],['metallic','METAL']],
  eyes:    [['classic','CLASSIC'],['round','ROUND'],['dot','DOT'],['sleepy','SLEEPY'],
            ['star','STAR'],['heart','HEART'],['dead','KO'],['angry','ANGRY'],
            ['sparkle','SPARKLE'],['wink','WINK']],
  mouth:   [['smile','SMILE'],['open','OPEN'],['smirk','SMIRK'],['frown','FROWN'],
            ['tongue',':P'],['o','O'],['cat',':3'],['teeth','TEETH']],
  cheeks:  [['none','NONE'],['blush','BLUSH'],['freckles','FRECKLE'],['tears','TEARS']],
  headTop: [['none','NONE'],['leaf','LEAF'],['droplet','DROP'],['spike','SPIKE'],['antenna','ANTENNA']],
  headwear:[['none','NONE'],['bow','BOW'],['crown','CROWN'],['witch','WITCH'],
            ['santa','SANTA'],['party','PARTY'],['mushroom','MUSH'],['flower','FLOWER'],
            ['halo','HALO'],['headphones','HP']],
  wings:   [['none','NONE'],['angel','ANGEL'],['demon','DEMON']],
  effect:  [['none','NONE'],['sparkles','SPARK'],['hearts','HEART'],['music','MUSIC'],
            ['zzz','ZZZ'],['anger','ANGER'],['sweat','SWEAT'],['question','?']],
  outlineStyle:[['classic','CLASSIC'],['dark','DARK'],['none','NONE']],
  bgPreset:[['transparent','TRANS'],['white','WHITE'],['navy','NAVY'],['sky','SKY'],
            ['grass','GRASS'],['sunset','SUNSET'],['dungeon','DUNG'],['pink','PINK']],
  animation:[['none','NONE'],['bob','BOB'],['wiggle','WIGGLE'],['spin','SPIN']],
};

// ── color helpers ───────────────────────────────────────────────────────

const hex2rgb = h => { const c=h.replace('#',''); return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)]; };
const rgb2hex = (r,g,b) => '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const lighten = (h,a) => { const[r,g,b]=hex2rgb(h); return rgb2hex(r+(255-r)*a,g+(255-g)*a,b+(255-b)*a); };
const darken  = (h,a) => { const[r,g,b]=hex2rgb(h); return rgb2hex(r*(1-a),g*(1-a),b*(1-a)); };
const outline = h => { const[r,g,b]=hex2rgb(h); return rgb2hex(r*.95+10,g*.75+10,b*.8+15); };

function pal() {
  const c = state.bodyColor;
  const ol = state.outlineStyle==='dark'?darken(c,.6) : state.outlineStyle==='none'?null : outline(c);
  return {
    outline:ol, light:lighten(c,.38), base:c, dark:darken(c,.28), shine:lighten(c,.75),
    eye:'#1a1a22', eyeW:'#fff', heart:'#d84050',
    mouth:'#1a1a22', mouthIn:'#6a2838', tongue:'#d07088',
    cheek:'#e89098', freckle:darken(c,.35), tear:'#80c0f0', tearW:'#c8e8ff',
    leaf:'#7ac06a', leafD:'#3d7a3a',
    cherry:'#d03030', cherryW:'#ff8080', stem:'#5a3a20',
    spike:darken(c,.45), spikeW:lighten(c,.2),
    antenna:'#808080', antennaT:'#f0e060',
    droplet:lighten(c,.5), dropletW:'#fff',
    bow:'#e05080', bowD:'#a03060',
    crown:'#f0c830', crownD:'#b08810', gem:'#4080d0',
    witch:'#4a2070', witchD:'#2a1050', witchB:'#f0c830',
    santa:'#d03030', santaD:'#a02020', santaW:'#fff',
    party:'#40a0e0', partyB:'#f06080', partyC:'#f0c830', partyR:'#fff',
    petal:'#ffe860', petalC:'#e08030',
    halo:'#f0e060', haloD:'#c0b030',
    mush:'#d03030', mushD:'#fff', mushS:'#e8d8c0',
    hpB:'#333', hpC:'#e05080',
    wingW:'#e8e8f0', wingD:'#b0b0c0', wingDk:'#303048', wingDkL:'#484860',
    effA:'#f0e060', effB:'#e05060', effC:'#80c0f0', effD:'#fff',
    shadow:'rgba(0,0,0,.2)', metalA:lighten(c,.55), metalB:darken(c,.1),
  };
}

// ── body ────────────────────────────────────────────────────────────────

function bParams() {
  switch(state.bodyShape) {
    case 'tall': return {cx:16,cy:16,rx:10,ry:13,nT:2,nB:2.5};
    case 'wide': return {cx:16,cy:19,rx:14,ry:9,nT:2,nB:3.5};
    case 'tiny': return {cx:16,cy:22,rx:8,ry:7,nT:2,nB:2.8};
    default:     return {cx:16,cy:17,rx:12,ry:11,nT:2,nB:3};
  }
}

function makeGrid() {
  const {cx,cy,rx,ry,nT,nB} = bParams();
  const raw = Array.from({length:H},()=>Array(W).fill(0));
  const clip = Math.min(cy+ry, H-4);

  for (let y=0;y<H;y++) { if(y>clip)continue; for (let x=0;x<W;x++) {
    const dx=Math.abs((x+.5-cx)/rx), dy=(y+.5-cy)/ry, n=dy<0?nT:nB;
    if (Math.pow(dx,n)+Math.pow(Math.abs(dy),n)<1) raw[y][x]=1;
  }}

  let bL=W,bR=0,bT=H,bB=0;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(raw[y][x]){if(x<bL)bL=x;if(x>bR)bR=x;if(y<bT)bT=y;if(y>bB)bB=y;}
  const bW=Math.max(1,bR-bL), bH=Math.max(1,bB-bT);

  const g = raw.map(r=>r.map(v=>v?'base':null));
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) {
    if(!raw[y][x]) continue;
    const br = 1-((x-bL)/bW*.55+(y-bT)/bH*.45);
    g[y][x] = br>.6?'light' : br>.28?'base' : 'dark';
  }

  const hlx=cx-rx*.3, hly=cy-ry*.35, hlr=Math.max(2,rx*.2), hlry=Math.max(2,ry*.18);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) {
    if(!g[y][x]) continue;
    const dx2=(x+.5-hlx)/hlr, dy2=(y+.5-hly)/hlry;
    if(dx2*dx2+dy2*dy2<1) g[y][x]='shine';
  }

  if(state.outlineStyle!=='none') {
    for(let y=0;y<H;y++) for(let x=0;x<W;x++) {
      if(!g[y][x]) continue;
      for(const[dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nx=x+dx,ny=y+dy;
        if(nx<0||ny<0||nx>=W||ny>=H||!raw[ny][nx]){g[y][x]='outline';break;}
      }
    }
  }

  if(state.bodyTexture==='metallic') {
    for(let y=bT+2;y<bB-1;y+=3) for(let x=bL+2;x<bR-1;x+=4) {
      if(g[y][x]&&g[y][x]!=='outline') g[y][x]='metalA';
    }
  }

  const eyeY=Math.round(cy-ry*.18), gap=Math.max(2,Math.round(rx*.28));
  return {
    g, raw, cx, cy, rx, ry, bT, bB, bL, bR,
    eL:{x:cx-gap-1,y:eyeY}, eR:{x:cx+gap,y:eyeY},
    mo:{x:cx,y:Math.round(cy+ry*.15)},
  };
}

// ── pixel helper ────────────────────────────────────────────────────────

function px(g,x,y,c){if(x>=0&&y>=0&&x<W&&y<H)g[y][x]=c;}

// ── eyes ────────────────────────────────────────────────────────────────

const EYE={
  classic: [[0,0,'eye'],[1,0,'eyeW'],[0,1,'eye'],[1,1,'eye']],
  round:   [[0,0,'eye'],[1,0,'eye'],[0,1,'eye'],[1,1,'eyeW']],
  dot:     [[0,0,'eye']],
  sleepy:  [[0,0,'eye'],[1,0,'eye'],[2,0,'eye']],
  star:    [[1,0,'eye'],[0,1,'eye'],[1,1,'eye'],[2,1,'eye'],[1,2,'eye']],
  heart:   [[0,0,'heart'],[2,0,'heart'],[0,1,'heart'],[1,1,'heart'],[2,1,'heart'],[1,2,'heart']],
  dead:    [[0,0,'eye'],[2,0,'eye'],[1,1,'eye'],[0,2,'eye'],[2,2,'eye']],
  sparkle: [[0,0,'eyeW'],[1,0,'eye'],[0,1,'eye'],[1,1,'eyeW']],
};
const EYE_A={
  angry:{
    l:[[1,0,'eye'],[0,1,'eye'],[1,1,'eye'],[0,2,'eye']],
    r:[[0,0,'eye'],[0,1,'eye'],[1,1,'eye'],[1,2,'eye']],
  },
  wink:{
    l:EYE.classic,
    r:[[0,0,'eye'],[1,0,'eye']],
  },
};
function paintEyes(g,i){
  const s=EYE[state.eyes], a=EYE_A[state.eyes];
  if(!s&&!a)return;
  const p=(anc,px2)=>{for(const[dx,dy,c]of px2)px(g,anc.x+dx,anc.y+dy,c);};
  if(a){p(i.eL,a.l);p(i.eR,a.r);} else {p(i.eL,s);p(i.eR,s);}
}

// ── mouth ───────────────────────────────────────────────────────────────

const MO={
  smile:  [[-1,0,'mouth'],[0,1,'mouth'],[1,1,'mouth'],[2,0,'mouth']],
  open:   [[0,0,'mouth'],[1,0,'mouth'],[0,1,'mouthIn'],[1,1,'tongue'],[0,2,'mouth'],[1,2,'mouth']],
  smirk:  [[-1,1,'mouth'],[0,0,'mouth'],[1,0,'mouth'],[2,-1,'mouth']],
  frown:  [[-1,1,'mouth'],[0,0,'mouth'],[1,0,'mouth'],[2,1,'mouth']],
  tongue: [[-1,0,'mouth'],[0,1,'mouth'],[1,1,'mouth'],[2,0,'mouth'],[0,2,'tongue'],[1,2,'tongue']],
  o:      [[0,0,'mouth'],[1,0,'mouth'],[0,1,'mouth'],[1,1,'mouth']],
  cat:    [[-1,0,'mouth'],[0,1,'mouth'],[1,0,'mouth'],[2,1,'mouth'],[3,0,'mouth']],
  teeth:  [[0,0,'mouth'],[1,0,'mouth'],[0,1,'eyeW'],[1,1,'eyeW'],[0,2,'mouth'],[1,2,'mouth']],
};
function paintMouth(g,i){
  const d=MO[state.mouth]; if(!d)return;
  for(const[dx,dy,c]of d) px(g,i.mo.x+dx,i.mo.y+dy,c);
}

// ── cheeks ──────────────────────────────────────────────────────────────

function paintCheeks(g,i){
  const sp=Math.round(i.rx*.5), cy=i.eL.y+3;
  if(state.cheeks==='blush'){
    px(g,i.cx-sp,cy,'cheek'); px(g,i.cx-sp+1,cy,'cheek');
    px(g,i.cx+sp-1,cy,'cheek'); px(g,i.cx+sp,cy,'cheek');
  } else if(state.cheeks==='freckles'){
    px(g,i.cx-sp,cy,'freckle'); px(g,i.cx-sp+1,cy+1,'freckle');
    px(g,i.cx+sp,cy,'freckle'); px(g,i.cx+sp-1,cy+1,'freckle');
  } else if(state.cheeks==='tears'){
    for(let d=0;d<3;d++){px(g,i.eL.x,i.eL.y+2+d,'tear');px(g,i.eR.x+1,i.eR.y+2+d,'tear');}
  }
}

// ── head top ────────────────────────────────────────────────────────────

function paintHeadTop(g,i){
  const t=i.bT, cx=i.cx;
  if(state.headTop==='leaf'){
    px(g,cx+1,t-4,'leafD');
    px(g,cx,t-3,'leaf'); px(g,cx+1,t-3,'leafD');
    px(g,cx-1,t-2,'leaf'); px(g,cx,t-2,'leaf');
    px(g,cx,t-1,'leafD');
  }
  else if(state.headTop==='droplet'){
    px(g,cx-2,t-2,'droplet'); px(g,cx,t-3,'dropletW'); px(g,cx+2,t-2,'droplet');
  }
  else if(state.headTop==='spike'){
    px(g,cx,t-4,'spike'); px(g,cx,t-3,'spikeW');
    px(g,cx-1,t-2,'spike'); px(g,cx,t-2,'spikeW'); px(g,cx+1,t-2,'spike');
    px(g,cx,t-1,'spike');
  }
  else if(state.headTop==='antenna'){
    px(g,cx,t-4,'antennaT'); px(g,cx+1,t-4,'antennaT');
    px(g,cx,t-3,'antenna'); px(g,cx,t-2,'antenna'); px(g,cx,t-1,'antenna');
  }
}

// ── headwear ────────────────────────────────────────────────────────────

function paintHeadwear(g,i){
  const t=i.bT, cx=i.cx, rx=i.rx;
  const hw=state.headwear;
  if(hw==='none') return;
  if(hw==='bow'){
    const bx=cx+rx-2;
    px(g,bx-1,t,'bow');px(g,bx,t,'bowD');px(g,bx+1,t,'bow');
    px(g,bx-1,t+1,'bow');px(g,bx+1,t+1,'bow');
  }
  else if(hw==='crown'){
    for(let dx=-4;dx<=4;dx++) px(g,cx+dx,t,dx%2?'crown':'crownD');
    for(let dx=-3;dx<=3;dx++) px(g,cx+dx,t-1,dx%2?'crown':'crownD');
    px(g,cx-3,t-2,'crown');px(g,cx,t-2,'gem');px(g,cx+3,t-2,'crown');
  }
  else if(hw==='witch'){
    for(let dx=-5;dx<=5;dx++) px(g,cx+dx,t,'witchD');
    for(let dx=-4;dx<=4;dx++) px(g,cx+dx,t-1,'witch');
    for(let dx=-4;dx<=4;dx++) px(g,cx+dx,t-2,'witchB');
    for(let dx=-3;dx<=3;dx++) px(g,cx+dx,t-3,'witch');
    for(let dx=-2;dx<=2;dx++) px(g,cx+dx,t-4,'witch');
    for(let dx=-1;dx<=1;dx++) px(g,cx+dx,t-5,'witch');
    px(g,cx,t-6,'witch');
  }
  else if(hw==='santa'){
    for(let dx=-5;dx<=5;dx++) px(g,cx+dx,t,'santaW');
    for(let dx=-4;dx<=4;dx++) px(g,cx+dx,t-1,'santa');
    for(let dx=-3;dx<=3;dx++) px(g,cx+dx,t-2,'santa');
    for(let dx=-2;dx<=2;dx++) px(g,cx+dx,t-3,'santaD');
    for(let dx=-1;dx<=1;dx++) px(g,cx+dx,t-4,'santaD');
    px(g,cx,t-5,'santaD');
    px(g,cx+4,t-4,'santaW');px(g,cx+5,t-5,'santaW');
  }
  else if(hw==='party'){
    for(let dx=-4;dx<=4;dx++) px(g,cx+dx,t,'partyR');
    for(let dx=-3;dx<=3;dx++) px(g,cx+dx,t-1,dx%2?'party':'partyB');
    for(let dx=-2;dx<=2;dx++) px(g,cx+dx,t-2,dx%2?'partyC':'party');
    for(let dx=-1;dx<=1;dx++) px(g,cx+dx,t-3,'partyB');
    px(g,cx,t-4,'partyR');
  }
  else if(hw==='mushroom'){
    for(let dx=-4;dx<=4;dx++) px(g,cx+dx,t-1,'mush');
    for(let dx=-3;dx<=3;dx++) px(g,cx+dx,t-2,'mush');
    for(let dx=-2;dx<=2;dx++) px(g,cx+dx,t-3,'mush');
    px(g,cx-2,t-2,'mushD');px(g,cx+1,t-2,'mushD');
    px(g,cx-1,t,'mushS');px(g,cx,t,'mushS');px(g,cx+1,t,'mushS');
  }
  else if(hw==='flower'){
    const fx=cx-rx+1;
    px(g,fx,t,'petal');px(g,fx+1,t,'petal');
    px(g,fx-1,t+1,'petal');px(g,fx,t+1,'petalC');px(g,fx+1,t+1,'petalC');px(g,fx+2,t+1,'petal');
    px(g,fx,t+2,'petal');px(g,fx+1,t+2,'petal');
  }
  else if(hw==='halo'){
    for(let dx=-4;dx<=4;dx++){px(g,cx+dx,t-3,'halo');px(g,cx+dx,t-1,'halo');}
    px(g,cx-5,t-2,'haloD');px(g,cx+5,t-2,'haloD');
  }
  else if(hw==='headphones'){
    for(let dx=-rx;dx<=rx;dx++) px(g,cx+dx,t-1,'hpB');
    for(let dx=-rx+1;dx<=rx-1;dx++) px(g,cx+dx,t-2,'hpB');
    for(let d=0;d<2;d++){
      px(g,i.bL-1,i.eL.y+d,'hpC');px(g,i.bL-2,i.eL.y+d,'hpC');
      px(g,i.bR+1,i.eR.y+d,'hpC');px(g,i.bR+2,i.eR.y+d,'hpC');
    }
  }
}

// ── wings ───────────────────────────────────────────────────────────────

function paintWings(g,i){
  if(state.wings==='none')return;
  const cy=i.cy-2, lx=i.bL, rx2=i.bR;
  if(state.wings==='angel'){
    px(g,lx-1,cy,'wingW');px(g,lx-2,cy,'wingW');px(g,lx-3,cy-1,'wingW');
    px(g,lx-1,cy-1,'wingD');px(g,lx-2,cy-1,'wingW');
    px(g,lx-1,cy+1,'wingD');
    px(g,rx2+1,cy,'wingW');px(g,rx2+2,cy,'wingW');px(g,rx2+3,cy-1,'wingW');
    px(g,rx2+1,cy-1,'wingD');px(g,rx2+2,cy-1,'wingW');
    px(g,rx2+1,cy+1,'wingD');
  }
  else if(state.wings==='demon'){
    px(g,lx-1,cy,'wingDk');px(g,lx-2,cy,'wingDkL');px(g,lx-3,cy-1,'wingDk');px(g,lx-4,cy-2,'wingDk');
    px(g,lx-1,cy+1,'wingDk');px(g,lx-2,cy-1,'wingDk');
    px(g,rx2+1,cy,'wingDk');px(g,rx2+2,cy,'wingDkL');px(g,rx2+3,cy-1,'wingDk');px(g,rx2+4,cy-2,'wingDk');
    px(g,rx2+1,cy+1,'wingDk');px(g,rx2+2,cy-1,'wingDk');
  }
}

// ── effects ─────────────────────────────────────────────────────────────

function paintEffects(g,i){
  const e=state.effect; if(e==='none')return;
  if(e==='sparkles'){
    const pts=[[3,5],[i.bR+2,i.bT-1],[i.bR+3,i.bT+6]];
    for(const[sx,sy]of pts){px(g,sx,sy-1,'effA');px(g,sx-1,sy,'effA');px(g,sx,sy,'effA');px(g,sx+1,sy,'effA');px(g,sx,sy+1,'effA');}
  }
  else if(e==='hearts'){
    const d=(sx,sy)=>{px(g,sx,sy,'effB');px(g,sx+2,sy,'effB');px(g,sx,sy+1,'effB');px(g,sx+1,sy+1,'effB');px(g,sx+2,sy+1,'effB');px(g,sx+1,sy+2,'effB');};
    d(i.bR+1,i.bT-2); d(2,i.bT+1);
  }
  else if(e==='music'){
    const d=(sx,sy)=>{px(g,sx+1,sy,'effA');px(g,sx+1,sy+1,'effA');px(g,sx,sy+2,'effA');px(g,sx,sy+3,'effA');};
    d(i.bR+1,i.bT-3); d(i.bR+3,i.bT);
  }
  else if(e==='zzz'){
    px(g,i.bR+1,i.bT-4,'effD');px(g,i.bR+2,i.bT-4,'effD');px(g,i.bR+3,i.bT-4,'effD');
    px(g,i.bR+2,i.bT-3,'effD');
    px(g,i.bR+1,i.bT-2,'effD');px(g,i.bR+2,i.bT-2,'effD');px(g,i.bR+3,i.bT-2,'effD');
    px(g,i.bR+3,i.bT,'effD');px(g,i.bR+4,i.bT,'effD');px(g,i.bR+4,i.bT+1,'effD');px(g,i.bR+3,i.bT+1,'effD');
  }
  else if(e==='anger'){
    const sx=i.bR-1,sy=i.bT;
    px(g,sx,sy,'effB');px(g,sx+2,sy,'effB');px(g,sx+1,sy+1,'effB');px(g,sx,sy+2,'effB');px(g,sx+2,sy+2,'effB');
  }
  else if(e==='sweat'){
    const sx=i.bR+1,sy=i.bT;
    px(g,sx,sy,'effC');px(g,sx,sy+1,'effC');px(g,sx,sy+2,'effC');
  }
  else if(e==='question'){
    const sx=i.cx+1,sy=i.bT-5;
    px(g,sx,sy,'effD');px(g,sx+1,sy,'effD');px(g,sx+1,sy+1,'effD');px(g,sx,sy+2,'effD');px(g,sx,sy+4,'effD');
  }
}

// ── render ──────────────────────────────────────────────────────────────

function render() {
  const i = makeGrid();
  const g = i.g;
  paintCheeks(g,i);
  paintEyes(g,i);
  paintMouth(g,i);
  paintHeadTop(g,i);
  paintHeadwear(g,i);
  paintWings(g,i);

  const eg = Array.from({length:H},()=>Array(W).fill(null));
  paintEffects(eg,i);

  const c = pal();
  const ghostOp = state.bodyTexture==='ghost'?'0.55':'1';

  const lay = document.getElementById('bodyLayer');
  while(lay.firstChild)lay.removeChild(lay.firstChild);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const k=g[y][x]; if(!k)continue;
    const color=c[k]; if(!color)continue;
    const r=document.createElementNS(SVG_NS,'rect');
    r.setAttribute('x',x);r.setAttribute('y',y);r.setAttribute('width',1);r.setAttribute('height',1);
    r.setAttribute('fill',color);
    if(ghostOp!=='1'&&k!=='outline'&&k!=='eye'&&k!=='eyeW'&&k!=='mouth'&&k!=='mouthIn'&&k!=='tongue')
      r.setAttribute('opacity',ghostOp);
    lay.appendChild(r);
  }

  const el2=document.getElementById('effectLayer');
  while(el2.firstChild)el2.removeChild(el2.firstChild);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const k=eg[y][x]; if(!k)continue;
    const color=c[k]; if(!color)continue;
    const r=document.createElementNS(SVG_NS,'rect');
    r.setAttribute('x',x);r.setAttribute('y',y);r.setAttribute('width',1);r.setAttribute('height',1);
    r.setAttribute('fill',color);
    el2.appendChild(r);
  }

  const sl=document.getElementById('shadowLayer');
  while(sl.firstChild)sl.removeChild(sl.firstChild);
  const shCy=i.bB+2, shRx=Math.round(i.rx*.65);
  for(let x=i.cx-shRx;x<=i.cx+shRx;x++){
    const r=document.createElementNS(SVG_NS,'rect');
    r.setAttribute('x',x);r.setAttribute('y',shCy);r.setAttribute('width',1);r.setAttribute('height',1);
    r.setAttribute('fill',c.shadow);
    sl.appendChild(r);
  }

  const bg=document.getElementById('bgRect');
  if(state.bgPreset==='transparent') bg.setAttribute('fill','url(#checker)');
  else if(state.bgPreset==='solid') bg.setAttribute('fill',state.bgColor);
  else bg.setAttribute('fill',BG_PRESETS[state.bgPreset]||state.bgColor);

  const bob=document.getElementById('bobGroup');
  bob.classList.remove('bob','wiggle','spin');
  if(state.animation!=='none') bob.classList.add(state.animation);
}

// ── UI ──────────────────────────────────────────────────────────────────

function mark(c,v){c.querySelectorAll('.chip').forEach(b=>b.classList.toggle('active',b.dataset.value===v));}

function buildChips(){
  document.querySelectorAll('.chips').forEach(c=>{
    const f=c.dataset.field, opts=CHIP_OPTS[f]||[];
    c.innerHTML='';
    opts.forEach(([id,label])=>{
      const b=document.createElement('button');
      b.type='button';b.className='chip';b.textContent=label;b.dataset.value=id;
      b.addEventListener('click',()=>{state[f]=id;mark(c,id);render();});
      c.appendChild(b);
    });
    mark(c,state[f]);
  });
}

function buildSwatches(){
  const box=document.getElementById('swatches');box.innerHTML='';
  BODY_SWATCHES.forEach(color=>{
    const b=document.createElement('button');b.type='button';b.style.background=color;b.title=color;
    b.addEventListener('click',()=>{state.bodyColor=color;document.getElementById('bodyColor').value=color;render();});
    box.appendChild(b);
  });
}

function buildPresets(){
  const box=document.getElementById('presets');box.innerHTML='';
  for(const name in PRESETS){
    const b=document.createElement('button');b.type='button';b.className='preset-btn';b.textContent=name;
    b.addEventListener('click',()=>{
      Object.assign(state,PRESETS[name]);
      document.getElementById('bodyColor').value=state.bodyColor;
      document.querySelectorAll('.chips').forEach(c=>mark(c,state[c.dataset.field]));
      render();
    });
    box.appendChild(b);
  }
}

function wireTabs(){
  document.querySelectorAll('.tab').forEach(t=>{
    t.addEventListener('click',()=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(x=>x.classList.add('hidden'));
      t.classList.add('active');
      document.getElementById('panel-'+t.dataset.tab).classList.remove('hidden');
    });
  });
}

function wire(){
  document.getElementById('nameInput').addEventListener('input',e=>{state.name=e.target.value;});
  document.getElementById('bodyColor').addEventListener('input',e=>{state.bodyColor=e.target.value;render();});
  document.getElementById('bgColor').addEventListener('input',e=>{
    state.bgColor=e.target.value;state.bgPreset='solid';
    const c=document.querySelector('[data-field="bgPreset"]');if(c)mark(c,'solid');
    render();
  });
  document.getElementById('randomBtn').addEventListener('click',randomize);
  document.getElementById('resetBtn').addEventListener('click',reset);
  document.getElementById('pngBtn').addEventListener('click',exportPNG);
  document.getElementById('jsonBtn').addEventListener('click',exportJSON);
  document.getElementById('loadJson').addEventListener('change',loadJSON);
}

function pick(a){return a[Math.floor(Math.random()*a.length)];}

function randomize(){
  state.bodyColor=pick(BODY_SWATCHES);
  for(const k of Object.keys(CHIP_OPTS)) state[k]=pick(CHIP_OPTS[k])[0];
  if(state.bgPreset==='solid') state.bgColor=pick(['#181830','#0a0e27','#88c8e8','#e8a0c0']);
  document.getElementById('bodyColor').value=state.bodyColor;
  document.querySelectorAll('.chips').forEach(c=>mark(c,state[c.dataset.field]));
  render();
}

function reset(){
  Object.assign(state,DEFAULTS);
  document.getElementById('bodyColor').value=state.bodyColor;
  document.getElementById('bgColor').value=state.bgColor;
  document.querySelectorAll('.chips').forEach(c=>mark(c,state[c.dataset.field]));
  render();
}

function dl(blob,name){
  const u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),2000);
}

function exportPNG(){
  const svg=document.getElementById('poporing'),cl=svg.cloneNode(true);
  cl.setAttribute('xmlns',SVG_NS);cl.setAttribute('width',W);cl.setAttribute('height',H);
  const bob=cl.querySelector('#bobGroup');if(bob)bob.removeAttribute('class');
  if(state.bgPreset==='transparent') cl.querySelector('#bgRect').setAttribute('fill','none');
  const str=new XMLSerializer().serializeToString(cl);
  const blob=new Blob(['<?xml version="1.0"?>\n',str],{type:'image/svg+xml;charset=utf-8'});
  const url=URL.createObjectURL(blob),img=new Image();
  img.onload=()=>{
    const n=document.createElement('canvas');n.width=W;n.height=H;
    const nc=n.getContext('2d');nc.imageSmoothingEnabled=false;nc.drawImage(img,0,0,W,H);
    const S=640,o=document.createElement('canvas');o.width=S;o.height=S;
    const oc=o.getContext('2d');oc.imageSmoothingEnabled=false;oc.drawImage(n,0,0,S,S);
    o.toBlob(b=>{dl(b,`${(state.name||'poporing').replace(/\s+/g,'_')}.png`);URL.revokeObjectURL(url);},'image/png');
  };
  img.onerror=()=>{URL.revokeObjectURL(url);alert('Export failed');};
  img.src=url;
}

function exportJSON(){
  const d=JSON.stringify({v:4,...state},null,2);
  dl(new Blob([d],{type:'application/json'}),`${(state.name||'poporing').replace(/\s+/g,'_')}.json`);
}

function loadJSON(e){
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      for(const k of Object.keys(DEFAULTS)) if(k in d)state[k]=d[k];
      document.getElementById('bodyColor').value=state.bodyColor;
      document.getElementById('bgColor').value=state.bgColor;
      document.querySelectorAll('.chips').forEach(c=>mark(c,state[c.dataset.field]));
      render();
    }catch(err){alert('Invalid JSON');}
  };
  r.readAsText(f);e.target.value='';
}

document.addEventListener('DOMContentLoaded',()=>{
  buildSwatches();buildChips();buildPresets();wireTabs();wire();render();
});
