import {safeText as esc} from './interface.js';

// An atlas, not a horizontal scale drawing. The glass tower and the ossuary
// are separate branches from the Crossing, rather than consecutive stops.
const points={
 forest:[49,187],shrine:[109,142],root:[155,189],water:[206,235],abyss:[256,192],
 cave:[271,257],mist:[329,218],crossing:[313,133],spire:[252,60],ossuary:[388,238],
 archive:[399,146],'peste-ribera':[422,95],'peste-salina':[466,61],
 'peste-relevo':[501,108],'peste-vivero':[547,57],
};
const roads=[
 ['forest','shrine',[88,196,74,145]],['shrine','root',[151,127,118,206]],
 ['root','water',[200,188,169,234]],['water','abyss',[239,243,232,192]],
 ['abyss','cave',[270,213,246,254]],['cave','mist',[310,272,296,225]],
 ['mist','crossing',[358,190,364,151]],['crossing','spire',[274,117,286,75]],
 ['crossing','ossuary',[398,159,349,210]],['crossing','archive',[353,110,361,154]],
 ['archive','peste-ribera',[431,153,449,111]],['peste-ribera','peste-salina',[410,71,463,90]],
 ['peste-salina','peste-relevo',[476,44,480,116]],['peste-relevo','peste-vivero',[536,120,521,72]],
];
const finite=n=>Number.isFinite(n),clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const known=(set,id)=>set instanceof Set?set.has(id):Array.isArray(set)&&set.includes(id);
const lamp=(x,y)=>`<g transform="translate(${x} ${y})" aria-hidden="true" class="far-lamp"><path d="M0 0l-4-5h-3v-10l3-3 4-6 3 6 4 3v10H4Z"/><path class="far-flame" d="M-2-12l2-4 2 4-2 3Z"/></g>`;
const sigil='<svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2 7 7 5 9v6h3l2 3 2-3h3V9l-2-2Z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="m10 7 2 4-2 2-2-2Z" fill="currentColor"/></svg>';
const chartBackdrop=`<defs>
 <radialGradient id="far-ink" cx=".54" cy=".52" r=".72"><stop stop-color="#32253c" stop-opacity=".62"/><stop offset=".72" stop-color="#15111c" stop-opacity=".30"/><stop offset="1" stop-color="#100e17" stop-opacity=".08"/></radialGradient>
 <pattern id="far-paper" width="15" height="15" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".65" fill="#dcb6c9" opacity=".24"/></pattern>
 <g id="far-peak" fill="none" stroke="currentColor" stroke-linejoin="round"><path d="m0 15 11-12 5 7 6-8 9 13M8 12l3-6 3 7m5-2 3-6 4 8"/><path opacity=".6" d="m4 17 7-3 5 2 7-3 8 3"/></g>
 <g id="far-pine" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m7 0-3 7 3-1-5 7 5-2-6 7 6-2v5m0-21 3 7-3-1 5 7-5-2 6 7-6-2"/></g>
 <g id="far-reed" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M8 20Q8 9 2 6m7 14q0-11 3-15m-2 14q5-8 10-9M1 21q9-3 17-1"/><path stroke-width="2" d="m11 8 2-7M2 7 .5 4m17 8 4-3"/></g>
 </defs>
 <rect width="596" height="304" fill="url(#far-ink)"/><rect x="9" y="8" width="578" height="288" fill="url(#far-paper)"/>
 <g class="far-contours" fill="none" stroke-width=".85">
 <path d="M0 96c59 22 55-22 95-23 42-2 45 25 80 5 31-18 48-40 81-48m-256 70c58 24 63-23 97-21 36 2 48 25 82 3 34-20 47-39 82-46m-261 69c64 26 65-24 100-21 35 4 46 24 78 5"/>
 <path d="M31 292c50-34 37-60 76-66 53-8 48 34 87 43 48 11 52-8 83 5s34 18 56 11m-309 9c55-34 52-61 85-62 45-2 41 32 84 43 42 11 61-8 83 4"/><path d="M331 35c12 34 33 15 56 34 22 19 .5 28 17 49m-69-89c14 35 36 17 59 36 23 19 1 30 18 49"/>
 <path d="M453 289c-23-33 17-46 10-71-11-38-45-33-45-50m43 119c-22-35 15-45 9-70-10-36-45-31-44-50m48 120c-21-37 14-43 3-74"/><path d="M595 159c-23 5-31 36-61 31-21-4-17-25-35-28m96 4c-23 5-32 37-61 31-23-4-17-24-36-27"/>
 </g>
 <g class="far-geology"><use href="#far-pine" x="69" y="100"/><use href="#far-pine" x="82" y="95"/><use href="#far-pine" x="93" y="101"/><use href="#far-pine" x="88" y="109"/><use href="#far-peak" x="177" y="111"/><use href="#far-peak" x="198" y="119"/><use href="#far-reed" x="436" y="197"/><use href="#far-reed" x="451" y="200"/><use href="#far-reed" x="465" y="197"/></g>
 <g transform="translate(49 48)" class="far-rose" aria-hidden="true"><circle r="14"/><path d="M0-21v5m0 32v5m-21-21h5m32 0h5"/><path class="far-rose-petal" d="M0-16 3-3 12 0 3 2 0 15-2 3-12 0l9-3Z"/><circle r="2"/><text y="-27">N</text></g>
 <g class="far-meridian" fill="none"><path d="M10 28V12h20m536 0h20v16M10 276v16h20m536 0h20v-16"/></g>`;

