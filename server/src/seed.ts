import { randomBytes } from 'node:crypto';
import { all, get, run } from './db.js';
import { GAME_START } from './config.js';

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function rect(lon: number, lat: number, width: number, height: number): string {
  const w = width / 2;
  const h = height / 2;
  return JSON.stringify({
    type: 'Polygon',
    coordinates: [
      [
        [lon - w, lat - h],
        [lon + w, lat - h],
        [lon + w, lat + h],
        [lon - w, lat + h],
        [lon - w, lat - h],
      ],
    ],
  });
}

const REGIONS: Array<[number, string, string]> = [
  [1, 'Western Europe', 'أوروبا الغربية'],
  [2, 'Eastern Europe', 'أوروبا الشرقية'],
  [3, 'Balkans and Anatolia', 'البلقان والأناضول'],
  [4, 'Middle East and Persia', 'الشرق الأوسط وفارس'],
  [5, 'Caucasus and Central Asia', 'القوقاز وآسيا الوسطى'],
  [6, 'Siberia and the Far East', 'سيبيريا والشرق الأقصى'],
  [7, 'South Asia', 'جنوب آسيا'],
  [8, 'East Asia', 'شرق آسيا'],
  [9, 'Southeast Asia', 'جنوب شرق آسيا'],
  [10, 'North Africa', 'شمال أفريقيا'],
  [11, 'West Africa', 'غرب أفريقيا'],
  [12, 'Central and East Africa', 'وسط وشرق أفريقيا'],
  [13, 'Southern Africa', 'الجنوب الأفريقي'],
  [14, 'North America', 'أمريكا الشمالية'],
  [15, 'Latin America and the Caribbean', 'أمريكا اللاتينية والكاريبي'],
  [16, 'Oceania', 'أوقيانوسيا'],
];

const STATES: Array<{
  id: string;
  name: string;
  nameAr: string;
  system: string;
  color: string;
  treasury: number;
  industry: number;
  agriculture: number;
  npc: number;
}> = [
  { id: 'ottoman', name: 'Ottoman Empire', nameAr: 'الدولة العثمانية', system: 'constitutional_monarchy', color: '#2e7d5b', treasury: 1200, industry: 18, agriculture: 62, npc: 0 },
  { id: 'britain', name: 'United Kingdom', nameAr: 'المملكة المتحدة', system: 'constitutional_monarchy', color: '#c0392b', treasury: 4200, industry: 78, agriculture: 30, npc: 1 },
  { id: 'france', name: 'French Republic', nameAr: 'الجمهورية الفرنسية', system: 'republic', color: '#2f6fb0', treasury: 3600, industry: 66, agriculture: 40, npc: 1 },
  { id: 'germany', name: 'German Empire', nameAr: 'الإمبراطورية الألمانية', system: 'constitutional_monarchy', color: '#4a4a4a', treasury: 4000, industry: 82, agriculture: 34, npc: 1 },
  { id: 'russia', name: 'Russian Empire', nameAr: 'الإمبراطورية الروسية', system: 'autocracy', color: '#3f7d4f', treasury: 2800, industry: 40, agriculture: 70, npc: 1 },
  { id: 'austria', name: 'Austria-Hungary', nameAr: 'الإمبراطورية النمساوية المجرية', system: 'dual_monarchy', color: '#b08a2e', treasury: 2200, industry: 48, agriculture: 55, npc: 1 },
  { id: 'italy', name: 'Kingdom of Italy', nameAr: 'مملكة إيطاليا', system: 'constitutional_monarchy', color: '#5b8c3a', treasury: 1500, industry: 32, agriculture: 50, npc: 1 },
  { id: 'usa', name: 'United States', nameAr: 'الولايات المتحدة', system: 'republic', color: '#2f5f9e', treasury: 5200, industry: 90, agriculture: 60, npc: 1 },
  { id: 'japan', name: 'Empire of Japan', nameAr: 'إمبراطورية اليابان', system: 'constitutional_monarchy', color: '#9e2f4f', treasury: 1400, industry: 30, agriculture: 45, npc: 1 },
  { id: 'persia', name: 'Qajar Persia', nameAr: 'فارس القاجارية', system: 'monarchy', color: '#7a5c2e', treasury: 400, industry: 6, agriculture: 55, npc: 1 },
];

interface SeedProvince {
  id: string;
  region: number;
  owner: string | null;
  name: string;
  nameAr: string;
  sea?: boolean;
  terrain: string;
  population: number;
  loyalty: number;
  area: number;
  lon: number;
  lat: number;
  w: number;
  h: number;
  neighbors: string[];
  resources: string[];
  settlements: Array<[string, string, string, number, number]>;
}

