import type { ModelDef } from './types';
import { buildTank } from './tank';
import { buildSpg } from './spg';
import { buildJet } from './jet';
import { buildShip } from './ship';
import { buildHeli } from './heli';
import { buildSoldier } from './soldier';

export const models: ModelDef[] = [
  {
    id: 'mbt',
    name: 'مالينس-1',
    designation: 'MBT-01',
    role: 'دبابة قتال رئيسية',
    specs: [
      { label: 'التدريع', value: 82 },
      { label: 'النيران', value: 88 },
      { label: 'الحركة', value: 61 },
      { label: 'المدى', value: 74 },
    ],
    build: buildTank,
  },
  {
    id: 'spg',
    name: 'راجح',
    designation: 'SPG-04',
    role: 'مدفعية ذاتية الحركة',
    specs: [
      { label: 'النيران', value: 94 },
      { label: 'الدقة', value: 71 },
      { label: 'الحركة', value: 55 },
      { label: 'الحماية', value: 46 },
    ],
    build: buildSpg,
  },
  {
    id: 'jet',
    name: 'صقر',
    designation: 'F/A-07',
    role: 'مقاتلة متعددة المهام',
    specs: [
      { label: 'السرعة', value: 92 },
      { label: 'المناورة', value: 86 },
      { label: 'التسليح', value: 78 },
      { label: 'المدى', value: 66 },
    ],
    build: buildJet,
  },
  {
    id: 'ship',
    name: 'نور',
    designation: 'DD-12',
    role: 'مدمرة ساحلية',
    specs: [
      { label: 'التسليح', value: 81 },
      { label: 'الدفاع', value: 88 },
      { label: 'المدى', value: 90 },
      { label: 'الحركة', value: 58 },
    ],
    build: buildShip,
  },
  {
    id: 'heli',
    name: 'حديد',
    designation: 'AH-09',
    role: 'مروحية هجومية',
    specs: [
      { label: 'المناورة', value: 89 },
      { label: 'التسليح', value: 84 },
      { label: 'التدريع', value: 52 },
      { label: 'المدى', value: 60 },
    ],
    build: buildHeli,
  },
  {
    id: 'inf',
    name: 'راجل',
    designation: 'INF-01',
    role: 'مشاة ميكانيكية',
    specs: [
      { label: 'الانضباط', value: 76 },
      { label: 'التسليح', value: 58 },
      { label: 'الحماية', value: 44 },
      { label: 'الحركة', value: 82 },
    ],
    build: buildSoldier,
  },
];
