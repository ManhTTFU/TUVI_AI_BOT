export type Service = {
  key: string;
  title: string;
  sub: string;
  glyph: string;
  /** Route nội bộ. Để trống nếu chưa có page → render coming soon. */
  href?: string;
  comingSoon?: boolean;
};

export type Zodiac = {
  name: string;
  en: string;
  glyph: string;
  hours: string;
  years: string;
  ratings: [number, number, number, number];
  lucky: string;
  num: number;
  fortune: string;
};

import { ALL_SIGNS_VI } from './horoscope-lib';

export type Horoscope = {
  name: string;
  en: string;
  sym: string;
  el: string;
  range: string;
};

export type LucDieu = {
  hour: string;
  chi: string;
  name: string;
  short: string;
  icon: string;
};

export type LucDieuTone = { fg: string; bg: string };

export type Article = {
  tag: string;
  title: string;
  read: string;
};

export type TarotCard = {
  id: number;
  num: string;
  name: string;
  vn: string;
  keywords: string[];
  past: string;
  present: string;
  future: string;
};

export const SERVICES: Service[] = [
  { key: 'tuvi', title: 'Tử Vi Trọn Đời', sub: 'Lá số 12 cung — luận giải vận trình', glyph: '紫微', href: '/xem-tu-vi' },
  { key: 'tutru', title: 'Tứ Trụ — Bát Tự', sub: 'Năm Tháng Ngày Giờ — Ngũ hành sinh khắc', glyph: '四柱', href: '/tu-tru-bat-tu' },
  { key: 'xemngay', title: 'Xem Ngày Vạn Sự', sub: 'Hoàng đạo, hắc đạo, giờ tốt giờ xấu', glyph: '擇日', href: '/ngay-tot' },
  { key: 'tarot', title: 'Bói Bài Tarot', sub: 'Trải bài 3 lá — Quá khứ, Hiện tại, Tương lai', glyph: '塔羅', comingSoon: true },
  { key: 'phongthuy', title: 'Phong Thủy Bát Trạch', sub: 'Hướng nhà, hướng giường, bài trí nội thất', glyph: '風水', comingSoon: true },
  { key: 'xemtuong', title: 'Xem Tướng — Chỉ Tay', sub: 'Khuôn mặt, lòng bàn tay, dáng đi', glyph: '相術', comingSoon: true },
  { key: 'gieoque', title: 'Gieo Quẻ Dịch Số', sub: 'Mai Hoa, Kinh Dịch, Quan Âm Linh Quẻ', glyph: '易經', comingSoon: true },
  { key: 'duyenso', title: 'Duyên Số Vợ Chồng', sub: 'Diễn Cầm Tam Thế — xem tuổi đôi lứa', glyph: '姻緣', comingSoon: true },
];

