import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getTarotReadingById } from '@/lib/tarot-server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: { chartId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }
  try {
    const result = await getTarotReadingById(params.chartId, session.user.id);
    if (!result) {
      return NextResponse.json({ ok: false, error: 'Không tìm thấy' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = (e as Error).message ?? 'Lỗi không xác định';
    console.error(`[tarot/get] ${msg}`);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
