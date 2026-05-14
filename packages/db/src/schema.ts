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
// 'subscription' và 'admin_extend' giữ lại cho historical rows từ model PRO cũ
// (Postgres không hỗ trợ drop enum value khi còn row dùng). Code mới KHÔNG tạo
// hai loại này — chỉ dùng topup/charge/refund/admin_credit.
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
  /**
   * Số dư ví VND. Cache denormalized của ledger `transactions` — source of truth
   * vẫn là ledger; mỗi lần charge/topup phải UPDATE balance + INSERT row trong
   * cùng db.transaction() để giữ atomic. Backfill ban đầu trong migration 0008.
   */
  balanceVnd: bigint('balance_vnd', { mode: 'number' }).notNull().default(0),
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
    /** sha256(gender|birthDate|timeIndex).slice(0,16) — key share cache */
    birthHash: varchar('birth_hash', { length: 32 }).notNull(),
    chartData: jsonb('chart_data').notNull(), // ChartData snapshot từ iztro
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('charts_user_created_idx').on(t.userId, t.createdAt),
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
    userCreatedIdx: index('bat_tu_charts_user_created_idx').on(t.userId, t.createdAt),
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
 * Bảng giá hành động — chỉ còn 1 row 'analyze' = giá 1 lần luận giải (5k VND).
 * Tách ra bảng để admin có thể đổi giá runtime mà không phải redeploy. Code
 * lookup qua `wallet.getReadingPriceVnd()` (fallback constant nếu DB rỗng).
 */
export const prices = pgTable('prices', {
  action: chartActionEnum('action').primaryKey(),
  amountVnd: bigint('amount_vnd', { mode: 'number' }).notNull(),
  description: text('description'),
});

/**
 * Submission record cho luận giải Hoàng Đạo. 1 row mỗi user × combo unique.
 * KHÔNG chứa reading — reading nằm ở `hoang_dao_analyses` (share cross-user
 * theo birthHash để tiết kiệm Deepseek call).
 *
 * Hash: sha256(signEn|gender|status|goal).slice(0,16). Cùng combo → cùng hash
 * → cùng reading bất kể user nào. Match pattern `charts` + `analyses` của Tử Vi.
 */
export const hoangDaoCharts = pgTable(
  'hoang_dao_charts',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    signEn: varchar('sign_en', { length: 16 }).notNull(),
    gender: varchar('gender', { length: 8 }).notNull(),
    status: varchar('status', { length: 12 }).notNull(),
    goal: varchar('goal', { length: 12 }).notNull(),
    /** sha256(signEn|gender|status|goal).slice(0,16) — key share AI cache */
    birthHash: varchar('birth_hash', { length: 32 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('hoang_dao_charts_user_created_idx').on(t.userId, t.createdAt),
    hashIdx: index('hoang_dao_charts_hash_idx').on(t.birthHash),
    uniqUserHash: uniqueIndex('hoang_dao_charts_user_hash_uniq').on(t.userId, t.birthHash),
  }),
);

/**
 * Cache AI reading Hoàng Đạo. PK = birthHash → share cross-user.
 * Reading là `PersonalizedReading` JSON structured (personality/love/career/advice).
 */
export const hoangDaoAnalyses = pgTable('hoang_dao_analyses', {
  birthHash: varchar('birth_hash', { length: 32 }).primaryKey(),
  reading: jsonb('reading').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

/**
 * Cache 12 reading hoàng đạo hôm nay (Deepseek sinh 1 lần/ngày).
 * PK theo ngày VN (YYYY-MM-DD, UTC+7) → mọi instance share cache, tránh
 * gọi Deepseek N lần khi scale ngang. INSERT ... ON CONFLICT DO NOTHING
 * khi 2 instance cùng miss và race.
 */
export const dailyHoroscope = pgTable('daily_horoscope', {
  date: varchar('date', { length: 10 }).primaryKey(), // YYYY-MM-DD
  /** Map: tên cung tiếng Anh (Aries, ...) → đoạn 2-3 câu VN. */
  readings: jsonb('readings').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

/**
 * Submission record cho Tarot. 1 row mỗi phiên rút bài (cùng user có thể rút
 * cùng combo nhiều lần — mỗi phiên là 1 row riêng, KHÔNG dedup theo hash).
 *
 * Lý do khác `hoang_dao_charts` (unique user+hash): hoàng đạo input cố định
 * (4 axes) nên 1 user 1 combo logic = 1 lịch sử. Tarot là rút ngẫu nhiên 78
 * chọn N, không gian combination quá lớn (~12M cho n=5) → unique không hữu
 * ích, user có thể muốn rút lại cùng câu hỏi nhiều lần để xem khác biệt.
 *
 * Hash: sha256(sortedCards|reversed|field).slice(0,16) — share AI reading
 * cache cross-user. Cùng tập lá + cùng field → cùng base reading.
 * name + question đi qua personalize layer riêng (KHÔNG cache).
 */
export const tarotCharts = pgTable(
  'tarot_charts',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    gender: varchar('gender', { length: 8 }).notNull(), // 'male' | 'female'
    field: varchar('field', { length: 16 }).notNull(), // love|career|finance|health|general
    question: text('question'), // optional câu hỏi cụ thể
    numCards: integer('num_cards').notNull(), // 1|3|5|7|10
    cards: jsonb('cards').notNull(), // DrawnCard[] = [{cardId, reversed}, ...]
    /** sha256(sortedCards|reversed|field).slice(0,16) */
    readingHash: varchar('reading_hash', { length: 32 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('tarot_charts_user_created_idx').on(t.userId, t.createdAt),
    hashIdx: index('tarot_charts_hash_idx').on(t.readingHash),
  }),
);

/**
 * Cache AI reading Tarot. PK = readingHash → share cross-user.
 * Reading lưu cả per-card paragraphs + overall markdown.
 * Personalize layer (gọi tên user, trả lời câu hỏi) chạy per-request, KHÔNG cache ở đây.
 */
export const tarotReadings = pgTable('tarot_readings', {
  readingHash: varchar('reading_hash', { length: 32 }).primaryKey(),
  /** Snapshot lá rút để regenerate khi miss + audit. */
  cardsJson: jsonb('cards_json').notNull(),
  field: varchar('field', { length: 16 }).notNull(),
  /** [{cardId, reversed, paragraph (VN markdown)}] — 1 entry mỗi lá. */
  perCard: jsonb('per_card').notNull(),
  /** Markdown tổng kết 5-7 câu cho cả trải bài. */
  overallMarkdown: text('overall_markdown').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

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
export type DailyHoroscopeRow = typeof dailyHoroscope.$inferSelect;
export type HoangDaoChartRow = typeof hoangDaoCharts.$inferSelect;
export type HoangDaoAnalysisRow = typeof hoangDaoAnalyses.$inferSelect;
export type TarotChartRow = typeof tarotCharts.$inferSelect;
export type TarotReadingRow = typeof tarotReadings.$inferSelect;
