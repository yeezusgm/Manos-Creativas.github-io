// Geometry comes from the current layout, so the same keys work in a row, grid or column.
const directions={ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0],ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1]};
export const directionFor=code=>directions[code];
export function spatialIndex(boxes,at,[dx,dy]){
 if(!boxes[at])return boxes.length?0:-1;
 const from=boxes[at],x=from.x+from.width/2,y=from.y+from.height/2;
 let best=at,score=Infinity;
 boxes.forEach((r,i)=>{
  const a=r.x+r.width/2-x,b=r.y+r.height/2-y,forward=a*dx+b*dy;
  if(i===at||forward<1)return;
  const cross=Math.abs(dx?b:a),size=(dx?from.height+r.height:from.width+r.width)/2;
  const gap=Math.max(0,cross-size+2);
  const cost=forward+cross*.40+gap*3+gap*gap/Math.max(1,forward);
  if(cost<score){score=cost;best=i;}
 });
 return best;
}
export const cycle=(i,n,step)=>n?((i+step)%n+n)%n:0;
export const focusables=root=>[...root.querySelectorAll('button:not(:disabled), input:not(:disabled), summary, [tabindex="0"]:not(button):not(input)')].filter(b=>b.getClientRects().length&&getComputedStyle(b).visibility!=='hidden');
export const focusOn=el=>el?.focus({preventScroll:true});
export function pageSizes(w,h){
 return {quests:w<365&&h<640?1:h<465?2:w<570?2:h<630?3:h<720?4:5,faros:h<465?3:w<570?4:h<630?5:h<745?6:8};
}
