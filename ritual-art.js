import {mageCel} from './ritual.js';
import {makeObservatory} from './observatory-art.js';

function sigil(kind){
 const cv=document.createElement('canvas');cv.width=cv.height=96;
 const c=cv.getContext('2d'),gold=kind==='weak',ink=gold?'#edc491':'#cf89fd',core=gold?'#fff1c5':'#fae5ff';
 const line=(points,color,w=2,close=false)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(close)c.closePath();c.strokeStyle=color;c.lineWidth=w;c.stroke();};
 const halo=c.createRadialGradient(48,48,3,48,48,46);halo.addColorStop(0,gold?'#ffe1ad88':'#d894ffa6');halo.addColorStop(.45,gold?'#dda67235':'#9f42d454');halo.addColorStop(1,'transparent');c.fillStyle=halo;c.fillRect(0,0,96,96);
 const arc=(x,y,r,lo,hi,w,col)=>{c.beginPath();c.arc(x,y,r,lo,hi);c.lineWidth=w;c.strokeStyle=col;c.stroke();};
 if(kind==='mark'||kind==='weak'){
  for(let k=0;k<4;k++){const a=k*Math.PI/2;arc(48,48,30,a+.13,a+1.40,2,ink);}
  line([[48,10],[85,48],[48,86],[11,48]],ink,2,true);
  line([[48,23],[68,48],[48,73],[28,48]],gold?core:'#eac3ff',2,true);
  if(!gold){c.fillStyle=core;c.fillRect(45,45,6,6);}
  else{for(let i=0;i<4;i++){c.save();c.translate(48,48);c.rotate(i*Math.PI/2);c.fillStyle=core;c.fillRect(-1,-35,2,10);c.restore();}}
 }else if(kind==='orb'||kind==='essence'){
  const r=kind==='orb'?22:18,gr=c.createRadialGradient(42,38,2,48,48,r);
  gr.addColorStop(0,'#fbe6ff');gr.addColorStop(.16,'#df9cfd');gr.addColorStop(.45,'#8645ab');gr.addColorStop(.82,'#38204f');gr.addColorStop(1,'#ba75e7');
  c.fillStyle=gr;c.beginPath();c.arc(48,48,r,0,Math.PI*2);c.fill();
  c.save();c.translate(48,48);c.rotate(-.52);c.scale(1,.32);arc(0,0,r+10,0,Math.PI*2,4,'#eac3f4');c.restore();
  line([[47,18],[48,9],[50,18]],core,1);c.fillStyle='#f6e7fa';c.fillRect(45,34,4,3);
 }else if(kind==='trail'){
  const g=c.createLinearGradient(0,0,0,96);g.addColorStop(0,'transparent');g.addColorStop(.68,'#b964ec6b');g.addColorStop(1,'#f9d4ffac');
  c.fillStyle=g;c.beginPath();c.moveTo(42,96);c.quadraticCurveTo(58,63,40,10);c.quadraticCurveTo(65,45,55,96);c.fill();
 }else{
  for(let i=0;i<10;i++){const x=8+i*8,h=10+32*Math.sin(i*1.7)**2;line([[48,72],[x+5,60],[x,72-h]],i%2?ink:core,i%2?2:1);}
  c.save();c.translate(48,73);c.scale(1,.15);arc(0,0,34,0,Math.PI*2,4,core);c.restore();
 }
 return cv;
}
export function paintRitual(T,scene,fight){
 const {b,arena:a}=fight,loader=new T.TextureLoader();
 const columns=4,frameW=448,frameH=384,pivotY=348,units=1/54;
 const tex={};
 for(const [key,rows] of Object.entries({idle:2,rain:3,staff:3,stun:2})){
  const t=loader.load('./art/astronomo/'+key+'.webp');t.colorSpace=T.SRGBColorSpace;t.magFilter=T.NearestFilter;
  t.minFilter=T.LinearMipmapLinearFilter;t.repeat.set(1/columns,1/rows);tex[key]={t,rows};
 }
 const mesh=new T.Mesh(new T.PlaneGeometry(frameW*units,frameH*units),new T.MeshBasicMaterial({
  map:tex.idle.t,transparent:true,depthWrite:false,alphaTest:.007,side:T.DoubleSide
 }));mesh.visible=false;mesh.position.set(a.x,a.floor+(pivotY-frameH/2)*units,2.00);
 mesh.renderOrder=18;mesh.name='Astrónomo Hueco';scene.add(mesh);
 const effects={};for(const k of ['orb','trail','mark','burst','weak','essence']){
  const t=new T.CanvasTexture(sigil(k));t.colorSpace=T.SRGBColorSpace;t.magFilter=T.LinearFilter;effects[k]=t;
 }
 function fx(k,z=2.13){
  const m=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:effects[k],transparent:true,depthWrite:false,side:T.DoubleSide}));
  m.position.z=z;m.renderOrder=z>2?22:1;m.visible=false;scene.add(m);return m;
 }
 const drops=Array.from({length:4},()=>({orb:fx('orb'),tail:fx('trail'),seal:fx('mark',1.12),hit:fx('burst')}));
 const stamp=fx('mark',1.12),wave=fx('burst'),target=fx('weak'),essence=fx('essence');
 const all=[stamp,wave,target,essence,...drops.flatMap(d=>Object.values(d))];
 function put(m,x,y,w,h=w,opacity=1,angle=0){m.visible=true;m.position.x=x;m.position.y=y;m.scale.set(w,h,1);m.rotation.z=angle;m.material.opacity=opacity;}
 const setRoom=makeObservatory(T,scene,a);
 let key='',idx=-1;
 return function update(elapsed,playerX,showWorld,quiet){
  const near=showWorld&&playerX>a.left-25&&playerX<a.right+18;
  setRoom(near,fight.locked,b.clock,quiet);
  for(const m of all)m.visible=false;
  mesh.visible=near&&!b.won;
  if(!mesh.visible)return;
  const [name,n]=mageCel(b,elapsed),{t,rows}=tex[name];
  if(n!==idx||name!==key){t.offset.set(n%columns/columns,1-(1+Math.floor(n/columns))/rows);mesh.material.map=t;key=name;idx=n;}
  mesh.visible=!!t.image?.width;
  // The artist's feet/pivot stay on precisely the same world coordinate in every frame.
  mesh.scale.x=b.dir;mesh.position.x=a.x;mesh.position.y=a.floor+(pivotY-frameH/2)*units;
  if(!fight.locked)return;
  const clock=b.clock;
  b.marks.forEach((m,i)=>{
   const d=drops[i],when=b.phase==='gather'?-1:m.age;
   if(!m.impact){const q=quiet?.8:.72+.17*Math.sin(clock*8-i);put(d.seal,m.x,a.floor+.035,1.28,.28,q);
    if(!m.painted&&when>=0){put(d.orb,m.x,m.y,.85);if(when>.13)put(d.tail,m.x,m.y+.47,.71,1.08,.66);}
   }else if(!m.painted){const after=m.age-.84;if(after<.31)put(d.hit,m.x,a.floor+.26,1.22+after*1.6,.83,Math.max(0,1-after/.31));}
  });
  if(b.phase==='raise'){const cx=a.x+b.dir*a.staffReach;
   put(stamp,cx,a.floor+.055,1.45,.32,.45+Math.min(.5,b.t*.52));
  }else if(b.phase==='sweep'&&b.t<.5){
   const d=b.t<.11?0:(b.t-.11)*5.4;put(wave,a.x+(a.staffReach+d)*b.dir,a.floor+.19,.68,.69,Math.min(1,(.5-b.t)*6));
  }
  if(b.phase==='expose'||b.phase==='final'){const end=b.phase==='final',q=quiet?1:1+.065*Math.sin(clock*5);
   put(target,a.x,a.floor+(end?.96:a.core),1.11*q,1.11*q,.96,quiet?0:Math.sin(clock*1.6)*.10);
  }
  if(b.orb)put(essence,b.orb.x,b.orb.y,.85,.85,.98);
 };
}
