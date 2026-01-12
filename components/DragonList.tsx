
import React, { useMemo, memo } from 'react';
import { BlockData, IntervalRule } from '../types';
import { Flame, Info, ChevronRight, Grid3X3, BarChart3 } from 'lucide-react';

interface DragonListProps {
  allBlocks: BlockData[];
  rules: IntervalRule[];
}

interface DragonInfo {
  ruleName: string;
  type: 'parity' | 'size';
  value: string;
  count: number;
  color: string;
  threshold: number;
  nextHeight: number;
  rowId?: number; // Only for Bead Row Dragons
}

const DragonList: React.FC<DragonListProps> = memo(({ allBlocks, rules }) => {
  const { trendDragons, beadRowDragons } = useMemo(() => {
    const trendResults: DragonInfo[] = [];
    const beadResults: DragonInfo[] = [];

    if (allBlocks.length === 0) return { trendDragons: [], beadRowDragons: [] };

    rules.forEach(rule => {
      // 1. Filter and align blocks for this rule
      const checkAlignment = (height: number) => {
        if (rule.value <= 1) return true;
        if (rule.startBlock > 0) {
          return height >= rule.startBlock && (height - rule.startBlock) % rule.value === 0;
        }
        return height % rule.value === 0;
      };

      const filtered = allBlocks.filter(b => checkAlignment(b.height)).sort((a, b) => b.height - a.height);
      if (filtered.length === 0) return;

      const threshold = rule.dragonThreshold || 3;
      const latestHeight = filtered[0].height;
      const nextHeight = latestHeight + rule.value;

      // --- Part A: Trend Sequence Dragon (Vertical/Latest Sequence) ---
      const calculateStreak = (key: 'type' | 'sizeType') => {
        let count = 0;
        const firstVal = filtered[0][key];
        for (const b of filtered) {
          if (b[key] === firstVal) count++;
          else break;
        }
        return { value: firstVal, count };
      };

      const pStreak = calculateStreak('type');
      const sStreak = calculateStreak('sizeType');

      if (pStreak.count >= threshold) {
        trendResults.push({
          ruleName: rule.label,
          type: 'parity',
          value: pStreak.value === 'ODD' ? '单' : '双',
          count: pStreak.count,
          color: pStreak.value === 'ODD' ? 'var(--color-odd)' : 'var(--color-even)',
          threshold,
          nextHeight
        });
      }
      if (sStreak.count >= threshold) {
        trendResults.push({
          ruleName: rule.label,
          type: 'size',
          value: sStreak.value === 'BIG' ? '大' : '小',
          count: sStreak.count,
          color: sStreak.value === 'BIG' ? 'var(--color-big)' : 'var(--color-small)',
          threshold,
          nextHeight
        });
      }

      // --- Part B: Bead Road Row Dragon (Horizontal Streaks) ---
      const rows = rule.beadRows || 6;
      const chrono = [...filtered].sort((a, b) => a.height - b.height);
      const total = chrono.length;

      for (let r = 0; r < rows; r++) {
        const rowItems: BlockData[] = [];
        for (let i = r; i < total; i += rows) {
          rowItems.push(chrono[i]);
        }
        
        if (rowItems.length === 0) continue;
        const rowLatest = rowItems.reverse();
        
        const calcRowStreak = (key: 'type' | 'sizeType') => {
          let count = 0;
          const firstVal = rowLatest[0][key];
          for (const b of rowLatest) {
            if (b[key] === firstVal) count++;
            else break;
          }
          return { value: firstVal, count };
        };

        const rpStreak = calcRowStreak('type');
        const rsStreak = calcRowStreak('sizeType');
        const rowNextHeight = rowLatest[0].height + (rule.value * rows);

        if (rpStreak.count >= threshold) {
          beadResults.push({
            ruleName: rule.label,
            type: 'parity',
            value: rpStreak.value === 'ODD' ? '单' : '双',
            count: rpStreak.count,
            color: rpStreak.value === 'ODD' ? 'var(--color-odd)' : 'var(--color-even)',
            threshold,
            nextHeight: rowNextHeight,
            rowId: r + 1
          });
        }
        if (rsStreak.count >= threshold) {
          beadResults.push({
            ruleName: rule.label,
            type: 'size',
            value: rsStreak.value === 'BIG' ? '大' : '小',
            count: rsStreak.count,
            color: rsStreak.value === 'BIG' ? 'var(--color-big)' : 'var(--color-small)',
            threshold,
            nextHeight: rowNextHeight,
            rowId: r + 1
          });
        }
      }
    });

    return { 
      trendDragons: trendResults.sort((a, b) => b.count - a.count),
      beadRowDragons: beadResults.sort((a, b) => b.count - a.count)
    };
  }, [allBlocks, rules]);

  const renderDragonCard = (dragon: DragonInfo, index: number) => (
    <div 
      key={`${dragon.ruleName}-${dragon.type}-${dragon.rowId || 't'}-${index}`}
      className="group relative bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col">
          <span className="px-2 py-0.5 bg-white rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-tighter border border-gray-100 inline-block w-fit">
            {dragon.ruleName}
          </span>
          {dragon.rowId && (
            <span className="mt-1 ml-0.5 text-[8px] font-black text-indigo-500 uppercase">
              珠盘第 {dragon.rowId} 行
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
           <span className={`w-1.5 h-1.5 rounded-full animate-pulse`} style={{ backgroundColor: dragon.color }}></span>
           <span className="text-[9px] font-black text-gray-400 uppercase">实时</span>
        </div>
      </div>

      <div className="flex items-end justify-between border-b border-gray-200/50 pb-4 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div 
              style={{ backgroundColor: dragon.color }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-base font-black shadow-md"
            >
              {dragon.value}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                {dragon.type === 'parity' ? '单双' : '大小'}
              </span>
              <span className="text-xl font-black text-gray-800 leading-none">
                {dragon.value}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[9px] font-black text-gray-400 uppercase mb-0.5">连出</span>
          <div className="flex items-baseline space-x-0.5">
            <span className="text-3xl font-black tabular-nums" style={{ color: dragon.color }}>{dragon.count}</span>
            <span className="text-[10px] font-black text-gray-400">期</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider">预期区块</span>
          <span className="text-xs font-black text-blue-600 tabular-nums flex items-center">
            {dragon.nextHeight}
            <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
          </span>
        </div>
        <div className="px-1.5 py-0.5 bg-white rounded-md border border-gray-100 text-[8px] font-black text-gray-300 uppercase">
          阈值: {dragon.threshold}+
        </div>
      </div>

      {dragon.count >= 5 && (
        <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-md rotate-12 animate-bounce uppercase">
          火热
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* SIDE-BY-SIDE DRAGON SECTIONS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* SECTION 1: TREND DRAGONS */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 flex flex-col min-h-[500px]">
          <div className="flex items-center space-x-3 mb-6 px-1">
            <div className="p-2 bg-amber-50 rounded-xl">
              <BarChart3 className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-800">1. 单双/大小走势长龙</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                基于各采样步长的最新序列连出提醒
              </p>
            </div>
          </div>

          {trendDragons.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 py-20">
              <Info className="w-6 h-6 text-gray-300 mb-2" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">暂无序列长龙</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trendDragons.map(renderDragonCard)}
            </div>
          )}
        </div>

        {/* SECTION 2: BEAD ROW DRAGONS */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 flex flex-col min-h-[500px]">
          <div className="flex items-center space-x-3 mb-6 px-1">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Grid3X3 className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-800">2. 珠盘路行级长龙</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                基于珠盘路左右横向行的连出提醒
              </p>
            </div>
          </div>

          {beadRowDragons.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 py-20">
              <Info className="w-6 h-6 text-gray-300 mb-2" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">暂无珠盘行龙</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {beadRowDragons.map(renderDragonCard)}
            </div>
          )}
        </div>
      </div>
      
      {/* BOTTOM INFO BAR */}
      <div className="p-5 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 flex items-start space-x-4">
         <div className="p-2 bg-blue-100 rounded-lg shrink-0">
           <Info className="w-4 h-4 text-blue-500" />
         </div>
         <div className="space-y-1">
           <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
             长龙提醒规则说明：
           </p>
           <ul className="text-[10px] text-blue-600/80 font-medium space-y-0.5 list-disc pl-4">
             <li><strong>走势长龙</strong>：统计最新连续产生的区块结果。</li>
             <li><strong>珠盘行龙</strong>：统计在珠盘路网格中，同一行位置上连续出现的相同结果（左右横向）。</li>
             <li>所有提醒均实时更新，并根据您在设置中定义的“提醒阈值”进行过滤。</li>
           </ul>
         </div>
      </div>
    </div>
  );
});

DragonList.displayName = 'DragonList';

export default DragonList;
