import { useDashboardStore } from '@/store/useDashboardStore';
import { BRANDS, BRAND_COLORS, STORES, Brand } from '@/utils/mockData';
import { Cloud, Flag, Check, Square } from 'lucide-react';

export default function TopBar() {
  const selectedBrands = useDashboardStore(s => s.selectedBrands);
  const selectedStoreIds = useDashboardStore(s => s.selectedStoreIds);
  const selectedDate = useDashboardStore(s => s.selectedDate);
  const exemptRainy = useDashboardStore(s => s.exemptRainy);
  const exemptExhibition = useDashboardStore(s => s.exemptExhibition);
  const toggleBrand = useDashboardStore(s => s.toggleBrand);
  const toggleStore = useDashboardStore(s => s.toggleStore);
  const setDate = useDashboardStore(s => s.setDate);
  const toggleExemptRainy = useDashboardStore(s => s.toggleExemptRainy);
  const toggleExemptExhibition = useDashboardStore(s => s.toggleExemptExhibition);

  return (
    <div className="flex items-start gap-6 px-6 py-4 bg-[#0B1426] border-b border-[#1B2B44]">
      <div className="flex flex-col gap-2">
        <span className="text-xs text-[#6B7A99] font-medium tracking-wider uppercase">品牌筛选</span>
        <div className="flex gap-2 flex-wrap">
          {BRANDS.map(brand => {
            const active = selectedBrands.has(brand);
            return (
              <button
                key={brand}
                onClick={() => toggleBrand(brand)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200"
                style={{
                  background: active ? `${BRAND_COLORS[brand as Brand]}22` : '#1B2B44',
                  border: `1px solid ${active ? BRAND_COLORS[brand as Brand] : '#2A3B5C'}`,
                  color: active ? BRAND_COLORS[brand as Brand] : '#6B7A99',
                }}
              >
                {active ? <Check size={12} /> : <Square size={12} />}
                {brand}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-px h-14 bg-[#1B2B44] self-center" />

      <div className="flex flex-col gap-2">
        <span className="text-xs text-[#6B7A99] font-medium tracking-wider uppercase">门店筛选</span>
        <div className="flex gap-1.5 flex-wrap">
          {STORES.filter(s => selectedBrands.has(s.brand)).map(store => {
            const active = selectedStoreIds.has(store.id);
            return (
              <button
                key={store.id}
                onClick={() => toggleStore(store.id)}
                className="px-2 py-1 rounded text-[11px] transition-all duration-200"
                style={{
                  background: active ? `${BRAND_COLORS[store.brand]}18` : '#1B2B44',
                  border: `1px solid ${active ? BRAND_COLORS[store.brand] : '#2A3B5C'}`,
                  color: active ? '#C8D6E5' : '#4A5B78',
                }}
              >
                {store.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-px h-14 bg-[#1B2B44] self-center" />

      <div className="flex flex-col gap-2">
        <span className="text-xs text-[#6B7A99] font-medium tracking-wider uppercase">日期</span>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setDate(e.target.value)}
          className="bg-[#1B2B44] border border-[#2A3B5C] text-[#C8D6E5] rounded px-3 py-1.5 text-xs outline-none focus:border-[#3B9EFF] transition-colors"
        />
      </div>

      <div className="w-px h-14 bg-[#1B2B44] self-center" />

      <div className="flex flex-col gap-2">
        <span className="text-xs text-[#6B7A99] font-medium tracking-wider uppercase">免责标签</span>
        <div className="flex gap-2">
          <button
            onClick={toggleExemptRainy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
              exemptRainy
                ? 'bg-[#3B9EFF]22 border border-[#3B9EFF] text-[#3B9EFF]'
                : 'bg-[#1B2B44] border border-[#2A3B5C] text-[#6B7A99]'
            }`}
          >
            <Cloud size={12} />
            雨天
          </button>
          <button
            onClick={toggleExemptExhibition}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
              exemptExhibition
                ? 'bg-[#FF6B35]22 border border-[#FF6B35] text-[#FF6B35]'
                : 'bg-[#1B2B44] border border-[#2A3B5C] text-[#6B7A99]'
            }`}
          >
            <Flag size={12} />
            漫展
          </button>
        </div>
      </div>
    </div>
  );
}
