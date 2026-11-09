/**
 * Google Gemini API Client dedicated for TryMe Social Media & Marketing Post Generator
 * Uses GEMINI_MARKETING_API_KEY independently from the customer-facing chatbot.
 */

const GEMINI_MARKETING_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

export interface GeminiMarketingMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export async function callGeminiMarketing(
  systemInstruction: string,
  messages: GeminiMarketingMessage[]
): Promise<string> {
  const apiKey = process.env.GEMINI_MARKETING_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Neither GEMINI_MARKETING_API_KEY nor GEMINI_API_KEY is configured.");
  }

  let lastError: any = null;

  for (const model of GEMINI_MARKETING_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const payload = {
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: messages,
        generationConfig: {
          temperature: 0.6,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }

      if (data.error) {
        lastError = new Error(`[${model}] ${data.error.message || "Unknown error"}`);
        // If 503 high demand or 404, fallback to next model in list
        continue;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to generate marketing post from Gemini API.");
}

