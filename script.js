// ========================================================================
// Poporing Maker v8 — body FX, bubbles, evolve, sticker, harmony, seasons
// ========================================================================
const SVG_NS='http://www.w3.org/2000/svg',W=32,H=32;

// ── GIF encoder (compact) ───────────────────────────────────────────────
function lzwE(idx,mcs){const cc=1<<mcs,eoi=cc+1;let cs=mcs+1,nc=eoi+1,t=new Map();for(let i=0;i<cc;i++)t.set(String(i),i);const o=[];let buf=0,bits=0;const em=(c,s)=>{buf|=c<<bits;bits+=s;while(bits>=8){o.push(buf&0xff);buf>>=8;bits-=8;}};em(cc,cs);let cur=String(idx[0]);for(let i=1;i<idx.length;i++){const n=cur+','+idx[i];if(t.has(n))cur=n;else{em(t.get(cur),cs);if(nc<4096){t.set(n,nc++);if(nc>(1<<cs)&&cs<12)cs++;}else{em(cc,cs);t=new Map();for(let j=0;j<cc;j++)t.set(String(j),j);nc=eoi+1;cs=mcs+1;}cur=String(idx[i]);}}em(t.get(cur),cs);em(eoi,cs);if(bits>0)o.push(buf&0xff);return o;}
function mkGIF(frames,w,h,dms){const cm=new Map();cm.set('0,0,0,0',0);let ci=1;for(const f of frames)for(let i=0;i<f.length;i+=4){if(f[i+3]<128)continue;const k=`${f[i]},${f[i+1]},${f[i+2]}`;if(!cm.has(k)&&ci<256)cm.set(k,ci++);}const pb=Math.max(2,Math.ceil(Math.log2(Math.max(4,ci)))),ps=1<<pb,gct=new Uint8Array(ps*3);for(const[k,i]of cm){if(!i)continue;const[r,g,b]=k.split(',').map(Number);gct[i*3]=r;gct[i*3+1]=g;gct[i*3+2]=b;}const o=[];const wb=(...b)=>o.push(...b),ws=s=>{for(let i=0;i<s.length;i++)o.push(s.charCodeAt(i));},w16=v=>wb(v&0xff,(v>>8)&0xff);ws('GIF89a');w16(w);w16(h);wb(0x80|((pb-1)&7)|(((pb-1)&7)<<4));wb(0);wb(0);for(let i=0;i<gct.length;i++)o.push(gct[i]);wb(0x21,0xff,11);ws('NETSCAPE2.0');wb(3,1);w16(0);wb(0);const dl2=Math.round(dms/10);for(const f of frames){wb(0x21,0xf9,4,0x09);w16(dl2);wb(0,0);wb(0x2c);w16(0);w16(0);w16(w);w16(h);wb(0);const ix=new Uint8Array(w*h);for(let i=0;i<w*h;i++){const p=i*4;if(f[p+3]<128)ix[i]=0;else{const k=`${f[p]},${f[p+1]},${f[p+2]}`;ix[i]=cm.get(k)||0;}}const mc=Math.max(2,pb),lzw=lzwE(ix,mc);wb(mc);let pos=0;while(pos<lzw.length){const bs=Math.min(255,lzw.length-pos);wb(bs);for(let i=0;i<bs;i++)o.push(lzw[pos+i]);pos+=bs;}wb(0);}wb(0x3b);return new Blob([new Uint8Array(o)],{type:'image/gif'});}

// ── animation ───────────────────────────────────────────────────────────
const AF={idle:[{sx:1,sy:1,ox:0,oy:0},{sx:1.07,sy:.9,ox:0,oy:1},{sx:1,sy:1,ox:0,oy:0},{sx:.93,sy:1.07,ox:0,oy:-1}],walk:[{sx:1,sy:1,ox:0,oy:0},{sx:.95,sy:1.05,ox:1,oy:-1},{sx:1,sy:1,ox:2,oy:0},{sx:1.05,sy:.93,ox:1,oy:1}],attack:[{sx:1.06,sy:.9,ox:0,oy:1},{sx:.88,sy:1.14,ox:0,oy:-3},{sx:.88,sy:1.1,ox:0,oy:-2},{sx:1.14,sy:.84,ox:0,oy:2},{sx:1,sy:1,ox:0,oy:0}],hurt:[{sx:1.08,sy:.92,ox:-1,oy:0},{sx:.95,sy:1.02,ox:1,oy:0},{sx:1.06,sy:.94,ox:-1,oy:0},{sx:1,sy:1,ox:0,oy:0}]};
const AS={idle:200,walk:160,attack:130,hurt:110};
let aTimer=null,aFrame=0;

// ── state ───────────────────────────────────────────────────────────────
const DEFAULTS={name:'Poppy',bodyColor:'#a6c081',bodyShape:'tiny',bodyTexture:'normal',bodyPattern:'none',bodyFx:'none',eyes:'classic',mouth:'smile',cheeks:'none',aura:'none',bubble:'none',headTop:'leaf',headwear:'none',ears:'none',wings:'none',heldItem:'none',effect:'none',outlineStyle:'classic',bgPreset:'transparent',bgColor:'#181830',scene:'none',animation:'idle'};
const state={...DEFAULTS};

const SWATCHES=['#a6c081','#6a9a5a','#d4e8a0','#f0a0b0','#e06888','#c04870','#f2c94c','#e0a030','#ff8a3c','#80c0f0','#5090d0','#a080e0','#f0e8d8','#a0a0b8','#505060'];
const BG_S={transparent:null,white:'#f0f0f0',navy:'#0a0e27',sky:'#88c8e8',grass:'#306828',sunset:'#d07848',dungeon:'#201030',pink:'#e8a0c0',gray:'#484848',teal:'#206868',black:'#0a0a0a',lavender:'#9088c0'};
const BG_G={'g-sunset':['#f07040','#4a2060'],'g-ocean':['#88d8f0','#183060'],'g-forest':['#88c860','#183818'],'g-magic':['#6040a0','#101040'],'g-dawn':['#f0c080','#304880'],'g-field':['#88c8e8','#58a838'],'g-night':['#101838','#000010'],'g-fire':['#f04020','#301008']};

