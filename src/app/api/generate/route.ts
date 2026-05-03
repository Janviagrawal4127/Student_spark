import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateWithFallback(ai: GoogleGenAI, prompt: string): Promise<string> {
  let lastError: Error | null = null;

  for (const model of MODELS) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          await sleep(RETRY_DELAY_MS * attempt);
        }

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        const text = response.text || '';
        if (text) return text;
      } catch (err: any) {
        lastError = err;
        const status = err?.status ?? err?.code ?? 0;
        const is503 = status === 503 || err?.message?.includes('UNAVAILABLE') || err?.message?.includes('high demand');

        if (is503) {
          // Try next attempt or next model
          console.warn(`Model ${model} attempt ${attempt + 1} returned 503, will retry...`);
          continue;
        }

        // Non-503 errors — break immediately
        throw err;
      }
    }
    console.warn(`Model ${model} exhausted retries, trying next fallback...`);
  }

  throw lastError ?? new Error('All models are currently unavailable. Please try again later.');
}

async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamically require inside the function to bypass Next.js static bundler issues with this specific CJS package
    const pdfParseModule = require('pdf-parse');
    
    // Attempt multiple ways to extract the function
    const parser = typeof pdfParseModule === 'function' ? pdfParseModule 
                   : typeof pdfParseModule?.default === 'function' ? pdfParseModule.default 
                   : typeof pdfParseModule?.pdfParse === 'function' ? pdfParseModule.pdfParse
                   : null;
                   
    if (!parser) {
        console.error('pdf-parse module keys:', Object.keys(pdfParseModule));
        throw new Error('pdf-parse module could not be resolved as a function. It resolved as: ' + typeof pdfParseModule);
    }
    
    const data = await parser(buffer);
    return data.text.slice(0, 15000); // Limit to avoid token overflow
  } catch (err) {
    console.error('PDF Parse Actual Error:', err);
    throw new Error('Failed to parse PDF. Please ensure the file is a valid PDF.');
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const topic = formData.get('topic') as string | null;
    const file = formData.get('file') as File | null;

    let sourceText = topic?.trim() || '';

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfText = await parsePdf(buffer);
      sourceText = `Topic: ${topic || 'From uploaded document'}\n\nDocument Text:\n${pdfText}`;
    }

    if (!sourceText) {
      return NextResponse.json({ error: 'No topic or file provided.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
You are an expert AI tutor. A student has submitted the following study material or topic.
Analyze it and generate a comprehensive JSON response strictly matching the required schema below.

MATERIAL:
==================
${sourceText}
==================

Return ONLY valid JSON matching this exact schema (no markdown fences, no extra text):
{
  "topic": "The central topic name (concise, 2-5 words)",
  "summary": "A detailed 5-6 sentence summary covering the main concepts, importance, and key takeaways.",
  "flashcards": [
    { "front": "Question or key term", "back": "Detailed answer or definition" }
  ],
  "quiz": [
    {
      "question": "A clear multiple choice question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0
    }
  ],
  "mindMapData": {
    "name": "Central Topic",
    "children": [
      {
        "name": "Main Branch 1",
        "children": [
          { "name": "Sub-detail 1A" },
          { "name": "Sub-detail 1B" }
        ]
      }
    ]
  }
}

Requirements:
- flashcards: minimum 6 items
- quiz: minimum 4 questions with 4 answer options each, answer is the 0-based index of the correct option
- mindMapData: at least 3 top-level branches, each with 2+ children
- Return ONLY the raw JSON string, nothing else
`;

    const resultText = await generateWithFallback(ai, prompt);

    const cleaned = resultText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      const jsonData = JSON.parse(cleaned);
      return NextResponse.json(jsonData);
    } catch (parseError) {
      console.error('Failed to parse Gemini output:', cleaned);
      return NextResponse.json(
        { error: 'AI returned an invalid format. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API Route Error:', error);
    
    // Check if it's a 503 Unavailable / High Demand
    const isUnavailable =
      error?.message?.includes('UNAVAILABLE') ||
      error?.message?.includes('high demand') ||
      error?.message?.includes('unavailable') ||
      error?.status === 503;

    // Check if it's a 429 Quota Exceeded
    const isQuotaExceeded = 
      error?.message?.includes('exceeded your current quota') ||
      error?.message?.includes('RESOURCE_EXHAUSTED') ||
      error?.message?.includes('rate limits') ||
      error?.status === 429;

    let errorMessage = 'Internal server error. Please try again.';
    let statusCode = 500;

    if (isQuotaExceeded) {
       errorMessage = 'Your API key has exceeded its quota limits. Please check your Google Cloud billing or use a different key with available quota.';
       statusCode = 429;
    } else if (isUnavailable) {
       errorMessage = 'AI models are experiencing high demand right now. Please wait a moment and try again.';
       statusCode = 503;
    } else if (error?.message) {
       // Only use error.message if it's not a massive stringified JSON blob from Google
       if (error.message.startsWith('{') && error.message.includes('"error"')) {
           try {
              const parsed = JSON.parse(error.message);
              errorMessage = parsed?.error?.message || 'Failed to generate study materials.';
           } catch {
              errorMessage = 'An unexpected API error occurred.';
           }
       } else {
           errorMessage = error.message;
       }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
