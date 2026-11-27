import { MAX_PROMPT_LENGTH } from '../constants';
import type { AirQualityData, HouseholdProfile } from '../types/vayunex';
import { sanitizeText } from '../utils/helpers';
import { isUsableApiKey, requestGeminiAnswer } from './ai/geminiClient';
import { buildContextSummary } from './ai/promptContext';
import { buildDefaultImpactCards, detectIntent, generateSmartReply, suggestFollowUps } from './ai/smartEngine';
import type { AiReply } from './ai/smartEngine';

export { findCleanestWindow } from './ai/cleanWindow';
export type { CleanWindow } from './ai/cleanWindow';
export { generateRoutine } from './ai/routineGenerator';
export type { AiReply } from './ai/smartEngine';

/** Which engine produced a reply. */
export type AiEngine = 'gemini' | 'smart-engine';

/**
 * Answers a household air quality question.
 *
 * When a valid Gemini API key is configured, the question and live context are
 * sent to Google Gemini; otherwise (or on any Gemini failure) the on-device
 * VayuNex Smart Engine generates a grounded, personalized reply.
 */
export async function generateAiResponse(
  userPrompt: string,
  aq: AirQualityData,
  profile: HouseholdProfile,
  geminiApiKey?: string
): Promise<AiReply & { engine: AiEngine }> {
  const prompt = sanitizeText(userPrompt, MAX_PROMPT_LENGTH);

  if (isUsableApiKey(geminiApiKey)) {
    const answer = await requestGeminiAnswer(geminiApiKey, buildContextSummary(aq, profile), prompt);
    if (answer) {
      return {
        content: answer,
        impactCards: buildDefaultImpactCards(aq, profile),
        suggestedActions: suggestFollowUps(detectIntent(prompt)),
        engine: 'gemini',
      };
    }
  }

  return { ...generateSmartReply(prompt, aq, profile), engine: 'smart-engine' };
}