const PRESETS={Poporing:{bodyColor:'#a6c081',headTop:'leaf',headwear:'none',wings:'none',ears:'none',eyes:'classic',mouth:'smile',bodyTexture:'normal',bodyPattern:'none',aura:'none',heldItem:'none',bodyFx:'none',bubble:'none'},Poring:{bodyColor:'#f0a0b0',headTop:'droplet',headwear:'none',wings:'none',ears:'none',eyes:'round',mouth:'smile',bodyTexture:'normal',bodyPattern:'none',aura:'none',heldItem:'none',bodyFx:'none',bubble:'none'},Drops:{bodyColor:'#f2c94c',headTop:'spike',headwear:'none',wings:'none',ears:'none',eyes:'classic',mouth:'smile',bodyTexture:'normal',bodyPattern:'none',aura:'none',heldItem:'none',bodyFx:'none',bubble:'none'},Marin:{bodyColor:'#80c0f0',headTop:'droplet',headwear:'none',wings:'none',ears:'none',eyes:'round',mouth:'o',bodyTexture:'normal',bodyPattern:'none',aura:'none',heldItem:'none',bodyFx:'ice',bubble:'none'},Angeling:{bodyColor:'#f0e8d8',headTop:'none',headwear:'halo',wings:'angel',ears:'none',eyes:'sparkle',mouth:'smile',bodyTexture:'normal',bodyPattern:'none',aura:'holy',heldItem:'none',bodyFx:'none',bubble:'none'},Ghostring:{bodyColor:'#c8c8d0',headTop:'none',headwear:'none',wings:'none',ears:'none',eyes:'dead',mouth:'o',bodyTexture:'ghost',bodyPattern:'none',aura:'none',heldItem:'none',bodyFx:'none',bubble:'none'},Deviling:{bodyColor:'#505060',headTop:'spike',headwear:'none',wings:'demon',ears:'cat',eyes:'angry',mouth:'teeth',bodyTexture:'normal',bodyPattern:'none',aura:'dark',heldItem:'fork',bodyFx:'none',bubble:'none'},Metaling:{bodyColor:'#a0a0b8',headTop:'antenna',headwear:'none',wings:'none',ears:'none',eyes:'dot',mouth:'frown',bodyTexture:'metallic',bodyPattern:'none',aura:'none',heldItem:'none',bodyFx:'electric',bubble:'none'},Mastering:{bodyColor:'#f0a0b0',headTop:'none',headwear:'crown',wings:'none',ears:'none',eyes:'sparkle',mouth:'smile',bodyTexture:'normal',bodyPattern:'none',aura:'holy',heldItem:'none',bodyFx:'none',bubble:'none',bodyShape:'wide'},SantaPoring:{bodyColor:'#f0a0b0',headTop:'droplet',headwear:'santa',wings:'none',ears:'none',eyes:'round',mouth:'smile',bodyTexture:'normal',bodyPattern:'none',aura:'none',heldItem:'none',bodyFx:'none',bubble:'none'}};

const SEASONAL={Halloween:{bodyColor:'#e08030',headwear:'witch',eyes:'angry',mouth:'teeth',aura:'dark',scene:'none',bodyFx:'fire',bgPreset:'dungeon',headTop:'none',wings:'none',ears:'none',effect:'none',heldItem:'fork',bodyTexture:'normal',bodyPattern:'none',cheeks:'none',bubble:'none'},Christmas:{bodyColor:'#d03030',headwear:'santa',eyes:'sparkle',mouth:'smile',effect:'sparkles',scene:'snow',bgPreset:'navy',headTop:'none',wings:'none',ears:'none',aura:'none',heldItem:'star',bodyFx:'none',bodyTexture:'normal',bodyPattern:'stripes',cheeks:'blush',bubble:'none'},Valentine:{bodyColor:'#f0a0b0',headwear:'bow',eyes:'heart',mouth:'smile',effect:'hearts',wings:'angel',cheeks:'blush',bgPreset:'pink',headTop:'none',ears:'none',aura:'holy',heldItem:'heart',bodyFx:'none',bodyTexture:'normal',bodyPattern:'none',scene:'sakura',bubble:'heart'},Summer:{bodyColor:'#f2c94c',headwear:'flower',eyes:'sparkle',mouth:'smile',scene:'bubbles',bgPreset:'sky',headTop:'none',wings:'none',ears:'none',effect:'none',aura:'none',heldItem:'star',bodyFx:'none',bodyTexture:'normal',bodyPattern:'none',cheeks:'blush',bubble:'none'}};

const EMOTIONS={happy:{eyes:'sparkle',mouth:'smile',cheeks:'blush',effect:'sparkles'},sad:{eyes:'sleepy',mouth:'frown',cheeks:'tears',effect:'none'},angry:{eyes:'angry',mouth:'teeth',cheeks:'none',effect:'anger'},love:{eyes:'heart',mouth:'smile',cheeks:'blush',effect:'hearts'},sleepy:{eyes:'sleepy',mouth:'o',cheeks:'none',effect:'zzz'},shocked:{eyes:'round',mouth:'open',cheeks:'none',effect:'question'},dead:{eyes:'dead',mouth:'o',cheeks:'none',effect:'sweat'}};

const CO={bodyShape:[['round','ROUND'],['tall','TALL'],['wide','WIDE'],['tiny','TINY']],bodyTexture:[['normal','NORMAL'],['ghost','GHOST'],['metallic','METAL']],bodyPattern:[['none','NONE'],['stripes','STRIPE'],['spots','SPOTS'],['bicolor','SPLIT']],bodyFx:[['none','NONE'],['fire','FIRE'],['ice','ICE'],['electric','ELEC']],eyes:[['classic','CLASSIC'],['round','ROUND'],['dot','DOT'],['sleepy','SLEEPY'],['star','STAR'],['heart','HEART'],['dead','KO'],['angry','ANGRY'],['sparkle','SPARKLE'],['wink','WINK']],mouth:[['smile','SMILE'],['open','OPEN'],['smirk','SMIRK'],['frown','FROWN'],['tongue',':P'],['o','O'],['cat',':3'],['teeth','TEETH']],cheeks:[['none','NONE'],['blush','BLUSH'],['freckles','FRECKLE'],['tears','TEARS']],aura:[['none','NONE'],['holy','HOLY'],['dark','DARK'],['fire','FIRE'],['ice','ICE']],bubble:[['none','NONE'],['!','!'],['?','?'],['heart','♥'],['dots','...'],['star','★']],headTop:[['none','NONE'],['leaf','LEAF'],['droplet','DROP'],['spike','SPIKE'],['antenna','ANTENNA']],headwear:[['none','NONE'],['bow','BOW'],['crown','CROWN'],['witch','WITCH'],['santa','SANTA'],['party','PARTY'],['mushroom','MUSH'],['flower','FLOWER'],['halo','HALO'],['headphones','HP']],ears:[['none','NONE'],['cat','CAT'],['bunny','BUNNY'],['bear','BEAR']],wings:[['none','NONE'],['angel','ANGEL'],['demon','DEMON']],heldItem:[['none','NONE'],['sword','SWORD'],['shield','SHIELD'],['staff','STAFF'],['potion','POTION'],['heart','HEART'],['star','STAR'],['fork','FORK']],effect:[['none','NONE'],['sparkles','SPARK'],['hearts','HEART'],['music','MUSIC'],['zzz','ZZZ'],['anger','ANGER'],['sweat','SWEAT'],['question','?']],outlineStyle:[['classic','CLASSIC'],['dark','DARK'],['none','NONE']],bgPreset:[['transparent','TRANS'],['white','WHITE'],['navy','NAVY'],['sky','SKY'],['grass','GRASS'],['sunset','SUNSET'],['dungeon','DUNG'],['pink','PINK'],['gray','GRAY'],['teal','TEAL'],['black','BLACK'],['lavender','LAVNDR'],['g-sunset','SUN▼'],['g-ocean','OCEAN▼'],['g-forest','FRST▼'],['g-magic','MAGC▼'],['g-dawn','DAWN▼'],['g-field','FIELD▼'],['g-night','NGHT▼'],['g-fire','FIRE▼']],scene:[['none','NONE'],['rain','RAIN'],['snow','SNOW'],['stars','STARS'],['sakura','SAKURA'],['bubbles','BUBBLES']],animation:[['none','NONE'],['idle','IDLE'],['walk','WALK'],['attack','ATK'],['hurt','HURT']]};

