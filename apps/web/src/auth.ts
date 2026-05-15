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
      /** Số dư ví VND realtime. Đọc DB mỗi request. */
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
    session: { strategy: 'database' },
    callbacks: {
      async session({ session, user }) {
        const [u] = await db
          .select({
            role: users.role,
            balanceVnd: users.balanceVnd,
          })
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);
        if (session.user) {
          session.user.id = user.id;
          session.user.name = user.name ?? null;
          session.user.email = user.email ?? '';
          session.user.image = user.image ?? null;
          session.user.role = u?.role ?? 'user';
          session.user.balanceVnd = u?.balanceVnd ?? 0;
        }
        return session;
      },
    },
  };
});
