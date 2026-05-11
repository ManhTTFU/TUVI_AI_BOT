import { auth } from '@/auth';
import { getDb, bankConfig } from '@tuvi/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Không có quyền' }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const bankName = String(body.bankName ?? '').trim();
  const accountNumber = String(body.accountNumber ?? '').trim();
  const accountHolder = String(body.accountHolder ?? '').trim();
  const qrImageUrl = body.qrImageUrl ? String(body.qrImageUrl).trim() : null;
  const refPrefix =
    String(body.refPrefix ?? 'VTV').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) ||
    'VTV';

  const db = getDb();
  await db
    .insert(bankConfig)
    .values({
      key: 'default',
      bankName,
      accountNumber,
      accountHolder,
      qrImageUrl,
      refPrefix,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: bankConfig.key,
      set: {
        bankName,
        accountNumber,
        accountHolder,
        qrImageUrl,
        refPrefix,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true });
}
