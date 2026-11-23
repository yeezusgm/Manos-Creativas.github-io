// Frisos de paisaje. Las formas se pintan con coordenadas continuas; sólo el
// destino de cada tramo de píxeles se envuelve al cruzar la costura del friso.
const W=768,H=256,bands=new Map();
function rng(seed){return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}

function ink(hexes){
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d'),im=ctx.createImageData(W,H);
  const px=new Uint32Array(im.data.buffer,im.data.byteOffset,W*H);
  // Convert through a byte view to keep the colour order endian-independent.
  const pal=hexes.map(hex=>{
    const n=parseInt(hex,16),bytes=new Uint8Array([n>>16,(n>>8)&255,n&255,255]);
    return new Uint32Array(bytes.buffer)[0];
  });
  function span(c,x,y,length){
    if(y<0||y>=H||length<=0)return;
    const row=y*W;
    if(length>=W){px.fill(pal[c],row,row+W);return;}
    x=((x%W)+W)%W;
    const n=Math.min(length,W-x);
    px.fill(pal[c],row+x,row+x+n);
    if(n<length)px.fill(pal[c],row,row+length-n);
  }
  function box(c,x,y,w=1,h=1){
    x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);
    for(let k=0;k<h;k++)span(c,x,y+k,w);
  }
  function poly(c,pts){
    const ys=pts.map(p=>p[1]),lo=Math.max(0,Math.ceil(Math.min(...ys)-.5)),hi=Math.min(H,Math.ceil(Math.max(...ys)-.5));
    for(let y=lo;y<hi;y++){
      const at=y+.5,xs=[];
      for(let i=0,j=pts.length-1;i<pts.length;j=i++){
        const a=pts[j],b=pts[i];
        if((a[1]>at)!==(b[1]>at))xs.push(a[0]+(b[0]-a[0])*(at-a[1])/(b[1]-a[1]));
      }
      xs.sort((a,b)=>a-b);
      for(let i=0;i+1<xs.length;i+=2){
        const x=Math.ceil(xs[i]-.5);span(c,x,y,Math.ceil(xs[i+1]-.5)-x);
      }
    }
  }
  // Tapered stems built from small integer-edged facets, not antialiased paths.
  function stem(c,pts,widths){
    const l=[],r=[];
    for(let i=0;i<pts.length;i++){
      const a=pts[Math.max(i-1,0)],b=pts[Math.min(i+1,pts.length-1)];
      const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;
      const n=widths[i]/(2*len),p=pts[i];
      l.push([p[0]-dy*n,p[1]+dx*n]);r.push([p[0]+dy*n,p[1]-dx*n]);
    }
    poly(c,l.concat(r.reverse()));
  }
  function leaf(c,x,y,dx,dy,w){
    const n=w/(Math.hypot(dx,dy)||1);
    poly(c,[[x,y],[x+dx*.46-dy*n,y+dy*.46+dx*n],[x+dx,y+dy],
      [x+dx*.62+dy*n*.68,y+dy*.62-dx*n*.68]]);
  }
  function shape(c,x,y,s,pts,flip=1){poly(c,pts.map(([a,b])=>[x+a*s*flip,y+b*s]));}
  return {canvas,box,poly,stem,leaf,shape,done(){ctx.putImageData(im,0,0);return canvas;}};
}

// Rim light stays coloured and subdued: no highlights are white or game-token gold.
const forest=['2f4b53','385852','41605a','29464a','344c4b','4e6260','293e49','47605a','44595a'],
  understory=['152a31','233a3b','2b4242','344b45','365245','425743','1b3134','42524b'],
  cavern=['363c53','43516a','4b5a70','354455','4e616f','596c76','414558','536475','354050'],
  ledge=['202632','2b3142','343c4c','414d5a','4a555f','29323e','394755'],
  swamp=['394c4b','4a5852','576256','384745','515b4e','626a59','42534c','4e5956','3a4848'],
  fen=['242e2e','353f35','45503f','515a44','605e4c','494b40','293a34','536350'];

