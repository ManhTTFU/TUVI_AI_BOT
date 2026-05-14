import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { chargeReading, InsufficientBalanceError } from '@/lib/wallet';
import { isValidCardId, type DrawnCard } from '@tuvi/tarot';
import {
  createTarotReading,
  VALID_FIELDS,
  VALID_NUM_CARDS,
  type Gender,
  type NumCards,
  type TarotField,
} from '@/lib/tarot-server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const VALID_GENDER: Gender[] = ['male', 'female'];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Body không hợp lệ' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: 'Thiếu họ tên' }, { status: 400 });
  }
  const gender = body.gender as Gender;
  if (!VALID_GENDER.includes(gender)) {
    return NextResponse.json({ ok: false, error: 'Giới tính không hợp lệ' }, { status: 400 });
  }
  const field = body.field as TarotField;
  if (!VALID_FIELDS.includes(field)) {
    return NextResponse.json({ ok: false, error: 'Lĩnh vực không hợp lệ' }, { status: 400 });
  }
  const question =
    typeof body.question === 'string' && body.question.trim().length > 0
      ? body.question.trim().slice(0, 500)
      : null;
  const numCards = Number(body.numCards);
  if (!VALID_NUM_CARDS.includes(numCards as NumCards)) {
    return NextResponse.json(
      { ok: false, error: 'Số lá phải là 1, 3, 5, 7 hoặc 10' },
      { status: 400 },
    );
  }
  const rawCards = body.cards;
  if (!Array.isArray(rawCards)) {
    return NextResponse.json({ ok: false, error: 'Thiếu danh sách lá' }, { status: 400 });
  }
  if (rawCards.length !== numCards) {
    return NextResponse.json(
      { ok: false, error: `Cần đúng ${numCards} lá, nhận được ${rawCards.length}` },
      { status: 400 },
    );
  }
  const cards: DrawnCard[] = [];
  const seen = new Set<string>();
  for (const raw of rawCards) {
    if (!raw || typeof raw !== 'object') {
      return NextResponse.json({ ok: false, error: 'Lá không hợp lệ' }, { status: 400 });
    }
    const cardId = String((raw as Record<string, unknown>).cardId ?? '');
    const reversed = Boolean((raw as Record<string, unknown>).reversed);
    if (!isValidCardId(cardId)) {
      return NextResponse.json({ ok: false, error: `Lá không tồn tại: ${cardId}` }, { status: 400 });
    }
    if (seen.has(cardId)) {
      return NextResponse.json({ ok: false, error: `Lá trùng: ${cardId}` }, { status: 400 });
    }
    seen.add(cardId);
    cards.push({ cardId, reversed });
  }

  // Charge 5k trước khi tạo reading (gồm AI call). Nếu AI fail, balance đã trừ
  // — admin có thể refund qua admin/transactions. Trade-off acceptable: nếu
  // không charge trước thì spam AI free.
  let charge: Awaited<ReturnType<typeof chargeReading>>;
  try {
    charge = await chargeReading(session.user.id, {
      service: 'tarot',
      metadata: { field, numCards },
    });
  } catch (e) {
    if (e instanceof InsufficientBalanceError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Số dư không đủ để xem Tarot',
          code: 'INSUFFICIENT_BALANCE',
          balanceVnd: e.balance,
          requiredVnd: e.required,
        },
        { status: 402 },
      );
    }
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }

  try {
    const result = await createTarotReading({
      userId: session.user.id,
      name: name.slice(0, 80),
      gender,
      field,
      question,
      numCards: numCards as NumCards,
      cards,
    });
    return NextResponse.json({
      ok: true,
      ...result,
      balanceVnd: charge.balanceAfter,
      chargedVnd: charge.amountCharged,
    });
  } catch (e) {
    const msg = (e as Error).message ?? 'Lỗi không xác định';
    console.error(`[tarot/submit] ${msg}`);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