export const ZODIAC: Zodiac[] = [
  { name: 'Tý', en: 'Chuột', glyph: '🐭', hours: '23h–01h', years: '1984, 1996, 2008, 2020', ratings: [4, 3, 4, 5], lucky: 'Hồng', num: 6, fortune: 'Quý nhân phù trợ, công việc thuận lợi. Tránh tranh chấp về tiền bạc với người thân.' },
  { name: 'Sửu', en: 'Trâu', glyph: '🐂', hours: '01h–03h', years: '1985, 1997, 2009, 2021', ratings: [3, 4, 3, 4], lucky: 'Vàng', num: 1, fortune: 'Tài lộc khởi sắc nhờ một mối quan hệ cũ. Sức khỏe cần chú ý cột sống.' },
  { name: 'Dần', en: 'Hổ', glyph: '🐯', hours: '03h–05h', years: '1986, 1998, 2010, 2022', ratings: [5, 4, 5, 3], lucky: 'Đỏ', num: 3, fortune: 'Vận đào hoa nở rộ. Người độc thân có thể gặp người trong mơ.' },
  { name: 'Mão', en: 'Mèo', glyph: '🐰', hours: '05h–07h', years: '1987, 1999, 2011, 2023', ratings: [4, 3, 4, 4], lucky: 'Xanh', num: 4, fortune: 'Một dự án ấp ủ lâu sẽ có tin vui. Đừng lo lắng quá về điều chưa xảy ra.' },
  { name: 'Thìn', en: 'Rồng', glyph: '🐲', hours: '07h–09h', years: '1988, 2000, 2012, 2024', ratings: [5, 5, 4, 4], lucky: 'Vàng', num: 8, fortune: 'Vận may bất ngờ. Một cuộc gặp gỡ sẽ mở ra cánh cửa mới trong sự nghiệp.' },
  { name: 'Tỵ', en: 'Rắn', glyph: '🐍', hours: '09h–11h', years: '1989, 2001, 2013, 2025', ratings: [4, 4, 3, 3], lucky: 'Tím', num: 7, fortune: 'Trí tuệ sắc bén, ý tưởng tuôn trào. Hãy ghi chép lại tất cả linh cảm.' },
  { name: 'Ngọ', en: 'Ngựa', glyph: '🐴', hours: '11h–13h', years: '1990, 2002, 2014, 2026', ratings: [4, 3, 5, 4], lucky: 'Cam', num: 9, fortune: 'Năng lượng dồi dào, thích hợp khởi sự. Cẩn trọng giao thông xa.' },
  { name: 'Mùi', en: 'Dê', glyph: '🐐', hours: '13h–15h', years: '1991, 2003, 2015, 2027', ratings: [3, 4, 4, 5], lucky: 'Be', num: 2, fortune: 'Gia đạo êm ấm. Một người thân lâu không gặp sẽ tìm đến.' },
  { name: 'Thân', en: 'Khỉ', glyph: '🐵', hours: '15h–17h', years: '1992, 2004, 2016, 2028', ratings: [3, 3, 3, 4], lucky: 'Lam', num: 5, fortune: 'Cần khôn khéo trong giao tiếp. Đừng vội phán xét lời nói của đồng nghiệp.' },
  { name: 'Dậu', en: 'Gà', glyph: '🐔', hours: '17h–19h', years: '1993, 2005, 2017, 2029', ratings: [4, 4, 3, 3], lucky: 'Trắng', num: 4, fortune: 'Tài chính ổn định nhưng nên tiết chế chi tiêu. Sức khỏe tinh thần cần nghỉ ngơi.' },
  { name: 'Tuất', en: 'Chó', glyph: '🐶', hours: '19h–21h', years: '1994, 2006, 2018, 2030', ratings: [5, 4, 4, 5], lucky: 'Nâu', num: 1, fortune: 'Lòng trung thành được đền đáp. Một người sẽ đứng về phía bạn khi bạn cần nhất.' },
  { name: 'Hợi', en: 'Lợn', glyph: '🐷', hours: '21h–23h', years: '1995, 2007, 2019, 2031', ratings: [4, 5, 4, 4], lucky: 'Hồng', num: 6, fortune: 'Tận hưởng phước lành đang có. Đừng so sánh đời mình với mạng xã hội.' },
];

// Daily reading text được sinh runtime từ Deepseek qua /api/horoscope/daily
// (cache 1 lần/ngày). HOROSCOPE chỉ giữ metadata; UI cần dùng
// `useDailyHoroscope()` để lấy text — không có fallback hardcoded.
export const HOROSCOPE: Horoscope[] = ALL_SIGNS_VI.map((s) => ({
  name: s.name,
  en: s.en,
  sym: s.sym,
  el: s.el,
  range: s.range,
}));

