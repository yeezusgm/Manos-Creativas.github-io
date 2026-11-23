// These seams are also part of the save-file coordinate system. Old beacons,
// gates and story encounters keep their world positions as the trail changes.
export const walks=[[5,11],[32.9,8],[40.6,9],[63,12],[101,11],[154,13],[180,10],[219,8],[232,9],[269,10],[296,9],[337.6,10],[392,9],[451.3,11]];
export function roadX(x){return walks.reduce((n,[a,w])=>n+(x>=a?w:0),x);}

// A shelf is [offset from the west seam, width, height above the original floor].
// Its painted top is its collision top. The last shelf carries that route's
// original reward, so already-collected items stay collected on old saves.
const routes=[
  {id:'dosel',shelves:[[.9,3.15,1.33],[4.65,3.12,2.9],[8.38,2.9,4.48]]},
  {id:'tronco',cut:[-1.55,6.65],piers:[[1.15,2.75,.58]],shelves:[[.53,3.04,2.24],[4.68,2.95,3.81]]},
  {id:'claustro-bajo',shelves:[[.55,3.2,1.55],[4.17,3.1,3.12],[.68,3.06,4.73]]},
  {id:'acueducto',cut:[.15,11.8],piers:[[2.32,2.45,1.04],[7.25,2.5,1.72]],shelves:[[2.00,3.4,3.43],[6.94,3.56,5.02]]},
  {id:'vigilia',shelves:[[.5,3.2,1.58],[4.82,3.22,3.16],[8.58,2.82,4.80]]},
  {id:'cauce',cut:[-.15,12.45],piers:[[2.25,2.55,-1.09],[7.22,2.65,-.14]],shelves:[[.20,3.28,2.41],[5.15,3.25,3.97],[9.70,3.12,5.38]]},
  {id:'raiz-hueca',shelves:[[7.32,2.69,1.63],[3.94,2.9,3.21],[.7,2.68,4.87]]},
  {id:'corazon',shelves:[[.46,2.96,1.63],[4.61,3.02,3.19],[.95,2.87,4.77]]},
  {id:'cornisa',cut:[0,9.15],piers:[[2.95,2.54,1.12]],rescue:[6.35,2.65,-1.58],shelves:[[1.48,3.15,3.18],[6.22,3.06,4.68]]},
  {id:'terraza',stairs:[[.26,3.03,1.40],[3.29,3.50,2.95],[6.79,2.96,1.41]],shelves:[[2.68,2.72,4.60],[6.2,2.67,6.15]]},
  {id:'cruce',shelves:[[6.84,2.77,1.60],[3.38,2.92,3.12],[.19,2.75,4.60]]},
  {id:'campanas',shelves:[[.93,3.03,1.55],[5.04,3.11,3.13],[1.47,2.75,4.73]]},
  {id:'fosas',shelves:[[.88,3.06,1.55],[4.94,3.06,3.13],[1.45,2.77,4.74]]},
  {id:'vestibulo',shelves:[[.65,3.32,1.48],[4.32,3.23,3.08],[8.3,2.82,4.63]]},
];

export function extendRoad(base){
  function shift(v){
    if(Array.isArray(v))return v.map(shift);
    if(!v||typeof v!=='object')return v;
    const r=Object.fromEntries(Object.entries(v).map(([k,n])=>[k,shift(n)]));
    for(const k of ['x','left','right','end','width','maxX'])if(typeof v[k]==='number')r[k]=roadX(v[k]);
    // Expand continuous ground through a seam, never an overhanging ledge.
    if(v.w!=null)r.w=v.oneWay?v.w:roadX(v.x+v.w)-roadX(v.x);
    return r;
  }
  const l=shift(base);
  walks.forEach(([a,length],i)=>{
    const route=routes[i],west=roadX(a)-length;
    const floor=l.platforms.find(p=>!p.oneWay&&!p.gateId&&p.x<=west&&p.x+p.w>=west+length-.001);
    const y=floor.y+floor.h,kind=floor.kind;
    const shelf=([dx,w,dy],id)=>({id,x:west+dx,y:y+dy-.24,w,h:.24,kind,oneWay:true});
    if(route.cut){
      const [left,right]=route.cut.map(dx=>west+dx);
      const end=floor.x+floor.w,idx=l.platforms.indexOf(floor);
      l.platforms.splice(idx,1,{...floor,w:left-floor.x},{...floor,x:right,w:end-right});
      for(const [dx,w,dy] of route.piers){
        l.platforms.push({id:route.id+'-pilar',x:west+dx,y:floor.y,w,h:y+dy-floor.y,kind});
      }
      if(route.rescue){
        const ledge=shelf(route.rescue,'refugio-gruta');l.platforms.push(ledge);
        l.pickups.push({id:'cristal-refugio-gruta',type:'crystal',x:ledge.x+ledge.w*.48,y:ledge.y+ledge.h+.44});
      }
    }
    for(const [dx,w,h] of route.stairs??[]){
      l.platforms.push({id:route.id+'-escalon',x:west+dx,y,w,h,kind});
    }
    const path=route.shelves.map((s,k)=>shelf(s,route.id+'-'+k));
    l.platforms.push(...path);const top=path.at(-1);
    l.pickups.push({id:'desvio-'+i,type:i%3?'crystal':'apple',x:top.x+top.w*.52,y:top.y+top.h+.44});
  });
  // Keep terrestrial patrols on the same bank as their spawn near the new cuts.
  for(const e of l.enemies){
    if(!['bridge-sentinel','cave-watch'].includes(e.id))continue;
    const bank=l.platforms.find(p=>!p.oneWay&&!p.gateId&&Math.abs(p.y+p.h-e.y)<.001&&p.x<e.x&&p.x+p.w>e.x);
    if(bank){e.left=Math.max(e.left,bank.x+.47);e.right=Math.min(e.right,bank.x+bank.w-.47);}
  }
  l.enemies.push({id:'cantora',type:'curator',x:roadX(402),y:-11.25,left:roadX(398),right:roadX(406),hp:19,active:false});
  return l;
}
