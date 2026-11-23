// Stable pickup and enemy IDs also identify rewards in older saves.
const deposits=new Set(['crystal-canopy','crystal-vault','desvio-4','spring-gem','desvio-5','root-cache2','cristal-refugio-gruta','mist-top','desvio-10','spire-crystal2','ossuary-crystal','archive-crystal','peste-tejado','peste-sal-alta','peste-cobre','peste-flor']);
const bearers=new Set(['gate-warden','heart-warden','glass-archer-2','peste-campanero']);
export const dropsCrystal=id=>bearers.has(id);
export const applePrice=4;
export const errandRewards={forest:14,water:24};
export function placeForge(level){
 const beacon=level.stations.find(s=>s.id==='root');
 level.forge={stationId:beacon.id,name:'Forja de la Raíz',x:beacon.x+3.65,y:beacon.y};
 const keep=p=>p.type!=='crystal'||deposits.has(p.id);
 level.pickups=level.pickups.filter(keep);
 level.plague.pickups=level.plague.pickups.filter(keep);
}
const costs=[0,3,6,8];
export const grade=n=>['','I','II','III','IV'][n]||String(n);
export function atForge(player,forge){return !!player&&Math.abs(player.x-forge.x)<1.48&&Math.abs(player.y-forge.y)<.90;}
export function forgeOffer({sword,rank,crystals,relics,won}){
 const full=rank>=4;
 const cost=full?0:costs[rank]||0,target=full?rank:rank+1;
 const sealed=rank===2&&!relics?.size,needsMage=rank===3&&!won;
 const requirement=sealed?'Recupera un sello del Campanario o del Osario.':needsMage?'Derrota al Mago Oscuro en el Observatorio.':'';
 const missing=Math.max(0,cost-crystals);
 const reason=full?'La hoja ya alcanzó su temple final.':!sword?'Encuentra primero la Espada del Abismo.':requirement||(!missing?'El fuego está listo.':missing===1?'Falta un cristal para este temple.':'Faltan '+missing+' cristales para este temple.');
 return {full,target,cost,reason,allowed:!full&&sword&&!requirement&&!missing};
}
// Position and requirements are checked again at the moment of purchase.
export function temperBlade(state,player,forge){
 const offer=forgeOffer(state);
 return atForge(player,forge)&&offer.allowed?{rank:offer.target,crystals:state.crystals-offer.cost}:null;
}
