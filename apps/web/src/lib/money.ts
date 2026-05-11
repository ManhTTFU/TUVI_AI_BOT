export function formatVnd(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

/**
 * Sinh bank ref unique theo prefix + timestamp + random.
 * VD: "VTV12K3X7" — đủ random để không trùng, ngắn để user dễ ghi vào nội dung CK.
 */
export function makeBankRef(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `${prefix}${ts}${rand}`;
}
