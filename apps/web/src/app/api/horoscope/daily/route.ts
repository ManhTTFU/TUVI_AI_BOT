import { NextResponse } from 'next/server';
import { getDailyHoroscope } from '@/lib/daily-horoscope-server';

export const runtime = 'nodejs';
// Daily reading dùng chung cho mọi user trong ngày → cache CDN/edge nếu muốn,
// nhưng in-process cache đã đủ vì Deepseek call rất rẻ khi miss (1 lần/ngày).
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getDailyHoroscope();
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    const msg = (e as Error).message ?? 'Lỗi không xác định';
    console.error(`[horoscope/daily] ${msg}`);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
