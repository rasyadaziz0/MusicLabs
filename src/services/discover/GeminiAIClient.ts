import { GoogleGenerativeAI } from '@google/generative-ai';
import { DiscoverSuggestion } from './types';

export class GeminiAIClient {
  private static MAX_RETRIES = 3;

  /**
   * Sends the prompt to Gemini and parses the suggestions safely.
   */
  public static async generateRecommendations(prompt: string): Promise<DiscoverSuggestion[]> {
    const GEMINI_KEY = process.env.GOOGLE_GEMINI_DISCOVER_KEY ?? '';
    if (!GEMINI_KEY) {
      throw new Error('GOOGLE_GEMINI_DISCOVER_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      generationConfig: { responseMimeType: 'application/json' },
    });

    let lastError: unknown = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        // Parse JSON — handle possible markdown wrapping
        let cleanText = responseText;
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
        }

        const parsed = JSON.parse(cleanText);

        if (!Array.isArray(parsed)) {
          throw new Error('Gemini response is not an array');
        }

        // Validate shape — filter out malformed entries silently
        const suggestions: DiscoverSuggestion[] = parsed
          .filter(
            (item: any) =>
              item &&
              typeof item.title === 'string' &&
              typeof item.artist === 'string' &&
              item.title.trim().length > 0 &&
              item.artist.trim().length > 0,
          )
          .map((item: any) => ({
            title: item.title.trim(),
            artist: item.artist.trim(),
          }));

        if (suggestions.length < 5) {
          throw new Error(`Gemini returned too few valid suggestions (${suggestions.length})`);
        }

        return suggestions;
      } catch (err: unknown) {
        lastError = err;
        const errObj = err as Record<string, unknown>;
        const resObj = errObj?.response as Record<string, unknown> | undefined;
        const status = (errObj?.status as number) ?? (resObj?.status as number) ?? 0;
        const isRetryable = status === 503 || status === 429 || status >= 500;

        if (!isRetryable || attempt === this.MAX_RETRIES - 1) {
          break;
        }

        const delay = Math.pow(2, attempt) * 1000;
        console.warn(
          `Gemini Discover attempt ${attempt + 1} failed (${status}), retrying in ${delay}ms...`,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    throw lastError || new Error('Failed to get Gemini recommendations');
  }
}
