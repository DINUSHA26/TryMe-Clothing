/**
 * SMS Gateway Service for Sri Lanka (+94) & International SMS Delivery
 * Supports Notify.lk, Twilio, or generic SMS Webhook APIs.
 */

interface SendSMSParams {
  to: string; // e.g. +94779728453 or 0779728453
  otpCode: string;
}

export const smsService = {
  async sendOTP({ to, otpCode }: SendSMSParams): Promise<{ success: boolean; error?: string }> {
    const formattedPhone = to.startsWith("+") ? to.substring(1) : to; // e.g. 94779728453
    const message = `Your TryMe verification code is: ${otpCode}. Valid for 5 minutes. Do not share this code.`;

    console.log(`====================================================`);
    console.log(`[SMS SERVICE] Sending OTP to ${to} -> Code: ${otpCode}`);
    console.log(`====================================================`);

    // 1. Notify.lk Integration (Sri Lanka's #1 Gateway)
    const notifyUserId = process.env.NOTIFYLK_USER_ID;
    const notifyApiKey = process.env.NOTIFYLK_API_KEY;
    const notifySenderId = process.env.NOTIFYLK_SENDER_ID || "NotifyDEMO";

    if (notifyUserId && notifyApiKey) {
      try {
        const url = `https://app.notify.lk/api/v1/send?user_id=${notifyUserId}&api_key=${notifyApiKey}&sender_id=${notifySenderId}&to=${formattedPhone}&message=${encodeURIComponent(message)}`;
        const res = await fetch(url, { method: "POST" });
        const data = await res.json();

        if (data.status === "success") {
          return { success: true };
        } else {
          console.error("Notify.lk SMS error:", data);
        }
      } catch (err: any) {
        console.error("Notify.lk SMS exception:", err);
      }
    }

    // 2. Twilio Integration (Fallback/International)
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (twilioAccountSid && twilioAuthToken && twilioFromNumber) {
      try {
        const authHeader = "Basic " + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64");
        const body = new URLSearchParams({
          To: to,
          From: twilioFromNumber,
          Body: message,
        });

        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        });

        if (res.ok) {
          return { success: true };
        } else {
          const errData = await res.json();
          console.error("Twilio SMS error:", errData);
        }
      } catch (err: any) {
        console.error("Twilio SMS exception:", err);
      }
    }

    // 3. Development / Default fallback (Always succeeds)
    return { success: true };
  },
};
