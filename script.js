// ========================================================================
// Poporing Maker — v6: GIF export, patterns, auras, gradient BGs, sharing
// ========================================================================

const SVG_NS='http://www.w3.org/2000/svg';
const W=32,H=32;

// ── GIF89a encoder ──────────────────────────────────────────────────────

function lzwEncode(indices,minCS){
  const cc=1<<minCS, eoi=cc+1;
  let cs=minCS+1, nc=eoi+1;
  let tbl=new Map();
  for(let i=0;i<cc;i++) tbl.set(String(i),i);
  const out=[];
  let buf=0,bits=0;
  const emit=(code,sz)=>{buf|=code<<bits;bits+=sz;while(bits>=8){out.push(buf&0xff);buf>>=8;bits-=8;}};
  emit(cc,cs);
  let cur=String(indices[0]);
  for(let i=1;i<indices.length;i++){
    const nxt=cur+','+indices[i];
    if(tbl.has(nxt)){cur=nxt;}
    else{
      emit(tbl.get(cur),cs);
      if(nc<4096){tbl.set(nxt,nc++);if(nc>(1<<cs)&&cs<12)cs++;}
      else{emit(cc,cs);tbl=new Map();for(let j=0;j<cc;j++)tbl.set(String(j),j);nc=eoi+1;cs=minCS+1;}
      cur=String(indices[i]);
    }
  }
  emit(tbl.get(cur),cs);
  emit(eoi,cs);
  if(bits>0) out.push(buf&0xff);
  return out;
}

function buildGIF(frames,w,h,delayMs){
  const cmap=new Map();
  cmap.set('0,0,0,0',0);
  let ci=1;
  for(const f of frames) for(let i=0;i<f.length;i+=4){
    if(f[i+3]<128)continue;
    const k=`${f[i]},${f[i+1]},${f[i+2]}`;
    if(!cmap.has(k)&&ci<256) cmap.set(k,ci++);
  }
  const palBits=Math.max(2,Math.ceil(Math.log2(Math.max(4,ci))));
  const palSz=1<<palBits;
  const gct=new Uint8Array(palSz*3);
  for(const[k,idx]of cmap){if(!idx)continue;const[r,g,b]=k.split(',').map(Number);gct[idx*3]=r;gct[idx*3+1]=g;gct[idx*3+2]=b;}
  const o=[];
  const wb=(...b)=>o.push(...b);
  const ws=s=>{for(let i=0;i<s.length;i++)o.push(s.charCodeAt(i));};
  const w16=v=>wb(v&0xff,(v>>8)&0xff);
  ws('GIF89a');w16(w);w16(h);
  wb(0x80|((palBits-1)&7)|(((palBits-1)&7)<<4));wb(0);wb(0);
  for(let i=0;i<gct.length;i++)o.push(gct[i]);
  wb(0x21,0xff,11);ws('NETSCAPE2.0');wb(3,1);w16(0);wb(0);
  const delay=Math.round(delayMs/10);
  for(const f of frames){
    wb(0x21,0xf9,4,0x09);w16(delay);wb(0,0);
    wb(0x2c);w16(0);w16(0);w16(w);w16(h);wb(0);
    const idx=new Uint8Array(w*h);
    for(let i=0;i<w*h;i++){
      const p=i*4;
      if(f[p+3]<128){idx[i]=0;}
      else{const k=`${f[p]},${f[p+1]},${f[p+2]}`;idx[i]=cmap.get(k)||0;}
    }
    const mcs=Math.max(2,palBits);
    const lzw=lzwEncode(idx,mcs);
    wb(mcs);
    let pos=0;
    while(pos<lzw.length){const bs=Math.min(255,lzw.length-pos);wb(bs);for(let i=0;i<bs;i++)o.push(lzw[pos+i]);pos+=bs;}
    wb(0);
  }
  wb(0x3b);
  return new Blob([new Uint8Array(o)],{type:'image/gif'});
}

// ── animation frames ────────────────────────────────────────────────────

const ANIM_FRAMES={
  idle:[{sx:1,sy:1,ox:0,oy:0},{sx:1.07,sy:.9,ox:0,oy:1},{sx:1,sy:1,ox:0,oy:0},{sx:.93,sy:1.07,ox:0,oy:-1}],
  walk:[{sx:1,sy:1,ox:0,oy:0},{sx:.95,sy:1.05,ox:1,oy:-1},{sx:1,sy:1,ox:2,oy:0},{sx:1.05,sy:.93,ox:1,oy:1}],
  attack:[{sx:1.06,sy:.9,ox:0,oy:1},{sx:.88,sy:1.14,ox:0,oy:-3},{sx:.88,sy:1.1,ox:0,oy:-2},{sx:1.14,sy:.84,ox:0,oy:2},{sx:1,sy:1,ox:0,oy:0}],
  hurt:[{sx:1.08,sy:.92,ox:-1,oy:0},{sx:.95,sy:1.02,ox:1,oy:0},{sx:1.06,sy:.94,ox:-1,oy:0},{sx:1,sy:1,ox:0,oy:0}],
};
const ANIM_SPEED={idle:200,walk:160,attack:130,hurt:110};
let animTimer=null,animFrame=0;

// ── state ───────────────────────────────────────────────────────────────

const DEFAULTS={
  name:'Poppy',bodyColor:'#a6c081',bodyShape:'tiny',bodyTexture:'normal',bodyPattern:'none',
  eyes:'classic',mouth:'smile',cheeks:'none',aura:'none',
  headTop:'leaf',headwear:'none',wings:'none',effect:'none',
  outlineStyle:'classic',bgPreset:'transparent',bgColor:'#181830',animation:'idle',
};
const state={...DEFAULTS};

