/**
 * WhatsApp Gateway Service for TryMe.lk
 * Powered by Meta WhatsApp Business Cloud API (Graph API v21.0)
 *
 * Supports sending transactional alerts to:
 * 1. Admin (New order notifications with full breakdown)
 * 2. Vendors & Ads Sellers (Targeted notifications with their specific items)
 * 3. Customers (Order confirmation, Processing, Shipped with tracking, Delivered, Cancelled)
 */

export interface SendWhatsAppParams {
  to: string; // phone number: 0771234567, +94771234567, 94771234567
  text?: string;
  template?: {
    name: string;
    language: { code: string };
    components?: any[];
  };
}

export interface AdminNewOrderAlertParams {
  orderNumber: string;
  orderId: string;
  totalAmount: number;
  customerName: string;
  customerPhone?: string;
  city?: string;
  paymentMethod?: string;
  vendorNames?: string[];
}

export interface VendorOrderItemSummary {
  name: string;
  quantity: number;
  price: number;
  variant?: string;
}

export interface VendorNewOrderAlertParams {
  vendorPhone: string;
  vendorName: string;
  orderNumber: string;
  orderId: string;
  totalAmount: number;
  items: VendorOrderItemSummary[];
  city?: string;
  isAdsSeller?: boolean;
}

export interface CustomerOrderStatusAlertParams {
  customerPhone: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  status: string; // PAYMENT_CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  productName?: string;
  vendorName?: string;
  trackingNumber?: string;
  courierName?: string;
  cancelReason?: string;
}

/**
 * Standardize any phone number into international WhatsApp format for Sri Lanka (94XXXXXXXXX)
 */