function geometry(stations){
 const at=new Map(),edges=[];
 for(const [i,s] of stations.entries())at.set(s.id,points[s.id]??[40+510*i/Math.max(1,stations.length-1),canonicalY(i)]);
 for(const [a,b,c] of roads)if(at.has(a)&&at.has(b))edges.push({a,b,c,start:at.get(a),end:at.get(b)});
 // A newly authored beacon still gets a place until the atlas is redrawn.
 for(let i=1;i<stations.length;i++){
  const a=stations[i-1].id,b=stations[i].id;if(points[a]&&points[b])continue;
  const [x,y]=at.get(a),[u,v]=at.get(b);edges.push({a,b,c:[(x+u)/2,y,(x+u)/2,v],start:[x,y],end:[u,v]});
 }
 return {at,edges};
}
function canonicalY(i){return [161,113,195,128][i%4];}
const pathD=e=>'M'+e.start.join(' ')+' C'+e.c.join(' ')+' '+e.end.join(' ');
function onCurve(e,t){const u=1-t;return [0,1].map(i=>u*u*u*e.start[i]+3*u*u*t*e.c[i]+3*u*t*t*e.c[i+2]+t*t*t*e.end[i]);}

function positionOnMap(level,station,player,at,edges){
 const tile=level.stations.find(s=>s.id===station?.id);
 if(tile)return {point:at.get(tile.id),id:tile.id};
 if(!finite(player?.x)||!level.stations.length)return {point:null,id:null};
 const reached=level.stations.find(s=>Math.abs(s.x-player.x)<1.48&&(!finite(player.y)||Math.abs(s.y-player.y)<.9));
 if(reached)return {point:at.get(reached.id),id:reached.id};
 const zoneAt=x=>level.zones?.findLast(z=>x>=z.x);
 const here=zoneAt(player.x);
 // A doorway, not an intervening stretch of road, links these distant rooms.
 if(here?.network&&!here.plague){
  const s=level.stations.find(x=>zoneAt(x.x)===here);
  if(s&&at.has(s.id))return {point:at.get(s.id),id:null};
 }
 const before=level.stations.findLast(s=>s.x<=player.x),after=level.stations.find(s=>s.x>player.x);
 const route=before&&after&&edges.find(e=>e.a===before.id&&e.b===after.id);
 if(route)return {point:onCurve(route,clamp((player.x-before.x)/(after.x-before.x),0,1)),id:null};
 return {point:at.get((before??after)?.id)??null,id:null};
}
function chart(level,stations,active,discovered,origin,selected,at,edges){
 const lookup=new Map(stations.map((s,i)=>[s.id,{...s,number:i+1}]));
 const shownName=s=>discovered(s)?s.name:'Faro sin descubrir';
 const routes=edges.map(e=>{
  const hot=active(lookup.get(e.a))&&active(lookup.get(e.b)),d=pathD(e);
  return `<g class="far-route ${hot?'awake':'asleep'}"><path class="route-rim" d="${d}"/><path class="route-marrow" d="${d}"/></g>`;
 }).join('');
 const nodes=stations.map(s=>{
  const [x,y]=at.get(s.id),isActive=active(s),chosen=selected===s.id,idx=lookup.get(s.id).number;
  return `<g transform="translate(${x} ${y})" class="far-node ${isActive?'awake':'asleep'} ${chosen?'chosen':''}"><title>${idx}. ${esc(shownName(s))} · ${isActive?'Activo':'Apagado'}${chosen?' · Seleccionado':''}</title>
  ${chosen?'<path class="far-cursor" d="m-17-3-3 3 3 3m34-6 3 3-3 3M0-17l4 4-4 4-4-4Z"/><circle class="far-aureole" r="12"/>':''}<circle class="far-node-ring" r="6.9"/>${isActive?'<circle r="2.9" class="far-core"/>':'<path class="far-dash" d="M-2.5 0h5"/>'}<text class="far-map-no" x="9" y="14">${String(idx).padStart(2,'0')}</text></g>`;
 }).join('');
 const [ox,oy]=origin.point??[null,null];
 const current=origin.id?lookup.get(origin.id)?.name:finite(ox)?'en el camino':null;
 const selectedStation=lookup.get(selected),label='Carta de los faros'+(current?'. Tom: '+current:'')+(selectedStation?'. Destino seleccionado: '+shownName(selectedStation):'');
 return `<figure class="far-figure"><svg class="far-art" viewBox="0 0 596 304" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(label)}">${chartBackdrop}${routes}${nodes}${finite(ox)?lamp(ox,oy-7):''}</svg><figcaption class="far-chart-key"><span><i class="far-key-tom"></i>Tom</span><span><i class="far-key-dest"></i>Selección</span><span><i class="far-key-sleep"></i>Apagado</span></figcaption></figure>`;
}