const PROVINCES: SeedProvince[] = [
  {
    id: 'tr_damascus', region: 4, owner: 'ottoman', name: 'Damascus', nameAr: 'دمشق',
    terrain: 'plain', population: 620000, loyalty: 62, area: 22000, lon: 36.3, lat: 33.5, w: 2.2, h: 1.6,
    neighbors: ['tr_beirut', 'tr_jerusalem', 'tr_baghdad'], resources: ['grain', 'textiles'],
    settlements: [[' Damascus', 'دمشق', 'city', 180000, 68], [' Homs', 'حمص', 'town', 42000, 60]],
  },
  {
    id: 'tr_beirut', region: 4, owner: 'ottoman', name: 'Beirut', nameAr: 'بيروت',
    terrain: 'coast', population: 410000, loyalty: 58, area: 11000, lon: 35.6, lat: 33.9, w: 1.2, h: 1.8,
    neighbors: ['tr_damascus', 'sea_east_med'], resources: ['silk', 'trade'],
    settlements: [[' Beirut', 'بيروت', 'city', 120000, 60], [' Sidon', 'صيدا', 'town', 25000, 55]],
  },
  {
    id: 'tr_jerusalem', region: 4, owner: 'ottoman', name: 'Jerusalem', nameAr: 'القدس',
    terrain: 'hills', population: 380000, loyalty: 54, area: 15000, lon: 35.2, lat: 31.8, w: 1.6, h: 1.4,
    neighbors: ['tr_damascus', 'tr_hejaz', 'sea_east_med'], resources: ['olives', 'pilgrimage'],
    settlements: [[' Jerusalem', 'القدس', 'city', 70000, 58], [' Jaffa', 'يافا', 'town', 35000, 55]],
  },
  {
    id: 'tr_baghdad', region: 4, owner: 'ottoman', name: 'Baghdad', nameAr: 'بغداد',
    terrain: 'plain', population: 520000, loyalty: 56, area: 32000, lon: 44.4, lat: 33.3, w: 2.6, h: 2.0,
    neighbors: ['tr_damascus', 'tr_mosul', 'tr_basra'], resources: ['dates', 'grain'],
    settlements: [[' Baghdad', 'بغداد', 'city', 140000, 60], [' Karbala', 'كربلاء', 'town', 50000, 62]],
  },
  {
    id: 'tr_mosul', region: 4, owner: 'ottoman', name: 'Mosul', nameAr: 'الموصل',
    terrain: 'hills', population: 340000, loyalty: 52, area: 26000, lon: 43.1, lat: 36.3, w: 2.4, h: 2.0,
    neighbors: ['tr_baghdad', 'tr_basra'], resources: ['oil', 'grain'],
    settlements: [[' Mosul', 'الموصل', 'city', 90000, 54], [' Kirkuk', 'كركوك', 'town', 30000, 50]],
  },
  {
    id: 'tr_basra', region: 4, owner: 'ottoman', name: 'Basra', nameAr: 'البصرة',
    terrain: 'marsh', population: 290000, loyalty: 50, area: 28000, lon: 47.8, lat: 30.5, w: 2.4, h: 2.0,
    neighbors: ['tr_baghdad', 'tr_mosul', 'sea_persian_gulf'], resources: ['dates', 'trade'],
    settlements: [[' Basra', 'البصرة', 'city', 80000, 52], [' Nasiriyah', 'الناصرية', 'town', 22000, 48]],
  },
  {
    id: 'tr_hejaz', region: 4, owner: 'ottoman', name: 'Hejaz', nameAr: 'الحجاز',
    terrain: 'desert', population: 210000, loyalty: 48, area: 48000, lon: 39.6, lat: 24.0, w: 3.2, h: 3.0,
    neighbors: ['tr_jerusalem', 'sea_red_sea'], resources: ['pilgrimage', 'trade'],
    settlements: [[' Mecca', 'مكة', 'city', 60000, 55], [' Medina', 'المدينة', 'city', 45000, 52]],
  },
  {
    id: 'sea_east_med', region: 4, owner: null, name: 'Eastern Mediterranean', nameAr: 'شرق المتوسط', sea: true,
    terrain: 'sea', population: 0, loyalty: 0, area: 320000, lon: 33.5, lat: 33.0, w: 6.0, h: 4.5,
    neighbors: ['tr_beirut', 'tr_jerusalem'], resources: ['fishing', 'trade_route'],
    settlements: [],
  },
  {
    id: 'sea_red_sea', region: 4, owner: null, name: 'Red Sea', nameAr: 'البحر الأحمر', sea: true,
    terrain: 'sea', population: 0, loyalty: 0, area: 260000, lon: 38.0, lat: 20.0, w: 5.0, h: 6.0,
    neighbors: ['tr_hejaz'], resources: ['trade_route'],
    settlements: [],
  },
  {
    id: 'sea_persian_gulf', region: 4, owner: null, name: 'Persian Gulf', nameAr: 'الخليج العربي', sea: true,
    terrain: 'sea', population: 0, loyalty: 0, area: 240000, lon: 51.0, lat: 26.0, w: 5.0, h: 4.0,
    neighbors: ['tr_basra', 'tr_mosul'], resources: ['trade_route'],
    settlements: [],
  },
];

