import {framePlate,plates,marshBlend,driftPlate,escalaFondos} from './paralaje.js';
// The Marjal is drawn behind the collision plane. Only its crusts and pools are at
// the actual damage rectangles. Canvas textures are shared by WebGL and Canvas 2D.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const seeded=s=>()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
const tau=Math.PI*2;
function surface(w,h){const a=document.createElement('canvas');a.width=w;a.height=h;const g=a.getContext('2d');g.imageSmoothingEnabled=false;return [a,g];}
function box(c,col,x,y,w,h){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function poly(c,col,pts){c.beginPath();for(const [i,[x,y]] of pts.entries())i?c.lineTo(x,y):c.moveTo(x,y);c.closePath();c.fillStyle=col;c.fill();}
function line(c,col,w,pts){c.beginPath();for(const [i,[x,y]] of pts.entries())i?c.lineTo(x,y):c.moveTo(x,y);c.strokeStyle=col;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.stroke();}
function oval(c,col,x,y,rx,ry){c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,tau);c.fill();}
function halo(c,x,y,r,col){const g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,col);g.addColorStop(1,col.slice(0,7)+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function cap(c,x,y,s,flip=1){
 c.save();c.translate(x,y);c.scale(s*flip,s);
 poly(c,'#626448',[[-3,0],[1,-2],[3,6],[7,14],[3,15],[-2,7]]);
 poly(c,'#b39b67',[[-1,0],[1,-1],[2,6],[5,12],[3,10]]);
 poly(c,'#322c3a',[[-16,0],[-13,-4],[-6,-8],[1,-10],[5,-9],[15,-5],[19,-2],[16,1],[5,4],[-6,4]]);
 poly(c,'#927461',[[-15,0],[-10,-5],[-2,-9],[4,-8],[14,-5],[18,-2],[10,-1],[1,1],[-8,2]]);
 poly(c,'#c2ae7b',[[-14,0],[-8,-2],[0,-2],[12,-4],[17,-3],[15,-1],[3,2],[-9,3]]);
 for(let i=0;i<5;i++)line(c,'#51493d',.9,[[2,2],[-10+6*i,3-(i%2)]]);
 box(c,'#e4ca8f',-3,-6,3,1);box(c,'#d5bc84',4,-6,2,1);c.restore();
}
function roots(c,x,y,scale,r){
 c.save();c.translate(x,y);c.scale(scale,scale);
 function fork(px,py,ang,len,thick,depth){
  const a=ang+(r()-.5)*.32,mid=[px+Math.cos(a)*len*.46,py+Math.sin(a)*len*.46],end=[mid[0]+Math.cos(ang)*len*.55,mid[1]+Math.sin(ang)*len*.55];
  line(c,'#292733',thick+1.3,[[px,py],mid,end]);line(c,depth>2?'#565047':'#666245',Math.max(1,thick*.63),[[px-1,py],[mid[0]-1,mid[1]],end]);
  if(depth>0){fork(...end,a-.37-r()*.56,len*(.63+r()*.15),thick*.61,depth-1);fork(...end,a+.27+r()*.55,len*(.55+r()*.19),thick*.55,depth-1);}
  else if(r()>.25){oval(c,'#879258',end[0],end[1],1.5,2.5);box(c,'#dacb8f',end[0],end[1]-2,1,1);}
 }
 fork(0,0,-1.5,38,12,4);c.restore();
}
function rib(c,x,y,h,lean){
 const shape=(color,d,w)=>{c.beginPath();c.moveTo(x+d,y);c.bezierCurveTo(x+lean-h*.29+d,y-h*.41,x+lean-h*.27+d,y-h*.9,x+lean+h*.10+d,y-h);c.bezierCurveTo(x+lean-h*.17+d,y-h*.71,x+lean-h*.13+d,y-h*.46,x+w+d,y);c.closePath();c.fillStyle=color;c.fill();};
 shape('#302b35',2,10);shape('#746e58',0,7);shape('#a19872',-1,2);
}
function bog(c,r){
 for(const [x,h] of [[26,67],[46,94],[85,66],[244,84],[280,58]]){const drift=(r()-.5)*16;line(c,'#363b39',3,[[x,200],[x+drift,200-h],[x+drift-7,201-h-13]]);}
 roots(c,143,195,1.47,r);roots(c,47,195,.49,r);
 for(const [x,y,s,fl] of [[138,157,.9,1],[148,147,.67,-1],[142,139,.47,1],[132,154,.49,-1],[124,177,1.0,-1],[162,184,.61,1],[22,188,.5,-1],[107,195,.56,1],[253,183,.6,-1]])cap(c,x,y,s,fl);
 for(let i=0;i<7;i++)rib(c,171+i*12,196+Math.sin(i*.55)*3,18+30*Math.sin((i+1)*.37),-5);
 for(let i=0;i<85;i++){const x=10+r()*271,y=197+r()*7,h=3+r()*15;line(c,i%3?'#343d37':'#72745a',1,[[x,y],[x-2,y-h*.55],[x+(r()-.5)*7,y-h]]);}
}
function tank(c,x,y,w,h,r){
 c.save();c.translate(x,y);const X=n=>n*w,Y=n=>n*h;
 poly(c,'#292a32',[[X(-.52),Y(.05)],[X(-.49),Y(-.66)],[X(-.34),Y(-.88)],[X(-.18),Y(-.94)],[X(-.17),Y(-1.05)],[X(.17),Y(-1.05)],[X(.18),Y(-.94)],[X(.37),Y(-.85)],[X(.48),Y(-.66)],[X(.51),Y(.05)]]);
 const grad=c.createLinearGradient(-w*.47,0,w*.47,0);grad.addColorStop(0,'#514c45');grad.addColorStop(.23,'#827154');grad.addColorStop(.47,'#78634e');grad.addColorStop(.80,'#4b4843');grad.addColorStop(1,'#353a3b');
 poly(c,grad,[[X(-.45),0],[X(-.44),Y(-.63)],[X(-.30),Y(-.83)],[0,Y(-.96)],[X(.30),Y(-.84)],[X(.44),Y(-.66)],[X(.47),0]]);
 for(const q of [.21,.49,.71]){line(c,'#3f3938',4,[[X(-.45),Y(-q)],[0,Y(-q+.025)],[X(.43),Y(-q)]]);line(c,'#a38b66',1,[[X(-.44),Y(-q)-1],[0,Y(-q+.025)-1],[X(.39),Y(-q)-1]]);for(let i=-3;i<=3;i++)box(c,'#b19b73',i*w*.11,Y(-q)+1,1.2,1.2);}
 for(let i=0;i<13;i++){const a=(r()-.5)*w*.8,b=-r()*h*.67;line(c,i%2?'#8e775839':'#252b306b',.8,[[a,b],[a+1,b+4+r()*12]]);}
 box(c,'#3c3b3c',-w*.17,-h*1.06,w*.34,5);box(c,'#ae9a75',-w*.17,-h*1.07,w*.31,2);c.restore();
}
function vats(c,r){
 for(let j=0;j<3;j++){const x=33+j*81;poly(c,'#3a4140',[[x-6,194],[x-4,76-j*11],[x+3,66-j*11],[x+6,193]]);}
 const pipe=(pts,w)=>{line(c,'#2d3033',w+3,pts);line(c,'#76624e',w,pts);line(c,'#b09b70',Math.max(1,w*.16),pts.map(([x,y])=>[x-1,y-2]));};
 pipe([[22,153],[44,153],[44,93],[61,78],[170,78],[181,87],[181,128]],8);
 tank(c,76,192,64,78,r);tank(c,175,193,87,111,r);tank(c,254,196,41,63,r);
 pipe([[69,167],[109,167],[119,156],[119,127],[144,127]],6);
 pipe([[210,151],[227,151],[236,142],[236,112],[250,109]],5);
 for(const [x,y,s] of [[118,144,1],[77,146,.67],[229,150,.75]]){
  c.strokeStyle='#362e32';c.lineWidth=4;c.beginPath();c.arc(x,y,8*s,0,tau);c.stroke();c.strokeStyle='#bb9967';c.lineWidth=2;c.stroke();
  for(let i=0;i<4;i++){const a=i*Math.PI*.5+.4;line(c,'#9b845f',1.4,[[x,y],[x+Math.cos(a)*7*s,y+Math.sin(a)*7*s]]);}
  oval(c,'#d1b982',x,y,2,2);
 }
 for(let i=0;i<16;i++){const x=29+r()*250,y=192+r()*8;cap(c,x,y,.17+r()*.25,i%2?1:-1);}
}
function pointed(c,x,y,w,h,color){
 c.fillStyle=color;c.beginPath();c.moveTo(x-w/2,y);c.lineTo(x-w/2,y-h*.52);
 c.quadraticCurveTo(x-w/2,y-h*.72,x,y-h);c.quadraticCurveTo(x+w/2,y-h*.72,x+w/2,y-h*.51);c.lineTo(x+w/2,y);c.closePath();c.fill();
}
function bell(c,x,y,s){
 c.save();c.translate(x,y);c.scale(s,s);
 line(c,'#4b493e',3,[[0,-34],[0,-22]]);box(c,'#c2ac76',-2,-20,4,6);
 poly(c,'#332c32',[[-25,20],[-21,14],[-17,8],[-14,-7],[-9,-17],[-4,-19],[-4,-23],[5,-23],[5,-19],[12,-14],[16,-4],[18,9],[24,18],[26,22],[2,25],[-24,23]]);
 poly(c,'#89734e',[[-23,19],[-16,11],[-12,-7],[-7,-15],[0,-17],[7,-15],[12,-8],[16,10],[22,18],[3,21]]);
 poly(c,'#b79b66',[[-19,15],[-15,7],[-11,-7],[-6,-14],[-2,-15],[-8,-3],[-11,11]]);
 line(c,'#dfbd7e',2,[[-21,19],[-8,19],[5,20],[21,18]]);line(c,'#615848',1,[[-12,9],[-3,10],[14,9]]);
 oval(c,'#2c2c31',0,22,23,2.5);oval(c,'#a08a65',0,25,3,5);line(c,'#7a7354',1,[[0,30],[-1,49],[2,65]]);
 c.restore();
}
function belfry(c,r){
 for(const [x,y,s] of [[41,89,.61],[229,69,.73],[262,109,.48]]){
  c.save();c.translate(x,y);c.scale(s,s);poly(c,'#414541',[[-18,151],[-18,10],[-13,6],[-14,-5],[-6,-7],[0,-30],[5,-8],[15,-4],[13,6],[17,10],[19,151]]);
  pointed(c,0,29,16,30,'#2e3538');for(let i=0;i<7;i++)box(c,'#646454',-16,33+i*18,31,1);c.restore();
 }
 const x=142;pointed(c,x,171,87,143,'#34383a');pointed(c,x,162,73,126,'#686858');pointed(c,x,159,63,115,'#283337');
 for(const side of [-1,1]){
  const xx=x+side*46;poly(c,'#35363a',[[xx-15,194],[xx-11,83],[xx-7,77],[xx-7,53],[xx-2,49],[xx,18],[xx+3,48],[xx+9,54],[xx+11,78],[xx+14,91],[xx+15,194]]);
  box(c,'#71705b',xx-6,66,4,124);box(c,'#525343',xx+3,73,3,119);
  for(let j=0;j<7;j++){box(c,'#8a8266',xx-11,84+j*16,22,1);box(c,'#30373a',xx-10,86+j*16,20,2);}
  line(c,'#77775b',1,[[xx,22],[xx,13],[xx-2,17]]);
 }
 line(c,'#806f58',4,[[101,86],[183,86]]);bell(c,x,104,1.09);
 for(const side of [-1,1])for(let j=0;j<2;j++)pointed(c,x+side*(57+j*24),191,14,42-j*7,'#333d3b');
 for(let j=0;j<16;j++){const xx=94+r()*89;cap(c,xx,178+r()*18,.16+r()*.20,j%2?1:-1);}
}
function hothouse(c,r){
 const x=147,base=196,rx=107,ry=105,roof=51;
 const top=d=>base-ry-Math.sqrt(Math.max(0,1-(d/rx)**2))*roof;
 c.beginPath();c.moveTo(x-rx,base);c.lineTo(x-rx,base-ry);
 for(let dx=-rx;dx<=rx;dx+=2)c.lineTo(x+dx,top(dx));c.lineTo(x+rx,base);c.closePath();
 const fill=c.createLinearGradient(0,40,0,198);fill.addColorStop(0,'#526a62');fill.addColorStop(.53,'#424f49');fill.addColorStop(1,'#353539');c.fillStyle=fill;c.fill();
 halo(c,x,134,81,'#d4b85b40');
 for(let j=0;j<9;j++)for(let k=0;k<3;k++){
  const left=-rx+j*rx*2/9+2,w=rx*2/9-4;
  const yl=top(left)+6,yr=top(left+w)+6,l0=yl+(base-yl)*k/3,r0=yr+(base-yr)*k/3;
  const l1=yl+(base-yl)*(k+1)/3,r1=yr+(base-yr)*(k+1)/3;
  if((j*9+k*3)%11===0)continue;
  poly(c,['#9dad854b','#859e8a52','#66898173','#baab7846'][(j+k*2)%4],[[x+left,l0],[x+left+w,r0],[x+left+w,r1-4],[x+left,l1-4]]);
  if((j+k)%4===1)line(c,'#c2bc8a70',1,[[x+left+w*.7,r0],[x+left+w*.35,r0+8],[x+left+w*.5,r0+13],[x+left+w*.18,r0+20]]);
 }
 roots(c,x+9,193,1.43,r);
 for(const [dx,dy,s] of [[9,-41,.58],[0,-68,.49],[-24,-80,.35],[21,-79,.34],[43,-68,.30]])cap(c,x+dx,193+dy,s,dx>0?1:-1);
 for(let j=0;j<=10;j++){const dx=-rx+j*rx*.2;
  line(c,'#373c37',3,[[x+dx,top(dx)+2],[x+dx*.96,base]]);
  line(c,'#8c8764',1,[[x+dx-1,top(dx)+3],[x+dx*.96-1,base-2]]);
 }
 const edge=[];for(let dx=-rx;dx<=rx;dx+=2)edge.push([x+dx,top(dx)]);line(c,'#383b39',5,edge);line(c,'#b09e6a',1.6,edge.map(([a,b])=>[a,b-1.5]));
 for(const y of [112,145,165]){line(c,'#4b4b40',2,[[x-rx+2,y],[x+rx-2,y]]);line(c,'#96916b',1,[[x-rx+2,y-1],[x+rx-2,y-1]]);}
 for(const dx of [-76,0,76]){const y=top(dx);box(c,'#62694d',x+dx-1,y-11,3,11);poly(c,'#a08e69',[[x+dx-3,y-10],[x+dx,y-16],[x+dx+3,y-10]]);}
}
function markCanvas(index){
 const [a,c]=surface(300,208),r=seeded(583+index*867);
 [bog,vats,belfry,hothouse][index](c,r);
 // Break off the lower edge into mist so a painted silhouette cannot read as a ledge.
 c.globalCompositeOperation='destination-in';const f=c.createLinearGradient(0,173,0,206);f.addColorStop(0,'black');f.addColorStop(.60,'#000000d0');f.addColorStop(1,'transparent');c.fillStyle=f;c.fillRect(0,0,300,208);
 return a;
}
function horizon(){
 const [a,c]=surface(620,274),r=seeded(571273);
 const g=c.createLinearGradient(0,0,0,274);for(const [t,col] of [[0,'#282536'],[.24,'#5b5150'],[.48,'#a49a69'],[.68,'#758260'],[.83,'#485948'],[1,'#302e39']])g.addColorStop(t,col);c.fillStyle=g;c.fillRect(0,0,620,274);
 halo(c,325,83,103,'#d2bb7955');oval(c,'#d8c486',325,83,15,15);
 for(let i=0;i<4;i++){const y=117+i*23,p=[[0,274],[0,y]];
  for(let x=0;x<=626;x+=5)p.push([x,y+Math.sin(x*.013+i*5)*14+Math.sin(x*.032-i)*7+Math.floor(4*r())]);
  p.push([625,274]);poly(c,['#6f7566','#5e695c','#48584e','#39473f'][i],p);
  if(i<3)for(let k=0;k<19;k++){
   const x=k*33+r()*18,y0=y+Math.sin(x*.013+i*5)*14+Math.sin(x*.032-i)*7,h=7+r()*12;
   poly(c,['#707368','#5c695d','#46574e'][i],[[x-4,y0+7],[x-3,y0-h],[x,y0-h-6],[x+3,y0-h],[x+4,y0+7]]);
  }
 }
 for(let i=0;i<1500;i++){const x=r()*620,y=r()*230;box(c,i%3?'#e3da9810':'#29233611',x,y,i%13?1:3,1);}
 return a;
}
function reeds(){
 const [a,c]=surface(350,90),r=seeded(8555);
 for(let i=0;i<86;i++){const x=r()*350,h=5+r()**2*43;line(c,i%5?'#3b493c':'#62694d',i%4?1:2,[[x,90],[x-2,90-h/2],[x-2+r()*8,90-h]]);if(i%6===0)oval(c,'#8b805f',x-1,88-h,1.4,4);}
 for(const [x,s] of [[24,.6],[30,.35],[203,.85],[216,.43],[222,.29],[302,.28]])cap(c,x,86,s,x%3?1:-1);
 return a;
}
function hazardTexture(kind,band){
 const [a,c]=surface(128,band?19:64),r=seeded(kind==='costras'?884:296);
 if(kind==='costras'){
  for(let i=0;i<35;i++){let x=(i*11)%128,y=8+r()*8,h=3+r()*8;poly(c,'#3a2639',[[x-6,19],[x-3,y-2],[x+1,y-h],[x+4,y-2],[x+8,19]]);line(c,i%4?'#a06d78':'#c39475',1.5,[[x-4,y+1],[x-2,y-3],[x+1,y-h]]);if(i%3===1)box(c,'#e1be78',x-1,y-1,2,2);}
 }else if(band){
  for(let x=0;x<128;x++){
   const y=Math.round(3+Math.sin(x*tau/32)*1.6+Math.sin(x*tau/16)*.8);
   box(c,'#758646',x,y,1,19-y);box(c,Math.sin(x*tau/32)>.25?'#d1cc72':'#a6b45b',x,y,1,2);
   if(x%9===0)box(c,'#53653a',x,y+5,5,1);
  }
  for(const [x,y,k] of [[15,4,3],[45,4,2],[87,5,3],[105,3,1.5]]){
   oval(c,'#b9c55f',x,y,k,k*.8);oval(c,'#849845',x+1,y,k*.65,k*.53);box(c,'#f5deb0',x-1,y-2,1,1);
  }
 }else{
  const g=c.createLinearGradient(0,0,0,64);g.addColorStop(0,'#798b45');g.addColorStop(.16,'#5d713e');g.addColorStop(.55,'#354336');g.addColorStop(1,'#242632');c.fillStyle=g;c.fillRect(0,0,128,64);
  for(let i=0;i<115;i++){const x=r()*128,y=2+r()**1.5*62;box(c,i%3?'#c4c87935':'#202c333b',x,y,1+r()*7,1);}
 }
 return a;
}
function toMap(T,canvas,wrap=false){
 const tx=new T.CanvasTexture(canvas);tx.colorSpace=T.SRGBColorSpace;tx.magFilter=T.NearestFilter;tx.minFilter=T.LinearFilter;tx.generateMipmaps=false;if(wrap)tx.wrapS=T.RepeatWrapping;return tx;
}
function nameType(s,i){const label=(s.id+' '+s.name).toLowerCase();return /estero|costras|marsh|marjal/.test(label)?0:/decant|sal|tank/.test(label)?1:/campana|bell|cuarentena/.test(label)?2:/injerto|inverna|glass/.test(label)?3:i%4;}
export function createPlagueArt(T,scene,plague){
 if(!plague||!Number.isFinite(plague.start)||!Number.isFinite(plague.end))return {update(){}};
 const {start,end}=plague,group=new T.Group();group.name='Marjal de la Peste · paisajes';group.visible=false;scene.add(group);
 const tile=new T.PlaneGeometry(1,1);let built=false,landscape=null,painted=null,background=null,farAspect=620/274;const skyLayers=[];
 const marks=[],fringes=[],pools=[],crusts=[];let spores,xyz,sporeP;
 function plane(map,z,order,tag){const m=new T.Mesh(tile,new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false}));m.position.z=z;m.renderOrder=order;m.name=tag;group.add(m);return m;}
 function build(){
  built=true;background=toMap(T,horizon());background.wrapS=T.MirroredRepeatWrapping;landscape=plane(background,-8.1,-100,'Horizonte del Marjal');
  // Plano lejano pintado (Zona_de_peste_2_0.psd). El horizonte procedural queda como respaldo hasta que cargue.
  new T.TextureLoader().load('./art/fondos/peste-lejos.webp',tx=>{
   tx.colorSpace=T.SRGBColorSpace;tx.magFilter=T.LinearFilter;tx.minFilter=T.LinearFilter;tx.wrapS=T.MirroredRepeatWrapping;tx.generateMipmaps=false;
   farAspect=tx.image.width/tx.image.height;landscape.material.map=tx;landscape.material.needsUpdate=true;
  },undefined,()=>{});
  // Nubes y montañas del cielo, cada una en su propio plano. Las nubes derivan solas.
  const sky=(url,order,spec,rate,tag)=>{
   const m=plane(null,-8.1,order,tag);m.visible=false;m.userData.ready=false;m.userData.aspect=2;
   new T.TextureLoader().load(url,tx=>{
    tx.colorSpace=T.SRGBColorSpace;tx.magFilter=T.LinearFilter;tx.minFilter=T.LinearFilter;tx.wrapS=T.MirroredRepeatWrapping;tx.generateMipmaps=false;
    m.userData.aspect=tx.image.width/tx.image.height;m.material.map=tx;m.material.needsUpdate=true;m.userData.ready=true;
   },undefined,()=>{});
   skyLayers.push({m,spec,rate});
  };
  sky('./art/fondos/peste-nubes-grandes.webp',-99,{speed:.20,lift:.13,phase:.5,height:13.4*escalaFondos,floor:1.06},.0040,'Nubes grandes del Marjal');
  sky('./art/fondos/peste-montanas.webp',-98,{speed:.24,lift:.15,phase:.5,height:13.4*escalaFondos,floor:1.06},0,'Montañas del Marjal');
  sky('./art/fondos/peste-nubes-pequenas.webp',-97,{speed:.28,lift:.17,phase:.5,height:13.4*escalaFondos,floor:1.06},.0075,'Nubes pequeñas del Marjal');
  const art=Array.from({length:4},(_,i)=>toMap(T,markCanvas(i))),reed=toMap(T,reeds());
  const sectors=plague.sectors?.length?plague.sectors:[{x:start},{x:start+(end-start)*.24},{x:start+(end-start)*.46},{x:start+(end-start)*.73}];
  for(const [i,sector] of sectors.entries()){
   const a=sector.x,b=sectors[i+1]?.x??end,kind=nameType(sector,i),w=b-a;
   const main=plane(art[kind],-4.8,-66,'Silueta · '+(sector.name??kind));
   marks.push({m:main,x:a+w*.42,w:kind===3?12.6:kind===0?11.5:10.9,y:sector.y??.2});
   // Small silhouettes sit further back; never mirror the player's required route.
   if(i!==0){const far=plane(art[(kind+3)%4],-5.2,-70,'Ruina en la bruma');marks.push({m:far,x:a+w*.83,w:6.8,y:sector.y??0,sub:true});}
  }
  const srf=plague.platforms||[],positions=(plague.props||[]).filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y));
  const tails=positions.length?positions:srf.filter((p,i)=>i%3===0&&p.w>2&&!p.gateId).map(p=>({x:p.x+p.w*.47,y:p.y+p.h}));
  for(const [i,p] of tails.entries()){
   if(i>90)break;
   if(positions.length&&p.kind&&!/reeds|hongo|piedra|musgo|hueso|canal|seta|junc|farol|flora|root|reed|bell|tank|glass|graft|bone|spore|vats|pump|arch|valve/i.test(p.kind))continue;
   const m=plane(reed,-1.0,-32,'Juncos de sal');const w=1.55+(i*7%13)*.1,h=w*.26;m.scale.set(w,h,1);m.position.x=p.x;m.position.y=p.y+h*.47;fringes.push({m,x:p.x});
  }
  const waterMap=toMap(T,hazardTexture('agua',false),true),edgeMap=toMap(T,hazardTexture('agua',true),true),spinesMap=toMap(T,hazardTexture('costras',true),true);
  for(const h of plague.hazards??[]){
   if(!(h.w>0&&h.h>0))continue;
   const spines=h.kind==='costras',top=h.y+h.h,capH=spines?Math.min(h.h,.62):Math.min(h.h,.22),band=(spines?spinesMap:edgeMap).clone();
   band.repeat.x=Math.max(.22,h.w/(spines?3.2:3.6));band.needsUpdate=true;
   const surface=plane(band,.23,-1,spines?'Costras de peste':'Superficie de esporas');
   surface.scale.set(h.w,capH,1);surface.position.x=h.x+h.w/2;surface.position.y=top-capH/2;
   if(spines){crusts.push({m:surface,x:surface.position.x,w:h.w});continue;}
   const map=waterMap.clone();map.repeat.x=Math.max(.2,h.w/3.8);map.needsUpdate=true;
   const body=plane(map,.19,-2,'Agua enferma');body.scale.set(h.w,Math.max(.05,h.h-capH*.38),1);body.position.x=surface.position.x;body.position.y=h.y+body.scale.y*.5;
   pools.push({m:surface,body,x:surface.position.x,w:h.w,phase:(h.x-start)*.137,band});
  }
  const n=37,pr=seeded(253744),colors=new Float32Array(n*3);xyz=new Float32Array(n*3);sporeP=[];
  for(let i=0;i<n;i++){sporeP.push([pr(),pr(),pr()*tau,.2+pr()*.7]);const color=new T.Color(i%4?0xbac787:0xe4bd77);colors.set([color.r,color.g,color.b],i*3);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(xyz,3));geo.setAttribute('color',new T.BufferAttribute(colors,3));
  spores=new T.Points(geo,new T.PointsMaterial({size:2.2,sizeAttenuation:false,vertexColors:true,transparent:true,depthWrite:false,opacity:.48}));spores.position.z=.12;spores.renderOrder=-3;spores.frustumCulled=false;spores.name='Polen suspendido';group.add(spores);
  // La abadía sumergida (art/marjal/abadia.webp) se sustituyó por las ruinas del nuevo PSD.

 }
 function update(t,cx,cy,vw,vh,quiet,travel){
  if(!built){if(cx<start-vw*1.2||cx>end+vw)return;build();}
  const f=marshBlend(cx,start);
  group.visible=f>.001&&cx<=end+vw;if(!group.visible)return;
  framePlate(landscape,cx,cy,vw,vh,travel,plates.marshSky,farAspect);
  landscape.material.opacity=f;
  for(const {m,spec,rate} of skyLayers){
   m.visible=m.userData.ready===true;if(!m.visible)continue;
   framePlate(m,cx,cy,vw,vh,travel,spec,m.userData.aspect);
   if(rate)driftPlate(m,t,rate,travel.amount??1);
   m.material.opacity=f;
  }
  if(painted){
    painted.visible=true;const img=painted.material.map.image;
    framePlate(painted,cx,cy,vw,vh,travel,plates.abbey,img.width/img.height);painted.material.opacity=f*.71;
  }
  for(const s of marks){
   const gap=Math.abs(s.x-cx),rate=s.sub?.29:.54,h=s.w*208/300;
   if(gap>=37){s.m.visible=false;s.last=undefined;continue;}
   if(s.last===undefined||s.cut!==travel.cut){
     s.dx=(s.x-cx)*travel.amount+(s.sub?.30:-.16)*vw*(1-travel.amount)/rate;
   }else{s.dx-=travel.x-s.last;}
   s.last=travel.x;s.cut=travel.cut;
   const offset=s.dx*rate;s.m.visible=Math.abs(offset)<vw*.57+s.w*.5;
   if(s.m.visible){
     s.m.position.x=cx+offset;s.m.position.y=cy-vh*.28+(s.y-.3-travel.y)*(s.sub?.13:.24)+h*.5;
     s.m.scale.set(s.w,h,1);s.m.material.opacity=f*(s.sub?.34:.82)*smooth((37-gap)/8);
   }
  }
  for(const d of fringes){d.m.visible=Math.abs(cx-d.x)<vw*.55+2.2;if(d.m.visible)d.m.material.opacity=f*.8;}
  for(const d of pools){d.body.visible=d.m.visible=Math.abs(cx-d.x)<vw*.55+d.w*.5;if(d.m.visible){d.band.offset.x=d.phase+(quiet?0:t*.055);d.m.material.opacity=d.body.material.opacity=f;}}
  for(const d of crusts){d.m.visible=Math.abs(cx-d.x)<vw*.55+d.w*.5;if(d.m.visible)d.m.material.opacity=f;}
  spores.visible=!quiet;if(spores.visible){
   for(let i=0;i<sporeP.length;i++){const [x,y,a,k]=sporeP[i],j=i*3;
    xyz[j]=cx+(((x+t*.0032*k+cx*.009)%1)-.5)*vw*1.14+Math.sin(t*.37+a)*.13;
    xyz[j+1]=cy+(((y+t*.012*k)%1)-.5)*vh*1.08;xyz[j+2]=0;
   }
   spores.geometry.attributes.position.needsUpdate=true;spores.material.opacity=f*.50;
  }
 }
 return {update};
}