// ── options ─────────────────────────────────────────────────────────────

const BODY_SWATCHES=[
  '#a6c081','#6a9a5a','#d4e8a0','#f0a0b0','#e06888','#c04870',
  '#f2c94c','#e0a030','#ff8a3c','#80c0f0','#5090d0','#a080e0',
  '#f0e8d8','#a0a0b8','#505060',
];

const BG_SOLID={transparent:null,white:'#f0f0f0',navy:'#0a0e27',sky:'#88c8e8',grass:'#306828',sunset:'#d07848',dungeon:'#201030',pink:'#e8a0c0',gray:'#484848',teal:'#206868',black:'#0a0a0a',lavender:'#9088c0'};
const BG_GRAD={'g-sunset':['#f07040','#4a2060'],'g-ocean':['#88d8f0','#183060'],'g-forest':['#88c860','#183818'],'g-magic':['#6040a0','#101040'],'g-dawn':['#f0c080','#304880'],'g-field':['#88c8e8','#58a838'],'g-night':['#101838','#000010'],'g-fire':['#f04020','#301008']};

const PRESETS={
  Poporing:{bodyColor:'#a6c081',headTop:'leaf',headwear:'none',wings:'none',eyes:'classic',mouth:'smile',bodyTexture:'normal',bodyPattern:'none',aura:'none'},
  Poring:{bodyColor:'#f0a0b0',headTop:'droplet',headwear:'none',wings:'none',eyes:'round',mouth:'smile',bodyTexture:'normal',bodyPattern:'none',aura:'none'},
  Drops:{bodyColor:'#f2c94c',headTop:'spike',headwear:'none',wings:'none',eyes:'classic',mouth:'smile',bodyTexture:'normal',bodyPattern:'none',aura:'none'},
  Marin:{bodyColor:'#80c0f0',headTop:'droplet',headwear:'none',wings:'none',eyes:'round',mouth:'o',bodyTexture:'normal',bodyPattern:'none',aura:'none'},
  Angeling:{bodyColor:'#f0e8d8',headTop:'none',headwear:'halo',wings:'angel',eyes:'sparkle',mouth:'smile',bodyTexture:'normal',bodyPattern:'none',aura:'holy'},
  Ghostring:{bodyColor:'#c8c8d0',headTop:'none',headwear:'none',wings:'none',eyes:'dead',mouth:'o',bodyTexture:'ghost',bodyPattern:'none',aura:'none'},
  Deviling:{bodyColor:'#505060',headTop:'spike',headwear:'none',wings:'demon',eyes:'angry',mouth:'teeth',bodyTexture:'normal',bodyPattern:'none',aura:'dark'},
  Metaling:{bodyColor:'#a0a0b8',headTop:'antenna',headwear:'none',wings:'none',eyes:'dot',mouth:'frown',bodyTexture:'metallic',bodyPattern:'none',aura:'none'},
  Mastering:{bodyColor:'#f0a0b0',headTop:'none',headwear:'crown',wings:'none',eyes:'sparkle',mouth:'smile',bodyTexture:'normal',bodyPattern:'none',aura:'holy',bodyShape:'wide'},
  ArcAngeling:{bodyColor:'#f8f0e8',headTop:'none',headwear:'halo',wings:'angel',eyes:'sparkle',mouth:'smile',bodyTexture:'normal',bodyPattern:'none',aura:'holy',bodyShape:'round'},
  SantaPoring:{bodyColor:'#f0a0b0',headTop:'droplet',headwear:'santa',wings:'none',eyes:'round',mouth:'smile',bodyTexture:'normal',bodyPattern:'none',aura:'none'},
};

const CHIP_OPTS={
  bodyShape:[['round','ROUND'],['tall','TALL'],['wide','WIDE'],['tiny','TINY']],
  bodyTexture:[['normal','NORMAL'],['ghost','GHOST'],['metallic','METAL']],
  bodyPattern:[['none','NONE'],['stripes','STRIPE'],['spots','SPOTS'],['bicolor','SPLIT']],
  eyes:[['classic','CLASSIC'],['round','ROUND'],['dot','DOT'],['sleepy','SLEEPY'],['star','STAR'],['heart','HEART'],['dead','KO'],['angry','ANGRY'],['sparkle','SPARKLE'],['wink','WINK']],
  mouth:[['smile','SMILE'],['open','OPEN'],['smirk','SMIRK'],['frown','FROWN'],['tongue',':P'],['o','O'],['cat',':3'],['teeth','TEETH']],
  cheeks:[['none','NONE'],['blush','BLUSH'],['freckles','FRECKLE'],['tears','TEARS']],
  aura:[['none','NONE'],['holy','HOLY'],['dark','DARK'],['fire','FIRE'],['ice','ICE']],
  headTop:[['none','NONE'],['leaf','LEAF'],['droplet','DROP'],['spike','SPIKE'],['antenna','ANTENNA']],
  headwear:[['none','NONE'],['bow','BOW'],['crown','CROWN'],['witch','WITCH'],['santa','SANTA'],['party','PARTY'],['mushroom','MUSH'],['flower','FLOWER'],['halo','HALO'],['headphones','HP']],
  wings:[['none','NONE'],['angel','ANGEL'],['demon','DEMON']],
  effect:[['none','NONE'],['sparkles','SPARK'],['hearts','HEART'],['music','MUSIC'],['zzz','ZZZ'],['anger','ANGER'],['sweat','SWEAT'],['question','?']],
  outlineStyle:[['classic','CLASSIC'],['dark','DARK'],['none','NONE']],
  bgPreset:[['transparent','TRANS'],['white','WHITE'],['navy','NAVY'],['sky','SKY'],['grass','GRASS'],['sunset','SUNSET'],['dungeon','DUNG'],['pink','PINK'],['gray','GRAY'],['teal','TEAL'],['black','BLACK'],['lavender','LAVNDR'],
    ['g-sunset','SUN-G'],['g-ocean','OCEAN-G'],['g-forest','FRST-G'],['g-magic','MAGC-G'],['g-dawn','DAWN-G'],['g-field','FIELD-G'],['g-night','NGHT-G'],['g-fire','FIRE-G']],
  animation:[['none','NONE'],['idle','IDLE'],['walk','WALK'],['attack','ATK'],['hurt','HURT']],
};

