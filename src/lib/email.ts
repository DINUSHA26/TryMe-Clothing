import { Resend } from "resend";
import { getAppUrl } from "./env";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM && process.env.EMAIL_FROM !== "onboarding@resend.dev" ? process.env.EMAIL_FROM : "Try Me <otp@tryme.lk>";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Try Me";

export const emailService = {
  /**
   * Send OTP email for customer login
   */
  async sendOTPEmail(to: string, otp: string, expiryMinutes: number) {
    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `Your ${APP_NAME} Login Code`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Login Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">Your Login Code</h2>
              <p style="margin: 0 0 30px; color: #52525b; font-size: 16px; line-height: 1.5;">Use the code below to complete your login. This code will expire in ${expiryMinutes} minutes.</p>

              <!-- OTP Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 30px; background-color: #f4f4f5; border-radius: 8px;">
                    <div style="font-size: 36px; font-weight: 700; color: #18181b; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #71717a; font-size: 14px; line-height: 1.5;">If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send OTP email:", error);
        console.log(`\n\n================================`);
        console.log(`[DEV MODE] OTP FOR ${to}: ${otp}\n================================\n\n`);
        return { success: true, data: null };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error sending OTP email:", error);
      console.log(`\n\n================================`);
      console.log(`[DEV MODE] OTP FOR ${to}: ${otp}\n================================\n\n`);
      return { success: true, error };
    }
  },

  /**
   * Send welcome email to new vendor with credentials
   */
  async sendVendorWelcomeEmail(
    to: string,
    businessName: string,
    email: string,
    tempPassword: string
  ) {
    try {
      const loginUrl = `${getAppUrl()}/staff/login`;

      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `Welcome to ${APP_NAME} - Your Vendor Account`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">Welcome, ${businessName}!</h2>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Your vendor account has been created. You can now start selling on ${APP_NAME}.</p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 30px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
                    <p style="margin: 0 0 15px; color: #92400e; font-size: 14px; font-weight: 600;">Your Login Credentials:</p>
                    <p style="margin: 0 0 8px; color: #78350f; font-size: 14px;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 0; color: #78350f; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background-color: #ffffff; padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', monospace;">${tempPassword}</code></p>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">⚠️ <strong>Important:</strong> You will be required to change your password on your first login for security purposes.</p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Login to Your Account</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #71717a; font-size: 14px; line-height: 1.5;">If you have any questions or need assistance, please contact our support team.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send vendor welcome email:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error sending vendor welcome email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send password changed notification
   */
  async sendPasswordChangedEmail(to: string, userName: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${APP_NAME} - Password Changed`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">Password Changed</h2>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Hello ${userName},</p>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Your password has been successfully changed. If you made this change, no further action is required.</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;">⚠️ If you didn't make this change, please contact support immediately as your account may be compromised.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send password changed email:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error sending password changed email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send order payment confirmed email
   */
  async sendOrderPaymentConfirmedEmail(
    to: string,
    data: {
      customerName: string;
      orderNumber: string;
      amount: number;
      orderLink: string;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${APP_NAME} - Payment Confirmed for Order ${data.orderNumber}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">✓ Payment Confirmed</h2>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Hi ${data.customerName},</p>
              <p style="margin: 0 0 30px; color: #52525b; font-size: 16px; line-height: 1.5;">Your payment has been successfully processed! Your order is now being prepared.</p>

              <!-- Order Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px;">
                    <p style="margin: 0 0 8px; color: #166534; font-size: 14px;"><strong>Order Number:</strong> ${data.orderNumber}</p>
                    <p style="margin: 0; color: #166534; font-size: 14px;"><strong>Amount Paid:</strong> Rs. ${data.amount.toFixed(2)}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 30px 0 20px;">
                    <a href="${getAppUrl()}${data.orderLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Order Details</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">You'll receive updates as your order is processed and shipped.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send order payment confirmed email:", error);
        return { success: false, error };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Error sending order payment confirmed email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send order cancelled email
   */
  async sendOrderCancelledEmail(
    to: string,
    data: {
      customerName: string;
      orderNumber: string;
      refundAmount?: number;
      orderLink: string;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${APP_NAME} - Order ${data.orderNumber} Cancelled`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Cancelled</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">Order Cancelled</h2>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Hi ${data.customerName},</p>
              <p style="margin: 0 0 30px; color: #52525b; font-size: 16px; line-height: 1.5;">Your order <strong>${data.orderNumber}</strong> has been cancelled.</p>

              ${data.refundAmount
            ? `
              <!-- Refund Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>Refund Amount:</strong> Rs. ${data.refundAmount.toFixed(2)} has been credited to your wallet.</p>
                  </td>
                </tr>
              </table>
              `
            : ""
          }

              <p style="margin: 30px 0 0; color: #71717a; font-size: 14px; line-height: 1.5;">If you have any questions, please contact our support team.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send order cancelled email:", error);
        return { success: false, error };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Error sending order cancelled email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send order item shipped email
   */
  async sendOrderItemShippedEmail(
    to: string,
    data: {
      customerName: string;
      orderNumber: string;
      productName: string;
      vendorName: string;
      trackingNumber?: string;
      orderLink: string;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${APP_NAME} - Item Shipped for Order ${data.orderNumber}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Item Shipped</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">📦 Item Shipped!</h2>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Hi ${data.customerName},</p>
              <p style="margin: 0 0 30px; color: #52525b; font-size: 16px; line-height: 1.5;">Great news! ${data.vendorName} has shipped your order item.</p>

              <!-- Shipping Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px;">
                    <p style="margin: 0 0 8px; color: #166534; font-size: 14px;"><strong>Order:</strong> ${data.orderNumber}</p>
                    <p style="margin: 0 0 8px; color: #166534; font-size: 14px;"><strong>Product:</strong> ${data.productName}</p>
                    ${data.trackingNumber
            ? `<p style="margin: 0; color: #166534; font-size: 14px;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>`
            : ""
          }
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 30px 0 20px;">
                    <a href="${getAppUrl()}${data.orderLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Track Order</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">Your order is on its way! You'll receive it soon.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send order item shipped email:", error);
        return { success: false, error };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Error sending order item shipped email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send order item processing email
   */
  async sendOrderItemProcessingEmail(
    to: string,
    data: {
      customerName: string;
      orderNumber: string;
      productName: string;
      vendorName: string;
      orderLink: string;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${APP_NAME} - Order Item Being Processed`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Item Processing</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">Order Item Being Processed</h2>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Hi ${data.customerName},</p>
              <p style="margin: 0 0 30px; color: #52525b; font-size: 16px; line-height: 1.5;">Good news! Your order item is now being prepared for shipment.</p>

              <!-- Order Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px;">
                    <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px;"><strong>Order Number:</strong> ${data.orderNumber}</p>
                    <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px;"><strong>Product:</strong> ${data.productName}</p>
                    <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>Vendor:</strong> ${data.vendorName}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 30px 0 20px;">
                    <a href="${getAppUrl()}${data.orderLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Order</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">You'll receive a shipping notification once the item is dispatched.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send order item processing email:", error);
        return { success: false, error };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Error sending order item processing email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send order delivery confirmed email
   */
  async sendOrderDeliveryConfirmedEmail(
    to: string,
    data: {
      customerName: string;
      orderNumber: string;
      orderLink: string;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${APP_NAME} - Thank You for Confirming Delivery`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Delivery Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">✓ Delivery Confirmed</h2>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Hi ${data.customerName},</p>
              <p style="margin: 0 0 30px; color: #52525b; font-size: 16px; line-height: 1.5;">Thank you for confirming the delivery of your order <strong>${data.orderNumber}</strong>. We hope you're satisfied with your purchase!</p>

              <!-- Success Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px;">
                    <p style="margin: 0; color: #166534; font-size: 14px;">Funds have been released to the vendor. Your order is now complete.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 30px 0 20px;">
                    <a href="${getAppUrl()}${data.orderLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Leave a Review</a>
                  </td>
                </tr>
              </table>

              <!-- Return Info -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: #fef9ec; border-left: 4px solid #f59e0b; border-radius: 8px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Return Policy:</strong> You can request a return within 24 hours if there's an issue with your order.</p>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #71717a; font-size: 14px; line-height: 1.5;">We appreciate your business and look forward to serving you again!</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send order delivery confirmed email:", error);
        return { success: false, error };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Error sending order delivery confirmed email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send order return requested email
   */
  async sendOrderReturnRequestedEmail(
    to: string,
    data: {
      recipientName: string;
      orderNumber: string;
      reason: string;
      orderLink: string;
      isVendor?: boolean;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${APP_NAME} - Return Request ${data.isVendor ? "Received" : "Submitted"}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Return Request ${data.isVendor ? "Received" : "Submitted"}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">Return Request ${data.isVendor ? "Received" : "Submitted"}</h2>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Hi ${data.recipientName},</p>
              <p style="margin: 0 0 30px; color: #52525b; font-size: 16px; line-height: 1.5;">
                ${data.isVendor
            ? "A customer has requested a return for an order."
            : "Your return request has been submitted successfully."
          }
              </p>

              <!-- Return Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: #fef9ec; border-left: 4px solid #f59e0b; border-radius: 8px;">
                    <p style="margin: 0 0 8px; color: #92400e; font-size: 14px;"><strong>Order Number:</strong> ${data.orderNumber}</p>
                    <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Reason:</strong> ${data.reason}</p>
                  </td>
                </tr>
              </table>

              ${data.isVendor
            ? `
              <!-- Vendor Instructions -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px;">Please review the return request and coordinate with the customer regarding return shipping arrangements.</p>
                  </td>
                </tr>
              </table>
              `
            : `
              <!-- Customer Instructions -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>Note:</strong> Return shipping costs are to be paid by the customer. The vendor will contact you with return instructions.</p>
                  </td>
                </tr>
              </table>
              `
          }

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 30px 0 20px;">
                    <a href="${getAppUrl()}${data.orderLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Details</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">If you have any questions, please contact our support team.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send order return requested email:", error);
        return { success: false, error };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Error sending order return requested email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send dispute created email
   */
  async sendDisputeCreatedEmail(
    to: string,
    data: {
      recipientName: string;
      orderNumber: string;
      reason: string;
      disputeLink: string;
      isAdmin?: boolean;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${APP_NAME} - ${data.isAdmin ? "New Dispute Filed" : "Dispute Submitted"} for Order ${data.orderNumber}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dispute ${data.isAdmin ? "Filed" : "Submitted"}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">${data.isAdmin ? "⚠️ New Dispute Filed" : "Dispute Submitted"}</h2>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Hi ${data.recipientName},</p>
              <p style="margin: 0 0 30px; color: #52525b; font-size: 16px; line-height: 1.5;">${data.isAdmin
            ? `A dispute has been filed for Order ${data.orderNumber}. Immediate review required.`
            : `Your dispute for Order ${data.orderNumber} has been submitted and is under review.`
          }</p>

              <!-- Dispute Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px;">
                    <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px;"><strong>Order Number:</strong> ${data.orderNumber}</p>
                    <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Reason:</strong> ${data.reason}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 30px 0 20px;">
                    <a href="${getAppUrl()}${data.disputeLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Dispute</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">${data.isAdmin
            ? "Please review this dispute at your earliest convenience."
            : "We'll review your dispute and get back to you soon."
          }</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send dispute created email:", error);
        return { success: false, error };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Error sending dispute created email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send dispute resolved email
   */
  async sendDisputeResolvedEmail(
    to: string,
    data: {
      recipientName: string;
      orderNumber: string;
      resolutionType: string;
      refundAmount?: number;
      disputeLink: string;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${APP_NAME} - Dispute Resolved for Order ${data.orderNumber}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dispute Resolved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">Dispute Resolved</h2>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Hi ${data.recipientName},</p>
              <p style="margin: 0 0 30px; color: #52525b; font-size: 16px; line-height: 1.5;">Your dispute for Order ${data.orderNumber} has been resolved.</p>

              <!-- Resolution Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: ${data.refundAmount ? "#f0fdf4" : "#eff6ff"
          }; border-left: 4px solid ${data.refundAmount ? "#22c55e" : "#3b82f6"
          }; border-radius: 8px;">
                    <p style="margin: 0 0 8px; color: ${data.refundAmount ? "#166534" : "#1e40af"
          }; font-size: 14px;"><strong>Resolution:</strong> ${data.resolutionType}</p>
                    ${data.refundAmount
            ? `<p style="margin: 0; color: #166534; font-size: 14px;"><strong>Refund Amount:</strong> Rs. ${data.refundAmount.toFixed(2)} credited to your wallet</p>`
            : ""
          }
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 30px 0 20px;">
                    <a href="${getAppUrl()}${data.disputeLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Details</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">Thank you for your patience while we reviewed this matter.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send dispute resolved email:", error);
        return { success: false, error };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Error sending dispute resolved email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send payout approved email
   */
  async sendPayoutApprovedEmail(
    to: string,
    data: {
      vendorName: string;
      amount: number;
      bankName: string;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${APP_NAME} - Payout Approved`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payout Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">✓ Payout Approved</h2>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Hi ${data.vendorName},</p>
              <p style="margin: 0 0 30px; color: #52525b; font-size: 16px; line-height: 1.5;">Great news! Your payout request has been approved and is being processed.</p>

              <!-- Payout Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px;">
                    <p style="margin: 0 0 8px; color: #166534; font-size: 14px;"><strong>Amount:</strong> Rs. ${data.amount.toFixed(2)}</p>
                    <p style="margin: 0; color: #166534; font-size: 14px;"><strong>Bank:</strong> ${data.bankName}</p>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #71717a; font-size: 14px; line-height: 1.5;">Funds will be transferred shortly. You'll receive a confirmation once the transfer is complete.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send payout approved email:", error);
        return { success: false, error };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Error sending payout approved email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send payout completed email
   */
  async sendPayoutCompletedEmail(
    to: string,
    data: {
      vendorName: string;
      amount: number;
      transactionRef: string;
      bankName: string;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${APP_NAME} - Payout Completed`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payout Completed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">🎉 Payout Completed</h2>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Hi ${data.vendorName},</p>
              <p style="margin: 0 0 30px; color: #52525b; font-size: 16px; line-height: 1.5;">Your payout has been successfully transferred!</p>

              <!-- Payout Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px;">
                    <p style="margin: 0 0 8px; color: #166534; font-size: 14px;"><strong>Amount:</strong> Rs. ${data.amount.toFixed(2)}</p>
                    <p style="margin: 0 0 8px; color: #166534; font-size: 14px;"><strong>Bank:</strong> ${data.bankName}</p>
                    <p style="margin: 0; color: #166534; font-size: 14px;"><strong>Reference:</strong> ${data.transactionRef}</p>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #71717a; font-size: 14px; line-height: 1.5;">Please allow 1-2 business days for the funds to appear in your account.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send payout completed email:", error);
        return { success: false, error };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Error sending payout completed email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send payout failed email
   */
  async sendPayoutFailedEmail(
    to: string,
    data: {
      vendorName: string;
      amount: number;
      failureReason: string;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${APP_NAME} - Payout Failed`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payout Failed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">Payout Failed</h2>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Hi ${data.vendorName},</p>
              <p style="margin: 0 0 30px; color: #52525b; font-size: 16px; line-height: 1.5;">Unfortunately, your payout request could not be processed.</p>

              <!-- Failure Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px;">
                    <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px;"><strong>Amount:</strong> Rs. ${data.amount.toFixed(2)}</p>
                    <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Reason:</strong> ${data.failureReason}</p>
                  </td>
                </tr>
              </table>

              <!-- Refund Info -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px;">The amount has been returned to your available balance. You can try requesting a payout again or contact support for assistance.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send payout failed email:", error);
        return { success: false, error };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Error sending payout failed email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send vendor approval email
   */
  async sendVendorApprovalEmail(to: string, businessName: string) {
    try {
      const dashboardUrl = `${getAppUrl()}/vendor`;

      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `Congratulations! Your Vendor Account is Active`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vendor Account Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">Congratulations, ${businessName}!</h2>
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.5;">Your vendor account has been verified and approved by our team. You now have full access to your vendor dashboard.</p>

              <!-- Success Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 30px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px;">
                    <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600;">What's next?</p>
                    <ul style="margin: 15px 0 0; padding: 0 0 0 20px; color: #15803d; font-size: 14px;">
                      <li style="margin-bottom: 8px;">Access your Vendor Dashboard</li>
                      <li style="margin-bottom: 8px;">List your first product</li>
                      <li style="margin-bottom: 8px;">Set up your store profile (logo, banner, etc.)</li>
                      <li>Start receiving orders!</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 30px 0 20px;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">We're excited to have you on board! If you have any questions, our support team is always here to help.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; text-align: center; color: #a1a1aa; font-size: 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });

      if (error) {
        console.error("Failed to send vendor approval email:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error sending vendor approval email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send Welcome/Approval email to new Ads Seller
   */
  async sendAdsSellerWelcomeEmail(to: string, businessName: string, email: string) {
    try {
      const loginUrl = `${getAppUrl()}/staff/login`;
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `Welcome to ${APP_NAME} - Your Ads Seller Account Approved`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to ${APP_NAME}</title>
</head>
<body style="font-family: sans-serif; padding: 20px; background: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid #e4e4e7;">
    <h2 style="color: #FF6600;">Account Approved!</h2>
    <p>Dear ${businessName || "Ads Seller"},</p>
    <p>We are pleased to inform you that your Ads Seller registration has been approved by the administrators.</p>
    <p>You can now log in and start publishing your classified ads on our marketplace.</p>
    <div style="background: #f4f4f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 5px;"><strong>Your Login Credentials:</strong></p>
      <p style="margin: 0 0 5px;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 0;"><strong>Staff Login Portal:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
    </div>
    <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background: #FF6600; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Login Now</a>
    <p style="margin-top: 30px; font-size: 12px; color: #71717a;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
  </div>
</body>
</html>
        `,
      });
      if (error) return { success: false, error };
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Send Registration Received email to Ads Seller
   */
  async sendAdsSellerRegistrationEmail(to: string, businessName: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${APP_NAME} - Ads Seller Registration Received`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Registration Under Review</title>
</head>
<body style="font-family: sans-serif; padding: 20px; background: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid #e4e4e7;">
    <h2 style="color: #FF6600;">Registration Received</h2>
    <p>Dear ${businessName || "Ads Seller"},</p>
    <p>Thank you for registering to become an Ads Seller on ${APP_NAME}.</p>
    <p>Your application is currently under review by our moderation team. You will receive an email notification as soon as your account is activated (usually within 24 hours).</p>
    <p>If you have any questions, feel free to contact us.</p>
    <p style="margin-top: 30px; font-size: 12px; color: #71717a;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
  </div>
</body>
</html>
        `,
      });
      if (error) return { success: false, error };
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Send Ad Approved notification
   */
  async sendAdApprovedEmail(to: string, sellerName: string, adTitle: string, adId: string) {
    try {
      const adUrl = `${getAppUrl()}/marketplace/${adId}`;
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${APP_NAME} - Your Ad is Live!`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ad Approved</title>
</head>
<body style="font-family: sans-serif; padding: 20px; background: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid #e4e4e7;">
    <h2 style="color: #22c55e;">Your Ad is Live!</h2>
    <p>Hello ${sellerName},</p>
    <p>Good news! Your classified ad <strong>"${adTitle}"</strong> has been approved and is now live on our marketplace.</p>
    <a href="${adUrl}" style="display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">View Ad on Marketplace</a>
    <p style="margin-top: 30px; font-size: 12px; color: #71717a;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
  </div>
</body>
</html>
        `,
      });
      if (error) return { success: false, error };
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Send Ad Rejected notification
   */
  async sendAdRejectedEmail(to: string, sellerName: string, adTitle: string, reason: string) {
    try {
      const dashboardUrl = `${getAppUrl()}/ads-seller/my-ads`;
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `${APP_NAME} - Action Required: Your Ad was Rejected`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ad Rejected</title>
</head>
<body style="font-family: sans-serif; padding: 20px; background: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid #e4e4e7;">
    <h2 style="color: #ef4444;">Ad Review Completed</h2>
    <p>Hello ${sellerName},</p>
    <p>Your classified ad <strong>"${adTitle}"</strong> was reviewed and unfortunately, could not be approved for publication.</p>
    <div style="background: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 5px; color: #ef4444; font-weight: bold;">Reason for rejection:</p>
      <p style="margin: 0; color: #991b1b;">${reason || "Violation of marketplace guidelines"}</p>
    </div>
    <p>You can edit your ad and submit it again for approval by visiting your dashboard.</p>
    <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
    <p style="margin-top: 30px; font-size: 12px; color: #71717a;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
  </div>
</body>
</html>
        `,
      });
      if (error) return { success: false, error };
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Send new order notification to a vendor
   */
  async sendVendorNewOrderEmail(
    to: string,
    data: {
      vendorName: string;
      orderNumber: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      totalAmount: number;
      customerName: string;
      orderLink: string;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `New Order Received - ${data.orderNumber}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order Received</title>
</head>
<body style="font-family: sans-serif; padding: 20px; background: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid #e4e4e7;">
    <h2 style="color: #667eea;">New Order Received!</h2>
    <p>Dear ${data.vendorName},</p>
    <p>You have received a new order <strong>${data.orderNumber}</strong> from ${data.customerName}.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="border-bottom: 2px solid #e4e4e7; text-align: left;">
          <th style="padding: 8px 0;">Product</th>
          <th style="padding: 8px 0; text-align: center;">Qty</th>
          <th style="padding: 8px 0; text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map(item => `
          <tr style="border-bottom: 1px solid #e4e4e7;">
            <td style="padding: 8px 0;">${item.name}</td>
            <td style="padding: 8px 0; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px 0; text-align: right;">Rs. ${item.price.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div style="background: #f4f4f5; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: right;">
      <p style="margin: 0;"><strong>Total Vendor Earnings:</strong> Rs. ${data.totalAmount.toFixed(2)}</p>
    </div>
    
    <p>Please log in to your dashboard to begin processing this order.</p>
    <a href="${getAppUrl()}${data.orderLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View Order in Dashboard</a>
    <p style="margin-top: 30px; font-size: 12px; color: #71717a;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
  </div>
</body>
</html>
        `,
      });
      if (error) return { success: false, error };
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Send new order notification to administrators
   */
  async sendAdminNewOrderEmail(
    to: string,
    data: {
      orderNumber: string;
      totalAmount: number;
      customerName: string;
      vendorNames: string[];
      orderLink: string;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `[Admin] New Order Placed - ${data.orderNumber}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order Placed</title>
</head>
<body style="font-family: sans-serif; padding: 20px; background: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid #e4e4e7;">
    <h2 style="color: #764ba2;">New Platform Order</h2>
    <p>Hello Admin,</p>
    <p>A new order <strong>${data.orderNumber}</strong> has been successfully paid and confirmed on the platform.</p>
    
    <div style="background: #f4f4f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 8px;"><strong>Customer:</strong> ${data.customerName}</p>
      <p style="margin: 0 0 8px;"><strong>Total Amount:</strong> Rs. ${data.totalAmount.toFixed(2)}</p>
      <p style="margin: 0;"><strong>Vendors Involved:</strong> ${data.vendorNames.join(', ')}</p>
    </div>
    
    <a href="${getAppUrl()}${data.orderLink}" style="display: inline-block; padding: 12px 24px; background: #18181b; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Manage Order</a>
    <p style="margin-top: 30px; font-size: 12px; color: #71717a;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
  </div>
</body>
</html>
        `,
      });
      if (error) return { success: false, error };
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Send order completion notification to a vendor (when escrow funds are released)
   */
  async sendVendorOrderCompletedEmail(
    to: string,
    data: {
      vendorName: string;
      orderNumber: string;
      productName: string;
      amountReleased: number;
      walletLink: string;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `Payout Released for Order ${data.orderNumber}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Escrow Funds Released</title>
</head>
<body style="font-family: sans-serif; padding: 20px; background: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid #e4e4e7;">
    <h2 style="color: #22c55e;">Escrow Funds Released!</h2>
    <p>Dear ${data.vendorName},</p>
    <p>The delivery for order item <strong>"${data.productName}"</strong> under order <strong>${data.orderNumber}</strong> has been confirmed.</p>
    <p>Escrow funds have been successfully released and credited to your available wallet balance.</p>
    
    <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 8px; color: #166534;"><strong>Order Number:</strong> ${data.orderNumber}</p>
      <p style="margin: 0; color: #166534;"><strong>Amount Released:</strong> Rs. ${data.amountReleased.toFixed(2)}</p>
    </div>
    
    <a href="${getAppUrl()}${data.walletLink}" style="display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View Wallet Balance</a>
    <p style="margin-top: 30px; font-size: 12px; color: #71717a;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
  </div>
</body>
</html>
        `,
      });
      if (error) return { success: false, error };
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Send order completion notification to administrators
   */
  async sendAdminOrderCompletedEmail(
    to: string,
    data: {
      orderNumber: string;
      totalAmount: number;
      customerName: string;
      orderLink: string;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `[Admin] Order Completed - ${data.orderNumber}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Completed</title>
</head>
<body style="font-family: sans-serif; padding: 20px; background: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid #e4e4e7;">
    <h2 style="color: #22c55e;">Order Completed</h2>
    <p>Hello Admin,</p>
    <p>Order <strong>${data.orderNumber}</strong> has been successfully completed. Escrow funds have been released to the vendor(s).</p>
    
    <div style="background: #f4f4f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 8px;"><strong>Customer:</strong> ${data.customerName}</p>
      <p style="margin: 0;"><strong>Total Value:</strong> Rs. ${data.totalAmount.toFixed(2)}</p>
    </div>
    
    <a href="${getAppUrl()}${data.orderLink}" style="display: inline-block; padding: 12px 24px; background: #18181b; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View Order Details</a>
    <p style="margin-top: 30px; font-size: 12px; color: #71717a;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
  </div>
</body>
</html>
        `,
      });
      if (error) return { success: false, error };
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Send order cancelled notification to a vendor
   */
  async sendVendorOrderCancelledEmail(
    to: string,
    data: {
      vendorName: string;
      orderNumber: string;
      productName: string;
      reason?: string;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `Order Cancelled - ${data.orderNumber}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Cancelled</title>
</head>
<body style="font-family: sans-serif; padding: 20px; background: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid #e4e4e7;">
    <h2 style="color: #ef4444;">Order Cancelled</h2>
    <p>Dear ${data.vendorName},</p>
    <p>We regret to inform you that order <strong>${data.orderNumber}</strong> has been cancelled.</p>
    <p>Please stop processing the item: <strong>"${data.productName}"</strong>.</p>
    
    ${data.reason ? `
    <div style="background: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #991b1b;"><strong>Reason for cancellation:</strong> ${data.reason}</p>
    </div>
    ` : ''}
    
    <p>If you have already shipped this item, please contact our support team immediately.</p>
    <p style="margin-top: 30px; font-size: 12px; color: #71717a;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
  </div>
</body>
</html>
        `,
      });
      if (error) return { success: false, error };
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Send order cancelled notification to administrators
   */
  async sendAdminOrderCancelledEmail(
    to: string,
    data: {
      orderNumber: string;
      totalAmount: number;
      customerName: string;
      reason?: string;
      orderLink: string;
    }
  ) {
    try {
      const { data: result, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject: `[Admin] Order Cancelled - ${data.orderNumber}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Cancelled</title>
</head>
<body style="font-family: sans-serif; padding: 20px; background: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid #e4e4e7;">
    <h2 style="color: #ef4444;">Order Cancelled</h2>
    <p>Hello Admin,</p>
    <p>Order <strong>${data.orderNumber}</strong> has been cancelled.</p>
    
    <div style="background: #f4f4f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 8px;"><strong>Customer:</strong> ${data.customerName}</p>
      <p style="margin: 0 0 8px;"><strong>Total Value:</strong> Rs. ${data.totalAmount.toFixed(2)}</p>
      ${data.reason ? `<p style="margin: 0;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
    </div>
    
    <a href="${getAppUrl()}${data.orderLink}" style="display: inline-block; padding: 12px 24px; background: #18181b; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details</a>
    <p style="margin-top: 30px; font-size: 12px; color: #71717a;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
  </div>
</body>
</html>
        `,
      });
      if (error) return { success: false, error };
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  },
};
