import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { callGeminiMarketing, GeminiMarketingMessage } from "@/lib/gemini-marketing";

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || !["VENDOR", "ADS_SELLER", "ADMIN"].includes(authUser.role)) {
      return NextResponse.json(
        { success: false, error: "Only Vendors, Ads Sellers, and Admins can generate social posts." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { item, instruction, history = [] } = body;

    if (!item || !item.name) {
      return NextResponse.json(
        { success: false, error: "Item details (name, price, etc.) are required." },
        { status: 400 }
      );
    }

    const systemInstruction = `
You are TryMe AI Social Media Marketing Copywriter — an elite e-commerce marketing specialist for Sri Lanka and global markets.
Your mission is to generate high-converting, viral Facebook Posts and Instagram Captions for:
- Products (clothing, electronics, accessories, etc.)
- Services (tailoring, salon, repair, photography, etc.)
- Classified Ads (smartphones, vehicles, property, electronics, etc.)

Rules for Output:
1. FACEBOOK POST:
   - Hook / headline with eye-catching emojis
   - Key selling features & benefits (bullet points)
   - Price in LKR (Rs. ${item.price || "Contact for Price"})
   - Clear Call-To-Action (Inbox us / Order online / WhatsApp)
   - Islandwide Cash On Delivery / Delivery guarantee mention if applicable
2. INSTAGRAM CAPTION:
   - Punchy aesthetic hook
   - Clean spacing with modern bullet styling
   - Clear Call-To-Action (Link in Bio / DM to order)
   - 15-20 viral hashtags relevant to Sri Lanka and the niche (e.g., #SriLankaShopping #ColomboOnline #TryMeLK #SLLocalBusiness etc.)
3. TONE & LANGUAGE:
   - Engaging, trustworthy, and modern.
   - If the user asks for Singlish / Sinhala, seamlessly adapt the copy!
   - Follow any user instructions (e.g. adding discount, shortening, emphasizing quality).

CRITICAL FORMAT REQUIREMENT:
You MUST respond with ONLY a valid raw JSON object (without markdown code fences like \`\`\`json or \`\`\`), with this exact structure:
{
  "facebookPost": "The full formatted Facebook post text here...",
  "instagramPost": "The full formatted Instagram caption with hashtags here...",
  "reply": "A brief helpful 1-2 sentence response to the vendor explaining what was generated or updated."
}
`.trim();

    const messages: GeminiMarketingMessage[] = [];

    // Base context of the item
    const itemContext = `
ITEM TYPE: ${item.type || "PRODUCT"}
NAME: ${item.name}
PRICE: ${item.price ? `Rs. ${Number(item.price).toLocaleString("en-LK")}` : "Negotiable / Contact"}
CATEGORY: ${item.category || "General"}
DESCRIPTION: ${item.description || "Premium quality item available on TryMe.lk"}
LOCATION: ${item.location || "Islandwide, Sri Lanka"}
SPECIFICATIONS: ${item.specifications ? JSON.stringify(item.specifications) : "Standard"}
`.trim();

    // Replay conversation history if any
    if (history.length > 0) {
      for (const h of history) {
        messages.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        });
      }
    }

    // Add current user prompt
    const userPrompt = instruction
      ? `Here is the item details:\n${itemContext}\n\nVendor Custom Instruction:\n"${instruction}"\n\nPlease generate/update both the Facebook post and Instagram caption accordingly.`
      : `Here is the item details:\n${itemContext}\n\nPlease generate high-converting viral posts for Facebook and Instagram.`;

    messages.push({
      role: "user",
      parts: [{ text: userPrompt }],
    });

    const rawResponse = await callGeminiMarketing(systemInstruction, messages);

    // Clean any markdown code blocks
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleaned);
    } catch (parseErr) {
      // Fallback if model returned formatted plain text
      parsedResult = {
        facebookPost: rawResponse,
        instagramPost: rawResponse,
        reply: "Generated marketing post successfully!",
      };
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
    });
  } catch (error: any) {
    console.error("[Marketing Posts API] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate marketing posts" },
      { status: 500 }
    );
  }
}

