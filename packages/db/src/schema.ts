import {
  pgTable,
  text,
  timestamp,
  integer,
  bigint,
  uniqueIndex,
  index,
  primaryKey,
  pgEnum,
  jsonb,
  boolean,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const txTypeEnum = pgEnum('tx_type', [
  'topup',
  'charge',
  'refund',
  'admin_credit',
  'subscription',
  'admin_extend',
]);
export const txStatusEnum = pgEnum('tx_status', ['pending', 'completed', 'rejected', 'cancelled']);
export const chartActionEnum = pgEnum('chart_action', ['analyze', 'deep_readings', 'combo']);
export const planEnum = pgEnum('plan', ['monthly', 'semi_annual', 'annual', 'lifetime']);

// ─────────────────────────────────────────────────────────────────────────────
// Auth.js tables (theo chuẩn @auth/drizzle-adapter pg dialect)
// ─────────────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  role: userRoleEnum('role').notNull().default('user'),
  /** Legacy: số dư còn lại từ model cũ (per-chart). Không dùng cho gói PRO mới. */
  balanceVnd: bigint('balance_vnd', { mode: 'number' }).notNull().default(0),
  /**
   * Tier PRO hết hạn lúc nào. null = chưa từng PRO (NORMAL).
   * pro_until > now → PRO. pro_until = year 9999 → lifetime.
   */
  proUntil: timestamp('pro_until', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (acc) => ({
    pk: primaryKey({ columns: [acc.provider, acc.providerAccountId] }),
  }),
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    pk: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Domain tables
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Một lá số do user lập. Hash deterministic theo birth-info để share cache
 * giữa các user (nhiều user cùng ngày sinh → cùng birthHash → cùng chart payload).
 * `name` là tên hiển thị (do user nhập), KHÔNG ảnh hưởng hash.
 */
export const charts = pgTable(
  'charts',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    gender: varchar('gender', { length: 8 }).notNull(), // 'male' | 'female'
    birthDate: varchar('birth_date', { length: 10 }).notNull(), // DD/MM/YYYY
    timeIndex: integer('time_index').notNull(),
    lunarMode: boolean('lunar_mode').notNull().default(false),
    slug: text('slug').notNull().unique(),
    /** sha256(gender|birthDate|timeIndex).slice(0,16) — key share cache */
    birthHash: varchar('birth_hash', { length: 32 }).notNull(),
    chartData: jsonb('chart_data').notNull(), // ChartData snapshot từ iztro
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('charts_user_idx').on(t.userId),
    hashIdx: index('charts_hash_idx').on(t.birthHash),
  }),
);

/**
 * Cache AI sections theo birthHash. KHÔNG khoá theo user — share giữa user
 * cùng ngày sinh để tiết kiệm AI call. Charging user vẫn dựa vào transactions.
 */
export const analyses = pgTable('analyses', {
  birthHash: varchar('birth_hash', { length: 32 }).primaryKey(),
  sections: jsonb('sections').notNull(), // AnalysisSections
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const deepReadings = pgTable(
  'deep_readings',
  {
    birthHash: varchar('birth_hash', { length: 32 }).notNull(),
    year: integer('year').notNull(),
    data: jsonb('data').notNull(), // DeepReadingsData
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.birthHash, t.year] }),
  }),
);

/**
 * Tứ Trụ Bát Tự chart (1 row mỗi lần user submit). Hash deterministic theo
 * (gender|solarDate|hour|minute) để share cache giữa user trùng input.
 * birthPlace + name chỉ là context hiển thị, KHÔNG vào hash.
 */
export const batTuCharts = pgTable(
  'bat_tu_charts',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    gender: varchar('gender', { length: 8 }).notNull(), // 'male' | 'female'
    solarDate: varchar('solar_date', { length: 10 }).notNull(), // DD/MM/YYYY
    hour: integer('hour').notNull(), // 0..23
    minute: integer('minute').notNull(), // 0..59
    birthPlace: text('birth_place'),
    /** sha256(gender|solarDate|hour|minute).slice(0,16) */
    birthHash: varchar('birth_hash', { length: 32 }).notNull(),
    chartData: jsonb('chart_data').notNull(), // BatTuChart snapshot
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('bat_tu_charts_user_idx').on(t.userId),
    hashIdx: index('bat_tu_charts_hash_idx').on(t.birthHash),
  }),
);

