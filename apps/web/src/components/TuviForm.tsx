'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { API_BASE_URL } from '@/lib/env';

const CANH_GIO = [
  { i: 0, name: 'Tý', range: '23:00 – 01:00' },
  { i: 1, name: 'Sửu', range: '01:00 – 03:00' },
  { i: 2, name: 'Dần', range: '03:00 – 05:00' },
  { i: 3, name: 'Mão', range: '05:00 – 07:00' },
  { i: 4, name: 'Thìn', range: '07:00 – 09:00' },
  { i: 5, name: 'Tỵ', range: '09:00 – 11:00' },
  { i: 6, name: 'Ngọ', range: '11:00 – 13:00' },
  { i: 7, name: 'Mùi', range: '13:00 – 15:00' },
  { i: 8, name: 'Thân', range: '15:00 – 17:00' },
  { i: 9, name: 'Dậu', range: '17:00 – 19:00' },
  { i: 10, name: 'Tuất', range: '19:00 – 21:00' },
  { i: 11, name: 'Hợi', range: '21:00 – 23:00' },
];

function isValidDate(v: string) {
  const m = v.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return false;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12) return false;
  const days = new Date(y, mo, 0).getDate();
  return d >= 1 && d <= days && y >= 1900 && y <= 2100;
}

export default function TuviForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState('');
  const [timeIndex, setTimeIndex] = useState<number | null>(null);
  const [birthPlace, setBirthPlace] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const valid = useMemo(
    () =>
      name.trim().length >= 2 &&
      isValidDate(birthDate) &&
      timeIndex !== null &&
      birthPlace.trim().length >= 2,
    [name, birthDate, timeIndex, birthPlace],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    setProgress('Đang lập lá số và gọi AI (1–2 phút)...');
    try {
      const res = await fetch(`${API_BASE_URL}/api/tuvi/full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          gender,
          birthDate: birthDate.trim(),
          timeIndex,
          birthPlace: birthPlace.trim(),
        }),
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error || 'Lỗi không xác định');
      router.push(`/tu-vi/${data.slug}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field label="Họ và tên">
        <input
          type="text"
          placeholder="Nguyễn Văn A"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-brand-goldLight bg-white px-4 py-3 outline-none transition focus:border-brand-purple focus:shadow-ring"
          required
        />
      </Field>

      <Field label="Giới tính">
        <div className="flex gap-3">
          {(['male', 'female'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={[
                'flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition',
                gender === g
                  ? 'border-brand-purple bg-brand-purple text-brand-cream shadow-soft'
                  : 'border-brand-goldLight bg-white text-brand-purple hover:bg-brand-gold/10',
              ].join(' ')}
            >
              {g === 'male' ? '👨 Nam' : '👩 Nữ'}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Ngày sinh dương lịch">
        <input
          type="text"
          placeholder="DD/MM/YYYY (vd: 15/08/1995)"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="w-full rounded-xl border border-brand-goldLight bg-white px-4 py-3 outline-none transition focus:border-brand-purple focus:shadow-ring"
          required
        />
        {birthDate && !isValidDate(birthDate) && (
          <p className="mt-2 text-xs text-red-600">Ngày không hợp lệ (định dạng DD/MM/YYYY).</p>
        )}
      </Field>

      <Field label="Giờ sinh (canh giờ)">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {CANH_GIO.map((g) => (
            <button
              key={g.i}
              type="button"
              onClick={() => setTimeIndex(g.i)}
              className={[
                'rounded-xl border px-3 py-2 text-xs font-semibold transition',
                timeIndex === g.i
                  ? 'border-brand-purple bg-brand-purple text-brand-cream shadow-soft'
                  : 'border-brand-goldLight bg-white text-brand-purple hover:bg-brand-gold/10',
              ].join(' ')}
            >
              <div className="text-sm">{g.name}</div>
              <div className="text-[10px] opacity-80">{g.range}</div>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Nơi sinh">
        <input
          type="text"
          placeholder="Hà Nội"
          value={birthPlace}
          onChange={(e) => setBirthPlace(e.target.value)}
          className="w-full rounded-xl border border-brand-goldLight bg-white px-4 py-3 outline-none transition focus:border-brand-purple focus:shadow-ring"
          required
        />
      </Field>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-brand-mute">
          Bằng việc gửi form, bạn đồng ý rằng kết quả chỉ mang tính tham khảo.
        </p>
        <button
          type="submit"
          disabled={!valid || loading}
          className="btn-primary disabled:opacity-60"
        >
          {loading ? '⏳ Đang xử lý...' : '✦ Lập lá số'}
        </button>
      </div>

      {loading && (
        <div className="rounded-xl border border-brand-gold bg-brand-gold/10 p-4 text-sm text-brand-purple">
          {progress}
        </div>
      )}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-brand-purple">{label}</span>
      {children}
    </label>
  );
}
