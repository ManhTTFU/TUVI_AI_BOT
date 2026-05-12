export function formatVnd(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

/**
 * Sinh bank ref unique 5 ký tự alphanumeric uppercase.
 * VD: "K3X72" — ngắn để user dễ ghi vào nội dung CK + dễ đọc qua điện thoại.
 * 36^5 = 60M tổ hợp, đủ thưa để collision negligible với số pending tx thực tế.
 * Nếu cực hiếm trùng → unique constraint DB throw, caller có thể retry.
 *
 * `prefix` arg giữ lại để không phá API cũ; hiện tại không dùng.
 */
export function makeBankRef(_prefix?: string): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-2);
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3).padEnd(3, '0');
  return `${ts}${rand}`;
}
