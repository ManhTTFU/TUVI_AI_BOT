'use client';

import { SessionProvider } from 'next-auth/react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Không poll — SSE handle balance real-time, updateSession() gọi sau mỗi submit.
  // refetchOnWindowFocus giữ để sync khi user quay lại từ tab khác.
  return (
    <SessionProvider refetchOnWindowFocus>
      {children}
    </SessionProvider>
  );
}
