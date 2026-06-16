import { StoreAggregated } from '@/utils/mockData';
import { useState } from 'react';

interface StackedBarProps {
  data: StoreAggregated;
}

const SEGMENTS = [
  { key: 'wait', label: '等单', color: '#3B9EFF' },
  { key: 'make', label: '制作', color: '#FFB800' },
  { key: 'pickup', label: '取餐', color: '#00D68F' },
] as const;

type SegKey = typeof SEGMENTS[number]['key'];

export default function StackedBar({ data }: StackedBarProps) {
  const total = data.waitMedian + data.makeMedian + data.pickupMedian;
  const [hovered, setHovered] = useState<SegKey | null>(null);

  if (total === 0) return null;

  const segments = SEGMENTS.map(seg => {
    const seconds = seg.key === 'wait' ? data.waitMedian : seg.key === 'make' ? data.makeMedian : data.pickupMedian;
    const pct = (seconds / total) * 100;
    return { ...seg, seconds, pct };
  });

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative flex h-5 rounded-sm overflow-hidden bg-[#0F1D33]">
        {segments.map(seg => (
          <div
            key={seg.key}
            className="relative transition-all duration-500 ease-out cursor-pointer"
            style={{
              width: `${seg.pct}%`,
              backgroundColor: seg.color,
              opacity: hovered === null ? 0.85 : hovered === seg.key ? 1 : 0.4,
            }}
            onMouseEnter={() => setHovered(seg.key)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </div>

      <div className="flex items-center gap-1">
        {segments.map(seg => (
          <div
            key={seg.key}
            className="relative flex items-center gap-0.5 cursor-pointer"
            onMouseEnter={() => setHovered(seg.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[9px] font-mono text-[#8899AA]">
              {seg.seconds}s
            </span>
          </div>
        ))}
      </div>

      {hovered && (
        <div className="animate-slide-up px-2 py-1.5 rounded bg-[#0F1D33] border border-[#2A3B5C]">
          {(() => {
            const seg = segments.find(s => s.key === hovered)!;
            return (
              <>
                <div className="text-[10px] font-semibold" style={{ color: seg.color }}>
                  {seg.label}: {seg.seconds}秒
                </div>
                <div className="text-[9px] text-[#6B7A99]">
                  占比 {seg.pct.toFixed(1)}% · 样本 {data.totalSampleSize}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
