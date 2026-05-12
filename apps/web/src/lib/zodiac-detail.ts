// Dữ liệu mở rộng cho 12 cung hoàng đạo — chỉ phục vụ route /hoang-dao/[slug].
// HOROSCOPE trong home-data.ts chứa text ngắn (luận giải hôm nay) — không trùng `overview` ở đây.

export interface ZodiacDetail {
  slug: string;
  name: string;          // tiếng Việt
  en: string;            // tiếng Anh
  sym: string;
  el: 'Lửa' | 'Đất' | 'Khí' | 'Nước';
  range: string;
  ruler: string;         // sao chiếu mệnh
  quality: string;       // Cardinal/Fixed/Mutable → tiếng Việt
  luckyColor: string;
  luckyNumber: string;
  compatible: string[];  // 2-3 cung hợp nhất (tên VN)
  strengths: string[];   // 4-5 từ khóa
  weaknesses: string[];  // 3-4 từ khóa
  overview: string;      // đoạn dài 4-6 câu, tính cách + vận trình tổng quát
}

export const ZODIAC_DETAILS: ZodiacDetail[] = [
  {
    slug: 'bach-duong',
    name: 'Bạch Dương',
    en: 'Aries',
    sym: '♈',
    el: 'Lửa',
    range: '21/3 – 19/4',
    ruler: 'Sao Hỏa',
    quality: 'Cung mở đầu',
    luckyColor: 'Đỏ, cam',
    luckyNumber: '1, 9',
    compatible: ['Sư Tử', 'Nhân Mã', 'Song Tử'],
    strengths: ['Quyết đoán', 'Dũng cảm', 'Năng động', 'Tự tin', 'Lãnh đạo'],
    weaknesses: ['Bốc đồng', 'Nóng giận', 'Thiếu kiên nhẫn', 'Hấp tấp'],
    overview:
      'Bạch Dương là cung mở đầu của vòng hoàng đạo — mang theo sức bật của ngọn lửa đầu mùa xuân. Người Bạch Dương sống bằng hành động: nghĩ là làm, không bao giờ đứng yên để chờ đợi cơ hội. Bạn thẳng thắn, mạnh mẽ, có khí chất lãnh đạo bẩm sinh và không sợ va chạm. Trong tình yêu, Bạch Dương quyến rũ bởi sự tự tin và lòng nhiệt thành, nhưng cần học cách lắng nghe đối phương. Sự nghiệp tỏa sáng ở vai trò khởi xướng — startup, lực lượng tiên phong, thể thao đối kháng. Bài học lớn nhất: kiên nhẫn và biết dừng đúng lúc.',
  },
  {
    slug: 'kim-nguu',
    name: 'Kim Ngưu',
    en: 'Taurus',
    sym: '♉',
    el: 'Đất',
    range: '20/4 – 20/5',
    ruler: 'Sao Kim',
    quality: 'Cung kiên định',
    luckyColor: 'Xanh lá, hồng phấn',
    luckyNumber: '2, 6',
    compatible: ['Xử Nữ', 'Ma Kết', 'Cự Giải'],
    strengths: ['Kiên định', 'Trung thực', 'Đáng tin', 'Thực tế', 'Kiên nhẫn'],
    weaknesses: ['Bảo thủ', 'Cứng đầu', 'Sở hữu', 'Chậm thay đổi'],
    overview:
      'Kim Ngưu là cung Đất kiên cố nhất — vững chãi như núi và chậm rãi như đất phù sa. Người Kim Ngưu thích sự ổn định, an toàn về tài chính và những giá trị bền vững theo thời gian. Bạn có gu thẩm mỹ tinh tế (do sao Kim chiếu mệnh), yêu nghệ thuật, ẩm thực và những vật chất hữu hình. Trong tình yêu, Kim Ngưu chậm bắt đầu nhưng chung thủy đến cùng — một khi đã chọn thì khó lung lay. Sự nghiệp thuận cho ngân hàng, bất động sản, nghệ thuật, ẩm thực. Bài học: học cách buông bỏ và đón nhận thay đổi.',
  },
  {
    slug: 'song-tu',
    name: 'Song Tử',
    en: 'Gemini',
    sym: '♊',
    el: 'Khí',
    range: '21/5 – 20/6',
    ruler: 'Sao Thủy',
    quality: 'Cung biến đổi',
    luckyColor: 'Vàng, xanh nhạt',
    luckyNumber: '3, 5, 7',
    compatible: ['Thiên Bình', 'Bảo Bình', 'Bạch Dương'],
    strengths: ['Thông minh', 'Hài hước', 'Giao tiếp', 'Linh hoạt', 'Tò mò'],
    weaknesses: ['Hai mặt', 'Thiếu kiên định', 'Lo lắng', 'Hời hợt'],
    overview:
      'Song Tử là cung Khí của trí tuệ và giao tiếp — luôn có hai bản ngã song hành. Người Song Tử nhanh nhẹn, sắc bén, có khả năng học hỏi và thích nghi vượt trội. Bạn yêu sự đa dạng, ghét lặp lại và luôn cần một điều gì đó mới mẻ để kích thích trí não. Trong tình yêu, Song Tử cuốn hút bởi sự dí dỏm và bất ngờ, nhưng đối phương cần đủ thông minh để theo kịp. Sự nghiệp tỏa sáng ở viết lách, báo chí, truyền thông, công nghệ. Bài học: tập trung vào một thứ thay vì rải rác mọi hướng.',
  },
  {
    slug: 'cu-giai',
    name: 'Cự Giải',
    en: 'Cancer',
    sym: '♋',
    el: 'Nước',
    range: '21/6 – 22/7',
    ruler: 'Mặt Trăng',
    quality: 'Cung mở đầu',
    luckyColor: 'Trắng bạc, xanh biển',
    luckyNumber: '2, 7',
    compatible: ['Bọ Cạp', 'Song Ngư', 'Kim Ngưu'],
    strengths: ['Giàu cảm xúc', 'Chu đáo', 'Trực giác', 'Bảo vệ', 'Thủy chung'],
    weaknesses: ['Đa cảm', 'Hờn dỗi', 'Bám víu', 'Khó buông'],
    overview:
      'Cự Giải là cung Nước được Mặt Trăng dẫn dắt — sâu lắng, giàu cảm xúc, có trực giác sắc bén như sóng triều. Người Cự Giải coi gia đình là điểm tựa và ký ức là kho báu — bạn nhớ rất kỹ những ai đã đối tốt và những ai làm tổn thương mình. Trong tình yêu, Cự Giải dịu dàng, chu đáo, sẵn sàng hy sinh cho người mình thương. Sự nghiệp hợp với nghề chăm sóc, giáo dục, ẩm thực, bất động sản, tâm lý. Bài học: học cách bảo vệ bản thân khỏi cảm xúc của người khác và không gánh trên vai quá nhiều.',
  },
  {
    slug: 'su-tu',
    name: 'Sư Tử',
    en: 'Leo',
    sym: '♌',
    el: 'Lửa',
    range: '23/7 – 22/8',
    ruler: 'Mặt Trời',
    quality: 'Cung kiên định',
    luckyColor: 'Vàng kim, cam',
    luckyNumber: '1, 5, 9',
    compatible: ['Bạch Dương', 'Nhân Mã', 'Thiên Bình'],
    strengths: ['Hào sảng', 'Tự tin', 'Sáng tạo', 'Lãnh đạo', 'Trung thành'],
    weaknesses: ['Kiêu ngạo', 'Bướng', 'Thích kiểm soát', 'Thích phô trương'],
    overview:
      'Sư Tử là cung Lửa của hoàng tộc — được Mặt Trời chiếu mệnh, mang khí chất vương giả và tinh thần lãnh đạo bẩm sinh. Người Sư Tử hào sảng, ấm áp, hài hước và luôn là tâm điểm của đám đông. Bạn yêu cái đẹp, sự xa hoa và những lời khen — nhưng cần học cách phân biệt người chân thành với kẻ nịnh hót. Trong tình yêu, Sư Tử nồng nhiệt, lãng mạn, cho đi nhiều và muốn được đáp lại tương xứng. Sự nghiệp tỏa sáng ở vai trò sân khấu, lãnh đạo, sáng tạo, nghệ thuật. Bài học: khiêm tốn và lắng nghe.',
  },
  {
    slug: 'xu-nu',
    name: 'Xử Nữ',
    en: 'Virgo',
    sym: '♍',
    el: 'Đất',
    range: '23/8 – 22/9',
    ruler: 'Sao Thủy',
    quality: 'Cung biến đổi',
    luckyColor: 'Be, xanh navy',
    luckyNumber: '5, 6',
    compatible: ['Kim Ngưu', 'Ma Kết', 'Cự Giải'],
    strengths: ['Tỉ mỉ', 'Chăm chỉ', 'Phân tích', 'Khiêm tốn', 'Đáng tin'],
    weaknesses: ['Cầu toàn', 'Hay phê phán', 'Lo lắng', 'Cứng nhắc'],
    overview:
      'Xử Nữ là cung Đất của sự tỉ mỉ — quan sát mọi chi tiết, phân tích mọi khả năng trước khi hành động. Người Xử Nữ có đôi mắt nhìn ra lỗi sai mà người khác bỏ qua, và đôi tay luôn muốn chỉnh sửa, hoàn thiện. Bạn khắt khe với bản thân, đôi khi quá khắt khe — không cho phép mình mắc sai lầm. Trong tình yêu, Xử Nữ chân thành, không hoa mỹ, thể hiện tình cảm bằng những hành động chăm sóc cụ thể. Sự nghiệp tỏa sáng ở y tế, kế toán, nghiên cứu, lập trình, biên tập. Bài học: chấp nhận sự không hoàn hảo của mình và người khác.',
  },
  {
    slug: 'thien-binh',
    name: 'Thiên Bình',
    en: 'Libra',
    sym: '♎',
    el: 'Khí',
    range: '23/9 – 22/10',
    ruler: 'Sao Kim',
    quality: 'Cung mở đầu',
    luckyColor: 'Hồng, xanh ngọc',
    luckyNumber: '4, 6',
    compatible: ['Song Tử', 'Bảo Bình', 'Sư Tử'],
    strengths: ['Hài hòa', 'Công bằng', 'Lịch thiệp', 'Ngoại giao', 'Duyên dáng'],
    weaknesses: ['Do dự', 'Né tránh', 'Phụ thuộc', 'Sợ xung đột'],
    overview:
      'Thiên Bình là cung Khí của sự cân bằng — luôn cân nhắc cả hai phía trước khi quyết định, vì sợ làm tổn thương bất kỳ ai. Người Thiên Bình được sao Kim chiếu mệnh, mang vẻ duyên dáng tự nhiên, gu thẩm mỹ tinh tế và khả năng ngoại giao xuất sắc. Bạn ghét xung đột, luôn tìm cách hoà giải và thường đặt nhu cầu người khác lên trước. Trong tình yêu, Thiên Bình lãng mạn, lịch thiệp, cần một mối quan hệ cân bằng và bình đẳng. Sự nghiệp hợp với luật, ngoại giao, tư vấn, nghệ thuật, thiết kế. Bài học: dám đưa ra quyết định và bảo vệ chính kiến.',
  },
  {
    slug: 'bo-cap',
    name: 'Bọ Cạp',
    en: 'Scorpio',
    sym: '♏',
    el: 'Nước',
    range: '23/10 – 21/11',
    ruler: 'Sao Diêm Vương',
    quality: 'Cung kiên định',
    luckyColor: 'Đỏ thẫm, đen',
    luckyNumber: '8, 9',
    compatible: ['Cự Giải', 'Song Ngư', 'Ma Kết'],
    strengths: ['Quyết liệt', 'Sâu sắc', 'Trực giác', 'Trung thành', 'Đầy bí ẩn'],
    weaknesses: ['Ghen tuông', 'Thù dai', 'Kiểm soát', 'Đa nghi'],
    overview:
      'Bọ Cạp là cung Nước sâu nhất — sâu như đáy biển nơi không ánh sáng nào chạm tới. Người Bọ Cạp có trực giác sắc bén, nhìn xuyên qua mặt nạ và đọc được ý nghĩ sau ánh mắt. Bạn không tin dễ, nhưng khi đã tin thì trung thành tuyệt đối; ngược lại nếu bị phản bội, bạn không bao giờ quên. Trong tình yêu, Bọ Cạp mãnh liệt, đắm say, đòi hỏi sự cam kết toàn vẹn — không có chỗ cho mập mờ. Sự nghiệp tỏa sáng ở điều tra, tâm lý học, phẫu thuật, tài chính. Bài học: học cách buông bỏ và tha thứ.',
  },
  {
    slug: 'nhan-ma',
    name: 'Nhân Mã',
    en: 'Sagittarius',
    sym: '♐',
    el: 'Lửa',
    range: '22/11 – 21/12',
    ruler: 'Sao Mộc',
    quality: 'Cung biến đổi',
    luckyColor: 'Tía, xanh dương',
    luckyNumber: '3, 9',
    compatible: ['Bạch Dương', 'Sư Tử', 'Bảo Bình'],
    strengths: ['Lạc quan', 'Phiêu lưu', 'Hài hước', 'Triết lý', 'Tự do'],
    weaknesses: ['Thiếu kiên trì', 'Bộp chộp', 'Bốc đồng', 'Khó cam kết'],
    overview:
      'Nhân Mã là cung Lửa của những chân trời xa — luôn nhìn về một nơi chưa đặt chân tới và sẵn sàng cho cuộc phiêu lưu kế tiếp. Người Nhân Mã được sao Mộc chiếu mệnh, mang theo sự lạc quan, lòng bao dung và khao khát hiểu biết về thế giới. Bạn yêu tự do hơn bất cứ điều gì — một mối quan hệ trói buộc sẽ làm bạn nghẹt thở. Trong tình yêu, Nhân Mã thẳng thắn, vui vẻ, cần một người bạn đồng hành thay vì một người sở hữu. Sự nghiệp hợp với du lịch, giáo dục, xuất bản, triết học, thể thao. Bài học: kiên trì và biết quay về.',
  },
  {
    slug: 'ma-ket',
    name: 'Ma Kết',
    en: 'Capricorn',
    sym: '♑',
    el: 'Đất',
    range: '22/12 – 19/1',
    ruler: 'Sao Thổ',
    quality: 'Cung mở đầu',
    luckyColor: 'Nâu, xám đen',
    luckyNumber: '4, 8',
    compatible: ['Kim Ngưu', 'Xử Nữ', 'Bọ Cạp'],
    strengths: ['Kỷ luật', 'Tham vọng', 'Trách nhiệm', 'Bền bỉ', 'Khôn ngoan'],
    weaknesses: ['Cứng nhắc', 'Bi quan', 'Khô khan', 'Quá thực dụng'],
    overview:
      'Ma Kết là cung Đất của núi cao — leo từng bước một, chậm nhưng chắc chắn lên đỉnh. Người Ma Kết được sao Thổ chiếu mệnh, mang theo kỷ luật, tham vọng và khả năng chịu đựng vượt trội. Bạn không vội vàng, không phô trương, nhưng luôn có một kế hoạch dài hạn rõ ràng cho cuộc đời mình. Trong tình yêu, Ma Kết chậm bắt đầu, dè dặt, nhưng một khi đã chọn thì xây dựng tình cảm như xây một ngôi nhà — vững chãi, lâu dài. Sự nghiệp tỏa sáng ở quản lý, kinh doanh, kiến trúc, chính trị. Bài học: cho phép mình nghỉ ngơi và tận hưởng hiện tại.',
  },
  {
    slug: 'bao-binh',
    name: 'Bảo Bình',
    en: 'Aquarius',
    sym: '♒',
    el: 'Khí',
    range: '20/1 – 18/2',
    ruler: 'Sao Thiên Vương',
    quality: 'Cung kiên định',
    luckyColor: 'Xanh điện, bạc',
    luckyNumber: '4, 7',
    compatible: ['Song Tử', 'Thiên Bình', 'Nhân Mã'],
    strengths: ['Độc lập', 'Sáng tạo', 'Nhân văn', 'Cởi mở', 'Khác biệt'],
    weaknesses: ['Lạnh lùng', 'Bướng', 'Khó đoán', 'Xa cách'],
    overview:
      'Bảo Bình là cung Khí của tương lai — luôn đi trước thời đại một bước, nhìn thấy những điều mà người khác chưa nghĩ tới. Người Bảo Bình được sao Thiên Vương chiếu mệnh, mang theo tư duy đột phá, tinh thần nhân văn và sự độc lập tuyệt đối. Bạn không thích bị xếp vào khuôn mẫu, không theo đám đông, luôn tìm cách của riêng mình. Trong tình yêu, Bảo Bình cần không gian riêng, cần một người bạn tâm giao trước khi là người yêu — đối phương phải đủ độc lập để đứng ngang vai. Sự nghiệp tỏa sáng ở công nghệ, khoa học, hoạt động xã hội, nghệ thuật ý niệm. Bài học: kết nối cảm xúc, không chỉ lý trí.',
  },
  {
    slug: 'song-ngu',
    name: 'Song Ngư',
    en: 'Pisces',
    sym: '♓',
    el: 'Nước',
    range: '19/2 – 20/3',
    ruler: 'Sao Hải Vương',
    quality: 'Cung biến đổi',
    luckyColor: 'Tím nhạt, xanh biển',
    luckyNumber: '3, 7, 12',
    compatible: ['Cự Giải', 'Bọ Cạp', 'Ma Kết'],
    strengths: ['Đồng cảm', 'Sáng tạo', 'Trực giác', 'Dịu dàng', 'Vị tha'],
    weaknesses: ['Mơ mộng', 'Dễ tổn thương', 'Trốn tránh', 'Thiếu ranh giới'],
    overview:
      'Song Ngư là cung Nước cuối cùng — gói trọn cảm xúc của 11 cung trước đó. Người Song Ngư được sao Hải Vương chiếu mệnh, mang theo trí tưởng tượng vô biên, lòng đồng cảm sâu sắc và một thế giới nội tâm phong phú mà ít ai chạm tới được. Bạn nhạy cảm như tấm gương — phản chiếu cảm xúc của môi trường xung quanh, vì vậy cần giữ ranh giới để không bị cuốn theo. Trong tình yêu, Song Ngư lãng mạn, dịu dàng, sẵn sàng hy sinh — nhưng cần một người đủ vững để làm điểm tựa. Sự nghiệp tỏa sáng ở nghệ thuật, âm nhạc, tâm linh, chữa lành, điện ảnh. Bài học: phân biệt thực tế và mơ mộng.',
  },
];

