import { OrbitLevel } from './types';

export const ORBIT_CONFIG = {
  [OrbitLevel.SURVIVAL]: {
    radius: 120,
    color: '#3b82f6', // Blue
    label: 'Survival',
    description: 'Immediate focus',
    speed: 60
  },
  [OrbitLevel.GROWTH]: {
    radius: 220,
    color: '#f59e0b', // Orange/Amber
    label: 'Growth',
    description: 'Skills and projects',
    speed: 90
  },
  [OrbitLevel.VISION]: {
    radius: 320,
    color: '#3b82f6', // Blue again as per draft
    label: 'Vision',
    description: 'Long-term aspirations',
    speed: 120
  }
};