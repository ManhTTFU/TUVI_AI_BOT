import NextAuth, { type DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import Nodemailer from 'next-auth/providers/nodemailer';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { getDb, users, accounts, sessions, verificationTokens } from '@tuvi/db';
import { eq } from 'drizzle-orm';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'user' | 'admin';
      /** Số dư ví VND. Snapshot lúc sign-in / update() — không fresh per request. */
      balanceVnd: number;
    } & DefaultSession['user'];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const db = getDb();

  const providers: any[] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    );
  }

  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    providers.push(
      Facebook({
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        authorization: {
          params: { scope: 'public_profile,email' },
        },
      }),
    );
  }

  if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_FROM) {
    providers.push(
      Nodemailer({
        server: {
          host: process.env.EMAIL_SERVER_HOST,
          port: Number(process.env.EMAIL_SERVER_PORT) || 587,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        },
        from: process.env.EMAIL_FROM,
      }),
    );
  }

  return {
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    providers,
    pages: {
      signIn: '/dang-nhap',
      verifyRequest: '/dang-nhap/check-email',
    },
    trustHost: true,
    session: { strategy: 'jwt' },
    callbacks: {
      async jwt({ token, user, trigger }) {
        if (user) {
          (token as any).id = user.id;
        }
        const tokenId = (token as any).id as string | undefined;
        const needsRefresh = !!user || trigger === 'update';
        if (needsRefresh && tokenId) {
          const [u] = await db
            .select({ role: users.role, balanceVnd: users.balanceVnd })
            .from(users)
            .where(eq(users.id, tokenId))
            .limit(1);
          (token as any).role = u?.role ?? 'user';
          (token as any).balanceVnd = u?.balanceVnd ?? 0;
        }
        return token;
      },
      async session({ session, token }) {
        const t = token as any;
        if (session.user && t.id) {
          session.user.id = t.id;
          session.user.role = (t.role as 'user' | 'admin') ?? 'user';
          session.user.balanceVnd = (t.balanceVnd as number) ?? 0;
        }
        return session;
      },
    },
  };
});