// ── color ───────────────────────────────────────────────────────────────

const hex2rgb=h=>{const c=h.replace('#','');return[parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)];};
const rgb2hex=(r,g,b)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const lighten=(h,a)=>{const[r,g,b]=hex2rgb(h);return rgb2hex(r+(255-r)*a,g+(255-g)*a,b+(255-b)*a);};
const darken=(h,a)=>{const[r,g,b]=hex2rgb(h);return rgb2hex(r*(1-a),g*(1-a),b*(1-a));};
const mkOutline=h=>{const[r,g,b]=hex2rgb(h);return rgb2hex(r*.95+10,g*.75+10,b*.8+15);};

function pal(){
  const c=state.bodyColor;
  const ol=state.outlineStyle==='dark'?darken(c,.6):state.outlineStyle==='none'?null:mkOutline(c);
  return{
    outline:ol,s1:darken(c,.32),s2:darken(c,.16),s3:c,s4:lighten(c,.26),s5:lighten(c,.5),shine:lighten(c,.78),
    pat:darken(c,.18),
    eye:'#1a1a22',eyeW:'#fff',heart:'#d84050',
    mouth:'#1a1a22',mouthIn:'#6a2838',tongue:'#d07088',
    cheek:'#e89098',freckle:darken(c,.35),tear:'#80c0f0',tearW:'#c8e8ff',
    leaf:'#7ac06a',leafD:'#3d7a3a',cherry:'#d03030',cherryW:'#ff8080',stem:'#5a3a20',
    spike:darken(c,.45),spikeW:lighten(c,.2),antenna:'#808080',antennaT:'#f0e060',
    droplet:lighten(c,.5),dropletW:'#fff',
    bow:'#e05080',bowD:'#a03060',bowCenter:'#f0a0c0',
    crown:'#f0c830',crownD:'#b08810',gem:'#4080d0',
    witch:'#4a2070',witchD:'#2a1050',witchB:'#f0c830',witchStar:'#f0e060',
    santa:'#d03030',santaD:'#a02020',santaW:'#fff',
    party:'#40a0e0',partyB:'#f06080',partyC:'#f0c830',partyR:'#fff',
    petal:'#ffe860',petalC:'#e08030',halo:'#f0e060',haloD:'#c0b030',
    mush:'#d03030',mushD:'#fff',mushS:'#e8d8c0',
    hpB:'#333',hpC:'#e05080',
    wingW:'#e8e8f0',wingD:'#b0b0c0',wingDk:'#303048',wingDkL:'#484860',
    effA:'#f0e060',effB:'#e05060',effC:'#80c0f0',effD:'#fff',
    auraHoly:'#f8e870',auraDark:'#5030a0',auraFire:'#f05020',auraFireB:'#f0a040',auraIce:'#90d8f0',auraIceB:'#c0e8ff',
    shadow:'rgba(0,0,0,.2)',metalA:lighten(c,.55),
  };
}

// ── body ────────────────────────────────────────────────────────────────

function baseBP(){
  switch(state.bodyShape){
    case'tall':return{cx:16,cy:16,rx:10,ry:13,nT:2,nB:2.5};
    case'wide':return{cx:16,cy:19,rx:14,ry:9,nT:2,nB:3.5};
    case'tiny':return{cx:16,cy:22,rx:8,ry:7,nT:2,nB:2.8};
    default:return{cx:16,cy:17,rx:12,ry:11,nT:2,nB:3};
  }
}

function frameBP(fi){
  const b=baseBP(),fr=ANIM_FRAMES[state.animation];
  if(!fr)return b;
  const f=fr[fi%fr.length];
  return{cx:b.cx+(f.ox||0),cy:b.cy+(f.oy||0),rx:Math.round(b.rx*f.sx),ry:Math.round(b.ry*f.sy),nT:b.nT,nB:b.nB};
}

// ── grid ────────────────────────────────────────────────────────────────

