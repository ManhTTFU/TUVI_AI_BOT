"use client";

import { useState } from "react";
import type {
  AnalysisSections,
  ChartData,
  DaiHanReading,
  DeepReadingsData,
  NamHienTaiReading,
  PalaceData,
  TieuHanReading,
  TwelvePalaceReading,
} from "@tuvi/core";
import { ANALYSIS_TITLES } from "@tuvi/core";

const ANALYSIS_ORDER: Array<keyof AnalysisSections> = [
  "overview",
  "career",
  "love",
  "health",
  "decade",
  "advice",
];

const SERIF_FONT = "'Cormorant Garamond',serif";

const CHI_TV = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
];

const STAR_MEANING: Record<string, string> = {
  "Tử Vi": "đế tinh, lãnh đạo, uy nghi",
  "Thiên Cơ": "trí tuệ, mưu lược, linh hoạt",
  "Thái Dương": "quang minh, công danh, cha",
  "Vũ Khúc": "tài chính, cương nghị, võ tướng",
  "Thiên Đồng": "phúc thọ, ôn hòa, an nhàn",
  "Liêm Trinh": "đào hoa, biến động, kỷ luật",
  "Thiên Phủ": "kho tàng, ổn định, hậu phúc",
  "Thái Âm": "âm nhu, mẹ, trực giác",
  "Tham Lang": "đào hoa, dục vọng, biến hóa",
  "Cự Môn": "khẩu thiệt, ám tinh, tranh luận",
  "Thiên Tướng": "ấn tinh, phụ tá, công bằng",
  "Thiên Lương": "lão nhân, từ bi, giải nạn",
  "Thất Sát": "uy mãnh, biến động lớn",
  "Phá Quân": "phá cũ lập mới, chinh chiến",
  "Tả Phụ": "trợ lực, người giúp đỡ",
  "Tả Phù": "trợ lực, người giúp đỡ",
  "Hữu Bật": "trợ lực, bằng hữu",
  "Văn Xương": "văn chương, học vấn",
  "Văn Khúc": "tài hoa, nghệ thuật",
  "Thiên Khôi": "quý nhân nam",
  "Thiên Việt": "quý nhân nữ",
  "Kình Dương": "sát tinh, sắc bén",
  "Đà La": "trì hoãn, lận đận",
  "Hỏa Tinh": "nóng nảy, đột phát",
  "Linh Tinh": "âm hỏa, hiểm hóc",
  "Địa Không": "hư vô, mất mát",
  "Địa Kiếp": "tổn hại, biến cố",
};

const NAP_AM: Record<string, string> = {
  "Giáp Tý": "Hải Trung Kim",
  "Ất Sửu": "Hải Trung Kim",
  "Bính Dần": "Lư Trung Hỏa",
  "Đinh Mão": "Lư Trung Hỏa",
  "Mậu Thìn": "Đại Lâm Mộc",
  "Kỷ Tỵ": "Đại Lâm Mộc",
  "Canh Ngọ": "Lộ Bàng Thổ",
  "Tân Mùi": "Lộ Bàng Thổ",
  "Nhâm Thân": "Kiếm Phong Kim",
  "Quý Dậu": "Kiếm Phong Kim",
  "Giáp Tuất": "Sơn Đầu Hỏa",
  "Ất Hợi": "Sơn Đầu Hỏa",
  "Bính Tý": "Giản Hạ Thủy",
  "Đinh Sửu": "Giản Hạ Thủy",
  "Mậu Dần": "Thành Đầu Thổ",
  "Kỷ Mão": "Thành Đầu Thổ",
  "Canh Thìn": "Bạch Lạp Kim",
  "Tân Tỵ": "Bạch Lạp Kim",
  "Nhâm Ngọ": "Dương Liễu Mộc",
  "Quý Mùi": "Dương Liễu Mộc",
  "Giáp Thân": "Tuyền Trung Thủy",
  "Ất Dậu": "Tuyền Trung Thủy",
  "Bính Tuất": "Ốc Thượng Thổ",
  "Đinh Hợi": "Ốc Thượng Thổ",
  "Mậu Tý": "Tích Lịch Hỏa",
  "Kỷ Sửu": "Tích Lịch Hỏa",
  "Canh Dần": "Tùng Bách Mộc",
  "Tân Mão": "Tùng Bách Mộc",
  "Nhâm Thìn": "Trường Lưu Thủy",
  "Quý Tỵ": "Trường Lưu Thủy",
  "Giáp Ngọ": "Sa Trung Kim",
  "Ất Mùi": "Sa Trung Kim",
  "Bính Thân": "Sơn Hạ Hỏa",
  "Đinh Dậu": "Sơn Hạ Hỏa",
  "Mậu Tuất": "Bình Địa Mộc",
  "Kỷ Hợi": "Bình Địa Mộc",
  "Canh Tý": "Bích Thượng Thổ",
  "Tân Sửu": "Bích Thượng Thổ",
  "Nhâm Dần": "Kim Bạc Kim",
  "Quý Mão": "Kim Bạc Kim",
  "Giáp Thìn": "Phú Đăng Hỏa",
  "Ất Tỵ": "Phú Đăng Hỏa",
  "Bính Ngọ": "Thiên Hà Thủy",
  "Đinh Mùi": "Thiên Hà Thủy",
  "Mậu Thân": "Đại Trạch Thổ",
  "Kỷ Dậu": "Đại Trạch Thổ",
  "Canh Tuất": "Thoa Xuyến Kim",
  "Tân Hợi": "Thoa Xuyến Kim",
  "Nhâm Tý": "Tang Đố Mộc",
  "Quý Sửu": "Tang Đố Mộc",
  "Giáp Dần": "Đại Khê Thủy",
  "Ất Mão": "Đại Khê Thủy",
  "Bính Thìn": "Sa Trung Thổ",
  "Đinh Tỵ": "Sa Trung Thổ",
  "Mậu Ngọ": "Thiên Thượng Hỏa",
  "Kỷ Mùi": "Thiên Thượng Hỏa",
  "Canh Thân": "Thạch Lựu Mộc",
  "Tân Dậu": "Thạch Lựu Mộc",
  "Nhâm Tuất": "Đại Hải Thủy",
  "Quý Hợi": "Đại Hải Thủy",
};

type FormState = {
  name: string;
  year: string;
  month: string;
  day: string;
  hour: number;
  gender: "nam" | "nu";
  calendar: "duong" | "am";
};

