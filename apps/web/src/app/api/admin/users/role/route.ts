import { auth } from '@/auth';
import { getDb, users } from '@tuvi/db';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Không có quyền' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId ?? '').trim();
  const role = body.role;

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Thiếu userId' }, { status: 400 });
  }
  if (role !== 'admin' && role !== 'user') {
    return NextResponse.json({ ok: false, error: 'Role không hợp lệ' }, { status: 400 });
  }

  // Chống tự demote chính mình (tránh khoá ngoài admin cuối cùng).
  if (userId === session.user.id && role !== 'admin') {
    return NextResponse.json(
      { ok: false, error: 'Không thể tự gỡ quyền admin của chính mình' },
      { status: 400 },
    );
  }

  const db = getDb();
  const [updated] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId))
    .returning({ id: users.id, role: users.role });

  if (!updated) {
    return NextResponse.json({ ok: false, error: 'User không tồn tại' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, role: updated.role });
}