function crown(b,x,y,w,h,c,r){
  const pts=[];
  for(let i=0;i<18;i++){
    const a=i*Math.PI/9,rad=.80+r()*.25;
    pts.push([x+Math.cos(a)*w*rad,y+Math.sin(a)*h*rad]);
  }
  b.poly(c,pts);
  // Jagged leaf margins in small clumps around the polygon, never as loose noise.
  for(const [x0,y0] of pts){
    b.box(c,x0-1,y0-1,4+r()*5,2+r()*3);
    if(r()>.42)b.box(c,x0+2,y0-2,2,2);
  }
}
function arch(b,x,y,s,tone,light){
  // The negative space of the lancet and its oculus is transparent.
  const f=(c,pts)=>b.shape(c,x,y,s,pts);
  for(const d of [-1,1]){
    b.shape(tone,x,y,s,[[0,-75],[6,-68],[14,-62],[20,-51],[21,-43],[22,0],[15,1],
      [14,-45],[12,-53],[7,-60],[2,-64],[-1,-67]],d);
    b.shape(light,x,y,s,[[1,-71],[8,-64],[16,-56],[18,-48],[15,-55],[9,-61]],d);
    b.shape(tone,x,y,s,[[20,-36],[27,-38],[26,-17],[33,0],[23,0],[19,-9]],d);
    b.shape(light,x,y,s,[[25,-36],[26,-35],[24,-20],[23,-16]],d);
  }
  f(tone,[[-2,-76],[0,-83],[2,-75],[2,-70],[-2,-70]]);
  f(light,[[-22,-43],[-15,-43],[-15,-40],[-22,-41]]);
}
function woodlandMid(b,r){
  // Low tree islands separated by mist; a ruined pair of springing arches breaks
  // their rhythm. All bases slope away instead of forming a playable-looking lip.
  for(const [x,y,s,d] of [[-8,263,1.24,-1],[58,260,.89,1],[173,260,.75,-1],
    [246,262,.6,1],[364,265,.83,1],[450,260,.97,-1],[572,262,.62,-1],[655,264,.77,1]]){
    const py=y-103*s;
    b.shape(0,x,y,s,[[-11,0],[-5,-17],[-4,-58],[-9,-77],[-21,-93],[-20,-97],
      [-6,-85],[0,-70],[4,-95],[8,-94],[3,-66],[2,-33],[6,-5],[15,0]],d);
    for(const [dx,dy,w,h] of [[-23,4,22,12],[-8,-5,23,14],[14,-1,21,13],[30,9,17,9],[-3,10,34,13]]){
      crown(b,x+dx*s*d,py+dy*s,w*s,h*s,0,r);
    }
    for(const [dx,dy,w] of [[-19,1,10],[-3,-8,9],[14,-2,10]]){
      crown(b,x+dx*s*d,py+dy*s,w*s,3.4*s,1,r);
    }
    b.shape(1,x,y,s,[[-4,-54],[0,-65],[-2,-49],[-1,-15],[-3,-13]],d);
  }
  arch(b,281,248,.95,4,5);arch(b,315,250,.67,4,5);
  arch(b,524,254,.53,4,5);
  for(const [x,y,s] of [[223,259,1],[338,261,.9],[491,260,.6]]){
    b.shape(4,x,y,s,[[-8,0],[-6,-35],[-3,-38],[-3,-60],[1,-60],[2,-54],[5,-56],
      [6,-30],[9,-28],[9,-7],[14,-1]]);
    b.shape(5,x,y,s,[[-3,-52],[-1,-52],[-1,-40],[-3,-37]]);
  }
  for(const [x,y,w] of [[2,244,72],[88,250,45],[188,254,40],[363,244,48],
    [436,249,56],[553,254,40],[654,247,55],[722,251,28]]){
    for(let k=0;k<4;k++)crown(b,x+(k-1.5)*w*.39,y+Math.abs(k-1.5)*4+r()*4,w*.39,12+r()*6,3,r);
    for(let k=0;k<5;k++)b.box(7,x+(r()-.5)*w,y-8+r()*5,3+r()*6,2);
  }
}
function leafBough(b,x,y,s,flip,r){
  const p=(a,h)=>[x+a*s*flip,y+h*s];
  const branch=(color,nodes,widths)=>b.stem(color,nodes.map(([a,h])=>p(a,h)),widths.map(w=>w*s));
  branch(0,[[-12,-5],[0,1],[16,7],[36,10],[59,7],[72,2]],[12,11,7,4,2,0]);
  branch(2,[[1,2],[17,7],[33,10],[48,8]],[2,2,1,0]);
  for(const [a,h,dx,dy] of [[7,4,-12,12],[15,7,9,18],[27,9,13,14],[34,10,13,-8],[43,9,12,10],[54,8,9,7]]){
    branch(1,[[a,h],[a+dx*.6,h+dy*.62],[a+dx,h+dy]],[2.1,1.25,.5]);
    for(let j=1;j<5;j++){
      const t=(j+1)/6,origin=p(a+dx*t,h+dy*t);
      const f=j%2?-1:1;
      b.leaf(j===3?3:1,...origin,(5.2+r()*4)*s*f*flip,(3+r()*5)*s,1.5*s);
    }
    const at=p(a+dx,h+dy);b.leaf(2,...at,2*s*flip,6*s,1.3*s);
  }
}
function fern(b,x,y,s,flip=1){
  for(const [dx,dy] of [[30,-24],[14,-34],[-8,-29],[-24,-17]]){
    const nodes=[[x,y],[x+dx*.27*s*flip,y+dy*.55*s],[x+dx*s*flip,y+dy*s]];
    b.stem(1,nodes,[2.6*s,1.5*s,.5]);
    for(let j=1;j<8;j++){
      const t=j/8,ox=x+dx*(t*.50+t*t*.5)*s*flip,oy=y+dy*(t*1.18-t*t*.18)*s;
      const size=(Math.sin(Math.PI*t)*7+1)*s;
      for(const d of [-1,1])b.leaf(j%4===1?3:2,ox,oy,d*size*.82*flip,-size*(d===1?.6:1),size*.19);
    }
  }
}
function woodlandNear(b,r){
  // Long branches overlap the bright sky; feathered leaves end well above Tom.
  for(const [x,scale,dir] of [[49,1,1],[337,.79,-1],[571,.91,1]]){
    const at=(u,v)=>[x+u*scale*dir,v*scale];
    const stem=(col,pts,ws)=>b.stem(col,pts.map(([u,v])=>at(u,v)),ws.map(n=>n*scale));
    stem(0,[[-27,-9],[-11,-1],[5,11],[24,21],[45,24],[62,33],[79,32]],[13,11,8,6,4,2,.5]);
    stem(2,[[-9,1],[8,13],[23,20],[39,22]],[2.7,2,1.4,.4]);
    for(const [u,v,du,dv] of [[13,15,-6,14],[23,20,12,19],[38,23,15,-8],[45,25,7,17],[59,32,8,14],[68,32,13,-4]]){
      stem(1,[[u,v],[u+du*.26,v+dv*.5],[u+du,v+dv]],[2.8,1.8,.45]);
      for(let k=1;k<=3;k++){
        const t=k/3,d=k%2?-1:1,pt=at(u+du*t,v+dv*t);
        b.leaf(k===2?2:1,...pt,d*dir*(6+r()*6)*scale,(4+r()*5)*scale,2.7*scale);
      }
    }
  }
  for(const [x,y,s,d] of [[-7,-4,1.18,1],[121,-9,.78,-1],[218,-11,.83,1],
    [398,-7,1.04,-1],[521,-8,.7,1],[624,-4,1.15,1],[709,-7,.7,-1]])leafBough(b,x,y,s,d,r);
  for(const [x,y,s,d] of [[9,260,.77,1],[93,266,.55,-1],[261,263,1.13,-1],[308,263,.65,1],
    [436,263,.65,-1],[611,262,.94,1],[641,267,.64,-1],[748,262,.64,1]])fern(b,x,y,s,d);
  b.shape(0,332,257,1,[[-21,0],[-12,-3],[5,-6],[18,-15],[23,-15],[16,-10],[13,-9],[24,-8],[27,-7],[14,-6],[7,-3],[5,0]]);
}