/** Seed a minimal 1900 world the first time the server boots. */
export function seedIfEmpty(): boolean {
  const existing = get<{ c: number }>('SELECT COUNT(*) AS c FROM game');
  if (existing && existing.c > 0) return false;

  const now = new Date().toISOString();
  run(
    'INSERT INTO game (id, name, game_time, real_started_at, tick_minutes) VALUES (1, ?, ?, ?, 30)',
    'Malines 1900',
    GAME_START,
    Date.now(),
  );

  for (const [regionId, name, nameAr] of REGIONS) {
    run('INSERT OR IGNORE INTO regions (id, name, name_ar) VALUES (?, ?, ?)', regionId, name, nameAr);
  }

  for (const state of STATES) {
    run(
      `INSERT INTO states (id, name, name_ar, political_system, color, treasury, industry, agriculture, stability, legitimacy, is_npc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 55, 60, ?)`,
      state.id, state.name, state.nameAr, state.system, state.color,
      state.treasury, state.industry, state.agriculture, state.npc,
    );
  }

  for (const province of PROVINCES) {
    run(
      `INSERT INTO provinces (id, region_id, owner_id, controller_id, name, name_ar, is_sea, terrain, population,
        loyalty, unrest, area_km2, geometry, neighbors, resources, infrastructure, garrison, contested, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 12, ?, ?, ?, ?, ?, ?, 0, ?)`,
      province.id, province.region, province.owner, province.owner, province.name, province.nameAr,
      province.sea ? 1 : 0, province.terrain, province.population, province.loyalty, province.area,
      rect(province.lon, province.lat, province.w, province.h),
      JSON.stringify(province.neighbors),
      JSON.stringify(province.resources),
      JSON.stringify({ roads: 2, rail: 0, telegraph: 1 }),
      province.sea ? 0 : Math.round(province.population / 200),
      now,
    );

    for (const [name, nameAr, kind, population, loyalty] of province.settlements) {
      run(
        'INSERT INTO settlements (id, province_id, name, name_ar, kind, population, loyalty) VALUES (?, ?, ?, ?, ?, ?, ?)',
        id('st'), province.id, name, nameAr, kind, population, loyalty,
      );
    }
  }

  run(
    `INSERT INTO units (id, state_id, province_id, name, kind, strength, morale, supply, training, experience, equipment, demographics, commander)
     VALUES (?, 'ottoman', 'tr_damascus', 'الجيش السابع', 'infantry', 84000, 62, 0.55, 55, 12, ?, ?, ?)`,
    id('unit'),
    JSON.stringify([{ kind: 'rifle', model: 'Mauser 1890', count: 70000 }]),
    JSON.stringify({ avgAge: 24, malePct: 100, ethnicities: { arab: 62, turk: 22, kurd: 9, other: 7 }, loyaltyIndex: 58 }),
    'أحمد باشا',
  );

  run(
    'INSERT INTO players (id, handle, state_id, role, created_at) VALUES (?, ?, ?, ?, ?)',
    'player_admin', 'admin', 'ottoman', 'sultan', Date.now(),
  );

  run(
    'INSERT INTO leaders (id, state_id, name, title, born, traits) VALUES (?, ?, ?, ?, ?, ?)',
    'leader_abdulhamid', 'ottoman', 'عبد الحميد الثاني', 'السلطان', '1842', JSON.stringify({ caution: 0.7, diplomacy: 0.6 }),
  );

  run(
    'INSERT INTO memory (id, state_id, target_id, kind, weight, note, game_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id('mem'), 'ottoman', 'britain', 'occupation', -35, 'احتلال قبرص 1878', GAME_START,
  );

  run(
    'INSERT INTO events (id, game_time, kind, payload, created_at) VALUES (?, ?, ?, ?, ?)',
    id('evt'), GAME_START, 'game_start', JSON.stringify({ note: 'بداية اللعبة' }), Date.now(),
  );

  return true;
}

export function worldStats(): { states: number; provinces: number; units: number } {
  return {
    states: all<{ c: number }>('SELECT COUNT(*) AS c FROM states')[0]?.c ?? 0,
    provinces: all<{ c: number }>('SELECT COUNT(*) AS c FROM provinces')[0]?.c ?? 0,
    units: all<{ c: number }>('SELECT COUNT(*) AS c FROM units')[0]?.c ?? 0,
  };
}
