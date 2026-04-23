import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL, TELEGRAM_USERNAME } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Tử Vi Đẩu Số AI — Xem lá số, luận giải chi tiết miễn phí',
  description:
    'Nhập ngày giờ sinh, nhận ngay lá số Tử Vi Đẩu Số và bản luận giải 6 phần (tổng quan, sự nghiệp, tình duyên, sức khỏe, vận hạn 10 năm, lời khuyên) miễn phí.',
  alternates: { canonical: '/' },
};

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'Tử Vi Đẩu Số là gì?',
    a: 'Tử Vi Đẩu Số là một môn mệnh lý học phương Đông cổ truyền, sử dụng ngày giờ sinh để lập lá số với 12 cung (Mệnh, Phu Thê, Tài Bạch, Quan Lộc...) và hệ thống các sao (chính tinh, phụ tinh, tứ hóa) để luận đoán vận mệnh.',
  },
  {
    q: 'Lá số tử vi tại Tử Vi AI được tính như thế nào?',
    a: 'Lá số được tính bằng thư viện iztro — một thư viện Tử Vi Đẩu Số chính xác, theo đúng phép tính truyền thống Bắc Phái, có hỗ trợ tiếng Việt. Phần luận giải do mô hình AI Deepseek thực hiện trên dữ liệu lá số.',
  },
  {
    q: 'Tôi cần cung cấp những thông tin gì?',
    a: 'Họ tên, giới tính, ngày sinh dương lịch (DD/MM/YYYY), giờ sinh (1 trong 12 canh giờ), và nơi sinh. Ngày giờ càng chính xác, lá số càng đúng.',
  },
  {
    q: 'Tôi có thể nhận kết quả qua Telegram không?',
    a: 'Có. Ngoài trang web, bạn có thể dùng Telegram Bot: gõ /tuvi để được hỏi lần lượt và nhận file PDF luận giải chi tiết về tin nhắn.',
  },
  {
    q: 'Kết quả có chính xác 100% không?',
    a: 'Lá số được lập đúng theo phép truyền thống. Tuy nhiên nội dung luận giải mang tính tham khảo văn hóa – tinh thần, không phải tư vấn y khoa, pháp lý hay tài chính. Mọi quyết định lớn cần tham khảo chuyên gia phù hợp.',
  },
];

export default function Page() {
  const jsonLdWebsite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tử Vi AI',
    url: SITE_URL,
    inLanguage: 'vi-VN',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/xem-tu-vi?name={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />

      <Hero />
      <ValueSection />
      <HowSection />
      <FaqSection />
      <CTASection />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-purpleDark via-brand-purple to-brand-purpleDark text-brand-cream">
      <div className="absolute inset-0 opacity-20" aria-hidden>
        <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-brand-gold blur-3xl" />
        <div className="absolute right-10 bottom-10 h-52 w-52 rounded-full bg-brand-gold/70 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
        <span className="chip bg-brand-gold/20 text-brand-gold">✦ TỬ VI ĐẨU SỐ AI</span>
        <h1 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight md:text-5xl">
          Lập lá số Tử Vi Đẩu Số & luận giải chi tiết <span className="text-brand-gold">bằng AI</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-brand-goldLight/90">
          Chỉ cần <strong className="text-brand-gold">ngày giờ sinh</strong>, nhận ngay lá số tử vi đẩu số,
          12 cung, chính tinh – phụ tinh, và bản luận giải 6 phần chi tiết dưới dạng PDF chuyên nghiệp.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/xem-tu-vi" className="btn-gold">
            ✦ Xem tử vi miễn phí
          </Link>
          <a
            href={`https://t.me/${TELEGRAM_USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-purple"
          >
            👉 Nhận PDF qua Telegram
          </a>
        </div>
      </div>
    </section>
  );
}

function ValueSection() {
  const items = [
    { icon: '📜', title: 'Lá số chuẩn', desc: 'Tính theo phép Bắc Phái truyền thống (thư viện iztro).' },
    { icon: '🧠', title: 'Luận giải AI', desc: 'Phân tích 6 phần sâu sắc: mệnh – nghiệp – duyên – sức khỏe – đại vận – lời khuyên.' },
    { icon: '📄', title: 'PDF đẹp', desc: 'File PDF in ấn chuyên nghiệp với font Noto Sans tiếng Việt.' },
    { icon: '🤖', title: 'Bot Telegram', desc: 'Trải nghiệm hỏi – đáp nhanh gọn, gửi PDF thẳng về chat.' },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-3xl font-bold text-brand-purple">Tại sao chọn Tử Vi AI?</h2>
        <p className="mt-3 text-brand-mute">
          Kết hợp giữa khoa lý tử vi đẩu số cổ truyền và sức mạnh AI hiện đại để cho ra bản luận giải dễ đọc, có chiều sâu.
        </p>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.title} className="card">
            <div className="text-3xl">{it.icon}</div>
            <div className="mt-3 font-serif text-lg font-semibold text-brand-purple">{it.title}</div>
            <p className="mt-2 text-sm text-brand-mute">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowSection() {
  const steps = [
    { n: '01', title: 'Nhập thông tin', desc: 'Họ tên, giới tính, ngày sinh dương, giờ sinh, nơi sinh.' },
    { n: '02', title: 'Lập lá số', desc: 'Hệ thống tính 12 cung, các chính – phụ tinh, tứ hóa, đại hạn.' },
    { n: '03', title: 'AI luận giải', desc: 'AI phân tích 6 phần bám sát dữ liệu lá số.' },
    { n: '04', title: 'Nhận PDF', desc: 'Bản luận giải dạng PDF tím – vàng sang trọng.' },
  ];
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-bold text-brand-purple">Cách hoạt động</h2>
          <p className="mt-3 text-brand-mute">4 bước đơn giản.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-brand-goldLight/60 p-6">
              <div className="font-serif text-3xl font-bold text-brand-gold">{s.n}</div>
              <div className="mt-2 font-semibold text-brand-purple">{s.title}</div>
              <p className="mt-1 text-sm text-brand-mute">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-bold text-brand-purple">Câu hỏi thường gặp</h2>
        <p className="mt-3 text-brand-mute">Những điều bạn muốn biết về Tử Vi AI.</p>
      </div>
      <div className="mt-8 space-y-3">
        {FAQS.map((f, i) => (
          <details key={i} className="card group cursor-pointer">
            <summary className="flex items-center justify-between gap-4 font-semibold text-brand-purple">
              <span>{f.q}</span>
              <span className="text-brand-gold transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-brand-ink">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-12 text-center">
      <div className="rounded-3xl bg-brand-purple p-10 text-brand-cream shadow-soft">
        <h2 className="font-serif text-3xl font-bold text-brand-gold">Sẵn sàng xem lá số của bạn?</h2>
        <p className="mt-3 text-brand-goldLight/90">Miễn phí, không cần đăng ký.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link href="/xem-tu-vi" className="btn-gold">✦ Xem tử vi ngay</Link>
          <a
            href={`https://t.me/${TELEGRAM_USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-purple"
          >
            👉 Nhận PDF qua Telegram
          </a>
        </div>
      </div>
    </section>
  );
}
