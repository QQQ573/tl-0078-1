import { create } from 'zustand';
import { BacklogRule, Brand, STORES, generateMockData, computeBrandAverages, aggregateStoreData, StoreAggregated } from '@/utils/mockData';
import { loadLocalStorageJson, saveLocalStorageJson } from '@/utils/persist';

export type SortBy = 'cups' | 'price' | 'wait';

export interface DashboardPresetV1 {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  state: {
    selectedBrands: Brand[];
    selectedStoreIds: string[];
    timeRange: [number, number];
    sortBy: SortBy;
    exemptRainy: boolean;
    exemptExhibition: boolean;
    backlogRule: BacklogRule;
  };
}

const STORAGE_KEY = 'tl-0078-1__dashboard_presets__v1';

interface DashboardState {
  selectedBrands: Set<Brand>;
  selectedStoreIds: Set<string>;
  selectedDate: string;
  timeRange: [number, number];
  sortBy: SortBy;
  exemptRainy: boolean;
  exemptExhibition: boolean;
  backlogRule: BacklogRule;
  backlogModalStoreId: string | null;
  mockData: ReturnType<typeof generateMockData>;
  brandAvgs: ReturnType<typeof computeBrandAverages>;
  presets: DashboardPresetV1[];
  activePresetId: string | null;

  toggleBrand: (brand: Brand) => void;
  toggleStore: (storeId: string) => void;
  setDate: (date: string) => void;
  setTimeRange: (range: [number, number]) => void;
  setSortBy: (sortBy: SortBy) => void;
  toggleExemptRainy: () => void;
  toggleExemptExhibition: () => void;
  setBacklogRule: (rule: Partial<BacklogRule>) => void;
  openBacklogModal: (storeId: string) => void;
  closeBacklogModal: () => void;
  getFilteredAggregated: () => StoreAggregated[];
  getRankings: () => Map<string, { cupsRank: number; priceRank: number; waitRank: number }>;
  createPresetFromCurrent: (name: string) => void;
  applyPreset: (presetId: string) => void;
  renamePreset: (presetId: string, name: string) => void;
  deletePreset: (presetId: string) => void;
  importPresets: (presets: DashboardPresetV1[]) => { imported: number; skipped: number };
}

const today = new Date().toISOString().split('T')[0];
const initialData = generateMockData(today);
const initialAvgs = computeBrandAverages(initialData);

const allBrands = new Set<Brand>(['星巴克', '瑞幸', 'Manner', '喜茶', '奈雪', '蜜雪冰城']);
const allStoreIds = new Set(STORES.map(s => s.id));

function nowId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function dedupePresets(presets: DashboardPresetV1[]): DashboardPresetV1[] {
  const seen = new Set<string>();
  const result: DashboardPresetV1[] = [];
  for (const p of presets) {
    if (!p?.id || seen.has(p.id)) continue;
    if (!p.name || typeof p.name !== 'string') continue;
    if (!p.state) continue;
    seen.add(p.id);
    result.push(p);
  }
  return result;
}

function loadPresets(): DashboardPresetV1[] {
  const raw = loadLocalStorageJson<DashboardPresetV1[]>(STORAGE_KEY);
  if (!Array.isArray(raw)) return [];
  return dedupePresets(raw);
}

