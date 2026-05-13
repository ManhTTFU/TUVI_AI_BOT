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
      /** ISO string của thời điểm gói PRO hết hạn. null = chưa từng PRO. */
      proUntil: string | null;
      /** Derived: 'PRO' nếu proUntil > now, else 'NORMAL'. */
      tier: 'PRO' | 'NORMAL';
    } & DefaultSession['user'];
  }
}

const db = getDb();

const providers: any[] = [];

// Google OAuth — chỉ enable nếu có cả 2 env.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

// Facebook OAuth — phổ biến ở VN. Enable nếu có App ID + Secret.
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      // Facebook v18+ Graph: phải request explicitly public_profile + email,
      // không gửi tham số `scope` đơn lẻ (gây "Invalid Scopes" warning dev).
      authorization: {
        params: { scope: 'public_profile,email' },
      },
    }),
  );
}

// Email magic link — chỉ enable nếu có SMTP config + EMAIL_FROM.
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

export const { handlers, auth, signIn, signOut } = NextAuth({
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
      // Inject role + proUntil từ DB (read mỗi request để realtime).
      const [u] = await db
        .select({
          role: users.role,
          proUntil: users.proUntil,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      if (session.user) {
        session.user.id = user.id;
        // Auth.js v5 beta đôi khi không tự populate name/email/image từ adapter
        // user vào session.user — gán tay để chắc chắn FE có avatar/tên.
        session.user.name = user.name ?? null;
        session.user.email = user.email ?? '';
        session.user.image = user.image ?? null;
        session.user.role = u?.role ?? 'user';
        session.user.proUntil = u?.proUntil ? u.proUntil.toISOString() : null;
        session.user.tier =
          u?.proUntil && u.proUntil.getTime() > Date.now() ? 'PRO' : 'NORMAL';
      }
      return session;
    },
  },
});
