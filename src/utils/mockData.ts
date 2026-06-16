export type Brand = '星巴克' | '瑞幸' | 'Manner' | '喜茶' | '奈雪' | '蜜雪冰城';

export interface Store {
  id: string;
  brand: Brand;
  name: string;
}

export interface TimeSlotData {
  storeId: string;
  timeSlot: string;
  cupCount: number;
  avgPrice: number;
  waitMedian: number;
  makeMedian: number;
  pickupMedian: number;
  sampleSize: number;
  pendingOrders: string[];
}

export interface BrandAvg {
  brand: Brand;
  timeSlot: string;
  makeMedianAvg: number;
}

export interface BacklogRule {
  multiplier: number;
  consecutive: number;
}

export interface StoreAggregated {
  storeId: string;
  store: Store;
  totalCups: number;
  avgPrice: number;
  waitMedian: number;
  makeMedian: number;
  pickupMedian: number;
  totalSampleSize: number;
  isBacklog: boolean;
  backlogSlots: string[];
  pendingOrders: string[];
}

export const BRANDS: Brand[] = ['星巴克', '瑞幸', 'Manner', '喜茶', '奈雪', '蜜雪冰城'];

export const BRAND_COLORS: Record<Brand, string> = {
  '星巴克': '#00704A',
  '瑞幸': '#003DB8',
  'Manner': '#8B6914',
  '喜茶': '#E8515D',
  '奈雪': '#6ABF4B',
  '蜜雪冰城': '#FF6600',
};

export const BRAND_CONFIG: Record<Brand, { cupRange: [number, number]; priceRange: [number, number]; waitBase: number; makeBase: number; pickupBase: number }> = {
  '星巴克': { cupRange: [30, 55], priceRange: [35, 50], waitBase: 90, makeBase: 150, pickupBase: 30 },
  '瑞幸': { cupRange: [60, 120], priceRange: [15, 25], waitBase: 40, makeBase: 60, pickupBase: 20 },
  'Manner': { cupRange: [35, 65], priceRange: [15, 25], waitBase: 60, makeBase: 90, pickupBase: 25 },
  '喜茶': { cupRange: [40, 80], priceRange: [25, 35], waitBase: 120, makeBase: 200, pickupBase: 35 },
  '奈雪': { cupRange: [35, 70], priceRange: [25, 35], waitBase: 100, makeBase: 180, pickupBase: 30 },
  '蜜雪冰城': { cupRange: [80, 150], priceRange: [8, 15], waitBase: 30, makeBase: 40, pickupBase: 15 },
};

export const STORES: Store[] = [
  { id: 'sb-1', brand: '星巴克', name: '星巴克 静安寺店' },
  { id: 'sb-2', brand: '星巴克', name: '星巴克 1788店' },
  { id: 'lk-1', brand: '瑞幸', name: '瑞幸 静安寺店' },
  { id: 'lk-2', brand: '瑞幸', name: '瑞幸 1788店' },
  { id: 'mn-1', brand: 'Manner', name: 'Manner 静安寺店' },
  { id: 'mn-2', brand: 'Manner', name: 'Manner 1788店' },
  { id: 'xt-1', brand: '喜茶', name: '喜茶 1788店' },
  { id: 'xt-2', brand: '喜茶', name: '喜茶 静安寺店' },
  { id: 'nx-1', brand: '奈雪', name: '奈雪 静安寺店' },
  { id: 'nx-2', brand: '奈雪', name: '奈雪 1788店' },
  { id: 'mx-1', brand: '蜜雪冰城', name: '蜜雪冰城 静安寺店' },
  { id: 'mx-2', brand: '蜜雪冰城', name: '蜜雪冰城 1788店' },
];

