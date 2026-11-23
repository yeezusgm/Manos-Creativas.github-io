import {mapMarkup,safeText as esc} from './interface.js';
import {marshMap} from './peste-ui.js';
import {names as marshNames,puzzleIds} from './peste.js';

const glyphs={
  world:'<path d="M3 6l5-2 6 2 5-2v13l-5 2-6-2-5 2zM8 4v13m6-11v13"/>',
  marsh:'<path d="M2 14q3-3 6 0t6 0 6 0m-18 4q3-3 6 0t6 0 6 0M8 11q0-6 2-8l2 7m0 2q2-5 5-6"/>',
  places:'<path d="M4 17l5-12 3 6 3-4 5 10zM6 13l3-2 2 2"/>',
  notes:'<path d="M6 3h9l3 3v13H6zM15 3v4h3M9 10h6m-6 3h6m-6 3h4"/>',
  beacon:'<path d="M7 19h9m-5-4h1v4m-7-13l6-3 6 3M6 7h10l-1.3 8H7.3zm5 1v5"/>'
};
const icon=k=>'<svg class="atlas-icon" aria-hidden="true" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">'+glyphs[k]+'</svg>';
const groups={world:'Mundo',marsh:'Marjal',places:'Lugares',notes:'Notas'};
const two=n=>String(n).padStart(2,'0');
const zoneIndex=(level,x)=>Math.max(0,level.zones.findLastIndex(z=>x>=z.x));
const svgOf=html=>{const a=html.indexOf('<svg '),b=html.indexOf('</svg>',a);return a>=0&&b>=a?html.slice(a,b+6):'';};
const chapter=(kicker,title,after='')=>'<header class="atlas-chapter"><div><small>'+esc(kicker)+'</small><h3>'+esc(title)+'</h3></div>'+after+'</header>';
const tally=(n,total,name)=>'<span class="atlas-tally"><b>'+n+'</b> / '+total+' '+esc(name)+'</span>';
const badge=(text,on=false)=>'<span class="atlas-badge'+(on?' present':'')+'">'+esc(text)+'</span>';

