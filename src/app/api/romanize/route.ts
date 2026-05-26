import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

export async function POST(request: Request) {
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

    // Filter: only romanize lines that contain non-Latin characters
    // and are NOT Indonesian/English
    const indicesToRomanize: number[] = [];
    const textsToRomanize: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const text = lines[i].trim();
      if (!text || text === '...') continue;
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
2. For Japanese: use Romaji (e.g., こんにちは → konnichiwa)
3. For Korean: use Revised Romanization (e.g., 사랑해 → saranghae)  
4. For Chinese: use Pinyin without tones (e.g., 你好 → ni hao)
5. Keep any existing Latin characters as-is.
6. Return a valid JSON object where the keys are the exact line numbers provided (e.g. "1", "2") and the values are the romanized strings.

Text to romanize:
${numberedLines}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const romanizationMap: Record<number, string> = {};
    
    try {
      const parsed = JSON.parse(responseText);
      for (const [key, value] of Object.entries(parsed)) {
        const responseIdx = parseInt(key) - 1; // 0-based in our textsToRomanize
        if (!isNaN(responseIdx) && responseIdx >= 0 && responseIdx < indicesToRomanize.length) {
          const originalIdx = indicesToRomanize[responseIdx];
          romanizationMap[originalIdx] = (value as string).trim();
        }
      }
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON response:', responseText);
    }

    return NextResponse.json(
      { romanizations: romanizationMap },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      }
    );
  } catch (err) {
    console.error('Romanization error:', err);
    return NextResponse.json(
      { error: 'Failed to romanize lyrics' },
      { status: 500 }
    );
  }
}
