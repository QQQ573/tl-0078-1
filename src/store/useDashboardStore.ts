import { create } from 'zustand';
import { Brand, STORES, generateMockData, computeBrandAverages, aggregateStoreData, StoreAggregated, TIME_SLOTS } from '@/utils/mockData';

export type SortBy = 'cups' | 'price' | 'wait';

interface DashboardState {
  selectedBrands: Set<Brand>;
  selectedStoreIds: Set<string>;
  selectedDate: string;
  timeRange: [number, number];
  sortBy: SortBy;
  exemptRainy: boolean;
  exemptExhibition: boolean;
  backlogModalStoreId: string | null;
  mockData: ReturnType<typeof generateMockData>;
  brandAvgs: ReturnType<typeof computeBrandAverages>;

  toggleBrand: (brand: Brand) => void;
  toggleStore: (storeId: string) => void;
  setDate: (date: string) => void;
  setTimeRange: (range: [number, number]) => void;
  setSortBy: (sortBy: SortBy) => void;
  toggleExemptRainy: () => void;
  toggleExemptExhibition: () => void;
  openBacklogModal: (storeId: string) => void;
  closeBacklogModal: () => void;
  getFilteredAggregated: () => StoreAggregated[];
  getRankings: () => Map<string, { cupsRank: number; priceRank: number; waitRank: number }>;
}

const today = new Date().toISOString().split('T')[0];
const initialData = generateMockData(today);
const initialAvgs = computeBrandAverages(initialData);

const allBrands = new Set<Brand>(['星巴克', '瑞幸', 'Manner', '喜茶', '奈雪', '蜜雪冰城']);
const allStoreIds = new Set(STORES.map(s => s.id));

export const useDashboardStore = create<DashboardState>((set, get) => ({
  selectedBrands: allBrands,
  selectedStoreIds: allStoreIds,
  selectedDate: today,
  timeRange: [0, 3],
  sortBy: 'cups',
  exemptRainy: false,
  exemptExhibition: false,
  backlogModalStoreId: null,
  mockData: initialData,
  brandAvgs: initialAvgs,

  toggleBrand: (brand) => set((state) => {
    const next = new Set(state.selectedBrands);
    if (next.has(brand)) {
      next.delete(brand);
    } else {
      next.add(brand);
    }
    const storeIds = new Set(
      STORES.filter(s => next.has(s.brand)).map(s => s.id)
    );
    const currentSelected = new Set([...state.selectedStoreIds].filter(id => storeIds.has(id)));
    return { selectedBrands: next, selectedStoreIds: currentSelected };
  }),

  toggleStore: (storeId) => set((state) => {
    const next = new Set(state.selectedStoreIds);
    if (next.has(storeId)) {
      next.delete(storeId);
    } else {
      next.add(storeId);
    }
    return { selectedStoreIds: next };
  }),

  setDate: (date) => set(() => {
    const data = generateMockData(date);
    const avgs = computeBrandAverages(data);
    return { selectedDate: date, mockData: data, brandAvgs: avgs };
  }),

  setTimeRange: (range) => set({ timeRange: range }),

  setSortBy: (sortBy) => set({ sortBy }),

  toggleExemptRainy: () => set((state) => ({ exemptRainy: !state.exemptRainy })),
  toggleExemptExhibition: () => set((state) => ({ exemptExhibition: !state.exemptExhibition })),

  openBacklogModal: (storeId) => set({ backlogModalStoreId: storeId }),
  closeBacklogModal: () => set({ backlogModalStoreId: null }),

  getFilteredAggregated: () => {
    const state = get();
    const aggregated = aggregateStoreData(state.mockData, state.brandAvgs, state.timeRange);
    const filtered = aggregated.filter(a => state.selectedStoreIds.has(a.storeId));

    const sortFn: Record<SortBy, (a: StoreAggregated, b: StoreAggregated) => number> = {
      cups: (a, b) => b.totalCups - a.totalCups,
      price: (a, b) => b.avgPrice - a.avgPrice,
      wait: (a, b) => b.waitMedian - a.waitMedian,
    };

    return filtered.sort(sortFn[state.sortBy]);
  },

  getRankings: () => {
    const state = get();
    const aggregated = aggregateStoreData(state.mockData, state.brandAvgs, state.timeRange);
    const filtered = aggregated.filter(a => state.selectedStoreIds.has(a.storeId));

    const byCups = [...filtered].sort((a, b) => b.totalCups - a.totalCups);
    const byPrice = [...filtered].sort((a, b) => b.avgPrice - a.avgPrice);
    const byWait = [...filtered].sort((a, b) => b.waitMedian - a.waitMedian);

    const rankings = new Map<string, { cupsRank: number; priceRank: number; waitRank: number }>();
    for (const s of filtered) {
      rankings.set(s.storeId, {
        cupsRank: byCups.findIndex(x => x.storeId === s.storeId) + 1,
        priceRank: byPrice.findIndex(x => x.storeId === s.storeId) + 1,
        waitRank: byWait.findIndex(x => x.storeId === s.storeId) + 1,
      });
    }
    return rankings;
  },
}));
