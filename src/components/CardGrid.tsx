import { useDashboardStore } from '@/store/useDashboardStore';
import StoreCard from './StoreCard';

export default function CardGrid() {
  const getFilteredAggregated = useDashboardStore(s => s.getFilteredAggregated);
  const getRankings = useDashboardStore(s => s.getRankings);
  const aggregated = getFilteredAggregated();
  const rankings = getRankings();

  return (
    <div className="flex-1 overflow-auto px-4 py-3">
      <div className="grid grid-cols-6 xl:grid-cols-12 gap-2 auto-rows-min">
        {aggregated.map((store, idx) => {
          const r = rankings.get(store.storeId);
          return (
            <StoreCard
              key={store.storeId}
              data={store}
              rank={idx + 1}
              cupsRank={r?.cupsRank ?? 0}
              priceRank={r?.priceRank ?? 0}
              waitRank={r?.waitRank ?? 0}
            />
          );
        })}
      </div>
      {aggregated.length === 0 && (
        <div className="flex items-center justify-center h-64 text-[#6B7A99] text-sm">
          请选择至少一个品牌和门店
        </div>
      )}
    </div>
  );
}