function persistPresets(presets: DashboardPresetV1[]): void {
  saveLocalStorageJson(STORAGE_KEY, presets);
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  selectedBrands: allBrands,
  selectedStoreIds: allStoreIds,
  selectedDate: today,
  timeRange: [0, 3],
  sortBy: 'cups',
  exemptRainy: false,
  exemptExhibition: false,
  backlogRule: { multiplier: 1.5, consecutive: 3 },
  backlogModalStoreId: null,
  mockData: initialData,
  brandAvgs: initialAvgs,
  presets: loadPresets(),
  activePresetId: null,

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

  setBacklogRule: (rule) => set((state) => {
    const next: BacklogRule = {
      multiplier: typeof rule.multiplier === 'number' && Number.isFinite(rule.multiplier) ? rule.multiplier : state.backlogRule.multiplier,
      consecutive: typeof rule.consecutive === 'number' && Number.isFinite(rule.consecutive) ? rule.consecutive : state.backlogRule.consecutive,
    };
    return { backlogRule: next };
  }),

  openBacklogModal: (storeId) => set({ backlogModalStoreId: storeId }),
  closeBacklogModal: () => set({ backlogModalStoreId: null }),

  createPresetFromCurrent: (name) => set((state) => {
    const trimmed = name.trim();
    if (!trimmed) return state;

    const preset: DashboardPresetV1 = {
      id: nowId(),
      name: trimmed,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      state: {
        selectedBrands: [...state.selectedBrands],
        selectedStoreIds: [...state.selectedStoreIds],
        timeRange: state.timeRange,
        sortBy: state.sortBy,
        exemptRainy: state.exemptRainy,
        exemptExhibition: state.exemptExhibition,
        backlogRule: state.backlogRule,
      },
    };

    const nextPresets = dedupePresets([preset, ...state.presets]).slice(0, 30);
    persistPresets(nextPresets);
    return { presets: nextPresets, activePresetId: preset.id };
  }),

  applyPreset: (presetId) => set((state) => {
    const preset = state.presets.find(p => p.id === presetId);
    if (!preset) return state;

    const brandSet = new Set<Brand>(preset.state.selectedBrands);
    const effectiveBrands = brandSet.size > 0 ? brandSet : allBrands;
    const allowedStoreIds = new Set(STORES.filter(s => effectiveBrands.has(s.brand)).map(s => s.id));
    const storeSet = new Set<string>(
      preset.state.selectedStoreIds.filter(id => allowedStoreIds.has(id))
    );

    return {
      activePresetId: preset.id,
      selectedBrands: effectiveBrands,
      selectedStoreIds: storeSet.size > 0 ? storeSet : new Set([...allowedStoreIds]),
      timeRange: preset.state.timeRange,
      sortBy: preset.state.sortBy,
      exemptRainy: preset.state.exemptRainy,
      exemptExhibition: preset.state.exemptExhibition,
      backlogRule: preset.state.backlogRule ?? { multiplier: 1.5, consecutive: 3 },
      backlogModalStoreId: null,
    };
  }),

  renamePreset: (presetId, name) => set((state) => {
    const trimmed = name.trim();
    if (!trimmed) return state;
    const nextPresets = state.presets.map(p => p.id === presetId ? { ...p, name: trimmed, updatedAt: Date.now() } : p);
    persistPresets(nextPresets);
    return { presets: nextPresets };
  }),

  deletePreset: (presetId) => set((state) => {
    const nextPresets = state.presets.filter(p => p.id !== presetId);
    persistPresets(nextPresets);
    return { presets: nextPresets, activePresetId: state.activePresetId === presetId ? null : state.activePresetId };
  }),

  importPresets: (incoming) => {
    const state = get();
    if (!Array.isArray(incoming)) return { imported: 0, skipped: 0 };

    const normalized: DashboardPresetV1[] = incoming.map(p => ({
      ...p,
      state: {
        ...p?.state,
        backlogRule: p?.state?.backlogRule ?? { multiplier: 1.5, consecutive: 3 },
      },
    }));

    const before = new Set(state.presets.map(p => p.id));
    const merged = dedupePresets([...normalized, ...state.presets]).slice(0, 30);
    persistPresets(merged);
    set({ presets: merged });

    const after = new Set(merged.map(p => p.id));
    let imported = 0;
    for (const id of after) if (!before.has(id)) imported++;
    const skipped = Math.max(0, incoming.length - imported);
    return { imported, skipped };
  },

  getFilteredAggregated: () => {
    const state = get();
    const aggregated = aggregateStoreData(state.mockData, state.brandAvgs, state.timeRange, state.backlogRule);
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
    const aggregated = aggregateStoreData(state.mockData, state.brandAvgs, state.timeRange, state.backlogRule);
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
