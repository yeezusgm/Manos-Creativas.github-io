// Painted architecture, fixed in the Archivo. All marks are scenery, not interactive platforms.
function panel(T,scene,canvas,w,h,x,y,z,order){
 const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.NearestFilter;
 const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
 m.position.set(x,y,z);m.renderOrder=order;scene.add(m);return m;
}
function surface(w,h){const a=document.createElement('canvas');a.width=w;a.height=h;return[a,a.getContext('2d')];}
function skyWindow(){
 const [cv,c]=surface(1000,530),base=457,mid=500;
 const poly=(pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 const line=(x,y,u,v,col,w=1)=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.stroke();};
 const arc=(x,y,rx,ry,lo,hi,col,w=1)=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.ellipse(x,y,rx,ry,0,lo,hi);c.stroke();};
 let seed=96342;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 // A recessed circular lens looking onto the stars; the stepped sides fade into the existing ruins.
 const haze=c.createRadialGradient(505,238,15,505,235,520);haze.addColorStop(0,'#29243be8');haze.addColorStop(.45,'#1b1a2ef2');haze.addColorStop(.79,'#191929c9');haze.addColorStop(1,'#15142400');
 c.fillStyle=haze;c.fillRect(0,0,1000,530);
 c.save();c.beginPath();c.ellipse(mid,244,268,230,0,0,Math.PI*2);c.clip();
 const glass=c.createLinearGradient(0,12,0,base);glass.addColorStop(0,'#1b192d');glass.addColorStop(.34,'#3a2e4e');glass.addColorStop(.68,'#494058');glass.addColorStop(1,'#211f30');
 c.fillStyle=glass;c.fillRect(215,0,570,497);
 for(let i=0;i<44;i++){const x=230+rand()*540,y=25+rand()*390;
  line(x-10,y+54,x+100,y-55,'#b5a2bf09',8+rand()*13);}
 let stars=[];for(let i=0;i<125;i++){const x=mid+(rand()-.5)*528,y=18+rand()*412,w=i%11===0?2:1;
  c.fillStyle=['#b8a1c7','#907b9c','#d0abb6'][i%3];c.globalAlpha=.34+rand()*.43;c.fillRect(x|0,y|0,w,w);
  if(i%6===0){const last=stars.at(-1);if(last&&Math.hypot(x-last.x,y-last.y)<120)line(x,y,last.x,last.y,'#b5a0b455');stars.push({x,y});}
 }c.globalAlpha=1;
 const halo=c.createRadialGradient(376,208,17,376,208,86);halo.addColorStop(0,'#eab4acaa');halo.addColorStop(.42,'#cf8e9640');halo.addColorStop(1,'#bd8db000');c.fillStyle=halo;c.fillRect(281,117,190,182);
 c.fillStyle='#31283d';c.beginPath();c.arc(376,208,30,0,Math.PI*2);c.fill();
 arc(376,208,30,30,0,2*Math.PI,'#cda6a1',1.5);arc(376,208,30.5,30.5,.28,1.57,'#ffe0b5',3);
 // Leaded glass in the upper half, drawn faintly so the boss silhouette reads in front.
 for(let i=0;i<13;i++){const a=(i-6)*.232;line(500+116*Math.sin(a),244-102*Math.cos(a),500+269*Math.sin(a),244-233*Math.cos(a),'#201d30b8',3);}
 arc(500,244,125,107,Math.PI,2*Math.PI,'#a68a934f',1);
 for(const r of [169,203,220])arc(mid,244,r,r*.86,0,2*Math.PI,r===203?'#ad8c8657':'#79657789',1.6);
 for(let i=0;i<96;i++){const a=i*Math.PI/48,r=i%8===0?195:i%2===0?199:201;line(mid+r*Math.cos(a),244+r*.86*Math.sin(a),mid+204*Math.cos(a),244+204*.86*Math.sin(a),'#bda78a73',i%8===0?2:1);}
 c.restore();
 // Concentric masonry rim.
 for(const [r,col,w] of [[272,'#191624',14],[268,'#615366',4],[265,'#2c2639',5],[261,'#b0908750',2],[254,'#251e33',6]])arc(mid,244,r,r*.86,Math.PI*.88,Math.PI*2.12,col,w);
 for(let i=0;i<39;i++){const a=Math.PI*(.88+1.24*i/38);
  line(mid+255*Math.cos(a),244+220*Math.sin(a),mid+279*Math.cos(a),244+240*Math.sin(a),'#201a29',3);}
 // Towers and paired buttresses flank, rather than cross, the fighting floor.
 for(const side of [-1,1])for(let j=0;j<3;j++){
  const px=mid+side*(306+j*58),ww=28+j*5,top=74+j*33,yy=base;
  poly([[px-ww/2,yy],[px-ww/2,top+13],[px,top-32],[px+ww/2,top+13],[px+ww/2,yy]],j%2?'#252032':'#2d283b');
  c.fillStyle='#191724';c.fillRect(px+2,top+17,ww*.41,yy-top-15);
  line(px-ww*.42,top+18,px-ww*.42,yy,'#766473',2);line(px-ww*.22,top+18,px-ww*.22,yy,'#4d4356',3);
  for(let y=top+40;y<yy-14;y+=49){c.fillStyle='#171621';c.fillRect(px-ww/2,y,ww,3);c.fillStyle='#5e5061';c.fillRect(px-ww/2,y+3,ww*.65,1);}
  for(const y of [top+15,yy-34,yy-14]){poly([[px-ww*.73,y],[px+ww*.73,y],[px+ww*.57,y+7],[px-ww*.57,y+7]],'#3c3446');line(px-ww*.73,y,px+ww*.73,y,'#8d7680',1);}
 }
 // Subtle stone steps below the playable plane.
 for(let i=0;i<4;i++){c.fillStyle=['#302939','#38303e','#2c2634','#211d2b'][i];c.fillRect(158-i*24,base-5+i*5,684+i*48,6);line(158-i*24,base-5+i*5,842+i*24,base-5+i*5,'#a387814d',1);}
 // Feather the outer image; straight rectangle edges must not appear during entry.
 c.globalCompositeOperation='destination-in';
 const mask=c.createLinearGradient(0,0,1000,0);mask.addColorStop(0,'transparent');mask.addColorStop(.14,'black');mask.addColorStop(.86,'black');mask.addColorStop(1,'transparent');c.fillStyle=mask;c.fillRect(0,0,1000,530);
 const ym=c.createLinearGradient(0,0,0,530);ym.addColorStop(0,'transparent');ym.addColorStop(.09,'black');ym.addColorStop(.90,'black');ym.addColorStop(1,'transparent');c.fillStyle=ym;c.fillRect(0,0,1000,530);
 return cv;
}
// Stone arcades carry the fighting floor down into the ravine, visible on tall screens.
function undercroft(){
 const [cv,c]=surface(800,540);const fill=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
 const darkness=c.createLinearGradient(0,0,0,540);darkness.addColorStop(0,'#252132');darkness.addColorStop(.38,'#171725');darkness.addColorStop(1,'#141421');
 fill(0,0,800,540,darkness);
 for(let j=-1;j<7;j++){const x=29+122*j,top=13+(Math.abs(3-j)%2)*8,bottom=540;
  const arch=(spread,rise,base,color)=>{c.beginPath();c.moveTo(x-spread,bottom);c.lineTo(x-spread,top+rise+base);c.quadraticCurveTo(x-spread,top+base+22,x,top+base);c.quadraticCurveTo(x+spread,top+base+22,x+spread,top+rise+base);c.lineTo(x+spread,bottom);c.fillStyle=color;c.fill();};
  arch(50,88,1,'#494051');arch(47,88,5,'#282435');arch(42,78,13,'#141321');arch(38,78,19,'#171827');
  fill(x-60,top+98,11,410,'#242333');fill(x-59,top+100,2,392,'#393343');
  for(let y=top+110;y<510;y+=34){fill(x-60,y,12,2,'#151520');}
  for(let i=0;i<5;i++){const q=i/5;c.fillStyle='#5a4e5b';c.fillRect(x-45+q*43,top+Math.pow(1-q,1.6)*72+5,3,2);c.fillRect(x+45-q*43,top+Math.pow(1-q,1.6)*72+5,3,2);}
 }
 const depth=c.createLinearGradient(0,15,0,480);depth.addColorStop(0,'#0d0d1700');depth.addColorStop(.62,'#10121cd4');depth.addColorStop(1,'#11131eef');fill(0,0,800,540,depth);
 c.globalCompositeOperation='destination-in';const edge=c.createLinearGradient(0,0,800,0);edge.addColorStop(0,'transparent');edge.addColorStop(.1,'black');edge.addColorStop(.90,'black');edge.addColorStop(1,'transparent');fill(0,0,800,540,edge);
 const foot=c.createLinearGradient(0,0,0,540);foot.addColorStop(0,'black');foot.addColorStop(.77,'black');foot.addColorStop(1,'transparent');fill(0,0,800,540,foot);return cv;
}
function sealColumn(){
 const [cv,c]=surface(54,280);
 const glow=c.createLinearGradient(0,0,54,0);glow.addColorStop(0,'transparent');glow.addColorStop(.43,'#b76bfc34');glow.addColorStop(.5,'#ffdaffa0');glow.addColorStop(.57,'#b76bfc34');glow.addColorStop(1,'transparent');c.fillStyle=glow;c.fillRect(0,0,54,280);
 c.strokeStyle='#d4a5de';c.lineWidth=1.3;
 for(let j=0;j<8;j++){const y=15+34*j;c.beginPath();c.moveTo(27,y-7);c.lineTo(32,y);c.lineTo(27,y+7);c.lineTo(22,y);c.closePath();c.stroke();c.fillStyle='#f7e4d3';c.fillRect(26,y-1,2,2);}
 return cv;
}
function threshold(){
 const [cv,c]=surface(64,90);const pts=(ps,col)=>{c.fillStyle=col;c.beginPath();ps.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 pts([[4,89],[8,80],[15,78],[17,47],[25,42],[32,9],[40,42],[47,47],[50,78],[57,81],[61,89]],'#241b30');
 pts([[10,86],[16,80],[20,50],[27,45],[32,17],[32,78],[40,84]],'#6d556e');
 pts([[32,21],[38,45],[45,49],[42,65],[34,74]],'#392a44');pts([[27,43],[32,30],[37,43],[32,53]],'#be91b9');
 pts([[29,42],[32,34],[34,42],[32,48]],'#fce0c3');c.fillStyle='#aa8696';c.fillRect(11,81,42,2);return cv;
}
export function makeObservatory(T,scene,a){
 const worldPerPx=.0245,h=530*worldPerPx;
 const rear=panel(T,scene,skyWindow(),1000*worldPerPx,h,a.center,a.floor+(457-265)*worldPerPx,-1.8,-27);
 const beneath=panel(T,scene,undercroft(),25,16.9,a.center,a.floor-8.50,-1.72,-26);
 const seal=sealColumn(),post=threshold(),posts=[],curtains=[];
 for(const x of [a.left,a.right]){
  posts.push(panel(T,scene,post,.85,1.22,x,a.floor+.61,.44,0));
  curtains.push(panel(T,scene,seal,.82,7.05,x,a.floor+3.525,1.1,5));
 }
 return (near,locked,t,quiet)=>{
  rear.visible=beneath.visible=near;for(const p of posts)p.visible=near;
  for(const p of curtains){p.visible=near&&locked;p.material.opacity=quiet?.76:.72+.12*Math.sin(t*2.5);}
 };
}
