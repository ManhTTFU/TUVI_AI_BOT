'use client';

import type { ChartData } from '@tuvi/core';

const SERIF_FONT = "'Cormorant Garamond',serif";

export default function VietnameseCenter({ chart }: { chart: ChartData }) {
  const isMale = chart.info.gender === 'male';
  const rows: Array<[string, string]> = [
    ['Ngũ hành cục', chart.fiveElementsClass],
    ['Dương lịch', chart.solarDate],
    ['Âm lịch', chart.lunarDate],
    ['Tứ trụ Can Chi', chart.chineseDate],
    ['Giờ sinh', `${chart.time} (${chart.timeRange})`],
    ['Con giáp', chart.zodiac],
    ['Cung hoàng đạo', chart.sign],
    ['Mệnh chủ', chart.soul],
    ['Thân chủ', chart.body],
    ['Địa chi Mệnh', chart.earthlyBranchOfSoulPalace],
    ['Địa chi Thân', chart.earthlyBranchOfBodyPalace],
  ];
  return (
    <div
      className="pointer-events-none absolute inset-0 grid"
      style={{
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'repeat(4, 1fr)',
        gap: 3,
      }}
    >
      <div
        className="pointer-events-auto rounded-md border-2 border-[#c89146]/55 bg-gradient-to-br from-[#fbf3e2] to-[#f5e3c0] flex flex-col p-3 overflow-hidden"
        style={{ gridColumn: '2 / span 2', gridRow: '2 / span 2' }}
      >
        <div className="text-center mb-2">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#4a3a30] font-semibold">
            Lá Số Tử Vi
          </div>
          <div
            className="mt-0.5 text-xl font-serif italic text-[#5a3a1a]"
            style={{ fontFamily: SERIF_FONT }}
          >
            {isMale ? '♂ Càn Tạo' : '♀ Khôn Tạo'}
          </div>
          <div className="mt-0.5 text-[11px] text-[#0f0a08] font-medium truncate px-2">
            {chart.info.name}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] leading-[1.45] overflow-y-auto">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2 min-w-0">
              <span className="text-[#4a3a30]">{k}</span>
              <span className="font-semibold text-[#5a3a1a] truncate text-right">
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