// ── color ───────────────────────────────────────────────────────────────
const h2r=h=>{const c=h.replace('#','');return[parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)];};
const r2h=(r,g,b)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const lt=(h,a)=>{const[r,g,b]=h2r(h);return r2h(r+(255-r)*a,g+(255-g)*a,b+(255-b)*a);};
const dk=(h,a)=>{const[r,g,b]=h2r(h);return r2h(r*(1-a),g*(1-a),b*(1-a));};
const mkOL=h=>{const[r,g,b]=h2r(h);return r2h(r*.95+10,g*.75+10,b*.8+15);};

function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h,s,l=(mx+mn)/2;if(mx===mn)h=s=0;else{const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);if(mx===r)h=((g-b)/d+(g<b?6:0))/6;else if(mx===g)h=((b-r)/d+2)/6;else h=((r-g)/d+4)/6;}return[h,s,l];}
function hsl2hex(h,s,l){h=((h%1)+1)%1;const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;const f=(t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};return s===0?r2h(l*255,l*255,l*255):r2h(f(h+1/3)*255,f(h)*255,f(h-1/3)*255);}
function harmonyColors(hex){const[r,g,b]=h2r(hex);const[h,s,l]=rgb2hsl(r,g,b);return[hsl2hex(h+.5,s,l),hsl2hex(h+.083,s,l),hsl2hex(h-.083,s,l),hsl2hex(h+.333,s,l),hsl2hex(h-.333,s,l)];}

function pal(){
  const c=state.bodyColor,ol=state.outlineStyle==='dark'?dk(c,.6):state.outlineStyle==='none'?null:mkOL(c);
  return{outline:ol,s1:dk(c,.32),s2:dk(c,.16),s3:c,s4:lt(c,.26),s5:lt(c,.5),shine:lt(c,.78),pat:dk(c,.18),
    eye:'#1a1a22',eyeW:'#fff',heart:'#d84050',mouth:'#1a1a22',mouthIn:'#6a2838',tongue:'#d07088',
    cheek:'#e89098',freckle:dk(c,.35),tear:'#80c0f0',tearW:'#c8e8ff',
    leaf:'#7ac06a',leafD:'#3d7a3a',cherry:'#d03030',cherryW:'#ff8080',stem:'#5a3a20',
    spike:dk(c,.45),spikeW:lt(c,.2),antenna:'#808080',antennaT:'#f0e060',droplet:lt(c,.5),dropletW:'#fff',
    bow:'#e05080',bowD:'#a03060',crown:'#f0c830',crownD:'#b08810',gem:'#4080d0',
    witch:'#4a2070',witchD:'#2a1050',witchB:'#f0c830',witchStar:'#f0e060',
    santa:'#d03030',santaD:'#a02020',santaW:'#fff',party:'#40a0e0',partyB:'#f06080',partyC:'#f0c830',partyR:'#fff',
    petal:'#ffe860',petalC:'#e08030',halo:'#f0e060',haloD:'#c0b030',
    mush:'#d03030',mushD:'#fff',mushS:'#e8d8c0',hpB:'#333',hpC:'#e05080',
    wingW:'#e8e8f0',wingD:'#b0b0c0',wingDk:'#303048',wingDkL:'#484860',
    earA:dk(c,.25),earB:dk(c,.45),
    blade:'#c0c0d0',hilt:'#705830',shieldA:'#a0783c',shieldB:'#c09850',staffW:'#805020',staffT:'#60d0f0',
    potionG:'#50b850',potionB:'#e0d0a0',heartI:'#e05060',starI:'#f0d030',forkA:'#a0a0a0',forkB:'#808080',
    effA:'#f0e060',effB:'#e05060',effC:'#80c0f0',effD:'#fff',
    auraHoly:'#f8e870',auraDark:'#5030a0',auraFire:'#f05020',auraFireB:'#f0a040',auraIce:'#90d8f0',
    fxFire:'#f05020',fxFireB:'#f0a040',fxIce:'#90d8f0',fxIceB:'#c0e8ff',fxElec:'#f0e060',fxElecB:'#ffffa0',
    bubW:'#fff',bubB:'#1a1a22',bubSym:'#e05060',
    shadow:'rgba(0,0,0,.2)',metalA:lt(c,.55),
    scnA:'#88b8e0',scnB:'#e0e8f0',scnC:'#f0c0c8',scnD:'#a0d8f0',
  };
}

// ── body ────────────────────────────────────────────────────────────────
function baseBP(){switch(state.bodyShape){case'tall':return{cx:16,cy:16,rx:10,ry:13,nT:2,nB:2.5};case'wide':return{cx:16,cy:19,rx:14,ry:9,nT:2,nB:3.5};case'tiny':return{cx:16,cy:22,rx:8,ry:7,nT:2,nB:2.8};default:return{cx:16,cy:17,rx:12,ry:11,nT:2,nB:3};}}
function frameBP(fi){const b=baseBP(),fr=AF[state.animation];if(!fr)return b;const f=fr[fi%fr.length];return{cx:b.cx+(f.ox||0),cy:b.cy+(f.oy||0),rx:Math.round(b.rx*f.sx),ry:Math.round(b.ry*f.sy),nT:b.nT,nB:b.nB};}
function px(g,x,y,c){if(x>=0&&y>=0&&x<W&&y<H)g[y][x]=c;}