export const LUC_DIEU: LucDieu[] = [
  { hour: '23:00–01:00', chi: 'Giờ Tý', name: 'Xích Khẩu', short: 'Tránh tranh cãi, khẩu thiệt', icon: '⚠' },
  { hour: '01:00–03:00', chi: 'Giờ Sửu', name: 'Tiểu Cát', short: 'Cát lành nhỏ, thuận lợi vừa phải', icon: '☆' },
  { hour: '03:00–05:00', chi: 'Giờ Dần', name: 'Không Vong', short: 'Mọi việc hư không, nên tránh hành', icon: '⊘' },
  { hour: '05:00–07:00', chi: 'Giờ Mão', name: 'Đại An', short: 'Bình an, mọi việc thuận lợi', icon: '♡' },
  { hour: '07:00–09:00', chi: 'Giờ Thìn', name: 'Lưu Niên', short: 'Trì hoãn, cần kiên nhẫn chờ đợi', icon: '⧗' },
  { hour: '09:00–11:00', chi: 'Giờ Tỵ', name: 'Tốc Hỷ', short: 'Vui mừng nhanh, xuất hành tốt', icon: '✦' },
  { hour: '11:00–13:00', chi: 'Giờ Ngọ', name: 'Xích Khẩu', short: 'Tránh tranh cãi, khẩu thiệt', icon: '⚠' },
  { hour: '13:00–15:00', chi: 'Giờ Mùi', name: 'Tiểu Cát', short: 'Cát lành nhỏ, thuận lợi vừa phải', icon: '☆' },
  { hour: '15:00–17:00', chi: 'Giờ Thân', name: 'Không Vong', short: 'Mọi việc hư không, nên tránh hành', icon: '⊘' },
  { hour: '17:00–19:00', chi: 'Giờ Dậu', name: 'Đại An', short: 'Bình an, mọi việc thuận lợi', icon: '♡' },
  { hour: '19:00–21:00', chi: 'Giờ Tuất', name: 'Lưu Niên', short: 'Trì hoãn, cần kiên nhẫn chờ đợi', icon: '⧗' },
  { hour: '21:00–23:00', chi: 'Giờ Hợi', name: 'Tốc Hỷ', short: 'Vui mừng nhanh, xuất hành tốt', icon: '✦' },
];

export const LUC_DIEU_TONE: Record<string, LucDieuTone> = {
  'Xích Khẩu': { fg: '#c8361d', bg: '#c8361d0d' },
  'Tiểu Cát': { fg: '#c89146', bg: '#c891460d' },
  'Không Vong': { fg: '#0f0a08', bg: '#0f0a080d' },
  'Đại An': { fg: '#5e7a4a', bg: '#5e7a4a0d' },
  'Lưu Niên': { fg: '#7a5a8a', bg: '#7a5a8a0d' },
  'Tốc Hỷ': { fg: '#3a8a5e', bg: '#3a8a5e0d' },
};

export const ARTICLES: Article[] = [
  { tag: 'Tử Vi', title: 'Cách Cục Tử Vi Bính Ngọ 2026 — Năm bản lề của thập kỷ', read: '12 phút' },
  { tag: 'Tarot', title: 'Hiểu lá The Tower: khi Tòa Tháp đổ là phước lành', read: '8 phút' },
  { tag: 'Phong Thủy', title: 'Bố trí phòng ngủ đón Tài — 7 nguyên tắc cổ truyền', read: '6 phút' },
  { tag: 'Bát Tự', title: 'Đọc Thiên Can Địa Chi — bước đầu hiểu lá Tứ Trụ', read: '15 phút' },
  { tag: 'Tâm Linh', title: 'Đêm Trừ Tịch và những điều nên làm trước Giao Thừa', read: '5 phút' },
  { tag: 'Xem Ngày', title: 'Ngày Tam Nương — sự thật ít người biết', read: '9 phút' },
];

