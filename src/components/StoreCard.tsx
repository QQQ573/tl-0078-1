import { StoreAggregated, BRAND_COLORS } from '@/utils/mockData';
import { useDashboardStore, SortBy } from '@/store/useDashboardStore';
import StackedBar from './StackedBar';
import { AlertTriangle } from 'lucide-react';

interface StoreCardProps {
  data: StoreAggregated;
  rank: number;
  cupsRank: number;
  priceRank: number;
  waitRank: number;
}

const RANK_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  '1': { bg: '#FFD70022', text: '#FFD700', border: '#FFD700' },
  '2': { bg: '#C0C0C022', text: '#C0C0C0', border: '#C0C0C0' },
  '3': { bg: '#CD7F3222', text: '#CD7F32', border: '#CD7F32' },
};

function RankBadge({ rank, label, active }: { rank: number; label: string; active: boolean }) {
  const style = RANK_STYLES[String(rank)] || { bg: '#0F1D33', text: '#6B7A99', border: '#2A3B5C' };
  return (
    <div className={`flex flex-col items-center px-1 py-0.5 rounded transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-50'}`}>
      <span className="text-[8px] text-[#6B7A99] leading-none">{label}</span>
      <span
        className="text-xs font-bold font-mono leading-tight mt-0.5"
        style={{ color: active ? style.text : '#6B7A99' }}
      >
        #{rank}
      </span>
    </div>
  );
}

export default function StoreCard({ data, rank, cupsRank, priceRank, waitRank }: StoreCardProps) {
  const exemptRainy = useDashboardStore(s => s.exemptRainy);
  const exemptExhibition = useDashboardStore(s => s.exemptExhibition);
  const sortBy = useDashboardStore(s => s.sortBy);
  const openBacklogModal = useDashboardStore(s => s.openBacklogModal);
  const isExempt = exemptRainy || exemptExhibition;
  const brandColor = BRAND_COLORS[data.store.brand];

  const sortKeyMap: Record<SortBy, 'cups' | 'price' | 'wait'> = {
    cups: 'cups',
    price: 'price',
    wait: 'wait',
  };
  const activeSort = sortKeyMap[sortBy];

  return (
    <div
      className="relative flex flex-col bg-[#1B2B44] rounded-lg border border-[#2A3B5C] overflow-hidden transition-all duration-500 hover:border-[#3A4B6C] hover:shadow-lg hover:shadow-[#00000040]"
      style={{ borderTop: `3px solid ${brandColor}` }}
    >
      {data.isBacklog && (
        <button
          onClick={() => openBacklogModal(data.storeId)}
          className={`absolute top-1.5 right-1.5 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold transition-all duration-300 cursor-pointer ${
            isExempt
              ? 'bg-[#4A5B78] text-[#8899AA] opacity-40'
              : 'bg-[#FF6B35] text-white animate-pulse'
          }`}
        >
          <AlertTriangle size={8} />
          <span>积压</span>
        </button>
      )}

      <div className="px-2.5 pt-2 pb-1.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0"
            style={{
              backgroundColor: rank <= 3 ? `${brandColor}33` : '#0F1D33',
              color: rank <= 3 ? brandColor : '#6B7A99',
              border: rank <= 3 ? `1px solid ${brandColor}` : '1px solid #2A3B5C',
            }}
          >
            {rank}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-[#E0E8F0] truncate leading-tight">{data.store.name}</div>
            <div className="text-[9px] font-medium leading-tight" style={{ color: brandColor }}>
              {data.store.brand}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-0.5 mb-1.5">
          <RankBadge rank={cupsRank} label="出杯" active={activeSort === 'cups'} />
          <RankBadge rank={priceRank} label="客单" active={activeSort === 'price'} />
          <RankBadge rank={waitRank} label="等单" active={activeSort === 'wait'} />
        </div>

        <div className="grid grid-cols-3 gap-1 mb-1.5">
          <div className="flex flex-col items-center bg-[#0F1D33] rounded px-1 py-1">
            <span className="text-[8px] text-[#6B7A99] leading-none">出杯</span>
            <span className="text-[11px] font-bold font-mono text-[#00E5A0] leading-tight mt-0.5">{data.totalCups}</span>
          </div>
          <div className="flex flex-col items-center bg-[#0F1D33] rounded px-1 py-1">
            <span className="text-[8px] text-[#6B7A99] leading-none">客单</span>
            <span className="text-[11px] font-bold font-mono text-[#3B9EFF] leading-tight mt-0.5">¥{data.avgPrice}</span>
          </div>
          <div className="flex flex-col items-center bg-[#0F1D33] rounded px-1 py-1">
            <span className="text-[8px] text-[#6B7A99] leading-none">等单</span>
            <span className="text-[11px] font-bold font-mono text-[#FFB800] leading-tight mt-0.5">{data.waitMedian}s</span>
          </div>
        </div>
      </div>

      <div className="px-2.5 pb-2 pt-1 border-t border-[#2A3B5C]">
        <StackedBar data={data} />
      </div>
    </div>
  );
}