function buildGrid(bp){
  const{cx,cy,rx,ry,nT,nB}=bp;
  const raw=Array.from({length:H},()=>Array(W).fill(0));
  const clip=Math.min(cy+ry,H-4);
  for(let y=0;y<H;y++){if(y>clip)continue;for(let x=0;x<W;x++){
    const dx=Math.abs((x+.5-cx)/rx),dy=(y+.5-cy)/ry,n=dy<0?nT:nB;
    if(Math.pow(dx,n)+Math.pow(Math.abs(dy),n)<1)raw[y][x]=1;
  }}
  let bL=W,bR=0,bT=H,bB=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(raw[y][x]){if(x<bL)bL=x;if(x>bR)bR=x;if(y<bT)bT=y;if(y>bB)bB=y;}
  const bW=Math.max(1,bR-bL),bH=Math.max(1,bB-bT);
  const g=raw.map(r=>r.map(v=>v?'s3':null));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(!raw[y][x])continue;
    const br=1-((x-bL)/bW*.55+(y-bT)/bH*.45);
    g[y][x]=br>.78?'s5':br>.58?'s4':br>.38?'s3':br>.2?'s2':'s1';
  }
  const hlx=cx-rx*.3,hly=cy-ry*.35,hlr=Math.max(2,rx*.2),hlry2=Math.max(2,ry*.18);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(!g[y][x])continue;
    const dx2=(x+.5-hlx)/hlr,dy2=(y+.5-hly)/hlry2;
    if(dx2*dx2+dy2*dy2<1)g[y][x]='shine';
  }

  // patterns
  if(state.bodyPattern==='stripes'){
    for(let y=bT;y<=bB;y++)if((y-bT)%3===0)for(let x=bL;x<=bR;x++)if(g[y][x]&&g[y][x]!=='outline'&&g[y][x]!=='shine')g[y][x]='pat';
  }else if(state.bodyPattern==='spots'){
    for(let y=bT+1;y<bB;y++)for(let x=bL+1;x<bR;x++)if((x*7+y*13)%11===0&&g[y][x]&&g[y][x]!=='outline'&&g[y][x]!=='shine')g[y][x]='pat';
  }else if(state.bodyPattern==='bicolor'){
    const sp=bT+Math.round((bB-bT)*.55);
    for(let y=sp;y<=bB;y++)for(let x=0;x<W;x++)if(g[y][x]&&g[y][x]!=='outline'&&g[y][x]!=='shine')g[y][x]='pat';
  }

  // metallic
  if(state.bodyTexture==='metallic')for(let y=bT+2;y<bB-1;y+=3)for(let x=bL+2;x<bR-1;x+=4)if(g[y][x]&&g[y][x]!=='outline')g[y][x]='metalA';

  // outline
  if(state.outlineStyle!=='none')for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(!g[y][x])continue;
    for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H||!raw[ny][nx]){g[y][x]='outline';break;}}
  }

  const eyeY=Math.round(cy-ry*.18),gap=Math.max(2,Math.round(rx*.28));
  const info={cx,cy,rx,ry,bT,bB,bL,bR,eL:{x:cx-gap-1,y:eyeY},eR:{x:cx+gap,y:eyeY},mo:{x:cx,y:Math.round(cy+ry*.15)}};
  paintCheeks(g,info);paintEyes(g,info);paintMouth(g,info);
  paintHeadTop(g,info);paintHeadwear(g,info);paintWings(g,info);
  return{g,info,raw};
}

function px(g,x,y,c){if(x>=0&&y>=0&&x<W&&y<H)g[y][x]=c;}

// ── features (same as before, compact) ──────────────────────────────────