export const TAROT_DECK: TarotCard[] = [
  { id: 0, num: '0', name: 'The Fool', vn: 'Kẻ Khờ', keywords: ['Khởi đầu', 'Hồn nhiên', 'Phiêu lưu'], past: 'Một quyết định bồng bột trong quá khứ đã đưa bạn rẽ sang một ngã đường mới — đáng lẽ bạn phải biết ơn vì sự ngây thơ ấy.', present: 'Vũ trụ đang mời bạn bước một bước đầu tiên. Đừng tính toán quá nhiều, hãy tin vào trực giác.', future: 'Một hành trình tươi mới đang chờ. Hành trang nhẹ, lòng nhẹ — đó là tất cả những gì bạn cần.' },
  { id: 1, num: 'I', name: 'The Magician', vn: 'Pháp Sư', keywords: ['Ý chí', 'Sáng tạo', 'Quyền năng'], past: 'Bạn đã từng có đủ công cụ để biến điều mình muốn thành hiện thực — và bạn đã làm được hơn cả mong đợi.', present: 'Tất cả nguyên tố đang hội tụ trong tay bạn. Đây là lúc biến ý nghĩ thành hành động.', future: 'Một dự án bạn ấp ủ sẽ thành hình rõ rệt — nếu bạn dám tuyên ngôn nó ra thành lời.' },
  { id: 2, num: 'II', name: 'The High Priestess', vn: 'Nữ Tư Tế', keywords: ['Trực giác', 'Bí ẩn', 'Nội tâm'], past: 'Có một bí mật trong quá khứ mà chỉ riêng bạn biết — nó đã hình thành nên con người bạn hôm nay.', present: 'Câu trả lời không nằm bên ngoài. Hãy lắng tai nghe giấc mơ và những điềm báo nhỏ.', future: 'Một sự thật ẩn giấu sẽ hé lộ. Hãy giữ tâm tĩnh để đón nhận nó.' },
  { id: 3, num: 'III', name: 'The Empress', vn: 'Nữ Hoàng', keywords: ['Phong nhiêu', 'Yêu thương', 'Sáng tạo'], past: 'Bạn đã được nuôi dưỡng bởi một tình thương lớn — dù không phải lúc nào bạn cũng nhận ra.', present: 'Đời đang trải hoa dưới chân bạn. Cho phép mình tận hưởng vẻ đẹp và sự dịu dàng.', future: 'Một thành quả ngọt ngào đang chín. Có thể là tình yêu, có thể là một đứa con tinh thần.' },
  { id: 4, num: 'IV', name: 'The Emperor', vn: 'Hoàng Đế', keywords: ['Quyền lực', 'Trật tự', 'Cấu trúc'], past: 'Một người đàn ông quyền uy — hoặc chính bạn — đã đặt nền móng cho mọi điều đang diễn ra.', present: 'Đã đến lúc đứng thẳng và nắm quyền điều khiển cuộc đời mình. Kỷ luật là cánh cửa.', future: 'Bạn sẽ được trao một vị trí lãnh đạo. Hãy lãnh đạo bằng trí tuệ chứ không bằng cái tôi.' },
  { id: 5, num: 'V', name: 'The Hierophant', vn: 'Giáo Hoàng', keywords: ['Truyền thống', 'Chỉ dẫn', 'Tâm linh'], past: 'Một người thầy hoặc một quy tắc gia đình đã định hình giá trị sống của bạn.', present: 'Hãy tham vấn người dày dạn kinh nghiệm trước khi tự mình quyết định.', future: 'Một nghi thức quan trọng đang đến — đám cưới, lễ nhập học, một lời thề.' },
  { id: 6, num: 'VI', name: 'The Lovers', vn: 'Tình Nhân', keywords: ['Tình yêu', 'Lựa chọn', 'Hòa hợp'], past: 'Một mối quan hệ đã dạy bạn ý nghĩa thực sự của sự đồng điệu.', present: 'Bạn đang đứng trước một lựa chọn của con tim. Hãy chọn theo giá trị, đừng chọn theo nỗi sợ.', future: 'Một sự kết nối linh hồn đang đến gần — có thể là người yêu, có thể là tri kỷ.' },
  { id: 7, num: 'VII', name: 'The Chariot', vn: 'Cỗ Xe', keywords: ['Chiến thắng', 'Ý chí', 'Tiến tới'], past: 'Bạn đã vượt qua một thử thách lớn nhờ vào sự kiên định không lay chuyển.', present: 'Hai luồng năng lượng đối nghịch trong bạn cần được điều khiển bằng cùng một dây cương.', future: 'Một chiến thắng vang dội đang chờ — nhưng chỉ khi bạn không bỏ cuộc giữa chừng.' },
  { id: 8, num: 'VIII', name: 'Strength', vn: 'Sức Mạnh', keywords: ['Dũng cảm', 'Nhẫn nại', 'Nội lực'], past: 'Bạn đã thuần phục được một con thú hoang trong chính mình — cơn giận, nỗi đau, hoặc một thói quen xấu.', present: 'Sức mạnh thực sự không nằm ở vũ lực mà ở sự dịu dàng kiên định.', future: 'Bạn sẽ được thử thách lòng can đảm. Hãy đáp lại bằng nụ cười, không phải nắm đấm.' },
  { id: 9, num: 'IX', name: 'The Hermit', vn: 'Ẩn Sĩ', keywords: ['Nội quan', 'Chiêm nghiệm', 'Cô tịch'], past: 'Một giai đoạn tĩnh lặng đã dạy bạn cách lắng nghe chính mình.', present: 'Hãy bước ra khỏi tiếng ồn. Câu trả lời chỉ đến khi bạn đủ yên.', future: 'Một người dẫn đường lớn tuổi sẽ xuất hiện — hoặc chính bạn sẽ trở thành người đó.' },
  { id: 10, num: 'X', name: 'Wheel of Fortune', vn: 'Bánh Xe Vận Mệnh', keywords: ['Chu kỳ', 'May mắn', 'Thay đổi'], past: 'Một bước ngoặt bất ngờ đã đưa bạn đến đây — tốt hay xấu, đều có lý do.', present: 'Bánh xe đang quay. Điều bạn cần không phải là chống lại nó mà là cưỡi lên nó.', future: 'Một cơ hội may mắn đang xoay đến phía bạn. Hãy nắm bắt nhanh, đừng do dự.' },
  { id: 11, num: 'XI', name: 'Justice', vn: 'Công Lý', keywords: ['Cân bằng', 'Sự thật', 'Nhân quả'], past: 'Một quyết định công bằng — hoặc bất công — trong quá khứ vẫn đang vọng lại.', present: 'Hãy xem xét sự việc bằng cái đầu lạnh và trái tim ấm. Đừng nghiêng về một bên.', future: 'Một phán quyết sẽ được đưa ra — và nó sẽ đúng như những gì bạn đã gieo.' },
  { id: 12, num: 'XII', name: 'The Hanged Man', vn: 'Người Treo Ngược', keywords: ['Buông bỏ', 'Góc nhìn mới', 'Hy sinh'], past: 'Bạn đã từng phải dừng lại — và sự dừng lại đó hóa ra là món quà.', present: 'Đừng cố vùng vẫy. Hãy thử nhìn cuộc đời từ một tư thế khác.', future: 'Bạn sẽ phải hy sinh một thứ nhỏ để được một thứ lớn. Việc đó đáng giá.' },
  { id: 13, num: 'XIII', name: 'Death', vn: 'Cái Chết', keywords: ['Kết thúc', 'Tái sinh', 'Chuyển hóa'], past: 'Một chương đã đóng lại — dù bạn đã khóc, đó là một phước lành.', present: 'Hãy buông bỏ điều đã hết hạn. Cái chết của một thứ là sự sinh ra của thứ khác.', future: 'Một sự tái sinh sâu sắc đang đến. Bạn sẽ không còn là người cũ — và đó là điều tuyệt vời.' },
  { id: 14, num: 'XIV', name: 'Temperance', vn: 'Tiết Độ', keywords: ['Hài hòa', 'Pha trộn', 'Kiên nhẫn'], past: 'Sự kiên nhẫn của bạn trong quá khứ đã pha chế nên một thứ rượu quý.', present: 'Vạn vật cần thời gian để chín. Đừng nóng vội đổ thêm gia vị.', future: 'Một sự cân bằng tuyệt vời sẽ đến trong các mối quan hệ và sức khỏe.' },
  { id: 15, num: 'XV', name: 'The Devil', vn: 'Quỷ Dữ', keywords: ['Ràng buộc', 'Cám dỗ', 'Nhận thức'], past: 'Bạn đã từng bị xích vào một thói quen, một mối quan hệ, hoặc một nỗi sợ.', present: 'Sợi xích bạn đang đeo thực ra rất lỏng — bạn chỉ cần dám tháo nó ra.', future: 'Một sự cám dỗ lớn sẽ thử thách bạn. Hãy nhớ: tự do quan trọng hơn khoái lạc tức thời.' },
  { id: 16, num: 'XVI', name: 'The Tower', vn: 'Tòa Tháp', keywords: ['Sụp đổ', 'Thức tỉnh', 'Giải phóng'], past: 'Một biến cố lớn đã san phẳng nền móng cũ — và đó lại là điều bạn cần.', present: 'Mọi thứ đang đổ vỡ không phải để hại bạn mà để cứu bạn khỏi cái giả.', future: 'Một sự thật bất ngờ sẽ làm rung chuyển hiện trạng. Đừng sợ — đất sẽ vững hơn sau đó.' },
  { id: 17, num: 'XVII', name: 'The Star', vn: 'Ngôi Sao', keywords: ['Hy vọng', 'Cảm hứng', 'Chữa lành'], past: 'Sau cơn bão, một tia sáng nhỏ đã giữ bạn không chìm.', present: 'Hãy tin vào ngôi sao của riêng mình. Vũ trụ đang dõi theo bạn.', future: 'Một giai đoạn chữa lành và tràn đầy cảm hứng đang mở ra. Hãy nuôi dưỡng giấc mơ.' },
  { id: 18, num: 'XVIII', name: 'The Moon', vn: 'Mặt Trăng', keywords: ['Ảo ảnh', 'Mơ hồ', 'Tiềm thức'], past: 'Có những điều trong quá khứ chưa từng được rọi sáng — chúng vẫn còn lay động bạn.', present: 'Đừng tin tất cả những gì mắt thấy. Bóng tối đang đùa giỡn với trí tưởng tượng của bạn.', future: 'Một giai đoạn mơ hồ sẽ qua. Hãy giữ vững lý trí, ánh trăng rồi cũng sẽ tan.' },
  { id: 19, num: 'XIX', name: 'The Sun', vn: 'Mặt Trời', keywords: ['Niềm vui', 'Thành công', 'Sức sống'], past: 'Một khoảnh khắc rực rỡ trong quá khứ vẫn đang sưởi ấm bạn cho đến hôm nay.', present: 'Hôm nay là một ngày tươi sáng. Hãy bước ra ngoài, để mặt trời chạm vào da bạn.', future: 'Một giai đoạn thành công, hạnh phúc và sáng tạo đang chờ — bạn xứng đáng với nó.' },
  { id: 20, num: 'XX', name: 'Judgement', vn: 'Phán Xét', keywords: ['Thức tỉnh', 'Tha thứ', 'Tái sinh'], past: 'Một tiếng gọi nội tâm đã đưa bạn đến với con đường hiện tại.', present: 'Đã đến lúc tha thứ — cho người khác và cho chính bạn. Quá khứ đã đủ rồi.', future: 'Bạn sẽ được gọi tên cho một sứ mệnh lớn hơn. Hãy đáp lời.' },
  { id: 21, num: 'XXI', name: 'The World', vn: 'Thế Giới', keywords: ['Hoàn tất', 'Thành tựu', 'Trọn vẹn'], past: 'Một chu kỳ dài đã khép trọn vẹn. Bạn đã đi đủ xa.', present: 'Bạn đang ở đỉnh của một hành trình. Hãy đứng đó và nhìn lại với lòng biết ơn.', future: 'Một thành tựu lớn đang chờ được chính thức công nhận. Thế giới sẽ vỗ tay.' },
];
