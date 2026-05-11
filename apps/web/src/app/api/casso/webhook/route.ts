import { NextResponse } from 'next/server';
import { isCassoEnabled, reconcileCassoTransactions } from '@/lib/casso';

export const runtime = 'nodejs';

/**
 * Casso webhook endpoint. Bật bằng CASSO_ENABLED=true + CASSO_WEBHOOK_SECRET trong .env.
 * Casso gửi POST với payload { error: 0, data: [...transactions] }.
 *
 * Authentication: Casso gửi `Secure-Token` header — so sánh với CASSO_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  if (!isCassoEnabled()) {
    return NextResponse.json(
      { ok: false, error: 'Casso integration disabled' },
      { status: 503 },
    );
  }

  const secret = process.env.CASSO_WEBHOOK_SECRET;
  if (secret) {
    const token = req.headers.get('secure-token');
    if (token !== secret) {
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 });
    }
  }

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.data)) {
    return NextResponse.json({ ok: false, error: 'Bad payload' }, { status: 400 });
  }

  const count = await reconcileCassoTransactions(body.data);
  return NextResponse.json({ ok: true, reconciled: count });
}
