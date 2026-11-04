/**
 * Google Gemini API Client for TryMe AI Store Assistant
 */

const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
];

export interface GeminiChatMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export async function callGeminiChat(
  systemInstruction: string,
  messages: GeminiChatMessage[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const payload = {
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: messages,
        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
          maxOutputTokens: 1024,
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
        // If high demand 503 or 404, fallback to next model
        continue;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to generate response from Gemini API.");
}