export function formatWhatsAppPhone(phone?: string | null): string | null {
  if (!phone) return null;

  // Remove spaces, hyphens, brackets, and leading '+'
  let clean = phone.trim().replace(/[\s\-\(\)\+]/g, "");

  if (!clean) return null;

  // Handle local 07X format -> 947X
  if (clean.startsWith("0")) {
    clean = "94" + clean.substring(1);
  } else if (!clean.startsWith("94") && clean.length === 9) {
    // Missing country code (e.g. 771234567)
    clean = "94" + clean;
  }

  // Basic sanity check: phone must be digits only and reasonable length (9 to 15 digits)
  if (!/^\d{9,15}$/.test(clean)) {
    return null;
  }

  return clean;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tryme.lk";

export const whatsappService = {
  /**
   * Send a raw message using Meta WhatsApp Cloud API
   */
  async sendMessage({ to, text, template }: SendWhatsAppParams): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    simulated?: boolean;
  }> {
    const formattedRecipient = formatWhatsAppPhone(to);

    if (!formattedRecipient) {
      console.warn(`[WHATSAPP SERVICE] Invalid phone number skipped: "${to}"`);
      return { success: false, error: "Invalid phone number" };
    }

    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const isEnabled = process.env.WHATSAPP_ENABLED !== "false";

    // Build WhatsApp Cloud API Payload
    const payload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedRecipient,
    };

    if (template) {
      payload.type = "template";
      payload.template = template;
    } else if (text) {
      payload.type = "text";
      payload.text = {
        preview_url: false,
        body: text,
      };
    } else {
      return { success: false, error: "No message text or template provided" };
    }

    // Simulation / Dev Mode if tokens are not configured
    if (!isEnabled || !apiToken || !phoneNumberId || apiToken.startsWith("your_")) {
      console.log(`====================================================`);
      console.log(`[WHATSAPP SIMULATION] Message to +${formattedRecipient}`);
      if (text) console.log(text);
      if (template) console.log("Template:", JSON.stringify(template, null, 2));
      console.log(`====================================================`);
      return { success: true, simulated: true };
    }

    // Live Meta WhatsApp Cloud API call
    try {
      const endpoint = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[WHATSAPP SERVICE] Meta API error:", data);
        return {
          success: false,
          error: data?.error?.message || "Failed to send WhatsApp message via Meta Cloud API",
        };
      }

      const messageId = data?.messages?.[0]?.id;
      console.log(`[WHATSAPP SERVICE] Message sent to +${formattedRecipient} (ID: ${messageId})`);
      return { success: true, messageId };
    } catch (err: any) {
      console.error("[WHATSAPP SERVICE] Exception sending message:", err);
      return { success: false, error: err?.message || "Network exception in WhatsApp API" };
    }
  },

  /**
   * 1. Alert Admin on New Order Placed / Paid
   */
  async sendAdminNewOrderAlert(params: AdminNewOrderAlertParams): Promise<void> {
    try {
      const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;
      if (!adminPhone) {
        console.warn("[WHATSAPP SERVICE] ADMIN_WHATSAPP_NUMBER is not set in .env");
        return;
      }

      const vendorList =
        params.vendorNames && params.vendorNames.length > 0
          ? params.vendorNames.map((v) => `• ${v}`).join("\n")
          : "N/A";

      const message =
        `🔔 *TryMe.lk - New Order Received!*\n\n` +
        `📦 *Order Number:* #${params.orderNumber}\n` +
        `💰 *Total Amount:* Rs. ${params.totalAmount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}\n` +
        `💳 *Payment Method:* ${params.paymentMethod || "Verified / Paid"}\n\n` +
        `👤 *Customer Info:*\n` +
        `• Name: ${params.customerName}\n` +
        (params.customerPhone ? `• Phone: ${params.customerPhone}\n` : "") +
        (params.city ? `• City: ${params.city}\n` : "") +
        `\n🏬 *Vendors Involved:*\n${vendorList}\n\n` +
        `🔗 *View Order in Admin:* ${APP_URL}/admin/orders/${params.orderId || params.orderNumber}`;

      await this.sendMessage({ to: adminPhone, text: message });
    } catch (err) {
      console.error("[WHATSAPP SERVICE] sendAdminNewOrderAlert error:", err);
    }
  },

  /**
   * 2. Alert Vendor / Ads Seller on New Order for their products
   */
  async sendVendorNewOrderAlert(params: VendorNewOrderAlertParams): Promise<void> {
    try {
      if (!params.vendorPhone) {
        console.warn(`[WHATSAPP SERVICE] No phone number for vendor ${params.vendorName}`);
        return;
      }

      const itemsList = params.items
        .map((item) => {
          const variantText = item.variant ? ` (${item.variant})` : "";
          const itemTotal = (item.price * item.quantity).toLocaleString("en-LK", { minimumFractionDigits: 2 });
          return `• ${item.name}${variantText} x ${item.quantity} = Rs. ${itemTotal}`;
        })
        .join("\n");

      const dashboardPath = params.isAdsSeller
        ? `/ads-seller/orders/${params.orderId}`
        : `/vendor/orders/${params.orderId}`;

      const message =
        `🛍️ *TryMe.lk - You Have a New Order!*\n\n` +
        `Hello *${params.vendorName}*,\n` +
        `You have received a new confirmed order on TryMe.lk!\n\n` +
        `📋 *Order ID:* #${params.orderNumber}\n` +
        (params.city ? `📍 *Customer Delivery City:* ${params.city}\n\n` : "\n") +
        `🛒 *Your Items to Fulfill:*\n${itemsList}\n\n` +
        `💵 *Your Package Total:* Rs. ${params.totalAmount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}\n\n` +
        `Please log in to your dashboard to accept and process the shipment:\n` +
        `🔗 *View Order:* ${APP_URL}${dashboardPath}`;

      await this.sendMessage({ to: params.vendorPhone, text: message });
    } catch (err) {
      console.error("[WHATSAPP SERVICE] sendVendorNewOrderAlert error:", err);
    }
  },

  /**
   * 3. Alert Customer on Order Status Update (e.g. PROCESSING, SHIPPED, DELIVERED, CANCELLED)
   */
  async sendCustomerOrderStatusAlert(params: CustomerOrderStatusAlertParams): Promise<void> {
    try {
      if (!params.customerPhone) {
        return;
      }

      let headerEmoji = "📦";
      let statusHeading = "Order Update";
      let statusDescription = `Your order status has been updated to *${params.status.replace(/_/g, " ")}*.`;

      switch (params.status) {
        case "PAYMENT_CONFIRMED":
          headerEmoji = "🎉";
          statusHeading = "Payment Confirmed";
          statusDescription = "Your payment has been successfully confirmed. The sellers are preparing your items!";
          break;
        case "PROCESSING":
          headerEmoji = "⚙️";
          statusHeading = "Item Being Prepared";
          statusDescription = params.productName
            ? `Your item *"${params.productName}"* is now being packed and prepared for dispatch.`
            : "Your order is currently being prepared for dispatch.";
          break;
        case "SHIPPED":
          headerEmoji = "🚚";
          statusHeading = "Package Shipped";
          statusDescription = params.productName
            ? `Good news! Your item *"${params.productName}"* has been handed over to the courier.`
            : "Good news! Your order package has been shipped and is on the way.";
          break;
        case "DELIVERED":
        case "DELIVERY_CONFIRMED":
        case "COMPLETED":
          headerEmoji = "✅";
          statusHeading = "Package Delivered";
          statusDescription = "Your package has been successfully delivered. We hope you love your purchase!";
          break;
        case "CANCELLED":
          headerEmoji = "❌";
          statusHeading = "Order Cancelled";
          statusDescription = `Your order #${params.orderNumber} has been cancelled.` +
            (params.cancelReason ? ` Reason: ${params.cancelReason}` : "");
          break;
      }

      let courierDetails = "";
      if (params.trackingNumber || params.courierName) {
        courierDetails = `\n🚚 *Courier Tracking:*\n` +
          (params.courierName ? `• Courier: ${params.courierName}\n` : "") +
          (params.trackingNumber ? `• Tracking No: ${params.trackingNumber}\n` : "");
      }

      const orderTrackingLink = `${APP_URL}/orders/${params.orderId}`;

      const message =
        `${headerEmoji} *TryMe.lk - ${statusHeading}*\n\n` +
        `Hi *${params.customerName}*,\n\n` +
        `${statusDescription}\n\n` +
        `📋 *Order ID:* #${params.orderNumber}\n` +
        (params.vendorName ? `🏬 *Seller:* ${params.vendorName}\n` : "") +
        courierDetails +
        `\nTrack your order progress anytime here:\n` +
        `🔗 ${orderTrackingLink}\n\n` +
        `Thank you for shopping with TryMe.lk! 🛍️`;

      await this.sendMessage({ to: params.customerPhone, text: message });
    } catch (err) {
      console.error("[WHATSAPP SERVICE] sendCustomerOrderStatusAlert error:", err);
    }
  },
};