// ── grid ────────────────────────────────────────────────────────────────
function buildGrid(bp,fi){
  const{cx,cy,rx,ry,nT,nB}=bp;
  const raw=Array.from({length:H},()=>Array(W).fill(0));
  const clip=Math.min(cy+ry,H-4);
  for(let y=0;y<H;y++){if(y>clip)continue;for(let x=0;x<W;x++){const dx=Math.abs((x+.5-cx)/rx),dy=(y+.5-cy)/ry,n=dy<0?nT:nB;if(Math.pow(dx,n)+Math.pow(Math.abs(dy),n)<1)raw[y][x]=1;}}
  let bL=W,bR=0,bT=H,bB=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(raw[y][x]){if(x<bL)bL=x;if(x>bR)bR=x;if(y<bT)bT=y;if(y>bB)bB=y;}
  const bW=Math.max(1,bR-bL),bH=Math.max(1,bB-bT);
  const g=raw.map(r=>r.map(v=>v?'s3':null));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!raw[y][x])continue;const br=1-((x-bL)/bW*.55+(y-bT)/bH*.45);g[y][x]=br>.78?'s5':br>.58?'s4':br>.38?'s3':br>.2?'s2':'s1';}
  const hlx=cx-rx*.3,hly=cy-ry*.35,hlr=Math.max(2,rx*.2),hlry2=Math.max(2,ry*.18);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!g[y][x])continue;const d2=(x+.5-hlx)/hlr,d3=(y+.5-hly)/hlry2;if(d2*d2+d3*d3<1)g[y][x]='shine';}

  // patterns
  if(state.bodyPattern==='stripes')for(let y=bT;y<=bB;y++)if((y-bT)%3===0)for(let x=bL;x<=bR;x++)if(g[y][x]&&g[y][x]!=='shine')g[y][x]='pat';
  else if(state.bodyPattern==='spots')for(let y=bT+1;y<bB;y++)for(let x=bL+1;x<bR;x++)if((x*7+y*13)%11===0&&g[y][x]&&g[y][x]!=='shine')g[y][x]='pat';
  else if(state.bodyPattern==='bicolor'){const sp=bT+Math.round((bB-bT)*.55);for(let y=sp;y<=bB;y++)for(let x=0;x<W;x++)if(g[y][x]&&g[y][x]!=='shine')g[y][x]='pat';}
  if(state.bodyTexture==='metallic')for(let y=bT+2;y<bB-1;y+=3)for(let x=bL+2;x<bR-1;x+=4)if(g[y][x]&&g[y][x]!=='outline')g[y][x]='metalA';

  // body FX
  if(state.bodyFx!=='none'){
    for(let y=bT;y<=bB;y++)for(let x=bL;x<=bR;x++){
      if(!raw[y][x])continue;
      let near=false;for(const[dx2,dy2]of[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]){const nx=x+dx2,ny=y+dy2;if(nx<0||ny<0||nx>=W||ny>=H||!raw[ny][nx]){near=true;break;}}
      if(!near)continue;
      const h2=(x*3+y*7+(fi||0)*5)%7;
      if(state.bodyFx==='fire'&&h2<2)g[y][x]=h2===0?'fxFire':'fxFireB';
      else if(state.bodyFx==='ice'&&h2<2)g[y][x]=h2===0?'fxIce':'fxIceB';
      else if(state.bodyFx==='electric'&&h2<1)g[y][x]='fxElec';
    }
  }

  // outline
  if(state.outlineStyle!=='none')for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!g[y][x])continue;for(const[dx2,dy2]of[[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx2,ny=y+dy2;if(nx<0||ny<0||nx>=W||ny>=H||!raw[ny][nx]){g[y][x]='outline';break;}}}

  const eyeY=Math.round(cy-ry*.18),gap=Math.max(2,Math.round(rx*.28));
  const info={cx,cy,rx,ry,bT,bB,bL,bR,eL:{x:cx-gap-1,y:eyeY},eR:{x:cx+gap,y:eyeY},mo:{x:cx,y:Math.round(cy+ry*.15)},raw};
  paintCheeks(g,info);paintEyes(g,info);paintMouth(g,info);paintHeadTop(g,info);paintHeadwear(g,info);paintEars(g,info);paintWings(g,info);paintHeldItem(g,info);paintBubble(g,info);
  return{g,info};
}

