// A physical puzzle keeps its state when Tom leaves the room. Each operation is
// reversible until the lock opens; an open lock never closes on the player.
export const puzzleIds=['sal','campanas','injerto'];
export const capacities=[8,5,3],roman=['I','II','III','IV','V'];
export const cords=[3,14,28,24], targetBells=17, startBells=22;
export const names={
 sal:{name:'Los vasos de sal',device:['Caldera','Ánfora','Cántaro'],hint:'El cántaro lleno deja dos litros en el ánfora. Esa diferencia también puede servirte de medida.',rule:'Reparte los ocho litros por igual entre la caldera y el ánfora. El cántaro debe quedar vacío. No hay marcas: cada trasvase sigue hasta vaciar el origen o llenar el destino.'},
 campanas:{name:'El carillón de cuarentena',device:['Cuerda del umbral','Cuerda del coro','Cuerda del ábside','Cuerda del osario'],hint:'Solo la cuerda del umbral afecta a la campana I. Tras fijar ese extremo, mira qué cuerda puede corregir la II.',rule:'El epitafio pide que solo suenen la primera y la última campana. Cada cuerda invierte todas las campanas que llevan su marca: las mudas suenan, las que suenan callan. Tirar dos veces de la misma cuerda deshace el cambio.'},
 injerto:{name:'El último injerto',device:['Distribuidor A','Codo B','Codo C'],hint:'El distribuidor tiene una cara ciega. Oriéntala hacia la costra para enviar la savia por las dos ramas.',rule:'Lleva la savia de la raíz a las dos flores sin alimentar la costra ni dejar fugas. Gira los tres injertos por cuartos de vuelta. Un conducto solo transmite si sus dos extremos coinciden.'}
};
// NESW port masks, traced on the same board that the player sees.
const N=1,E=2,S=4,W=8;
export const circuit=[
 {x:0,y:1,kind:'source',ports:E},{x:1,y:1,kind:'rotor',rotor:0,ports:N|E|S},
 {x:2,y:1,kind:'rot',ports:W},
 {x:1,y:0,kind:'fixed',ports:S|E},{x:2,y:0,kind:'fixed',ports:W|E},
 {x:3,y:0,kind:'rotor',rotor:1,ports:N|E},{x:3,y:1,kind:'flower',ports:N},
 {x:1,y:2,kind:'fixed',ports:N|E},{x:2,y:2,kind:'fixed',ports:W|E},
 {x:3,y:2,kind:'fixed',ports:W|E},{x:4,y:2,kind:'rotor',rotor:2,ports:N|E},
 {x:4,y:1,kind:'flower',ports:S},
];
const indexAt=new Map(circuit.map((p,i)=>[p.x+','+p.y,i])),dx=[0,1,0,-1],dy=[-1,0,1,0];
export const portsAt=(tile,turns)=>{
 if(tile.kind!=='rotor')return tile.ports;
 const n=turns[tile.rotor];return ((tile.ports<<n)|(tile.ports>>(4-n)))&15;
};
export function traceSap(turns){
 const wet=new Set([0]),queue=[0];let flowers=0,rot=false,leaks=0;
 for(let j=0;j<queue.length;j++){
  const t=circuit[queue[j]],ports=portsAt(t,turns);
  if(t.kind==='flower')flowers++;if(t.kind==='rot')rot=true;
  for(let d=0;d<4;d++)if(ports&(1<<d)){
   const k=indexAt.get((t.x+dx[d])+','+(t.y+dy[d]));
   if(k===undefined||!(portsAt(circuit[k],turns)&(1<<((d+2)%4)))){leaks++;continue;}
   if(!wet.has(k)){wet.add(k);queue.push(k);}
  }
 }
 return {wet,flowers,rot,leaks,solved:flowers===2&&!rot&&!leaks};
}
const initial=()=>({volumes:[8,0,0],bells:startBells,turns:[1,0,1]});
const validArray=(v,max)=>Array.isArray(v)&&v.length===max.length&&v.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=max[i]);
export function createMarsh(plague,sim){
 const solved=new Set(),seen=new Set(),inscriptions=new Set(),shortcuts=new Set();
 const controls=new Map(plague.devices.filter(d=>d.role==='control').map(d=>[d.id,d]));
 const allowedShortcuts=new Set(plague.shortcuts.map(d=>d.id));
 let state=initial(),admitted=false;
 function solvedNow(id){return id==='sal'?state.volumes[0]===4&&state.volumes[1]===4&&state.volumes[2]===0:id==='campanas'?state.bells===targetBells:traceSap(state.turns).solved;}
 function admit(){admitted=true;sim.setGate('peste-umbral',true);}
 function open(id){if(solvedNow(id)&&sim.setGate('peste-'+id,true))solved.add(id);}
 function restore(saved={},won=false){
  saved=saved||{};state=initial();solved.clear();seen.clear();inscriptions.clear();shortcuts.clear();admitted=false;
  if(!won)return;
  admit();
  if(validArray(saved.volumes,capacities)&&saved.volumes.reduce((a,b)=>a+b,0)===8)state.volumes=[...saved.volumes];
  if(Number.isInteger(saved.bells)&&saved.bells>=0&&saved.bells<=31)state.bells=saved.bells;
  if(validArray(saved.turns,[3,3,3]))state.turns=[...saved.turns];
  const remembered=(key,id)=>Array.isArray(saved[key])&&saved[key].includes(id);
  for(const id of puzzleIds){if(remembered('inscriptions',id))inscriptions.add(id);open(id);}
  for(const e of plague.sectors)if(remembered('seen',e.id))seen.add(e.id);
  for(const id of allowedShortcuts)if(remembered('shortcuts',id)&&sim.setGate(id,true))shortcuts.add(id);
 }
 function visit(x){if(!admitted||x<plague.start||x>plague.end)return null;const s=plague.sectors.findLast(v=>x>=v.x);if(s)seen.add(s.id);return s??null;}
 function shortcut(id){if(!admitted||!allowedShortcuts.has(id)||shortcuts.has(id)||!sim.setGate(id,true))return false;shortcuts.add(id);return true;}
 function operate(device,command,arg){
  const d=controls.get(device);if(!admitted||!d)return {ok:false};
  const id=d.puzzle,i=Number(d.id.split('-').at(-1));
  if(solved.has(id))return {ok:false,message:'La compuerta ya está abierta.'};
  let message='';
  if(command==='reset'){
   const plain=initial();if(id==='sal')state.volumes=plain.volumes;else if(id==='campanas')state.bells=plain.bells;else state.turns=plain.turns;
   return {ok:true,message:'El mecanismo volvió a su posición inicial.'};
  } else if(id==='sal'&&command==='pour'&&Number.isInteger(arg)&&arg>=0&&arg<3&&arg!==i){
   const amount=Math.min(state.volumes[i],capacities[arg]-state.volumes[arg]);
   if(!amount)return {ok:false,message:state.volumes[i]?'El recipiente de destino está lleno.':'Este recipiente está vacío.'};
   state.volumes[i]-=amount;state.volumes[arg]+=amount;message='Trasvase: '+amount+' L. Destino: '+names.sal.device[arg]+'.';
  } else if(id==='campanas'&&command==='ring'){
   state.bells^=cords[i];message='La cuerda invirtió las campanas marcadas.';
  } else if(id==='injerto'&&command==='turn'&&(arg===1||arg===-1)){
   state.turns[i]=(state.turns[i]+arg+4)%4;message='El injerto giró un cuarto de vuelta.';
  } else return {ok:false};
  open(id);
  return {ok:true,opened:solved.has(id),message:solved.has(id)?'El sello ha cedido. La compuerta del este está abierta.':message};
 }
 function snapshot(){return {volumes:[...state.volumes],bells:state.bells,turns:[...state.turns],inscriptions:[...inscriptions],shortcuts:[...shortcuts],seen:[...seen]};}
 return {get state(){return state;},get admitted(){return admitted;},get complete(){return solved.size===puzzleIds.length;},solved,seen,inscriptions,shortcuts,visit,admit,restore,shortcut,operate,snapshot};
}
