// This is a view of the story's own state. Opening the journal cannot accept
// an errand, collect a reward, or invent progress for an older save.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=(x,min,max)=>Math.min(max,Math.max(min,Number.isFinite(x)?Math.floor(x):min));
const has=(set,key)=>set instanceof Set?set.has(key):Array.isArray(set)&&set.includes(key);
const setSize=set=>set instanceof Set?set.size:Array.isArray(set)?set.length:0;

export function questEntries({sword=false,journey={},marsh={},won=false,complete=false,secondWon,errands=[],jobs=[],level={}}={}){
  const entries=[];
  const locks=(level.puzzles??[]).map(p=>p.id),relics=(level.relics??[]).map(r=>r.id);
  const passed=locks.filter(id=>has(journey.cleared,id)).length,found=relics.filter(id=>has(journey.relics,id)).length;
  const wetLocks=['sal','campanas','injerto'],wetOpen=wetLocks.filter(id=>has(marsh.solved,id)).length;
  const entering=setSize(marsh.seen)>0||wetOpen>0;
  const firstLock=locks.find(id=>!has(journey.cleared,id));
  const firstWet=wetLocks.find(id=>!has(marsh.solved,id));
  const wetGoal={
    sal:['Decantaderos de Sal','Lee la inscripción junto a las cubas. Reparte el agua para abrir la compuerta de los decantaderos.'],
    campanas:['Campanario de Cuarentena','Sube a las cuerdas del campanario. El epitafio indica qué campanas deben quedar sonando.'],
    injerto:['Invernadero del Último Injerto','Sigue las raíces hasta el invernadero. Conecta los injertos para que la savia llegue a las dos flores.']
  };
  const locksDone=locks.length>0&&passed===locks.length,relicsDone=relics.length>0&&found===relics.length;
  const tally=(value,max,label)=>({value,max,label});
  // Only the next unfinished main objective is disclosed. Completed objectives
  // remain individually readable, including on migrated or out-of-order saves.
  let next=false;
  function story(id,title,verb,seal,site,goal,record,done,meter,benefit=''){
    if(next&&!done)return;
    if(!done)next=true;
    entries.push({id,kind:'main',title,verb,seal,site,description:done?record:goal,done:!!done,meter,benefit});
  }
  story('espada','La llamada del Eco','BUSCA','blade','Santuario del Eco',
    'Sigue el sendero del bosque hasta el santuario. Acércate al altar y toma la espada que llama a Tom.',
    'Tom encontró la Espada del Abismo en el santuario. Al tomarla, el bosque perdió su luz.',sword);
  story('runas','Las puertas del abismo','DESCIFRA','rune',firstLock==='water'?'Cisternas del Velo':'Raíces del Abismo',
    firstLock==='water'?'Encuentra la inscripción de las Cisternas. Sus palabras te guiarán hasta las runas de la primera compuerta.':'Busca la inscripción entre las raíces. Activa sus runas para abrir el Sello del Abismo.',
    'La Compuerta del Velo y el Sello del Abismo cedieron. El camino más allá de las raíces quedó abierto.',
    locksDone,tally(passed,locks.length||2,'Compuertas abiertas'));
  const missingCrystal=!has(journey.relics,'bell'),missingBone=!has(journey.relics,'bone');
  story('sellos','Los sellos del Cruce','REÚNE','twin',found===0||relicsDone?'Cruce de las Linternas':missingCrystal?'Campanario de Vidrio':'Galerías del Osario',
    missingCrystal&&missingBone?'Desde el Cruce, sube al campanario y desciende al osario. Cada camino guarda uno de los dos sellos.':
      missingCrystal?'Ya tienes el Sello de Hueso. Sube a las galerías altas del Campanario de Vidrio para encontrar el del Cristal.':'Ya tienes el Sello del Cristal. Desciende a las Galerías del Osario para recuperar el de Hueso.',
    'Tom reunió los sellos del Cristal y de Hueso. Juntos abrieron el paso al Archivo del Ocaso.',
    relicsDone,tally(found,relics.length||2,'Sellos reunidos'));
  story('mago','El Astrónomo Hueco','VENCE','eclipse','Observatorio del Eclipse',
    'Cruza el Archivo del Ocaso hacia el este. El Mago Oscuro te espera en el Observatorio del Eclipse.',
    'El Mago Oscuro cayó. La espada conserva su eco y la reja oriental del Observatorio está abierta.',won,null,'Quinta ranura de amuleto');
  story('umbral-peste','La orilla de la peste','EXPLORA','estuary','Reja oriental del Observatorio',
    'Desde la arena, camina hacia la derecha. Al otro lado de la reja empieza el Marjal de la Peste.',
    'Al otro lado del Observatorio, Tom alcanzó el Estero de las Costras. El Marjal se abre ante él.',entering);
  story('compuertas-peste','Las aguas del Marjal','RESTAURA','branches',wetGoal[firstWet]?.[0]??'Marjal de la Peste',
    wetGoal[firstWet]?.[1]??'Sigue la corriente hasta el invernadero.',
    'Los vasos quedaron en equilibrio, el carillón volvió a sonar y la savia alcanzó las flores.',
    wetOpen===3,tally(wetOpen,3,'Mecanismos resueltos'));
  story('regreso','Devolver la espada','DEVUELVE','return','Invernadero del Último Injerto',
    'Al este del vivero, cruza el último estanque. Deposita la espada en el altar junto a las flores.',
    'Tom devolvió la Espada del Abismo a su origen. La corriente volvió al Marjal y el bosque recuperó su voz.',complete);

  for(const [i,job] of jobs.entries()){
    const phase=errands[i];
    if(![1,2,3].includes(phase))continue;
    const ember=job.dest==='forest',done=phase===3;
    const step=done||phase===2?2:1;
    const site=phase===1?job.where:'Nara · Santuario o Cruce';
    const collect=ember?'Examina el faro del Bosque de la Vigilia para recoger brasas para el farol de Nara.':'Examina el faro de las Cisternas del Velo para recoger la muestra de agua que te pidió Nara.';
    const give=ember?'Lleva las brasas a Nara y elige «Encargos de Nara» para entregárselas.':'Lleva la muestra a Nara y elige «Encargos de Nara» para entregársela.';
    const finished=ember?'Entregaste las brasas. El farol de Nara volvió a arder.':'Nara recibió la muestra de agua limpia de las Cisternas.';
    entries.push({id:'nara-'+job.dest,kind:'side',title:job.title,verb:done?'ENTREGA':phase===2?'REGRESA':'REÚNE',seal:ember?'lantern':'vial',site,
      done,description:done?finished:phase===2?give:collect,meter:tally(done?2:step-1,2,'Recoger y entregar'),benefit:job.reward+' Nux'});
  }
  // The Cantora already awards the sixth slot in the campaign. Her optional
  // hunt appears only after the Mage, and only in hosts that track her outcome.
  if((won||secondWon===true)&&typeof secondWon==='boolean')entries.push({id:'cantora',kind:'side',title:'La Cantora del Osario',verb:'CAZA',seal:'cantora',
    site:'Galerías del Osario',description:secondWon?'El canto se apagó en las galerías. Tom ya puede llevar seis amuletos a la vez.':
    'Vuelve a las Galerías del Osario. Busca a la Cantora en el fondo del pozo y derrota a la guardiana.',
    done:secondWon,meter:null,benefit:'Sexta ranura de amuleto'});
  return entries;
}

