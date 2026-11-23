// The Root forge is a backdrop anchored to the walking surface. Tom, enemies
// and the beacon all render in front of it in WebGL and in the 2D renderer.
const W=144,H=104,FLOOR=100,UNIT=.0315;
const coal='#201721',iron='#38303e',edge='#766a7a',wood='#503743';
function sheet(){const cv=document.createElement('canvas');cv.width=W;cv.height=H;return cv;}
function tools(c){
 const box=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 // Scan-line fills and integer strokes keep the edges of the masonry, the
 // hammer and the thin anvil horn crisp at the same density as Tom's pixels.
 function shape(pts,col){
  const lo=Math.floor(Math.min(...pts.map(p=>p[1]))),hi=Math.ceil(Math.max(...pts.map(p=>p[1])));
  c.fillStyle=col;
  for(let y=lo;y<hi;y++){
   const yy=y+.5,xs=[];
   for(let i=0,j=pts.length-1;i<pts.length;j=i++){
    const a=pts[j],b=pts[i];
    if((a[1]>yy)!==(b[1]>yy))xs.push(a[0]+(b[0]-a[0])*(yy-a[1])/(b[1]-a[1]));
   }
   xs.sort((a,b)=>a-b);for(let j=1;j<xs.length;j+=2){const left=Math.ceil(xs[j-1]-.5),end=Math.ceil(xs[j]-.5);if(end>left)c.fillRect(left,y,end-left,1);}
  }
 }
 function line(pts,col,w=1){
  c.fillStyle=col;
  for(let i=1;i<pts.length;i++){
   let [x,y]=pts[i-1];const [u,v]=pts[i],dx=Math.abs(u-x),dy=-Math.abs(v-y),sx=x<u?1:-1,sy=y<v?1:-1;let err=dx+dy;
   for(;;){c.fillRect(x,y,w,w);if(x===u&&y===v)break;const e=2*err;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}}
  }
 }
 return {box,shape,line};
}
function workshop(){
 const cv=sheet(),c=cv.getContext('2d'),{box:b,shape:p,line:l}=tools(c);
 const block=(x,y,w,h,front,cap,side)=>{b(x,y,w,h,front);b(x+1,y,w-2,1,cap);b(x+w-2,y+1,2,h-1,side);};
 const root=(path,width=3)=>{l(path,'#291e28',width+2);l(path,'#66424a',width);l(path.map(([x,y])=>[x+1,y]),'#8f6261');};
 // Pad and steps. The soot marks end where the character's boots meet the ground.
 p([[2,98],[15,95],[53,93],[100,95],[124,95],[139,98],[131,100],[7,100]],'#1c1725b8');
 p([[5,95],[10,91],[46,89],[70,91],[71,95],[65,97],[7,97]],'#51434f');b(9,95,54,2,'#322938');b(12,92,23,1,'#7d6464');
 // Chimney with offset brick courses and broad silhouette against the roots.
 p([[7,94],[10,87],[11,53],[15,46],[22,43],[25,35],[28,33],[28,12],[25,12],[25,6],[27,4],[55,4],[57,7],[57,12],[53,13],[53,34],[60,43],[65,46],[69,55],[69,87],[71,92],[68,95]],coal);
 b(29,12,23,23,'#4d3c47');b(49,12,4,24,'#302a38');
 const stones=['#644b50','#775354','#63464b','#865d57','#714f53'];
 for(let j=0;j<4;j++)for(let i=0;i<3;i++){
  const x=29+i*10-(j%2?4:0),a=Math.max(x,29),z=Math.min(52,x+9);
  if(z-a>1)block(a,13+5*j,z-a,4,stones[(i+j*3)%stones.length],'#8a6966','#4b3846');
 }
 b(26,6,30,6,'#3e313d');b(27,5,27,2,'#a07c72');b(28,8,26,1,'#64535d');b(28,11,25,2,'#2a2331');
 p([[13,53],[18,46],[26,43],[29,35],[50,35],[55,43],[63,47],[67,55],[67,88],[13,89]],'#3f303e');
 p([[18,49],[32,37],[49,37],[56,45],[38,43],[25,49]],'#805955');
 b(29,34,24,2,'#93746c');b(32,32,18,2,'#6a5558');b(14,86,52,5,'#3b303d');
 const rows=[[47,19,59],[52,15,63],[57,13,66],[62,13,67],[67,13,67],[72,13,67],[77,13,67],[82,13,67]];
 rows.forEach(([y,left,right],j)=>{for(let i=0;i<6;i++){
  const x=10+12*i-(j%2?5:0),a=Math.max(x,left),z=Math.min(right,x+11);
  if(z-a>1)block(a,y,z-a,4,stones[(2*i+j)%5],j%2?'#87625e':'#775963','#4a3542');
 }});
 // Voussoirs around a black iron-lined, pointed firebox.
 p([[19,83],[19,62],[23,55],[31,49],[39,46],[48,49],[56,55],[60,62],[60,84]],'#37232d');
 p([[22,82],[22,63],[26,56],[33,51],[39,48],[47,51],[54,57],[57,63],[57,82]],'#b4765d');
 p([[26,81],[26,64],[29,58],[35,54],[39,52],[44,54],[50,58],[53,65],[53,81]],'#522b34');
 p([[27,81],[27,65],[31,58],[39,54],[46,58],[51,65],[51,81]],'#271c26');
 const joints=[[[22,67],[26,67]],[[24,58],[28,61]],[[30,52],[32,56]],[[37,49],[38,54]],[[43,51],[42,54]],[[50,54],[47,58]],[[55,60],[51,63]],[[53,69],[58,68]]];
 for(const path of joints)l(path,'#62404b',1);
 for(const [x,y] of [[22,64],[24,59],[28,55],[33,52],[39,49],[45,52],[52,57]])b(x,y,3,1,'#dda176');
 b(18,82,43,4,'#392b36');b(19,82,40,1,'#c48a6c');block(12,88,55,5,'#594653','#8b6964','#3a2e3b');
 // Root fingers cling to one buttress and turn down around the foundation.
 root([[27,9],[23,16],[25,24],[21,30],[22,38],[17,47],[17,54],[13,61],[13,76],[9,82],[10,90],[6,94]],2);
 root([[24,25],[29,30],[28,34],[32,38],[39,39],[43,43],[52,46]],1);
 root([[15,60],[18,68],[16,78],[19,87],[18,92],[28,94]],1);
 l([[23,37],[16,38],[13,42],[11,51]],'#795159');l([[17,47],[20,52],[20,58]],'#9b6b59');
 for(const [x,y] of [[25,18],[21,32],[14,44],[12,57],[18,76],[29,32],[49,43]]){b(x,y,3,2,'#59634c');b(x+2,y-1,2,1,'#8d9168');}
 // A wall hook, long smith's tongs and a spare hammer lean at the right jamb.
 b(61,52,9,3,'#342832');b(62,52,7,1,'#9b7b73');l([[63,55],[64,62],[64,73],[62,83]],'#302635',2);
 l([[63,55],[63,62],[64,68],[63,79]],'#a59184');l([[68,55],[67,63],[65,68],[67,81]],'#92828a');
 l([[62,84],[65,83],[64,80]],'#41323e');l([[62,95],[70,75]],'#3a292f',3);l([[63,93],[70,76]],'#b08365');
 p([[65,73],[69,70],[77,74],[76,78],[73,81],[65,76]],'#25212e');l([[66,73],[69,72],[76,75]],'#aa9ba0');
 // Pegboard hangs from a forged scroll. Its mark reads as the same anvil even
 // at small resolutions, without requiring text drawn into the world.
 b(123,50,5,47,'#302532');b(124,51,2,44,'#80605e');b(121,94,9,3,'#4e3b47');
 l([[125,59],[125,40],[121,37],[109,37],[105,40],[105,43]],'#282331',3);
 l([[126,57],[126,40],[122,37],[112,37],[107,39]],'#bd957f');
 l([[115,42],[120,43],[125,49]],'#73606a',2);l([[110,40],[110,47]],'#c4a88c');l([[119,40],[119,47]],'#af8b76');
 p([[103,48],[106,45],[122,45],[125,48],[125,61],[121,64],[108,64],[103,60]],'#2c2430');
 p([[105,49],[108,47],[121,47],[123,49],[123,59],[120,62],[109,62],[105,59]],'#967168');
 p([[106,50],[108,48],[120,48],[122,50],[122,58],[120,61],[109,61],[106,58]],'#48333d');
 p([[107,52],[112,53],[122,52],[122,55],[117,56],[116,58],[119,59],[119,60],[111,60],[111,59],[113,58],[113,56],[109,55]],'#f0c899');
 // Oak round under the anvil: bark, growth rings, iron bands and rivets.
 p([[77,95],[80,90],[81,79],[85,77],[102,77],[106,80],[106,89],[109,95],[106,98],[79,98]],'#322533');
 p([[80,94],[83,81],[87,79],[101,79],[104,82],[104,91],[107,95],[102,96],[82,96]],wood);
 l([[84,80],[86,84],[83,94]],'#9b6b5e',2);l([[90,81],[90,86],[89,94]],'#79534f');l([[99,81],[97,87],[99,95]],'#362733',2);
 b(81,84,24,3,'#302b36');b(82,84,22,1,'#8a7480');b(80,92,26,3,'#362c38');b(82,92,23,1,'#86727a');
 for(const [x,y] of [[84,85],[102,85],[83,93],[104,93]])b(x,y,1,1,'#c5ae9d');
 // Broad-faced anvil with a slender tapered horn pointing out toward Tom.
 p([[66,63],[77,64],[80,61],[105,61],[105,63],[113,63],[113,67],[106,69],[101,73],[101,75],[107,78],[107,81],[78,81],[78,78],[86,75],[86,72],[80,70],[74,69]],'#241f2b');
 p([[68,64],[78,65],[81,62],[104,62],[104,64],[112,64],[112,66],[105,68],[99,71],[98,75],[104,78],[82,78],[88,75],[89,71],[82,68],[75,68]],'#665c70');
 p([[76,66],[80,65],[82,64],[104,64],[103,66],[94,69],[87,69]],'#9e91a2');
 p([[92,69],[101,67],[97,72],[96,75],[100,77],[88,77],[91,74]],'#443c4c');
 b(81,62,22,1,'#e8d8cf');b(81,63,18,1,'#b3a8b2');l([[67,64],[73,66],[77,66]],'#c6a4a0');
 b(80,78,25,1,'#ba9a90');b(79,79,27,1,'#665569');b(102,64,2,1,'#302a38');
 // The blade being tempered rests on the working face, pointing left.
 p([[74,60],[80,58],[97,58],[99,57],[101,59],[99,60],[94,61],[78,61]],'#a54548');
 l([[74,60],[81,59],[96,59]],'#ffcc87');b(80,58,14,1,'#ff965e');b(96,57,3,1,'#e8a375');b(99,58,7,2,'#6b4640');b(104,58,3,1,'#b99d87');
 // A few discarded charred billets at floor level.
 for(const [x,y,z] of [[108,94,8],[112,92,8],[117,95,7]]){b(x,y,z,3,'#332631');b(x+1,y,z-2,1,'#865d5d');}
 return cv;
}
function fire(frame){
 const cv=sheet(),c=cv.getContext('2d'),{box:b,shape:p,line:l}=tools(c);
 // Eight discrete beats. All motion stays within the forge mouth or rises
 // from the chimney: no sparks in Tom's walk cycle or the beacon's marker.
 const a=[0,1,2,2,1,0,-1,-1][frame],u=[0,-1,0,2,3,1,0,-2][frame];
 const g=c.createRadialGradient(39,77,2,39,77,16);g.addColorStop(0,'#f98735af');g.addColorStop(.64,'#ba483d8a');g.addColorStop(1,'#7a353800');
 c.fillStyle=g;c.fillRect(27,61,24,20);
 p([[27,80],[28,75],[29,73],[29+a,67],[33,72],[34,70],[36,64+a],[38,67],[40+u,56-a],[42,63],[44,66],[44+a,70],[47+a,65],[48,69],[48+u,73],[50,71],[51,76],[51,80]],'#c94f3c');
 p([[28,80],[31,76],[31+a,71],[34,74],[36,72],[37,67+a],[39,70],[41+u,62],[42,69],[45,72],[46+a,69],[47,76],[49,74],[51,80]],'#f38745');
 p([[31,79],[33+a,75],[36,76],[38,70+u],[40,73],[41+u,67],[43,73],[44,76],[47+a,73],[47,80]],'#ffc66e');
 p([[34,79],[38,75],[39,77],[41,72+u],[43,78],[46,77],[47,80]],'#ffe6a0');
 b(27,79,24,3,'#532932');l([[27,80],[30,78],[35,79],[40,78],[45,80],[49,78]],'#a64d43',2);
 for(const [x,y] of [[29,80],[37,80],[44,80],[48,80]])b(x,y,2,1,'#f59a5f');
 const glow=(x,y)=>{b(x,y,1,2,'#f7a463a3');b(x,y+1,1,1,'#ffcd89');};
 if(frame<5)glow(38+(frame>>1),64-frame);if(frame>=2&&frame<7)glow(46-(frame>>1),73-frame);
 const sparks=[[38,2],[43,2],[44,1],[43,0],[36,3],[37,2],[39,1],[40,0]];
 const [x,y]=sparks[frame];b(x,y,1,1,'#df996b70');
 return cv;
}
function warmth(){
 const cv=sheet(),c=cv.getContext('2d'),g=c.createRadialGradient(39,70,4,39,70,47);
 g.addColorStop(0,'#ee955d53');g.addColorStop(.40,'#bc594338');g.addColorStop(.76,'#9b423415');g.addColorStop(1,'#87333100');
 c.fillStyle=g;c.fillRect(0,20,90,84);return cv;
}
export const forgeEmblem='<svg class="forge-emblem" aria-hidden="true" focusable="false" viewBox="0 0 112 84" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M28 66q3-8 15-14l-2-5-13-2-15-9 20 2 3-4h35l4 3h15l-3 5-15 3q-13 6-11 12l11 5 2 5H28Z" fill="#464050" stroke="#d0abb0" stroke-width="2" stroke-linejoin="round"/><path d="m20 38 13 3 5-4h34l1 2h12M33 63h36" stroke="#f2ddbe" stroke-width="2"/><path d="M41 44h25l-9 6-2 8 6 3H41l7-6 1-6-8-5Z" fill="#796373"/><path d="m44 34 6-4 28-12 3 3-27 13H44Z" fill="#ffbd77" stroke="#e38a66" stroke-width="1.2"/><path d="m48 32 29-12" stroke="#ffead0"/><path d="m76 16 5 9m-2-5 13-6" stroke="#b58c91" stroke-width="3" stroke-linecap="round"/><path d="m34 18 3-8 2 7 5 2-6 2-3 5-1-6-4-1 4-1Zm-7 12 1-4 2 3 2 1-3 1-2 2z" fill="#fac185"/><path d="M19 72h68m-56 3h44" stroke="#856570" stroke-linecap="round"/></svg>';
export function createForgeArt(T,scene,forge){
 const tex=cv=>{const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;t.magFilter=t.minFilter=T.NearestFilter;t.generateMipmaps=false;return t;};
 const w=W*UNIT,h=H*UNIT,g=new T.PlaneGeometry(w,h),frames=Array.from({length:8},(_,i)=>tex(fire(i)));
 const panel=(map,z,order,name,blend=T.NormalBlending)=>{
  const m=new T.Mesh(g,new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false,blending:blend}));
  m.position.set(forge.x,forge.y+(FLOOR-H/2)*UNIT,z);m.renderOrder=order;m.visible=false;m.name=name;scene.add(m);return m;
 };
 const halo=panel(tex(warmth()),.57,6,'Calor de la fragua',T.AdditiveBlending);
 const building=panel(tex(workshop()),.6,7,'Forja · horno y yunque');
 const flame=panel(frames[0],.61,8,'Brasas de la forja');let index=0;
 return {update(t,camX,vw,quiet=false){
  const visible=Math.abs(camX-forge.x)<vw/2+w/2+.5;
  halo.visible=building.visible=flame.visible=visible;if(!visible)return;
  const next=quiet?0:Math.floor(t*6.5)%frames.length;
  if(index!==next){index=next;flame.material.map=frames[index];}
  halo.material.opacity=quiet?.70:.76+.07*Math.sin(t*3.1)+.04*Math.sin(t*6.2);
 }};
}