// ── features ────────────────────────────────────────────────────────────
const EYE={classic:[[0,0,'eye'],[1,0,'eyeW'],[0,1,'eye'],[1,1,'eye']],round:[[0,0,'eye'],[1,0,'eye'],[0,1,'eye'],[1,1,'eyeW']],dot:[[0,0,'eye']],sleepy:[[0,0,'eye'],[1,0,'eye'],[2,0,'eye']],star:[[1,0,'eye'],[0,1,'eye'],[1,1,'eye'],[2,1,'eye'],[1,2,'eye']],heart:[[0,0,'heart'],[2,0,'heart'],[0,1,'heart'],[1,1,'heart'],[2,1,'heart'],[1,2,'heart']],dead:[[0,0,'eye'],[2,0,'eye'],[1,1,'eye'],[0,2,'eye'],[2,2,'eye']],sparkle:[[0,0,'eyeW'],[1,0,'eye'],[0,1,'eye'],[1,1,'eyeW']]};
const EYE_A={angry:{l:[[1,0,'eye'],[0,1,'eye'],[1,1,'eye'],[0,2,'eye']],r:[[0,0,'eye'],[0,1,'eye'],[1,1,'eye'],[1,2,'eye']]},wink:{l:EYE.classic,r:[[0,0,'eye'],[1,0,'eye']]}};
function paintEyes(g,i){const s=EYE[state.eyes],a=EYE_A[state.eyes];if(!s&&!a)return;const p=(an,ps)=>{for(const[dx,dy,c]of ps)px(g,an.x+dx,an.y+dy,c);};if(a){p(i.eL,a.l);p(i.eR,a.r);}else{p(i.eL,s);p(i.eR,s);}}
const MO={smile:[[-1,0,'mouth'],[0,1,'mouth'],[1,1,'mouth'],[2,0,'mouth']],open:[[0,0,'mouth'],[1,0,'mouth'],[0,1,'mouthIn'],[1,1,'tongue'],[0,2,'mouth'],[1,2,'mouth']],smirk:[[-1,1,'mouth'],[0,0,'mouth'],[1,0,'mouth'],[2,-1,'mouth']],frown:[[-1,1,'mouth'],[0,0,'mouth'],[1,0,'mouth'],[2,1,'mouth']],tongue:[[-1,0,'mouth'],[0,1,'mouth'],[1,1,'mouth'],[2,0,'mouth'],[0,2,'tongue'],[1,2,'tongue']],o:[[0,0,'mouth'],[1,0,'mouth'],[0,1,'mouth'],[1,1,'mouth']],cat:[[-1,0,'mouth'],[0,1,'mouth'],[1,0,'mouth'],[2,1,'mouth'],[3,0,'mouth']],teeth:[[0,0,'mouth'],[1,0,'mouth'],[0,1,'eyeW'],[1,1,'eyeW'],[0,2,'mouth'],[1,2,'mouth']]};
function paintMouth(g,i){const d=MO[state.mouth];if(!d)return;for(const[dx,dy,c]of d)px(g,i.mo.x+dx,i.mo.y+dy,c);}
function paintCheeks(g,i){const sp=Math.round(i.rx*.5),cy=i.eL.y+3;if(state.cheeks==='blush'){px(g,i.cx-sp,cy,'cheek');px(g,i.cx-sp+1,cy,'cheek');px(g,i.cx+sp-1,cy,'cheek');px(g,i.cx+sp,cy,'cheek');}else if(state.cheeks==='freckles'){px(g,i.cx-sp,cy,'freckle');px(g,i.cx-sp+1,cy+1,'freckle');px(g,i.cx+sp,cy,'freckle');px(g,i.cx+sp-1,cy+1,'freckle');}else if(state.cheeks==='tears'){for(let d=0;d<3;d++){px(g,i.eL.x,i.eL.y+2+d,'tear');px(g,i.eR.x+1,i.eR.y+2+d,'tear');}}}
function paintHeadTop(g,i){const t=i.bT,cx=i.cx;if(state.headTop==='leaf'){px(g,cx+1,t-4,'leafD');px(g,cx,t-3,'leaf');px(g,cx+1,t-3,'leafD');px(g,cx-1,t-2,'leaf');px(g,cx,t-2,'leaf');px(g,cx,t-1,'leafD');}else if(state.headTop==='droplet'){px(g,cx-2,t-2,'droplet');px(g,cx,t-3,'dropletW');px(g,cx+2,t-2,'droplet');}else if(state.headTop==='spike'){px(g,cx,t-4,'spike');px(g,cx,t-3,'spikeW');px(g,cx-1,t-2,'spike');px(g,cx,t-2,'spikeW');px(g,cx+1,t-2,'spike');px(g,cx,t-1,'spike');}else if(state.headTop==='antenna'){px(g,cx,t-4,'antennaT');px(g,cx+1,t-4,'antennaT');px(g,cx,t-3,'antenna');px(g,cx,t-2,'antenna');px(g,cx,t-1,'antenna');}}
function paintHeadwear(g,i){const t=i.bT,cx=i.cx,rx=i.rx,hw=state.headwear;if(hw==='none')return;if(hw==='bow'){const bx=cx+rx-2;px(g,bx-1,t,'bow');px(g,bx,t,'bowD');px(g,bx+1,t,'bow');px(g,bx-1,t+1,'bow');px(g,bx+1,t+1,'bow');}else if(hw==='crown'){for(let d=-4;d<=4;d++)px(g,cx+d,t,d%2?'crown':'crownD');for(let d=-3;d<=3;d++)px(g,cx+d,t-1,d%2?'crown':'crownD');px(g,cx-3,t-2,'crown');px(g,cx,t-2,'gem');px(g,cx+3,t-2,'crown');}else if(hw==='witch'){for(let d=-5;d<=5;d++)px(g,cx+d,t,'witchD');for(let d=-4;d<=4;d++)px(g,cx+d,t-1,'witch');for(let d=-4;d<=4;d++)px(g,cx+d,t-2,'witchB');for(let d=-3;d<=3;d++)px(g,cx+d,t-3,'witch');for(let d=-2;d<=2;d++)px(g,cx+d,t-4,'witch');for(let d=-1;d<=1;d++)px(g,cx+d,t-5,'witch');px(g,cx,t-6,'witch');px(g,cx+2,t-4,'witchStar');}else if(hw==='santa'){for(let d=-5;d<=5;d++)px(g,cx+d,t,'santaW');for(let d=-4;d<=4;d++)px(g,cx+d,t-1,'santa');for(let d=-3;d<=3;d++)px(g,cx+d,t-2,'santa');for(let d=-2;d<=2;d++)px(g,cx+d,t-3,'santaD');for(let d=-1;d<=1;d++)px(g,cx+d,t-4,'santaD');px(g,cx,t-5,'santaD');px(g,cx+4,t-4,'santaW');px(g,cx+5,t-5,'santaW');}else if(hw==='party'){for(let d=-4;d<=4;d++)px(g,cx+d,t,'partyR');for(let d=-3;d<=3;d++)px(g,cx+d,t-1,d%2?'party':'partyB');for(let d=-2;d<=2;d++)px(g,cx+d,t-2,d%2?'partyC':'party');for(let d=-1;d<=1;d++)px(g,cx+d,t-3,'partyB');px(g,cx,t-4,'partyR');}else if(hw==='mushroom'){for(let d=-4;d<=4;d++)px(g,cx+d,t-1,'mush');for(let d=-3;d<=3;d++)px(g,cx+d,t-2,'mush');for(let d=-2;d<=2;d++)px(g,cx+d,t-3,'mush');px(g,cx-2,t-2,'mushD');px(g,cx+1,t-2,'mushD');px(g,cx-1,t,'mushS');px(g,cx,t,'mushS');px(g,cx+1,t,'mushS');}else if(hw==='flower'){const fx=cx-rx+1;px(g,fx,t,'petal');px(g,fx+1,t,'petal');px(g,fx-1,t+1,'petal');px(g,fx,t+1,'petalC');px(g,fx+1,t+1,'petalC');px(g,fx+2,t+1,'petal');px(g,fx,t+2,'petal');px(g,fx+1,t+2,'petal');}else if(hw==='halo'){for(let d=-4;d<=4;d++){px(g,cx+d,t-3,'halo');px(g,cx+d,t-1,'halo');}px(g,cx-5,t-2,'haloD');px(g,cx+5,t-2,'haloD');}else if(hw==='headphones'){for(let d=-rx;d<=rx;d++)px(g,cx+d,t-1,'hpB');for(let d=-rx+1;d<=rx-1;d++)px(g,cx+d,t-2,'hpB');for(let d2=0;d2<2;d2++){px(g,i.bL-1,i.eL.y+d2,'hpC');px(g,i.bL-2,i.eL.y+d2,'hpC');px(g,i.bR+1,i.eR.y+d2,'hpC');px(g,i.bR+2,i.eR.y+d2,'hpC');}}}
function paintEars(g,i){if(state.ears==='none')return;const t=i.bT,lx=i.bL,rx2=i.bR;if(state.ears==='cat'){px(g,lx,t-2,'earA');px(g,lx+1,t-2,'earB');px(g,lx,t-1,'earA');px(g,lx+1,t-1,'earA');px(g,rx2,t-2,'earB');px(g,rx2-1,t-2,'earA');px(g,rx2,t-1,'earA');px(g,rx2-1,t-1,'earA');}else if(state.ears==='bunny'){px(g,lx+1,t-5,'earA');px(g,lx+1,t-4,'earA');px(g,lx+1,t-3,'earA');px(g,lx+1,t-2,'earB');px(g,lx+1,t-1,'earB');px(g,rx2-1,t-5,'earA');px(g,rx2-1,t-4,'earA');px(g,rx2-1,t-3,'earA');px(g,rx2-1,t-2,'earB');px(g,rx2-1,t-1,'earB');}else if(state.ears==='bear'){px(g,lx-1,t,'earA');px(g,lx,t,'earA');px(g,lx-1,t-1,'earA');px(g,lx,t-1,'earB');px(g,rx2+1,t,'earA');px(g,rx2,t,'earA');px(g,rx2+1,t-1,'earA');px(g,rx2,t-1,'earB');}}
function paintWings(g,i){if(state.wings==='none')return;const cy=i.cy-2,lx=i.bL,rx2=i.bR;if(state.wings==='angel'){px(g,lx-1,cy,'wingW');px(g,lx-2,cy,'wingW');px(g,lx-3,cy-1,'wingW');px(g,lx-1,cy-1,'wingD');px(g,lx-2,cy-1,'wingW');px(g,lx-1,cy+1,'wingD');px(g,rx2+1,cy,'wingW');px(g,rx2+2,cy,'wingW');px(g,rx2+3,cy-1,'wingW');px(g,rx2+1,cy-1,'wingD');px(g,rx2+2,cy-1,'wingW');px(g,rx2+1,cy+1,'wingD');}else if(state.wings==='demon'){px(g,lx-1,cy,'wingDk');px(g,lx-2,cy,'wingDkL');px(g,lx-3,cy-1,'wingDk');px(g,lx-4,cy-2,'wingDk');px(g,lx-1,cy+1,'wingDk');px(g,lx-2,cy-1,'wingDk');px(g,rx2+1,cy,'wingDk');px(g,rx2+2,cy,'wingDkL');px(g,rx2+3,cy-1,'wingDk');px(g,rx2+4,cy-2,'wingDk');px(g,rx2+1,cy+1,'wingDk');px(g,rx2+2,cy-1,'wingDk');}}
function paintHeldItem(g,i){const h=state.heldItem;if(h==='none')return;const hx=i.bR+2,hy=i.cy;if(h==='sword'){px(g,hx,hy-3,'blade');px(g,hx,hy-2,'blade');px(g,hx,hy-1,'blade');px(g,hx-1,hy,'hilt');px(g,hx,hy,'hilt');px(g,hx+1,hy,'hilt');px(g,hx,hy+1,'hilt');}else if(h==='shield'){px(g,hx,hy-1,'shieldA');px(g,hx+1,hy-1,'shieldA');px(g,hx,hy,'shieldB');px(g,hx+1,hy,'shieldA');px(g,hx,hy+1,'shieldA');px(g,hx+1,hy+1,'shieldA');}else if(h==='staff'){px(g,hx,hy-3,'staffT');px(g,hx,hy-2,'staffW');px(g,hx,hy-1,'staffW');px(g,hx,hy,'staffW');px(g,hx,hy+1,'staffW');}else if(h==='potion'){px(g,hx,hy-1,'potionB');px(g,hx+1,hy-1,'potionB');px(g,hx,hy,'potionG');px(g,hx+1,hy,'potionG');px(g,hx,hy+1,'potionG');px(g,hx+1,hy+1,'potionB');}else if(h==='heart'){px(g,hx,hy-1,'heartI');px(g,hx+2,hy-1,'heartI');px(g,hx,hy,'heartI');px(g,hx+1,hy,'heartI');px(g,hx+2,hy,'heartI');px(g,hx+1,hy+1,'heartI');}else if(h==='star'){px(g,hx+1,hy-2,'starI');px(g,hx,hy-1,'starI');px(g,hx+1,hy-1,'starI');px(g,hx+2,hy-1,'starI');px(g,hx+1,hy,'starI');}else if(h==='fork'){px(g,hx,hy-3,'forkA');px(g,hx-1,hy-3,'forkA');px(g,hx+1,hy-3,'forkA');px(g,hx,hy-2,'forkB');px(g,hx,hy-1,'forkB');px(g,hx,hy,'forkB');}}