function pseudoD(seed: number): number {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function pickD<T>(arr: T[], seed: number): T {
  return arr[Math.floor(pseudoD(seed) * arr.length)];
}

function ratingD(seed: number, lo = 2, hi = 5): number {
  return lo + Math.floor(pseudoD(seed) * (hi - lo + 1));
}

function findPalace(
  chart: ChartData,
  ...names: string[]
): PalaceData | undefined {
  return chart.palaces.find((p) => names.includes(p.name));
}

function majorStarNames(palace: PalaceData): string[] {
  return palace.majorStars.map((s) => s.name);
}

function allStarNames(palace: PalaceData): string[] {
  return [
    ...palace.majorStars.map((s) => s.name),
    ...palace.minorStars.map((s) => s.name),
  ];
}

function yearCanChiFrom(chart: ChartData): string {
  const parts = chart.chineseDate.split(/\s*-\s*/);
  return parts[0]?.trim() ?? "";
}

function napAmFor(yearCanChi: string): string {
  return NAP_AM[yearCanChi] ?? "—";
}

function AnalysisCards({
  analysis,
  loading,
  error,
}: {
  analysis: AnalysisSections | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="rounded-3xl border border-[#3a8a5e]/35 bg-gradient-to-br from-[#f5e8d0]/70 to-[#fbf3e2]/40 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">📖</div>
        <h3
          className="text-2xl font-serif text-[#0f0a08]"
          style={{ fontFamily: SERIF_FONT }}
        >
          Vận Mệnh Luận Giải
        </h3>
        <span className="px-2.5 py-1 rounded-full bg-[#3a8a5e]/15 text-[#2a6e48] text-[10px] tracking-[0.2em] font-bold uppercase">
          6 phần · Cá nhân hóa
        </span>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 py-8 text-[#0f0a08] italic">
          <span className="inline-block w-2 h-2 bg-[#4a6c7a] rounded-full animate-pulse" />
          <span
            className="inline-block w-2 h-2 bg-[#4a6c7a] rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          />
          <span
            className="inline-block w-2 h-2 bg-[#4a6c7a] rounded-full animate-pulse"
            style={{ animationDelay: "0.4s" }}
          />
          <span className="ml-2">
            Đang lắng nghe linh khí… (hệ thống đang viết 6 đoạn)
          </span>
        </div>
      )}
      {error && !loading && (
        <div className="rounded-lg border border-[#c8361d]/40 bg-[#c8361d]/10 px-3 py-2 text-[#c8361d] text-[13px]">
          ⚠ Không luận giải được: {error}
        </div>
      )}
      {analysis && (
        <div className="grid md:grid-cols-2 gap-5">
          {ANALYSIS_ORDER.map((key) => {
            const text = analysis[key];
            if (!text) return null;
            const paragraphs = text.split(/\n\n+/).filter(Boolean);
            return (
              <article
                key={key}
                className="rounded-2xl border border-[#3a8a5e]/35 bg-[#fbf3e2]/85 p-5 md:p-6"
              >
                <h4
                  className="text-xl font-serif italic text-[#5a3a1a] mb-3"
                  style={{ fontFamily: SERIF_FONT }}
                >
                  {ANALYSIS_TITLES[key]}
                </h4>
                <div className="space-y-3 text-[14.5px] leading-[1.8] text-[#0f0a08]">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StarsRow({
  n,
  max = 5,
  color = "#c89146",
}: {
  n: number;
  max?: number;
  color?: string;
}) {
  return (
    <span className="inline-flex gap-[2px]">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ color: i < n ? color : color + "30" }}>
          ★
        </span>
      ))}
    </span>
  );
}

function ReadingCard({
  icon,
  title,
  cung,
  stars,
  rating,
  text,
  wide,
}: {
  icon: string;
  title: string;
  cung: string;
  stars: string[];
  rating: number;
  text: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#4a6c7a]/55 bg-[#fbf3e2]/94 p-6 ${
        wide ? "md:p-8" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="text-xl">{icon}</div>
          <div>
            <div className="text-[16px] font-semibold text-[#0f0a08]">
              {title}
            </div>
            <div className="text-[11px] tracking-[0.2em] uppercase text-[#4a3a30] font-medium">
              {cung}
            </div>
          </div>
        </div>
        <StarsRow n={rating} />
      </div>
      {stars.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {stars.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 rounded-md bg-[#fbf3e2] border border-[#4a6c7a]/30 text-[11px] text-[#5a3a1a] font-medium"
            >
              {s}
            </span>
          ))}
        </div>
      )}
      <p className="text-[14.5px] leading-[1.75] text-[#0f0a08]">{text}</p>
    </div>
  );
}

export function BasicInfo({ chart, form }: { chart: ChartData; form: FormState }) {
  const yearCanChi = yearCanChiFrom(chart);
  const napAm = napAmFor(yearCanChi);
  const menh = findPalace(chart, "Mệnh");
  const items = [
    { k: "Họ tên", v: form.name || "—" },
    { k: "Giới tính", v: form.gender === "nam" ? "Nam" : "Nữ" },
    { k: "Sinh nhật (Dương)", v: chart.solarDate },
    { k: "Sinh nhật (Âm)", v: chart.lunarDate },
    { k: "Năm Can Chi", v: yearCanChi },
    { k: "Mệnh Nạp Âm", v: napAm },
    { k: "Cục", v: chart.fiveElementsClass },
    { k: "Giờ sinh", v: `Giờ ${CHI_TV[form.hour] ?? ""} (${chart.timeRange})` },
    {
      k: "Cung Mệnh",
      v: menh ? `${menh.heavenlyStem} ${menh.earthlyBranch}` : "—",
    },
    { k: "Mệnh / Thân chủ", v: `${chart.soul} · ${chart.body}` },
  ];
  return (
    <div className="rounded-3xl border border-[#4a6c7a]/55 bg-[#fbf3e2]/95 p-6 md:p-8 shadow-[0_20px_60px_-25px_rgba(74,108,122,0.3)]">
      <div className="flex items-center gap-3 mb-5">
        <div className="text-2xl">📜</div>
        <h3
          className="text-2xl font-serif text-[#0f0a08]"
          style={{ fontFamily: SERIF_FONT }}
        >
          Thông Tin Cơ Bản
        </h3>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {items.map((it) => (
          <div
            key={it.k}
            className="rounded-xl border border-[#4a6c7a]/40 bg-[#fbf3e2]/80 p-3.5"
          >
            <div className="text-[10px] tracking-[0.25em] uppercase text-[#4a3a30] font-semibold">
              {it.k}
            </div>
            <div className="mt-1 text-[14px] text-[#0f0a08] font-medium">
              {it.v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TongQuanLaSo({ chart, form }: { chart: ChartData; form: FormState }) {
  const menh = findPalace(chart, "Mệnh");
  if (!menh) return null;
  const stars = allStarNames(menh);
  const charSummary = stars.includes("Tử Vi")
    ? "có khí chất lãnh đạo, tự tin và uy nghi"
    : stars.includes("Thiên Cơ")
      ? "thông minh, mưu lược, tâm hồn linh hoạt"
      : stars.includes("Thái Dương")
        ? "rạng rỡ, hào hiệp, có sức ảnh hưởng"
        : stars.includes("Thái Âm")
          ? "ôn nhu, trực giác mạnh, giàu cảm xúc"
          : stars.includes("Vũ Khúc")
            ? "cương nghị, quyết đoán, giỏi tài chính"
            : stars.includes("Thiên Phủ")
              ? "trầm ổn, biết tích lũy, hậu phúc"
              : stars.includes("Tham Lang")
                ? "đa tài đa nghệ, dễ có đào hoa"
                : stars.includes("Thất Sát")
                  ? "uy mãnh, không sợ gian khổ"
                  : stars.includes("Phá Quân")
                    ? "phá cũ lập mới, dám thay đổi"
                    : "tính cách độc lập, đi con đường riêng";
  const yearCanChi = yearCanChiFrom(chart);
  const napAm = napAmFor(yearCanChi);
  return (
    <div className="rounded-3xl border border-[#4a6c7a]/55 bg-gradient-to-br from-[#f5e3c0]/50 via-[#fbf3e2]/95 to-[#fbf3e2]/95 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">☯</div>
        <h3
          className="text-2xl font-serif text-[#0f0a08]"
          style={{ fontFamily: SERIF_FONT }}
        >
          Tổng Quan Lá Số
        </h3>
      </div>
      <p className="text-[15.5px] leading-[1.85] text-[#0f0a08] first-letter:text-5xl first-letter:font-serif first-letter:text-[#5a3a1a] first-letter:mr-2 first-letter:float-left first-letter:leading-[0.9]">
        {form.gender === "nam" ? "Càn tạo" : "Khôn tạo"} sinh năm{" "}
        <strong>{yearCanChi}</strong>, mệnh <strong>{napAm}</strong>, thuộc{" "}
        <strong>{chart.fiveElementsClass}</strong>. Cung Mệnh an tại{" "}
        <strong>
          {menh.heavenlyStem} {menh.earthlyBranch}
        </strong>
        {stars.length ? `, có ${stars.join(", ")}` : ""} — {charSummary}. Đây là
        lá số {form.gender === "nam" ? "nam mệnh" : "nữ mệnh"} với cấu trúc 12
        cung phân bố hài hòa, mỗi cung mang một tinh tú riêng định hình các
        phương diện cuộc đời. Chính tinh tại Mệnh sẽ ảnh hưởng xuyên suốt từ
        tuổi trẻ đến cuối đời, kết hợp với đại vận và tiểu hạn tạo nên dòng chảy
        số mệnh.
      </p>
    </div>
  );
}

function CareerWealth({
  chart,
  seedBase,
}: {
  chart: ChartData;
  seedBase: number;
}) {
  const quanloc = findPalace(chart, "Quan Lộc");
  const taibach = findPalace(chart, "Tài Bạch");
  if (!quanloc || !taibach) return null;
  const careerStars = allStarNames(quanloc);
  const wealthStars = allStarNames(taibach);
  const careerScore = ratingD(seedBase + 11);
  const wealthScore = ratingD(seedBase + 22);

  const careerText = `Cung Quan Lộc tại ${quanloc.earthlyBranch} có ${
    careerStars.length ? careerStars.join(", ") : "không sao chính"
  }. ${
    careerStars.includes("Tử Vi")
      ? "Mệnh có cách lãnh đạo, làm thủ lĩnh trong công việc, dễ thăng quan tiến chức nếu có quý nhân phò tá. "
      : careerStars.includes("Thái Dương")
        ? "Sự nghiệp sáng láng, hợp với nghề công chức, truyền thông, có tiếng tăm trong giới chuyên môn. "
        : careerStars.includes("Vũ Khúc")
          ? "Hợp với nghề tài chính, kinh doanh, quân sự — cương nghị quyết đoán, không ngại khó. "
          : "Sự nghiệp đi lên từ từ, cần kiên trì và biết chọn thời điểm. "
  }${
    careerStars.some((s) =>
      ["Kình Dương", "Đà La", "Địa Không", "Địa Kiếp"].includes(s),
    )
      ? "Tuy nhiên có sát tinh xen vào — đề phòng tranh chấp đồng nghiệp, đổi việc đột ngột giai đoạn 30-40 tuổi."
      : "Đại vận thuận lợi, hợp tác viên giúp đỡ, ít kẻ tiểu nhân phá hoại."
  }`;

  const wealthText = `Cung Tài Bạch tại ${taibach.earthlyBranch} có ${
    wealthStars.length ? wealthStars.join(", ") : "không sao chính"
  }. ${
    wealthStars.includes("Vũ Khúc") || wealthStars.includes("Thiên Phủ")
      ? "Tài tinh đắc địa — kho tàng đầy đặn, biết tích lũy và đầu tư khôn ngoan. "
      : wealthStars.includes("Thái Âm")
        ? "Tài đến chậm mà chắc, hợp với bất động sản hoặc tích lũy lâu dài. "
        : wealthStars.includes("Tham Lang")
          ? "Cát hung khó lường — có lúc lên xuống mạnh, nên kiểm soát chi tiêu và tránh đầu cơ. "
          : "Tài lộc trung bình, đủ ăn đủ tiêu, không nên kỳ vọng phú quý đột ngột. "
  }Hậu vận tốt hơn tiền vận, sau ${
    40 + Math.floor(pseudoD(seedBase + 33) * 8)
  } tuổi tài lộc ổn định.`;

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <ReadingCard
        icon="💼"
        title="Sự Nghiệp · Công Danh"
        cung={`Quan Lộc · ${quanloc.earthlyBranch}`}
        stars={careerStars}
        rating={careerScore}
        text={careerText}
      />
      <ReadingCard
        icon="💰"
        title="Tài Lộc · Tiền Bạc"
        cung={`Tài Bạch · ${taibach.earthlyBranch}`}
        stars={wealthStars}
        rating={wealthScore}
        text={wealthText}
      />
    </div>
  );
}

function LoveFamily({
  chart,
  seedBase,
}: {
  chart: ChartData;
  seedBase: number;
}) {
  const phuthe = findPalace(chart, "Phu Thê");
  const tutuc = findPalace(chart, "Tử Tức", "Tử Nữ");
  const phumau = findPalace(chart, "Phụ Mẫu");
  if (!phuthe || !phumau) return null;

  const loveStars = allStarNames(phuthe);
  const childStars = tutuc ? allStarNames(tutuc) : [];
  const familyStars = allStarNames(phumau);

  const loveText = `Cung Phu Thê tại ${phuthe.earthlyBranch}. ${
    loveStars.includes("Tham Lang") || loveStars.includes("Liêm Trinh")
      ? "Đào hoa vượng, dễ có nhiều mối tình trước hôn nhân — cần chọn lọc kỹ, tránh duyên ngắn. "
      : loveStars.includes("Thái Âm") || loveStars.includes("Thiên Đồng")
        ? "Hôn nhân hòa hợp, vợ/chồng dịu dàng, gia đạo êm ấm. "
        : loveStars.includes("Thất Sát") || loveStars.includes("Phá Quân")
          ? "Tình duyên có sóng gió, kết hôn muộn sẽ tốt hơn — nửa kia tính cách mạnh mẽ, độc lập. "
          : "Duyên phận đến đúng người đúng thời điểm, không vội vã. "
  }${
    pseudoD(seedBase + 51) > 0.5
      ? "Tuổi hợp: Thân, Tý, Thìn (Tam Hợp)."
      : "Tuổi hợp: Tỵ, Dậu, Sửu (Tam Hợp)."
  }`;

  const familyText = `Cung Phụ Mẫu ${
    familyStars.length ? "có " + familyStars[0] : "an tĩnh"
  } — ${
    familyStars.some((s) =>
      ["Thiên Lương", "Thiên Đồng", "Thái Âm"].includes(s),
    )
      ? "song thân khỏe mạnh, gia đạo hòa thuận, được hưởng phúc của cha mẹ."
      : "quan hệ với cha mẹ có lúc xa cách, nên chăm sóc và quan tâm hơn ở tuổi trung niên."
  } ${
    childStars.length
      ? `Cung Tử Tức có ${childStars[0]} — con cái ${
          pseudoD(seedBase + 71) > 0.5
            ? "thông minh, hiếu thảo"
            : "có chí riêng, sớm tự lập"
        }.`
      : "Tử tức bình thường, có 1-2 con là tốt nhất."
  }`;

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <ReadingCard
        icon="❤"
        title="Tình Duyên · Hôn Nhân"
        cung={`Phu Thê · ${phuthe.earthlyBranch}`}
        stars={loveStars}
        rating={ratingD(seedBase + 41)}
        text={loveText}
      />
      <ReadingCard
        icon="🏠"
        title="Gia Đạo · Con Cái"
        cung={`Phụ Mẫu · ${phumau.earthlyBranch}`}
        stars={familyStars}
        rating={ratingD(seedBase + 61)}
        text={familyText}
      />
    </div>
  );
}

function Health({ chart, seedBase }: { chart: ChartData; seedBase: number }) {
  const tatach = findPalace(chart, "Tật Ách");
  if (!tatach) return null;
  const stars = allStarNames(tatach);
  const score = ratingD(seedBase + 81);
  const concerns: string[] = [];
  if (stars.some((s) => ["Hỏa Tinh", "Linh Tinh"].includes(s)))
    concerns.push("hệ tim mạch, nóng trong");
  if (stars.includes("Cự Môn")) concerns.push("hệ tiêu hóa, dạ dày");
  if (stars.some((s) => ["Kình Dương", "Đà La"].includes(s)))
    concerns.push("xương khớp, chấn thương");
  if (stars.includes("Thái Âm")) concerns.push("thận, hệ niệu");
  if (stars.includes("Thiên Cơ")) concerns.push("thần kinh, mất ngủ");
  if (concerns.length === 0) concerns.push("tổng quan ổn định, ít bệnh nặng");

  const text = `Cung Tật Ách tại ${tatach.earthlyBranch} ${
    stars.length ? "có " + stars.join(", ") : "không sao chính"
  }. Cần chú ý: ${concerns.join("; ")}. ${
    score >= 4
      ? "Sức khỏe tổng quan tốt, ít ốm vặt — chỉ cần duy trì vận động đều và ăn uống cân bằng."
      : "Cần kiểm tra sức khỏe định kỳ, đặc biệt giai đoạn 35-45 tuổi và 55-65 tuổi. Tránh thức khuya và áp lực kéo dài."
  }`;

  return (
    <ReadingCard
      icon="🌿"
      title="Sức Khỏe"
      cung={`Tật Ách · ${tatach.earthlyBranch}`}
      stars={stars}
      rating={score}
      text={text}
      wide
    />
  );
}

function DaiHan10({
  chart,
  form,
  seedBase,
  aiData,
}: {
  chart: ChartData;
  form: FormState;
  seedBase: number;
  aiData?: DaiHanReading[];
}) {
  const birthYear = +form.year || 1990;
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear;

  // Sort palaces by real iztro decadal range; fallback an order theo index.
  const periods = [...chart.palaces]
    .filter((p) => p.decadal)
    .sort((a, b) => a.decadal!.range[0] - b.decadal!.range[0])
    .map((p, i) => {
      const ageStart = p.decadal!.range[0];
      const ageEnd = p.decadal!.range[1];
      const yearStart = birthYear + ageStart;
      const yearEnd = birthYear + ageEnd;
      const stars = allStarNames(p);
      const score = ratingD(seedBase + 100 + i);
      const isCurrent = currentAge >= ageStart && currentAge <= ageEnd;
      const isPast = currentAge > ageEnd;
      const aiReading = aiData?.find(
        (x) => x.index === i || x.ageStart === ageStart,
      )?.reading;
      const summary =
        aiReading ||
        (stars.includes("Tử Vi") || stars.includes("Thiên Phủ")
          ? "Đại vận hanh thông, công danh thăng tiến, tài lộc dồi dào."
          : stars.includes("Thất Sát") || stars.includes("Phá Quân")
            ? "Đại vận biến động — có thử thách lớn, vượt qua sẽ có bước nhảy vọt."
            : stars.includes("Tham Lang")
              ? "Đào hoa vượng, có cơ hội tình duyên hoặc lợi nhuận bất ngờ."
              : stars.some((s) =>
                    ["Hỏa Tinh", "Linh Tinh", "Kình Dương", "Đà La"].includes(
                      s,
                    ),
                  )
                ? "Đại vận có sát tinh, cần thận trọng quyết định lớn, đề phòng tiểu nhân."
                : stars.includes("Thiên Lương")
                  ? "Đại vận an lành, có quý nhân giúp đỡ, hợp với học hỏi và tu dưỡng."
                  : "Đại vận trung bình, ổn định, không có biến cố lớn.");
      return {
        ageStart,
        ageEnd,
        yearStart,
        yearEnd,
        label: p.name,
        chi: p.earthlyBranch,
        stars,
        score,
        isCurrent,
        isPast,
        summary,
      };
    });

  return (
    <div className="rounded-3xl border border-[#4a6c7a]/55 bg-[#fbf3e2]/94 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-1">
        <div className="text-2xl">🗓</div>
        <h3
          className="text-2xl font-serif text-[#0f0a08]"
          style={{ fontFamily: SERIF_FONT }}
        >
          Toàn Bộ Đại Hạn
        </h3>
      </div>
      <p className="text-[#0f0a08] text-sm mb-5">
        12 đại vận, mỗi vận 10 năm — tính theo {chart.fiveElementsClass}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {periods.map((p, i) => (
          <div
            key={i}
            className={`relative rounded-2xl border p-4 ${
              p.isCurrent
                ? "border-[#4a6c7a] bg-gradient-to-br from-[#f5e3c0] to-[#e9c98a] shadow-[0_0_0_1px_#4a6c7a,0_8px_22px_-8px_rgba(74,108,122,0.5)]"
                : p.isPast
                  ? "border-[#4a6c7a]/30 bg-[#fbf3e2]/60 opacity-75"
                  : "border-[#4a6c7a]/45 bg-[#fbf3e2]/85"
            }`}
          >
            {p.isCurrent && (
              <span className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full bg-[#5a3a1a] text-[#fbf3e2] text-[10px] tracking-wider font-bold">
                VẬN HIỆN TẠI
              </span>
            )}
            <div className="flex items-baseline justify-between">
              <div className="text-[11px] tracking-[0.2em] uppercase text-[#4a3a30] font-semibold">
                {p.label}
              </div>
              <div className="text-[11px] text-[#4a3a30] font-mono">
                {p.chi}
              </div>
            </div>
            <div
              className="mt-1 text-[18px] font-serif italic text-[#5a3a1a]"
              style={{ fontFamily: SERIF_FONT }}
            >
              {p.ageStart}–{p.ageEnd} tuổi
            </div>
            <div className="text-[11px] text-[#0f0a08]">
              ({p.yearStart}–{p.yearEnd})
            </div>
            <div className="mt-2 mb-1.5">
              <StarsRow n={p.score} />
            </div>
            {p.stars.length > 0 && (
              <div className="text-[11px] text-[#5a3a1a] font-medium leading-tight mb-1.5">
                {p.stars.slice(0, 2).join(" · ")}
              </div>
            )}
            <div className="text-[12px] text-[#0f0a08] leading-snug">
              {p.summary}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TieuHanNam({
  chart,
  form,
  seedBase,
  aiData,
}: {
  chart: ChartData;
  form: FormState;
  seedBase: number;
  aiData?: TieuHanReading[];
}) {
  const birthYear = +form.year || 1990;
  const currentYear = new Date().getFullYear();
  const cats = [
    "Đại Cát",
    "Bình Hòa",
    "Tiểu Cát",
    "Bình Hòa",
    "Cẩn Trọng",
    "Bình Hòa",
  ];

  const years = [];
  for (let i = -1; i <= 4; i++) {
    const y = currentYear + i;
    const age = y - birthYear;
    // Lookup chuẩn: palace có ages.includes(age) là cung tiểu hạn năm đó.
    const cung =
      chart.palaces.find(
        (p) => Array.isArray(p.ages) && p.ages.includes(age),
      ) ?? chart.palaces[(age + 12) % 12];
    const stars = cung ? allStarNames(cung) : [];
    const cat = cats[Math.floor(pseudoD(seedBase + y) * cats.length)];
    const catColor =
      cat === "Đại Cát"
        ? "#3a8a5e"
        : cat === "Tiểu Cát"
          ? "#c89146"
          : cat === "Cẩn Trọng"
            ? "#c8361d"
            : "#4a3a30";
    const aiReading = aiData?.find((x) => x.year === y)?.reading;
    const summary =
      aiReading ||
      (cat === "Đại Cát"
        ? "Năm tốt — nên quyết những việc lớn: hôn sự, mua nhà, mở rộng kinh doanh."
        : cat === "Tiểu Cát"
          ? "Có cát lành nhỏ — thuận buồm xuôi gió, hợp ký kết hợp tác."
          : cat === "Cẩn Trọng"
            ? "Năm có sao xấu — không nên đầu tư lớn, tránh đi xa, giữ sức khỏe."
            : "Năm bình hòa, ổn định — hãy củng cố nội lực và chờ thời.");
    years.push({
      y,
      age,
      cung: cung?.name ?? "—",
      chi: cung?.earthlyBranch ?? "—",
      stars,
      cat,
      catColor,
      summary,
      isCurrent: i === 0,
    });
  }

  return (
    <div className="rounded-3xl border border-[#4a6c7a]/55 bg-[#fbf3e2]/94 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-1">
        <div className="text-2xl">📆</div>
        <h3
          className="text-2xl font-serif text-[#0f0a08]"
          style={{ fontFamily: SERIF_FONT }}
        >
          Tiểu Hạn Theo Năm
        </h3>
      </div>
      <p className="text-[#0f0a08] text-sm mb-5">
        Vận trình 6 năm gần nhất — năm trước, năm nay và 4 năm tới
      </p>

      <div className="space-y-2">
        {years.map((y) => (
          <div
            key={y.y}
            className={`relative grid grid-cols-[80px_1fr_120px] sm:grid-cols-[100px_120px_1fr_140px] gap-3 items-center rounded-xl border px-4 py-3 ${
              y.isCurrent
                ? "border-[#4a6c7a] bg-gradient-to-r from-[#f5e3c0] via-[#fbf3e2] to-[#fbf3e2]"
                : "border-[#4a6c7a]/40 bg-[#fbf3e2]/75"
            }`}
          >
            <div>
              <div
                className="text-[24px] font-serif italic text-[#5a3a1a] leading-none"
                style={{ fontFamily: SERIF_FONT }}
              >
                {y.y}
              </div>
              <div className="text-[11px] text-[#4a3a30]">{y.age} tuổi</div>
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] tracking-[0.25em] uppercase text-[#4a3a30] font-semibold">
                {y.cung}
              </div>
              <div className="text-[13px] text-[#0f0a08]">
                {y.chi} · {y.stars[0] ?? "—"}
              </div>
            </div>
            <div className="text-[13px] text-[#0f0a08] leading-snug">
              {y.summary}
            </div>
            <div className="flex justify-end">
              <span
                className="px-3 py-1 rounded-full text-[11px] tracking-[0.2em] font-bold uppercase whitespace-nowrap"
                style={{
                  background: y.catColor + "18",
                  color: y.catColor,
                  border: `1px solid ${y.catColor}55`,
                }}
              >
                {y.cat}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CUNG_META: Record<string, { icon: string; desc: string }> = {
  Mệnh: { icon: "☯", desc: "Tính cách bản thể, tâm tính, ngoại hình" },
  "Phụ Mẫu": { icon: "🏛", desc: "Cha mẹ, bề trên, người dìu dắt" },
  "Phúc Đức": { icon: "☘", desc: "Phúc khí gia tiên, hạnh phúc tinh thần" },
  "Điền Trạch": { icon: "🏡", desc: "Nhà cửa, đất đai, bất động sản" },
  "Quan Lộc": { icon: "⚒", desc: "Sự nghiệp, công danh, địa vị xã hội" },
  "Nô Bộc": { icon: "🤝", desc: "Bạn bè, cộng sự, kẻ dưới" },
  "Thiên Di": { icon: "🧭", desc: "Đi xa, di chuyển, vận khách địa" },
  "Tật Ách": { icon: "🌿", desc: "Sức khỏe, tai ách, bệnh tật" },
  "Tài Bạch": { icon: "💰", desc: "Tiền bạc, tài sản lưu động" },
  "Tử Tức": { icon: "👶", desc: "Con cái, học trò, sáng tạo" },
  "Tử Nữ": { icon: "👶", desc: "Con cái, học trò, sáng tạo" },
  "Phu Thê": { icon: "❤", desc: "Vợ chồng, người yêu, hôn nhân" },
  "Huynh Đệ": { icon: "👬", desc: "Anh chị em, đồng nghiệp gần" },
};

function CungAccordion({
  chart,
  aiData,
}: {
  chart: ChartData;
  aiData?: TwelvePalaceReading[];
}) {
  const [open, setOpen] = useState<number>(
    chart.palaces.findIndex((p) => p.name === "Mệnh"),
  );

  const interpret = (palace: PalaceData): string => {
    const aiReading =
      aiData?.find((x) => x.name === palace.name)?.reading ??
      aiData?.find((x) => x.earthlyBranch === palace.earthlyBranch)?.reading;
    if (aiReading) return aiReading;

    const stars = allStarNames(palace);
    if (stars.length === 0) {
      return `Cung ${palace.name} không có chính tinh, mượn sao từ cung đối diện. Vận này bình hòa, ít biến cố lớn nhưng cũng không quá nổi bật.`;
    }
    const star = stars[0];
    const meaning = STAR_MEANING[star] ?? "tinh tú trợ vận";
    const role =
      palace.name === "Mệnh"
        ? "Đây là sao chủ mệnh — định hình tính cách và vận trình tổng thể."
        : palace.name === "Phu Thê"
          ? "Quyết định nhiều về duyên phận và bạn đời tương lai."
          : palace.name === "Tài Bạch"
            ? "Quyết định cách kiếm tiền và giữ tiền trong đời."
            : palace.name === "Quan Lộc"
              ? "Quyết định công danh và sự nghiệp tương lai."
              : "Ảnh hưởng đến phương diện này trong toàn bộ cuộc đời.";
    const sat = stars.some((s) =>
      [
        "Kình Dương",
        "Đà La",
        "Hỏa Tinh",
        "Linh Tinh",
        "Địa Không",
        "Địa Kiếp",
      ].includes(s),
    )
      ? " Có sát tinh — cần đề phòng và hóa giải."
      : "";
    return `Cung ${palace.name} an tại ${palace.earthlyBranch}, có ${stars.join(
      ", ",
    )}. ${star} chủ về ${meaning}. ${role}${sat}`;
  };

  return (
    <div className="rounded-3xl border border-[#4a6c7a]/55 bg-[#fbf3e2]/94 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="text-2xl">📜</div>
        <h3
          className="text-2xl font-serif text-[#0f0a08]"
          style={{ fontFamily: SERIF_FONT }}
        >
          Luận Giải 12 Cung
        </h3>
      </div>
      <div className="space-y-2">
        {chart.palaces.map((p, i) => {
          const meta = CUNG_META[p.name] ?? { icon: "✦", desc: "" };
          const stars = allStarNames(p);
          const isOpen = open === i;
          const isMenh = p.name === "Mệnh";
          return (
            <div
              key={i}
              className={`rounded-xl border transition-all ${
                isOpen
                  ? "border-[#4a6c7a] bg-[#fbf3e2]"
                  : "border-[#4a6c7a]/35 bg-[#fbf3e2]/70"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full flex items-center gap-4 px-4 py-3 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#fbf3e2] to-[#e9d4b6] border border-[#4a6c7a]/40 flex items-center justify-center text-xl shrink-0">
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold text-[#0f0a08]">
                      {p.name}
                    </span>
                    <span className="text-[11px] text-[#4a3a30] font-mono">
                      · {p.heavenlyStem} {p.earthlyBranch}
                    </span>
                    {isMenh && (
                      <span className="px-1.5 py-0.5 rounded bg-[#5a3a1a] text-[#fbf3e2] text-[9px] tracking-wider font-bold">
                        MỆNH
                      </span>
                    )}
                    {p.isBodyPalace && (
                      <span className="px-1.5 py-0.5 rounded bg-[#3a8a5e] text-[#fbf3e2] text-[9px] tracking-wider font-bold">
                        THÂN
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#0f0a08] truncate">
                    {stars.length ? stars.join(" · ") : meta.desc}
                  </div>
                </div>
                <span
                  className={`text-[#5a3a1a] transition-transform shrink-0 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-[#4a6c7a]/25">
                  <div className="text-[13px] text-[#4a3a30] italic mb-2">
                    {meta.desc}
                  </div>
                  <p className="text-[14.5px] leading-[1.75] text-[#0f0a08]">
                    {interpret(p)}
                  </p>
                  {stars.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {stars.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md bg-[#fbf3e2] border border-[#4a6c7a]/30 text-[11px] text-[#5a3a1a]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NamHienTaiDetail({
  chart,
  form,
  seedBase,
  aiData,
}: {
  chart: ChartData;
  form: FormState;
  seedBase: number;
  aiData?: NamHienTaiReading;
}) {
  const birthYear = +form.year || 1990;
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  // Cung tiểu hạn năm hiện tại: ưu tiên palace.ages.includes(age), fallback chỉ khi không có.
  const cung =
    chart.palaces.find((p) => Array.isArray(p.ages) && p.ages.includes(age)) ??
    chart.palaces[(age + 12) % 12];
  const stars = cung ? allStarNames(cung) : [];

  const cat =
    aiData?.category ??
    (
      [
        "Đại Cát",
        "Bình Hòa",
        "Tiểu Cát",
        "Bình Hòa",
        "Cẩn Trọng",
        "Bình Hòa",
      ] as const
    )[Math.floor(pseudoD(seedBase + currentYear) * 6)];
  const catColor =
    cat === "Đại Cát"
      ? "#3a8a5e"
      : cat === "Tiểu Cát"
        ? "#c89146"
        : cat === "Cẩn Trọng"
          ? "#c8361d"
          : "#4a3a30";

  const aspects = [
    {
      icon: "💼",
      label: "Sự nghiệp",
      text:
        aiData?.aspects.career.text ??
        (stars.includes("Vũ Khúc") || stars.includes("Tử Vi")
          ? "Năm thuận cho thăng tiến, có cơ hội đảm nhận trọng trách. Quý nhân giúp đỡ trong quý 2 và quý 4."
          : stars.includes("Thất Sát")
            ? "Có thay đổi lớn — nhảy việc, mở dự án mới đều khả thi nhưng cần chuẩn bị kỹ."
            : "Công việc giữ ổn định, không nên mạo hiểm những việc lớn ngoài chuyên môn."),
      rating:
        aiData?.aspects.career.rating ?? ratingD(seedBase + currentYear + 1),
    },
    {
      icon: "💰",
      label: "Tài lộc",
      text:
        aiData?.aspects.wealth.text ??
        (stars.includes("Thiên Phủ") || stars.includes("Vũ Khúc")
          ? "Tài tinh sáng — thu nhập tăng, có cơ hội đầu tư sinh lời."
          : stars.includes("Tham Lang")
            ? "Tài đến nhanh đi cũng nhanh — kiểm soát chi tiêu, tránh đầu cơ."
            : "Tài chính ổn định, thu chi cân bằng. Tiết kiệm được một khoản vào cuối năm."),
      rating:
        aiData?.aspects.wealth.rating ?? ratingD(seedBase + currentYear + 2),
    },
    {
      icon: "❤",
      label: "Tình duyên",
      text:
        aiData?.aspects.love.text ??
        (stars.includes("Tham Lang") || stars.includes("Liêm Trinh")
          ? "Đào hoa vượng — độc thân dễ gặp người tâm đầu, đã có đôi nên cẩn trọng cám dỗ."
          : stars.includes("Thái Âm") || stars.includes("Thiên Đồng")
            ? "Tình cảm dịu dàng, hôn nhân hòa thuận, gia đạo êm ấm."
            : "Tình duyên bình lặng — duy trì mối quan hệ hiện có là tốt nhất."),
      rating:
        aiData?.aspects.love.rating ?? ratingD(seedBase + currentYear + 3),
    },
    {
      icon: "🌿",
      label: "Sức khỏe",
      text:
        aiData?.aspects.health.text ??
        (stars.some((s) => ["Hỏa Tinh", "Linh Tinh"].includes(s))
          ? "Cần đề phòng nóng trong, tim mạch — uống đủ nước, tập luyện đều."
          : stars.includes("Cự Môn")
            ? "Chú ý hệ tiêu hóa — ăn uống điều độ, tránh đồ cay nóng."
            : "Sức khỏe ổn định, ít ốm vặt. Duy trì thói quen tốt là đủ."),
      rating:
        aiData?.aspects.health.rating ?? ratingD(seedBase + currentYear + 4),
    },
    {
      icon: "🏠",
      label: "Gia đạo",
      text:
        aiData?.aspects.family?.text ??
        "Gia đạo nhìn chung hòa thuận. Dành thời gian quan tâm cha mẹ và người thân trong gia đình.",
      rating:
        aiData?.aspects.family?.rating ?? ratingD(seedBase + currentYear + 5),
    },
  ];

  const months = Array.from({ length: 12 }).map((_, i) => {
    const m = i + 1;
    const aiMonth = aiData?.months.find((x) => x.month === m);
    if (aiMonth) {
      const c =
        aiMonth.label === "Tốt"
          ? "#3a8a5e"
          : aiMonth.label === "Bình"
            ? "#c89146"
            : "#c8361d";
      return { m, label: aiMonth.label, c, text: aiMonth.text };
    }
    const r = pseudoD(seedBase + currentYear * 100 + i);
    const k = r > 0.75 ? "good" : r > 0.4 ? "neutral" : "warn";
    const label = k === "good" ? "Tốt" : k === "neutral" ? "Bình" : "Cẩn trọng";
    const c =
      k === "good" ? "#3a8a5e" : k === "neutral" ? "#c89146" : "#c8361d";
    return { m, label, c, text: "" };
  });

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[#4a6c7a]/55 bg-[#fbf3e2]/95 p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <div className="text-[11px] tracking-[0.3em] uppercase text-[#4a3a30] font-semibold">
              Vận trình năm
            </div>
            <div
              className="mt-1 text-5xl font-serif italic text-[#5a3a1a]"
              style={{ fontFamily: SERIF_FONT }}
            >
              {currentYear}
              {aiData?.yearCanChi && (
                <span className="ml-3 text-2xl text-[#4a6c7a] not-italic">
                  · {aiData.yearCanChi}
                </span>
              )}
            </div>
            <div className="mt-1 text-[#0f0a08]">
              {age} tuổi · Tiểu hạn tại cung{" "}
              <strong>{cung?.name ?? "—"}</strong> ({cung?.earthlyBranch ?? "—"}
              )
            </div>
            {stars.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {stars.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-md bg-[#fbf3e2] border border-[#4a6c7a]/35 text-[11px] text-[#5a3a1a] font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            {aiData?.overview && (
              <p className="mt-4 text-[14.5px] leading-[1.8] text-[#0f0a08]">
                {aiData.overview}
              </p>
            )}
          </div>
          <div
            className="px-4 py-2 rounded-full text-[12px] tracking-[0.2em] font-bold uppercase self-start"
            style={{
              background: catColor + "18",
              color: catColor,
              border: `1px solid ${catColor}55`,
            }}
          >
            {cat}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {aspects.map((a) => (
          <div
            key={a.label}
            className="rounded-2xl border border-[#4a6c7a]/45 bg-[#fbf3e2]/94 p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{a.icon}</span>
                <span className="font-semibold text-[#0f0a08]">{a.label}</span>
              </div>
              <StarsRow n={a.rating} />
            </div>
            <p className="text-[14px] text-[#0f0a08] leading-relaxed">
              {a.text}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#4a6c7a]/45 bg-[#fbf3e2]/94 p-5 md:p-6">
        <div className="text-[15px] font-semibold text-[#0f0a08] mb-3">
          Vận trình 12 tháng năm {currentYear}
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
          {months.map((mo) => (
            <div
              key={mo.m}
              className="rounded-lg border p-2 text-center"
              style={{ borderColor: mo.c + "55", background: mo.c + "0d" }}
              title={mo.text || undefined}
            >
              <div className="text-[11px] text-[#0f0a08]">Tháng {mo.m}</div>
              <div
                className="text-[12px] font-semibold mt-0.5"
                style={{ color: mo.c }}
              >
                {mo.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {aiData?.advice && aiData.advice.length > 0 && (
        <div className="rounded-2xl border border-[#c89146]/55 bg-gradient-to-br from-[#f5e3c0]/40 to-[#fbf3e2]/94 p-5 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🪷</span>
            <div className="text-[15px] font-semibold text-[#0f0a08]">
              Lời khuyên năm {currentYear}
            </div>
          </div>
          <ul className="space-y-2.5">
            {aiData.advice.map((a, i) => {
              // Tách phần "tục ngữ" trong ngoặc kép để in nghiêng riêng.
              const m = a.match(/^(.*?)["“]([^"”]+)["”](.*)$/);
              return (
                <li
                  key={i}
                  className="flex gap-3 text-[14.5px] text-[#0f0a08] leading-[1.75]"
                >
                  <span className="text-[#c89146] shrink-0 mt-0.5">✦</span>
                  {m ? (
                    <span>
                      {m[1]}
                      <em
                        className="text-[#5a3a1a] font-medium"
                        style={{ fontFamily: SERIF_FONT }}
                      >
                        “{m[2]}”
                      </em>
                      {m[3]}
                    </span>
                  ) : (
                    <span>{a}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {aiData?.months.some((m) => m.text) && (
        <div className="rounded-2xl border border-[#4a6c7a]/45 bg-[#fbf3e2]/94 p-5 md:p-6">
          <div className="text-[15px] font-semibold text-[#0f0a08] mb-3">
            Chi tiết 12 tháng
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {months.map((mo) =>
              mo.text ? (
                <div
                  key={mo.m}
                  className="rounded-lg border px-3 py-2"
                  style={{ borderColor: mo.c + "55", background: mo.c + "08" }}
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-[12px] font-bold tracking-wide"
                      style={{ color: mo.c }}
                    >
                      Tháng {mo.m}
                    </span>
                    <span
                      className="text-[10px] tracking-[0.2em] uppercase font-semibold"
                      style={{ color: mo.c }}
                    >
                      {mo.label}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-[1.65] text-[#0f0a08]">
                    {mo.text}
                  </p>
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Advice({ chart, seedBase }: { chart: ChartData; seedBase: number }) {
  const menh = findPalace(chart, "Mệnh");
  const menhStars = menh ? allStarNames(menh) : [];
  const directions = ["Đông Nam", "Nam", "Tây", "Bắc", "Đông"];
  const direction = pickD(directions, seedBase + 121);
  const colors = [
    "Đỏ son · Vàng đồng",
    "Xanh lục · Trắng ngà",
    "Vàng kim · Nâu trầm",
    "Lam đen · Bạc",
  ];
  const color = pickD(colors, seedBase + 131);
  const items = pickD(
    [
      "Tỳ Hưu vàng đồng",
      "Vòng dâu tằm ngũ sắc",
      "Tượng Quan Công",
      "Hồ lô đồng phong thủy",
      "Vòng tay đá Mã Não",
    ],
    seedBase + 141,
  );

  const advices = [
    `Tu thân: ${
      menhStars.includes("Phá Quân") || menhStars.includes("Thất Sát")
        ? "Tính cách quá cương — học cách mềm dẻo, nhường nhịn để tránh tự chuốc họa."
        : "Giữ tâm trong sạch, không tham lam, không vọng động."
    }`,
    `Sự nghiệp: ${
      menhStars.includes("Tử Vi")
        ? "Đảm nhận vai trò lãnh đạo nhưng đừng độc đoán."
        : "Chọn lĩnh vực hợp với thiên tư, không chạy theo trào lưu."
    }`,
    "Tình cảm: Lắng nghe và nhường nhịn — duyên dài hơn tình ngắn.",
    "Tài chính: Tích lũy đều đặn, không nên đầu cơ rủi ro cao, đặc biệt khi gặp đại vận xấu.",
    "Sức khỏe: Tập luyện đều, ăn uống điều độ, ngủ đủ giấc — tránh nóng giận.",
    "Quý nhân: Tìm gặp người hơn tuổi, có học vấn — họ là quý nhân của bạn.",
  ];

  return (
    <div className="rounded-3xl border border-[#4a6c7a]/55 bg-gradient-to-br from-[#f5e3c0]/60 via-[#fbf3e2]/95 to-[#fbf3e2]/95 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-1">
        <div className="text-2xl">🪷</div>
        <h3
          className="text-2xl font-serif text-[#0f0a08]"
          style={{ fontFamily: SERIF_FONT }}
        >
          Lời Khuyên Tổng Hợp
        </h3>
      </div>
      <p className="text-[#0f0a08] text-sm mb-5">
        Tổng kết phong thủy & lời khuyên ứng xử theo lá số
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl border border-[#4a6c7a]/40 bg-[#fbf3e2]/80 p-4 text-center">
          <div className="text-[10px] tracking-[0.25em] uppercase text-[#4a3a30] font-semibold">
            Hướng cát
          </div>
          <div
            className="mt-1.5 text-lg font-serif italic text-[#5a3a1a]"
            style={{ fontFamily: SERIF_FONT }}
          >
            {direction}
          </div>
        </div>
        <div className="rounded-2xl border border-[#4a6c7a]/40 bg-[#fbf3e2]/80 p-4 text-center">
          <div className="text-[10px] tracking-[0.25em] uppercase text-[#4a3a30] font-semibold">
            Màu may mắn
          </div>
          <div
            className="mt-1.5 text-lg font-serif italic text-[#5a3a1a]"
            style={{ fontFamily: SERIF_FONT }}
          >
            {color}
          </div>
        </div>
        <div className="rounded-2xl border border-[#4a6c7a]/40 bg-[#fbf3e2]/80 p-4 text-center">
          <div className="text-[10px] tracking-[0.25em] uppercase text-[#4a3a30] font-semibold">
            Vật phẩm hộ thân
          </div>
          <div
            className="mt-1.5 text-lg font-serif italic text-[#5a3a1a]"
            style={{ fontFamily: SERIF_FONT }}
          >
            {items}
          </div>
        </div>
      </div>

      <ul className="space-y-2.5">
        {advices.map((a, i) => (
          <li
            key={i}
            className="flex gap-3 text-[14.5px] text-[#0f0a08] leading-relaxed"
          >
            <span className="text-[#c89146] shrink-0 mt-0.5">✦</span>
            <span>{a}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DeepReadings({
  chart,
  form,
  deep,
  deepLoading,
  deepError,
  analysis,
  analysisLoading,
  analysisError,
}: {
  chart: ChartData;
  form: FormState;
  deep: DeepReadingsData | null;
  deepLoading: boolean;
  deepError: string | null;
  analysis: AnalysisSections | null;
  analysisLoading: boolean;
  analysisError: string | null;
}) {
  const seedBase =
    (+form.year || 1990) * 1000 +
    (+form.month || 1) * 50 +
    (+form.day || 1) * 5 +
    form.hour;
  const [tab, setTab] = useState<"tongquan" | "namnay">("tongquan");

  const tabs: Array<{ k: "tongquan" | "namnay"; label: string }> = [
    { k: "tongquan", label: "Tổng Quan" },
    { k: "namnay", label: "Năm Hiện Tại" },
  ];

  return (
    <div className="mt-10 space-y-6">
      {(deepLoading || deepError) && (
        <div className="rounded-2xl border border-[#3a8a5e]/35 bg-gradient-to-br from-[#f5e8d0]/60 to-[#fbf3e2]/40 p-5 md:p-6">
          {deepLoading && (
            <div className="flex items-center gap-3 text-[#4a3a30] italic">
              <span className="inline-block w-2 h-2 bg-[#4a6c7a] rounded-full animate-pulse" />
              <span
                className="inline-block w-2 h-2 bg-[#4a6c7a] rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="inline-block w-2 h-2 bg-[#4a6c7a] rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              />
              <span className="text-[13px]">
                Hệ thống đang luận giải chi tiết 12 cung, đại hạn và tiểu hạn…
                (30–60s)
              </span>
            </div>
          )}
          {deepError && !deepLoading && (
            <div className="rounded-lg border border-[#c8361d]/40 bg-[#c8361d]/10 px-3 py-2 text-[#c8361d] text-[13px]">
              ⚠ Không luận giải chi tiết được: {deepError}
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-[#4a6c7a]/45 bg-[#fbf3e2]/95 p-1.5 flex gap-1">
        {tabs.map((t) => {
          const active = tab === t.k;
          return (
            <button
              key={t.k}
              type="button"
              onClick={() => setTab(t.k)}
              className={`flex-1 px-4 py-3 rounded-xl text-[14px] font-semibold tracking-wide transition ${
                active
                  ? "bg-gradient-to-br from-[#5a3a1a] to-[#7a4a1f] text-[#fbf3e2] shadow-md"
                  : "text-[#0f0a08] hover:bg-[#fbf3e2]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "tongquan" && (
        <div className="space-y-5">
          <AnalysisCards
            analysis={analysis}
            loading={analysisLoading}
            error={analysisError}
          />
          <TongQuanLaSo chart={chart} form={form} />
          <CareerWealth chart={chart} seedBase={seedBase} />
          <LoveFamily chart={chart} seedBase={seedBase} />
          <Health chart={chart} seedBase={seedBase} />
          <Advice chart={chart} seedBase={seedBase} />
        </div>
      )}
      {tab === "namnay" && (
        <NamHienTaiDetail
          chart={chart}
          form={form}
          seedBase={seedBase}
          aiData={deep?.namHienTai}
        />
      )}

      <div className="pt-8 border-t border-[#4a6c7a]/30">
        <div className="text-center mb-6">
          <div className="text-[11px] tracking-[0.4em] text-[#4a6c7a] uppercase">
            大 限 · 小 限
          </div>
          <h2
            className="mt-2 text-4xl font-serif italic text-[#0f0a08]"
            style={{ fontFamily: SERIF_FONT }}
          >
            Đại Hạn & Tiểu Hạn
          </h2>
          <p className="mt-2 text-[#0f0a08]">
            Vận trình theo từng giai đoạn 10 năm và từng năm
          </p>
        </div>
        <div className="space-y-5">
          <DaiHan10
            chart={chart}
            form={form}
            seedBase={seedBase}
            aiData={deep?.daiHan}
          />
          <TieuHanNam
            chart={chart}
            form={form}
            seedBase={seedBase}
            aiData={deep?.tieuHan}
          />
        </div>
      </div>

      <div className="pt-8 border-t border-[#4a6c7a]/30">
        <div className="text-center mb-6">
          <div className="text-[11px] tracking-[0.4em] text-[#4a6c7a] uppercase">
            十 二 宮 · Thập Nhị Cung
          </div>
          <h2
            className="mt-2 text-4xl font-serif italic text-[#0f0a08]"
            style={{ fontFamily: SERIF_FONT }}
          >
            Luận Giải 12 Cung
          </h2>
          <p className="mt-2 text-[#0f0a08]">
            Bấm vào từng cung để xem chi tiết tinh tú và ý nghĩa
          </p>
        </div>
        <CungAccordion chart={chart} aiData={deep?.twelvePalaces} />
      </div>
    </div>
  );
}