function fang(b,x,y,w,h,c,l,r){
  const tilt=(r()-.5)*w*.85,side=r()>.5?-1:1;
  b.poly(c,[[x-w*.56,y],[x-w*.38,y+h*.39],[x+tilt-w*.12,y+h*.84],[x+tilt,y+h],
    [x+tilt+w*.17,y+h*.70],[x+w*.44,y+h*.32],[x+w*.54,y]]);
  b.poly(l,[[x+w*.22*side,y],[x+tilt+w*.02*side,y+h*.39],
    [x+tilt,y+h*.9],[x+tilt+w*.095*side,y+h*.72],[x+w*.33*side,y+h*.20]]);
}
function caveMid(b,r){
  for(const [x,y,w,h] of [[-8,4,96,27],[77,0,62,15],[233,-2,113,24],[326,1,45,13],
    [492,0,68,22],[626,0,77,25],[721,-2,47,15]]){
    b.poly(0,[[x-w*.5,-5],[x+w*.56,-5],[x+w*.5,y+3],[x+w*.28,y+h*.49],
      [x+w*.1,y+h*.64],[x-w*.08,y+h],[x-w*.31,y+h*.52],[x-w*.48,y+4]]);
    for(let k=0;k<6;k++)fang(b,x+(r()-.5)*w*.81,y+1,5+r()*9,h*(.38+r()*1.15),0,1,r);
  }
  for(const [x,w,h] of [[45,82,42],[176,37,64],[287,55,43],[346,26,78],
    [430,68,35],[520,31,67],[609,60,36],[685,42,83],[750,65,45]]){
    const t=x+(r()-.5)*w*.24,base=H+3;
    b.poly(0,[[x-w*.63,base],[x-w*.37,base-h*.34],[x-w*.28,base-h*.5],
      [t-2,base-h],[t+4,base-h*.95],[x+w*.26,base-h*.36],[x+w*.52,base-h*.16],[x+w*.6,base]]);
    b.poly(1,[[t-2,base-h],[t+3,base-h*.95],[t+w*.08,base-h*.69],[t-2,base-h*.74],[x-w*.23,base-h*.3],[x-w*.18,base-h*.56]]);
  }
  // A split mineral column in the murk. The vertical gap between cap and foot
  // leaves the cave silhouette open around the camera's focus.
  for(const [x,s] of [[115,.72],[583,.86]]){
    b.shape(3,x,0,s,[[-22,-3],[24,-2],[13,15],[8,47],[2,71],[0,49],[-6,37],[-9,15]]);
    b.shape(4,x,0,s,[[-5,2],[1,9],[4,35],[1,43],[-1,24]]);
    b.shape(3,x,256,s,[[-24,2],[-14,-14],[-8,-48],[-4,-63],[0,-57],[4,-34],[9,-45],[12,-18],[22,-2]]);
    b.shape(4,x,256,s,[[-9,-24],[-5,-59],[-3,-55],[-5,-33]]);
  }
  for(const [x,w,h] of [[5,89,17],[217,97,17],[377,108,23],[592,77,14],[720,82,20]]){
    b.shape(3,x,256,1,[[-w*.55,4],[-w*.4,-3],[-w*.26,-h*.52],[-w*.05,-h],
      [w*.12,-h*.8],[w*.23,-h*.47],[w*.44,-h*.41],[w*.55,3]]);
    b.shape(4,x,256,1,[[-w*.25,-h*.45],[-w*.05,-h],[w*.09,-h*.8],[-w*.06,-h*.79]]);
  }
}
function caveNear(b,r){
  for(const [x,w,t] of [[-9,91,1],[92,29,.6],[203,49,.77],[322,85,1],[459,37,.76],[568,68,.95],[701,45,.71]]){
    const pts=[[x-w*.55,-2],[x+w*.57,-2],[x+w*.49,4*t],[x+w*.30,7*t],
      [x+w*.05,14*t],[x-w*.21,12*t],[x-w*.39,6*t]];
    b.poly(0,pts);
    for(const n of [-.32,-.16,.055,.23]){
      const y=2+r()*6;
      fang(b,x+n*w,y,7+r()*9,(12+r()*26)*t,1,2,r);
    }
    b.shape(2,x,6*t,t,[[-12,0],[-4,-4],[10,-3],[3,-1],[-8,3]]);
  }
  for(const [x,w,h] of [[51,52,13],[292,69,18],[493,33,9],[662,56,16]]){
    b.shape(0,x,256,1,[[-w*.6,0],[-w*.34,-h*.42],[-w*.21,-h*.51],[-2,-h],[3,-h],
      [w*.19,-h*.4],[w*.25,-h*.47],[w*.57,-3],[w*.62,1]]);
    b.shape(2,x,256,1,[[-w*.31,-h*.4],[-2,-h],[2,-h],[-5,-h*.73],[-w*.25,-h*.35]]);
    fang(b,x+w*.28,258,7,-h*.98,1,2,r);
  }
}