// ── speech bubble ───────────────────────────────────────────────────────
function paintBubble(g,i){
  const b=state.bubble;if(b==='none')return;
  const bx=i.cx-2,by=i.bT-6;
  for(let dx=0;dx<5;dx++)px(g,bx+dx,by,'bubW');
  px(g,bx,by+1,'bubW');px(g,bx+4,by+1,'bubW');
  px(g,bx+1,by+1,'bubW');px(g,bx+2,by+1,'bubW');px(g,bx+3,by+1,'bubW');
  for(let dx=0;dx<5;dx++)px(g,bx+dx,by+2,'bubW');
  px(g,i.cx,by+3,'bubW');
  const sym=b==='heart'||b==='star'?(b==='heart'?'bubSym':'starI'):'bubB';
  if(b==='dots'){px(g,bx+1,by+1,sym);px(g,bx+2,by+1,sym);px(g,bx+3,by+1,sym);}
  else px(g,bx+2,by+1,sym);
}

// ── overlays ────────────────────────────────────────────────────────────
function buildOverlays(info,fi){
  const eg=Array.from({length:H},()=>Array(W).fill(null)),e=state.effect,i=info;
  if(e==='sparkles'){const pts=[[3,5],[i.bR+2,i.bT-1],[i.bR+3,i.bT+6]];for(const[sx,sy]of pts){px(eg,sx,sy-1,'effA');px(eg,sx-1,sy,'effA');px(eg,sx,sy,'effA');px(eg,sx+1,sy,'effA');px(eg,sx,sy+1,'effA');}}
  else if(e==='hearts'){const d=(sx,sy)=>{px(eg,sx,sy,'effB');px(eg,sx+2,sy,'effB');px(eg,sx,sy+1,'effB');px(eg,sx+1,sy+1,'effB');px(eg,sx+2,sy+1,'effB');px(eg,sx+1,sy+2,'effB');};d(i.bR+1,i.bT-2);d(2,i.bT+1);}
  else if(e==='music'){const d=(sx,sy)=>{px(eg,sx+1,sy,'effA');px(eg,sx+1,sy+1,'effA');px(eg,sx,sy+2,'effA');px(eg,sx,sy+3,'effA');};d(i.bR+1,i.bT-3);d(i.bR+3,i.bT);}
  else if(e==='zzz'){px(eg,i.bR+1,i.bT-4,'effD');px(eg,i.bR+2,i.bT-4,'effD');px(eg,i.bR+3,i.bT-4,'effD');px(eg,i.bR+2,i.bT-3,'effD');px(eg,i.bR+1,i.bT-2,'effD');px(eg,i.bR+2,i.bT-2,'effD');px(eg,i.bR+3,i.bT-2,'effD');px(eg,i.bR+3,i.bT,'effD');px(eg,i.bR+4,i.bT,'effD');px(eg,i.bR+4,i.bT+1,'effD');px(eg,i.bR+3,i.bT+1,'effD');}
  else if(e==='anger'){const sx=i.bR-1,sy=i.bT;px(eg,sx,sy,'effB');px(eg,sx+2,sy,'effB');px(eg,sx+1,sy+1,'effB');px(eg,sx,sy+2,'effB');px(eg,sx+2,sy+2,'effB');}
  else if(e==='sweat'){const sx=i.bR+1,sy=i.bT;px(eg,sx,sy,'effC');px(eg,sx,sy+1,'effC');px(eg,sx,sy+2,'effC');}
  else if(e==='question'){const sx=i.cx+1,sy=i.bT-5;px(eg,sx,sy,'effD');px(eg,sx+1,sy,'effD');px(eg,sx+1,sy+1,'effD');px(eg,sx,sy+2,'effD');px(eg,sx,sy+4,'effD');}
  if(state.aura!=='none'&&info.raw){for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(info.raw[y]&&info.raw[y][x])continue;let adj=false;for(const[dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H&&info.raw[ny]&&info.raw[ny][nx]){adj=true;break;}}if(!adj)continue;const h2=(x*7+y*13+fi*5)%9;if(state.aura==='holy'&&h2<2)px(eg,x,y,'auraHoly');else if(state.aura==='dark'&&h2<3)px(eg,x,y,'auraDark');else if(state.aura==='fire'&&y>info.cy&&h2<2){px(eg,x,y,'auraFire');if(y>0&&!eg[y-1][x])px(eg,x,y-1,'auraFireB');}else if(state.aura==='ice'&&h2<2)px(eg,x,y,'auraIce');}}
  return eg;
}
function buildScene(fi){const sg=Array.from({length:H},()=>Array(W).fill(null)),s=state.scene;if(s==='none')return sg;const sd=fi*3;if(s==='rain')for(let i=0;i<8;i++){const x=(i*7+sd)%W,y=(i*5+sd*2)%H;px(sg,x,y,'scnA');if(y+1<H)px(sg,x,y+1,'scnA');}else if(s==='snow')for(let i=0;i<6;i++){const x=(i*9+sd)%W,y=(i*6+sd)%H;px(sg,x,y,'scnB');}else if(s==='stars')for(let i=0;i<5;i++){const x=(i*11+3)%W,y=(i*7+1)%(H/2);if((fi+i)%3!==0)px(sg,x,y,'effD');}else if(s==='sakura')for(let i=0;i<5;i++){const x=(i*8+sd)%W,y=(i*5+sd*2)%(H-4)+2;px(sg,x,y,'scnC');}else if(s==='bubbles')for(let i=0;i<4;i++){const x=(i*9+2)%W,y=H-4-((fi*2+i*5)%12);px(sg,x,y,'scnD');if(x+1<W)px(sg,x+1,y,'scnD');px(sg,x,y-1,'scnD');}return sg;}