export const TIME_SLOTS: string[] = [];
for (let h = 10; h < 22; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getPeakMultiplier(timeSlot: string): number {
  const hour = parseInt(timeSlot.split(':')[0]);
  if (hour >= 11 && hour <= 13) return 1.4;
  if (hour >= 17 && hour <= 20) return 1.6;
  if (hour >= 14 && hour <= 16) return 1.1;
  return 0.8;
}

function generatePendingOrders(brand: Brand, count: number): string[] {
  const prefixes: Record<Brand, string> = {
    '星巴克': 'SB',
    '瑞幸': 'LK',
    'Manner': 'MN',
    '喜茶': 'XT',
    '奈雪': 'NX',
    '蜜雪冰城': 'MX',
  };
  return Array.from({ length: count }, () => `${prefixes[brand]}-${rand(100, 999)}`);
}

export function generateMockData(dateSeed: string): TimeSlotData[] {
  let seed = 0;
  for (let i = 0; i < dateSeed.length; i++) seed += dateSeed.charCodeAt(i);
  const seededRand = (min: number, max: number) => {
    seed = (seed * 16807 + 0) % 2147483647;
    return min + (seed % (max - min + 1));
  };

  const data: TimeSlotData[] = [];

  for (const store of STORES) {
    const config = BRAND_CONFIG[store.brand];
    for (const slot of TIME_SLOTS) {
      const peak = getPeakMultiplier(slot);
      const cupCount = Math.round(seededRand(config.cupRange[0], config.cupRange[1]) * peak);
      const avgPrice = (seededRand(config.priceRange[0] * 10, config.priceRange[1] * 10) / 10);
      const waitMedian = Math.round(config.waitBase * peak * (0.8 + seededRand(0, 40) / 100));
      const makeMedian = Math.round(config.makeBase * peak * (0.7 + seededRand(0, 60) / 100));
      const pickupMedian = Math.round(config.pickupBase * peak * (0.8 + seededRand(0, 30) / 100));
      const sampleSize = Math.round(cupCount * (0.6 + seededRand(0, 30) / 100));
      const hasBacklog = makeMedian > config.makeBase * peak * 1.5;
      const pendingCount = hasBacklog ? seededRand(3, 12) : seededRand(0, 2);
      const pendingOrders = generatePendingOrders(store.brand, pendingCount);

      data.push({
        storeId: store.id,
        timeSlot: slot,
        cupCount,
        avgPrice,
        waitMedian,
        makeMedian,
        pickupMedian,
        sampleSize,
        pendingOrders,
      });
    }
  }

  return data;
}

export function computeBrandAverages(data: TimeSlotData[]): BrandAvg[] {
  const map = new Map<string, { sum: number; count: number }>();
  for (const d of data) {
    const store = STORES.find(s => s.id === d.storeId);
    if (!store) continue;
    const key = `${store.brand}__${d.timeSlot}`;
    const existing = map.get(key) || { sum: 0, count: 0 };
    existing.sum += d.makeMedian;
    existing.count += 1;
    map.set(key, existing);
  }

  const result: BrandAvg[] = [];
  for (const [key, val] of map) {
    const [brand, timeSlot] = key.split('__') as [Brand, string];
    result.push({ brand, timeSlot, makeMedianAvg: Math.round(val.sum / val.count) });
  }
  return result;
}

export function aggregateStoreData(
  data: TimeSlotData[],
  brandAvgs: BrandAvg[],
  timeRange: [number, number],
  backlogRule: BacklogRule = { multiplier: 1.5, consecutive: 3 }
): StoreAggregated[] {
  return STORES.map(store => {
    const storeData = data.filter(d => {
      const slotIdx = TIME_SLOTS.indexOf(d.timeSlot);
      return d.storeId === store.id && slotIdx >= timeRange[0] && slotIdx <= timeRange[1];
    });

    const totalCups = storeData.reduce((s, d) => s + d.cupCount, 0);
    const totalSamples = storeData.reduce((s, d) => s + d.sampleSize, 0);
    const avgPrice = storeData.length > 0
      ? Math.round(storeData.reduce((s, d) => s + d.avgPrice * d.sampleSize, 0) / Math.max(totalSamples, 1) * 10) / 10
      : 0;
    const waitMedian = storeData.length > 0
      ? Math.round(storeData.reduce((s, d) => s + d.waitMedian, 0) / storeData.length)
      : 0;
    const makeMedian = storeData.length > 0
      ? Math.round(storeData.reduce((s, d) => s + d.makeMedian, 0) / storeData.length)
      : 0;
    const pickupMedian = storeData.length > 0
      ? Math.round(storeData.reduce((s, d) => s + d.pickupMedian, 0) / storeData.length)
      : 0;

    const backlogSlots = getBacklogSlotsForStore(store.brand, storeData, brandAvgs, backlogRule);

    const isBacklog = backlogSlots.length > 0;
    const pendingOrders = storeData
      .filter(d => backlogSlots.includes(d.timeSlot) || isBacklog)
      .flatMap(d => d.pendingOrders);

    return {
      storeId: store.id,
      store,
      totalCups,
      avgPrice,
      waitMedian,
      makeMedian,
      pickupMedian,
      totalSampleSize: totalSamples,
      isBacklog,
      backlogSlots,
      pendingOrders,
    };
  });
}

export function getBacklogSlotsForStore(
  brand: Brand,
  storeData: TimeSlotData[],
  brandAvgs: BrandAvg[],
  rule: BacklogRule
): string[] {
  const multiplier = Number.isFinite(rule.multiplier) ? rule.multiplier : 1.5;
  const consecutive = Math.max(2, Math.min(6, Math.floor(rule.consecutive || 3)));

  const sorted = [...storeData].sort((a, b) => TIME_SLOTS.indexOf(a.timeSlot) - TIME_SLOTS.indexOf(b.timeSlot));

  const backlogSlots: string[] = [];
  let consecutiveCount = 0;
  for (const d of sorted) {
    const avg = brandAvgs.find(a => a.brand === brand && a.timeSlot === d.timeSlot);
    if (avg && d.makeMedian > avg.makeMedianAvg * multiplier) {
      consecutiveCount++;
      if (consecutiveCount >= consecutive) {
        backlogSlots.push(d.timeSlot);
      }
    } else {
      consecutiveCount = 0;
    }
  }
  return backlogSlots;
}
