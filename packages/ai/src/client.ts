// Deepseek expose một REST API tương thích với OpenAI Chat Completions,
// nên ta tái sử dụng gói `openai` làm HTTP client thay vì viết fetch thủ công.
// Ở đây `OpenAI` chỉ là lớp HTTP — không hề gọi về api.openai.com vì ta
// override `baseURL` sang https://api.deepseek.com. Alias `DeepseekClient`
// giúp phần còn lại của codebase đọc đúng ý đồ: đây là client của Deepseek.
import OpenAI from 'openai';

export type DeepseekClient = OpenAI;

let _client: DeepseekClient | null = null;

export function getDeepseekClient(): DeepseekClient {
  if (_client) return _client;
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY chưa được cấu hình trong .env');
  }
  _client = new OpenAI({ apiKey, baseURL });
  return _client;
}

export function getDeepseekModel(): string {
  return process.env.DEEPSEEK_MODEL || 'deepseek-chat';
}
