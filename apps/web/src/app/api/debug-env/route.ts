import { NextResponse } from 'next/server';

const SAFE_KEYS = [
  'DEEPSEEK_API_KEY',
  'DEEPSEEK_BASE_URL',
  'DEEPSEEK_MODEL',
  'DATABASE_URL',
  'AUTH_SECRET',
  'NEXTAUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'FACEBOOK_CLIENT_ID',
  'FACEBOOK_CLIENT_SECRET',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_API_BASE_URL',
  'AI_CONCURRENCY',
];

export async function GET() {
  const status: Record<string, string> = {};
  for (const key of SAFE_KEYS) {
    const val = process.env[key];
    status[key] = val ? `SET (len=${val.length})` : 'MISSING';
  }

  // Test raw fetch tới Deepseek — bypass OpenAI SDK để xác định networking issue
  const apiKey = process.env.DEEPSEEK_API_KEY;
  let deepseekTest: Record<string, unknown> = { skipped: 'no api key' };
  if (apiKey) {
    try {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Say "ok"' }],
          max_tokens: 5,
        }),
      });
      const body = await res.text();
      deepseekTest = { status: res.status, body: body.slice(0, 300) };
    } catch (e) {
      deepseekTest = { error: (e as Error).message };
    }
  }

  return NextResponse.json({ env: status, deepseekTest });
}
