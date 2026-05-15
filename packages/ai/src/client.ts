// Deepseek expose một REST API tương thích với OpenAI Chat Completions,
// nên ta tái sử dụng gói `openai` làm HTTP client thay vì viết fetch thủ công.
// Ở đây `OpenAI` chỉ là lớp HTTP — không hề gọi về api.openai.com vì ta
// override `baseURL` sang https://api.deepseek.com. Alias `DeepseekClient`
// giúp phần còn lại của codebase đọc đúng ý đồ: đây là client của Deepseek.
import OpenAI from 'openai';

export type DeepseekClient = OpenAI;

// Không dùng singleton — CF Workers chạy nhiều request cùng isolate, I/O object
// (bao gồm fetch binding) không thể share giữa các request context khác nhau.
// OpenAI constructor rẻ (chỉ set properties), tạo mới mỗi call là ổn.
export function getDeepseekClient(): DeepseekClient {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY chưa được cấu hình trong .env');
  }
  // Arrow function thay vì .bind() — globalThis.fetch được lookup lúc gọi,
  // không bị capture vào context của request đầu tiên.
  return new OpenAI({
    apiKey,
    baseURL,
    fetch: ((...args: Parameters<typeof fetch>) => globalThis.fetch(...args)) as any,
  });
}

export function getDeepseekModel(): string {
  return process.env.DEEPSEEK_MODEL || 'deepseek-chat';
}