/**
 * Cache AI markdown cho Tứ Trụ. PK birthHash — share giữa user cùng input.
 * AI trả về 1 khối markdown nguyên bản (không phải sections), nên lưu text.
 */
export const batTuAnalyses = pgTable('bat_tu_analyses', {
  birthHash: varchar('birth_hash', { length: 32 }).primaryKey(),
  markdown: text('markdown').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

/**
 * Giao dịch ví: topup (admin approve manual hoặc Casso auto), charge (trừ khi
 * lập lá số), refund. amountVnd dương cho topup/refund/admin_credit, ÂM cho charge.
 */
export const transactions = pgTable(
  'transactions',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: txTypeEnum('type').notNull(),
    status: txStatusEnum('status').notNull().default('pending'),
    amountVnd: bigint('amount_vnd', { mode: 'number' }).notNull(),
    /** Mã chuyển khoản unique, vd "VTV12345" — user ghi vào nội dung CK */
    bankRef: varchar('bank_ref', { length: 32 }).unique(),
    /** Metadata: chart id khi charge, admin id khi admin_credit, Casso tx id, v.v. */
    metadata: jsonb('metadata'),
    note: text('note'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { mode: 'date' }),
  },
  (t) => ({
    userIdx: index('tx_user_idx').on(t.userId),
    statusIdx: index('tx_status_idx').on(t.status),
  }),
);

/**
 * Cấu hình bank do admin set (1 dòng duy nhất, key='default'). QR image URL
 * trỏ tới file đã upload (R2/local). Admin có thể đổi bất cứ lúc nào.
 */
export const bankConfig = pgTable('bank_config', {
  key: varchar('key', { length: 32 }).primaryKey().default('default'),
  bankName: text('bank_name').notNull().default(''),
  accountNumber: text('account_number').notNull().default(''),
  accountHolder: text('account_holder').notNull().default(''),
  qrImageUrl: text('qr_image_url'),
  /** Prefix cho bankRef sinh tự động, vd "VTV" → ref = VTV12345 */
  refPrefix: varchar('ref_prefix', { length: 8 }).notNull().default('VTV'),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

/**
 * Bảng giá (LEGACY — model per-chart cũ). Giữ lại để rollback nếu cần.
 */
export const prices = pgTable('prices', {
  action: chartActionEnum('action').primaryKey(),
  amountVnd: bigint('amount_vnd', { mode: 'number' }).notNull(),
  description: text('description'),
});

/**
 * Gói đăng ký PRO. Default seed bằng migration:
 *  - monthly:      20.000đ → 30 ngày
 *  - semi_annual:  50.000đ → 180 ngày
 *  - annual:      100.000đ → 365 ngày
 *  - lifetime:    500.000đ → vĩnh viễn (durationDays=null)
 */
export const subscriptionPlans = pgTable('subscription_plans', {
  plan: planEnum('plan').primaryKey(),
  amountVnd: bigint('amount_vnd', { mode: 'number' }).notNull(),
  /** Số ngày mở rộng pro_until. null = trọn đời. */
  durationDays: integer('duration_days'),
  label: text('label').notNull(),
  description: text('description'),
  /** Hiển thị thứ tự trên UI (asc) */
  sortOrder: integer('sort_order').notNull().default(0),
});

/**
 * Lịch sử mua gói. Mỗi lần admin approve topup gói → 1 row ở đây + extend pro_until.
 */
export const subscriptionPurchases = pgTable(
  'subscription_purchases',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    plan: planEnum('plan').notNull(),
    amountVnd: bigint('amount_vnd', { mode: 'number' }).notNull(),
    transactionId: text('transaction_id').references(() => transactions.id, {
      onDelete: 'set null',
    }),
    /** pro_until sau khi áp dụng purchase này (snapshot, không update lùi). */
    proUntilAfter: timestamp('pro_until_after', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('sub_purchase_user_idx').on(t.userId),
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Chart = typeof charts.$inferSelect;
export type BatTuChartRow = typeof batTuCharts.$inferSelect;
export type BatTuAnalysisRow = typeof batTuAnalyses.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type BankConfig = typeof bankConfig.$inferSelect;
export type Price = typeof prices.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type SubscriptionPurchase = typeof subscriptionPurchases.$inferSelect;
export type Plan = (typeof planEnum.enumValues)[number]; // 'monthly' | 'semi_annual' | 'annual' | 'lifetime'
