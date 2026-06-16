import { useRef, useState, useCallback, useEffect } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { TIME_SLOTS } from '@/utils/mockData';

const TOTAL_SLOTS = TIME_SLOTS.length;
const SLOT_WIDTH = 50;
const TIMELINE_WIDTH = TOTAL_SLOTS * SLOT_WIDTH;
const MAX_RANGE_SLOTS = 4;

export default function Timeline() {
  const timeRange = useDashboardStore(s => s.timeRange);
  const setTimeRange = useDashboardStore(s => s.setTimeRange);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'start' | 'end' | 'move' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartRange, setDragStartRange] = useState<[number, number]>([0, 0]);

  const slotToX = (slot: number) => slot * SLOT_WIDTH;

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'start' | 'end' | 'move') => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(type);
    setDragStartX(e.clientX);
    setDragStartRange([...timeRange] as [number, number]);
  }, [timeRange]);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartX;
      const dSlot = Math.round(dx / SLOT_WIDTH);
      const maxEnd = dragStartRange[0] + MAX_RANGE_SLOTS - 1;
      const minStart = dragStartRange[1] - MAX_RANGE_SLOTS + 1;

      if (dragging === 'start') {
        const newStart = Math.max(0, Math.min(Math.min(dragStartRange[1] - 1, minStart), dragStartRange[0] + dSlot));
        const actualEnd = Math.min(TOTAL_SLOTS - 1, newStart + MAX_RANGE_SLOTS - 1);
        setTimeRange([newStart, actualEnd]);
      } else if (dragging === 'end') {
        const newEnd = Math.min(TOTAL_SLOTS - 1, Math.max(Math.max(dragStartRange[0] + 1, maxEnd), dragStartRange[1] + dSlot));
        const actualStart = Math.max(0, newEnd - MAX_RANGE_SLOTS + 1);
        setTimeRange([actualStart, newEnd]);
      } else if (dragging === 'move') {
        const rangeLen = Math.min(MAX_RANGE_SLOTS - 1, dragStartRange[1] - dragStartRange[0]);
        let newStart = dragStartRange[0] + dSlot;
        let newEnd = newStart + rangeLen;
        if (newStart < 0) { newStart = 0; newEnd = newStart + rangeLen; }
        if (newEnd > TOTAL_SLOTS - 1) { newEnd = TOTAL_SLOTS - 1; newStart = newEnd - rangeLen; }
        setTimeRange([newStart, newEnd]);
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragStartX, dragStartRange, setTimeRange, timeRange]);

  const leftX = slotToX(timeRange[0]);
  const rightX = slotToX(timeRange[1]) + SLOT_WIDTH;
  const rangeWidth = rightX - leftX;

  const formatSlot = (idx: number) => TIME_SLOTS[idx] || '';

  return (
    <div className="px-6 py-3 bg-[#0B1426] border-t border-[#1B2B44]">
      <div className="flex items-center gap-4 mb-1">
        <span className="text-[10px] text-[#6B7A99] font-medium uppercase tracking-wider">时间轴</span>
        <span className="text-xs text-[#8899AA] font-mono">
          {formatSlot(timeRange[0])} — {formatSlot(timeRange[1])}
        </span>
        <span className="text-[10px] text-[#4A5B78]">
          ({((timeRange[1] - timeRange[0] + 1) * 30 / 60).toFixed(1)} 小时)
        </span>
      </div>

      <div ref={containerRef} className="relative overflow-x-auto select-none" style={{ scrollbarWidth: 'none' }}>
        <div className="relative" style={{ width: TIMELINE_WIDTH + SLOT_WIDTH, height: 48 }}>
          {TIME_SLOTS.map((slot, idx) => {
            const isHour = slot.endsWith(':00');
            const isSelected = idx >= timeRange[0] && idx <= timeRange[1];
            return (
              <div
                key={slot}
                className="absolute top-0"
                style={{ left: slotToX(idx), width: SLOT_WIDTH, height: 48 }}
              >
                {isHour && (
                  <div className="absolute top-0 left-0 text-[9px] text-[#6B7A99] font-mono">{slot}</div>
                )}
                <div
                  className={`absolute bottom-2 w-px h-3 ${isSelected ? 'bg-[#3B9EFF]' : 'bg-[#1B2B44]'}`}
                  style={{ left: SLOT_WIDTH / 2 }}
                />
              </div>
            );
          })}

          <div
            className="absolute top-5 rounded-sm transition-colors duration-150"
            style={{
              left: leftX,
              width: rangeWidth,
              height: 20,
              backgroundColor: '#3B9EFF18',
              border: '1px solid #3B9EFF44',
            }}
          >
            <div
              className="absolute left-0 top-0 w-3 h-full cursor-ew-resize z-10 hover:bg-[#3B9EFF44] transition-colors"
              onMouseDown={e => handleMouseDown(e, 'start')}
            />
            <div
              className="absolute right-0 top-0 w-3 h-full cursor-ew-resize z-10 hover:bg-[#3B9EFF44] transition-colors"
              onMouseDown={e => handleMouseDown(e, 'end')}
            />
            <div
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              onMouseDown={e => handleMouseDown(e, 'move')}
              style={{ left: 12, right: 12 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