function drownedTree(b,x,y,s,d,r){
  const p=pts=>pts.map(([a,h])=>[x+a*s*d,y+h*s]),f=(c,pts,ws)=>b.stem(c,p(pts),ws.map(k=>k*s));
  f(0,[[-2,0],[0,-15],[-6,-40],[-2,-61],[-12,-80],[-9,-101]],[15,10,7,5,3,0]);
  f(0,[[-5,-37],[6,-54],[21,-62],[33,-83],[38,-87]],[7,5,3,1.4,0]);
  f(0,[[-2,-60],[-20,-71],[-27,-87],[-40,-93]],[5,3,1.8,0]);
  f(0,[[12,-57],[14,-75],[11,-84],[14,-93]],[4,2,1,0]);
  f(0,[[28,-73],[40,-74],[48,-82]],[2,1.3,0]);
  f(0,[[-14,-68],[-21,-64],[-30,-65]],[2,1,0]);
  f(0,[[-4,-63],[-6,-78],[0,-89],[0,-99]],[4,2,1,0]);
  f(1,[[-5,-5],[-2,-15],[-6,-36],[-4,-48]],[2.8,1.8,1,.1]);
  // Small strands of Spanish moss hang on one side of each dead crown.
  for(const [a,h] of [[23,-65],[29,-72],[-22,-74],[-27,-83]]){
    const l=5+r()*10;
    f(1,[[a,h],[a+1,h+3],[a+1,h+l*.65],[a-1,h+l]],[2.8,2.2,1,.2]);
  }
  for(const dir of [-1,1])
    f(0,[[0,-10],[dir*7,-6],[dir*16,-4],[dir*22,1]],[7,4,2,0]);
}
function marshMid(b,r){
  for(const [x,s,d] of [[-5,.87,1],[73,.64,-1],[135,1.14,1],[241,.59,-1],[341,.71,1],
    [467,1.03,-1],[546,.61,1],[659,.84,-1],[727,.46,1]])drownedTree(b,x,261,s,d,r);
  // A broken sluice: uneven stone piers, one arch slumped into the fen.
  arch(b,294,252,.68,3,4);
  b.shape(3,318,255,.84,[[-7,0],[-5,-28],[-9,-34],[-7,-49],[-4,-46],[0,-52],[4,-49],
    [5,-39],[7,-37],[6,-18],[12,-1]]);
  b.shape(4,318,255,.84,[[-7,-46],[-3,-42],[0,-46],[-2,-42],[-4,-37],[-6,-38]]);
  arch(b,585,260,.46,3,4);
  for(const [x,w,h] of [[4,69,18],[83,77,14],[196,73,15],[357,54,13],[440,80,20],
    [540,63,12],[626,78,18],[740,55,16]]){
    const q=(r()-.5)*10;
    b.poly(3,[[x-w*.6,260],[x-w*.48,256-h*.18],[x-w*.15,256-h*.64],
      [x+q,256-h],[x+w*.12,256-h*.72],[x+w*.42,256-h*.44],[x+w*.57,257]]);
    for(let i=0;i<10;i++){
      const a=x+(r()-.5)*w*.73,off=r()*4;
      const y=254-h*.36-off; b.leaf(i%3?6:4,a,y,2+r()*5,-4-r()*8,1.1);
    }
  }
}
function reeds(b,x,y,s,d,r){
  const tips=[[-18,-23],[-13,-39],[-3,-30],[4,-34],[12,-27],[20,-15]];
  for(const [dx,dy] of tips){
    const bend=(r()-.5)*5,k=dx*d*s;
    b.stem(1,[[x,y],[x+k*.22,y+dy*.57*s],[x+k*.63+bend,y+dy*.94*s],[x+k,y+dy*s]],
      [2.7*s,1.7*s,s*.9,0]);
    if(dx===-13||dx===4){
      const tx=x+k*.86+bend*.35,ty=y+dy*.98*s;
      b.stem(4,[[tx-1.35*d*s,ty+4*s],[tx,ty],[tx+d*s,ty-3*s]],[2.6*s,3*s,1.4*s]);
    }
  }
  for(let i=0;i<5;i++)b.leaf(i%3?2:3,x+(r()-.5)*7*s,y,(-17+r()*34)*s,-(6+r()*14)*s,1.7*s);
}
function pod(b,x,y,s,d){
  b.shape(1,x,y,s,[[-2,0],[-4,-8],[-4,-15],[0,-22],[1,-19],[-2,-13],[-1,-8],[2,0]],d);
  b.shape(1,x,y,s,[[-3,-20],[-4,-24],[-2,-31],[2,-34],[5,-33],[8,-29],[7,-24],[3,-19],[0,-17]],d);
  b.shape(3,x,y,s,[[-3,-25],[-1,-30],[2,-32],[4,-32],[1,-29],[0,-25],[-1,-21]],d);
  b.shape(5,x,y,s,[[3,-27],[5,-30],[6,-29],[4,-26]],d);
}
function marshNear(b,r){
  // Salt moss falls from high, drowned limbs; narrow hanging strands read even
  // when the near reeds are hidden behind the walkable bank.
  for(const [x,dir,size] of [[30,1,1.05],[288,-1,.79],[593,1,.98]]){
    const at=(a,h)=>[x+a*dir*size,h*size];
    const stem=(col,pts,ws)=>b.stem(col,pts.map(([a,h])=>at(a,h)),ws.map(n=>n*size));
    stem(0,[[-29,-7],[-11,1],[6,11],[25,14],[39,11],[55,15],[66,12]],[12,10,8,7,4,2,.5]);
    for(const [a,h,len] of [[6,10,21],[13,11,29],[24,13,38],[28,14,24],[46,13,19],[56,14,22]]){
      const drift=(r()-.5)*6;
      stem(1,[[a,h],[a+2,h+7],[a+drift-1,h+len*.66],[a+drift,h+len]],[3.4,2.8,1.8,.4]);
      b.leaf(2,...at(a+1,h+9),3*dir*size,7*size,1.2*size);
      b.leaf(3,...at(a+drift-1,h+len*.66),-2.4*dir*size,4*size,.9*size);
    }
  }
  for(const [x,s,d] of [[-6,.86,1],[28,.68,-1],[118,.75,1],[245,1.08,-1],[269,.66,1],
    [426,.77,1],[538,.97,-1],[571,.65,1],[678,.86,1],[737,.67,-1]])reeds(b,x,261,s,d,r);
  for(const [x,s,d] of [[39,.72,1],[244,.87,-1],[254,.56,1],[513,.98,1],[528,.65,-1],[684,.68,1]])pod(b,x,259,s,d);
  for(const [x,w] of [[-12,40],[180,46],[401,30],[646,60]]){
    const pts=[[x-w,-3],[x-w*.73,2],[x-w*.4,5],[x,2],[x+w*.26,5],[x+w*.45,7],[x+w*.72,2],[x+w,-4]];
    b.stem(1,pts,[6,5,3,4,2.5,2,1.5,0]);
    for(const t of [-.48,.32]){
      const a=x+w*t;b.stem(1,[[a,3],[a+2,8],[a-1,12],[a-2,18+r()*8]],[2.7,1.8,1,.3]);
    }
  }
}

const recipe={
  bosque:{medio:[forest,woodlandMid,431],cerca:[understory,woodlandNear,1069]},
  cueva:{medio:[cavern,caveMid,2609],cerca:[ledge,caveNear,5209]},
  marjal:{medio:[swamp,marshMid,719],cerca:[fen,marshNear,1453]}
};
export function paintDepthBand(kind,depth){
  const key=kind+':'+depth;
  if(!bands.has(key)){
    const [palette,paint,seed]=recipe[kind][depth];
    const b=ink(palette);paint(b,rng(seed));bands.set(key,b.done());
  }
  return bands.get(key);
}
