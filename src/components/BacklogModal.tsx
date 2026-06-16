import { useDashboardStore } from '@/store/useDashboardStore';
import { STORES, BRAND_COLORS, TIME_SLOTS } from '@/utils/mockData';
import { X, Clock, Coffee, ShoppingBag } from 'lucide-react';

export default function BacklogModal() {
  const backlogModalStoreId = useDashboardStore(s => s.backlogModalStoreId);
  const closeBacklogModal = useDashboardStore(s => s.closeBacklogModal);
  const mockData = useDashboardStore(s => s.mockData);
  const timeRange = useDashboardStore(s => s.timeRange);
  const brandAvgs = useDashboardStore(s => s.brandAvgs);
  const exemptRainy = useDashboardStore(s => s.exemptRainy);
  const exemptExhibition = useDashboardStore(s => s.exemptExhibition);
  const isExempt = exemptRainy || exemptExhibition;

  if (!backlogModalStoreId) return null;

  const store = STORES.find(s => s.id === backlogModalStoreId);
  if (!store) return null;

  const storeData = mockData.filter(d => {
    const slotIdx = TIME_SLOTS.indexOf(d.timeSlot);
    return d.storeId === backlogModalStoreId && slotIdx >= timeRange[0] && slotIdx <= timeRange[1];
  }).sort((a, b) => TIME_SLOTS.indexOf(a.timeSlot) - TIME_SLOTS.indexOf(b.timeSlot));

  const brandColor = BRAND_COLORS[store.brand];

  const consecutiveBacklogSlots: string[] = [];
  let consecutiveCount = 0;
  for (const d of storeData) {
    const avg = brandAvgs.find(a => a.brand === store.brand && a.timeSlot === d.timeSlot);
    if (avg && d.makeMedian > avg.makeMedianAvg * 1.5) {
      consecutiveCount++;
      if (consecutiveCount >= 3) {
        consecutiveBacklogSlots.push(d.timeSlot);
      }
    } else {
      consecutiveCount = 0;
    }
  }

  const backlogEntries = storeData.filter(d => consecutiveBacklogSlots.includes(d.timeSlot));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000088] backdrop-blur-sm" onClick={closeBacklogModal}>
      <div
        className="relative w-[520px] max-h-[70vh] bg-[#0F1D33] border border-[#2A3B5C] rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A3B5C]" style={{ borderTop: `3px solid ${brandColor}` }}>
          <div>
            <h3 className="text-sm font-semibold text-[#E0E8F0]">{store.name} · 后厨积压</h3>
            <p className="text-[10px] text-[#6B7A99] mt-0.5">
              制作时长超过同品牌均值 50% 的时段
            </p>
          </div>
          <button onClick={closeBacklogModal} className="p-1 hover:bg-[#1B2B44] rounded transition-colors">
            <X size={16} className="text-[#6B7A99]" />
          </button>
        </div>

        {isExempt && (
          <div className="mx-5 mt-3 px-3 py-2 bg-[#4A5B7818] border border-[#4A5B78] rounded-lg text-[10px] text-[#8899AA] flex items-center gap-2">
            <span className="text-[#4A5B78]">⚠️</span>
            已启用免责标签，此积压记录保留但不再预警
          </div>
        )}

        <div className="px-5 py-3 overflow-y-auto max-h-[50vh]">
          {backlogEntries.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#6B7A99]">暂无积压时段</div>
          ) : (
            <div className="flex flex-col gap-2">
              {backlogEntries.map((entry, idx) => (
                <div key={idx} className="bg-[#1B2B44] rounded-lg p-3 border border-[#2A3B5C]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#E0E8F0]">{entry.timeSlot}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF6B3522] text-[#FF6B35] font-medium">
                      制作 {entry.makeMedian}s
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#6B7A99]">
                      <Clock size={10} className="text-[#3B9EFF]" />
                      <span>等单 {entry.waitMedian}s</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#6B7A99]">
                      <Coffee size={10} className="text-[#FFB800]" />
                      <span>制作 {entry.makeMedian}s</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#6B7A99]">
                      <ShoppingBag size={10} className="text-[#00D68F]" />
                      <span>取餐 {entry.pickupMedian}s</span>
                    </div>
                  </div>

                  {entry.pendingOrders.length > 0 && (
                    <div className="border-t border-[#2A3B5C] pt-2 mt-2">
                      <span className="text-[9px] text-[#6B7A99] mb-1 block">未完成取餐号</span>
                      <div className="flex flex-wrap gap-1">
                        {entry.pendingOrders.map(order => (
                          <span
                            key={order}
                            className="px-1.5 py-0.5 bg-[#0F1D33] text-[10px] font-mono rounded text-[#FF6B35]"
                          >
                            {order}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