// ── render ──────────────────────────────────────────────────────────────
function renderSVG(gd,eg,sg){
  const{g,info}=gd;const c=pal();const ghost=state.bodyTexture==='ghost'?'0.55':'1';
  const rects=(layer,grid,op)=>{const el=document.getElementById(layer);while(el.firstChild)el.removeChild(el.firstChild);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=grid[y][x];if(!k)continue;const color=c[k];if(!color)continue;const r=document.createElementNS(SVG_NS,'rect');r.setAttribute('x',x);r.setAttribute('y',y);r.setAttribute('width',1);r.setAttribute('height',1);r.setAttribute('fill',color);if(op)r.setAttribute('opacity',op);else if(ghost!=='1'&&layer==='bodyLayer'&&!['outline','eye','eyeW','mouth','mouthIn','tongue','bubW','bubB','bubSym'].includes(k))r.setAttribute('opacity',ghost);el.appendChild(r);}};
  rects('bodyLayer',g);rects('effectLayer',eg);rects('sceneLayer',sg,'0.6');
  const sl=document.getElementById('shadowLayer');while(sl.firstChild)sl.removeChild(sl.firstChild);
  const base=baseBP(),shCy=base.cy+base.ry+2,shRx=Math.round(base.rx*.65);
  for(let x=base.cx-shRx;x<=base.cx+shRx;x++){const r=document.createElementNS(SVG_NS,'rect');r.setAttribute('x',x);r.setAttribute('y',shCy);r.setAttribute('width',1);r.setAttribute('height',1);r.setAttribute('fill',c.shadow);sl.appendChild(r);}
  const bg=document.getElementById('bgRect');if(state.bgPreset==='transparent')bg.setAttribute('fill','url(#checker)');else if(state.bgPreset==='solid')bg.setAttribute('fill',state.bgColor);else if(BG_G[state.bgPreset]){ensureGrad('bgGrad',BG_G[state.bgPreset]);bg.setAttribute('fill','url(#bgGrad)');}else bg.setAttribute('fill',BG_S[state.bgPreset]||state.bgColor);
}
function ensureGrad(id,colors){const defs=document.querySelector('#poporing defs');let el=document.getElementById(id);if(!el){el=document.createElementNS(SVG_NS,'linearGradient');el.id=id;el.setAttribute('x1','0');el.setAttribute('y1','0');el.setAttribute('x2','0');el.setAttribute('y2','1');defs.appendChild(el);}el.innerHTML='';colors.forEach((c2,i)=>{const s=document.createElementNS(SVG_NS,'stop');s.setAttribute('offset',i?'100%':'0%');s.setAttribute('stop-color',c2);el.appendChild(s);});}

function renderFrame(idx){const bp=frameBP(idx);const gd=buildGrid(bp,idx);const eg=buildOverlays(gd.info,idx);const sg=buildScene(idx);renderSVG(gd,eg,sg);const fr=AF[state.animation],total=fr?fr.length:1;document.getElementById('frameInfo').textContent=`${(idx%total)+1}/${total}`;}
function startAnim(){stopAnim();aFrame=0;renderFrame(0);const fr=AF[state.animation];if(!fr)return;const sp=AS[state.animation]||200;aTimer=setInterval(()=>{aFrame=(aFrame+1)%fr.length;renderFrame(aFrame);},sp);}
function stopAnim(){if(aTimer){clearInterval(aTimer);aTimer=null;}aFrame=0;}
function render(){startAnim();}

// ── canvas ──────────────────────────────────────────────────────────────
function g2c(gd,eg,sg,scale,withBG){
  const cv=document.createElement('canvas');cv.width=W*scale;cv.height=H*scale;const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;const c=pal();const ghost=state.bodyTexture==='ghost'?.55:1;
  if(withBG&&state.bgPreset!=='transparent'){const bgGr=BG_G[state.bgPreset];if(bgGr){const gr=ctx.createLinearGradient(0,0,0,H*scale);gr.addColorStop(0,bgGr[0]);gr.addColorStop(1,bgGr[1]);ctx.fillStyle=gr;}else ctx.fillStyle=BG_S[state.bgPreset]||state.bgColor;ctx.fillRect(0,0,W*scale,H*scale);}
  const draw=(grid,op)=>{for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=grid[y][x];if(!k)continue;const color=c[k];if(!color)continue;ctx.globalAlpha=op||(ghost<1&&!['outline','eye','eyeW','mouth','mouthIn','tongue','bubW','bubB','bubSym'].includes(k)?ghost:1);ctx.fillStyle=color;ctx.fillRect(x*scale,y*scale,scale,scale);}ctx.globalAlpha=1;};
  draw(sg,.6);
  const base=baseBP(),shCy=base.cy+base.ry+2,shRx=Math.round(base.rx*.65);ctx.fillStyle=c.shadow;for(let x=base.cx-shRx;x<=base.cx+shRx;x++)ctx.fillRect(x*scale,shCy*scale,scale,scale);
  draw(gd.g);draw(eg);return cv;
}

// ── exports ─────────────────────────────────────────────────────────────
function dl(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);}
const fn=()=>(state.name||'poporing').replace(/\s+/g,'_');
function exportPNG(){const gd=buildGrid(frameBP(0),0),eg=buildOverlays(gd.info,0),sg=buildScene(0);g2c(gd,eg,sg,20,true).toBlob(b=>dl(b,fn()+'.png'),'image/png');}
function exportSheet(){const fr=AF[state.animation]||[{sx:1,sy:1,ox:0,oy:0}];const S=8,fw=W*S;const cv=document.createElement('canvas');cv.width=fw*fr.length;cv.height=H*S;const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;fr.forEach((_,i)=>{const gd=buildGrid(frameBP(i),i),eg=buildOverlays(gd.info,i),sg=buildScene(i);ctx.drawImage(g2c(gd,eg,sg,S,false),i*fw,0);});cv.toBlob(b=>dl(b,fn()+'_sheet.png'),'image/png');}
function exportGIF(){const fr=AF[state.animation]||[{sx:1,sy:1,ox:0,oy:0}];const S=10,gw=W*S,gh=H*S;const gfs=[];for(let i=0;i<fr.length;i++){const gd=buildGrid(frameBP(i),i),eg=buildOverlays(gd.info,i),sg=buildScene(i);const cv=g2c(gd,eg,sg,S,state.bgPreset!=='transparent');gfs.push(new Uint8Array(cv.getContext('2d').getImageData(0,0,gw,gh).data.buffer));}dl(mkGIF(gfs,gw,gh,AS[state.animation]||200),fn()+'.gif');}
function exportJSON(){dl(new Blob([JSON.stringify({v:8,...state},null,2)],{type:'application/json'}),fn()+'.json');}