const EYE={classic:[[0,0,'eye'],[1,0,'eyeW'],[0,1,'eye'],[1,1,'eye']],round:[[0,0,'eye'],[1,0,'eye'],[0,1,'eye'],[1,1,'eyeW']],dot:[[0,0,'eye']],sleepy:[[0,0,'eye'],[1,0,'eye'],[2,0,'eye']],star:[[1,0,'eye'],[0,1,'eye'],[1,1,'eye'],[2,1,'eye'],[1,2,'eye']],heart:[[0,0,'heart'],[2,0,'heart'],[0,1,'heart'],[1,1,'heart'],[2,1,'heart'],[1,2,'heart']],dead:[[0,0,'eye'],[2,0,'eye'],[1,1,'eye'],[0,2,'eye'],[2,2,'eye']],sparkle:[[0,0,'eyeW'],[1,0,'eye'],[0,1,'eye'],[1,1,'eyeW']]};
const EYE_A={angry:{l:[[1,0,'eye'],[0,1,'eye'],[1,1,'eye'],[0,2,'eye']],r:[[0,0,'eye'],[0,1,'eye'],[1,1,'eye'],[1,2,'eye']]},wink:{l:EYE.classic,r:[[0,0,'eye'],[1,0,'eye']]}};
function paintEyes(g,i){const s=EYE[state.eyes],a=EYE_A[state.eyes];if(!s&&!a)return;const p=(an,px2)=>{for(const[dx,dy,c]of px2)px(g,an.x+dx,an.y+dy,c);};if(a){p(i.eL,a.l);p(i.eR,a.r);}else{p(i.eL,s);p(i.eR,s);}}
const MO={smile:[[-1,0,'mouth'],[0,1,'mouth'],[1,1,'mouth'],[2,0,'mouth']],open:[[0,0,'mouth'],[1,0,'mouth'],[0,1,'mouthIn'],[1,1,'tongue'],[0,2,'mouth'],[1,2,'mouth']],smirk:[[-1,1,'mouth'],[0,0,'mouth'],[1,0,'mouth'],[2,-1,'mouth']],frown:[[-1,1,'mouth'],[0,0,'mouth'],[1,0,'mouth'],[2,1,'mouth']],tongue:[[-1,0,'mouth'],[0,1,'mouth'],[1,1,'mouth'],[2,0,'mouth'],[0,2,'tongue'],[1,2,'tongue']],o:[[0,0,'mouth'],[1,0,'mouth'],[0,1,'mouth'],[1,1,'mouth']],cat:[[-1,0,'mouth'],[0,1,'mouth'],[1,0,'mouth'],[2,1,'mouth'],[3,0,'mouth']],teeth:[[0,0,'mouth'],[1,0,'mouth'],[0,1,'eyeW'],[1,1,'eyeW'],[0,2,'mouth'],[1,2,'mouth']]};
function paintMouth(g,i){const d=MO[state.mouth];if(!d)return;for(const[dx,dy,c]of d)px(g,i.mo.x+dx,i.mo.y+dy,c);}
function paintCheeks(g,i){const sp=Math.round(i.rx*.5),cy=i.eL.y+3;if(state.cheeks==='blush'){px(g,i.cx-sp,cy,'cheek');px(g,i.cx-sp+1,cy,'cheek');px(g,i.cx+sp-1,cy,'cheek');px(g,i.cx+sp,cy,'cheek');}else if(state.cheeks==='freckles'){px(g,i.cx-sp,cy,'freckle');px(g,i.cx-sp+1,cy+1,'freckle');px(g,i.cx+sp,cy,'freckle');px(g,i.cx+sp-1,cy+1,'freckle');}else if(state.cheeks==='tears'){for(let d=0;d<3;d++){px(g,i.eL.x,i.eL.y+2+d,'tear');px(g,i.eR.x+1,i.eR.y+2+d,'tear');}}}
function paintHeadTop(g,i){const t=i.bT,cx=i.cx;if(state.headTop==='leaf'){px(g,cx+1,t-4,'leafD');px(g,cx,t-3,'leaf');px(g,cx+1,t-3,'leafD');px(g,cx-1,t-2,'leaf');px(g,cx,t-2,'leaf');px(g,cx,t-1,'leafD');}else if(state.headTop==='droplet'){px(g,cx-2,t-2,'droplet');px(g,cx,t-3,'dropletW');px(g,cx+2,t-2,'droplet');}else if(state.headTop==='spike'){px(g,cx,t-4,'spike');px(g,cx,t-3,'spikeW');px(g,cx-1,t-2,'spike');px(g,cx,t-2,'spikeW');px(g,cx+1,t-2,'spike');px(g,cx,t-1,'spike');}else if(state.headTop==='antenna'){px(g,cx,t-4,'antennaT');px(g,cx+1,t-4,'antennaT');px(g,cx,t-3,'antenna');px(g,cx,t-2,'antenna');px(g,cx,t-1,'antenna');}}
function paintHeadwear(g,i){const t=i.bT,cx=i.cx,rx=i.rx,hw=state.headwear;if(hw==='none')return;if(hw==='bow'){const bx=cx+rx-2;px(g,bx-1,t,'bow');px(g,bx,t,'bowD');px(g,bx+1,t,'bow');px(g,bx-1,t+1,'bow');px(g,bx+1,t+1,'bow');}else if(hw==='crown'){for(let d=-4;d<=4;d++)px(g,cx+d,t,d%2?'crown':'crownD');for(let d=-3;d<=3;d++)px(g,cx+d,t-1,d%2?'crown':'crownD');px(g,cx-3,t-2,'crown');px(g,cx,t-2,'gem');px(g,cx+3,t-2,'crown');}else if(hw==='witch'){for(let d=-5;d<=5;d++)px(g,cx+d,t,'witchD');for(let d=-4;d<=4;d++)px(g,cx+d,t-1,'witch');for(let d=-4;d<=4;d++)px(g,cx+d,t-2,'witchB');for(let d=-3;d<=3;d++)px(g,cx+d,t-3,'witch');for(let d=-2;d<=2;d++)px(g,cx+d,t-4,'witch');for(let d=-1;d<=1;d++)px(g,cx+d,t-5,'witch');px(g,cx,t-6,'witch');px(g,cx+2,t-4,'witchStar');}else if(hw==='santa'){for(let d=-5;d<=5;d++)px(g,cx+d,t,'santaW');for(let d=-4;d<=4;d++)px(g,cx+d,t-1,'santa');for(let d=-3;d<=3;d++)px(g,cx+d,t-2,'santa');for(let d=-2;d<=2;d++)px(g,cx+d,t-3,'santaD');for(let d=-1;d<=1;d++)px(g,cx+d,t-4,'santaD');px(g,cx,t-5,'santaD');px(g,cx+4,t-4,'santaW');px(g,cx+5,t-5,'santaW');}else if(hw==='party'){for(let d=-4;d<=4;d++)px(g,cx+d,t,'partyR');for(let d=-3;d<=3;d++)px(g,cx+d,t-1,d%2?'party':'partyB');for(let d=-2;d<=2;d++)px(g,cx+d,t-2,d%2?'partyC':'party');for(let d=-1;d<=1;d++)px(g,cx+d,t-3,'partyB');px(g,cx,t-4,'partyR');}else if(hw==='mushroom'){for(let d=-4;d<=4;d++)px(g,cx+d,t-1,'mush');for(let d=-3;d<=3;d++)px(g,cx+d,t-2,'mush');for(let d=-2;d<=2;d++)px(g,cx+d,t-3,'mush');px(g,cx-2,t-2,'mushD');px(g,cx+1,t-2,'mushD');px(g,cx-1,t,'mushS');px(g,cx,t,'mushS');px(g,cx+1,t,'mushS');}else if(hw==='flower'){const fx=cx-rx+1;px(g,fx,t,'petal');px(g,fx+1,t,'petal');px(g,fx-1,t+1,'petal');px(g,fx,t+1,'petalC');px(g,fx+1,t+1,'petalC');px(g,fx+2,t+1,'petal');px(g,fx,t+2,'petal');px(g,fx+1,t+2,'petal');}else if(hw==='halo'){for(let d=-4;d<=4;d++){px(g,cx+d,t-3,'halo');px(g,cx+d,t-1,'halo');}px(g,cx-5,t-2,'haloD');px(g,cx+5,t-2,'haloD');}else if(hw==='headphones'){for(let d=-rx;d<=rx;d++)px(g,cx+d,t-1,'hpB');for(let d=-rx+1;d<=rx-1;d++)px(g,cx+d,t-2,'hpB');for(let d2=0;d2<2;d2++){px(g,i.bL-1,i.eL.y+d2,'hpC');px(g,i.bL-2,i.eL.y+d2,'hpC');px(g,i.bR+1,i.eR.y+d2,'hpC');px(g,i.bR+2,i.eR.y+d2,'hpC');}}}
function paintWings(g,i){if(state.wings==='none')return;const cy=i.cy-2,lx=i.bL,rx2=i.bR;if(state.wings==='angel'){px(g,lx-1,cy,'wingW');px(g,lx-2,cy,'wingW');px(g,lx-3,cy-1,'wingW');px(g,lx-1,cy-1,'wingD');px(g,lx-2,cy-1,'wingW');px(g,lx-1,cy+1,'wingD');px(g,rx2+1,cy,'wingW');px(g,rx2+2,cy,'wingW');px(g,rx2+3,cy-1,'wingW');px(g,rx2+1,cy-1,'wingD');px(g,rx2+2,cy-1,'wingW');px(g,rx2+1,cy+1,'wingD');}else if(state.wings==='demon'){px(g,lx-1,cy,'wingDk');px(g,lx-2,cy,'wingDkL');px(g,lx-3,cy-1,'wingDk');px(g,lx-4,cy-2,'wingDk');px(g,lx-1,cy+1,'wingDk');px(g,lx-2,cy-1,'wingDk');px(g,rx2+1,cy,'wingDk');px(g,rx2+2,cy,'wingDkL');px(g,rx2+3,cy-1,'wingDk');px(g,rx2+4,cy-2,'wingDk');px(g,rx2+1,cy+1,'wingDk');px(g,rx2+2,cy-1,'wingDk');}}

