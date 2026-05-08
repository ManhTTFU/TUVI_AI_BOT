'use client';

/**
 * Overlay 12 chòm sao hoàng đạo (Aries → Pisces) quanh perimeter hero.
 * Mỗi chòm: star pattern gần đúng hình thật + symbol ♈♉♊... + tên VN.
 * Hover 1 chòm → sao + dây + label sáng hơn.
 */

interface Constellation {
  symbol: string;
  name: string;
  stars: Array<[number, number]>; // tọa độ trong box 100x100
  lines: Array<[number, number]>; // chỉ số vào stars
  /** Vị trí trên hero section, CSS percentage. */
  pos: { top?: string; bottom?: string; left?: string; right?: string };
}

const CONSTELLATIONS: Constellation[] = [
  {
    symbol: '♈',
    name: 'Bạch Dương',
    stars: [
      [15, 70],
      [40, 35],
      [65, 25],
      [85, 55],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
    pos: { top: '6%', left: '6%' },
  },
  {
    symbol: '♉',
    name: 'Kim Ngưu',
    stars: [
      [15, 80],
      [35, 55],
      [50, 40],
      [65, 55],
      [85, 80],
      [50, 18],
    ],
    lines: [
      [0, 1],
      [1, 5],
      [1, 3],
      [3, 4],
      [5, 2],
    ],
    pos: { top: '3%', left: '26%' },
  },
  {
    symbol: '♊',
    name: 'Song Tử',
    stars: [
      [30, 18],
      [30, 48],
      [30, 78],
      [70, 22],
      [70, 52],
      [70, 82],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [3, 4],
      [4, 5],
      [0, 3],
    ],
    pos: { top: '5%', right: '26%' },
  },
  {
    symbol: '♋',
    name: 'Cự Giải',
    stars: [
      [50, 25],
      [25, 55],
      [50, 55],
      [75, 55],
      [50, 80],
    ],
    lines: [
      [0, 2],
      [1, 2],
      [2, 3],
      [2, 4],
    ],
    pos: { top: '8%', right: '5%' },
  },
  {
    symbol: '♌',
    name: 'Sư Tử',
    stars: [
      [18, 30],
      [30, 18],
      [48, 25],
      [58, 45],
      [48, 70],
      [80, 70],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
    pos: { top: '34%', right: '3%' },
  },
  {
    symbol: '♍',
    name: 'Xử Nữ',
    stars: [
      [25, 20],
      [75, 20],
      [50, 40],
      [50, 65],
      [50, 85],
    ],
    lines: [
      [0, 2],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    pos: { bottom: '30%', right: '3%' },
  },
  {
    symbol: '♎',
    name: 'Thiên Bình',
    stars: [
      [25, 28],
      [75, 28],
      [35, 72],
      [65, 72],
    ],
    lines: [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
    ],
    pos: { bottom: '6%', right: '22%' },
  },
  {
    symbol: '♏',
    name: 'Hổ Cáp',
    stars: [
      [18, 28],
      [35, 38],
      [50, 32],
      [65, 45],
      [75, 62],
      [68, 82],
      [48, 85],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
    pos: { bottom: '4%', left: '35%' },
  },
  {
    symbol: '♐',
    name: 'Nhân Mã',
    stars: [
      [18, 48],
      [28, 28],
      [48, 20],
      [68, 28],
      [80, 48],
      [72, 68],
      [48, 78],
      [28, 68],
    ],
    lines: [
      [0, 3],
      [0, 4],
      [1, 3],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 7],
      [7, 0],
    ],
    pos: { bottom: '8%', left: '15%' },
  },
  {
    symbol: '♑',
    name: 'Ma Kết',
    stars: [
      [18, 70],
      [48, 20],
      [80, 68],
      [30, 60],
      [68, 58],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [0, 3],
      [3, 4],
      [4, 2],
    ],
    pos: { bottom: '30%', left: '3%' },
  },
  {
    symbol: '♒',
    name: 'Bảo Bình',
    stars: [
      [18, 40],
      [35, 28],
      [50, 50],
      [65, 28],
      [82, 50],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    pos: { top: '34%', left: '3%' },
  },
  {
    symbol: '♓',
    name: 'Song Ngư',
    stars: [
      [20, 28],
      [40, 30],
      [60, 30],
      [80, 28],
      [50, 50],
      [30, 78],
      [70, 78],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
      [4, 5],
      [4, 6],
    ],
    pos: { top: '50%', left: '2%' },
  },
];

export function ZodiacConstellations() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1]"
    >
      {CONSTELLATIONS.map((c) => (
        <ConstellationMark key={c.symbol} c={c} />
      ))}
    </div>
  );
}

function ConstellationMark({ c }: { c: Constellation }) {
  return (
    <div
      className="group pointer-events-auto absolute h-[88px] w-[88px] cursor-help"
      style={c.pos}
      title={`${c.symbol} ${c.name}`}
    >
      <svg
        viewBox="0 0 100 110"
        className="h-full w-full opacity-60 transition group-hover:opacity-100"
      >
        {/* lines */}
        <g
          stroke="currentColor"
          className="text-brand-goldLight/70 transition group-hover:text-brand-gold"
          strokeWidth="0.6"
          fill="none"
        >
          {c.lines.map(([a, b], i) => {
            const [ax, ay] = c.stars[a];
            const [bx, by] = c.stars[b];
            return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} />;
          })}
        </g>
        {/* stars */}
        <g>
          {c.stars.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={1.6}
              fill="currentColor"
              className="text-brand-gold transition group-hover:text-white"
            />
          ))}
        </g>
        {/* symbol + label */}
        <text
          x="50"
          y="104"
          textAnchor="middle"
          fontSize="9"
          className="fill-white/40 transition group-hover:fill-brand-gold"
          style={{ fontFamily: 'inherit' }}
        >
          {c.symbol} {c.name}
        </text>
      </svg>
    </div>
  );
}
