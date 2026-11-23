export const sections=['objects','charms','quests'];
const names={objects:'Inventario',charms:'Amuletos',quests:'Misiones',travel:'Faros del Eco',map:'Mapa del mundo'};
const marks={
 objects:'<path d="M6 9h16l3 15q-10 5-22 0z M9 9V7a5 5 0 0 1 10 0v2 M7 13h14 M12 17l2-2 2 2-2 3z"/>',
 charms:'<path d="M14 2c-2 6-9 9-9 15a9 9 0 0 0 18 0c0-6-7-9-9-15z M14 10l4 7-4 6-4-6z"/>',
 quests:'<path d="M2 6q7-3 12 1 6-4 12-1v17q-6-2-12 2-6-4-12-2z M14 7v18 M5 12q4-1 6 1m6 0q4-2 6-1 M5 16q4-1 6 1"/>',
 map:'<path d="M3 7l7-4 7 3 8-3v19l-8 4-7-3-7 3z M10 3v20m7-17v20"/>',
 travel:'<path d="M9 22l3-14h4l3 14 M5 25h18 M11 13h6 M10 7l4-5 4 5z M3 9l5 1m12 0 5-1"/>'
};
const icon=id=>'<svg viewBox="0 0 28 28" aria-hidden="true">'+marks[id]+'</svg>';
const corners=['nw','ne','se','sw'].map(pos=>'<svg class="edge-rune '+pos+'" viewBox="0 0 100 72" aria-hidden="true"><path d="M1 69V16l5-7 8-6h82 M5 54V22q0-15 17-15h38 M9 40l5-17 9-8 18-4 M20 5l6 2-6 4-5-3z M5 18l4-4 3 5-5 8z"/><path class="rune-fill" d="m3 3 12 1-7 3-4 8zm27 11 7-5 9 1-10 2z"/></svg>').join('');
const tabs=active=>'<nav class="codex-tabs" aria-label="Secciones del códice"><kbd title="Pestaña anterior">Q</kbd>'+sections.map(id=>'<button type="button" data-inv="'+id+'" aria-pressed="'+(id===active)+'">'+icon(id)+'<span>'+names[id]+'</span></button>').join('')+'<kbd title="Pestaña siguiente">R</kbd></nav>';
const key=(k,v)=>'<span><kbd>'+k+'</kbd> '+v+'</span>';
export function codexFrame(section,body,actions=''){
 const isBook=sections.includes(section);
 const tag=isBook?'CÓDICE DE TOM':section==='map'?'ATLAS DEL VIAJERO':'RED DE SANTUARIOS';
 const paged=['quests','travel','map'].includes(section);
 return '<div class="codex-frame frame-'+section+'">'+corners+'<header class="codex-head"><div class="codex-caption"><small>'+tag+'</small><h2>'+names[section]+'</h2></div>'+(isBook?tabs(section):'<span class="atlas-emblem">'+icon(section)+'</span>')+'</header><div class="codex-body">'+body+'</div><footer class="codex-foot"><div class="codex-keymap" aria-label="Teclas del menú">'+key('WASD / ↑↓←→','Elegir')+key('J / ↵','Aceptar')+(paged?key('Z / X','Página'):'')+key('K / Esc','Volver')+'</div><div class="codex-actions">'+actions+(isBook?'<button id="closebook" type="button">Cerrar</button>':'')+'</div></footer></div>';
}
