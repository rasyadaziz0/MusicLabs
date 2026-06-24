import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY ?? '';

// Unicode range checks for non-Latin scripts
function hasNonLatinChars(text: string): boolean {
  // Exclude \u3000-\u303F (CJK punctuation and spaces) to avoid false positives on English songs
  return /[\u0400-\u04FF\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u3040-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\u1100-\u11FF]/.test(text);
}

// Detect if text is primarily Indonesian/Malay (Latin-based, no romanization needed)
function isLikelyIndonesian(text: string): boolean {
  // Indonesian common words — quick heuristic
  const idWords = /\b(dan|yang|di|ke|dari|untuk|dengan|ini|itu|adalah|tidak|akan|ada|bisa|sudah|saya|kamu|aku|kau|dia|kami|mereka|satu|apa|juga|hanya|pada|dalam|seperti|karena|agar|mau|punya|kalau|tapi|atau|jadi|kalau|bukan|belum|masih|sangat|sekali|lebih|lagi|semua|banyak|cinta|hati|mata|jiwa|rindu|sayang|dunia|hidup|malam|pagi|hujan)\b/i;
  return idWords.test(text);
}

export async function POST(request: NextRequest) {
  // ── Auth check: require logged-in user ──────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Login required to use romanization.' },
      { status: 401 }
    );
  }

  // ── Rate limit: per-user (15/min) ───────────────────────────────
  const userLimiter = await checkRateLimit(user.id, {
    limit: 15,
    windowMs: 60_000,
    keyPrefix: 'romanize:user',
  });

  if (!userLimiter.allowed) {
    return NextResponse.json(
      { error: 'Too many romanization requests. Please wait a moment.' },
      {
        status: 429,
        headers: { 'Retry-After': String(userLimiter.resetInSeconds) },
      }
    );
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Gemini API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const lines: string[] = body.lines;
    const trackId: string = body.trackId ?? '';

    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: 'No lines provided' }, { status: 400 });
    }

    if (lines.length > 100) {
      return NextResponse.json({ error: 'Too many lines' }, { status: 400 });
    }

    const totalChars = lines.reduce((sum, line) => sum + (line?.length || 0), 0);
    if (totalChars > 10000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 400 });
    }

    // Filter: only romanize lines that contain non-Latin characters
    // and are NOT Indonesian/English
    const indicesToRomanize: number[] = [];
    const textsToRomanize: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const text = lines[i].trim();
      if (!text || text === '●●●' || text === '...' || /^[●·.…♪]+$/.test(text)) continue;
      if (hasNonLatinChars(text) && !isLikelyIndonesian(text)) {
        indicesToRomanize.push(i);
        textsToRomanize.push(text);
      }
    }

    if (textsToRomanize.length === 0) {
      return NextResponse.json(
        { romanizations: {} },
        {
          headers: {
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          },
        }
      );
    }

    // Bail early if client already disconnected
    if (request.signal?.aborted) {
      return NextResponse.json({ error: 'Request aborted' }, { status: 499 });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.1-flash-lite',
      generationConfig: { responseMimeType: 'application/json' }
    });

    // Batch lines into a single prompt for efficiency
    const numberedLines = textsToRomanize
      .map((t, i) => `${i + 1}. ${t}`)
      .join('\n');

    const prompt = `You are a strict transliteration bot. Convert the following text from their original script to Latin/Roman alphabet (romanization).

CRITICAL RULES:
1. ONLY romanize the exact text provided. DO NOT try to guess the song or fetch lyrics from memory. Provide a direct, literal transliteration.
2. UNIVERSAL SPACING RULE (For ALL languages): Separate EVERY single syllable/character with a single space. BUT separate original words (if there are spaces in the original text) with a DOUBLE SPACE.
3. For Korean: use Revised Romanization. Example: '이정도면 알아줄' -> 'i jeong do myeon  a ra jul'.
4. For Japanese: use Romaji. Example: '君の 虜に' -> 'ki mi no  to ri ko ni'.
5. For Chinese: use Pinyin without tones. Example: '你好 吗' -> 'ni hao  ma'.
6. Keep any existing Latin characters and punctuation as-is.
7. Return a valid JSON object. The keys MUST be the exact line numbers provided (e.g. "1", "2") and the values must be the romanized strings.
Example output:
{
  "1": "konnichiwa",
  "2": "ni hao"
}

Text to romanize:
${numberedLines}`;

    // ── Retry with exponential backoff for transient errors ────────
    const MAX_RETRIES = 3;
    let lastError: unknown = null;
    let responseText = '';

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // Check abort before each attempt
      if (request.signal?.aborted) {
        return NextResponse.json({ error: 'Request aborted' }, { status: 499 });
      }

      try {
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        lastError = null;
        break;
      } catch (err: unknown) {
        lastError = err;
        const errObj = err as Record<string, unknown>;
        const resObj = errObj?.response as Record<string, unknown> | undefined;
        const status = (errObj?.status as number) ?? (resObj?.status as number) ?? 0;
        const isRetryable = status === 503 || status === 429 || status >= 500;

        if (!isRetryable || attempt === MAX_RETRIES - 1) {
          throw err;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`Gemini API attempt ${attempt + 1} failed (${status}), retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    if (lastError) throw lastError;

    const romanizationMap: Record<number, string> = {};
    
    try {
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
         cleanedText = cleanedText.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanedText.startsWith('```')) {
         cleanedText = cleanedText.replace(/^```/, '').replace(/```$/, '').trim();
      }
      
      let parsed = JSON.parse(cleanedText);
      if (parsed.romanizations && typeof parsed.romanizations === 'object') {
        parsed = parsed.romanizations;
      }
      
      let hasData = false;
      for (const [key, value] of Object.entries(parsed)) {
        const responseIdx = parseInt(key) - 1; // 0-based in our textsToRomanize
        if (!isNaN(responseIdx) && responseIdx >= 0 && responseIdx < indicesToRomanize.length) {
          const originalIdx = indicesToRomanize[responseIdx];
          romanizationMap[originalIdx] = (value as string).trim();
          hasData = true;
        }
      }
      
      if (!hasData) {
        throw new Error('Parsed JSON contained no valid romanization mappings.');
      }
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON response:', responseText);
      throw parseErr;
    }

    return NextResponse.json(
      { romanizations: romanizationMap },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      }
    );
  } catch (err: unknown) {
    // Suppress harmless client-disconnect errors
    const isAbort = (err instanceof Error && (err.name === 'AbortError')) ||
      (err != null && typeof err === 'object' && 'code' in err && (err as Record<string, unknown>).code === 'ECONNRESET') ||
      request.signal?.aborted;
    if (isAbort) {
      return NextResponse.json({ error: 'Request aborted' }, { status: 499 });
    }

    console.error('Romanization error:', err);
    return NextResponse.json(
      { error: 'Failed to romanize lyrics' },
      { status: 500 }
    );
  }
}

