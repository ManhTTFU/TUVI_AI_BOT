'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { WalletRealtimeBridge } from './WalletRealtimeBridge';

export function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  // session prop từ server (RootLayout) → SessionProvider không cần fetch initial.
  // refetchOnWindowFocus=false vì Supabase Realtime đã push balance change;
  // không cần focus refetch (mỗi focus tốn 1 call /api/auth/session).
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <WalletRealtimeBridge />
      {children}
    </SessionProvider>
  );
}