function overview(level,journey,player,current){
  const chart=svgOf(mapMarkup(level,journey,player.x)),mid=level.plague?443:384,end=level.plague?850:740;
  // On a phone the same SVG is split into overlapping chart windows; labels
  // remain legible without a canvas to pan or a horizontal scroll area.
  const crop=(x,w,side)=>chart.replace(/viewBox="[^"]+"/,'viewBox="'+x+' 39 '+w+' 151"').replace(/aria-label="[^"]+"/,'aria-label="Mapa del '+side+'"');
  const legend='<div class="atlas-key"><span><i class="atlas-tom"></i>Tom</span><span><i class="atlas-lit"></i>Faro activo</span><span><i class="atlas-seal"></i>Compuerta</span></div>';
  return chapter('Ubicación de Tom',current,tally(journey.seen.size,level.zones.length,'zonas'))+
    '<div class="atlas-drawing world"><div class="atlas-whole">'+chart+'</div><div class="atlas-halves"><figure><figcaption>Oeste</figcaption>'+crop(0,mid+10,'oeste')+'</figure><figure><figcaption>Este</figcaption>'+crop(mid-14,end-mid+14,'este')+'</figure></div></div>'+legend+
    '<p class="atlas-counter">Sellos del cruce <b>'+journey.relics.size+' / '+level.relics.length+'</b></p>';
}
function marshPage(level,marsh,player){
  const l=level.plague,section=l.sectors.findLast(s=>player.x>=s.x&&player.x<=l.end),chart=svgOf(marshMap(l,marsh,player));
  const list=l.sectors.map((s,i)=>{const known=marsh.seen.has(s.id);return '<li class="'+(!known?'veiled':section?.id===s.id?'present':'')+'"><span>'+two(i+1)+'</span>'+esc(known?s.name:'Sin cartografiar')+'</li>';}).join('');
  return chapter('Cartografía regional','Marjal de la Peste',tally(marsh.seen.size,l.sectors.length,'barrios'))+
    (chart?'<div class="atlas-drawing marsh-map">'+chart+'</div>':'<div class="atlas-unmapped">'+icon('marsh')+'<p>La reja oriental del Observatorio está abierta. Al cruzarla aparecerá el primer barrio.</p></div>')+
    '<ul class="atlas-sectors">'+list+'</ul><div class="atlas-counter">Compuertas <b>'+marsh.solved.size+' / '+puzzleIds.length+'</b><span aria-hidden="true">◇</span> Atajos <b>'+marsh.shortcuts.size+' / '+l.shortcuts.length+'</b></div>';
}
function placesPage(level,journey,visited,from,actual){
  const entries=visited.slice(from,from+4);
  const rows=entries.map(i=>{
    const z=level.zones[i],next=level.zones[i+1]?.x??(level.width+1);
    const beacons=level.stations.filter(s=>s.x>=z.x&&s.x<next&&journey.unlocked.has(s.id));
    const note=beacons.length?(beacons.length===1?'Faro activo':beacons.length+' faros activos'):z.branch??'Zona explorada';
    return '<li'+(actual===i?' class="present"':'')+'><b class="atlas-location-index">'+two(i+1)+'</b><div><strong>'+esc(z.name)+'</strong><small>'+esc(note)+(actual===i?' · Tom está aquí':'')+'</small></div></li>';
  }).join('');
  return chapter('Índice del mundo','Lugares descubiertos',tally(visited.length,level.zones.length,'zonas'))+
    (rows?'<ul class="atlas-place-list">'+rows+'</ul>':'<div class="atlas-unmapped">'+icon('places')+'<p>Los lugares aparecerán aquí al visitarlos.</p></div>');
}
function notePage(note,n,count){
  if(!note)return chapter('Cuaderno del viajero','Inscripciones')+'<div class="atlas-unmapped">'+icon('notes')+'<p>Lee una inscripción en el camino para poder consultarla aquí.</p></div>';
  const quotes=note.lines.map(line=>'<p>'+esc(line)+'</p>').join('');
  return chapter('Inscripción · '+note.region,note.title,badge(note.done?'Resuelta':'Pendiente',note.done))+
    '<article class="atlas-note"><span aria-hidden="true">'+icon('notes')+'</span><div>'+quotes+'</div></article><p class="atlas-counter">Notas leídas <b>'+n+' / '+count+'</b></p>';
}
function collectNotes(level,journey,marsh){
  const notes=level.puzzles.filter(p=>journey.clues.has(p.id)).map(p=>({title:p.name,region:level.zones[zoneIndex(level,p.clue.x)].name,lines:p.clue.lines.map(s=>s.split(' — ').at(-1)),done:journey.cleared.has(p.id)}));
  if(marsh?.admitted)for(const id of puzzleIds)if(marsh.inscriptions.has(id)){
    const d=level.plague.devices.find(d=>d.puzzle===id&&d.role==='clue'),region=level.plague.sectors.findLast(s=>s.x<=d.x);
    notes.push({title:marshNames[id].name,region:region.name,lines:[marshNames[id].rule],done:marsh.solved.has(id)});
  }
  return notes;
}
export function atlasView({level,journey,marsh,player,page=0,locked=false}){
  const actual=zoneIndex(level,player.x),sector=marsh?.admitted&&player.x>=level.plague.start&&player.x<=level.plague.end?level.plague.sectors.findLast(s=>player.x>=s.x):null;
  const here=sector?.name??level.zones[actual].name,visited=level.zones.map((_,i)=>i).filter(i=>journey.seen.has(i));
  const notes=collectNotes(level,journey,marsh),pages=[{kind:'world',body:()=>overview(level,journey,player,here)}];
  if(marsh?.admitted)pages.push({kind:'marsh',body:()=>marshPage(level,marsh,player)});
  for(let from=0;from<Math.max(visited.length,1);from+=4)pages.push({kind:'places',body:()=>placesPage(level,journey,visited,from,actual)});
  for(let i=0;i<Math.max(notes.length,1);i++)pages.push({kind:'notes',body:()=>notePage(notes[i],i+1,notes.length)});
  const index=Number.isFinite(page)?Math.max(0,Math.min(pages.length-1,Math.trunc(page))):0,p=pages[index];
  const first=pages.reduce((m,v,i)=>{if(!m.has(v.kind))m.set(v.kind,i);return m;},new Map());
  const tabs=[...first].map(([key,i])=>'<button type="button" class="atlas-section" data-atlas-index="'+i+'" aria-pressed="'+(p.kind===key)+'">'+icon(key)+'<span>'+groups[key]+'</span></button>').join('');
  const noBeacon=!journey.unlocked.size,closed=noBeacon||locked;
  const previous='<button type="button" class="atlas-turn" aria-label="Página anterior del atlas" data-apage="-1" '+(index===0?'disabled':'')+'><span aria-hidden="true">‹</span></button>';
  const next='<button type="button" class="atlas-turn" aria-label="Página siguiente del atlas" data-apage="1" '+(index===pages.length-1?'disabled':'')+'><span aria-hidden="true">›</span></button>';
  const reason=closed?(noBeacon?'Activa un faro en el camino para viajar.':'Los faros están sellados durante el duelo.'):'';
  const html='<section class="codex-atlas" aria-label="Atlas del viajero"><div class="atlas-top"><nav aria-label="Secciones del atlas">'+tabs+'</nav><div class="atlas-turns">'+previous+'<span aria-live="polite" aria-atomic="true" aria-label="Página '+(index+1)+' de '+pages.length+'">'+two(index+1)+' / '+two(pages.length)+'</span>'+next+'</div></div><div class="atlas-folio atlas-'+p.kind+'">'+p.body()+'</div><footer class="atlas-links">'+(reason?'<small>'+reason+'</small>':'')+'<div><button type="button" id="recall" '+(closed?'disabled':'')+'>'+icon('beacon')+'Faros</button><button type="button" id="openquests">Misiones</button><button type="button" id="cancelmap">Volver</button></div></footer></section>';
  return {html,page:index,pages:pages.length};
}
