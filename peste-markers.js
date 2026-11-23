import {names,cords,portsAt,circuit} from './peste.js';
// Painted in the same plane as the existing beacons. The vessel level, bell
// lamps and pipe orientations echo their real states even outside the panel.
export function createMarshMarkers(T,scene,plague){
 const ink='#201925',iron='#45434b',brass='#a98556',gold='#edcf8d',leaf='#a4d3a1',pale='#f5e7bb';
 const objects=[...plague.devices,...plague.shortcuts.map(s=>({...s,role:'lever'}))].map(d=>{
  const canvas=document.createElement('canvas');canvas.width=76;canvas.height=88;
  const c=canvas.getContext('2d'),tex=new T.CanvasTexture(canvas);tex.magFilter=T.NearestFilter;tex.minFilter=T.LinearFilter;tex.colorSpace=T.SRGBColorSpace;tex.generateMipmaps=false;
  const h=d.role==='clue'?1.05:d.role==='lever'?1.1:d.puzzle==='campanas'?1.83:1.63,w=h*76/88;
  const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({transparent:true,map:tex,depthWrite:false,alphaTest:.01}));
  m.position.set(d.x,d.y+h/2,1.32);m.renderOrder=12;m.visible=false;scene.add(m);
  const box=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
  const path=(points,col)=>{c.fillStyle=col;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  const line=(x,y,X,Y,col,size)=>{c.strokeStyle=col;c.lineWidth=size;c.lineCap='square';c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke();};
  const text=(txt,x,y,col,sz=13)=>{c.font='bold '+sz+'px monospace';c.textAlign='center';c.fillStyle=col;c.fillText(txt,x,y);};
  let key='';
  function draw(marsh){
   const s=marsh.state,idx=Number(d.id.split('-').at(-1)),done=marsh.solved.has(d.puzzle);
   const newKey=d.role==='lever'?Number(marsh.shortcuts.has(d.id)):d.role==='clue'?Number(marsh.inscriptions.has(d.puzzle)):d.puzzle==='sal'?s.volumes[idx]:d.puzzle==='campanas'?s.bells:s.turns[idx];
   const sig=newKey+':'+done;if(key===sig)return;key=sig;c.clearRect(0,0,76,88);
   box(9,81,58,7,ink);box(14,78,48,4,brass);box(17,82,40,2,iron);
   if(d.role==='clue'){
    path([[17,78],[21,32],[28,19],[49,16],[57,28],[60,78]],ink);
    path([[22,74],[25,34],[30,24],[48,21],[54,29],[55,74]],iron);
    box(27,31,22,2,brass);box(30,56,17,2,gold);box(28,62,22,2,brass);box(30,66,14,2,brass);
    text(({sal:'≋',campanas:'♢',injerto:'✣'})[d.puzzle],39,51,leaf,19);
   }else if(d.role==='lever'){
    box(21,44,31,34,ink);box(25,48,23,25,iron);
    const on=marsh.shortcuts.has(d.id),ex=on?54:24,ey=on?56:23;
    line(37,57,ex,ey,ink,9);line(37,55,ex,ey,brass,4);box(ex-5,ey-5,10,8,on?leaf:gold);box(32,53,10,9,brass);
   }else if(d.puzzle==='sal'){
    const max=[8,5,3][idx],top=[18,26,34][idx];
    box(12,top+11,9,48,ink);box(15,top+8,7,7,brass);box(54,top+10,10,6,brass);box(59,top+14,5,8,gold);
    path([[22,top],[51,top],[56,top+6],[56,67],[50,77],[24,77],[19,66],[19,top+6]],ink);
    box(23,top+5,28,63-top,iron);box(25,top+6,4,59-top,brass);
    const fill=Math.round((64-top)*s.volumes[idx]/max);if(fill){box(31,65-fill,16,fill,'#789d88');box(31,65-fill,16,3,leaf);}
    box(20,top+1,35,4,brass);box(24,70,27,4,brass);text(max+'L',38,top-3,pale,13);
   }else if(d.puzzle==='campanas'){
    box(13,14,6,64,ink);box(17,18,3,61,brass);box(12,12,48,7,ink);box(16,13,41,2,gold);box(35,20,2,10,brass);
    path([[26,49],[29,44],[30,34],[33,28],[41,28],[45,34],[46,44],[50,49],[50,52],[25,52]],brass);
    box(34,32,4,13,gold);box(23,50,28,3,gold);box(35,53,5,3,'#eee0b9');line(55,19,55,63,brass,2);box(53,61,5,10,leaf);
    for(let i=0;i<5;i++)if(cords[idx]&(1<<i))box(22+i*6,66,4,4,s.bells&(1<<i)?gold:'#716a72');
    text(['I','II','III','IV'][idx],37,79,pale,10);
   }else{
    box(17,55,7,23,ink);box(52,54,7,24,ink);box(12,41,51,9,brass);
    path([[21,30],[29,22],[46,22],[55,31],[55,52],[46,62],[29,62],[20,52]],ink);
    path([[24,32],[31,26],[45,26],[51,32],[51,50],[44,56],[31,56],[24,50]],iron);
    const tile=circuit.find(t=>t.rotor===idx),v=portsAt(tile,s.turns);
    [[0,-1],[1,0],[0,1],[-1,0]].forEach(([x,y],j)=>{if(v&(1<<j))line(37,41,37+x*12,41+y*12,leaf,4);});
    box(34,38,7,7,gold);text(['A','B','C'][idx],38,75,pale,12);
   }
   if(done&&d.role==='control')box(55,73,5,5,leaf);
   tex.needsUpdate=true;
  }
  m.name=d.role==='lever'?d.name:d.role==='clue'?names[d.puzzle].name:d.id;
  return {d,m,draw};
 });
 return {update(camX,vw,marsh){for(const o of objects){o.m.visible=marsh.admitted&&Math.abs(o.d.x-camX)<vw*.55+2;if(o.m.visible)o.draw(marsh);}}};
}
