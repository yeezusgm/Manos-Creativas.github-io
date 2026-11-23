// World positions measure from the feet. Tom and the spell impacts use this same arena.
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export const times=Object.freeze({intro:1.30,idle:.85,gather:1.18,rain:1.94,raise:1.00,sweep:.92,expose:3.5,recover:.86});
export function observatory(offset=0){
 const left=466.7+offset,right=479.75+offset;
 return Object.freeze({left,right,trigger:left+.72,entry:left+1.05,center:(left+right)/2,
   x:473.85+offset,floor:.28,core:3.43,sky:5.95,staffReach:2.30});
}
export function arenaView(arena,aspect,short=false){
 // Fit both seals and the complete casting sheet, including the halo, above the touch controls.
 const height=Math.max(short?11.6:10.4,(arena.right-arena.left+1.8)/Math.max(.1,aspect));
 return {x:arena.center,y:arena.floor+Math.min(height*(short?.235:.255),3.15),width:height*aspect,height};
}
export function ritual(offset=0){
 const arena=observatory(offset),b={};
 const locked=()=>!b.won&&b.phase!=='quiet';
 function reset(won=false){
  Object.assign(b,{won,phase:won?'won':'quiet',t:0,x:arena.x,y:arena.floor,clock:0,charges:0,cycle:0,
   marks:[],orb:null,dir:-1,swingHit:false,lastHit:-1});
 }
 reset();
 function phase(name){b.phase=name;b.t=0;}
 function confine(p){
  if(!locked())return;
  const half=(p.width||.6)/2,lo=arena.left+half,hi=arena.right-half;
  if(p.x<=lo){p.x=lo;if(p.vx<0)p.vx=0;}
  else if(p.x>=hi){p.x=hi;if(p.vx>0)p.vx=0;}
 }
 function tick(dt,p,damage,signal=()=>{}){
  if(b.won||p.hp<=0)return;
  if(b.phase==='quiet'){
   if(p.x<arena.trigger||p.x>arena.right+.5||p.y<arena.floor-.6)return;
   phase('intro');signal('seal'); // X and Y of the boss never change after reset.
  }
  confine(p);b.t+=dt;b.clock+=dt;
  switch(b.phase){
   case 'intro':if(b.t>=times.intro)phase('idle');break;
   case 'idle':if(b.t>=times.idle){
    // The supplied casting sheet already contains two bolts: put real hitboxes under
    // those exact painted impacts. One (later two) outer bolts threaten Tom's lane.
    const lanes=[{x:b.x-2.42*b.dir,painted:1},{x:b.x+1.88*b.dir,painted:2}];
    const lo=arena.left+.55,hi=arena.right-.55;
    for(let i=0;i<(b.charges>=2?2:1);i++){
     const aim=clamp(p.x+(i?((b.cycle%2?1:-1)*2.65):0),lo,hi);
     const positions=[aim,...Array.from({length:65},(_,j)=>lo+(hi-lo)*j/64)];
     const pick=positions.filter(x=>lanes.every(m=>Math.abs(m.x-x)>1.38)).sort((x,y)=>Math.abs(x-aim)-Math.abs(y-aim))[0];
     lanes.push({x:pick,painted:0});
    }
    b.marks=lanes.map((lane,i)=>({...lane,y:arena.floor+arena.sky,
     drop:lane.painted?0:.13+(i-2)*.23,age:-1,impact:false,hit:false}));b.cycle++;
    phase('gather');signal('gather');
   }break;
   case 'gather':if(b.t>=times.gather){phase('rain');}break;
   case 'rain':{
    for(const m of b.marks){
     m.age=b.t-m.drop;if(m.age<0)continue;
     const old=m.y;
     // For the two painted bolts, collision follows the same cel as the artwork.
     const cel=Math.min(3,Math.floor(b.t/(times.rain/6)));
     const u=m.painted?(cel===3?1:0):clamp(m.age/.84,0,1);
     m.y=arena.floor+(m.painted?(m.painted===1?[3.05,3.37,2.12,0]:[3.8,4.02,2.20,0])[cel]:arena.sky*(1-u*u));
     if(!m.impact&&!m.hit&&Math.abs(p.x-m.x)<(p.width||.6)/2+.24&&old+.24>=p.y+.09&&m.y-.24<=p.y+(p.height||1.25)){
      m.hit=true;if(!p.dash)damage(1,Math.sign(p.x-m.x)||-1);
     }
     if(u===1&&!m.impact){m.impact=true;signal('impact',m);}
    }
    if(b.t>=times.rain){b.marks=[];b.dir=p.x>=b.x?1:-1;b.swingHit=false;phase('raise');signal('raise');}
    break;
   }
   case 'raise':
    if(b.t>=times.raise){phase('sweep');signal('slam',{x:b.x+arena.staffReach*b.dir,y:arena.floor});}
    break;
   case 'sweep':{
    const reach=(p.x-b.x)*b.dir;
    // First the staff hits the floor; then a low ripple expands from that point.
    const impact=b.t<.16&&reach>-.22&&reach<arena.staffReach+.52&&p.y<arena.floor+1.04;
    const ripple=b.t>=.11&&b.t<.50&&Math.abs(reach-(arena.staffReach+(b.t-.11)*5.4))<.52&&p.y<arena.floor+.54;
    if(!b.swingHit&&!p.dash&&(impact||ripple)){b.swingHit=!!damage(1,b.dir);}
    if(b.t>=times.sweep){phase('expose');signal('expose');}
    break;
   }
   case 'expose':{
    const height=arena.floor+arena.core;
    const reach=(p.height||1.25)+1.20+(p.mods?.reach||0);
    if(p.attackUp&&p.attackPhase==='active'&&p.swingId!==b.lastHit&&Math.abs(b.x-p.x)<1.08&&
       p.y+.55<height+.42&&p.y+reach>height-.42){
     b.lastHit=p.swingId;
     if(b.charges===3){phase('final');signal('final');}
     else {phase('stun');b.orb={x:b.x,y:height};signal('stun');}
    }else if(b.t>=times.expose){phase('idle');}
    break;
   }
   case 'stun':{
    const o=b.orb;
    // Hold long enough to read the complete hit reaction before collecting the charge.
    if(b.t>.36){const ease=1-Math.exp(-dt*4.2);o.x+=(p.x-o.x)*ease;o.y+=(p.y+.70-o.y)*ease;}
    if(b.t>.92&&Math.hypot(o.x-p.x,o.y-p.y-.70)<.60){b.orb=null;b.charges++;phase('recover');signal('charge');}
    break;
   }
   case 'recover':if(b.t>=times.recover)phase('idle');break;
   case 'final':{
    const dx=b.x-p.x;
    const inArc=p.attackUp?Math.abs(dx)<1.05:Math.abs(dx)<.52||
      (dx*(p.attackDirection||p.facing||1)>0&&Math.abs(dx)<1.85+(p.mods?.reach||0));
    if(b.t>.35&&b.charges===3&&p.swingId!==b.lastHit&&p.attackPhase==='active'&&inArc&&p.y<arena.floor+1.6){
     b.won=true;phase('won');signal('win');
    }
    break;
   }
  }
 }
 return {b,arena,tick,reset,get locked(){return locked();}};
}

// The windups end on the same simulation tick as the impact (staff cell 05).
export function mageCel(b,idleClock=0){
 const section=(start,count,duration)=>start+Math.min(count-1,Math.floor(count*b.t/duration));
 switch(b.phase){
  case 'gather':return ['rain',section(0,6,times.gather)];
  case 'rain':return ['rain',section(6,6,times.rain)];
  case 'raise':return ['staff',section(0,5,times.raise)];
  case 'sweep':return ['staff',section(5,7,times.sweep)];
  case 'stun':case 'final':return ['stun',b.t<.84?Math.min(4,Math.floor(b.t*6)):4-Math.floor((b.t-.84)*2.4)%2];
  case 'recover':return ['stun',4-section(0,5,times.recover)];
  default:return ['idle',Math.floor((b.phase==='quiet'?idleClock:b.clock)*4.4)%6];
 }
}