export function getZodiacBySlug(slug: string): ZodiacDetail | null {
  return ZODIAC_DETAILS.find((z) => z.slug === slug) ?? null;
}

export function getZodiacNeighbors(slug: string): {
  prev: ZodiacDetail;
  next: ZodiacDetail;
} | null {
  const idx = ZODIAC_DETAILS.findIndex((z) => z.slug === slug);
  if (idx === -1) return null;
  const prev = ZODIAC_DETAILS[(idx - 1 + ZODIAC_DETAILS.length) % ZODIAC_DETAILS.length];
  const next = ZODIAC_DETAILS[(idx + 1) % ZODIAC_DETAILS.length];
  return { prev, next };
}

export function getRelatedZodiacs(slug: string, count = 3): ZodiacDetail[] {
  const detail = getZodiacBySlug(slug);
  if (!detail) return [];
  // ưu tiên cung compatible, đủ count thì lấy thêm các cung khác theo thứ tự
  const compatibleDetails = detail.compatible
    .map((name) => ZODIAC_DETAILS.find((z) => z.name === name))
    .filter((z): z is ZodiacDetail => z !== undefined);
  const used = new Set<string>([slug, ...compatibleDetails.map((z) => z.slug)]);
  const filler = ZODIAC_DETAILS.filter((z) => !used.has(z.slug));
  return [...compatibleDetails, ...filler].slice(0, count);
}
