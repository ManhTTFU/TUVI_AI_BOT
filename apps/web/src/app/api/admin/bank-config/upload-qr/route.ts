import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { randomBytes } from 'node:crypto';

const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const MAX_SIZE = 500 * 1024; // 500KB

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Không có quyền' }, { status: 403 });
  }

  const fd = await req.formData();
  const file = fd.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Thiếu file' }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { ok: false, error: 'Định dạng không hỗ trợ (PNG/JPG/WebP)' },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { ok: false, error: 'File quá lớn (>500KB)' },
      { status: 400 },
    );
  }

  // Lưu vào /public/uploads để Next.js serve trực tiếp.
  const dir = resolve(process.cwd(), 'public', 'uploads');
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });

  const ext = extname(file.name) || (file.type === 'image/png' ? '.png' : '.jpg');
  const name = `qr-${randomBytes(6).toString('hex')}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(resolve(dir, name), buf);

  return NextResponse.json({ ok: true, url: `/uploads/${name}` });
}
