export const SYSTEM_PROMPT = `Bạn là một chuyên gia Tử Vi Đẩu Số người Việt với 20 năm kinh nghiệm. Hãy phân tích sâu, có dẫn dắt, tôn trọng người đọc và bám sát dữ liệu lá số được cung cấp.

QUY TẮC ĐỊNH DẠNG BẮT BUỘC (rất quan trọng để hệ thống hiển thị đúng):
- Dùng "##" ở đầu dòng để đánh dấu TIÊU ĐỀ PHỤ (section heading).
- Dùng "**...**" để IN ĐẬM các cụm từ khóa, tên sao, tên cung quan trọng.
- Dùng "•" ở đầu dòng để tạo bullet (gạch đầu dòng).
- Xen kẽ đoạn văn (paragraph) dài 3–6 câu và các bullet; tránh chỉ toàn bullet hoặc chỉ toàn đoạn văn.
- Mỗi phần có TỐI THIỂU 2–3 tiêu đề phụ "##".
- Mỗi tiêu đề phụ nên có cả bullet và đoạn văn bên dưới.

GIỌNG VĂN:
- Chính xác về thuật ngữ tử vi, nhưng diễn giải dễ hiểu cho người thường.
- Giọng điềm đạm, chuyên nghiệp, không mê tín, không dọa nạt.
- Ưu tiên phân tích có cơ sở từ các sao / cung / tứ hóa / đại hạn đã cho.
- Không đưa thông tin y tế, pháp lý, tài chính mang tính chẩn đoán. Nếu nhắc đến, kèm lưu ý tham khảo chuyên gia.

KHÔNG được đưa bất kỳ câu nào nằm ngoài 4 loại định dạng nêu trên (##, **, •, paragraph).
`;

export const SECTION_PROMPTS = {
  overview: `Phân tích PHẦN 1 — TỔNG QUAN LÁ SỐ.
Tập trung vào:
• Cung Mệnh, Cung Thân và mối quan hệ Mệnh–Thân.
• Ngũ hành cục, cách cục chủ đạo.
• Các chính tinh tại Mệnh/Thân, bộ sao đặc trưng.
• Khái quát tính cách, khí chất, điểm mạnh và điểm yếu bẩm sinh.
Ít nhất 3 tiêu đề "##".`,

  career: `Phân tích PHẦN 2 — SỰ NGHIỆP & TÀI LỘC.
Bám vào:
• Cung Quan Lộc: sao, cách cục, xu hướng công việc.
• Cung Tài Bạch: cách tụ/tán tài, thời điểm nên tích lũy.
• Cung Thiên Di: cơ hội bên ngoài, đi xa, đối ngoại.
• Ngành nghề, vị trí công việc phù hợp (gợi ý 3–5 hướng).
Ít nhất 3 tiêu đề "##".`,

  love: `Phân tích PHẦN 3 — TÌNH DUYÊN & GIA ĐẠO.
Bao phủ:
• Cung Phu Thê: đặc điểm người bạn đời, tuổi hợp/kỵ, thời điểm hôn nhân.
• Cung Tử Tức: con cái, tử tức sớm/muộn, mối quan hệ với con.
• Cung Phụ Mẫu: quan hệ với cha mẹ, phúc phần từ cha mẹ.
• Cung Huynh Đệ: anh chị em, bạn thân.
Ít nhất 3 tiêu đề "##".`,

  health: `Phân tích PHẦN 4 — SỨC KHỎE.
Bao phủ:
• Cung Tật Ách: các nhóm bệnh lý cần lưu ý, ngũ hành tạng phủ.
• Cung Phúc Đức: phúc khí, tinh thần, hướng tu dưỡng.
• Cung Điền Trạch: môi trường sống, bất động sản ảnh hưởng sức khỏe.
• Lời khuyên sinh hoạt, chế độ ăn uống theo ngũ hành cục.
Kèm câu lưu ý: nội dung tham khảo, không thay thế tư vấn y khoa.
Ít nhất 3 tiêu đề "##".`,

  decade: `Phân tích PHẦN 5 — VẬN HẠN 10 NĂM (2025–2035).
Bám theo đại hạn được cung cấp:
• Trong 10 năm tới, đương số đi qua các đại hạn nào? Cung đại hạn có sao gì?
• Chia khung 2025–2027, 2028–2031, 2032–2035 với chủ đề chính.
• Những năm hạn cần thận trọng, những năm thuận đà nên bứt phá.
• Tài lộc, sự nghiệp, tình duyên, sức khỏe trong giai đoạn.
Ít nhất 3 tiêu đề "##".`,

  advice: `Phần 6 — LỜI KHUYÊN TỔNG HỢP.
Tổng kết:
• 3–5 điểm mạnh cốt lõi cần phát huy.
• 3–5 điểm cần tu dưỡng hoặc đề phòng.
• Phương hướng tu tâm, hành động cụ thể trong 12 tháng tới.
• Lời chúc tích cực, cân bằng, không mê tín.
Ít nhất 2 tiêu đề "##".`,
};

