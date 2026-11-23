import {ritual,arenaView} from './ritual.js';
import {paintRitual} from './ritual-art.js';
import * as THREE from './vendor/three.module.js';
import {createSimulation} from './physics.js';
import {createWorld} from './world.js';
import {createPanTravel,createDepthBands,marshBlend,parallaxModes,parallaxStrength,effectiveParallax,scenicFocus} from './paralaje.js';
import {createActors} from './actors.js';
import {createSpriteLibrary,sheets,frameRect} from './bestiario.js';
import {createCanvasRenderer} from './canvas-renderer.js';
import {roadX} from './main-road.js';
import {buildCampaign,loadDestination} from './campaign.js';
import {createMarsh,names as marshNames} from './peste.js';
import {puzzlePanel,deviceLabel} from './peste-ui.js';
import {createPlagueArt} from './peste-art.js';
import {createMarshMarkers} from './peste-markers.js';
import {level as base} from './level.js';
import {createJourney} from './journey.js';
import {caveLight,createCaves} from './caves.js';
import {createLandmarks} from './landmarks.js';
import {profilesView} from './perfiles.js';
import {forgeOffer,temperBlade,dropsCrystal,grade,applePrice,errandRewards} from './forja.js';
import {createForgeArt,forgeEmblem} from './forja-arte.js';
import {charms,charmById,createPurse,legacyNuxReward} from './charms.js';
import {spreadBag,charmMarkup,merchantMarkup,iconApple,iconCrystal,ornament,safeText} from './interface.js';
import {questEntries,questView} from './codice-misiones.js';
import {travelView} from './carta-faros.js';
import {atlasView} from './atlas-paginas.js';
import {sections,codexFrame} from './codice-marco.js';
import {directionFor,spatialIndex,focusables,focusOn,cycle,pageSizes} from './menu-keys.js';
const query=new URLSearchParams(location.search),sid=Number(query.get('ranura')),zi=Number(query.get('ruta'));
let original=null;try{original=JSON.parse(localStorage.getItem('abyss-blade-slot-'+sid));}catch{}
const level=buildCampaign(base);let secondWon=false,pendingDoor=null,machine=null,machineInfo={};
const $=s=>document.querySelector(s), overlay=$('#overlay'), hud=$('#hud'), hint=$('#hint');
const touchMedia=matchMedia('(any-pointer:coarse)');
let touch=touchMedia.matches;
const stage=$('#stage'), touchControls=$('#touch'), touchHint=$('#touch-hint'), joystick=$('#joystick');
const interactButton=touchControls.querySelector('[data-act="interact"]');
stage.classList.toggle('touch-mode',touch);
let stickPointer=null,stickAxis=0;
const reduce=matchMedia('(prefers-reduced-motion:reduce)');
const surface=document.createElement('canvas');
const gl=surface.getContext('webgl2',{antialias:true,alpha:false});
const renderer=gl?new THREE.WebGLRenderer({canvas:surface,context:gl,antialias:true}):createCanvasRenderer(THREE);
renderer.domElement.setAttribute('aria-label','Escenario de Abyss Blade');
renderer.setPixelRatio(Math.min(devicePixelRatio,gl?(touch?1.35:1.8):Math.min(1,1100/innerWidth)));
renderer.outputColorSpace=THREE.SRGBColorSpace;$('#view').append(renderer.domElement);
const scene=new THREE.Scene(), camera=new THREE.OrthographicCamera(-10,10,5,-5,.1,100);
const sim=createSimulation({...level,enemyUpdateRadius:32,enemies:level.enemies.filter(e=>e.id!==level.keeper),health:6,hasSword:false});
const world=createWorld(THREE,scene,{...level,swordX:level.sword.x,gateX:level.archiveAltar.x});
const pan=createPanTravel(level.spawn.x,2.6),depthBands=createDepthBands(THREE,scene);
let panCut=true,wasFramed=false;
const sprites=createSpriteLibrary(THREE), actors=createActors(THREE,scene,sim,sprites);
const journey=createJourney(level,sim), landmarks=createLandmarks(THREE,scene,level,sprites), caves=createCaves(THREE,scene);
const forgeArt=createForgeArt(THREE,scene,level.forge);
const marsh=createMarsh(level.plague,sim),marshArt=createPlagueArt(THREE,scene,level.plague),marshMarkers=createMarshMarkers(THREE,scene,level.plague);
const marshShutters=level.plague.platforms.filter(g=>g.gateId).map(g=>({...g,plaque:level.plague.devices.find(d=>d.role==='clue'&&g.gateId==='peste-'+d.puzzle)}));
const veil=$('#cave-veil'),purse=createPurse();
let inventoryTab='objects',charmChoice='seed',wareChoice='seed',notice='';
const fight=ritual(roadX(474)-474),drawMage=paintRitual(THREE,scene,fight);
let errands=[0,0], stickUp=false;
const jobs=[{title:'Una luz para Nara',dest:'forest',where:'Bosque de la Vigilia',reward:errandRewards.forest},{title:'El agua recuerda',dest:'water',where:'Cisternas del Velo',reward:errandRewards.water}];
const discoveredCheckpoints=new Set();
let slot=0, station=null, cinema=null, optionReturn='title', complete=false,profileChoice=1,profileSaves=[],forgeMessage='';
const profileIds=[1,2,3,4];
const saveKey=i=>'abyss-blade-slot-'+i;
function readSave(i){try{return JSON.parse(localStorage.getItem(saveKey(i))||'null');}catch{return null;}}
function storeSave(){if(!slot)return;try{const data={
 version:1,ritualWon:fight.b.won,inObservatory:fight.locked,errands,sword,rank,apples,crystals,complete,finishAt:complete?level.exit.x:null,elapsed,checkpoint:checkpoint??level.spawn,
 economy:purse.snapshot(),journey:journey.snapshot(),marsh:marsh.snapshot(),seenCheckpoints:[...discoveredCheckpoints],items:pickups.filter(p=>p.taken).map(p=>p.id),
 defeated:sim.enemies.filter(e=>!e.hp).map(e=>e.sourceId),
};const out={...data,road:1,secondWon};
localStorage.setItem(saveKey(slot),JSON.stringify(out));}catch{}}
const opt=(()=>{try{return JSON.parse(localStorage.getItem('abyss-blade-options')||'{}');}catch{return {};}})();
let volume=Number.isFinite(opt.volume)?THREE.MathUtils.clamp(opt.volume,0,1):.7;
let lowMotion=opt.motion===true;
let parallaxMode=parallaxModes.includes(opt.parallax)?opt.parallax:'auto';
const quiet=()=>reduce.matches||lowMotion;
const motionLabels={auto:'Auto',normal:'Normal',suave:'Suave',fijo:'Fijo'};
function depthNote(){
 const mode=effectiveParallax(parallaxMode,quiet());
 const note=mode==='normal'?'El paisaje se desplaza al caminar y saltar.':mode==='suave'?'El paisaje se desplaza con menos intensidad.':'El paisaje permanece fijo mientras caminas.';
 return parallaxMode==='auto'?'Auto · '+motionLabels[mode]+'. '+note:note;
}
function depthSetting(){
 return '<fieldset class="depth-options" aria-describedby="depth-note"><legend>Paralaje del escenario</legend><div>'+parallaxModes.map(id=>'<button type="button" data-depth="'+id+'" aria-pressed="'+(id===parallaxMode)+'">'+motionLabels[id]+'</button>').join('')+'</div><small id="depth-note" aria-live="polite">'+depthNote()+'</small></fieldset>';
}
function reflectDepth(){
 for(const b of overlay.querySelectorAll('[data-depth]'))b.setAttribute('aria-pressed',String(b.dataset.depth===parallaxMode));
 const note=$('#depth-note');if(note)note.textContent=depthNote();
}
function chooseDepth(id){parallaxMode=id;reflectDepth();saveOptions();}
reduce.addEventListener('change',reflectDepth);
function saveOptions(){try{localStorage.setItem('abyss-blade-options',JSON.stringify({volume,motion:lowMotion,parallax:parallaxMode}));}catch{}}
let mode='title', apples=0, crystals=0, rank=1, sword=false, corruption=0, elapsed=0, fx=0, flash=0, toast=0, acc=0, last=performance.now(), camX=level.spawn.x+4,camY=2.6, vw=20,vh=10, sequence=null, checkpoint=null, selected='heal';
const held={},prev={},pressed=new Set(),touchMap=new Map();
const keys={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',KeyW:'aimUp',ArrowUp:'aimUp',KeyJ:'attack',KeyK:'dash',ShiftLeft:'dash',KeyE:'interact',KeyI:'inventory',KeyM:'map',Escape:'pause'};
function msg(text){$('#toast').textContent=text;toast=2;}
const audio={};
for(const k of ['attack','awakening','echo','fragment','heal','hit','hurt','jump'])audio[k]=new Audio('./assets/'+k+'.wav');
function play(k,gain=.26){if(volume>0&&audio[k]){const a=audio[k].cloneNode();a.volume=gain*volume;a.play().catch(()=>{});}}
function crystalMesh(type){
 const group=new THREE.Group();
 const col=type==='apple'?0xff8872:0xeab5ff;
 const mesh=new THREE.Mesh(type==='apple'?new THREE.IcosahedronGeometry(.19,0):new THREE.OctahedronGeometry(.22),new THREE.MeshBasicMaterial({color:col}));
 mesh.scale.y=type==='apple'?1:1.45;group.add(mesh);
 const halo=new THREE.Mesh(new THREE.CircleGeometry(.34,22),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.14,depthWrite:false}));
 halo.position.z=-.1;group.add(halo);scene.add(group);return group;
}
const beadMaps=['cuentas','cuentas-vuelo'].map(name=>{
 const tex=new THREE.TextureLoader().load('./art/personajes/'+name+'.webp');
 tex.colorSpace=THREE.SRGBColorSpace;tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;
 return tex;
});
const beadUnit=sheets.orante.height/98, beadGeometry=new THREE.PlaneGeometry(64*beadUnit,28*beadUnit);
const shotMeshes=Array.from({length:16},()=>{
 const m=new THREE.Mesh(beadGeometry,new THREE.MeshBasicMaterial({map:beadMaps[0],transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
 m.name='Cuentas del Orante';m.renderOrder=58;m.visible=false;scene.add(m);return m;
});
const pickups=level.pickups.map((p,i)=>({...p,mesh:crystalMesh(p.type),i,taken:false}));

const points=new Float32Array(160*3), colors=new Float32Array(160*3);
const buffer=new THREE.BufferGeometry();buffer.setAttribute('position',new THREE.BufferAttribute(points,3));buffer.setAttribute('color',new THREE.BufferAttribute(colors,3));buffer.setDrawRange(0,0);
const sparks=new THREE.Points(buffer,new THREE.PointsMaterial({size:4,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending}));sparks.frustumCulled=false;scene.add(sparks);
const bits=[];
function burst(x,y,color,n=12){if(quiet())n=Math.min(5,n);for(let i=0;i<n;i++){if(bits.length>=160)bits.shift();const a=Math.random()*6.283,v=1+Math.random()*5;bits.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:.28+Math.random()*.52,c:new THREE.Color(color)});}}
function fxUpdate(dt){for(let i=bits.length-1;i>=0;i--){let b=bits[i];b.t-=dt;if(b.t<=0){bits.splice(i,1);continue;}b.x+=b.vx*dt;b.y+=b.vy*dt;b.vy-=7*dt;}
 bits.forEach((b,i)=>{points.set([b.x,b.y,4],i*3);colors.set([b.c.r,b.c.g,b.c.b].map(v=>v*Math.min(1,b.t*3)),i*3);});buffer.attributes.position.needsUpdate=true;buffer.attributes.color.needsUpdate=true;buffer.setDrawRange(0,bits.length);}
function updateHUD(){
 const p=sim.player;
 const lives=Array.from({length:p.maxHp},(_,i)=>'<i class="'+(i>=p.hp?'empty':'')+'"></i>').join('');
 if($('#life').dataset.value!==lives){$('#life').innerHTML=lives;$('#life').dataset.value=lives;}
 $('#life').setAttribute('aria-label',p.hp+' de '+p.maxHp+' de vida');const energy=Math.round(100*(p.energy||0)/(p.maxEnergy||1));$('#energy').style.setProperty('--energy',energy+'%');$('#energy').setAttribute('aria-valuenow',String(energy));
 const stock='⬢ '+purse.nux+' Nux  ·  ✦ '+crystals+'  ·  '+apples+' manz.';if($('#stock').textContent!==stock)$('#stock').textContent=stock;$('#stock').setAttribute('aria-label',purse.nux+' Nux, '+crystals+(crystals===1?' cristal':' cristales')+' y '+apples+(apples===1?' manzana':' manzanas'));
 const index=journey.visit(p.x),sector=marsh.visit(p.x),zone=sector?.name??level.zones[Math.max(0,index)].name;
 if($('#zone').textContent!==zone)$('#zone').textContent=zone;
 const chapter=$('.chapter span'),region=sector?'MARJAL DE LA PESTE':'ABYSS BLADE';if(chapter.textContent!==region)chapter.textContent=region;
}
let portrait=null,portraitFrame=-1;
function addNaraPortrait(){
 portrait=document.createElement('canvas');portrait.width=139;portrait.height=129;
 portrait.className='nara-talk';portrait.setAttribute('role','img');portrait.setAttribute('aria-label','Nara habla con Tom junto a su farol');
 overlay.querySelector('.panel').prepend(portrait);portraitFrame=-1;
}
function drawNaraPortrait(i){
 if(!portrait||i==null||i===portraitFrame)return;
 const image=sprites.book(sheets.nara).master.image;if(!image?.width)return;
 const rect=frameRect(sheets.nara,i),c=portrait.getContext('2d');
 c.clearRect(0,0,portrait.width,portrait.height);c.imageSmoothingEnabled=false;
 c.drawImage(image,rect.x+18,rect.y+2,portrait.width,portrait.height,0,0,portrait.width,portrait.height);
 portraitFrame=i;
}
function panel(title,body,buttons,tag='ABYSS BLADE'){
 portrait=null;portraitFrame=-1;
 overlay.className=mode==='title'?'title':'';overlay.hidden=false;
 overlay.innerHTML='<div class="panel"><div class="eyebrow">'+tag+'</div>'+title+ornament+body+'<div class="actions">'+buttons+'</div>'+(mode==='title'?'<small class="menu-keyline cover-keyline">W / S o ↑ / ↓ · Elegir &nbsp; J / Enter · Aceptar</small>':'<small class="menu-keyline">WASD / Flechas · Elegir &nbsp; J / Enter · Aceptar &nbsp; K / Esc · Volver</small>')+'</div>';
 queueMicrotask(defaultMenuFocus);
}
function resetStick(){
 const pointer=stickPointer;stickPointer=null;stickAxis=0;stickUp=false;
 if(pointer!==null&&joystick.hasPointerCapture(pointer))joystick.releasePointerCapture(pointer);
 joystick.classList.remove('held');joystick.style.removeProperty('--stick-x');joystick.style.removeProperty('--stick-y');
}
function syncControls(){
 const playing=mode==='play';
 touchControls.hidden=!touch||!playing;
 hint.hidden=touch||!playing;
 touchHint.hidden=!touch||!playing;
}
function clearInput(){resetStick();pressed.clear();for(const k in held)held[k]=false;for(const k in prev)delete prev[k];for(const [id,act] of touchMap){
   const b=touchControls.querySelector('[data-act="'+act+'"]');if(b?.hasPointerCapture(id))b.releasePointerCapture(id);
 }touchMap.clear();document.querySelectorAll('.held').forEach(b=>b.classList.remove('held'));}
const action=(id,label,cls='')=>'<button id="'+id+'" '+(cls?'class="'+cls+'"':'')+'>'+label+'</button>';
const back=()=>action('back','Volver');
const resume=()=>action('resume','Volver');
let questChoice=null,questPage=null,showDone=false,questSheet=null,questRows=[];
let faroChoice=null,faroPage=null,faroSheet=null,atlasPage=0,atlasSheet=null;
let bookReturn='play',mapReturn='play',travelReturn='play',lastLiveQuest=null;
function openBook(tab=inventoryTab,from='play'){bookReturn=from;inventoryTab=tab;notice='';show('inventory');}
function openMap(from='play'){mapReturn=from;atlasPage=0;show('map');}
function openTravel(origin,from,preferred=null){if(fight.locked)return;station=origin;travelReturn=from;faroChoice=preferred;faroPage=null;show('travel');}
function backMenu(){
 if(mode==='inventory'){show(bookReturn);return;}
 if(mode==='map'){show(mapReturn);return;}
 if(mode==='travel'){show(travelReturn);return;}
 if(mode==='barter'){show('travel');return;}
 if(mode==='options'){show(optionReturn);return;}
 if(['slots','help','credits'].includes(mode)){show('title');return;}
 if(mode==='dialogue'){nextLine();return;}
 if(['machine','shop','pause','door','forge'].includes(mode)){pendingDoor=null;show('play');}
}
const selectedButton=(kind,id)=>id==null?null:overlay.querySelector('[data-'+kind+'="'+CSS.escape(String(id))+'"]');
function defaultMenuFocus(){
 if(overlay.hidden||overlay.contains(document.activeElement))return;
 const el=mode==='inventory'?(inventoryTab==='objects'?selectedButton('item',selected):inventoryTab==='charms'?selectedButton('charm',charmChoice):selectedButton('quest',questChoice))
 :mode==='slots'?selectedButton('profile',profileChoice):mode==='travel'?selectedButton('faro',faroChoice):mode==='map'?overlay.querySelector('[data-atlas-index][aria-pressed="true"]'):mode==='shop'?selectedButton('ware',wareChoice):null;
 focusOn(el||overlay.querySelector('.slot:not(:disabled),.machine-ops button:not(:disabled)')||overlay.querySelector('button.primary:not(:disabled)')||focusables(overlay)[0]);
}
function renderSheet(section,body,actions=''){
 portrait=null;portraitFrame=-1;overlay.hidden=false;overlay.className='book-overlay';
 overlay.innerHTML=codexFrame(section,body,actions);
}
function renderBook(){
 if(inventoryTab==='quests'){
  questRows=questEntries({sword,journey,marsh,won:fight.b.won,secondWon,complete,errands,jobs,level});
  questSheet=questView(questRows,{selected:questChoice,showDone,page:questPage,size:pageSizes(stage.clientWidth,stage.clientHeight).quests});
  questChoice=questSheet.selected;questPage=questSheet.page;
  renderSheet('quests',questSheet.html);
 }else if(inventoryTab==='charms'){
  const c=charmById(charmChoice),eq='<button id="equipcharm" class="primary" '+(!purse.owned.has(c.id)?'disabled':'')+'>'+(purse.equipped.has(c.id)?'Desequipar':'Equipar')+'</button>';
  renderSheet('charms','<section class="pack-leaf">'+charmMarkup(charms,purse,charmChoice,purse.capacity)+'<p class="pack-message" role="status">'+safeText(notice)+'</p></section>',eq);
 }else{
  const items=[['heal','Manzanas',iconApple,apples],['crystal','Cristales',iconCrystal,crystals]].map(([id,label,icon,n])=>'<button data-item="'+id+'" aria-pressed="'+(selected===id)+'"><span class="item-icon">'+icon+'</span><b>'+label+'</b><span>× '+n+'</span></button>').join('');
  renderSheet('objects','<section class="pack-leaf">'+spreadBag(items,sword,rank,purse,journey)+'</section>',action('use','Usar','primary'));updateInventory();
 }
 defaultMenuFocus();
}
function renderFaros(){
 faroSheet=travelView({level,journey,marsh,station,player:sim.player,selected:faroChoice,page:faroPage,size:pageSizes(stage.clientWidth,stage.clientHeight).faros});
 faroChoice=faroSheet.selected;faroPage=faroSheet.page;renderSheet('travel',faroSheet.html);defaultMenuFocus();
}
function renderAtlas(){
 atlasSheet=atlasView({level,journey,marsh,player:sim.player,page:atlasPage,locked:fight.locked});atlasPage=atlasSheet.page;
 renderSheet('map',atlasSheet.html);defaultMenuFocus();
}
function setTab(id){if(!sections.includes(id))return;inventoryTab=id;notice='';renderBook();}
function turnPage(step){
 if(mode==='travel'&&faroSheet){faroPage=Math.max(0,Math.min(faroSheet.pages-1,faroPage+step));renderFaros();return;}
 if(mode==='map'&&atlasSheet){atlasPage=Math.max(0,Math.min(atlasSheet.pages-1,atlasPage+step));renderAtlas();return;}
 if(mode==='inventory'&&inventoryTab==='quests'&&questSheet){const next=Math.max(0,Math.min(questSheet.pages-1,questPage+step));if(questPage!==next){questPage=next;questChoice=null;renderBook();}}
}
function toggleDone(){
 const active=questRows.filter(q=>!q.done),done=questRows.filter(q=>q.done);
 if(!done.length)return;
 if(!showDone){
  lastLiveQuest=questChoice;showDone=true;
  const size=pageSizes(stage.clientWidth,stage.clientHeight).quests,at=Math.floor(active.length/size);
  if(at!==questPage||!questChoice){questChoice=done.at(-1).id;questPage=at;}
 }else{showDone=false;questChoice=lastLiveQuest;questPage=null;}
 renderBook();
}
function pick(el,keyboard=false){
 if(!el)return;
 const d=el.dataset;
 if(d.quest){if(d.quest!==questChoice){questChoice=d.quest;renderBook();}if(keyboard)focusOn(selectedButton('quest',d.quest));}
 else if(d.faro||d.fnode){const id=d.faro||d.fnode;if(id!==faroChoice){faroChoice=id;faroPage=null;renderFaros();}if(keyboard)focusOn(selectedButton('faro',id));}
 else if(mode==='slots'&&(d.profile||d.pickProfile)){
  if(d.pickProfile&&keyboard){focusOn(el);return;}
  profileChoice=Number(d.profile||d.pickProfile);renderProfiles();
 }
 else if(d.charm){if(charmChoice!==d.charm){charmChoice=d.charm;notice='';renderBook();}if(keyboard)focusOn(selectedButton('charm',d.charm));}
 else if(d.ware){if(wareChoice!==d.ware){wareChoice=d.ware;notice='';show('shop');}if(keyboard)focusOn(selectedButton('ware',d.ware));}
 else if(d.item){selected=d.item;updateInventory();if(keyboard)focusOn(el);}
 else if(keyboard)focusOn(el);
}
function confirmFaro(){
 if(mode!=='travel'||!faroSheet?.canTravel||fight.locked)return;
 const dest=level.stations.find(s=>s.id===faroChoice);
 if(!dest||!station||dest.id===station.id||!journey.unlocked.has(dest.id)||(dest.x>=level.plague.start&&!marsh.admitted))return;
 if(relocate(dest)){play('echo');show('play');storeSave();msg('Faro · '+dest.name);}
}
function menuKey(e){
 const c=e.code,dir=directionFor(c),accept=['Space','Enter','NumpadEnter','KeyJ','KeyE'].includes(c),back=c==='Escape'||c==='KeyK';
 if(mode==='cinema'){if(accept||back){e.preventDefault();if(!e.repeat)$('#skip').click();}return;}
 const inv=mode==='inventory',travel=mode==='travel',atlas=mode==='map';
 const browse=travel||atlas||(inv&&inventoryTab==='quests');
 const modifier=e.shiftKey&&c!=='Tab';if(modifier)return;
 if(atlas&&c==='KeyF'){e.preventDefault();if(!e.repeat)overlay.querySelector('#recall:not(:disabled)')?.click();return;}
 const tabs=inv&&(c==='KeyQ'||c==='KeyR'),toggle=inv&&inventoryTab==='quests'&&c==='KeyC';
 const flip=browse&&['KeyZ','KeyX','PageUp','PageDown'].includes(c);
 const shortcut=(inv&&(c==='KeyI'||c==='KeyL'))||(atlas&&c==='KeyM');
 if(!(dir||accept||back||tabs||toggle||flip||shortcut||c==='Tab'))return;
 e.preventDefault();if(e.repeat&&!(dir||c==='Tab'))return;
 if(shortcut){if(c==='KeyL'&&inventoryTab!=='quests')setTab('quests');else backMenu();return;}
 if(back){backMenu();return;}
 if(tabs){setTab(sections[cycle(sections.indexOf(inventoryTab),sections.length,c==='KeyQ'?-1:1)]);return;}
 if(flip){turnPage(c==='KeyZ'||c==='PageUp'?-1:1);return;}
 if(toggle){toggleDone();return;}
 const controls=focusables(overlay),cur=overlay.contains(document.activeElement)?document.activeElement:null;
 if(!controls.length)return;
 if(c==='Tab'){pick(controls[cycle(controls.indexOf(cur),controls.length,e.shiftKey?-1:1)],true);return;}
 if(!cur||!controls.includes(cur)){defaultMenuFocus();return;}
 const d=cur.dataset;
 if(dir){
  if(mode==='slots'&&dir[0]&&(d.profile||d.pickProfile)){
   profileChoice=profileIds[cycle(profileChoice-1,profileIds.length,dir[0])];renderProfiles();return;
  }
  if(mode==='options'&&d.depth&&dir[0]){
   const id=parallaxModes[cycle(parallaxModes.indexOf(d.depth),parallaxModes.length,dir[0])];
   chooseDepth(id);focusOn(overlay.querySelector('[data-depth="'+id+'"]'));return;
  }
  if(cur.type==='range'&&dir[0]){cur.value=String(Math.max(Number(cur.min),Math.min(Number(cur.max),Number(cur.value)+dir[0]*5)));cur.dispatchEvent(new Event('input',{bubbles:true}));return;}
  if(travel&&d.faro&&dir[1]){
   const all=faroSheet.allIds??level.stations.map(s=>s.id);
   const i=all.indexOf(d.faro),n=i+dir[1];if(n>=0&&n<all.length){faroChoice=all[n];faroPage=null;renderFaros();}return;
  }
  const i=controls.indexOf(cur),s=spatialIndex(controls.map(b=>b.getBoundingClientRect()),i,dir);
  pick(controls[s],true);return;
 }
 if(accept){
  if(d.item){if(!$('#use').disabled)$('#use').click();return;}
  if(d.charm){if(!$('#equipcharm').disabled)$('#equipcharm').click();return;}
  if(d.ware){if(!$('#buycharm').disabled)$('#buycharm').click();return;}
  if(d.faro||d.fnode){confirmFaro();return;}
  if(cur.type!=='range')cur.click();
 }
}

function show(next){
 mode=next;clearInput();hud.hidden=next!=='play';syncControls();overlay.hidden=next==='play'||next==='cinema';
 $('#cinematic').hidden=next!=='cinema';
 if(next==='play'){document.activeElement?.blur();updateHUD();return;}
 if(next==='inventory'){renderBook();return;}
 if(next==='travel'){renderFaros();return;}
 if(next==='map'){renderAtlas();return;}
 if(next==='title'){
   const available=profileIds.some(i=>readSave(i));
   panel('<h1><img class="official-logo" src="./art/portada-horizontal.webp" width="1962" height="698" alt="Abyss Blade" fetchpriority="high"></h1>','<div class="subtitle">El umbral</div><p>El bosque recuerda lo que la espada olvida.</p>',(available?action('continue','Continuar','primary'):'')+action('start','Nueva partida',available?'':'primary')+action('duel','Ensayar contra el mago')+action('options','Opciones')+action('help','Controles')+action('credits','Créditos'),'');
 }
 if(next==='slots'){renderProfiles();return;}
 if(next==='forge'){renderForge();return;}
 if(next==='help')panel('<h2>Controles</h2>','<p>A/D o flechas: moverte · Espacio: saltar<br>W/↑ + J: corte ascendente · J: atacar · K: esquivar · E: interactuar<br>I: códice · L: misiones · M: mapa · F en el mapa: faros · Esc: pausa</p><p><b>En los menús</b><br>WASD o flechas: elegir · J, E o Enter: aceptar · K o Esc: volver<br>Q / R: pestañas · Z / X o RePág / AvPág: páginas · C: ver u ocultar completadas · Tab: siguiente control</p><p>En pantalla táctil puedes tocar las pestañas, los botones y las flechas de página.</p>',back());
 if(next==='credits')panel('<h2>Créditos</h2>','<p>Abyss Blade · Proyecto de titulación de Javier.<br>Sprites de Tom, Nara y los enemigos, y sonidos del proyecto original.<br>Versión web realizada en Three.js.</p>',back());
 if(next==='options')panel('<h2>Opciones</h2>','<div class="settings"><label for="volume">Volumen general <output id="vol-value">'+Math.round(volume*100)+' %</output></label><input id="volume" type="range" min="0" max="100" value="'+Math.round(volume*100)+'"><label class="check"><input id="motion" type="checkbox" '+(lowMotion?'checked':'')+'> Reducir sacudidas y destellos</label>'+depthSetting()+'</div>',back(),'PREFERENCIAS');
 if(next==='pause')panel('<h2>Pausa</h2>','<p>El bosque puede esperar.</p>',action('resume','Continuar','primary')+action('openbook','Códice')+action('openmap','Mapa')+action('options','Opciones')+action('totitle','Guardar y salir'));
 if(next==='machine'&&machine){
   const m=puzzlePanel(machine,marsh,machineInfo);
   panel(m.title,m.body,action('resume','Volver al camino','primary'),m.tag);overlay.className='marsh-console';
 }
 if(next==='barter'){
   panel('<h2>Trueque del Eco</h2>','<div class="trade"><div class="item-icon">'+iconApple+'</div><p><b>Manzana del santuario</b><br>Recupera dos puntos de vida. Precio: '+applePrice+' Nux.</p></div><p>Bolsa: '+purse.nux+' Nux.</p>','<button id="buyapple" class="primary" '+(purse.nux>=applePrice?'':'disabled')+'>Pagar '+applePrice+' Nux</button>'+action('travelback','Volver al faro'),'SANTUARIO DEL ECO');
 }
 if(next==='shop'){
   const c=charmById(wareChoice),owned=purse.owned.has(c.id);
   const buy='<button id="buycharm" class="primary" '+(owned||purse.nux<c.price?'disabled':'')+'>'+(owned?'Ya comprado':purse.nux<c.price?'Nux insuficientes':'Comprar · '+c.price+' Nux')+'</button>';
   panel('<h2>Tienda de Nara</h2>',merchantMarkup(charms,purse,wareChoice)+(notice?'<p class="equip-notice" role="status">'+safeText(notice)+'</p>':''),action('jobs','Encargos de Nara')+buy+resume(),'MERCADER DE LINTERNAS');
   overlay.className='wide merchant';addNaraPortrait();
 }
 if(next==='duelwon')panel('<h2>Ritual vencido</h2>','<p>Has dominado los tres ecos oscuros. En la historia, vencer al mago abre la entrada al Marjal de la Peste.</p>',action('duel','Repetir ensayo','primary')+action('totitle','Menú principal'),'ENSAYO');
 if(next==='dead')panel('<h2>Has caído</h2>',fight.locked?'<p>El mago vuelve a alzar el báculo.</p>':'<p>El Eco te espera en el último refugio.</p>',action('retry',fight.locked?'Reintentar el duelo':'Volver al refugio','primary')+action('totitle','Menú principal'),'ABYSS BLADE');
 if(next==='complete')panel('<h2>El último eco</h2>','<p>Tom ha devuelto la espada. Su eco permanece mientras el bosque recupera la voz.</p>',action('resume','Seguir explorando','primary')+action('totitle','Menú principal'),'FIN DEL CAPÍTULO');
}
function renderProfiles(){
 portrait=null;overlay.hidden=false;overlay.className='profiles-overlay';
 overlay.innerHTML=profilesView({saves:profileSaves,level,selected:profileChoice});
 focusOn(selectedButton('profile',profileChoice));
}
function smithState(){return {rank,crystals,sword,relics:journey.relics,won:fight.b.won};}
function renderForge(){
 const o=forgeOffer(smithState());
 portrait=null;overlay.hidden=false;overlay.className='forge-overlay';
 const price=o.full?'':('<div class="smith-price">'+iconCrystal+'<span>'+crystals+' / '+o.cost+' cristales</span></div>');
 overlay.innerHTML='<section class="smith" aria-labelledby="smith-title">'+forgeEmblem+'<div class="smith-kicker">Umbral de la Raíz · Herrería</div><h2 id="smith-title">Forja de la Raíz</h2><div class="smith-grade" aria-label="Rango de la espada">'+grade(rank)+(o.full?'':'<i aria-hidden="true"></i>'+grade(o.target))+'</div><small>'+(o.full?'Temple final':'Espada del Abismo')+'</small>'+price+'<div role="status" class="smith-note">'+(forgeMessage?'<span class="smith-message">'+safeText(forgeMessage)+'</span><br>':'')+safeText(o.reason)+'</div><div class="smith-actions">'+(o.full?'':'<button id="temper" class="primary" '+(o.allowed?'':'disabled')+'>Templar a '+grade(o.target)+'</button>')+'<button id="resume">Volver</button></div><p class="smith-keys">J / Enter · Aceptar　 K / Esc · Volver</p></section>';
 defaultMenuFocus();
}
function updateInventory(){
 for(const b of overlay.querySelectorAll('[data-item]'))b.setAttribute('aria-pressed',String(b.dataset.item===selected));
 const heal=selected==='heal',name=heal?'Manzana del bosque':'Cristales del abismo';
 $('#item-info').innerHTML='<strong>'+name+'</strong><p>'+(heal?'Recupera dos puntos de vida. '+(!apples?'No llevas manzanas.':sim.player.hp>=sim.player.maxHp?'Tom ya tiene toda su vida.':'Pulsa J para comer una.'):'Sirven para templar la espada en la Forja de la Raíz, a la derecha del faro del Umbral.')+'</p><small>Espada: '+(sword?'nivel '+rank:'aún no la tienes')+'</small>';
 const btn=$('#use');btn.disabled=heal?(!apples||sim.player.hp>=sim.player.maxHp):(!journey.unlocked.has(level.forge.stationId)||fight.locked);
 btn.textContent=heal?'Usar manzana':fight.locked?'Faros sellados':journey.unlocked.has(level.forge.stationId)?'Localizar forja':'Descubre el faro del Umbral';
}
function relocate(dest,restore=false){
 if(fight.locked&&!restore)return false;
 if(!sim.teleport(dest.x,dest.y,{checkpoint:true,restore}))return false;
 checkpoint={x:dest.x,y:dest.y};panCut=true;camX=dest.x;camY=dest.y+2;clearInput();bits.length=0;return true;
}
function reset(data){
 panCut=true;
 if(data&&!data.road){data={...data,checkpoint:data.checkpoint?{...data.checkpoint,x:roadX(data.checkpoint.x)}:level.spawn,finishAt:data.complete?level.archiveAltar.x:null};}
 questChoice=lastLiveQuest=null;questPage=0;showDone=false;charmChoice=wareChoice='seed';bookReturn=mapReturn=travelReturn='play';
 secondWon=!!data?.secondWon;fight.reset(data?.ritualWon===true);errands=jobs.map((_,i)=>[1,2,3].includes(data?.errands?.[i])?data.errands[i]:0);sim.reset();journey.reset();purse.restore();inventoryTab='objects';notice='';discoveredCheckpoints.clear();selected='heal';apples=crystals=0;rank=1;sword=false;checkpoint={...level.spawn};corruption=0;elapsed=0;complete=false;station=null;cinema=null;sequence=null;bits.length=0;
 marsh.restore(data?.marsh,fight.b.won);machine=null;machineInfo={};pickups.forEach(p=>p.taken=false);
 if(data?.version===1){
  apples=Math.max(0,Math.trunc(data.apples)||0);crystals=Math.max(0,Math.trunc(data.crystals)||0);rank=Math.max(1,Math.trunc(data.rank)||1);sword=!!data.sword;complete=fight.b.won&&marsh.complete&&!!data.complete&&data.finishAt===level.exit.x;elapsed=data.elapsed||0;
  journey.restore(data.journey);for(const id of data.seenCheckpoints??[])discoveredCheckpoints.add(id);
  if(sword){sim.equipSword();corruption=1;}
  purse.restore(data.economy,data.ritualWon?(secondWon?6:5):4);sim.setLoadout(rank,purse.stats());
  pickups.forEach(p=>p.taken=data.items?.includes(p.id)??false);
  for(const e of sim.enemies)if(data.defeated?.includes(e.sourceId)){e.hp=0;e.state='dead';if(!data.economy)purse.credit(legacyNuxReward(e.type));}
  if(!relocate(loadDestination(data,level,marsh,fight.arena),true))relocate(fight.b.won?level.archiveAltar:level.spawn,true);
 }
 camX=sim.player.x+2;camY=sim.player.y+2;show('play');storeSave();
}
function retry(){const dest=fight.locked?{x:fight.arena.entry,y:fight.arena.floor}:checkpoint??level.spawn;
 fight.reset(fight.b.won);if(!relocate(dest,true)){reset(readSave(slot));return;}show('play');}
function speak(lines,onDone=()=>show('play')){clearInput();sequence={lines,i:0,onDone};nextLine();}
function nextLine(){
 mode='dialogue';hud.hidden=true;syncControls();
 if(sequence.i===sequence.lines.length){const f=sequence.onDone;sequence=null;f();return;}
 const line=sequence.lines[sequence.i++], parts=line.split(' — '),who=parts.length>1?parts.shift():'EL ECO';
 sequence.speaker=who;
 panel('<h2>'+safeText(who)+'</h2>','<p>'+safeText(parts.join(' — '))+'</p>',action('next','Continuar ↓','primary'),'DIÁLOGO · '+sequence.i+' / '+sequence.lines.length);
 overlay.className='dialogue';if(who==='NARA')addNaraPortrait();$('#next').focus({preventScroll:true});
}
function useItem(id){
 if(id==='heal'&&apples&&sim.player.hp<sim.player.maxHp){apples--;sim.heal(2);play('heal');updateHUD();storeSave();show('inventory');}
 if(id==='crystal'&&mode==='inventory'&&journey.unlocked.has(level.forge.stationId)&&!fight.locked)openTravel({id:'recall'},'inventory',level.forge.stationId);
}
overlay.addEventListener('click',e=>{
 const btn=e.target.closest('button'),id=btn?.id;
 if(mode==='options'&&parallaxModes.includes(btn?.dataset.depth)){chooseDepth(btn.dataset.depth);return;}
 if(mode==='machine'&&machine&&btn?.dataset.mech){
  const cmd=btn.dataset.mech;
  if(cmd==='hint')machineInfo.hint=true;
  else if(cmd==='askreset')machineInfo.reset=true;
  else if(cmd==='cancel')machineInfo.reset=false;
  else{
   if(cmd==='reset'&&!machineInfo.reset)return;
   const result=marsh.operate(machine.id,cmd,Number(btn.dataset.arg));
   machineInfo.feedback=result.message||'';machineInfo.reset=false;
   if(result.ok){play(result.opened?'awakening':'echo',result.opened?.4:.18);storeSave();}
  }
  show('machine');
  const target=[...overlay.querySelectorAll('button:not(:disabled)')].find(b=>b.dataset.mech===cmd&&b.dataset.arg===btn.dataset.arg)??overlay.querySelector('.machine-ops button:not(:disabled)')??$('#resume');
  target?.focus({preventScroll:true});return;
 }
 if(id==='crossdoor'&&mode==='door'&&pendingDoor){if(relocate(pendingDoor.to)){storeSave();play('echo',.23);}pendingDoor=null;show('play');return;}
 if(btn?.dataset.inv){setTab(btn.dataset.inv);return;}
 if(btn?.matches('[data-item],[data-charm],[data-ware],[data-quest],[data-faro],[data-fnode]')){pick(btn);return;}
 if(btn?.hasAttribute('data-done')){toggleDone();return;}
 if(btn&&('qpage' in btn.dataset||'fpage' in btn.dataset||'apage' in btn.dataset)){turnPage(Number(btn.dataset.qpage??btn.dataset.fpage??btn.dataset.apage));return;}
 if(btn?.hasAttribute('data-atlas-index')){atlasPage=Number(btn.dataset.atlasIndex);renderAtlas();return;}
 if(mode==='slots'&&btn?.dataset.pickProfile){profileChoice=Number(btn.dataset.pickProfile);renderProfiles();return;}
 if(mode==='slots'&&btn?.dataset.profile){slot=Number(btn.dataset.profile);reset(readSave(slot));return;}
 if(id==='temper'&&mode==='forge'&&!fight.locked){
  const upgrade=temperBlade(smithState(),sim.player,level.forge);if(!upgrade)return;
  rank=upgrade.rank;crystals=upgrade.crystals;sim.setLoadout(rank,purse.stats());play('awakening',.25);
  forgeMessage='Espada templada a rango '+grade(rank)+'.';storeSave();updateHUD();renderForge();return;
 }
 if(id==='closebook'||id==='cancelmap'||id==='canceltravel'){backMenu();return;}
 if(id==='confirmtravel'){confirmFaro();return;}
 if(id==='openquests'){openBook('quests','map');return;}
 if(id==='openbook'){openBook(inventoryTab,'pause');return;}
 if(id==='recall'&&mode==='map'&&!fight.locked&&journey.unlocked.size){openTravel({id:'recall'},'map');return;}
 if(id==='jobs'&&mode==='shop'){const lines=[];jobs.forEach((j,i)=>{if(errands[i]===0){errands[i]=1;lines.push('NARA — '+(i?'En las Cisternas queda agua limpia. Busca una muestra junto al faro y tráemela.':'Mi lámpara se apaga. En el faro del primer bosque quedan brasas. ¿Me traes una?'));}else if(errands[i]===2){errands[i]=3;purse.credit(j.reward);lines.push('NARA — '+j.title+': justo lo que necesitaba. Toma '+j.reward+' Nux.');}});storeSave();speak(lines.length?lines:['NARA — Tus encargos están en Misiones, junto a tu inventario, viajero.'],()=>show('shop'));return;}
 if(id==='duel'){slot=0;reset(null);sword=true;sim.equipSword();corruption=1;apples=3;relocate({x:fight.arena.entry,y:fight.arena.floor},true);sim.enemies.forEach(e=>{e.hp=0;});show('play');msg('Ensayo sin guardado · W/↑ + J o joystick arriba + ataque');return;}
 if(id==='start'||id==='continue'){
  profileSaves=profileIds.map(readSave);const match=profileSaves.findIndex(d=>id==='start'?!d:!!d);
  profileChoice=match<0?1:match+1;show('slots');return;
 }
 if(id==='retry')retry();if(id==='help')show('help');if(id==='credits')show('credits');
 if(id==='back')show(mode==='options'?optionReturn:'title');
 if(id==='resume')show('play');if(id==='next')nextLine();if(id==='openmap')openMap('pause');
 if(id==='options'){optionReturn=mode;show('options');}
 if(id==='totitle'){storeSave();show('title');}
 if(id==='barter')show('barter');if(id==='travelback')show('travel');
 if(id==='buyapple'&&mode==='barter'&&purse.spend(applePrice)){apples++;play('fragment');storeSave();show('barter');}
 if(id==='buycharm'&&mode==='shop'&&purse.buy(wareChoice)){notice='Añadido a tu inventario. Equípalo en Amuletos.';charmChoice=wareChoice;play('fragment');storeSave();show('shop');}
 if(id==='equipcharm'&&mode==='inventory'){
   const result=purse.equip(charmChoice);
   notice=result==='full'?'Te faltan espacios. Desequipa otro amuleto.':result==='equipped'?'Amuleto equipado.':result==='removed'?'Amuleto desequipado.':'Nara vende este amuleto.';
   sim.setLoadout(rank,purse.stats());storeSave();show('inventory');
 }
 if(id==='use')useItem(selected);
});
overlay.addEventListener('input',e=>{
 if(e.target.id==='volume'){volume=Number(e.target.value)/100;$('#vol-value').value=e.target.value+' %';saveOptions();}
 if(e.target.id==='motion'){lowMotion=e.target.checked;reflectDepth();saveOptions();}
});
overlay.addEventListener('contextmenu',e=>{if(mode==='inventory'&&e.target.closest('[data-item="heal"]')){e.preventDefault();if(apples&&sim.player.hp<sim.player.maxHp){selected='heal';useItem('heal');}}});
$('#pause').onclick=()=>{if(mode==='play')show('pause');};$('#inv').onclick=()=>{if(mode==='play')openBook();};
$('#map').onclick=()=>{if(mode==='play')openMap();};
addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey||e.isComposing)return;
 if(mode!=='play'){menuKey(e);return;}
 if(e.code==='KeyL'){e.preventDefault();if(!e.repeat)openBook('quests');return;}
 const k=keys[e.code];if(!k)return;
 e.preventDefault();if(e.repeat)return;
 if(k==='pause'){show('pause');return;}
 if(k==='map'){openMap();return;}
 if(k==='inventory'){openBook();return;}
 held[k]=true;pressed.add(k);
});
addEventListener('keyup',e=>{if(keys[e.code])held[keys[e.code]]=false;});
addEventListener('blur',()=>{clearInput();if(mode==='play')show('pause');});
addEventListener('orientationchange',clearInput);
touchMedia.addEventListener('change',e=>{
 touch=e.matches;stage.classList.toggle('touch-mode',touch);clearInput();syncControls();
});
function moveStick(e){
 const r=joystick.getBoundingClientRect(), radius=Math.min(r.width,r.height)*.30;
 const dx=(e.clientX-r.left-r.width/2)/radius,dy=(e.clientY-r.top-r.height/2)/radius;
 const length=Math.max(1,Math.hypot(dx,dy));
 joystick.style.setProperty('--stick-x',dx/length*radius+'px');
 joystick.style.setProperty('--stick-y',dy/length*radius+'px');
 stickUp=dy<-.45;const x=THREE.MathUtils.clamp(dx,-1,1),amount=Math.abs(x);
 stickAxis=amount<.20?0:Math.sign(x)*(.32+.68*(amount-.20)/.80);
}
joystick.addEventListener('pointerdown',e=>{
 if(mode!=='play'||stickPointer!==null||e.button!==0)return;
 e.preventDefault();stickPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);joystick.classList.add('held');moveStick(e);
});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)moveStick(e);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,e=>{if(e.pointerId===stickPointer)resetStick();});
touchControls.addEventListener('pointerdown',e=>{
 const b=e.target.closest('[data-act]');if(!b||mode!=='play'||e.button!==0)return;
 e.preventDefault();b.setPointerCapture(e.pointerId);touchMap.set(e.pointerId,b.dataset.act);pressed.add(b.dataset.act);b.classList.add('held');
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])touchControls.addEventListener(event,e=>{
 const act=touchMap.get(e.pointerId);if(!act)return;
 touchMap.delete(e.pointerId);if(![...touchMap.values()].includes(act))e.target.classList?.remove('held');
});
function nearby(){
 if(fight.locked)return null;
 const p=sim.player, all=[];
 const item=(type,s,label,data)=>{const dx=Math.abs(p.x-s.x),dy=Math.abs(p.y-s.y);if(dx<1.48&&dy<.9)all.push({type,s,label,data,d:dx+dy*2});};
 if(!sword)item('sword',level.sword,'Tomar la espada');
 else item('forge',level.forge,'Usar la Forja de la Raíz',level.forge);
 for(const m of level.merchants)if(sword)item('merchant',m,'Hablar con '+m.name,m);
 for(const d of level.portals)if(sword)item('portal',d,d.name,d);
 for(const r of level.relics)if(sword&&!journey.relics.has(r.id))item('relic',r,'Recoger '+r.name,r);
 for(const s of level.stations)item('station',s,journey.unlocked.has(s.id)?'Usar faro · '+s.name:'Activar faro',s);
 if(sword){
  for(const e of level.echoes)item('echo',e,'Hablar con el Eco',e.lines);
  if(marsh.admitted&&p.x>=level.plague.start-1){
   for(const d of level.plague.devices)item('machine',d,deviceLabel(d),d);
   for(const s of level.plague.shortcuts)item('lever',s,marsh.shortcuts.has(s.id)?'Atajo abierto · '+s.name:'Bajar la palanca · '+s.name,s);
   for(const g of marshShutters)if(!sim.isGateOpen(g.gateId)&&p.y+.3>=g.y&&p.y<g.y+g.h){
    const face={x:g.x+g.w/2,y:p.y};
    if(g.plaque)item('machine',face,'Examinar el sello · '+marshNames[g.plaque.puzzle].name,g.plaque);
    else if(p.x<g.x)item('shutGrate',face,'Examinar el rastrillo');
   }
  }
  for(const p of level.puzzles){
   item('clue',p.clue,'Leer inscripción',p);
   for(const s of p.switches)item('switch',s,(journey.cleared.has(p.id)?'Runa encendida · ':'Activar · ')+s.name,p);
  }
  if(!complete)item('exit',level.exit,'Devolver la espada');
 }
 return all.sort((a,b)=>a.d-b.d)[0];
}
function interact(){
 const a=nearby();if(!a)return;
 if(a.type==='sword'){
  cinema={t:0,facing:sim.player.x>level.sword.x?-1:1,x:sim.player.x};play('awakening',.54);show('cinema');return;
 }
 if(a.type==='forge'){forgeMessage='';show('forge');return;}
 if(a.type==='merchant'){notice='';play('echo',.23);speak(['NARA — Pasa, viajero. Tengo amuletos y un par de encargos para el camino.'],()=>show('shop'));return;}
 if(a.type==='portal'){
   const d=a.data;
   if(d.requires?.some(id=>!journey.relics.has(id))){msg(d.requires.length>1?'El Archivo requiere los dos sellos del cruce.':'Este atajo requiere el sello de la región.');return;}
   const target=level.zones.findLast(z=>d.to.x>=z.x).name;pendingDoor=d;show("door");panel('<h2>'+safeText(target)+'</h2>','<p>Este paso lleva a '+safeText(target)+'. Puedes volver usando el paso de regreso o un faro activo.</p>',action('crossdoor','Viajar a '+target)+action('resume','Quedarme aquí'),'PASO ENTRE ZONAS');
   return;
 }
 if(a.type==='relic'){journey.relics.add(a.data.id);play('fragment');burst(a.data.x,a.data.y+.7,0xf7d39e,24);msg(a.data.name+' · '+journey.relics.size+' / '+level.relics.length);storeSave();return;}
 if(a.type==='station'){
  station=a.data;jobs.forEach((j,i)=>{if(j.dest===station.id&&errands[i]===1){errands[i]=2;storeSave();msg('Encargo: hallazgo recuperado. Regresa con Nara.');}});
  if(!journey.unlocked.has(station.id)){
   journey.unlocked.add(station.id);sim.heal(sim.player.maxHp);play('echo');
   checkpoint={x:station.x,y:station.y};sim.setCheckpoint(station.x,station.y);storeSave();msg('Faro despertado · '+station.name);
  }
  openTravel(station,'play');return;
 }
 if(a.type==='echo'){play('echo');speak(a.data);return;}
 if(a.type==='shutGrate'){msg('La palanca está al otro lado. Busca el paso alto para abrir el regreso.');return;}
 if(a.type==='machine'){
  machine=a.data;machineInfo={};
  if(machine.role==='clue'){marsh.inscriptions.add(machine.puzzle);storeSave();}
  play('echo',.16);show('machine');
  (overlay.querySelector('.machine-ops button:not(:disabled)')??$('#resume'))?.focus({preventScroll:true});return;
 }
 if(a.type==='lever'){
  if(marsh.shortcut(a.s.id)){play('awakening',.26);burst(a.s.x,a.s.y+.8,0xc9dfa0,13);storeSave();}
  msg('Atajo abierto · '+a.s.name);return;
 }
 if(a.type==='clue'){journey.clues.add(a.data.id);storeSave();play('echo');speak(a.data.clue.lines);return;}
 if(a.type==='switch'){
  const puzzle=a.data,result=journey.activate(puzzle,a.s.id);
  if(result==='done')msg('El mecanismo ya está abierto');
  if(result==='wrong'){play('hurt',.17);msg('Las runas se apagaron. Revisa la inscripción.');}
  if(result==='next'){play('fragment');burst(a.s.x,a.s.y+.7,0xeec1ff);msg('Runa encendida · '+journey.progress.get(puzzle.id)+' / '+puzzle.order.length);}
  if(result==='open'){play('awakening',.35);burst(a.s.x,a.s.y+.7,0xffd5a0,25);msg('Se abrió · '+puzzle.name);storeSave();}
  return;
 }
 if(a.type==='exit'){
  if(journey.cleared.size<level.puzzles.length){msg('Aún queda un sello por abrir');return;}
  if(journey.relics.size<level.relics.length||!fight.b.won){msg('Reúne los sellos y derrota al Astrónomo Hueco.');return;}
  if(!marsh.complete){msg('Queda una compuerta por abrir en el Marjal. Consulta el mapa.');return;}
  play('echo');speak(level.ending,()=>{complete=true;storeSave();show('complete');});
 }
}
function cinematicUpdate(dt){
 cinema.t+=dt;
 const time=cinema.t, panel=$('#cinematic');
 panel.dataset.phase=time<.75?'approach':time<1.75?'awaken':'dark';
 const label=time<.75?'Santuario del Eco':time<1.75?'La Espada del Abismo':'El bosque enmudece';
 if($('#cine-caption').textContent!==label)$('#cine-caption').textContent=label;
 if(time>=.95&&!cinema.burst){cinema.burst=true;flash=.65;fx=.20;burst(level.sword.x,level.sword.y+1.5,0xedbcff,44);}
 if(time>=2.85){
  sword=true;sim.equipSword();checkpoint={...level.checkpoints[0]};sim.setCheckpoint(checkpoint.x,checkpoint.y);corruption=1;cinema=null;storeSave();
  $('#cinematic').hidden=true;play('echo');speak(level.dialogue);
 }
}
function resize(){
 const w=innerWidth,h=$('#stage').clientHeight,ar=w/Math.max(1,h);
 vh=Math.max(9.4,12/ar);vw=ar*vh;
 camera.left=-vw/2;camera.right=vw/2;camera.top=vh/2;camera.bottom=-vh/2;camera.updateProjectionMatrix();renderer.setSize(w,h);
 if(mode==='inventory'){questPage=null;renderBook();}else if(mode==='travel'){faroPage=null;renderFaros();}else if(mode==='map')renderAtlas();
}
addEventListener('resize',resize);resize();show('title');
const step=1/120;
function events(){
 const p=sim.player;
 for(const e of sim.events){
  const x=e.x??p.x,y=e.y??(p.y+.65);
  if(e.type==='jump')play('jump',.15);
  if(e.type==='attack')play('attack',.22);
  if(e.type==='hit'||e.type==='defeat'){burst(x,y,0xe8a4ff,e.type==='defeat'?28:12);play('hit');fx=.12;if(e.type==='defeat'){const crystal=dropsCrystal(sim.enemies[e.id]?.sourceId);if(crystal)crystals++;const earned=purse.reward(e.enemyType);burst(x,y,0xffcb88,10);if(fight.b.won&&!secondWon&&sim.enemies.some(v=>v.sourceId==='cantora'&&!v.hp)){secondWon=true;purse.unlock(6);msg('Cantora vencida · Sexta ranura abierta');}else msg('+'+earned+' Nux'+(crystal?' · +1 cristal de forja':''));storeSave();}}
  if(e.type==='enemyShot')play('attack',.17);
  if(e.type==='hurt'){burst(x,y,0xff8f6e);play('hurt');fx=.24;flash=.25;}
  if(e.type==='block'){burst(x,y,0xffd99d,8);play('hit',.18);msg('Esquiva y golpea cuando baje la guardia');}
  if(e.type==='land')burst(x,p.y+.05,caveLight(level.lighting,p.x).cyan>.5?0xb7e9e3:0xbda483,Math.min(12,5+Math.floor((e.speed??0)*.4)));
  if(e.type==='dash')burst(x,y,0xbea3ff,8);
  if(e.type==='death')show('dead');
 }
}
const bossHUD=$('#mage-hud');
const phaseLabels={intro:'Las puertas se han sellado',idle:'Observa el báculo',gather:'Invocación · busca un hueco',rain:'Lluvia de magia oscura',raise:'El báculo va a caer',sweep:'Impacto · salta o esquiva',expose:'Runa abierta · salta y ataca hacia arriba',stun:'Aturdido · absorbe el eco',recover:'Magia imbuida en la espada',final:'Último sello · golpea con la espada'};
let bossLabel='';
function updateBossHUD(p,framed){
 const isMage=framed&&mode==='play',isSinger=!isMage&&slot&&fight.b.won&&Math.abs(p.x-roadX(402))<9&&mode==='play'&&!secondWon;
 stage.classList.toggle('in-ritual',isMage);bossHUD.hidden=!isMage&&!isSinger;
 const k=isMage?fight.b.phase+':'+fight.b.charges:isSinger?'singer:'+sim.enemies.find(e=>e.sourceId==='cantora')?.hp:'';
 if(k===bossLabel)return;bossLabel=k;
 if(isMage){bossHUD.innerHTML='<small>Observatorio del Eclipse</small><strong>Astrónomo Hueco</strong><div class="seal-count" aria-label="'+fight.b.charges+' de 3 cargas">'+[0,1,2].map(i=>'<i class="'+(i<fight.b.charges?'lit':'')+'"></i>').join('')+'</div><span>'+phaseLabels[fight.b.phase]+'</span>';}
 else if(isSinger)bossHUD.textContent='Cantora del Osario · '+(sim.enemies.find(e=>e.sourceId==='cantora')?.hp||0)+' / 19';
}
function onRitual(event,at){
 const a=fight.arena;
 if(event==='seal'){
  for(const e of sim.enemies)if(e.sourceId.startsWith('archive-'))e.active=false;
  sim.shots.length=0;checkpoint={x:a.entry,y:a.floor};sim.setCheckpoint(checkpoint.x,checkpoint.y);storeSave();play('awakening',.30);toast=0;
 }else if(event==='impact'||event==='slam'){
  if(event==='slam')play('hit',.27);
  burst(at.x,at.y+.08,0xce8de9,event==='slam'?18:6);
 }else if(event==='raise'||event==='gather')play('echo',.12);
 else if(event==='stun'||event==='final'){burst(a.x,a.floor+a.core,0xffdb9f,20);play('hit',.31);}
 else if(event==='charge'){burst(sim.player.x,sim.player.y+.7,0xd2a2ff,15);play('fragment',.24);}
 else if(event==='win'){
  for(const e of sim.enemies)if(e.sourceId.startsWith('archive-'))e.active=true;
  burst(a.x,a.floor+a.core,0xffdcaf,35);play('awakening',.4);
  if(slot){marsh.admit();purse.reward('curator');purse.unlock(5);checkpoint={x:a.right+.75,y:a.floor};sim.setCheckpoint(checkpoint.x,checkpoint.y);storeSave();msg('Quinta ranura de amuleto · Marjal de la Peste abierto al este');}
  else show('duelwon');
 }
}
$('#skip').onclick=()=>{if(cinema){cinema.t=3;cinematicUpdate(0);}};
function frame(now){
 const realDt=(now-last)/1000,dt=Math.min(.1,realDt);last=now;
 if(mode==='cinema')cinematicUpdate(Math.min(.4,realDt));
 if(mode==='play'){
  elapsed+=dt;
  const input={...held};for(const k of pressed)input[k]=true;for(const k of touchMap.values())input[k]=true;
  input.moveAxis=stickAxis;input.aimUp=!!(input.aimUp||stickUp);
  if(input.interact&&!prev.interact)interact();prev.interact=input.interact;
  if(mode==='play'){
   const singer=sim.enemies.find(e=>e.sourceId==="cantora");if(singer)singer.active=!!slot&&fight.b.won&&!secondWon;acc+=dt;while(acc>=step&&mode==='play'){sim.step(step,input);pressed.clear();if(sword)fight.tick(step,sim.player,sim.damagePlayer,onRitual);events();acc-=step;}
   const p=sim.player;
   if(!sword&&p.x>roadX(44.4)){p.x=roadX(44.4);p.vx=0;}
   if(p.hp<=0&&mode==='play')show('dead');
   for(const item of pickups)if(!item.taken&&Math.abs(item.x-p.x)<.55&&Math.abs(item.y-(p.y+.6))<.82){item.taken=true;if(item.type==='apple')apples++;else{crystals++;msg('+1 cristal de forja');}storeSave();play('fragment',.18);burst(item.x,item.y,item.type==='apple'?0xff926f:0xde9dff,9);}
   if((sword)&&p.grounded)for(const [id,c] of level.checkpoints.entries()){
    if(!discoveredCheckpoints.has(id)&&Math.abs(p.x-c.x)<.7&&Math.abs(p.y-c.y)<.15){discoveredCheckpoints.add(id);checkpoint={...c};sim.setCheckpoint(c.x,c.y);storeSave();}
   }
   const near=nearby();
   const approaching=sword&&!fight.b.won&&p.x>=fight.arena.left-8&&p.x<fight.arena.trigger;
   const tip=fight.locked?'':approaching?'Observatorio del Eclipse · Al cruzar el umbral, la arena se cerrará hasta vencer al mago.':near?(touch?'':'E · ')+near.label:!sword&&p.x>roadX(44.3)?'Regresa al altar. La espada te llama.':(!touch&&sword&&p.x>=roadX(42)&&p.x<roadX(49)?'J · Atacar  /  K · Esquivar  /  M · Mapa':p.x<8?(touch?'Arrastra el joystick. Pulsa ↑ para saltar.':'A/D o ← → para moverte · Espacio para saltar'):level.tutorials.findLast(x=>p.x>=x.x)?.text||'');
   const tipNode=touch?touchHint.firstElementChild:hint;
   if(tipNode.textContent!==tip)tipNode.textContent=tip;
   touchHint.classList.toggle('near',!!near);
   interactButton.classList.toggle('available',!!near);
   const interactLabel=near?'Interactuar: '+near.label:'Interactuar';
   if(interactButton.getAttribute('aria-label')!==interactLabel)interactButton.setAttribute('aria-label',interactLabel);
   updateHUD();
  }
 }else acc=0;
 const p=sim.player,t=now/1000;
 const worldMode=!['title','slots','help','credits','duelwon'].includes(mode)&&(mode!=='options'||optionReturn!=='title');
 const framed=fight.locked&&worldMode;
 const framing=framed?arenaView(fight.arena,vw/vh,stage.clientHeight<480):null;
 if(framed){camX=framing.x;camY=framing.y;}
 else if(mode==='play'||mode==='dialogue'){const follow=1-Math.exp(-dt*6.8);camX+=(THREE.MathUtils.clamp(p.x+1.6*(p.facing||1),vw*.35,level.width-vw*.36)-camX)*follow;camY+=((p.x>=roadX(284)?p.y+2:Math.max(2.25,p.y+2))-camY)*follow;}
 if(['title','slots','help','credits'].includes(mode)){camX=level.spawn.x+4.8+(quiet()?0:Math.sin(t*.18)*1.4);camY=2.65;}
 if(cinema){const q=1-Math.exp(-dt*3);camX+=(level.sword.x-camX)*q;camY+=(level.sword.y+1.7-camY)*q;}
 corruption+=((cinema?THREE.MathUtils.smoothstep(cinema.t,.85,2.4):Number(sword))-corruption)*(1-Math.exp(-dt*1.35));
 fx=Math.max(0,fx-dt);flash=Math.max(0,flash-dt*2.2);toast=Math.max(0,toast-dt);
 $('#flash').style.opacity=quiet()?0:flash*.35;$('#toast').style.opacity=Math.min(1,toast*2);
 camera.position.set(camX+((quiet()||framed)?0:Math.sin(t*90)*fx*.38),camY+((quiet()||framed)?0:Math.cos(t*72)*fx*.3),24);
 const zoom=framed?vh/framing.height:cinema&&!quiet()?1+Math.min(.30,cinema.t*.23):1;
 if(camera.zoom!==zoom){camera.zoom=zoom;camera.updateProjectionMatrix();}
 const focus=scenicFocus(camX,camY,p,worldMode&&!framed);
 const travel=pan.sample(focus.x,focus.y,parallaxStrength(parallaxMode,quiet()),panCut||framed!==wasFramed);
 panCut=false;wasFramed=framed;
 const sceneRegion=caveLight(level.lighting,camX),region=caveLight(level.lighting,p.x);
 const scenicWidth=vw/zoom,scenicHeight=vh/zoom;
 const arenaDistance=Math.max(fight.arena.entry-camX,camX-fight.arena.right,0);
 const arenaCover=1-THREE.MathUtils.smoothstep(arenaDistance,0,5);
 world.update(t,camX,camY,corruption,scenicWidth,scenicHeight,travel);
 caves.update(t,region,camX,camY,scenicWidth,scenicHeight,p,quiet(),travel,sceneRegion);
 marshArt.update(t,camX,camY,scenicWidth,scenicHeight,quiet(),travel);
 depthBands.update(camX,camY,scenicWidth,scenicHeight,travel,sceneRegion,marshBlend(camX,level.plague.start),corruption,arenaCover);
 marshMarkers.update(camera.position.x,vw/zoom,marsh);
 veil.hidden=region.darkness<.006||mode==='title'||mode==='slots'||mode==='help'||mode==='credits';
 if(!veil.hidden){
  const size=100/(vh/zoom);
  veil.style.setProperty('--light-x',(50+(p.x-camera.position.x)/(vw/zoom)*100).toFixed(2)+'%');
  veil.style.setProperty('--light-y',(50-(p.y+.69-camera.position.y)/(vh/zoom)*100).toFixed(2)+'%');
  veil.style.setProperty('--light-radius',(size*(region.cyan>.4?3.65:2.95)).toFixed(2)+'dvh');
  veil.style.opacity=(region.darkness*(1-.40*region.cyan*(1-region.cave))).toFixed(3);
 }
 p.imbue=fight.b.charges;
 const talking=mode==='shop'||(mode==='dialogue'&&sequence?.speaker==='NARA');
 forgeArt.update(t,camX,vw/zoom,quiet());
 const naraCel=landmarks.update(t,journey,sword,cinema,sim,talking);
 if(talking)drawNaraPortrait(naraCel);
 drawMage(elapsed,p.x,worldMode,quiet());
 updateBossHUD(p,framed);
 actors.update(elapsed,cinema?{pose:cinema.t<.65?'kneel':cinema.t<1.7?'reach':'raise',facing:cinema.facing,x:THREE.MathUtils.lerp(cinema.x,level.sword.x-cinema.facing*.58,Math.min(1,cinema.t*2.6))}:null,quiet());
 for(const [i,m] of shotMeshes.entries()){
   const q=sim.shots[i];if(!q){m.visible=false;continue;}
   const map=beadMaps[q.age<.105?0:1];m.material.map=map;m.visible=!!map.image?.width;
   m.position.set(q.x,q.y,2.8);m.scale.x=Math.sign(q.vx)||1;
 }
 for(const item of pickups){item.mesh.visible=!item.taken;item.mesh.position.set(item.x,item.y+Math.sin(t*3+item.i)*.09,1.5);item.mesh.rotation.y=t+item.i;}

 fxUpdate(dt);renderer.render(scene,camera);requestAnimationFrame(frame);
}
if(original&&profileIds.includes(sid)){slot=sid;reset(original);history.replaceState(null,'',location.pathname);if(query.has('ruta'))msg('De vuelta en el camino principal · '+level.zones.findLast(z=>sim.player.x>=z.x).name);}
requestAnimationFrame(frame);
