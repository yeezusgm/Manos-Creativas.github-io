import {framePlate,plates,driftPlate,escalaFondos} from './paralaje.js';
import {roadX} from './main-road.js';
// The old scenery was painted in the unextended road's coordinates. Register each
// landmark against today's terrain, including both feet of a freestanding arch.
export function sceneryAnchor(platforms,x,nearY=0,halfSpan=0){
  let best=null,cost=Infinity;
  for(const p of platforms){
    if(p.oneWay||p.gateId||p.h<.4||p.w<Math.max(1.4,2*halfSpan+.12))continue;
    const px=Math.max(p.x+halfSpan+.04,Math.min(p.x+p.w-halfSpan-.04,x)),y=p.y+p.h;
    const d=Math.abs(px-x)+Math.abs(y-nearY)*.65;
    if(Math.abs(px-x)<=5.5&&d<cost){cost=d;best={x:px,y};}
  }
  return best;
}
// On tall screens a landscape must not reappear underneath solid bedrock.
// Split at real room/pit edges. A low shelf, hazard or tunnel stays see-through.
export function bedrockRuns(platforms,hazards=[]){
  const solids=platforms.filter(p=>!p.gateId&&p.w>0&&p.h>0);
  const spans=[...solids,...hazards],edges=[...new Set(spans.flatMap(p=>[p.x,p.x+p.w]))].sort((a,b)=>a-b);
  const runs=[];
  for(let i=1;i<edges.length;i++){
    const a=edges[i-1],b=edges[i],x=(a+b)/2;
    const low=spans.reduce((best,p)=>x>p.x&&x<p.x+p.w&&(!best||p.y<best.y)?p:best,null);
    if(!low||low.oneWay||low.h<2.5||low.y>=1||!solids.includes(low))continue;
    const prev=runs.at(-1);
    if(prev&&prev.end===a&&prev.y===low.y)prev.end=b;
    else runs.push({x:a,end:b,y:low.y});
  }
  return runs;
}
// Original landscape layers, authored against the same rectangles used for collision.
export function createWorld(THREE, scene, {platforms=[], hazards=[], width=104, groundY=0, swordX=42, gateX=100,plague}={}) {
  const root = new THREE.Group();
  root.name = 'Abyss Blade / scenic layers';
  scene.add(root);
  const tile = new THREE.PlaneGeometry(1, 1);
  const uniformColor = (a, b) => ({value: new THREE.Color(a), end:new THREE.Color(b)});
  const tinted = [];
  const rng = seed => () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const cv = (w, h) => {
    const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h;
    const ctx=canvas.getContext('2d'); ctx.imageSmoothingEnabled=false; return [canvas,ctx];
  };
  function texture(canvas, filter=THREE.NearestFilter) {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace=THREE.SRGBColorSpace;
    t.magFilter=filter; t.minFilter=filter;
    t.generateMipmaps=false;
    return t;
  }
  function plane(map, x, y, z, w, h, options={}) {
    const {group=root, color=0xffffff, ...other}=options;
    const material=new THREE.MeshBasicMaterial({map, color, transparent:true, depthWrite:false, ...other});
    const m=new THREE.Mesh(tile,material);
    m.position.set(x,y,z); m.scale.set(w,h,1); m.renderOrder=Math.round(z*10)-20;
    group.add(m); return m;
  }
  function tint(mesh, a, b) {
    if(a===b){mesh.material.color.set(a);return;}
    const c=uniformColor(a,b);
    tinted.push([mesh.material,c.value,c.end]);
  }

  const [skyCanvas, sky] = cv(640, 360);
  const skyGradient=sky.createLinearGradient(0,0,0,360);
  skyGradient.addColorStop(0,'#15202a'); skyGradient.addColorStop(.44,'#3f7776'); skyGradient.addColorStop(1,'#102831');
  sky.fillStyle=skyGradient; sky.fillRect(0,0,640,360);
  const sunlight=sky.createRadialGradient(408,81,5,408,81,235);
  sunlight.addColorStop(0,'#ffdda0'); sunlight.addColorStop(.27,'#a2986caa'); sunlight.addColorStop(1,'#62887900');
  sky.fillStyle=sunlight; sky.fillRect(0,0,640,360);
  let bgTex=texture(skyCanvas,THREE.LinearFilter), abyssTex=null;
  bgTex.wrapS=THREE.MirroredRepeatWrapping;
  const backdrop=plane(bgTex,0,0,-25,20,12);
  const abyss=plane(null,0,0,-24,20,12,{opacity:0});
  abyss.visible=false;
  backdrop.material.transparent=false;
  tint(backdrop,0xffffff,0x775b9c);
  const loadLandscape = (url,receive) => new THREE.TextureLoader().load(url, loaded => {
    loaded.colorSpace=THREE.SRGBColorSpace;
    loaded.magFilter=THREE.LinearFilter; loaded.minFilter=THREE.LinearFilter;
    loaded.wrapS=THREE.MirroredRepeatWrapping;
    loaded.generateMipmaps=false;
    loaded.userData.aspect=loaded.image.width/loaded.image.height;
    receive(loaded);
  },undefined,()=>{});
  loadLandscape('./art/fondos/bosque-lejos.webp', loaded => {
    bgTex.dispose();
    backdrop.material.map=loaded;
    bgTex=loaded;
  });
  loadLandscape('./art/fondos/abismo-lejos.webp', loaded => {
    abyss.material.map=loaded;
    abyss.material.needsUpdate=true;
    abyssTex=loaded;
  });
  // Nubes del abismo: dos capas propias que derivan solas, cada una a su ritmo y con su paralaje.
  const cloudLayers=[];
  const cloud=(url,z,spec,rate)=>{
    const m=plane(null,0,0,z,20,12,{opacity:0});m.visible=false;
    loadLandscape(url,loaded=>{m.material.map=loaded;m.material.needsUpdate=true;m.userData.aspect=loaded.userData.aspect;m.userData.ready=true;});
    cloudLayers.push({m,spec,rate});
  };
  cloud('./art/fondos/abismo-nubes-rojas.webp',-23.4,{speed:.26,lift:.16,phase:.5,height:12.4*escalaFondos,floor:1.06},.0035);
  cloud('./art/fondos/abismo-nubes-moradas.webp',-22.8,{speed:.33,lift:.20,phase:.5,height:12.4*escalaFondos,floor:1.06},-.0055);

  const oldEnd=plague?.start??width;
  const settle=(x,y=0,half=0)=>sceneryAnchor(platforms,x,y,half);

  // Light is carried by backdrop and discrete lamps, leaving the interaction plane clear.
  const [lightCanvas, light]=cv(128,128);
  const lg=light.createRadialGradient(64,64,1,64,64,64);
  lg.addColorStop(0,'rgba(255,255,255,1)');lg.addColorStop(.16,'rgba(255,255,255,.65)');lg.addColorStop(.45,'rgba(255,255,255,.21)');lg.addColorStop(1,'rgba(255,255,255,0)');
  light.fillStyle=lg;light.fillRect(0,0,128,128);
  const glowTex=texture(lightCanvas,THREE.LinearFilter);
  const lights=[];
  function glow(x,y,z,w,h,a,b,opacity){
    const m=plane(glowTex,x,y,z,w,h,{color:a,opacity,blending:THREE.AdditiveBlending});
    tint(m,a,b);lights.push([m,opacity,x]);
    return m;
  }
  const ambient=glow(0,5.9,-19,14,15,0xb8874d,0x68418c,.15);
  const clearing=glow(0,1.9,-7,14,8,0x458484,0x4f4090,.09);
  const lampFeet=[4.6,17,29.5,56,68.5,82.2,95].map(x=>settle(roadX(x),0,.22)).filter(Boolean);
  for(const p of lampFeet)glow(p.x,p.y+.8,-.25,3.5,2.7,0xffd07a,0xd282fd,.32);

  function terrain(p,i) {
    const random=rng(79829+i*113);
    const W=Math.max(8,Math.min(1300,Math.round(p.w*36))), H=Math.max(6,Math.min(620,Math.round(p.h*36)));
    const [canvas,c]=cv(W,H);
    const pest=p.kind==='peste',teal=p.kind==='cyan', cave=p.kind==='cave';
    const masonry=p.kind==='ruin'||p.x>=swordX+2, branch=p.kind==='ledge';
    const palette=pest?['#172021','#25312c','#344032','#45483a','#6b6b4c','#8b8254','#a89169']:teal?['#142c37','#1c3541','#23434b','#2d4c57','#4b7175','#56818a','#83b5b4']:cave?['#151422','#211b31','#2c273d','#3b324b','#4b4158','#665674','#857190']:masonry?['#191c2a','#26263a','#333146','#444357','#555268','#676478','#86818f']:
      ['#171b1c','#292926','#35312a','#484031','#60513b','#725e40','#93825e'];
    c.fillStyle=palette[0];c.fillRect(0,0,W,H);
    if(masonry){
    const ch=7, cw=19;
    for(let y=3;y<H;y+=ch){
      let x=-Math.floor(random()*cw);
      while(x<W){
        const w=Math.floor(cw*(.5+random()*.9)), h=ch-1+(masonry?0:Math.floor(random()*4));
        c.fillStyle=palette[1+Math.floor(random()*3)];c.fillRect(x,y,w-1,h);
        c.fillStyle=palette[1+Math.floor(random()*2)];c.fillRect(x+2,y+2,Math.max(1,w-5),Math.max(2,h-4));
        if(random()<.42){c.fillStyle=palette[4];c.fillRect(x+1,y,Math.max(1,w-5),1);}
        if(random()<.36){c.fillStyle=palette[0];c.fillRect(x+w-4,y+3,2,h-3);}
        x+=w;
      }
    }
    }else{
      // Broad rock strata and shallow ochre gravel avoid a regular tile grid.
      const wobble=(x,phase)=>Math.sin(x*.041+phase)*4+Math.sin(x*.095+phase*.3)*2.3+Math.sin(x*.018-phase)*5.8;
      for(let i=8;i>=0;i--){
        c.fillStyle=palette[i%3+1];c.beginPath();c.moveTo(0,0);
        const y=6+i*14;
        for(let x=0;x<=W+3;x+=3)c.lineTo(x,Math.max(1,Math.floor(y+wobble(x,i*1.12))));
        c.lineTo(W,0);c.closePath();c.fill();
      }
      for(let i=0;i<(branch?W*.7:W*H/47);i++){
        const x=Math.floor(random()*W),y=Math.floor(random()*H);
        const size=1+Math.floor(random()*(branch?5:8)), skew=Math.floor(random()*5),shade=Math.floor(random()*4);
        c.globalAlpha=.40+random()*.25;c.fillStyle=palette[shade+(y<20?2:0)];
        c.beginPath();c.moveTo(x-size,y);c.lineTo(x-size*.45,y-size*.29);c.lineTo(x+skew,y-size*.44);c.lineTo(x+size,y);c.lineTo(x+size*.5,y+size*.45);c.lineTo(x-size*.25,y+size*.6);c.closePath();c.fill();
      }
      c.globalAlpha=1;
      for(let i=0;i<W/24;i++){
        const x=Math.floor(random()*W),reach=Math.floor(8+random()*39),dx=(random()-.5)*28;
        c.fillStyle=palette[3];
        for(let j=0;j<reach;j++)c.fillRect(Math.round(x+dx*j/reach+Math.sin(j*.2)*2),j,Math.max(1,3-Math.floor(j/13)),1);
      }
    }
    const edge=pest?['#545f46','#e7d9a0','#a4a96e']:teal?['#2c786f','#a5f5df','#58b7a8']:cave?['#3c3151','#a28db0','#6d5d81']:masonry ? ['#5b4e64','#aaa0ab','#787286'] : ['#3c4d3c','#9aa267','#64764d'];
    for(let x=0;x<W;x++){
      const n=random(), drip=3+Math.floor(random()*4)+(x%11===0?3:0);
      c.fillStyle=edge[0];c.fillRect(x,0,1,drip);
      c.fillStyle=n>.74?edge[1]:edge[2];c.fillRect(x,0,1,n>.43?2:1);
      if(!masonry && n>.88){c.fillStyle=palette[5];c.fillRect(x,drip+1,1,1);}
    }
    if(pest){
      // Capstones carry a pale, continuous upper seam. Crusty shelves and
      // mycelium always grow down the wall, not into the landing space.
      for(let x=0;x<W;){
        const len=Math.min(W-x,7+Math.floor(random()*12));
        c.fillStyle='#c7c693';c.fillRect(x,0,len,2);
        c.fillStyle='#ede0aa';c.fillRect(x,0,Math.max(1,Math.round(len*.68)),1);
        c.fillStyle='#717959';c.fillRect(x+len-1,1,1,2);
        x+=len;
      }
      for(let x=5;x<W-4;x+=11+Math.floor(random()*29)){
        const n=5+Math.floor(random()*16),drift=(random()-.5)*8;
        for(let j=3;j<Math.min(n,H);j++){
          const sx=Math.round(x+drift*j/n+Math.sin(j*.32)*1.4);
          c.fillStyle=j===n-1?'#bad18a':'#637746';c.fillRect(sx,j,1,j%4?1:2);
          if(j%5===3){c.fillStyle='#89945a';c.fillRect(sx+1,j,2,1);}
        }
        if(x%3&&H>14){const y=9+Math.floor(random()*Math.min(22,H-10));
          c.fillStyle='#301e30';c.fillRect(x-1,y,6,3);c.fillStyle='#a96a68';c.fillRect(x-2,y,6,1);
          c.fillStyle='#c6a265';c.fillRect(x-1,y-1,4,1);}
      }
    }
    const fade=c.createLinearGradient(0,1,0,Math.max(13,Math.min(H,115)));
    fade.addColorStop(0,'rgba(9,12,20,0)');fade.addColorStop(.4,'rgba(9,12,20,.25)');fade.addColorStop(1,'rgba(8,11,18,.94)');
    c.fillStyle=fade;c.fillRect(0,0,W,H);
    if(p.h<.35){
      const lipW=W, lipH=28, [lip,l]=cv(lipW,lipH);
      l.beginPath();l.moveTo(0,1);l.lineTo(lipW,1);
      for(let x=lipW;x>=0;x-=3){
        const taper=Math.sin(Math.PI*x/lipW)**.55;
        l.lineTo(x,Math.max(0,Math.floor(4+taper*(9+Math.sin(x*.11)*3+random()*10))));
      }
      l.closePath();
      const shade=l.createLinearGradient(0,0,0,lipH);
      shade.addColorStop(0,pest?'#39443a':masonry?'#282337':'#322a22');shade.addColorStop(1,pest?'#1d2024':'#17171d');
      l.fillStyle=shade;l.fill();
      for(let i=0;i<lipW/7;i++){
        const x=Math.floor(3+random()*(lipW-7)), y=Math.floor(3+random()*5);
        l.fillStyle=masonry?'#474050':'#534432';l.fillRect(x,y,2+random()*4,1);
      }
      tint(plane(texture(lip),p.x+p.w/2,p.y-.28,-.025,p.w,.58),pest?0xffffff:0xdfd1b2,pest?0xffffff:0xa695bf);
    }
    const m=plane(texture(canvas),p.x+p.w/2,p.y+p.h/2,0,p.w,p.h);
    tint(m,0xffffff,pest?0xffffff:teal?0xb8f0e9:0xb4a4db);

    const grassH=18, [grass,g]=cv(W,grassH);
    for(let x=2;x<W-2;x++){
      if(random()>(masonry?.9:.72)){
        const k=2+Math.floor(random()*(masonry?5:11));
        g.fillStyle=pest?'#80804b':teal?'#4eada0':masonry?'#70657f':'#556c48';
        g.fillRect(x,grassH-k,1,k);
        g.fillRect(x-1,grassH-k+2,1,Math.max(1,k-2));
        if(random()>.72){g.fillStyle=pest?'#c0be76':teal?'#89e3ce':masonry?'#a285b1':'#a6a772';g.fillRect(x,grassH-k,1,2);}
        if(random()>.95){g.fillStyle=pest?'#d89b83':masonry?'#edb7ff':'#e4bb6c';g.fillRect(x,grassH-k-2,2,2);}
      }
    }
    const grassHeight=.39;
    const tuft=plane(texture(grass),p.x+p.w/2,p.y+p.h+grassHeight/2,.13,p.w,grassHeight);
    tint(tuft,pest?0xffffff:0xe5efc0,pest?0xffffff:0xaf97ce);
  }
  for(const r of bedrockRuns(platforms,hazards)){
    const a=r.x===0?-10:r.x,bottom=Math.min(-38,r.y-18);
    plane(null,(a+r.end)/2,(r.y+bottom)/2,-.09,r.end-a,r.y-bottom+.01,{color:0x090c13});
  }
  platforms.forEach((p,i)=>{if(!p.gateId&&p.w>0&&p.h>0)terrain(i===0&&p.x===0?{...p,x:-10,w:p.w+10}:p,i);});

  // Each patch is tucked behind the footing so decorative shapes do not imply collision.
  const [bushCanvas,bush]=cv(420,106);
  const botany=rng(21981);
  const bushColors=['#10292c','#173437','#244646','#36574a','#517156','#708160'];
  function leaf(c,x,y,dx,dy,col){
    c.fillStyle=col;c.beginPath();c.moveTo(x,y);c.lineTo(x+dx*.46-dy*.21,y+dy*.46+dx*.21);c.lineTo(x+dx,y+dy);c.lineTo(x+dx*.63+dy*.2,y+dy*.63-dx*.2);c.closePath();c.fill();
  }
  for(let i=0;i<100;i++){
    const x=Math.round(10+botany()*400), y=105, h=10+botany()*54;
    const dx=(botany()-.5)*38, n=1+Math.floor(botany()*4);
    bush.fillStyle=bushColors[Math.min(n,3)];
    for(let j=0;j<h;j++) bush.fillRect(Math.round(x+dx*j*j/(h*h)),Math.round(y-j),2,2);
    for(let j=0;j<4;j++){
      const u=.27+j*.17, sx=x+dx*u*u, sy=y-h*u;
      const s=(j+i)%2===0?1:-1;
      leaf(bush,sx,sy,(3+botany()*18)*s,-(3+botany()*16),bushColors[n]);
      leaf(bush,sx,sy,(4+botany()*14)*-s,-(3+botany()*12),bushColors[Math.max(0,n-1)]);
    }
    if(i%9===0){
      const fx=Math.round(x+dx), fy=Math.round(y-h);
      bush.fillStyle=i%2===0?'#af895e':'#8d9b6f';bush.fillRect(fx-2,fy,6,2);bush.fillRect(fx,fy-2,2,6);
      bush.fillStyle='#cbb885';bush.fillRect(fx,fy,2,2);
    }
  }
  const bushes=texture(bushCanvas);
  for(const [old,y0,w,h,flip] of [[.8,0,5.4,1.15,false],[8,0,4.4,.8,true],[19.4,0,4.7,1.1,false],[26.5,.35,3.8,.94,true],[38.8,.4,3.7,.78,false],[52,.4,3.6,.73,true],[67,.4,4.6,1.12,false],[78,.15,3.1,.72,true],[91,.75,5,1.08,false]]){
    const foot=settle(roadX(old),y0,w*.34);if(!foot)continue;const {x,y}=foot;
    const m=plane(bushes,x,y+h*.4,-1.55,w,h,{opacity:.88});
    // A plane with negative scale would be back-facing: rotate 180° about Y and keep the material double-sided.
    if(flip){m.material.side=THREE.DoubleSide;m.rotation.y=Math.PI;}
    tint(m,0xf1f1d8,0xbca3e1);
    const close=plane(bushes,x+w*.08,y+.11,3.3,w*.79,.33,{opacity:.64});
    tint(close,0x9eac83,0x91729f);
  }

  function architecture(x, y, w, h, seed, kind='arch') {
    const [canvas,c]=cv(260,295), random=rng(seed);
    const cols=['#17212b','#243039','#333944','#414451','#575060','#6f6071'];
    function block(x,y,w,h){
      c.fillStyle=cols[1+Math.floor(random()*3)];c.fillRect(x,y,w,h);
      c.fillStyle=cols[4];c.fillRect(x+1,y+1,w-2,2);
      c.fillStyle=cols[0];c.fillRect(x+w-2,y+3,2,h-3);
      for(let i=0;i<9;i++){
        const nx=Math.floor(x+2+random()*Math.max(1,w-4)), ny=Math.floor(y+4+random()*Math.max(1,h-6));
        c.fillStyle=cols[Math.floor(random()*5)];c.fillRect(nx,ny,1+Math.floor(random()*3),1);
      }
    }
    if(kind==='column'){
      for(let by=4;by<295;by+=17){
        const bx=96+Math.floor(random()*5), bw=60+Math.floor(random()*7);
        if(by<34&&random()<.25)continue;
        block(bx,by,bw,16);
        if(by%4===0)block(bx-13,by+13,bw+25,5);
      }
      block(76,275,100,18);block(70,285,114,10);
    } else {
      for(const side of [36,188]){
        for(let by=115;by<280;by+=16){block(side+(by%3===0?3:0),by,36,15);}
        block(side-7,273,51,15);block(side-12,287,60,8);
      }
      for(let i=0;i<22;i++){
        const a=Math.PI + Math.PI*(i+.04)/22;
        const cx=130+76*Math.cos(a), cy=116+76*Math.sin(a);
        c.save();c.translate(Math.round(cx),Math.round(cy));c.rotate(a+Math.PI/2);block(-6,-20,12,39);c.restore();
      }
      block(112,14,36,14);block(116,2,27,11);
      c.fillStyle='#1c2932';c.fillRect(127,26,6,44);
      c.fillStyle='#887b86';c.fillRect(129,27,2,16);
      c.fillStyle='#60465e';c.fillRect(124,70,12,12);
      c.fillStyle='#b889aa';c.fillRect(127,73,6,6);
    }
    for(let i=0;i<26;i++){
      const tx=25+random()*210, ty=kind==='column'?275+random()*20:279+random()*15;
      c.fillStyle=i%3===0?'#504a52':'#27363b';c.fillRect(Math.round(tx),Math.round(ty),3+Math.round(random()*9),2);
    }
    const m=plane(texture(canvas),x,y+h/2,-4,w,h,{opacity:kind==='column'?.37:.89});
    tint(m,0xc0c3b7,0xb8a2c7);
  }
  function rootedArch(x,y,w,h,seed,kind='arch'){
    const feet=settle(x,y,w*(kind==='column'?.12:.31));if(feet)architecture(feet.x,feet.y,w,h,seed,kind);return feet;
  }
  rootedArch(swordX,groundY,8.4,7.7,235);
  rootedArch(gateX,groundY,9.3,8.4,823);
  for(const [x,w,h] of [[14,3.7,5],[24.5,4.2,7],[34,3.1,4.7],[50,4,8],[63,3.4,6],[74,4.4,8.5],[88,3.3,6.2]]) {
    rootedArch(roadX(x),groundY,w,h,Math.round(x*121),'column');
  }
  // Cistern arches and hanging roots give the two extended areas distinct silhouettes.
  for(const [x,w,h] of [[120,7,7.2],[139,7.8,8.1],[154,6.1,6.8]]) rootedArch(roadX(x),.5,w,h,Math.round(x*37));
  function cavernVeil(kind){
    const [canvas,c]=cv(480,250), random=rng(kind==='water'?561:981);
    if(kind==='water'){
      for(let i=0;i<9;i++){
        const x=34+i*48+random()*18, w=2+random()*5;
        const fade=c.createLinearGradient(0,0,0,240);
        fade.addColorStop(0,'#4da5ae05');fade.addColorStop(.55,'#78d9dc7a');fade.addColorStop(1,'#3cb4c925');
        c.fillStyle=fade;c.fillRect(x,4,w,233);
        c.fillStyle='#a3e7e340';c.fillRect(x+2,90,1,56);
      }
      for(let i=0;i<135;i++){
        const x=random()*470,y=155+random()*85,len=4+random()*14;
        c.fillStyle=i%4===0?'#a3e3d845':'#67b1c426';c.fillRect(x,y,len,1);
      }
    }else{
      // Each cluster is fully contained in the texture. A shaded canopy hides
      // its join, and the individual branches taper before reaching any edge.
      const canopy=c.createRadialGradient(240,9,20,240,9,207);
      canopy.addColorStop(0,'#21192bce');canopy.addColorStop(.42,'#22192b7a');canopy.addColorStop(1,'#21192b00');
      c.fillStyle=canopy;c.fillRect(22,0,436,206);
      function rootLine(x,y,h,dx,w,phase,color){
        const at=j=>x+Math.sin(j*.034+phase)*j*.11+dx*(j/h)**1.28;
        c.fillStyle=color;
        for(let j=0;j<h;j++){
          const r=w*(1-j/h)**1.14, px=Math.round(at(j));
          c.fillRect(Math.round(px-r/2),y+j,Math.max(1,Math.ceil(r)),1);
        }
        return at;
      }
      for(let i=0;i<8;i++){
        const x=108+i*36+random()*18,y=14+Math.floor(random()*21),h=79+Math.floor(random()*119);
        const phase=random()*6,w=4+random()*9,dx=(random()-.5)*81;
        const trace=rootLine(x,y,h,dx,w,phase,i%3===0?'#594364be':'#261e36d0');
        for(let k=0;k<2;k++){
          const branch=19+Math.floor(random()*(h*.53)),bh=25+Math.floor(random()*42);
          rootLine(trace(branch),y+branch,Math.min(bh,241-y-branch),(k?1:-1)*(13+random()*25),w*.53,phase+k,'#342643ac');
        }
      }
      const fade=c.createLinearGradient(0,0,0,46);
      fade.addColorStop(0,'#0000');fade.addColorStop(1,'#fff');
      c.globalCompositeOperation='destination-in';c.fillStyle=fade;c.fillRect(0,0,480,250);
      c.globalCompositeOperation='source-over';
    }
    return texture(canvas);
  }
  const waterVeil=cavernVeil('water'),rootsVeil=cavernVeil('root');
  for(const old of [119,137,153]){const x=roadX(old);plane(waterVeil,x,3,-6,21,11,{opacity:.6});glow(x,1.2,-4,19,7,0x569da4,0x5fc7d0,.23);}
  for(const old of [168,185.5,203]){const x=roadX(old);plane(rootsVeil,x,6.2,-5,24,13,{opacity:.65});glow(x,3,-4,20,12,0xb8839f,0xb16aa7,.16);}
  // Landmarks frame the new vertical rooms rather than repeating the road.
  for(const [x,y,w,h,seed] of [[288,.37,9,8,884],[298,.37,9,12,224],[341,0,9,13,428],[358,3,10,17,937],
      [396,-11.3,8,10,546],[416,-11.3,10,11,779],[455,.28,7,12,431],[464,.28,10,15,524],[475,.28,11,17,725]]){
    const feet=rootedArch(roadX(x),y,w,h,seed);if(!feet)continue;
    const under=y<0, tower=x>330&&x<370;
    glow(feet.x,feet.y+3,-3.8,w+5,h,0xe4bd85,under?0x766eae:tower?0x75cad9:0xe394a2,under?.12:.23);
  }
  glow(swordX,2.5,-3.5,8.5,9.5,0xcf9b7b,0xb269e2,.30);
  glow(gateX,2.7,-3.5,8.5,10.5,0x9178bb,0x9357dc,.29);

  function lamp(x,y){
    const [canvas,c]=cv(22,54);
    c.fillStyle='#192126';c.fillRect(4,7,14,22); c.fillRect(8,1,6,6);
    c.fillStyle='#716559';c.fillRect(4,7,14,2);c.fillRect(3,25,16,3);
    c.fillStyle='#d48746';c.fillRect(6,12,10,11);c.fillStyle='#ffc67c';c.fillRect(7,13,8,9);
    c.fillStyle='#ffedb4';c.fillRect(9,15,4,5);c.fillStyle='#524435';c.fillRect(10,9,2,14);
    c.fillStyle='#22252c';c.fillRect(9,28,5,26);c.fillRect(6,50,11,4);
    c.fillStyle='#645345';c.fillRect(10,28,1,21);
    const m=plane(texture(canvas),x,y+.56,.19,.46,1.12);
    tint(m,0xffffff,0xcc9bea);
  }
  for(const p of lampFeet)lamp(p.x,p.y);

  const motes=[];
  const dustCount=125, pos=new Float32Array(dustCount*3), cols=new Float32Array(dustCount*3);
  const dustRand=rng(1289);
  for(let i=0;i<dustCount;i++){
    motes.push([dustRand(),dustRand(),dustRand()*6.28,dustRand(),dustRand()]);
  }
  const dustGeo=new THREE.BufferGeometry();
  dustGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  dustGeo.setAttribute('color',new THREE.BufferAttribute(cols,3));
  const dustMat=new THREE.PointsMaterial({size:2.1,sizeAttenuation:false,transparent:true,vertexColors:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending});
  const dust=new THREE.Points(dustGeo,dustMat);
  dust.frustumCulled=false;dust.renderOrder=-12;root.add(dust);
  const gold=new THREE.Color(0xffd488), violet=new THREE.Color(0xc695fa), moteColor=new THREE.Color();

  function update(time,cameraX,cameraY,corruption=0,viewWidth=20,viewHeight=11,travel={x:0,y:0}) {
    const c=Math.max(0,Math.min(1,corruption));
    const oldSky=!plague||cameraX<oldEnd+5;
    ambient.visible=clearing.visible=dust.visible=oldSky;
    for(const [m,start,end] of tinted) m.color.copy(start).lerp(end,c);
    framePlate(backdrop,cameraX,cameraY,viewWidth,viewHeight,travel,plates.sky,bgTex.userData.aspect||640/360);
    abyss.visible=abyssTex!==null&&c>.001;
    if(abyss.visible){
      abyss.material.opacity=c*c*(3-2*c);
      framePlate(abyss,cameraX,cameraY,viewWidth,viewHeight,travel,plates.eclipse,abyssTex.userData.aspect);
    }
    for(const {m,spec,rate} of cloudLayers){
      m.visible=abyss.visible&&m.userData.ready===true;if(!m.visible)continue;
      m.material.opacity=abyss.material.opacity;
      framePlate(m,cameraX,cameraY,viewWidth,viewHeight,travel,spec,m.userData.aspect);
      driftPlate(m,time,rate,travel.amount??1);
    }
    ambient.position.x=cameraX+viewWidth*.16;
    ambient.position.y=cameraY+viewHeight*.18;
    clearing.position.x=cameraX;
    clearing.position.y=cameraY-viewHeight*.28;
    for(const [m,op,x] of lights) m.material.opacity=op*(.88+.12*Math.sin(time*2.15+x*2.2)+.06*Math.sin(time*7.9+x));
    moteColor.copy(gold).lerp(violet,c);
    for(let i=0;i<dustCount;i++){
      const [x,y,a,d,s]=motes[i];
      const j=i*3, life=(y+time*(.023+.027*d))%1;
      pos[j]=cameraX+((x+time*.006)%1-.5)*viewWidth*1.08+Math.sin(time*.72+a)*.48;
      pos[j+1]=cameraY+(life-.5)*viewHeight*1.12;
      pos[j+2]=s>.75?.3:-3.1;
      const k=(.12+.88*Math.pow(Math.max(0,Math.sin(time*(.7+d)+a)),2))*Math.sin(life*Math.PI);
      cols[j]=moteColor.r*k;cols[j+1]=moteColor.g*k;cols[j+2]=moteColor.b*k;
    }
    dustGeo.attributes.position.needsUpdate=true;dustGeo.attributes.color.needsUpdate=true;
  }
  update(0,6,3.5);
  return {root, update};
}
