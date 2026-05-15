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
  return NextResponse.json(status);
}
