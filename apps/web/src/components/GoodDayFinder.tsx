'use client';

import { useMemo, useState } from 'react';
import { getDayInfo, type DayInfo } from '@tuvi/lichvannien';

interface WorkType {
  value: string;
  label: string;
  /** Từ khóa khớp với `STAR_ADVICE[star].nen[i]` — match nếu item trong `nen` chứa keyword. */
  keywords: string[];
}

const WORK_TYPES: WorkType[] = [
  { value: 'cuoi-hoi', label: 'Cưới hỏi', keywords: ['Hôn lễ', 'Cưới hỏi', 'Đính hôn'] },
  { value: 'khai-truong', label: 'Khai trương', keywords: ['Khai trương'] },
  { value: 'xuat-hanh', label: 'Xuất hành / Đi xa', keywords: ['Xuất hành', 'Đi xa'] },
  { value: 'dong-tho', label: 'Động thổ / Xây dựng', keywords: ['Xây dựng', 'Động thổ'] },
  { value: 'nhap-trach', label: 'Nhập trạch', keywords: ['Nhập trạch'] },
  { value: 'cau-tai', label: 'Cầu tài', keywords: ['Cầu tài'] },
  { value: 'ky-ket', label: 'Ký kết / Giao dịch', keywords: ['Ký kết', 'Giao dịch'] },
  { value: 'thi-cu', label: 'Thi cử / Đàm phán', keywords: ['Thi cử', 'Đàm phán'] },
];

const WEEKDAY_VI = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

function shortHourRange(range: string): string {
  return range.replace(/\s+/g, '');
}

function matchWork(nen: string[], keywords: string[]): boolean {
  return nen.some((item) =>
    keywords.some((kw) => item.toLowerCase().includes(kw.toLowerCase()))
  );
}

