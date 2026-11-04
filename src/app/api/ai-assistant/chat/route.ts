import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGeminiChat, GeminiChatMessage } from "@/lib/gemini";

// In-memory rate limiting map: IP -> timestamp array
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15; // 15 requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown-ip";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Too many questions asked in a short time. Please wait a moment before asking again.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message, contextType, contextId, chatHistory, sessionId, customerInfo } = body;
    const activeSessionId = sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    let resolvedVendorId: string | null = null;
    let resolvedAdsSellerId: string | null = null;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Question message is required" },
        { status: 400 }
      );
    }

    let storeName = "TryMe Store";
    let storePhone = "";
    let storeWhatsApp = "";
    let storeAddress = "";
    let storeSlug = "";
    let knowledgeContext = "";
    let currentFocusItem: any = null;

    // ── 1. CONTEXT: VENDOR ──
    if (contextType === "VENDOR") {
      const vendor = await (prisma as any).vendor.findFirst({
        where: {
          OR: [{ slug: contextId }, { id: contextId }],
        },
        include: {
          products: {
            where: {
              isActive: true,
              isDraft: false,
              isDisabledByAdmin: false,
            },
            take: 35,
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              compareAtPrice: true,
              stock: true,
              description: true,
              category: { select: { name: true } },
              variants: {
                select: { name: true, value: true, stock: true, priceAdjustment: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          services: {
            where: { isActive: true },
            take: 15,
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              priceType: true,
              duration: true,
              description: true,
            },
          },
          websiteConfig: {
            select: {
              aboutSection: true,
              contactSection: true,
            },
          },
        },
      });

      if (!vendor) {
        return NextResponse.json(
          { success: false, error: "Store not found" },
          { status: 404 }
        );
      }

      storeName = vendor.businessName;
      storePhone = vendor.businessPhone || "";
      storeWhatsApp =
        (vendor.websiteConfig?.contactSection as any)?.whatsapp ||
        vendor.businessPhone ||
        "";
      storeAddress = vendor.businessAddress || "";
      storeSlug = vendor.slug;
      resolvedVendorId = vendor.id;

      const productList = (vendor.products || []).map((p: any) => {
        const variantsStr =
          p.variants && p.variants.length > 0
            ? `Variants: ${p.variants
                .map((v: any) => `${v.name || ""}: ${v.value || ""} (Stock: ${v.stock})`)
                .join(", ")}`
            : "";
        return `- Product: "${p.name}" | Price: LKR ${p.price}${p.compareAtPrice ? " (Original: LKR " + p.compareAtPrice + ")" : ""} | Stock: ${p.stock > 0 ? "In Stock (" + p.stock + ")" : "Out of Stock"} | Category: ${p.category?.name || "General"} | Slug: ${p.slug} | ${variantsStr} | Summary: ${p.description?.slice(0, 160) || ""}`;
      });

      const serviceList = (vendor.services || []).map(
        (s: any) =>
          `- Service: "${s.name}" | Price: ${s.price ? "LKR " + s.price : s.priceType} | Duration: ${s.duration || "N/A"} | Slug: ${s.slug} | Desc: ${s.description?.slice(0, 120)}`
      );

      knowledgeContext = `
STORE: "${vendor.businessName}"
STORE TYPE: Verified Vendor Store on TryMe.lk
CONTACT PHONE: ${storePhone}
WHATSAPP: ${storeWhatsApp}
LOCATION: ${storeAddress || "Sri Lanka"}

AVAILABLE PRODUCTS (${vendor.products?.length || 0} items):
${productList.join("\n") || "No physical products currently listed."}

AVAILABLE SERVICES (${vendor.services?.length || 0} services):
${serviceList.join("\n") || "No services currently listed."}
`;
    }

    // ── 2. CONTEXT: ADS SELLER ──
    else if (contextType === "ADS_SELLER") {
      const seller = await (prisma as any).adsSeller.findFirst({
        where: {
          OR: [{ slug: contextId }, { id: contextId }],
        },
        include: {
          ads: {
            where: {
              status: { in: ["ACTIVE", "PENDING"] },
            },
            take: 35,
            select: {
              id: true,
              title: true,
              price: true,
              specifications: true,
              district: true,
              localArea: true,
              description: true,
              subCategory: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          services: {
            where: { isActive: true },
            take: 15,
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              priceType: true,
              duration: true,
              description: true,
            },
          },
        },
      });

      if (!seller) {
        return NextResponse.json(
          { success: false, error: "Seller store not found" },
          { status: 404 }
        );
      }

      storeName = seller.businessName;
      storePhone = seller.phone || "";
      storeWhatsApp = seller.phone || "";
      storeSlug = seller.slug;
      resolvedAdsSellerId = seller.id;

      const adList = (seller.ads || []).map(
        (a: any) =>
          `- Ad: "${a.title}" | Price: LKR ${a.price} | Condition: ${a.condition || "Used"} | Location: ${a.localArea ? `${a.localArea}, ` : ""}${a.district || ""} | Category: ${a.subCategory?.name || "Classifieds"} | Ad ID: ${a.id} | Desc: ${a.description?.slice(0, 160) || ""}`
      );

      const serviceList = (seller.services || []).map(
        (s: any) =>
          `- Service: "${s.name}" | Price: ${s.price ? "LKR " + s.price : s.priceType} | Duration: ${s.duration || "N/A"} | Desc: ${s.description?.slice(0, 120)}`
      );

      knowledgeContext = `
STORE: "${seller.businessName}"
STORE TYPE: Verified Classifieds Ads Seller on TryMe.lk
CONTACT PHONE: ${storePhone}
WHATSAPP: ${storeWhatsApp}

ACTIVE CLASSIFIED ADS (${seller.ads?.length || 0} listings):
${adList.join("\n") || "No classified listings currently active."}

AVAILABLE SERVICES:
${serviceList.join("\n") || "No services currently active."}
`;
    }

    // ── 3. CONTEXT: SINGLE PRODUCT PAGE ──
    else if (contextType === "PRODUCT") {
      const product = await (prisma as any).product.findFirst({
        where: {
          OR: [{ slug: contextId }, { id: contextId }],
        },
        include: {
          vendor: {
            include: {
              products: {
                where: {
                  isActive: true,
                  isDraft: false,
                  id: { not: contextId },
                },
                take: 15,
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  compareAtPrice: true,
                  stock: true,
                },
              },
            },
          },
          category: { select: { name: true } },
          variants: true,
          images: { take: 3, select: { url: true } },
        },
      });

      if (!product) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 404 }
        );
      }

      storeName = product.vendor?.businessName || "TryMe Vendor";
      storePhone = product.vendor?.businessPhone || "";
      storeWhatsApp = product.vendor?.businessPhone || "";
      storeSlug = product.vendor?.slug || "";
      resolvedVendorId = product.vendorId || product.vendor?.id || null;
      currentFocusItem = {
        type: "PRODUCT",
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
      };

      const otherProducts = (product.vendor?.products || []).map(
        (p: any) => `- "${p.name}" (LKR ${p.price}, Stock: ${p.stock}) | Slug: ${p.slug}`
      );

      knowledgeContext = `
CURRENT PRODUCT IN VIEW:
- Title: "${product.name}"
- Product Slug: ${product.slug}
- Regular Price: LKR ${product.price}
${product.compareAtPrice ? `- Compare At (Original) Price: LKR ${product.compareAtPrice}` : ""}
- Stock Status: ${product.stock > 0 ? "In Stock (" + product.stock + " available)" : "Currently Out of Stock"}
- Category: ${product.category?.name || "General"}
- Variants Available: ${
        product.variants && product.variants.length > 0
          ? product.variants
              .map((v: any) => `${v.name}: ${v.value} (Stock: ${v.stock})`)
              .join(", ")
          : "Standard item"
      }
- Full Description:
${product.description || "High quality product from verified vendor."}

SELLER / STORE DETAILS:
- Vendor Store: "${storeName}"
- Phone / Inquiry: ${storePhone}
- WhatsApp: ${storeWhatsApp}

OTHER POPULAR PRODUCTS FROM THIS STORE:
${otherProducts.join("\n") || "No other products listed."}
`;
    }

    // ── 4. CONTEXT: SINGLE CLASSIFIED AD PAGE ──
    else if (contextType === "AD") {
      const ad = await (prisma as any).classifiedAd.findUnique({
        where: { id: contextId },
        include: {
          seller: {
            include: {
              ads: {
                where: {
                  status: "ACTIVE",
                  id: { not: contextId },
                },
                take: 15,
                select: { id: true, title: true, price: true, district: true, localArea: true },
              },
            },
          },
          category: { select: { name: true } },
          subCategory: { select: { name: true } },
        },
      });

      if (!ad) {
        return NextResponse.json(
          { success: false, error: "Classified ad not found" },
          { status: 404 }
        );
      }

      storeName = ad.seller?.businessName || "TryMe Classifieds Seller";
      storePhone = ad.seller?.phone || "";
      storeWhatsApp = ad.seller?.phone || "";
      storeSlug = ad.seller?.slug || "";
      resolvedAdsSellerId = ad.sellerId || ad.seller?.id || null;
      currentFocusItem = {
        type: "AD",
        id: ad.id,
        name: ad.title,
        price: ad.price,
      };

      const otherAds = (ad.seller?.ads || []).map(
        (a: any) => `- "${a.title}" (LKR ${a.price}, ${a.localArea ? `${a.localArea}, ` : ""}${a.district || ""}) | Ad ID: ${a.id}`
      );

      knowledgeContext = `
CURRENT CLASSIFIED AD IN VIEW:
- Title: "${ad.title}"
- Ad ID: ${ad.id}
- Listed Price: LKR ${ad.price}
- Specifications: ${JSON.stringify(ad.specifications || {})}
- Location: ${ad.localArea ? `${ad.localArea}, ` : ""}${ad.district || "Sri Lanka"}
- Category: ${ad.category?.name || ""} > ${ad.subCategory?.name || ""}
- Contact Phone: ${storePhone}
- WhatsApp: ${storeWhatsApp}
- Full Description:
${ad.description || "Direct seller listing on TryMe.lk"}

SELLER DETAILS:
- Seller Name: "${storeName}"

OTHER ADS POSTED BY THIS SELLER:
${otherAds.join("\n") || "No other active listings."}
`;
    }

    // ── 5. CONTEXT: STANDALONE MINI-WEBSITE ──
    else if (contextType === "STANDALONE_SITE") {
      let vendor: any = null;
      let adsSeller: any = null;

      const domainRecord = await (prisma as any).vendorCustomDomain.findFirst({
        where: { domain: contextId },
        include: {
          vendor: { include: { products: { take: 25 }, services: { take: 10 }, websiteConfig: true } },
          adsSeller: { include: { ads: { take: 25 }, services: { take: 10 }, websiteConfig: true } },
        },
      });

      if (domainRecord?.vendor) vendor = domainRecord.vendor;
      if (domainRecord?.adsSeller) adsSeller = domainRecord.adsSeller;

      if (!vendor && !adsSeller) {
        vendor = await (prisma as any).vendor.findFirst({
          where: { slug: contextId },
          include: { products: { take: 25 }, services: { take: 10 }, websiteConfig: true },
        });
      }

      if (!vendor && !adsSeller) {
        adsSeller = await (prisma as any).adsSeller.findFirst({
          where: { slug: contextId },
          include: { ads: { take: 25 }, services: { take: 10 }, websiteConfig: true },
        });
      }

      const entity = vendor || adsSeller;
      if (!entity) {
        return NextResponse.json(
          { success: false, error: "Website not found" },
          { status: 404 }
        );
      }

      storeName = entity.businessName;
      storePhone = entity.businessPhone || entity.phone || "";
      storeWhatsApp =
        (entity.websiteConfig?.contactSection as any)?.whatsapp ||
        entity.businessPhone ||
        entity.phone ||
        "";
      storeSlug = entity.slug;
      if (vendor) resolvedVendorId = vendor.id;
      if (adsSeller) resolvedAdsSellerId = adsSeller.id;

      const items = (vendor ? vendor.products : adsSeller?.ads || []).map((it: any) =>
        `- Item: "${it.name || it.title}" | Price: LKR ${it.price} | Slug/ID: ${it.slug || it.id}`
      );

      const services = (entity.services || []).map((s: any) =>
        `- Service: "${s.name}" | Price: ${s.price ? "LKR " + s.price : s.priceType} | Duration: ${s.duration || "N/A"}`
      );

      knowledgeContext = `
STORE / WEBSITE: "${entity.businessName}"
PHONE: ${storePhone}
WHATSAPP: ${storeWhatsApp}

FEATURED ITEMS:
${items.join("\n") || "No items listed."}

SERVICES:
${services.join("\n") || "No services listed."}
`;
    }

    // ── SYSTEM INSTRUCTION FOR GEMINI ──
    const systemInstruction = `
You are the polite, knowledgeable, and helpful official AI Store Assistant for "${storeName}".
Your mission is to welcome customers, answer their questions accurately, recommend items, and guide them to purchase or contact the seller.

=== STRICT KNOWLEDGE GROUNDING & GUARDRAILS ===
1. You represent ONLY "${storeName}". All your knowledge is STRICTLY derived from the provided STORE DATA below.
2. NEVER mention or recommend outside competitor websites (e.g. Ikman, Daraz, Keells, etc.).
3. If a customer asks about a product, model, or service that is NOT in this store, politely inform them:
   - State clearly in their language that "${storeName}" does not currently have that exact item.
   - If there is a similar item in the store's inventory, suggest it as an alternative.
4. Do NOT discuss politics, computer programming, medical advice, or unrelated general knowledge. Politely steer the conversation back to "${storeName}".
5. Be concise, friendly, warm, and professional.

=== MULTILINGUAL & SCRIPT RULES ===
You must detect and match the customer's language and script naturally:
1. If the customer asks in Sinhala (Unicode සිංහල) ➔ Reply in warm, natural, polite Sinhala.
2. If the customer asks in Singlish (e.g. "me item eka thiyenawada?", "delivery karanna puluwanda?") ➔ Reply in fluent, friendly Singlish (or clean natural Sinhala).
3. If the customer asks in Tamil (தமிழ்) ➔ Reply in polite, natural Tamil.
4. If the customer asks in Tanglish ➔ Reply in polite Tanglish / Tamil.
5. If the customer asks in English ➔ Reply in clear, professional English.

=== CALL-TO-ACTION (CTA) TAGS ===
When you recommend a product, ad, or suggest WhatsApp contact, you MUST include special tags at the end of your response so the UI can render rich interactive buttons for the customer:
- When recommending a product from this store: include [ACTION:VIEW_PRODUCT slug="PRODUCT_SLUG" title="PRODUCT_TITLE"]
- When recommending an ad from this seller: include [ACTION:VIEW_AD id="AD_ID" title="AD_TITLE"]
- When the customer wants to order, book, or negotiate via WhatsApp: include [ACTION:WHATSAPP phone="${storeWhatsApp || storePhone}" text="I would like to inquire about [ITEM_NAME]"]

=== STORE DATA FOR "${storeName}" ===
${knowledgeContext}
`;

    // Format chat history for Gemini API
    const formattedMessages: GeminiChatMessage[] = [];

    if (Array.isArray(chatHistory)) {
      // Keep only last 6 messages to stay within cost & context limits
      const recentHistory = chatHistory.slice(-6);
      for (const msg of recentHistory) {
        if (msg.role === "user" || msg.role === "model") {
          formattedMessages.push({
            role: msg.role,
            parts: [{ text: String(msg.content).slice(0, 500) }],
          });
        }
      }
    }

    // Append the new user question
    formattedMessages.push({
      role: "user",
      parts: [{ text: message.trim().slice(0, 1000) }],
    });

    // Call Gemini API
    const rawReply = await callGeminiChat(systemInstruction, formattedMessages);

    // Extract action tags from rawReply
    const actionRegex = /\[ACTION:([A-Z_]+)\s+([^\]]+)\]/g;
    const actions: any[] = [];
    let match;

    while ((match = actionRegex.exec(rawReply)) !== null) {
      const type = match[1];
      const attrString = match[2];
      const attrs: Record<string, string> = {};
      const attrRegex = /([a-zA-Z0-9_]+)="([^"]*)"/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrString)) !== null) {
        attrs[attrMatch[1]] = attrMatch[2];
      }
      actions.push({ type, ...attrs });
    }

    // Clean action tags out of the readable reply text
    const cleanReply = rawReply.replace(actionRegex, "").trim();

    // Persist conversation into Database for Vendor, Seller, and Admin Oversight
    try {
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const userMsgObj = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message.trim(),
        timestamp: nowStr,
      };
      const modelMsgObj = {
        id: `model-${Date.now()}`,
        role: "model",
        content: cleanReply,
        actions,
        timestamp: nowStr,
      };

      const existing = await (prisma as any).storeAiConversation.findUnique({
        where: { sessionId: activeSessionId },
      });

      const prevList = Array.isArray(existing?.messages) ? existing.messages : [];
      const updatedMessages = [...prevList, userMsgObj, modelMsgObj];

      await (prisma as any).storeAiConversation.upsert({
        where: { sessionId: activeSessionId },
        create: {
          sessionId: activeSessionId,
          contextType: String(contextType),
          contextId: String(contextId),
          storeName,
          vendorId: resolvedVendorId,
          adsSellerId: resolvedAdsSellerId,
          customerName: customerInfo?.name || null,
          customerPhone: customerInfo?.phone || null,
          customerEmail: customerInfo?.email || null,
          messages: updatedMessages,
          lastMessage: cleanReply.slice(0, 500),
          lastRole: "model",
          messageCount: updatedMessages.length,
          unreadByStore: true,
        },
        update: {
          storeName,
          vendorId: resolvedVendorId || undefined,
          adsSellerId: resolvedAdsSellerId || undefined,
          customerName: customerInfo?.name || undefined,
          customerPhone: customerInfo?.phone || undefined,
          customerEmail: customerInfo?.email || undefined,
          messages: updatedMessages,
          lastMessage: cleanReply.slice(0, 500),
          lastRole: "model",
          messageCount: updatedMessages.length,
          unreadByStore: true,
        },
      });
    } catch (dbErr) {
      console.error("Failed to persist StoreAiConversation to DB:", dbErr);
    }

    return NextResponse.json({
      success: true,
      sessionId: activeSessionId,
      reply: cleanReply,
      actions,
      storeInfo: {
        name: storeName,
        phone: storePhone,
        whatsapp: storeWhatsApp,
        slug: storeSlug,
        focusItem: currentFocusItem,
      },
    });
  } catch (error: any) {
    console.error("AI Store Assistant error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Sorry, I am having trouble fetching the details right now. Please ask again or contact the store directly.",
      },
      { status: 500 }
    );
  }
}
