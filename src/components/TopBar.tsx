import { useDashboardStore } from '@/store/useDashboardStore';
import { BRANDS, BRAND_COLORS, STORES, Brand, TIME_SLOTS } from '@/utils/mockData';
import { Cloud, Flag, Check, Square, Download, Save, Pencil, Trash2, FileUp, FileDown } from 'lucide-react';
import { toCsv, downloadTextFile } from '@/utils/csv';
import { useRef } from 'react';

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
  const timeRange = useDashboardStore(s => s.timeRange);
  const sortBy = useDashboardStore(s => s.sortBy);
  const presets = useDashboardStore(s => s.presets);
  const activePresetId = useDashboardStore(s => s.activePresetId);
  const createPresetFromCurrent = useDashboardStore(s => s.createPresetFromCurrent);
  const applyPreset = useDashboardStore(s => s.applyPreset);
  const renamePreset = useDashboardStore(s => s.renamePreset);
  const deletePreset = useDashboardStore(s => s.deletePreset);
  const backlogRule = useDashboardStore(s => s.backlogRule);
  const setBacklogRule = useDashboardStore(s => s.setBacklogRule);
  const importPresets = useDashboardStore(s => s.importPresets);
  const getFilteredAggregated = useDashboardStore(s => s.getFilteredAggregated);
  const getRankings = useDashboardStore(s => s.getRankings);

  const importInputRef = useRef<HTMLInputElement | null>(null);

  const handleCreatePreset = () => {
    const name = window.prompt('请输入方案名称（用于快速切换）');
    if (!name) return;
    createPresetFromCurrent(name);
  };

  const handleRenamePreset = () => {
    if (!activePresetId) return;
    const current = presets.find(p => p.id === activePresetId);
    const nextName = window.prompt('重命名方案', current?.name ?? '');
    if (!nextName) return;
    renamePreset(activePresetId, nextName);
  };

  const handleDeletePreset = () => {
    if (!activePresetId) return;
    const current = presets.find(p => p.id === activePresetId);
    const ok = window.confirm(`确定删除方案「${current?.name ?? ''}」？此操作不可恢复。`);
    if (!ok) return;
    deletePreset(activePresetId);
  };

  const handleExportCsv = () => {
    const aggregated = getFilteredAggregated();
    const rankings = getRankings();
    const timeLabel = `${TIME_SLOTS[timeRange[0]] ?? ''}-${TIME_SLOTS[timeRange[1]] ?? ''}`;
    const sortLabel = sortBy === 'cups' ? '出杯数' : sortBy === 'price' ? '客单价' : '等单时长';

    const rows = aggregated.map((a, idx) => {
      const r = rankings.get(a.storeId);
      return {
        '排名': idx + 1,
        '门店': a.store.name,
        '品牌': a.store.brand,
        '出杯数': a.totalCups,
        '客单价': a.avgPrice,
        '等单中位(s)': a.waitMedian,
        '制作中位(s)': a.makeMedian,
        '取餐中位(s)': a.pickupMedian,
        '样本数': a.totalSampleSize,
        '出杯名次': r?.cupsRank ?? '',
        '客单名次': r?.priceRank ?? '',
        '等单名次': r?.waitRank ?? '',
        '是否积压': a.isBacklog ? '是' : '否',
        '积压时段': a.backlogSlots.join(' | '),
        '未完成取餐号': a.pendingOrders.join(' | '),
      };
    });

    const headers = [
      '排名',
      '门店',
      '品牌',
      '出杯数',
      '客单价',
      '等单中位(s)',
      '制作中位(s)',
      '取餐中位(s)',
      '样本数',
      '出杯名次',
      '客单名次',
      '等单名次',
      '是否积压',
      '积压时段',
      '未完成取餐号',
    ];

    const csv = '\ufeff' + toCsv(rows, headers);
    const presetName = activePresetId ? (presets.find(p => p.id === activePresetId)?.name ?? '方案') : '未命名方案';
    const filename = `督导大屏_${selectedDate}_${timeLabel}_${sortLabel}_${presetName}.csv`.replace(/[\\/:*?"<>|]/g, '_');
    downloadTextFile(filename, csv, 'text/csv;charset=utf-8');
  };

  const handleExportPresetsJson = () => {
    const payload = {
      version: 1,
      exportedAt: Date.now(),
      presets,
    };
    const json = JSON.stringify(payload, null, 2);
    const filename = `督导大屏_方案_${selectedDate}.json`.replace(/[\\/:*?"<>|]/g, '_');
    downloadTextFile(filename, json, 'application/json;charset=utf-8');
  };

  const handlePickImportJson = () => {
    importInputRef.current?.click();
  };

  const handleImportJsonFile = async (file: File) => {
    const text = await file.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      window.alert('导入失败：JSON 格式不正确');
      return;
    }

    const incoming = Array.isArray(data)
      ? data
      : (typeof data === 'object' && data !== null && Array.isArray((data as { presets?: unknown }).presets))
        ? (data as { presets: unknown[] }).presets
        : null;
    if (!incoming) {
      window.alert('导入失败：未找到 presets 数组');
      return;
    }

    const result = importPresets(incoming);
    window.alert(`导入完成：新增 ${result.imported} 个，跳过 ${result.skipped} 个（去重/校验）`);
  };

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

      <div className="w-px h-14 bg-[#1B2B44] self-center" />

      <div className="flex flex-col gap-2 min-w-[220px]">
        <span className="text-xs text-[#6B7A99] font-medium tracking-wider uppercase">预警规则</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#1B2B44] border border-[#2A3B5C] rounded px-2 py-1.5">
            <span className="text-[10px] text-[#6B7A99] whitespace-nowrap">阈值</span>
            <select
              value={String(backlogRule.multiplier)}
              onChange={(e) => setBacklogRule({ multiplier: parseFloat(e.target.value) })}
              className="bg-transparent text-[#C8D6E5] text-xs outline-none"
              title="制作时长超过同品牌均值的倍数"
            >
              <option value="1.3">1.3×</option>
              <option value="1.5">1.5×</option>
              <option value="1.8">1.8×</option>
              <option value="2.0">2.0×</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#1B2B44] border border-[#2A3B5C] rounded px-2 py-1.5">
            <span className="text-[10px] text-[#6B7A99] whitespace-nowrap">连续</span>
            <select
              value={String(backlogRule.consecutive)}
              onChange={(e) => setBacklogRule({ consecutive: parseInt(e.target.value, 10) })}
              className="bg-transparent text-[#C8D6E5] text-xs outline-none"
              title="连续满足阈值的时段数"
            >
              <option value="2">≥2</option>
              <option value="3">≥3</option>
              <option value="4">≥4</option>
            </select>
          </div>
        </div>
      </div>

      <div className="w-px h-14 bg-[#1B2B44] self-center" />

      <div className="flex flex-col gap-2 min-w-[220px]">
        <span className="text-xs text-[#6B7A99] font-medium tracking-wider uppercase">方案 & 导出</span>
        <div className="flex items-center gap-2">
          <select
            value={activePresetId ?? ''}
            onChange={(e) => {
              const id = e.target.value;
              if (id) applyPreset(id);
            }}
            className="flex-1 bg-[#1B2B44] border border-[#2A3B5C] text-[#C8D6E5] rounded px-2 py-1.5 text-xs outline-none focus:border-[#3B9EFF] transition-colors"
          >
            <option value="">未选择方案</option>
            {presets.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <button
            onClick={handleCreatePreset}
            className="p-2 rounded bg-[#1B2B44] border border-[#2A3B5C] text-[#6B7A99] hover:text-[#C8D6E5] hover:border-[#3A4B6C] transition-colors"
            title="保存当前为新方案"
          >
            <Save size={14} />
          </button>

          <button
            onClick={handleRenamePreset}
            disabled={!activePresetId}
            className={`p-2 rounded border transition-colors ${
              activePresetId
                ? 'bg-[#1B2B44] border-[#2A3B5C] text-[#6B7A99] hover:text-[#C8D6E5] hover:border-[#3A4B6C]'
                : 'bg-[#0F1D33] border-[#1B2B44] text-[#3A4B6C] cursor-not-allowed'
            }`}
            title="重命名当前方案"
          >
            <Pencil size={14} />
          </button>

          <button
            onClick={handleDeletePreset}
            disabled={!activePresetId}
            className={`p-2 rounded border transition-colors ${
              activePresetId
                ? 'bg-[#1B2B44] border-[#2A3B5C] text-[#6B7A99] hover:text-[#FF6B35] hover:border-[#FF6B35]'
                : 'bg-[#0F1D33] border-[#1B2B44] text-[#3A4B6C] cursor-not-allowed'
            }`}
            title="删除当前方案"
          >
            <Trash2 size={14} />
          </button>

          <button
            onClick={handleExportCsv}
            className="p-2 rounded bg-[#1B2B44] border border-[#2A3B5C] text-[#6B7A99] hover:text-[#00E5A0] hover:border-[#00E5A0] transition-colors"
            title="导出当前筛选结果 CSV"
          >
            <Download size={14} />
          </button>

          <button
            onClick={handleExportPresetsJson}
            className="p-2 rounded bg-[#1B2B44] border border-[#2A3B5C] text-[#6B7A99] hover:text-[#3B9EFF] hover:border-[#3B9EFF] transition-colors"
            title="导出方案 JSON（用于分享/备份）"
          >
            <FileDown size={14} />
          </button>

          <button
            onClick={handlePickImportJson}
            className="p-2 rounded bg-[#1B2B44] border border-[#2A3B5C] text-[#6B7A99] hover:text-[#FFB800] hover:border-[#FFB800] transition-colors"
            title="导入方案 JSON（合并去重）"
          >
            <FileUp size={14} />
          </button>

          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              void handleImportJsonFile(f);
            }}
          />
        </div>
      </div>
    </div>
  );
}
