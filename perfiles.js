// The profile gallery reads a snapshot and never creates, edits or deletes a slot.
import {roadX} from './main-road.js';
import {charms} from './charms.js';

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const integer=n=>Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
const roman=['I','II','III','IV'];
const number=n=>integer(n).toLocaleString('es-MX');
const tiny=(id,d)=>'<svg class="pf-glyph pf-'+id+'" viewBox="0 0 26 26" aria-hidden="true" focusable="false">'+d+'</svg>';
const icons={
 sword:tiny('steel','<path d="m22 2-2 7-10 10-3-3L18 5z" fill="#dfd6cf"/><path d="m8 15 3 3m8-11L9 17" stroke="#6f6174" fill="none"/><path d="m4 13 1 3 5 5 3 1-1-3-6-5z" fill="#c79e79"/><path d="m7 18-4 4 1 1 4-4" stroke="#e2bd99"/><path d="m2 21 3 3" stroke="#a7816c" stroke-width="2"/>'),
 nux:tiny('nux','<path d="m6 4 10-2 7 8-1 9-8 5-10-4-3-9z" fill="#aa655a" stroke="#f2b493"/><path d="m6 8 7-3 7 5-1 8-6 3-7-4z" fill="#432839" stroke="#c28377"/><path d="m13 7 3 5-3 6-3-6zm-6 5 1 1-1 1-1-1zm12 0 1 1-1 1-1-1z" fill="#f1ba8d"/>'),
 crystal:tiny('crystal','<path d="m3 16 4-9 4-1-2 11-6 5z" fill="#b18baa" stroke="#ecbfdd"/><path d="m12 10 8-8 3 4-2 11-8 7-3-4z" fill="#9b7999" stroke="#f2d2e8"/><path d="M20 3 16 15l-5 7m5-7 6-9" fill="none" stroke="#ceafc8"/>'),
 heart:tiny('heart','<path d="m4 8 4-3 5 3 5-3 4 3v5l-9 9-9-9z" fill="#ddbad0" stroke="#f8e1e8"/><path d="m6 9 2-2 3 1m2 10 6-7" fill="none" stroke="#ae809c"/>'),
 travel:tiny('dial','<circle cx="13" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m13 2 2 3h-4zm8 11 3 1-3 1zM4 11l-2 2 2 1zm7 11h4l-2 2z" fill="currentColor"/><path d="m17 8-2 7-7 3 3-8z" fill="none" stroke="currentColor"/><path d="m17 8-4 5-2-3z" fill="currentColor"/>'),
 time:tiny('time','<path d="M6 3h14M6 23h14M8 5q0 5 5 8-5 3-5 8m10-16q0 5-5 8 5 3 5 8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 7h6l-3 4zm0 13 3-4 3 4z" fill="currentColor"/>')
};
const crest='<svg class="pf-crest" viewBox="0 0 64 72" aria-hidden="true" focusable="false"><path d="m32 1 4 7c14 2 23 13 23 26l5 3-5 4c-2 14-11 23-22 26l-5 5-5-5C14 63 7 54 5 41l-5-4 5-3C4 20 15 10 28 8z" fill="#2d1b32" stroke="currentColor"/><circle cx="32" cy="36" r="24" fill="#3c233a" stroke="#b88a9a" stroke-width="1.7"/><circle cx="32" cy="36" r="19.5" fill="#1a101e" stroke="#704760"/><path d="M13 34q1-11 12-16m20 32q-4 5-10 7M16 34l2-4m28 10-2 4" fill="none" stroke="#c09aa7"/><path d="m32 14 3 5-1 9 11-4-3 5-8 4-2 21-3-21-8-4-3-5 12 4-1-9z" fill="#e4c1cb" stroke="#f6d9d9" stroke-width=".65"/><path d="M32 16v36l-2-19-4-3 6 1z" fill="#a36c87"/><path d="m32 6 2 3-2 3-2-3zm0 55 2 3-2 3-2-3z" fill="#f0d3c5"/></svg>';
const corner='<svg class="pf-corner" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path fill="currentColor" d="M1 2c8 4 17 5 26 1l-4 5c21 1 33-2 44-4-9 5-23 9-41 9l-6 3-7 10C13 47 7 58 5 69c0-15 2-29 3-45l-4 3 2-11zM9 7l3 10 6-6-9-4z" fill-rule="evenodd"/><path d="M17 28q5-10 14-12l10-2-8 5-10 4zM8 40q3-10 10-15l-6 14-3 9z" fill="currentColor" opacity=".75"/><path d="m24 23 4-2-2 5-3 1z" fill="currentColor"/></svg>';
const flourish='<svg class="pf-flourish" viewBox="0 0 328 29" aria-hidden="true" focusable="false"><path d="M0 15c55 0 69-1 106-3l23 1c-5-4-10-5-16-6 20 0 29 5 38 9l-12-1c-6 2-15 3-20 2l12-3-21 1c-35 2-67 2-110 0Zm328 0c-55 0-69-1-106-3l-23 1c5-4 10-5 16-6-20 0-29 5-38 9l12-1c6 2 15 3 20 2l-12-3 21 1c35 2 67 2 110 0Z" fill="currentColor"/><path d="M159 7c-7 4-7 9-1 14m11-14c7 4 7 9 1 14m-14-8 8 4 8-4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m164 0 3 5-2 5 1 11-2 8-2-8 1-11-2-5z" fill="currentColor"/></svg>';
// A deterministic field avoids a flicker when the player moves between profiles.
const sparks=Array.from({length:38},(_,i)=>{
 const x=((i*149+17)%1200), y=((i*103+i*i*11+19)%708);
 const warm=['#ee9a72','#d57b5b','#f4b583','#ba685d'][i%4];
 const w=[.65,1.05,1.45,.8,.5][i%5], h=[2.2,3.2,5,2.7,1.7][i%5];
 return '<ellipse cx="'+x+'" cy="'+y+'" rx="'+w+'" ry="'+h+'" fill="'+warm+'" opacity="'+[.52,.8,.66,.37][i%4]+'" transform="rotate(23 '+x+' '+y+')"/>';
}).join('');
const ambient='<svg class="pf-embers" viewBox="0 0 1200 708" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g>'+sparks+'</g></svg>';
function duration(seconds){
 const s=integer(seconds),m=Math.floor(s/60),h=Math.floor(m/60);
 if(!m)return s>0?'Menos de 1 min':'0 min';
 if(!h)return m+' min';
 return h+' h '+(m%60)+' min';
}
function record(save,level){
 const zones=level?.zones??[],fallback=level?.spawn?.x??0;
 let x=Number.isFinite(save.checkpoint?.x)?save.checkpoint.x:fallback;
 if(!save.road&&Number.isFinite(save.checkpoint?.x))x=roadX(x);
 const zone=zones.findLast(z=>x>=z.x)??zones[0];
 const marsh=zone?.plague&&level?.plague?.sectors?.findLast(s=>x>=s.x);
 const place=save.inObservatory&&!save.ritualWon?'Observatorio del Eclipse':marsh?.name||zone?.name||'Bosque de la Vigilia';
 const seen=Array.isArray(save.journey?.seen)?new Set(save.journey.seen.filter(i=>Number.isInteger(i)&&i>=0&&i<zones.length)).size:null;
 const explored=seen!==null&&zones.length?Math.round(100*seen/zones.length):null;
 const worn=Array.isArray(save.economy?.equipped)?save.economy.equipped:[],owned=save.economy?.owned;
 const hp=6+charms.filter(c=>worn.includes(c.id)&&(!Array.isArray(owned)||owned.includes(c.id))).reduce((t,c)=>t+(c.mods?.health??0),0);
 const finished=save.complete===true&&level?.exit?.x===save.finishAt;
 return {place,seen,explored,total:zones.length,hp,rank:save.sword?Math.max(1,integer(save.rank)):0,nux:save.economy&&Number.isFinite(save.economy.nux)?integer(save.economy.nux):null,
   crystals:integer(save.crystals),time:duration(save.elapsed),finished,art:marsh?'marsh':save.sword?'eclipse':'forest'};
}
const row=(id,value,label)=>'<span class="pf-resource">'+icons[id]+'<span><b>'+value+'</b> '+label+'</span></span>';
const edges=corner+corner.replace('pf-corner','pf-corner pf-corner-end')+'<span class="pf-focus-marks" aria-hidden="true"></span>';
function card(slot,i,level,selected){
 const on=i===selected,info=slot?record(slot,level):null;
 const label='Perfil '+i+'. '+(info?'Continuar en '+info.place+'. '+(info.rank?'Espada de rango '+info.rank:'Sin espada')+'. Vida máxima: '+info.hp+'. '+(info.nux===null?'Nux sin registrar':info.nux+' Nux')+'. '+info.crystals+(info.crystals===1?' cristal. ':' cristales. ')+(info.explored===null?'':info.explored+'% de zonas exploradas. ')+info.time+'.':'Partida nueva.');
 const start='<button type="button" data-profile="'+i+'" class="pf-card '+(info?'pf-used pf-'+info.art:'pf-empty')+'" aria-pressed="'+on+'" aria-label="'+escape(label)+'">';
 if(!info)return start+edges+'<span class="pf-empty-word">Partida nueva</span><span class="pf-card-base"><span class="pf-number">'+i+'.</span></span></button>';
 const hearts=Array.from({length:Math.min(info.hp,12)},()=>icons.heart).join('');
 return start+'<span class="pf-landscape" aria-hidden="true"></span>'+edges+
  '<span class="pf-card-top"><span class="pf-state">'+(info.finished?'Capítulo completado':'Partida guardada')+'</span><span class="pf-vitals">'+crest+'<span class="pf-health"><span class="pf-hearts" aria-hidden="true">'+hearts+'</span><small>Vida máx. · '+info.hp+'</small></span></span>'+
  '<span class="pf-resources">'+(info.rank?row('sword','Rango '+info.rank,''):row('sword','Sin espada',''))+row('nux',info.nux===null?'—':number(info.nux),'Nux')+row('crystal',number(info.crystals),info.crystals===1?'cristal':'cristales')+'</span></span>'+
  '<span class="pf-card-base"><span class="pf-number">'+i+'.</span><span class="pf-memo">'+
  '<span class="pf-explored" title="'+(info.seen===null?'Exploración sin registrar':info.seen+' de '+info.total+' zonas exploradas')+'">'+icons.travel+'<span>'+(info.explored===null?'Sin registro':info.explored+'% explorado')+'</span></span>'+
  '<span class="pf-time">'+icons.time+info.time+'</span><strong>'+escape(info.place)+'</strong></span></span></button>';
}
export function profilesView({saves=[],level,selected=1}={}){
 const focus=Math.min(4,Math.max(1,integer(selected)));
 const slots=Array.from({length:4},(_,i)=>card(saves[i],i+1,level,focus)).join('');
 const pager=roman.map((v,i)=>'<button type="button" data-pick-profile="'+(i+1)+'" aria-label="Ver perfil '+(i+1)+'" aria-pressed="'+(i+1===focus)+'">'+v+'</button>').join('');
 return '<section class="pf-scene" aria-label="Perfiles de Abyss Blade">'+ambient+'<div class="pf-book"><header class="pf-heading"><small>Archivos del Umbral</small><h2>Seleccionar perfil</h2>'+flourish+'</header>'+
  '<div class="pf-deck" role="group" aria-label="Cuatro partidas">'+slots+'</div><nav class="pf-switch" aria-label="Seleccionar tarjeta de perfil">'+pager+'</nav>'+
  '<footer class="pf-foot"><button type="button" id="back">Atrás</button><small class="pf-keys"><span><kbd>A / D</kbd> o <kbd>← →</kbd> Elegir</span><span><kbd>J / Enter</kbd> Abrir</span><span><kbd>K / Esc</kbd> Volver</span></small></footer></div></section>';
}