function exportSticker(){
  const gd=buildGrid(frameBP(0),0),eg=buildOverlays(gd.info,0);
  let minX=W,maxX=0,minY=H,maxY=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(gd.g[y][x]||eg[y][x]){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  const base=baseBP(),shCy=base.cy+base.ry+2,shRx=Math.round(base.rx*.65);
  minX=Math.max(0,Math.min(minX,base.cx-shRx)-1);maxX=Math.min(W-1,Math.max(maxX,base.cx+shRx)+1);
  minY=Math.max(0,minY-1);maxY=Math.min(H-1,Math.max(maxY,shCy)+1);
  const cw=maxX-minX+1,ch=maxY-minY+1,S=16;
  const cv=document.createElement('canvas');cv.width=cw*S;cv.height=ch*S;const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
  const c=pal(),ghost=state.bodyTexture==='ghost'?.55:1;
  ctx.fillStyle=c.shadow;for(let x=base.cx-shRx;x<=base.cx+shRx;x++)if(x>=minX&&x<=maxX)ctx.fillRect((x-minX)*S,(shCy-minY)*S,S,S);
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const k=gd.g[y][x];if(!k)continue;const color=c[k];if(!color)continue;ctx.globalAlpha=(ghost<1&&!['outline','eye','eyeW','mouth','mouthIn','tongue','bubW','bubB','bubSym'].includes(k))?ghost:1;ctx.fillStyle=color;ctx.fillRect((x-minX)*S,(y-minY)*S,S,S);}
  ctx.globalAlpha=1;for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const k=eg[y][x];if(!k)continue;ctx.fillStyle=c[k]||'#fff';ctx.fillRect((x-minX)*S,(y-minY)*S,S,S);}
  cv.toBlob(b=>dl(b,fn()+'_sticker.png'),'image/png');
}

function loadJSON(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);for(const k of Object.keys(DEFAULTS))if(k in d)state[k]=d[k];syncUI();render();}catch(err){alert('Invalid JSON');}};r.readAsText(f);e.target.value='';}

// ── URL sharing ─────────────────────────────────────────────────────────
function loadFromURL(){const h=window.location.hash.slice(1);if(!h)return;try{const d=JSON.parse(atob(h));for(const k of Object.keys(DEFAULTS))if(k in d)state[k]=d[k];}catch(e){}}
function share(){const url=window.location.origin+window.location.pathname+'#'+btoa(JSON.stringify(state));navigator.clipboard.writeText(url).then(()=>{const b=document.getElementById('shareBtn');b.textContent='COPIED!';setTimeout(()=>b.textContent='SHARE',1500);}).catch(()=>prompt('Copy:',url));}

// ── evolve ──────────────────────────────────────────────────────────────
function evolve(){
  const mutable=['bodyColor','eyes','mouth','cheeks','headTop','headwear','ears','wings','heldItem','effect','aura','bodyPattern','bodyTexture','bodyFx','bubble'];
  const n=2+Math.floor(Math.random()*3);
  const shuffled=[...mutable].sort(()=>Math.random()-.5).slice(0,n);
  for(const f of shuffled){if(f==='bodyColor')state.bodyColor=pick(SWATCHES);else{const opts=CO[f];if(opts)state[f]=pick(opts)[0];}}
  syncUI();render();
}

// ── UI ──────────────────────────────────────────────────────────────────
function mark(c,v){c.querySelectorAll('.chip').forEach(b=>b.classList.toggle('active',b.dataset.value===v));}
function syncUI(){document.getElementById('bodyColor').value=state.bodyColor;document.getElementById('bgColor').value=state.bgColor;document.getElementById('nameInput').value=state.name;document.querySelectorAll('.chips[data-field]').forEach(c=>mark(c,state[c.dataset.field]));buildHarmony();}

function buildChips(){document.querySelectorAll('.chips[data-field]').forEach(c=>{const f=c.dataset.field,opts=CO[f]||[];c.innerHTML='';opts.forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.className='chip';b.textContent=label;b.dataset.value=id;b.addEventListener('click',()=>{state[f]=id;mark(c,id);render();});c.appendChild(b);});mark(c,state[f]);});}
function buildEmotions(){const box=document.getElementById('emotionChips');box.innerHTML='';for(const n in EMOTIONS){const b=document.createElement('button');b.type='button';b.className='chip emotion';b.textContent=n.toUpperCase();b.addEventListener('click',()=>{Object.assign(state,EMOTIONS[n]);syncUI();render();});box.appendChild(b);}}
function buildSwatches(){const box=document.getElementById('swatches');box.innerHTML='';SWATCHES.forEach(color=>{const b=document.createElement('button');b.type='button';b.style.background=color;b.title=color;b.addEventListener('click',()=>{state.bodyColor=color;document.getElementById('bodyColor').value=color;buildHarmony();render();});box.appendChild(b);});}
function buildHarmony(){const box=document.getElementById('harmony');box.innerHTML='';harmonyColors(state.bodyColor).forEach(color=>{const b=document.createElement('button');b.type='button';b.style.background=color;b.title=color;b.addEventListener('click',()=>{state.bodyColor=color;document.getElementById('bodyColor').value=color;buildHarmony();render();});box.appendChild(b);});}
function buildPresets(){
  const box=document.getElementById('presets');box.innerHTML='';
  for(const n in PRESETS){const b=document.createElement('button');b.type='button';b.className='preset-btn';b.textContent=n;b.addEventListener('click',()=>{Object.assign(state,PRESETS[n]);syncUI();render();});box.appendChild(b);}
  for(const n in SEASONAL){const b=document.createElement('button');b.type='button';b.className='preset-btn seasonal';b.textContent=n;b.addEventListener('click',()=>{Object.assign(state,SEASONAL[n]);syncUI();render();});box.appendChild(b);}
}
function wireTabs(){document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.panel').forEach(x=>x.classList.add('hidden'));t.classList.add('active');document.getElementById('panel-'+t.dataset.tab).classList.remove('hidden');}));}
function wire(){
  document.getElementById('nameInput').addEventListener('input',e=>{state.name=e.target.value;});
  document.getElementById('bodyColor').addEventListener('input',e=>{state.bodyColor=e.target.value;buildHarmony();render();});
  document.getElementById('bgColor').addEventListener('input',e=>{state.bgColor=e.target.value;state.bgPreset='solid';const c=document.querySelector('[data-field="bgPreset"]');if(c)mark(c,'solid');render();});
  document.getElementById('randomBtn').addEventListener('click',randomize);
  document.getElementById('evolveBtn').addEventListener('click',evolve);
  document.getElementById('resetBtn').addEventListener('click',reset);
  document.getElementById('pngBtn').addEventListener('click',exportPNG);
  document.getElementById('stickerBtn').addEventListener('click',exportSticker);
  document.getElementById('gifBtn').addEventListener('click',exportGIF);
  document.getElementById('sheetBtn').addEventListener('click',exportSheet);
  document.getElementById('jsonBtn').addEventListener('click',exportJSON);
  document.getElementById('shareBtn').addEventListener('click',share);
  document.getElementById('loadJson').addEventListener('change',loadJSON);
}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function randomize(){state.bodyColor=pick(SWATCHES);for(const k of Object.keys(CO))state[k]=pick(CO[k])[0];if(state.bgPreset==='solid')state.bgColor=pick(['#181830','#0a0e27','#88c8e8','#e8a0c0']);syncUI();render();}
function reset(){Object.assign(state,DEFAULTS);syncUI();render();}

document.addEventListener('DOMContentLoaded',()=>{loadFromURL();buildSwatches();buildChips();buildEmotions();buildPresets();wireTabs();wire();syncUI();render();});
