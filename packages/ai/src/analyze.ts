import type { AnalysisSections, ChartData } from '@tuvi/core';
import { summarizeChartForAI } from '@tuvi/astrology';
import { getDeepseekClient, getDeepseekModel } from './client.js';
import { SYSTEM_PROMPT, SECTION_PROMPTS, SECTION_ORDER, type SectionKey } from './prompts.js';

export interface AnalyzeOptions {
  onProgress?: (step: number, total: number, key: SectionKey) => void;
}

async function callOneSection(key: SectionKey, chartSummary: string): Promise<string> {
  const client = getDeepseekClient();
  const model = getDeepseekModel();

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `DỮ LIỆU LÁ SỐ (bắt buộc bám sát):\n\n${chartSummary}\n\n---\n\n${SECTION_PROMPTS[key]}`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) throw new Error(`Deepseek không trả lời phần ${key}`);
  return text;
}

export async function analyzeChart(
  chart: ChartData,
  opts: AnalyzeOptions = {},
): Promise<AnalysisSections> {
  const chartSummary = summarizeChartForAI(chart);
  const result: Partial<AnalysisSections> = {};

  for (let i = 0; i < SECTION_ORDER.length; i++) {
    const key = SECTION_ORDER[i];
    opts.onProgress?.(i + 1, SECTION_ORDER.length, key);
    result[key] = await callOneSection(key, chartSummary);
  }

  return result as AnalysisSections;
}