// ── effects + aura ──────────────────────────────────────────────────────

function buildOverlays(info,fi){
  const eg=Array.from({length:H},()=>Array(W).fill(null));
  // expression effects
  const e=state.effect,i=info;
  if(e==='sparkles'){const pts=[[3,5],[i.bR+2,i.bT-1],[i.bR+3,i.bT+6]];for(const[sx,sy]of pts){px(eg,sx,sy-1,'effA');px(eg,sx-1,sy,'effA');px(eg,sx,sy,'effA');px(eg,sx+1,sy,'effA');px(eg,sx,sy+1,'effA');}}
  else if(e==='hearts'){const d=(sx,sy)=>{px(eg,sx,sy,'effB');px(eg,sx+2,sy,'effB');px(eg,sx,sy+1,'effB');px(eg,sx+1,sy+1,'effB');px(eg,sx+2,sy+1,'effB');px(eg,sx+1,sy+2,'effB');};d(i.bR+1,i.bT-2);d(2,i.bT+1);}
  else if(e==='music'){const d=(sx,sy)=>{px(eg,sx+1,sy,'effA');px(eg,sx+1,sy+1,'effA');px(eg,sx,sy+2,'effA');px(eg,sx,sy+3,'effA');};d(i.bR+1,i.bT-3);d(i.bR+3,i.bT);}
  else if(e==='zzz'){px(eg,i.bR+1,i.bT-4,'effD');px(eg,i.bR+2,i.bT-4,'effD');px(eg,i.bR+3,i.bT-4,'effD');px(eg,i.bR+2,i.bT-3,'effD');px(eg,i.bR+1,i.bT-2,'effD');px(eg,i.bR+2,i.bT-2,'effD');px(eg,i.bR+3,i.bT-2,'effD');px(eg,i.bR+3,i.bT,'effD');px(eg,i.bR+4,i.bT,'effD');px(eg,i.bR+4,i.bT+1,'effD');px(eg,i.bR+3,i.bT+1,'effD');}
  else if(e==='anger'){const sx=i.bR-1,sy=i.bT;px(eg,sx,sy,'effB');px(eg,sx+2,sy,'effB');px(eg,sx+1,sy+1,'effB');px(eg,sx,sy+2,'effB');px(eg,sx+2,sy+2,'effB');}
  else if(e==='sweat'){const sx=i.bR+1,sy=i.bT;px(eg,sx,sy,'effC');px(eg,sx,sy+1,'effC');px(eg,sx,sy+2,'effC');}
  else if(e==='question'){const sx=i.cx+1,sy=i.bT-5;px(eg,sx,sy,'effD');px(eg,sx+1,sy,'effD');px(eg,sx+1,sy+1,'effD');px(eg,sx,sy+2,'effD');px(eg,sx,sy+4,'effD');}

  // aura (flickers per frame)
  if(state.aura!=='none'){
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      if(info.raw&&info.raw[y]&&info.raw[y][x])continue;
      let adj=false;
      for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]]){
        const nx=x+dx,ny=y+dy;
        if(nx>=0&&ny>=0&&nx<W&&ny<H&&info.raw&&info.raw[ny]&&info.raw[ny][nx]){adj=true;break;}
      }
      if(!adj)continue;
      const h=(x*7+y*13+fi*5)%9;
      if(state.aura==='holy'&&h<2) px(eg,x,y,'auraHoly');
      else if(state.aura==='dark'&&h<3) px(eg,x,y,'auraDark');
      else if(state.aura==='fire'&&y>info.cy&&h<2){px(eg,x,y,'auraFire');if(y>0&&!eg[y-1][x])px(eg,x,y-1,'auraFireB');}
      else if(state.aura==='ice'&&h<2) px(eg,x,y,'auraIce');
    }
  }
  return eg;
}

// ── render ──────────────────────────────────────────────────────────────

