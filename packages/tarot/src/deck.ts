import type { TarotCard } from './types.js';

/**
 * 78-card Rider-Waite-Smith deck.
 *
 * Image hosting: ảnh lấy từ repo `metabismuth/tarot-json` (raw GitHub).
 * Một hop, public domain RWS (Pamela Colman Smith, 1909). Nếu cần đổi CDN
 * sau này, chỉ sửa `TAROT_IMAGE_BASE` ở dưới + `imageSlug` đã chuẩn hoá.
 *
 * Naming convention slug — match đúng filename trong metabismuth/cards/:
 *   - Major: m00..m21
 *   - Cups: c01..c14, Swords: s01..s14, Wands: w01..w14, Pentacles: p01..p14
 *
 * Ý nghĩa upright/reversed: rút gọn cô đọng tiếng Việt (1-2 câu), dùng làm
 * base label hiển thị dưới lá bài. Phần luận giải sâu sinh từ Deepseek.
 */
export const TAROT_IMAGE_BASE =
  'https://raw.githubusercontent.com/metabismuth/tarot-json/master/cards/';

export const TAROT_DECK: TarotCard[] = [
  // ───────────────────────── MAJOR ARCANA (22 lá) ─────────────────────────
  {
    id: 'major-00-fool',
    name: 'The Fool',
    nameVi: 'Chàng Khờ',
    suit: 'major',
    number: 0,
    imageSlug: 'm00',
    uprightMeaning:
      'Khởi đầu mới, tự do, hồn nhiên, dám bước vào điều chưa biết với niềm tin.',
    reversedMeaning:
      'Liều lĩnh thiếu suy nghĩ, do dự khởi đầu, ngây thơ gây thiệt thân.',
  },
  {
    id: 'major-01-magician',
    name: 'The Magician',
    nameVi: 'Nhà Ảo Thuật',
    suit: 'major',
    number: 1,
    imageSlug: 'm01',
    uprightMeaning:
      'Đầy đủ công cụ, ý chí mạnh, biến ý tưởng thành hiện thực bằng tập trung.',
    reversedMeaning:
      'Thao túng, lừa dối bản thân, năng lực bị lãng phí hoặc dùng sai mục đích.',
  },
  {
    id: 'major-02-high-priestess',
    name: 'The High Priestess',
    nameVi: 'Nữ Tư Tế',
    suit: 'major',
    number: 2,
    imageSlug: 'm02',
    uprightMeaning:
      'Trực giác sâu, bí mật, kiên nhẫn lắng nghe nội tâm trước khi hành động.',
    reversedMeaning:
      'Mất kết nối với trực giác, bí mật bị che giấu, hời hợt thiếu chiều sâu.',
  },
  {
    id: 'major-03-empress',
    name: 'The Empress',
    nameVi: 'Nữ Hoàng',
    suit: 'major',
    number: 3,
    imageSlug: 'm03',
    uprightMeaning:
      'Sung mãn, nuôi dưỡng, sáng tạo, kết quả đến từ chăm chút và bao dung.',
    reversedMeaning:
      'Phụ thuộc, ngạt thở vì quá quan tâm, sáng tạo bị tắc nghẽn.',
  },
  {
    id: 'major-04-emperor',
    name: 'The Emperor',
    nameVi: 'Hoàng Đế',
    suit: 'major',
    number: 4,
    imageSlug: 'm04',
    uprightMeaning:
      'Quyền lực, kỷ luật, cấu trúc rõ ràng, đóng vai trò người dẫn dắt.',
    reversedMeaning:
      'Độc đoán, cứng nhắc, lạm dụng quyền hành hoặc thiếu chính kiến.',
  },
  {
    id: 'major-05-hierophant',
    name: 'The Hierophant',
    nameVi: 'Giáo Hoàng',
    suit: 'major',
    number: 5,
    imageSlug: 'm05',
    uprightMeaning:
      'Truyền thống, học hỏi từ người dẫn dắt, tuân theo quy chuẩn đã được kiểm chứng.',
    reversedMeaning:
      'Nổi loạn, phá vỡ luật lệ, tự tìm con đường riêng ngoài khuôn mẫu.',
  },
  {
    id: 'major-06-lovers',
    name: 'The Lovers',
    nameVi: 'Tình Nhân',
    suit: 'major',
    number: 6,
    imageSlug: 'm06',
    uprightMeaning:
      'Lựa chọn quan trọng, hòa hợp tâm hồn, tình yêu sâu sắc dựa trên giá trị chung.',
    reversedMeaning:
      'Mâu thuẫn nội tâm, lựa chọn sai lệch, mối quan hệ mất cân bằng.',
  },
  {
    id: 'major-07-chariot',
    name: 'The Chariot',
    nameVi: 'Cỗ Xe',
    suit: 'major',
    number: 7,
    imageSlug: 'm07',
    uprightMeaning:
      'Chiến thắng nhờ ý chí, kiểm soát hướng đi, vượt trở ngại bằng quyết tâm.',
    reversedMeaning:
      'Mất phương hướng, thiếu kiểm soát, năng lượng phân tán không tiến được.',
  },
  {
    id: 'major-08-strength',
    name: 'Strength',
    nameVi: 'Sức Mạnh',
    suit: 'major',
    number: 8,
    imageSlug: 'm08',
    uprightMeaning:
      'Lòng dũng cảm dịu dàng, kiểm soát bản năng bằng kiên nhẫn và tình thương.',
    reversedMeaning:
      'Tự ti, mất tự chủ, để cảm xúc bộc phát chế ngự lý trí.',
  },
  {
    id: 'major-09-hermit',
    name: 'The Hermit',
    nameVi: 'Ẩn Sĩ',
    suit: 'major',
    number: 9,
    imageSlug: 'm09',
    uprightMeaning:
      'Tự vấn, rút lui để chiêm nghiệm, ánh sáng đến từ thời gian một mình.',
    reversedMeaning:
      'Cô đơn cô lập, từ chối kết nối, lạc lối trong nội tâm.',
  },
  {
    id: 'major-10-wheel',
    name: 'Wheel of Fortune',
    nameVi: 'Bánh Xe Số Phận',
    suit: 'major',
    number: 10,
    imageSlug: 'm10',
    uprightMeaning:
      'Chu kỳ vận chuyển, bước ngoặt, vận may thuận tới sau giai đoạn chờ đợi.',
    reversedMeaning:
      'Vận xoay nghịch chiều, chống cự thay đổi, lặp lại sai lầm cũ.',
  },
  {
    id: 'major-11-justice',
    name: 'Justice',
    nameVi: 'Công Lý',
    suit: 'major',
    number: 11,
    imageSlug: 'm11',
    uprightMeaning:
      'Công bằng, trách nhiệm, hậu quả của hành động được phơi bày rõ ràng.',
    reversedMeaning:
      'Bất công, trốn tránh trách nhiệm, phán xét thiên lệch.',
  },
  {
    id: 'major-12-hanged',
    name: 'The Hanged Man',
    nameVi: 'Người Treo Ngược',
    suit: 'major',
    number: 12,
    imageSlug: 'm12',
    uprightMeaning:
      'Buông bỏ kiểm soát, thay đổi góc nhìn, hi sinh ngắn hạn để thấu hiểu sâu.',
    reversedMeaning:
      'Mắc kẹt, chống cự thay đổi cần thiết, trì hoãn vô ích.',
  },
  {
    id: 'major-13-death',
    name: 'Death',
    nameVi: 'Cái Chết',
    suit: 'major',
    number: 13,
    imageSlug: 'm13',
    uprightMeaning:
      'Kết thúc cần thiết, chuyển hóa sâu sắc, dọn dẹp cũ để đón mới.',
    reversedMeaning:
      'Bám víu quá khứ, sợ buông bỏ, kháng cự kết thúc tự nhiên.',
  },
  {
    id: 'major-14-temperance',
    name: 'Temperance',
    nameVi: 'Tiết Độ',
    suit: 'major',
    number: 14,
    imageSlug: 'm14',
    uprightMeaning:
      'Cân bằng, kiên nhẫn, kết hợp hài hòa các yếu tố đối lập một cách khéo léo.',
    reversedMeaning:
      'Thái quá, mất cân bằng, vội vàng hoặc xung đột nội tâm.',
  },
  {
    id: 'major-15-devil',
    name: 'The Devil',
    nameVi: 'Quỷ Dữ',
    suit: 'major',
    number: 15,
    imageSlug: 'm15',
    uprightMeaning:
      'Ràng buộc tự đặt, cám dỗ vật chất, nghiện hoặc lệ thuộc không lành mạnh.',
    reversedMeaning:
      'Giải thoát khỏi xiềng xích, nhận ra bản thân có quyền cắt đứt.',
  },
  {
    id: 'major-16-tower',
    name: 'The Tower',
    nameVi: 'Tòa Tháp',
    suit: 'major',
    number: 16,
    imageSlug: 'm16',
    uprightMeaning:
      'Biến cố đột ngột, sụp đổ điều giả tạo, sự thật phá tan ảo tưởng.',
    reversedMeaning:
      'Trì hoãn đổ vỡ, sợ thay đổi lớn, biến cố nhỏ báo trước cú lớn.',
  },
  {
    id: 'major-17-star',
    name: 'The Star',
    nameVi: 'Ngôi Sao',
    suit: 'major',
    number: 17,
    imageSlug: 'm17',
    uprightMeaning:
      'Hi vọng phục hồi, niềm tin mới, hướng dẫn từ vũ trụ sau giai đoạn khó.',
    reversedMeaning:
      'Mất phương hướng, bi quan, niềm tin bị lung lay tạm thời.',
  },
  {
    id: 'major-18-moon',
    name: 'The Moon',
    nameVi: 'Mặt Trăng',
    suit: 'major',
    number: 18,
    imageSlug: 'm18',
    uprightMeaning:
      'Ảo ảnh, mơ hồ, nỗi sợ vô thức bộc lộ, cần lắng nghe trực giác.',
    reversedMeaning:
      'Sự thật được hé lộ, sương mù tan, vượt qua nỗi sợ vô căn cứ.',
  },
  {
    id: 'major-19-sun',
    name: 'The Sun',
    nameVi: 'Mặt Trời',
    suit: 'major',
    number: 19,
    imageSlug: 'm19',
    uprightMeaning:
      'Niềm vui rực rỡ, thành công công khai, năng lượng dồi dào và rõ ràng.',
    reversedMeaning:
      'Lạc quan tô vẽ, mây che ánh sáng tạm thời, niềm vui bị trì hoãn.',
  },
  {
    id: 'major-20-judgement',
    name: 'Judgement',
    nameVi: 'Phán Xét',
    suit: 'major',
    number: 20,
    imageSlug: 'm20',
    uprightMeaning:
      'Hồi sinh, gọi mời đến mục đích cao hơn, tha thứ và bước sang trang mới.',
    reversedMeaning:
      'Tự phán xét khắt khe, bỏ lỡ tiếng gọi, sợ nhìn lại quá khứ.',
  },
  {
    id: 'major-21-world',
    name: 'The World',
    nameVi: 'Thế Giới',
    suit: 'major',
    number: 21,
    imageSlug: 'm21',
    uprightMeaning:
      'Hoàn thiện, viên mãn một chu kỳ, đạt đến đích sau hành trình dài.',
    reversedMeaning:
      'Chậm chạp ở chặng cuối, không trọn vẹn, cần đóng gói nốt việc dở dang.',
  },

  // ───────────────────────── CUPS (14 lá) ─────────────────────────
  {
    id: 'cups-01',
    name: 'Ace of Cups',
    nameVi: 'Cốc Át',
    suit: 'cups',
    number: 1,
    imageSlug: 'c01',
    uprightMeaning:
      'Khởi đầu cảm xúc, tình yêu mới, suối nguồn dạt dào trong tâm hồn.',
    reversedMeaning:
      'Cảm xúc bị nén, kết nối tâm linh tắc nghẽn, kìm nén tình cảm.',
  },
  {
    id: 'cups-02',
    name: 'Two of Cups',
    nameVi: 'Cốc Hai',
    suit: 'cups',
    number: 2,
    imageSlug: 'c02',
    uprightMeaning:
      'Kết nối đôi bên, hiểu nhau sâu sắc, hợp tác hoặc tình yêu cân bằng.',
    reversedMeaning:
      'Mất cân bằng trong mối quan hệ, hiểu lầm, chia tách tạm thời.',
  },
  {
    id: 'cups-03',
    name: 'Three of Cups',
    nameVi: 'Cốc Ba',
    suit: 'cups',
    number: 3,
    imageSlug: 'c03',
    uprightMeaning:
      'Tiệc tùng, bạn bè, ăn mừng thành tựu cùng cộng đồng thân thiết.',
    reversedMeaning:
      'Quá đà tiệc tùng, chia rẽ trong nhóm bạn, niềm vui hời hợt.',
  },
  {
    id: 'cups-04',
    name: 'Four of Cups',
    nameVi: 'Cốc Bốn',
    suit: 'cups',
    number: 4,
    imageSlug: 'c04',
    uprightMeaning:
      'Chán nản, mãn nguyện thụ động, bỏ qua cơ hội ngay trước mặt.',
    reversedMeaning:
      'Tỉnh thức trở lại, sẵn sàng nhận cơ hội mới sau giai đoạn buồn chán.',
  },
  {
    id: 'cups-05',
    name: 'Five of Cups',
    nameVi: 'Cốc Năm',
    suit: 'cups',
    number: 5,
    imageSlug: 'c05',
    uprightMeaning:
      'Tiếc nuối, mất mát, đắm trong nỗi buồn nhưng vẫn còn điều quý giá.',
    reversedMeaning:
      'Chấp nhận mất mát, phục hồi, tha thứ và nhìn về phía trước.',
  },
  {
    id: 'cups-06',
    name: 'Six of Cups',
    nameVi: 'Cốc Sáu',
    suit: 'cups',
    number: 6,
    imageSlug: 'c06',
    uprightMeaning:
      'Hoài niệm, kỷ niệm tuổi thơ, gặp lại người cũ hoặc trong sáng nội tâm.',
    reversedMeaning:
      'Mắc kẹt trong quá khứ, không trưởng thành, lý tưởng hóa kỷ niệm.',
  },
  {
    id: 'cups-07',
    name: 'Seven of Cups',
    nameVi: 'Cốc Bảy',
    suit: 'cups',
    number: 7,
    imageSlug: 'c07',
    uprightMeaning:
      'Nhiều lựa chọn hấp dẫn, mơ mộng, dễ choáng ngợp trước cơ hội.',
    reversedMeaning:
      'Quyết định dứt khoát, vượt qua ảo tưởng, ưu tiên rõ ràng.',
  },
  {
    id: 'cups-08',
    name: 'Eight of Cups',
    nameVi: 'Cốc Tám',
    suit: 'cups',
    number: 8,
    imageSlug: 'c08',
    uprightMeaning:
      'Rời bỏ điều không còn nuôi dưỡng, đi tìm ý nghĩa sâu hơn.',
    reversedMeaning:
      'Lưỡng lự ra đi, sợ thay đổi, ở lại nơi đã cạn ý nghĩa.',
  },
  {
    id: 'cups-09',
    name: 'Nine of Cups',
    nameVi: 'Cốc Chín',
    suit: 'cups',
    number: 9,
    imageSlug: 'c09',
    uprightMeaning:
      'Toại nguyện, ước mơ thành hiện thực, hài lòng với điều mình có.',
    reversedMeaning:
      'Niềm vui hời hợt, thỏa mãn vật chất nhưng tâm hồn trống rỗng.',
  },
  {
    id: 'cups-10',
    name: 'Ten of Cups',
    nameVi: 'Cốc Mười',
    suit: 'cups',
    number: 10,
    imageSlug: 'c10',
    uprightMeaning:
      'Gia đình hạnh phúc, hài hòa lâu dài, viên mãn cảm xúc và đoàn tụ.',
    reversedMeaning:
      'Rạn nứt gia đình, kỳ vọng không gặp nhau, mất hài hòa.',
  },
  {
    id: 'cups-11',
    name: 'Page of Cups',
    nameVi: 'Người Hầu Cốc',
    suit: 'cups',
    number: 11,
    imageSlug: 'c11',
    uprightMeaning:
      'Tin tốt tình cảm, sáng tạo non trẻ, mở lòng đón nhận cảm hứng mới.',
    reversedMeaning:
      'Cảm xúc trẻ con, mơ mộng viển vông, từ chối lớn lên về mặt cảm xúc.',
  },
  {
    id: 'cups-12',
    name: 'Knight of Cups',
    nameVi: 'Hiệp Sĩ Cốc',
    suit: 'cups',
    number: 12,
    imageSlug: 'c12',
    uprightMeaning:
      'Đề nghị lãng mạn, theo đuổi lý tưởng, mang đến lời mời trái tim.',
    reversedMeaning:
      'Quá lý tưởng hóa, lời hứa rỗng, mơ tưởng thay vì hành động.',
  },
  {
    id: 'cups-13',
    name: 'Queen of Cups',
    nameVi: 'Nữ Hoàng Cốc',
    suit: 'cups',
    number: 13,
    imageSlug: 'c13',
    uprightMeaning:
      'Đồng cảm sâu, nuôi dưỡng người khác bằng trực giác, ổn định cảm xúc.',
    reversedMeaning:
      'Quá hi sinh, cạn kiệt cảm xúc, ranh giới mong manh hoặc thao túng tình cảm.',
  },
  {
    id: 'cups-14',
    name: 'King of Cups',
    nameVi: 'Vua Cốc',
    suit: 'cups',
    number: 14,
    imageSlug: 'c14',
    uprightMeaning:
      'Chín chắn cảm xúc, ngoại giao khéo léo, ổn định giữa sóng gió.',
    reversedMeaning:
      'Đè nén cảm xúc, lạnh nhạt, thao túng bằng vẻ ngoài điềm tĩnh.',
  },

  // ───────────────────────── SWORDS (14 lá) ─────────────────────────
  {
    id: 'swords-01',
    name: 'Ace of Swords',
    nameVi: 'Kiếm Át',
    suit: 'swords',
    number: 1,
    imageSlug: 's01',
    uprightMeaning:
      'Tỉnh thức trí tuệ, sự thật rõ ràng, đột phá tư duy và chiến thắng tinh thần.',
    reversedMeaning:
      'Tư duy lệch lạc, sự thật bị che giấu, lời nói gây sát thương.',
  },
  {
    id: 'swords-02',
    name: 'Two of Swords',
    nameVi: 'Kiếm Hai',
    suit: 'swords',
    number: 2,
    imageSlug: 's02',
    uprightMeaning:
      'Bế tắc lựa chọn, né tránh quyết định, cân bằng giả tạo bằng cách nhắm mắt.',
    reversedMeaning:
      'Mở mắt nhìn sự thật, đối diện quyết định không thể trì hoãn.',
  },
  {
    id: 'swords-03',
    name: 'Three of Swords',
    nameVi: 'Kiếm Ba',
    suit: 'swords',
    number: 3,
    imageSlug: 's03',
    uprightMeaning:
      'Đau lòng, phản bội, nỗi đau cần thừa nhận để chữa lành.',
    reversedMeaning:
      'Chữa lành dần, học cách buông bỏ, vết thương đóng vảy.',
  },
  {
    id: 'swords-04',
    name: 'Four of Swords',
    nameVi: 'Kiếm Bốn',
    suit: 'swords',
    number: 4,
    imageSlug: 's04',
    uprightMeaning:
      'Nghỉ ngơi, hồi phục sau xung đột, rút lui chiến lược để lấy sức.',
    reversedMeaning:
      'Trì trệ, kiệt sức kéo dài, cần quay lại hành động sau khi đã nghỉ đủ.',
  },
  {
    id: 'swords-05',
    name: 'Five of Swords',
    nameVi: 'Kiếm Năm',
    suit: 'swords',
    number: 5,
    imageSlug: 's05',
    uprightMeaning:
      'Thắng nhưng cô đơn, xung đột để lại tổn thương, được mất phải cân nhắc.',
    reversedMeaning:
      'Hòa giải, học từ thất bại, sẵn sàng buông cuộc chiến vô nghĩa.',
  },
  {
    id: 'swords-06',
    name: 'Six of Swords',
    nameVi: 'Kiếm Sáu',
    suit: 'swords',
    number: 6,
    imageSlug: 's06',
    uprightMeaning:
      'Chuyển dịch sang vùng yên tĩnh, bỏ lại đau thương, đi đến nơi an toàn hơn.',
    reversedMeaning:
      'Kẹt lại nơi cũ, mang theo gánh nặng quá khứ trong hành trình.',
  },
  {
    id: 'swords-07',
    name: 'Seven of Swords',
    nameVi: 'Kiếm Bảy',
    suit: 'swords',
    number: 7,
    imageSlug: 's07',
    uprightMeaning:
      'Lén lút, chiến lược khéo léo, hoặc gian dối — phụ thuộc ngữ cảnh.',
    reversedMeaning:
      'Bại lộ sự lén lút, thú nhận, lấy lại điều đã mất hoặc đối diện hậu quả.',
  },
  {
    id: 'swords-08',
    name: 'Eight of Swords',
    nameVi: 'Kiếm Tám',
    suit: 'swords',
    number: 8,
    imageSlug: 's08',
    uprightMeaning:
      'Tự ràng buộc bằng suy nghĩ, cảm giác bị kẹt mà thật ra có lối ra.',
    reversedMeaning:
      'Mở mắt thoát khỏi xiềng tâm trí, lấy lại quyền tự do của mình.',
  },
  {
    id: 'swords-09',
    name: 'Nine of Swords',
    nameVi: 'Kiếm Chín',
    suit: 'swords',
    number: 9,
    imageSlug: 's09',
    uprightMeaning:
      'Lo âu mất ngủ, ám ảnh ban đêm, nỗi sợ phóng đại thực tế.',
    reversedMeaning:
      'Dần thoát khỏi lo âu, ánh sáng le lói, học cách buông suy nghĩ tiêu cực.',
  },
  {
    id: 'swords-10',
    name: 'Ten of Swords',
    nameVi: 'Kiếm Mười',
    suit: 'swords',
    number: 10,
    imageSlug: 's10',
    uprightMeaning:
      'Tận cùng đáy, kết thúc đau đớn nhưng tất yếu, không thể tệ hơn được nữa.',
    reversedMeaning:
      'Hồi sinh sau cú ngã, học bài học khó, bắt đầu lại từ con số không.',
  },
  {
    id: 'swords-11',
    name: 'Page of Swords',
    nameVi: 'Người Hầu Kiếm',
    suit: 'swords',
    number: 11,
    imageSlug: 's11',
    uprightMeaning:
      'Tò mò, tinh thần học hỏi sắc bén, sẵn sàng vạch ra sự thật.',
    reversedMeaning:
      'Nói nhiều mà thiếu thấu hiểu, tin đồn, hấp tấp phán xét.',
  },
  {
    id: 'swords-12',
    name: 'Knight of Swords',
    nameVi: 'Hiệp Sĩ Kiếm',
    suit: 'swords',
    number: 12,
    imageSlug: 's12',
    uprightMeaning:
      'Hành động quyết liệt, thẳng tiến vì lý tưởng, dồn sức một lần.',
    reversedMeaning:
      'Vội vàng thiếu suy nghĩ, hung hăng gây hậu quả, cần phanh lại.',
  },
  {
    id: 'swords-13',
    name: 'Queen of Swords',
    nameVi: 'Nữ Hoàng Kiếm',
    suit: 'swords',
    number: 13,
    imageSlug: 's13',
    uprightMeaning:
      'Sáng suốt khách quan, độc lập, sự thật được nói ra không né tránh.',
    reversedMeaning:
      'Cay nghiệt, lạnh lùng quá mức, phán xét người khác bằng vết thương cũ.',
  },
  {
    id: 'swords-14',
    name: 'King of Swords',
    nameVi: 'Vua Kiếm',
    suit: 'swords',
    number: 14,
    imageSlug: 's14',
    uprightMeaning:
      'Quyết đoán dựa trên lý trí, công bằng, lãnh đạo bằng tư duy minh bạch.',
    reversedMeaning:
      'Lạm dụng lý lẽ, độc đoán, dùng tri thức để ép buộc người khác.',
  },

  // ───────────────────────── WANDS (14 lá) ─────────────────────────
  {
    id: 'wands-01',
    name: 'Ace of Wands',
    nameVi: 'Gậy Át',
    suit: 'wands',
    number: 1,
    imageSlug: 'w01',
    uprightMeaning:
      'Cảm hứng bùng cháy, khởi đầu dự án mới với năng lượng dồi dào.',
    reversedMeaning:
      'Trì hoãn khởi đầu, cảm hứng tắt ngấm, năng lượng chưa kịp nhen lên.',
  },
  {
    id: 'wands-02',
    name: 'Two of Wands',
    nameVi: 'Gậy Hai',
    suit: 'wands',
    number: 2,
    imageSlug: 'w02',
    uprightMeaning:
      'Lập kế hoạch mở rộng, nhìn ra xa, cân nhắc bước đi tiếp theo táo bạo.',
    reversedMeaning:
      'Sợ rời vùng an toàn, kế hoạch còn ấp ủ, ngần ngại ra quyết định lớn.',
  },
  {
    id: 'wands-03',
    name: 'Three of Wands',
    nameVi: 'Gậy Ba',
    suit: 'wands',
    number: 3,
    imageSlug: 'w03',
    uprightMeaning:
      'Mở rộng tầm nhìn, kết quả ban đầu đến, mở rộng địa bàn hoặc đối tác.',
    reversedMeaning:
      'Trì hoãn kết quả, kế hoạch chậm tiến độ, tầm nhìn thu hẹp.',
  },
  {
    id: 'wands-04',
    name: 'Four of Wands',
    nameVi: 'Gậy Bốn',
    suit: 'wands',
    number: 4,
    imageSlug: 'w04',
    uprightMeaning:
      'Ăn mừng cột mốc, ổn định bến đỗ, lễ hội đoàn tụ và niềm vui gia đình.',
    reversedMeaning:
      'Bất ổn ngôi nhà, lễ hội bị hoãn, xáo trộn trong tổ ấm.',
  },
  {
    id: 'wands-05',
    name: 'Five of Wands',
    nameVi: 'Gậy Năm',
    suit: 'wands',
    number: 5,
    imageSlug: 'w05',
    uprightMeaning:
      'Cạnh tranh, va chạm ý kiến, không khí sôi nổi nhưng còn lộn xộn.',
    reversedMeaning:
      'Hòa giải xung đột, tránh xung đột không cần thiết, đoàn kết trở lại.',
  },
  {
    id: 'wands-06',
    name: 'Six of Wands',
    nameVi: 'Gậy Sáu',
    suit: 'wands',
    number: 6,
    imageSlug: 'w06',
    uprightMeaning:
      'Thành công công khai, được công nhận, vinh quang sau nỗ lực.',
    reversedMeaning:
      'Mất vinh quang, tự mãn quá đà hoặc thành tựu không được ghi nhận.',
  },
  {
    id: 'wands-07',
    name: 'Seven of Wands',
    nameVi: 'Gậy Bảy',
    suit: 'wands',
    number: 7,
    imageSlug: 'w07',
    uprightMeaning:
      'Giữ vững lập trường trước thử thách, bảo vệ điều mình đã gây dựng.',
    reversedMeaning:
      'Quá tải, kiệt sức phòng thủ, áp lực vượt quá khả năng chống đỡ.',
  },
  {
    id: 'wands-08',
    name: 'Eight of Wands',
    nameVi: 'Gậy Tám',
    suit: 'wands',
    number: 8,
    imageSlug: 'w08',
    uprightMeaning:
      'Mọi việc tiến nhanh, tin tức dồn dập, hành động đồng loạt đúng hướng.',
    reversedMeaning:
      'Chậm trễ, trục trặc thông tin, kế hoạch bị ngắt quãng.',
  },
  {
    id: 'wands-09',
    name: 'Nine of Wands',
    nameVi: 'Gậy Chín',
    suit: 'wands',
    number: 9,
    imageSlug: 'w09',
    uprightMeaning:
      'Kiên cường ở chặng cuối, mệt nhưng không bỏ cuộc, đề phòng nhưng vẫn đứng vững.',
    reversedMeaning:
      'Hoang tưởng phòng thủ, kiệt quệ, từ chối nhận giúp đỡ đúng lúc.',
  },
  {
    id: 'wands-10',
    name: 'Ten of Wands',
    nameVi: 'Gậy Mười',
    suit: 'wands',
    number: 10,
    imageSlug: 'w10',
    uprightMeaning:
      'Gánh vác nặng, trách nhiệm dồn, cận đích nhưng cần san sẻ.',
    reversedMeaning:
      'Buông gánh, từ chối ôm thêm, giải tỏa sau giai đoạn gồng mình.',
  },
  {
    id: 'wands-11',
    name: 'Page of Wands',
    nameVi: 'Người Hầu Gậy',
    suit: 'wands',
    number: 11,
    imageSlug: 'w11',
    uprightMeaning:
      'Hứng khởi khám phá, dự án mới đang ấp ủ, tin nhắn báo cơ hội.',
    reversedMeaning:
      'Hứng khởi vụt tắt, dự án dang dở, thiếu hướng đi rõ ràng.',
  },
  {
    id: 'wands-12',
    name: 'Knight of Wands',
    nameVi: 'Hiệp Sĩ Gậy',
    suit: 'wands',
    number: 12,
    imageSlug: 'w12',
    uprightMeaning:
      'Đam mê hành động, lao về phía trước với nhiệt huyết, dấn thân vào hành trình.',
    reversedMeaning:
      'Bốc đồng, chưa nghĩ đã làm, đam mê tiêu hao mục tiêu.',
  },
  {
    id: 'wands-13',
    name: 'Queen of Wands',
    nameVi: 'Nữ Hoàng Gậy',
    suit: 'wands',
    number: 13,
    imageSlug: 'w13',
    uprightMeaning:
      'Tự tin, sức cuốn hút, lãnh đạo bằng nhiệt huyết và sự ấm áp.',
    reversedMeaning:
      'Ghen tị, đòi hỏi sự chú ý, tự tin chuyển thành kiêu ngạo.',
  },
  {
    id: 'wands-14',
    name: 'King of Wands',
    nameVi: 'Vua Gậy',
    suit: 'wands',
    number: 14,
    imageSlug: 'w14',
    uprightMeaning:
      'Tầm nhìn rộng, lãnh đạo có tầm, biến ý tưởng lớn thành thực tiễn.',
    reversedMeaning:
      'Độc đoán, kỳ vọng quá cao, lãnh đạo bằng tham vọng cá nhân thiếu lắng nghe.',
  },

  // ───────────────────────── PENTACLES (14 lá) ─────────────────────────
  {
    id: 'pentacles-01',
    name: 'Ace of Pentacles',
    nameVi: 'Tiền Át',
    suit: 'pentacles',
    number: 1,
    imageSlug: 'p01',
    uprightMeaning:
      'Cơ hội vật chất mới, hạt giống thịnh vượng, nền tảng tài chính được gieo.',
    reversedMeaning:
      'Cơ hội bị bỏ lỡ, đầu tư sai chỗ, nền tảng tài chính bấp bênh.',
  },
  {
    id: 'pentacles-02',
    name: 'Two of Pentacles',
    nameVi: 'Tiền Hai',
    suit: 'pentacles',
    number: 2,
    imageSlug: 'p02',
    uprightMeaning:
      'Cân đối giữa hai mặt, linh hoạt thích nghi, tung hứng nhiều ưu tiên cùng lúc.',
    reversedMeaning:
      'Mất thăng bằng, quá tải, cần buông bớt một việc để giữ chất lượng.',
  },
  {
    id: 'pentacles-03',
    name: 'Three of Pentacles',
    nameVi: 'Tiền Ba',
    suit: 'pentacles',
    number: 3,
    imageSlug: 'p03',
    uprightMeaning:
      'Hợp tác chuyên môn, mỗi người đóng vai trò riêng, công việc tinh xảo dần thành hình.',
    reversedMeaning:
      'Phối hợp kém, kỹ năng chưa đủ, công việc nhóm gặp trục trặc.',
  },
  {
    id: 'pentacles-04',
    name: 'Four of Pentacles',
    nameVi: 'Tiền Bốn',
    suit: 'pentacles',
    number: 4,
    imageSlug: 'p04',
    uprightMeaning:
      'Tiết kiệm bảo thủ, giữ chặt tài sản, ổn định nhờ tính toán cẩn thận.',
    reversedMeaning:
      'Keo kiệt, sợ mất mát, hoặc ngược lại — buông tay tiêu xài bốc đồng.',
  },
  {
    id: 'pentacles-05',
    name: 'Five of Pentacles',
    nameVi: 'Tiền Năm',
    suit: 'pentacles',
    number: 5,
    imageSlug: 'p05',
    uprightMeaning:
      'Khó khăn vật chất, cảm giác bị bỏ rơi, nhưng nơi nương tựa đang ở gần.',
    reversedMeaning:
      'Hồi phục tài chính, nhận ra sự giúp đỡ, vượt qua giai đoạn thiếu thốn.',
  },
  {
    id: 'pentacles-06',
    name: 'Six of Pentacles',
    nameVi: 'Tiền Sáu',
    suit: 'pentacles',
    number: 6,
    imageSlug: 'p06',
    uprightMeaning:
      'Cho và nhận cân bằng, lòng hảo tâm, dòng chảy tài chính đến đúng người.',
    reversedMeaning:
      'Mất cân bằng cho-nhận, hảo tâm có điều kiện, lệ thuộc tài chính.',
  },
  {
    id: 'pentacles-07',
    name: 'Seven of Pentacles',
    nameVi: 'Tiền Bảy',
    suit: 'pentacles',
    number: 7,
    imageSlug: 'p07',
    uprightMeaning:
      'Kiên nhẫn chờ kết quả, đánh giá đầu tư đã gieo, gặt hái còn ở phía trước.',
    reversedMeaning:
      'Mất kiên nhẫn, hoài nghi công sức đã bỏ ra, lo lắng kết quả không xứng.',
  },
  {
    id: 'pentacles-08',
    name: 'Eight of Pentacles',
    nameVi: 'Tiền Tám',
    suit: 'pentacles',
    number: 8,
    imageSlug: 'p08',
    uprightMeaning:
      'Mài giũa tay nghề, chăm chỉ học hỏi, công việc tỉ mỉ đem lại uy tín.',
    reversedMeaning:
      'Cẩu thả, làm cho có, mất hứng với chuyên môn cần mài.',
  },
  {
    id: 'pentacles-09',
    name: 'Nine of Pentacles',
    nameVi: 'Tiền Chín',
    suit: 'pentacles',
    number: 9,
    imageSlug: 'p09',
    uprightMeaning:
      'Tự lập tài chính, thưởng thức thành quả, sự sung túc đến từ kỷ luật.',
    reversedMeaning:
      'Phụ thuộc tài chính, làm việc quá sức, không kịp tận hưởng kết quả.',
  },
  {
    id: 'pentacles-10',
    name: 'Ten of Pentacles',
    nameVi: 'Tiền Mười',
    suit: 'pentacles',
    number: 10,
    imageSlug: 'p10',
    uprightMeaning:
      'Tài sản dòng họ, ổn định lâu dài, di sản truyền lại cho thế hệ sau.',
    reversedMeaning:
      'Tranh chấp gia sản, gia đình rạn nứt vì tài chính, di sản tan rã.',
  },
  {
    id: 'pentacles-11',
    name: 'Page of Pentacles',
    nameVi: 'Người Hầu Tiền',
    suit: 'pentacles',
    number: 11,
    imageSlug: 'p11',
    uprightMeaning:
      'Học hỏi điều thực tế, tin tốt về công việc / tài chính, ấp ủ kế hoạch dài hạn.',
    reversedMeaning:
      'Học hời hợt, thiếu nghiêm túc với tài chính, kế hoạch còn trên giấy.',
  },
  {
    id: 'pentacles-12',
    name: 'Knight of Pentacles',
    nameVi: 'Hiệp Sĩ Tiền',
    suit: 'pentacles',
    number: 12,
    imageSlug: 'p12',
    uprightMeaning:
      'Cần mẫn bền bỉ, tiến chậm mà chắc, đáng tin cậy trong cam kết dài hạn.',
    reversedMeaning:
      'Cứng nhắc, lười nhác, công việc trì trệ vì thiếu linh hoạt.',
  },
  {
    id: 'pentacles-13',
    name: 'Queen of Pentacles',
    nameVi: 'Nữ Hoàng Tiền',
    suit: 'pentacles',
    number: 13,
    imageSlug: 'p13',
    uprightMeaning:
      'Nuôi dưỡng vật chất và tinh thần, ổn định gia đạo, quản lý tài chính tinh tế.',
    reversedMeaning:
      'Quá quan tâm vật chất, bỏ bê bản thân, mất cân bằng công việc - gia đình.',
  },
  {
    id: 'pentacles-14',
    name: 'King of Pentacles',
    nameVi: 'Vua Tiền',
    suit: 'pentacles',
    number: 14,
    imageSlug: 'p14',
    uprightMeaning:
      'Giàu có vững chắc, quản lý đế chế tài chính, hào phóng có tầm nhìn.',
    reversedMeaning:
      'Tham lam, ám ảnh vật chất, kiểm soát người khác qua tài chính.',
  },
];

if (TAROT_DECK.length !== 78) {
  // Compile-time guard — nếu thiếu/dư lá, fail sớm khi import.
  throw new Error(`TAROT_DECK phải có 78 lá, hiện có ${TAROT_DECK.length}`);
}