// Ten hand-drawn seals use the visual language of Tom's blade: split quillons,
// faceted stones and a small four-point lozenge, rather than controller glyphs.
const seals={
 blade:['#d998ef','#4d245f',
  '<path class="shade" d="M6 42q9 1 16-12l-1 13 8-5-4 14-11-2zM58 42q-9 1-16-12l1 13-8-5 4 14 11-2z"/><path class="light" d="m32 5 5 8-3 25-3 7-2-30z"/><path class="glass" d="m32 6 1 9-1 23-4-3 1-20z"/><path class="edge" d="m17 36 6 1 9 4 9-4 6-1-5 6-9 3-10-3z"/><path class="shade" d="m30 44 4-1 1 11-3 5-3-5z"/><path class="line" d="m31 46 3 2-4 2 4 2"/>'],
 rune:['#94d8cf','#234e52',
  '<path class="shade" d="M8 47q7-15 20-13L22 24l10-16 10 16-6 10q14-1 20 13l-11 7-13-6-13 6z"/><path class="glass" d="m32 14 6 11-6 12-6-12zM15 46l5-7 10 3-5 7zm34 0-5-7-10 3 5 7z"/><path class="line" d="m32 18-2 7 2 7m-14 12 6-2m22 2-6-2"/><path class="light" d="m32 41 4 6-4 7-4-7z"/>'],
 twin:['#b4c8ef','#424163',
  '<path class="shade" d="M7 42q13 4 17-8l4 10 5 5-9 5-12-4zm50 0q-12 6-15-4l-6 7-5 6 8 3 12-4z"/><path class="glass" d="m17 18 8-6 6 7-3 17-8 7-6-11z"/><path class="line" d="m25 14 1 9-5 16m-6-12 11-4 4-3"/><path class="light" d="M42 16q-5-5-6 0-1 4 3 6l2 14q-4 3-1 5 3 3 5-1 4 2 6-1 1-3-4-4l-3-14q4-2 3-5-2-3-5 0z"/>'],
 eclipse:['#dd9cab','#552f51',
  '<path class="shade" d="M7 31q10-16 25-16t25 16Q46 46 32 47 17 46 7 31z"/><circle cx="32" cy="31" r="11" class="glass"/><path fill="#1c1727" d="M34 20a10 10 0 1 0 8 13q-12 5-12-6 0-5 4-7z"/><path class="line" d="m32 8 0 6M14 15l5 5m26 0 5-5M32 47v8"/><path class="light" d="m42 23 1 3 4 1-4 2-1 3-2-3-3-2 3-1z"/>'],
 estuary:['#b4cc91','#45503c',
  '<path class="shade" d="M7 36q13 2 25-4 12 6 25 4-3 12-25 14Q11 48 7 36z"/><path class="line" d="M11 40q12 1 21-5 11 6 21 5M16 51q6-2 12 0t13 1m-21 4 7-1m9 3 8-2"/><path class="glass" d="M29 34V13q-9 4-12 19l11-4zm5-1 1-17 12 14-10 1z"/><path class="light" d="m29 14 3-6 3 6-3 5z"/>'],
 branches:['#abc88c','#3d4c3a',
  '<path class="shade" d="m31 51-4-9 2-10-9-4-4-8 7 3 6 6 3-13 3 16 7-4 5-7 2 7-8 8-6 3-1 9 5 3-5 1-3 6-3-6-6 2z"/><path class="glass" d="M19 27Q7 27 9 13q12 1 10 14zm12-5Q22 10 32 6q7 8-1 16zm14 12q-3-13 11-15-1 12-11 15z"/><path class="line" d="m13 19 6 8m32-3-6 10M32 19v26"/>'],
 return:['#e7c785','#584149',
  '<path class="shade" d="M9 43q9 3 15 0l8-5 8 5q7 2 15-1l-6 10-13 2-4 5-4-5-14-2z"/><path class="glass" d="m32 47-5-8 3-16 2-5 3 7 1 14z"/><path class="edge" d="m19 19 7-2 6 3 6-3 7 2-6 2-7 4-7-4z"/><path class="light" d="m30 17 1-9 2-3 2 3-1 9-2 2z"/><path class="line" d="m20 47 7 1 5 4 5-4 8-1"/>'],
 lantern:['#edb37f','#794453',
  '<path class="shade" d="m18 26 5-5 9-6 9 6 5 5-4 3-2 16 4 4-12 5-13-5 4-4-3-16z"/><path class="line" d="M26 20v-6q0-8 6-8t6 8v6"/><path class="glass" d="M23 28h18l-3 16-6 4-6-4z"/><path class="light" d="M28 40q-1-5 4-10 0 4 3 6 3 5 0 7-6 3-7-3z"/><path class="line" d="M23 26h18m-16 21 7 3 7-3"/>'],
 vial:['#90cfd7','#315165',
  '<path class="shade" d="M24 13q8-2 16 0l-1 6-3 2 1 6 9 10q4 9-2 13-10 7-23 0-6-5-2-13l9-10 1-6-5-3z"/><path class="glass" d="M23 36q6-4 11-1t9 0q8 14-9 15-18 0-11-14z"/><path class="line" d="M26 16h12m-10 5h8m-11 19-2 4 2 2"/><path class="light" d="m43 16 1-7 4-4 2 6-2 5z"/>'],
 cantora:['#dd9cab','#573751',
  '<path class="shade" d="m10 42 10-14 4-13 8 7 8-7 4 13 10 14-8 2-5 7-9 5-9-5-5-7z"/><path class="glass" d="m21 37 5-11 6 5 6-5 5 11-4 9-7 4-7-4z"/><path class="line" d="m22 35 8 2-4 3m16-5-8 2 4 3m-8 3h4"/><path class="light" d="m31 23-2-8 3-8 3 8-2 8z"/>']
};
function badge(id,extra=''){
  const [accent,shadow,drawing]=seals[id]??seals.blade;
  return '<svg aria-hidden="true" focusable="false" viewBox="0 0 64 64" class="cm-seal '+extra+'" style="--cm-tint:'+accent+';--cm-spirit:'+shadow+'"><path class="rim" d="M31.8 1 37 6.8q8 .8 14 8.5l6.1 1.2-1 8.8 3.2 6.6-4.5 8.2.3 7.4-6.8 3.2q-5 5.2-12 7.2l-4.5 5.1-4.5-5.1q-7-2-12-7.2l-6.8-3.2.3-7.4L4.3 32l3.2-6.6-1-8.8 6.1-1.2q6-7.7 14-8.5z"/><path class="etch" d="M23 10Q8 17 11 34m42 0q3-17-12-24M13 43q6 10 15 12m8 0q9-2 15-12"/>'+drawing+'</svg>';
}
const bound=(x,a,b)=>Math.min(b,Math.max(a,x));
function card(q,selected,hero){
 const acc=(seals[q.seal]??seals.blade)[0];
 const p=q.meter?.max>1&&!q.done?'<span class="cm-mini" aria-hidden="true"><i style="width:'+bound(100*q.meter.value/q.meter.max,0,100)+'%"></i></span>':'';
 return '<button type="button" class="cm-card'+(hero?' cm-hero':'')+(q.done?' cm-finished':'')+'" style="--cm-accent:'+acc+'" data-quest="'+esc(q.id)+'" aria-pressed="'+String(q.id===selected)+'" aria-label="'+esc(q.title+(q.done?', completada':q.kind==='main'?', misión principal':', misión secundaria'))+'">'+badge(q.seal)+'<span class="cm-card-word"><small>'+esc(q.verb)+'</small><strong>'+esc(q.title)+'</strong>'+p+'</span>'+(q.done?'<span class="cm-written" aria-hidden="true">✓</span>':'')+'</button>';
}
function group(label,cls,items,selected){
 if(!items.length)return '';
 return '<section class="cm-group '+cls+'" aria-label="'+label+'"><h3 class="cm-rubric"><i aria-hidden="true"></i><span>'+label+'</span><i aria-hidden="true"></i></h3><div class="cm-cards">'+items.map(q=>card(q,selected,cls==='cm-main')).join('')+'</div></section>';
}
function details(q){
 if(!q)return '<aside class="cm-detail cm-no-detail" aria-label="Detalle de misión"><span class="cm-diamond" aria-hidden="true">◇</span><h3>El diario está al día</h3><p>Puedes releer las misiones completadas.</p></aside>';
 const kind=q.kind==='main'?'Misión principal':'Misión secundaria';
 const meter=q.meter?.max>1?'<div class="cm-progress"><span>'+esc(q.meter.label)+'</span><strong>'+q.meter.value+' / '+q.meter.max+'</strong><progress value="'+q.meter.value+'" max="'+q.meter.max+'" aria-label="'+esc(q.meter.label)+'"></progress></div>':'';
 const benefit=q.benefit?'<div class="cm-detail-station"><small>'+(q.done?'Recompensa obtenida':'Recompensa')+'</small><span>'+esc(q.benefit)+'</span></div>':'';
 return '<article class="cm-detail'+(q.done?' cm-archived':'')+'" aria-label="Detalle de misión" style="--cm-accent:'+(seals[q.seal]??seals.blade)[0]+'">'+badge(q.seal,'cm-watermark')+'<div class="cm-dtext"><small class="cm-detail-tag">'+kind+(q.done?' · Completada':'')+'</small><h3>'+esc(q.title)+'</h3><p>'+esc(q.description)+'</p></div><div class="cm-detail-foot">'+meter+'<div class="cm-detail-meta"><div class="cm-detail-station"><small>Lugar</small><span>'+esc(q.site)+'</span></div>'+benefit+'</div></div></article>';
}
const chev=(right)=>'<svg viewBox="0 0 18 18" aria-hidden="true"><path d="'+(right?'M6.5 3.5 12 9l-5.5 5.5':'m11.5 3.5-5.5 5.5 5.5 5.5')+'" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
export function questView(entries,{selected,showDone=false,page,size=4}={}){
 const active=entries.filter(q=>!q.done),done=entries.filter(q=>q.done).reverse(),all=showDone?[...active,...done]:active;
 size=n(size,1,20);const pages=Math.max(1,Math.ceil(all.length/size));
 const selectedIndex=all.findIndex(q=>q.id===selected);
 const pg=n(page??(selectedIndex<0?0:Math.floor(selectedIndex/size)),0,pages-1);
 const visible=all.slice(pg*size,pg*size+size),sel=visible.find(q=>q.id===selected)??visible[0]??null;
 const sid=sel?.id??null;
 const mains=visible.filter(q=>!q.done&&q.kind==='main'),side=visible.filter(q=>!q.done&&q.kind==='side'),closed=visible.filter(q=>q.done);
 const notes=!visible.length?'<div class="cm-empty"><span aria-hidden="true">✧</span><p>No quedan misiones en curso.</p></div>':
   !showDone&&mains.length&&!active.some(q=>q.kind==='side')?'<p class="cm-unwritten">Aún no tienes encargos en curso.</p>':'';
 const archiveBtn='<button type="button" class="cm-archive" data-done aria-pressed="'+String(!!showDone)+'" '+(done.length?'':'disabled')+'><svg viewBox="0 0 22 20" aria-hidden="true"><path d="M3.5 4.5h15v3h-15zm1 4 1 8h11l1-8M9 11h4" fill="none" stroke="currentColor" stroke-width="1.3"/></svg><span>'+(showDone?'Ocultar':'Mostrar')+' completadas</span><b>'+done.length+'</b></button>';
 const pager=pages>1?'<div class="cm-pager" role="group" aria-label="Páginas de misiones"><button type="button" data-qpage="-1" aria-label="Página anterior de misiones" '+(pg===0?'disabled':'')+'>'+chev(false)+'</button><span>Pág. '+(pg+1)+' / '+pages+'</span><button type="button" data-qpage="1" aria-label="Página siguiente de misiones" '+(pg===pages-1?'disabled':'')+'>'+chev(true)+'</button></div>':'';
 const html='<section class="codex-missions" aria-label="Diario de misiones"><div class="cm-body"><div class="cm-ledger">'+group('Historia principal','cm-main',mains,sid)+group('Secundarias','cm-side',side,sid)+group('Completadas','cm-past',closed,sid)+notes+'</div>'+details(sel)+'</div><div class="cm-bottom">'+archiveBtn+pager+'</div></section>';
 return {html,selected:sid,page:pg,pages,visibleIds:visible.map(q=>q.id)};
}