function renderSVG(gd,eg){
  const{g,info}=gd;const c=pal();const ghost=state.bodyTexture==='ghost'?'0.55':'1';
  const lay=document.getElementById('bodyLayer');while(lay.firstChild)lay.removeChild(lay.firstChild);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=g[y][x];if(!k)continue;const color=c[k];if(!color)continue;const r=document.createElementNS(SVG_NS,'rect');r.setAttribute('x',x);r.setAttribute('y',y);r.setAttribute('width',1);r.setAttribute('height',1);r.setAttribute('fill',color);if(ghost!=='1'&&!['outline','eye','eyeW','mouth','mouthIn','tongue'].includes(k))r.setAttribute('opacity',ghost);lay.appendChild(r);}
  const el2=document.getElementById('effectLayer');while(el2.firstChild)el2.removeChild(el2.firstChild);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=eg[y][x];if(!k)continue;const color=c[k];if(!color)continue;const r=document.createElementNS(SVG_NS,'rect');r.setAttribute('x',x);r.setAttribute('y',y);r.setAttribute('width',1);r.setAttribute('height',1);r.setAttribute('fill',color);el2.appendChild(r);}
  // shadow
  const sl=document.getElementById('shadowLayer');while(sl.firstChild)sl.removeChild(sl.firstChild);
  const base=baseBP(),shCy=base.cy+base.ry+2,shRx=Math.round(base.rx*.65);
  for(let x=base.cx-shRx;x<=base.cx+shRx;x++){const r=document.createElementNS(SVG_NS,'rect');r.setAttribute('x',x);r.setAttribute('y',shCy);r.setAttribute('width',1);r.setAttribute('height',1);r.setAttribute('fill',c.shadow);sl.appendChild(r);}
  // bg
  renderBG();
}

function ensureGrad(id,colors){
  const defs=document.querySelector('#poporing defs');
  let el=document.getElementById(id);
  if(!el){el=document.createElementNS(SVG_NS,'linearGradient');el.id=id;el.setAttribute('x1','0');el.setAttribute('y1','0');el.setAttribute('x2','0');el.setAttribute('y2','1');defs.appendChild(el);}
  el.innerHTML='';
  colors.forEach((c,i)=>{const s=document.createElementNS(SVG_NS,'stop');s.setAttribute('offset',i===0?'0%':'100%');s.setAttribute('stop-color',c);el.appendChild(s);});
}

function renderBG(){
  const bg=document.getElementById('bgRect');
  if(state.bgPreset==='transparent') bg.setAttribute('fill','url(#checker)');
  else if(state.bgPreset==='solid') bg.setAttribute('fill',state.bgColor);
  else if(BG_GRAD[state.bgPreset]){ensureGrad('bgGrad',BG_GRAD[state.bgPreset]);bg.setAttribute('fill','url(#bgGrad)');}
  else bg.setAttribute('fill',BG_SOLID[state.bgPreset]||state.bgColor);
}

function renderFrame(idx){
  const bp=frameBP(idx);const gd=buildGrid(bp);const eg=buildOverlays(gd.info,idx);
  renderSVG(gd,eg);
  const frames=ANIM_FRAMES[state.animation];const total=frames?frames.length:1;
  document.getElementById('frameInfo').textContent=`FRAME ${(idx%total)+1}/${total}`;
}

function startAnim(){stopAnim();animFrame=0;renderFrame(0);const fr=ANIM_FRAMES[state.animation];if(!fr)return;const sp=ANIM_SPEED[state.animation]||200;animTimer=setInterval(()=>{animFrame=(animFrame+1)%fr.length;renderFrame(animFrame);},sp);}
function stopAnim(){if(animTimer){clearInterval(animTimer);animTimer=null;}animFrame=0;}
function render(){startAnim();}

// ── canvas helper ───────────────────────────────────────────────────────

function gridToCanvas(gd,eg,scale,withBG){
  const cv=document.createElement('canvas');cv.width=W*scale;cv.height=H*scale;
  const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;const c=pal();const ghost=state.bodyTexture==='ghost'?.55:1;

  // bg
  if(withBG){
    if(state.bgPreset!=='transparent'){
      const bgCol=BG_SOLID[state.bgPreset];
      const bgGr=BG_GRAD[state.bgPreset];
      if(bgGr){
        const gr=ctx.createLinearGradient(0,0,0,H*scale);
        gr.addColorStop(0,bgGr[0]);gr.addColorStop(1,bgGr[1]);
        ctx.fillStyle=gr;
      }else{ctx.fillStyle=bgCol||state.bgColor;}
      ctx.fillRect(0,0,W*scale,H*scale);
    }
  }

  // shadow
  const base=baseBP(),shCy=base.cy+base.ry+2,shRx=Math.round(base.rx*.65);
  ctx.fillStyle=c.shadow;
  for(let x=base.cx-shRx;x<=base.cx+shRx;x++) ctx.fillRect(x*scale,shCy*scale,scale,scale);

  // body
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const k=gd.g[y][x];if(!k)continue;const color=c[k];if(!color)continue;
    ctx.globalAlpha=(ghost<1&&!['outline','eye','eyeW','mouth','mouthIn','tongue'].includes(k))?ghost:1;
    ctx.fillStyle=color;ctx.fillRect(x*scale,y*scale,scale,scale);
  }
  ctx.globalAlpha=1;

  // effects
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const k=eg[y][x];if(!k)continue;const color=c[k];if(!color)continue;
    ctx.fillStyle=color;ctx.fillRect(x*scale,y*scale,scale,scale);
  }
  return cv;
}

// ── exports ─────────────────────────────────────────────────────────────

function dl(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);}

function exportPNG(){
  const gd=buildGrid(frameBP(0));const eg=buildOverlays(gd.info,0);
  gridToCanvas(gd,eg,20,true).toBlob(b=>dl(b,`${(state.name||'poporing').replace(/\s+/g,'_')}.png`),'image/png');
}

function exportSheet(){
  const fr=ANIM_FRAMES[state.animation]||[{sx:1,sy:1,ox:0,oy:0}];const S=8,fw=W*S,fh=H*S;
  const cv=document.createElement('canvas');cv.width=fw*fr.length;cv.height=fh;const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
  fr.forEach((_,idx)=>{const gd=buildGrid(frameBP(idx));const eg=buildOverlays(gd.info,idx);const f=gridToCanvas(gd,eg,S,false);ctx.drawImage(f,idx*fw,0);});
  cv.toBlob(b=>dl(b,`${(state.name||'poporing').replace(/\s+/g,'_')}_sheet.png`),'image/png');
}

