import {extendRoad,roadX} from './main-road.js';
import {placeForge} from './forja.js';
import {addEncounters} from './encuentros.js';
import {makePlague} from './peste-level.js';

export function buildCampaign(base){
 const level=extendRoad(base),start=roadX(483),plague=makePlague(start);
 // Preserve the original Observatory arena, rest point and west return. Only
 // its east end wall becomes a gate. New room coordinates are already final.
 const endWall=level.platforms.find(p=>Math.abs(p.x-start)<.001&&p.h>10&&!p.gateId);
 if(!endWall)throw Error('Falta el muro oriental del Archivo');
 level.platforms.splice(level.platforms.indexOf(endWall),1,{gateId:'peste-umbral',x:start,y:-16,w:.64,h:36,kind:'peste'});
 level.archiveAltar={...level.exit};level.plague=plague;level.width=level.maxX=plague.end;level.exit=plague.exit;
 for(const key of ['platforms','hazards','pickups','enemies','stations','checkpoints','tutorials'])level[key].push(...plague[key]);
 level.zones.push({x:start,name:'Marjal de la Peste',network:true,plague:true});
 level.echoes.push({...level.archiveAltar,id:'entrada-peste',lines:['EL ECO — Al caer el mago se abrió la compuerta del este. Escucha: el agua del Marjal vuelve a correr.','TOM — Si sigo la corriente hasta el invernadero, encontraré dónde devolver la espada.']});
 level.ending=['TOM — Una flor a cada lado de la raíz. Ahora entiendo dónde debe descansar la espada.','EL ECO — El agua vuelve a correr. Del otro lado del marjal, el bosque recupera su voz.'];
 placeForge(level);addEncounters(level);
 return level;
}
export function loadDestination(slot,level,marsh,arena){
 if(slot.inObservatory&&!marsh.admitted)return {x:arena.entry,y:arena.floor};
 const d=slot.checkpoint??level.spawn;
 // Players who finished the previous chapter can walk directly into its continuation.
 if(slot.complete&&slot.finishAt!==level.exit.x&&marsh.admitted)return level.archiveAltar;
 if(d.x>=level.plague.start){
  if(!marsh.admitted)return {x:arena.left-.7,y:arena.floor};
  for(const g of level.plague.platforms.filter(p=>/^peste-(sal|campanas|injerto)$/.test(p.gateId||'')).sort((a,b)=>a.x-b.x))
   if(d.x>=g.x&&!marsh.solved.has(g.gateId.slice(6)))return level.plague.stations.filter(s=>s.x<g.x).at(-1);
 }
 return d;
}
