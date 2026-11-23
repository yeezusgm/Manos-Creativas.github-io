import {capacities,cords,roman,targetBells,names,circuit,portsAt,traceSap,puzzleIds} from './peste.js';
import {safeText} from './interface.js';
const esc=safeText;
const marks=mask=>roman.filter((_,i)=>mask&(1<<i)).join(' · ')||'ninguna';
const symbols={sal:'≋',campanas:'♢',injerto:'✣'};
const letters=['A','B','C'];
export function deviceLabel(d){
 const p=names[d.puzzle];
 if(d.role==='clue')return 'Leer inscripción · '+p.name;
 return p.device[Number(d.id.split('-').at(-1))];
}
function diagramSal(state,active){
 return '<div class="vat-row">'+capacities.map((max,i)=>'<div class="vat-col '+(active===i?'here':'')+'"><span>'+names.sal.device[i]+'</span><i class="vessel v'+i+'"><b style="height:'+100*state.volumes[i]/max+'%"></b></i><strong>'+state.volumes[i]+' / '+max+' L</strong></div>').join('')+'</div>';
}
function diagramBells(state,active){
 const row=(mask,goal)=>'<div class="bells-row '+(goal?'wish':'')+'"><strong>'+(goal?'Objetivo':'Ahora')+'</strong>'+roman.map((n,i)=>'<span class="'+(mask&(1<<i)?'ringing':'')+'" aria-label="Campana '+n+(mask&(1<<i)?' sonando':' en silencio')+'"><b aria-hidden="true">'+(mask&(1<<i)?'◆':'◇')+'</b>'+n+'</span>').join('')+'</div>';
 return row(state.bells,false)+row(targetBells,true)+'<div class="cord-list">'+cords.map((mask,i)=>'<span class="'+(i===active?'here':'')+'">'+names.campanas.device[i].replace('Cuerda del ','')+' <b>'+marks(mask)+'</b></span>').join('')+'</div>';
}
const offX=[0,1,0,-1],offY=[-1,0,1,0];
function diagramSap(state,active){
 const flow=traceSap(state.turns);
 const tiles=circuit.map((t,i)=>{
  const x=28+t.x*55,y=22+t.y*43,wet=flow.wet.has(i),ports=portsAt(t,state.turns);
  const glyph=t.kind==='flower'?'✿':t.kind==='source'?'◉':t.kind==='rot'?'×':t.kind==='rotor'?letters[t.rotor]:'';
  const lines=offX.map((dx,k)=>ports&(1<<k)?'<path d="M'+x+' '+y+'l'+dx*27.5+' '+offY[k]*21.5+'"/>':'').join('');
  return '<g class="pipe '+(wet?'wet ':'')+(t.kind==='rot'?'blight ':'')+(t.kind==='rotor'&&t.rotor===active?'here':'')+'">'+lines+(glyph?'<circle cx="'+x+'" cy="'+y+'" r="'+(t.kind==='rotor'?10:9)+'"/><text x="'+x+'" y="'+(y+4)+'">'+glyph+'</text>':'')+'</g>';
 }).join('');
 const summary=flow.flowers+' de 2 flores con savia · '+(flow.rot?'la costra recibe savia':'costra aislada')+' · '+flow.leaks+' fuga'+(flow.leaks===1?'':'s');
 return '<svg class="root-board" viewBox="0 0 280 130" role="img" aria-label="Circuito de la raíz. '+summary+'"><title>Conductos de savia: A reparte; B y C alimentan las flores.</title>'+tiles+'</svg><div class="pipe-key">◉ Raíz &nbsp; ✿ Flores &nbsp; × Costra</div><p class="machine-summary">'+summary+'</p>';
}
const uiButton=(cmd,label,arg,disabled=false)=>'<button data-mech="'+cmd+'"'+(arg!==undefined?' data-arg="'+arg+'"':'')+(disabled?' disabled':'')+'>'+label+'</button>';
export function puzzlePanel(d,marsh,{hint=false,reset=false,feedback=''}={}){
 const id=d.puzzle,p=names[id],s=marsh.state,i=d.role==='control'?Number(d.id.split('-').at(-1)):-1,done=marsh.solved.has(id);
 const diagram=id==='sal'?diagramSal(s,i):id==='campanas'?diagramBells(s,i):diagramSap(s,i);
 let buttons='';
 if(!done&&i>=0){
  if(id==='sal')buttons=capacities.map((m,n)=>n!==i?uiButton('pour','Verter en '+p.device[n]+' ('+m+' L)',n,s.volumes[i]===0||s.volumes[n]===m):'').join('');
  if(id==='campanas')buttons=uiButton('ring','Tirar de la cuerda');
  if(id==='injerto')buttons=uiButton('turn','↶ Girar a la izquierda',-1)+uiButton('turn','↷ Girar a la derecha',1);
 }
 const exhibit='<div class="marsh-diagram">'+diagram+'</div>';
 const note=done?'El sello está abierto. Continúa hacia el este.':i<0?'Las piezas que ves en el esquema están en este barrio. Acércate a cada una para accionarla.':id==='sal'?'Recipiente actual: '+p.device[i]+'. Desde aquí solo puedes verter su contenido.':id==='campanas'?'Esta cuerda invierte: '+marks(cords[i])+'.':'Pieza actual: '+p.device[i]+'.';
 const legend='<p class="marsh-rule">'+p.rule+'</p>';
 const info=feedback?'<p class="machine-feedback" role="status">'+esc(feedback)+'</p>':'';
 const hints=!done?(hint?'<p class="machine-hint">'+p.hint+'</p>':uiButton('hint','Leer una pista')):'';
 const restart=!done&&i>=0?(reset?'<span class="reset-confirm">¿Restaurar solo este mecanismo?</span>'+uiButton('reset','Sí, reiniciar')+uiButton('cancel','Cancelar'):uiButton('askreset','Reiniciar mecanismo')):'';
 return {tag:'MARJAL DE LA PESTE · '+(i<0?'INSCRIPCIÓN':esc(deviceLabel(d)).toUpperCase()),title:'<h2>'+p.name+'</h2>',body:legend+exhibit+'<p>'+note+'</p>'+info+'<div class="machine-ops">'+buttons+'</div><div class="machine-tools">'+hints+restart+'</div>'};
}
export function marshMap(plague,marsh,player){
 if(!marsh?.admitted)return '';
 const visible=x=>{const s=plague.sectors.findLast(a=>x>=a.x);return s&&marsh.seen.has(s.id);};
 if(!marsh.seen.size)return '<p class="marsh-map-note">Marjal de la Peste · Acceso abierto al este del Observatorio.</p>';
 const px=x=>10+700*(x-plague.start)/(plague.end-plague.start),py=y=>71-y*3.8;
 const paths=plague.platforms.filter(t=>!t.gateId&&visible(t.x)).map(t=>'<path class="mapped-ledge" d="M'+px(t.x).toFixed(1)+' '+py(t.y+t.h).toFixed(1)+'h'+Math.max(2,px(t.x+t.w)-px(t.x)).toFixed(1)+'"/>').join('');
 const gates=plague.platforms.filter(t=>t.gateId&&visible(t.x)).map(t=>{const open=marsh.shortcuts.has(t.gateId)||marsh.solved.has(t.gateId.slice(6));return '<path class="'+(open?'pass':'bar')+'" d="M'+px(t.x)+' 41v30"><title>'+(open?'Paso abierto':'Paso cerrado')+'</title></path>';}).join('');
 const points=plague.devices.filter(d=>d.role==='clue'&&visible(d.x)).map(d=>'<text x="'+px(d.x)+'" y="'+(py(d.y)-8)+'">'+symbols[d.puzzle]+'</text>').join('');
 const here=player&&player.x>=plague.start?'<circle class="here-pin" cx="'+px(player.x)+'" cy="'+(py(player.y)-2)+'" r="4"><title>Tom</title></circle>':'';
 const flags=plague.sectors.map(s=>marsh.seen.has(s.id)?s.name:'Por descubrir');
 return '<section class="marsh-map"><h3>Marjal de la Peste</h3><svg viewBox="0 0 720 105" role="img" aria-label="Perfil del Marjal, plataformas exploradas y posición de Tom">'+paths+gates+points+here+'</svg><p>'+flags.map(esc).join(' · ')+'</p><p>Compuertas: '+marsh.solved.size+'/3 · Atajos: '+marsh.shortcuts.size+'/'+plague.shortcuts.length+'</p>'+puzzleIds.filter(id=>marsh.inscriptions.has(id)).map(id=>'<details><summary>'+names[id].name+(marsh.solved.has(id)?' · resuelto':'')+'</summary><p>'+names[id].rule+'</p></details>').join('')+'</section>';
}