function exportGIF(){
  const fr=ANIM_FRAMES[state.animation]||[{sx:1,sy:1,ox:0,oy:0}];
  const S=10;const gw=W*S,gh=H*S;
  const gifFrames=[];
  for(let idx=0;idx<fr.length;idx++){
    const gd=buildGrid(frameBP(idx));const eg=buildOverlays(gd.info,idx);
    const cv=gridToCanvas(gd,eg,S,state.bgPreset!=='transparent');
    const ctx=cv.getContext('2d');
    gifFrames.push(ctx.getImageData(0,0,gw,gh).data);
  }
  const speed=ANIM_SPEED[state.animation]||200;
  const blob=buildGIF(gifFrames.map(d=>new Uint8Array(d.buffer)),gw,gh,speed);
  dl(blob,`${(state.name||'poporing').replace(/\s+/g,'_')}.gif`);
}

function exportJSON(){dl(new Blob([JSON.stringify({v:6,...state},null,2)],{type:'application/json'}),`${(state.name||'poporing').replace(/\s+/g,'_')}.json`);}

function loadJSON(e){
  const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{const d=JSON.parse(r.result);for(const k of Object.keys(DEFAULTS))if(k in d)state[k]=d[k];syncUI();render();}catch(err){alert('Invalid JSON');}};
  r.readAsText(f);e.target.value='';
}

// ── URL sharing ─────────────────────────────────────────────────────────

function encodeState(){return btoa(JSON.stringify(state));}

function loadFromURL(){
  const h=window.location.hash.slice(1);if(!h)return;
  try{const d=JSON.parse(atob(h));for(const k of Object.keys(DEFAULTS))if(k in d)state[k]=d[k];}catch(e){}
}

function share(){
  const url=window.location.origin+window.location.pathname+'#'+encodeState();
  navigator.clipboard.writeText(url).then(()=>{
    const btn=document.getElementById('shareBtn');
    btn.textContent='COPIED!';setTimeout(()=>{btn.textContent='SHARE';},1500);
  }).catch(()=>{prompt('Copy this URL:',url);});
}

// ── UI ──────────────────────────────────────────────────────────────────

function mark(c,v){c.querySelectorAll('.chip').forEach(b=>b.classList.toggle('active',b.dataset.value===v));}

function syncUI(){
  document.getElementById('bodyColor').value=state.bodyColor;
  document.getElementById('bgColor').value=state.bgColor;
  document.getElementById('nameInput').value=state.name;
  document.querySelectorAll('.chips').forEach(c=>mark(c,state[c.dataset.field]));
}

function buildChips(){
  document.querySelectorAll('.chips').forEach(c=>{
    const f=c.dataset.field,opts=CHIP_OPTS[f]||[];c.innerHTML='';
    opts.forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.className='chip';b.textContent=label;b.dataset.value=id;b.addEventListener('click',()=>{state[f]=id;mark(c,id);render();});c.appendChild(b);});
    mark(c,state[f]);
  });
}

function buildSwatches(){
  const box=document.getElementById('swatches');box.innerHTML='';
  BODY_SWATCHES.forEach(color=>{const b=document.createElement('button');b.type='button';b.style.background=color;b.title=color;b.addEventListener('click',()=>{state.bodyColor=color;document.getElementById('bodyColor').value=color;render();});box.appendChild(b);});
}

function buildPresets(){
  const box=document.getElementById('presets');box.innerHTML='';
  for(const name in PRESETS){const b=document.createElement('button');b.type='button';b.className='preset-btn';b.textContent=name;b.addEventListener('click',()=>{Object.assign(state,PRESETS[name]);syncUI();render();});box.appendChild(b);}
}

function wireTabs(){document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.panel').forEach(x=>x.classList.add('hidden'));t.classList.add('active');document.getElementById('panel-'+t.dataset.tab).classList.remove('hidden');}));}

function wire(){
  document.getElementById('nameInput').addEventListener('input',e=>{state.name=e.target.value;});
  document.getElementById('bodyColor').addEventListener('input',e=>{state.bodyColor=e.target.value;render();});
  document.getElementById('bgColor').addEventListener('input',e=>{state.bgColor=e.target.value;state.bgPreset='solid';const c=document.querySelector('[data-field="bgPreset"]');if(c)mark(c,'solid');render();});
  document.getElementById('randomBtn').addEventListener('click',randomize);
  document.getElementById('resetBtn').addEventListener('click',reset);
  document.getElementById('pngBtn').addEventListener('click',exportPNG);
  document.getElementById('sheetBtn').addEventListener('click',exportSheet);
  document.getElementById('gifBtn').addEventListener('click',exportGIF);
  document.getElementById('jsonBtn').addEventListener('click',exportJSON);
  document.getElementById('shareBtn').addEventListener('click',share);
  document.getElementById('loadJson').addEventListener('change',loadJSON);
}

function pick(a){return a[Math.floor(Math.random()*a.length)];}
function randomize(){state.bodyColor=pick(BODY_SWATCHES);for(const k of Object.keys(CHIP_OPTS))state[k]=pick(CHIP_OPTS[k])[0];if(state.bgPreset==='solid')state.bgColor=pick(['#181830','#0a0e27','#88c8e8','#e8a0c0']);syncUI();render();}
function reset(){Object.assign(state,DEFAULTS);syncUI();render();}

// ── init ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded',()=>{
  loadFromURL();
  buildSwatches();buildChips();buildPresets();wireTabs();wire();syncUI();render();
});
