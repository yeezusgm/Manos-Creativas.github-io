// Authored in local world units. The west shore meets the floor of the Observatory:
// never pass this room through roadX(), which stretches the older campaign.
export function makePlague(start){
  const at=(x,y)=>({x:start+x,y});
  const body=(a,b,top,h)=>({...at(a,top-h),w:b-a,h,kind:'peste'});
  const stone=(a,b,top,h=3.1)=>body(a,b,top,h);
  const lip=(a,b,top)=>({...body(a,b,top,.24),oneWay:true});
  const gate=(gateId,a,y,top,w=.75)=>({...at(a,y),w,h:top-y,kind:'peste',gateId});
  // These tall screens cross the full chamber. Partial gates below are set flush
  // with the underside of the aqueduct: the upper route is always open.
  const screen=(id,x)=>gate('peste-'+id,x,-16,20);
  const brine=(a,b,top,kind='charca')=>({...at(a,top-(kind==='costras'?.16:1.2)),w:b-a,h:kind==='costras'?.16:1.2,kind});
  const device=(puzzle,n,x,y)=>({id:puzzle+'-'+n,puzzle,role:n==='clue'?'clue':'control',...at(x,y)});
  const lamp=(id,name,x,y)=>({id:'peste-'+id,name,...at(x,y)});
  const cache=(id,type,x,surface)=>({id:'peste-'+id,type,...at(x,surface+.45)});
  const foe=(id,type,x,y,a,b,hp,awareness)=>({id:'peste-'+id,type,...at(x,y),left:start+a,right:start+b,hp,awareness});
  const note=(x,text)=>({x:start+x,text});
  return {
    start,end:start+234,
    sectors:[
      {id:'estero',name:'Estero de las Costras',x:start},
      {id:'sal',name:'Decantaderos de Sal',x:start+55},
      {id:'campanas',name:'Campanario de Cuarentena',x:start+106},
      {id:'injerto',name:'Invernadero del Último Injerto',x:start+161},
    ],
    platforms:[
      // The estuary: stepping stones in a flooded cut, then the broken roof
      // of a drain. The short, low passage can only be unlatched from the east.
      stone(0,9.2,.28),lip(11.35,14.75,1.51),lip(17.2,20.55,.48),
      lip(22.8,26.20,1.58),stone(28.55,33.65,.65),lip(31.3,34.3,2.08),
      stone(32.9,64,-2.0),lip(33.8,36.2,-.80),
      stone(35.8,41.1,3.48,1.44),stone(43.45,50.4,3.13,1.14),
      gate('peste-atajo-esclusa',36.65,-2.05,2.04),
      lip(51.8,55.0,1.38),lip(54.1,57.9,-.25),
      // The settling vats circle a two-story salt pan. Each vat has its own
      // working level, and the low islands lead back to the other two without recall.
      lip(59.7,63.3,-.46),lip(64.55,68.75,1.02),lip(70.15,75.6,2.57),
      lip(78.0,81.3,4.12),lip(64.95,67.25,-2.76),
      stone(69.2,81.35,-4.05),lip(74.6,78.6,-2.53),lip(80.10,84.50,-.95),
      lip(85.7,89.5,.62),lip(83.7,87.25,-3.48),stone(89.85,98.95,-3.60),
      lip(96.45,100.10,-2.13),stone(100.9,105.65,-.82),stone(105,117.1,.28),
      screen('sal',104.45),
      // Quarantine bells: first cross the west basin, then climb back WEST
      // along the open bell shaft. The eastern gallery can also be reached below.
      lip(111.5,115.9,1.90),lip(119.55,123.35,1.80),lip(125.6,129.5,3.38),
      stone(130.6,136.15,4.91,1.54),lip(127.8,131,6.49),
      lip(123.25,126.6,8.02),lip(120.4,123.7,9.60),
      lip(127.75,131.25,9.72),lip(133.3,137.55,10.16),
      lip(139.15,142.75,5.8),lip(145,149.85,6.78),
      lip(151.1,155.35,5.19),lip(154.1,158.0,3.60),lip(156.8,160.8,1.86),
      lip(120.05,123.2,-.18),lip(124.35,127.55,-1.62),stone(128.4,159.4,-3.05),
      gate('peste-atajo-campana',133.5,-3.1,3.37),
      lip(156.65,160.10,-1.65),stone(159.15,167.5,-.35),screen('campanas',160.75),
      // The nursery: descend under the greenhouse to the roots, then double
      // back above the cistern to its inlet. An upper arcade meets a low crossing.
      lip(169.55,172.85,-1.72),lip(174.7,178.2,-3.15),stone(180.35,193.65,-4.50),
      lip(182.55,186.3,-2.95),lip(187.35,191.0,-1.38),lip(183.8,187.15,.23),
      lip(180.0,183.6,1.86),lip(189.15,192.80,1.64),lip(194.65,199.15,.16),
      lip(195.65,198.8,-3.18),lip(200.7,204.5,-2.23),stone(206.4,211.75,-1.02),
      lip(208.35,212.0,.59),stone(212.65,218.1,.42),screen('injerto',215.33),
      lip(220.35,223.75,1.94),stone(225.95,234,1.23),stone(233.15,234,10.20,12.1),
    ],
    hazards:[
      brine(9.2,28.55,-2.72),brine(38.8,40.00,3.61,'costras'),
      brine(64,69.2,-5.72),brine(81.35,89.85,-6.20),brine(98.95,100.90,-5.55),
      brine(117.1,128.4,-4.95),brine(140.6,141.6,5.93,'costras'),
      brine(167.5,180.35,-6.62),brine(193.65,206.4,-6.52),brine(218.1,225.95,-2.48),
    ],
    stations:[lamp('ribera','Embarcadero de las Costras',4.1,.28),lamp('salina','Refugio de la Salina',56.3,-2),
      lamp('relevo','Casa del Relevo',108.1,.28),lamp('vivero','Umbral del Vivero',163.4,-.35)],
    checkpoints:[at(4.1,.28),at(56.3,-2),at(108.1,.28),at(163.4,-.35)],
    devices:[
      device('sal','clue',60.0,-2),device('sal',0,72.40,2.57),device('sal',1,82.0,-.95),device('sal',2,93.7,-3.60),
      device('campanas','clue',110.7,.28),device('campanas',0,113.55,1.90),device('campanas',1,132.25,4.91),
      device('campanas',2,125.15,8.02),device('campanas',3,147.05,6.78),
      device('injerto','clue',181.9,-4.50),device('injerto',0,181.8,1.86),device('injerto',1,196.85,.16),device('injerto',2,210.8,.59),
    ],
    shortcuts:[
      {id:'peste-atajo-esclusa',name:'Desagüe del Estero',...at(52.35,-2)},
      {id:'peste-atajo-campana',name:'Galería de los Contrapesos',...at(149.3,-3.05)},
    ],
    pickups:[
      cache('ribera-fruto','apple',7.9,.28),cache('peaje','crystal',18.7,.48),
      cache('tejado','crystal',46.8,3.13),cache('reserva','apple',51.1,-2),
      cache('sal-alta','crystal',79.7,4.12),cache('sal-baja','apple',71.1,-4.05),
      cache('espita','crystal',87.7,.62),cache('caldero','apple',96,-3.60),
      cache('badajo','crystal',121.5,9.60),cache('linterna','crystal',135.6,10.16),
      cache('cebado','apple',138,-3.05),cache('cobre','crystal',153.5,5.19),
      cache('bulbo','apple',178.0,-3.15),cache('tallo','crystal',190.35,1.64),
      cache('rama','apple',207.5,-1.02),cache('flor','crystal',222,1.94),
    ],
    // Leave the inscriptions, beacon pads, vat valves and narrow landings quiet.
    enemies:[
      foe('barquero','moth',19.8,2.25,17.7,22.1,4,3),
      foe('techo','stalker',46.8,3.13,44.1,49.5,4,3.4),
      foe('lodo','hopper',76,-4.05,72.4,80.35,4,3),
      foe('atrio','moth',98.75,.45,97.6,100.2,4,2.8),
      foe('campanero','moth',135.2,11.20,133.8,137.1,4,3.2),
      foe('cerrojo','shade',141,-3.05,137.1,144.2,4,3.2),
      foe('espora','moth',171.2,.48,169.7,173,4,3),
      foe('raicero','hopper',189.4,-4.50,186.25,192.55,4,3.1),
      foe('corola','moth',203.6,.55,201.7,205.95,4,2.8),
    ],
    props:[],
    tutorials:[
      note(0,'Marjal de la Peste · Salta entre las piedras. Evita la salmuera y las costras de espinas.'),
      note(29,'El acueducto tiene dos pasos: el tejado y un desagüe que se abre desde el otro lado.'),
      note(55,'Tres cubas a distintas alturas comparten la misma agua. Busca la inscripción.'),
      note(106,'Sigue las cuerdas: una repisa más alta puede quedar detrás de ti.'),
      note(150,'Busca abajo la palanca de los contrapesos para abrir el paso de vuelta.'),
      note(161,'Desciende por las raíces. Las ruedas del injerto están repartidas sobre el vivero.'),
      note(217,'El aire vuelve a oler a tierra. El altar está al otro lado del último estanque.'),
    ],
    exit:at(230.55,1.23),
  };
}