export function GoodDayFinder() {
  const today = useMemo(() => new Date(), []);
  const [workType, setWorkType] = useState(WORK_TYPES[0].value);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [query, setQuery] = useState<{ work: string; m: number; y: number } | null>(null);

  const results = useMemo<DayInfo[]>(() => {
    if (!query) return [];
    const work = WORK_TYPES.find((w) => w.value === query.work);
    if (!work) return [];
    const daysInMonth = new Date(query.y, query.m, 0).getDate();
    const list: DayInfo[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const info = getDayInfo(d, query.m, query.y);
      if (info.dayStar.kind !== 'hoang-dao') continue;
      if (!matchWork(info.advice.nen, work.keywords)) continue;
      list.push(info);
    }
    return list;
  }, [query]);

  const yearOptions = useMemo(() => {
    const base = today.getFullYear();
    return Array.from({ length: 5 }, (_, i) => base - 1 + i);
  }, [today]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery({ work: workType, m: month, y: year });
  };

  const currentWork = WORK_TYPES.find((w) => w.value === workType)?.label ?? '';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f5ebd9] via-[#f0e2c8] to-[#ead5b3] py-20 text-[#3a2214]">
      {/* washi paper grain — subtle warm radial để tránh flat */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(217, 167, 85, 0.25), transparent 55%), radial-gradient(circle at 80% 80%, rgba(146, 64, 14, 0.18), transparent 55%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-600/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-amber-900 ring-1 ring-amber-700/30">
            <span>✦</span> Xem Ngày Tốt
          </span>
          <h2 className="mt-4 font-serif text-3xl font-bold text-[#0f0a08] md:text-4xl">
            Chọn việc cần làm — tìm ngày hoàng đạo
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-[#5c3a1e]/80">
            Dựa trên 12 sao Ngọc Hạp và khuyến nghị truyền thống theo từng loại việc
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[340px_1fr]">
          {/* LEFT — filters */}
          <form
            onSubmit={handleSubmit}
            className="relative h-fit overflow-hidden rounded-2xl bg-white/80 p-6 shadow-lg shadow-amber-900/10 ring-1 ring-amber-700/20 backdrop-blur-sm"
          >
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-amber-800">
              Xem ngày tốt
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#5c3a1e]/85">
              Xem ngày đẹp trong tháng theo từng loại việc để chuẩn bị kế hoạch phù hợp.
            </p>

            <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-amber-800">
              Chọn việc cần làm
            </label>
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              className="mt-2 w-full rounded-lg border border-amber-700/30 bg-white px-3 py-2.5 text-sm text-[#3a2214] shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              {WORK_TYPES.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-800">
                  Tháng
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="mt-2 w-full rounded-lg border border-amber-700/30 bg-white px-3 py-2.5 text-sm text-[#3a2214] shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-800">
                  Năm
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="mt-2 w-full rounded-lg border border-amber-700/30 bg-white px-3 py-2.5 text-sm text-[#3a2214] shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-6 py-3 text-sm font-semibold text-[#0f0a08] shadow-lg shadow-amber-700/25 ring-1 ring-amber-100/60 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-600/30"
            >
              Xem ngay
            </button>
          </form>

          {/* RIGHT — results */}
          <div className="relative">
            {!query && (
              <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-white/50 p-8 text-center ring-1 ring-amber-700/15 backdrop-blur-sm">
                <div className="text-sm text-[#5c3a1e]/70">
                  Chọn loại việc + tháng/năm rồi nhấn <strong className="text-amber-800">Xem ngay</strong> để xem danh sách ngày hoàng đạo phù hợp.
                </div>
              </div>
            )}

            {query && results.length === 0 && (
              <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-white/50 p-8 text-center ring-1 ring-amber-700/15 backdrop-blur-sm">
                <div className="text-sm text-[#5c3a1e]/80">
                  Không có ngày hoàng đạo phù hợp với{' '}
                  <strong>{currentWork.toLowerCase()}</strong> trong tháng {query.m}/{query.y}.
                  <br />
                  Hãy thử loại việc khác hoặc xem tháng kế tiếp.
                </div>
              </div>
            )}

            {query && results.length > 0 && (
              <>
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="text-sm text-[#5c3a1e]">
                    <strong className="text-[#0f0a08]">{results.length}</strong> ngày hoàng đạo phù hợp{' '}
                    <strong className="text-amber-800">{currentWork.toLowerCase()}</strong> · Tháng{' '}
                    {query.m}/{query.y}
                  </div>
                </div>
                <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
                  {results.map((info) => (
                    <GoodDayCard key={`${info.solar.year}-${info.solar.month}-${info.solar.day}`} info={info} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function GoodDayCard({ info }: { info: DayInfo }) {
  const weekday = WEEKDAY_VI[info.solar.weekday] ?? '';
  return (
    <article className="relative overflow-hidden rounded-xl bg-white/85 p-4 shadow-md shadow-amber-900/10 ring-1 ring-amber-700/20 backdrop-blur-sm transition hover:bg-white hover:shadow-lg hover:ring-amber-700/40">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
        {/* Left — weekday + day number */}
        <div className="flex min-w-[72px] flex-col items-center rounded-lg bg-amber-600/10 px-3 py-3 ring-1 ring-amber-700/20">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-900/80">
            {weekday.replace('Thứ ', 'Thứ ')}
          </div>
          <div className="mt-1 font-serif text-3xl font-bold leading-none text-amber-900">
            {info.solar.day}
          </div>
          <div className="mt-1 text-[10px] text-[#5c3a1e]/70">
            {info.solar.month}/{info.solar.year}
          </div>
        </div>

        {/* Middle — details */}
        <div className="min-w-0">
          <div className="text-xs text-[#5c3a1e]/75">
            <strong className="text-[#0f0a08]">Âm lịch:</strong> {info.lunar.day}/{info.lunar.month}
            {info.lunar.leap ? ' (nhuận)' : ''}/{info.lunar.year}
          </div>
          <div className="mt-1 text-xs text-[#5c3a1e]/75">
            <strong className="text-[#0f0a08]">Ngày:</strong> {info.canChiText.day} · Trực{' '}
            <strong className="text-emerald-700">{info.dayStar.name}</strong>
          </div>
          <div className="mt-1 text-xs text-[#5c3a1e]/75">
            <strong className="text-[#0f0a08]">Giờ Hoàng Đạo:</strong>{' '}
            {info.luckyHours
              .map((h) => `${h.chi} (${shortHourRange(h.range)})`)
              .join(', ')}
          </div>
        </div>

        {/* Right — badge */}
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-500/30">
            Hoàng Đạo
          </span>
        </div>
      </div>
    </article>
  );
}
