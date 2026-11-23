// Every character atlas uses the same cell and foot pivot; sizes below are
// world units per 98 pixels of painted body, independent of transparent margins.
export const cell=Object.freeze({w:192,h:144,cols:4,px:80,py:124});
function fighter(id,idle,action,contact,lastActive,height,fps,tip,stride=0){
  // Stride is the distance between two contacts of the same foot (one full loop).
  const walk=stride?Object.freeze({count:8,stride}):null;
  return Object.freeze({id,idle,action,contact,lastActive,height,fps,tip,walk,rows:Math.ceil((idle+action)/cell.cols)});
}
export const sheets=Object.freeze({
  vigia:fighter('vigia',6,10,6,7,1.46,5.8,156,.88),
  ascua:fighter('ascua',6,6,4,4,1.53,6.5,153,1.12),
  anima:fighter('anima',6,6,4,4,1.51,6.2,141),
  orante:fighter('orante',6,6,3,3,1.60,5.2,0),
  cieno:fighter('cieno',6,6,3,3,1.31,5.4,155),
  bastion:fighter('bastion',8,6,4,5,1.98,5.3,176,1.50),
  nara:Object.freeze({id:'nara',idle:5,action:12,rows:5,height:1.66})
});
// The crowned Cantora is a separate boss, as is the Astrónomo in the Observatory.
const types=Object.freeze({shade:'vigia',wisp:'vigia',stalker:'ascua',moth:'anima',sentry:'orante',
  hopper:'cieno',warden:'bastion',guardian:'bastion',brute:'bastion'});
export const sheetForType=type=>sheets[types[type]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const span=(a,b,t)=>a+Math.min(b-a,Math.floor(clamp(t,0,1)*(b-a+1)));
export function enemyFrame(e,clock){
  const s=sheetForType(e.type);if(!s)return 0;
  const duration=e.stateDuration||1,elapsed=Math.max(0,duration-e.timer),progress=elapsed/duration;
  if(e.state==='windup')return s.idle+span(0,s.contact-1,progress);
  if(e.state==='strike')return s.idle+span(s.contact,s.lastActive,progress);
  if(e.state==='recovery'){
    // A ranged cast releases directly into recovery; melee has already played its hit.
    const first=e.shooter?s.contact:Math.min(s.lastActive+1,s.action-1);
    const beat=.115;
    if(elapsed<(s.action-first)*beat)return s.idle+first+Math.floor(elapsed/beat);
  }
  if(s.walk && e.walkTravel && (e.state==='idle'||e.state==='chase')){
    const step=Math.floor(Math.abs(e.walkTravel)*s.walk.count/s.walk.stride)%s.walk.count;
    return s.idle+s.action+step;
  }
  return Math.floor(clock*s.fps+(e.id||0)*1.73)%s.idle;
}
export function naraFrame(talking,seconds){
  if(talking)return sheets.nara.idle+Math.floor(Math.max(0,seconds)*7)%sheets.nara.action;
  // Open eyes linger between blinks. The shorter authored middle poses form a single blink.
  const ticks=[0,0,0,0,1,2,3,4,4,4,4,4];return ticks[Math.floor(Math.max(0,seconds)*5)%ticks.length];
}
export function frameRect(s,index){
  const local=index>=s.idle+s.action?index-s.idle-s.action:index;
  return {x:(local%cell.cols)*cell.w,y:Math.floor(local/cell.cols)*cell.h,w:cell.w,h:cell.h};
}
// The red beads leave the Orante's right hand in its fourth attack drawing.
export function shotOrigin(e){
  const unit=sheets.orante.height/98;
  return {x:e.x+e.facing*(127-cell.px)*unit,y:e.y+(cell.py-85)*unit};
}
export function meleeReach(e,targetWidth){
  const s=sheetForType(e.type),limit=e.range+.14;
  return s?.tip ? Math.min(limit,(s.tip-cell.px)*s.height/98+targetWidth*.5) : limit;
}
export const frameURL=(s,walking=false)=>'./art/personajes/'+s.id+(walking?'-caminar':'')+'.webp';
// Independent immutable UV tiles share the same decoded image and GPU source.
// Both the embedded Three.js renderer and the Canvas 2D fallback read offset/repeat.
export function createSpriteLibrary(T){
  const loader=new T.TextureLoader(),books=new Map();
  function tiles(url,count,rows){
    const master=loader.load(url);
    master.colorSpace=T.SRGBColorSpace;master.magFilter=T.NearestFilter;master.minFilter=T.LinearFilter;
    master.generateMipmaps=false;
    const frames=[];for(let i=0;i<count;i++){
      const tex=master.clone();
      tex.repeat.set(1/cell.cols,1/rows);
      tex.offset.set(i%cell.cols/cell.cols,1-(Math.floor(i/cell.cols)+1)/rows);
      frames.push(tex);
    }
    return {master,frames};
  }
  function book(s){
    if(books.has(s.id))return books.get(s.id);
    const b=tiles(frameURL(s),s.idle+s.action,s.rows);
    if(s.walk)b.frames.push(...tiles(frameURL(s,true),s.walk.count,Math.ceil(s.walk.count/cell.cols)).frames);
    books.set(s.id,b);return b;
  }
  const geometry=new T.PlaneGeometry(cell.w,cell.h);
  function actor(scene,s,z,order){
    const cache=book(s),mat=new T.MeshBasicMaterial({map:cache.frames[0],transparent:true,depthWrite:false,
      side:T.DoubleSide,alphaTest:.008,toneMapped:false});
    const mesh=new T.Mesh(geometry,mat);mesh.name=s.id;mesh.renderOrder=order;mesh.visible=false;scene.add(mesh);
    const unit=s.height/98;
    function pose(x,y,dir,i,opacity=1){
      const sign=dir<0?-1:1;
      // Keep the ready resting pose on screen while a second atlas is downloading.
      const requested=cache.frames[i],tile=requested.image?.width?requested:cache.frames[0];
      mesh.visible=!!tile.image?.width;
      mesh.scale.set(sign*unit,unit,1);
      mesh.position.set(x+sign*(cell.w/2-cell.px)*unit,y+(cell.py-cell.h/2)*unit,z);
      mat.map=tile;mat.opacity=opacity;
    }
    return {mesh,pose,dispose(){scene.remove(mesh);mat.dispose();}};
  }
  return {actor,book};
}
