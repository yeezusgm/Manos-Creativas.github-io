// Offsets from the station in each finished room, in world units. Feet are at
// the collision surface; moths instead get a perch above an optional ledge.
// [name, creature, offset, feet, half patrol, sight, life]
const rooms = {
  root: [
    ['arcada', 'shade', -72.5, 2.20, .62, 2.7, 2],
    ['acueducto', 'moth', -55.25, 6.30, 1.00, 2.7, 2],
    ['mirador', 'stalker', -46.5, 3.90, .88, 3.0, 2],
    ['vidriera', 'sentry', -31.7, 3.50, .80, 3.3, 2],
    // The descending approach, the forge and both sides of its beacon are quiet.
  ],
  water: [
    ['vertiente', 'stalker', -10.75, 4.95, 1.15, 2.9, 2],
    ['hornacina', 'shade', 9.30, 3.64, .95, 3.0, 2],
    ['cauce', 'moth', 19.85, 5.70, .95, 2.6, 2],
    ['restinga', 'shade', 28.30, .72, 1.00, 3.0, 2],
  ],
  abyss: [
    ['fronda', 'sentry', -20.5, 5.00, 1.0, 3.3, 3],
    ['nudo', 'shade', -13.55, 3.66, .72, 2.9, 2],
    ['sotobosque', 'stalker', 6.30, .65, 1.45, 3.0, 3],
    ['dosel-oscuro', 'moth', 12.50, 6.15, 1.0, 2.6, 2],
    ['ceniza', 'hopper', 35.85, .65, 2.1, 3.2, 3],
    ['savia', 'shade', 32.35, 5.42, .67, 2.9, 2],
  ],
  cave: [
    ['grieta', 'moth', 12.90, 5.35, 1.05, 2.6, 2],
    ['gruta', 'stalker', 24.85, .12, 1.80, 3.2, 3],
  ],
  mist: [
    ['atalaya', 'warden', 13.70, 4.80, .92, 2.9, 4],
    ['terrazas', 'moth', 26.50, 7.52, .90, 2.6, 2],
    ['estatua', 'shade', 39.95, .37, 1.05, 3.0, 3],
  ],
  crossing: [
    ['refuerzo', 'stalker', 14.30, .37, 1.65, 3.2, 3],
    ['vigia', 'shade', 10.60, 4.97, .74, 2.6, 2],
  ],
  spire: [
    ['fanal', 'shade', -9.35, 3.48, .85, 3.0, 3],
    ['atrio', 'stalker', -7.90, .35, 1.60, 3.0, 3],
    ['campanario', 'sentry', 12.55, .35, 1.45, 3.5, 3],
    ['aljibe', 'hopper', 20.0, .35, 1.60, 3.0, 3],
  ],
  ossuary: [
    ['fosa', 'shade', -17.55, -1.77, .80, 3.0, 3],
    ['carcel', 'warden', -14.9, -4.90, 1.4, 3.1, 4],
  ],
  archive: [
    ['scriptorium', 'shade', -7.25, 3.36, .88, 3.0, 3],
  ],
};

// The original marsh already guards the short obligatory landings. Its new
// encounters go on the other story of the aqueduct, pan, belfry and nursery.
const marsh = [
  ['contramaestre', 'stalker', 43.25, -2, 1.50, 3.0, 3],
  ['salero', 'moth', 79.65, 5.20, .90, 2.6, 3],
  ['salmuera', 'shade', 87.65, .62, .90, 2.7, 3],
  ['boveda', 'shade', 121.85, 9.60, .70, 2.5, 3],
  ['galeria', 'moth', 153.2, 6.25, .85, 2.5, 3],
  ['contrapeso', 'warden', 155.0, -3.05, 1.35, 2.8, 4],
  ['podador', 'shade', 190.8, 1.64, .88, 2.7, 3],
];

export function addEncounters(level) {
  const ids = new Set(level.enemies.map(e => e.id));
  function add(rows, origin) {
    for (const [name, type, offset, y, half, awareness, hp] of rows) {
      const id = 'via-' + name;
      if (ids.has(id)) continue;
      const x = origin + offset;
      const e = {id, type, x, y, left:x-half, right:x+half, awareness, hp};
      // A shooter sees one gallery at a time, and must telegraph before firing.
      if (type === 'sentry') e.range = awareness - .30;
      level.enemies.push(e);
      ids.add(id);
    }
  }
  for (const [station, rows] of Object.entries(rooms))
    add(rows, level.stations.find(s => s.id === station).x);
  add(marsh, level.plague.start);
  return level;
}