// A numeric page means intentional paging. Otherwise follow the chosen beacon,
// including across page boundaries. Opening the menu never moves the player.
export function travelView({level,journey,marsh,station,player,selected,page,size=6}){
 const stations=level.stations??[],allIds=stations.map(s=>s.id);
 const active=s=>!!s&&known(journey?.unlocked,s.id)&&(!level.plague||s.x<level.plague.start||!!marsh?.admitted);
 const discovered=s=>{
  if(active(s))return true;
  if(level.plague&&s.x>=level.plague.start){
   const district=level.plague.sectors?.findLast(d=>s.x>=d.x);
   return !!(marsh?.admitted&&district&&known(marsh.seen,district.id));
  }
  const zone=level.zones?.findLastIndex(z=>s.x>=z.x)??-1;
  return zone>=0&&known(journey?.seen,zone);
 };
 const {at,edges}=geometry(stations),origin=positionOnMap(level,station,player,at,edges);
 const nearest=stations.filter(s=>active(s)&&s.id!==origin.id).sort((a,b)=>Math.abs(a.x-(player?.x??station?.x??0))-Math.abs(b.x-(player?.x??station?.x??0)))[0];
 const fallback=nearest?.id??origin.id??stations[0]?.id??null;
 let id=allIds.includes(selected)?selected:fallback;
 const count=clamp(Number.isFinite(size)?Math.trunc(size):6,1,10),pages=Math.max(1,Math.ceil(stations.length/count));
 const n=Number.isInteger(page)?clamp(page,0,pages-1):Math.max(0,Math.floor(allIds.indexOf(id)/count));
 const choices=stations.slice(n*count,(n+1)*count),visibleIds=choices.map(s=>s.id);
 if(!visibleIds.includes(id))id=choices[0]?.id??null;
 const target=choices.find(s=>s.id===id),lit=stations.filter(active).length,canTravel=!!station&&!!target&&active(target)&&origin.id!==id;
 const names=s=>discovered(s)?s.name:'Faro sin descubrir';
 const status=s=>origin.id===s.id?'Aquí':active(s)?'Activo':'Apagado';
 const forgeHere=s=>s&&s.id===level.forge?.stationId&&discovered(s);
 const anvil='<svg class="far-smith-mark" viewBox="0 0 24 22" aria-hidden="true"><path d="M1 4h21l-2 5-4 1-2 3v2l4 3v2H6v-2l4-3v-3L8 9 3 8Z"/></svg>';
 const opts=choices.map((s,i)=>{
  const k=n*count+i+1,st=status(s),selected=id===s.id;
  return `<button type="button" class="far-stop ${active(s)?'awake':'asleep'} ${s.id===origin.id?'local':''}" data-faro="${esc(s.id)}" aria-pressed="${selected}" aria-label="${String(k).padStart(2,'0')}. ${esc(names(s))}. ${st}${forgeHere(s)?'. Forja de la Raíz':''}"><span class="far-number">${String(k).padStart(2,'0')}</span><span class="far-stop-name">${esc(names(s))}${forgeHere(s)?anvil:''}</span><span class="far-status" aria-hidden="true"><i></i>${s.id===origin.id?'Aquí':''}</span></button>`;
 }).join('');
 let note=!target?'No hay faros en esta ruta.':id===origin.id?(lit<2?'Este es tu faro. Despierta otro para viajar.':'Tom ya está junto a este faro.'):!discovered(target)?'Explora el camino para descubrir este faro.':!active(target)?'Acércate a este faro y actívalo para viajar.':'Llegada: '+target.name+'.';
 if(forgeHere(target))note=active(target)?'Forja de la Raíz · A unos pasos a la derecha de este faro.':'La forja está junto a este faro. Actívalo para poder volver.';
 const pager=`<div class="far-pager" aria-label="Páginas de destinos"><button type="button" data-fpage="-1" aria-label="Página anterior de faros"${n===0?' disabled':''}>‹</button><span>Página <b>${n+1}</b> de ${pages}</span><button type="button" data-fpage="1" aria-label="Página siguiente de faros"${n+1>=pages?' disabled':''}>›</button></div>`;
 const html=`<div class="codex-travel"><div class="far-body">${chart(level,stations,active,discovered,origin,id,at,edges)}<section class="far-destinations" aria-label="Destinos"><header class="far-list-head"><h3>Destinos</h3><span>${sigil}${lit}/${stations.length} activos</span></header><div class="far-list" role="group" aria-label="Lista de faros">${opts}</div>${pager}</section></div><div class="far-bottom"><p class="far-note" role="status">${esc(note)}</p><div class="far-actions">${station?.id==='shrine'?'<button type="button" id="barter">Trueque</button>':''}<button type="button" id="confirmtravel" class="primary"${canTravel?'':' disabled'}>Viajar</button><button type="button" id="canceltravel">Volver</button></div></div></div>`;
 return {html,selected:id,page:n,pages,allIds,visibleIds,canTravel,originId:origin.id};
}
