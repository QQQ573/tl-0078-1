import TopBar from '@/components/TopBar';
import CardGrid from '@/components/CardGrid';
import Timeline from '@/components/Timeline';
import BacklogModal from '@/components/BacklogModal';
import { useDashboardStore, SortBy } from '@/store/useDashboardStore';

const SORT_OPTIONS: { key: SortBy; label: string; desc: string }[] = [
  { key: 'cups', label: '出杯数', desc: '↓' },
  { key: 'price', label: '客单价', desc: '↓' },
  { key: 'wait', label: '等单时长', desc: '↓' },
];

export default function Home() {
  const sortBy = useDashboardStore(s => s.sortBy);
  const setSortBy = useDashboardStore(s => s.setSortBy);

  return (
    <div className="flex flex-col h-screen bg-[#0B1426] text-[#E0E8F0] overflow-hidden">
      <header className="flex items-center gap-3 px-6 py-2.5 bg-[#0B1426] border-b border-[#1B2B44]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00E5A0] animate-pulse" />
          <h1 className="text-sm font-bold tracking-wide text-[#E0E8F0]">静安寺商圈督导大屏</h1>
        </div>
        <div className="flex-1" />
        <span className="text-[10px] text-[#4A5B78] font-mono">12 门店 · 6 品牌 · 实时</span>
      </header>

      <TopBar />

      <div className="flex items-center gap-4 px-6 py-1.5 bg-[#0D1829] border-b border-[#1B2B44]">
        <span className="text-[10px] text-[#6B7A99] uppercase tracking-wider font-medium">排名维度</span>
        <div className="flex gap-2">
          {SORT_OPTIONS.map(opt => {
            const active = sortBy === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className={`px-2.5 py-0.5 rounded text-[10px] font-medium transition-all duration-200 cursor-pointer ${
                  active
                    ? 'bg-[#00E5A018] border border-[#00E5A066] text-[#00E5A0]'
                    : 'bg-[#1B2B44] border border-[#2A3B5C] text-[#6B7A99] hover:text-[#8899AA]'
                }`}
              >
                {opt.label} {opt.desc}
              </button>
            );
          })}
        </div>
      </div>

      <CardGrid />

      <Timeline />

      <BacklogModal />
    </div>
  );
}