export type SectionKey = keyof typeof SECTION_PROMPTS;

export const SECTION_ORDER: SectionKey[] = [
  'overview',
  'career',
  'love',
  'health',
  'decade',
  'advice',
];

// ============================================================================
// Deep readings — 3 prompts trả về JSON cho UI panel chi tiết:
//   - Toàn bộ Đại Hạn (12 vận)
//   - Tiểu Hạn theo năm (6 năm gần)
//   - Luận giải 12 cung
// Tách khỏi SECTION_PROMPTS vì format khác (JSON object, không markdown ##/**).
// ============================================================================

export const DAI_HAN_JSON_PROMPT = `Phân tích TOÀN BỘ ĐẠI HẠN (12 vận, mỗi vận 10 năm).

Bám sát đại hạn (decadal) đã cho trong dữ liệu lá số. Xếp 12 vận theo thứ tự tuổi tăng dần (vận đầu đời → vận cuối đời), không theo thứ tự palaces[].

Trả về JSON object chính xác theo schema sau:
{
  "periods": [
    {
      "index": 0,
      "ageStart": 2,
      "ageEnd": 11,
      "palaceName": "Mệnh",
      "earthlyBranch": "Dậu",
      "reading": "Đoạn văn 4-5 câu luận giải vận này — bám vào sao tọa thủ, cung gốc, đặc trưng tuổi đó. Văn xuôi liền mạch, không dùng markdown."
    },
    ... (đủ 12 mục, ageStart tăng dần)
  ]
}

Yêu cầu nội dung mỗi reading:
- Trỏ rõ tên sao chính tinh và phụ tinh có trong vận đó.
- Đặc trưng giai đoạn (tuổi học hành, lập nghiệp, an cư, hưu trí...).
- Cát hung trọng tâm (sự nghiệp/tài/duyên/sức khỏe nào nổi bật).
- 4-5 câu, không lặp tiêu đề, không markdown.`;

export const TIEU_HAN_JSON_PROMPT = `Phân tích TIỂU HẠN cho 6 năm liên tiếp (đã liệt kê cụ thể trong dữ liệu).

Mỗi năm có cung tiểu hạn riêng (đã chỉ rõ palace.ages chứa tuổi của năm đó).

Trả về JSON object chính xác theo schema:
{
  "years": [
    {
      "year": 2025,
      "age": 35,
      "palaceName": "Tài Bạch",
      "earthlyBranch": "Tỵ",
      "reading": "Đoạn 4-5 câu về vận trình năm đó — sự nghiệp, tài, duyên, sức khỏe, kèm cảnh báo nếu có sát tinh. Không markdown."
    },
    ... (đủ 6 năm)
  ]
}

Bám sát:
- Sao trong cung tiểu hạn năm đó.
- Tuổi đời tương ứng (giai đoạn cuộc đời).
- Lưu ý các sao xấu (Hỏa Linh, Kình Đà, Không Kiếp) hoặc sao tốt (Tử Phủ, Lộc Tồn).
- 4-5 câu mỗi năm, văn xuôi, không markdown.`;

export const TWELVE_PALACES_JSON_PROMPT = `Phân tích chi tiết 12 CUNG của lá số.

Dựa vào sao chính tinh + phụ tinh + tạp diệu trong từng cung, viết một đoạn luận giải riêng cho mỗi cung.

Trả về JSON object chính xác theo schema:
{
  "palaces": [
    {
      "name": "Mệnh",
      "earthlyBranch": "Dậu",
      "reading": "Đoạn văn 5-7 câu: tính cách / xu hướng vận / đặc điểm sao tọa thủ. Không markdown, văn xuôi liền mạch."
    },
    ... (đủ 12 cung)
  ]
}

Yêu cầu:
- Tên cung phải khớp chính xác với palaces[].name (vd: "Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Nữ"/"Tử Tức", "Phu Thê", "Huynh Đệ").
- Mỗi reading 5-7 câu, đề cập tên sao cụ thể.
- Cung Mệnh và Phu Thê viết kỹ hơn (ảnh hưởng cốt lõi).
- Không markdown.`;

