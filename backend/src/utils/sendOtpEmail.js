/**
 * OTP Email Utility for GreenReceipt
 * 
 * Sends OTP emails for email verification and password reset using SendGrid.
 * Uses the existing sendEmail utility for actual delivery.
 */

import { sendEmail } from "./sendEmail.js";
import { OTP_CONFIG } from "./otp.js";

/**
 * Send OTP email for verification or password reset
 * 
 * @param {Object} options
 * @param {string} options.email - Recipient email address
 * @param {string} options.otp - The 6-digit OTP code
 * @param {string} options.purpose - "verify" for email verification, "reset" for password reset
 * @param {string} [options.name] - Optional recipient name for personalization
 * @returns {Promise<void>}
 */
export const sendOtpEmail = async ({ email, otp, purpose, name }) => {
  const validityMinutes = OTP_CONFIG.EXPIRY_MINUTES;
  
  // Configure email based on purpose
  const config = purpose === "verify" 
    ? {
        subject: "Verify your GreenReceipt account 🔐",
        heading: "Verify your email",
        description: "Use the verification code below to complete your GreenReceipt registration.",
        ctaText: "Enter this code to verify your email",
        headerColor: "#10b981", // Green for verification
        headerEmoji: "🔐",
      }
    : {
        subject: "Reset your GreenReceipt password 🔑",
        heading: "Password Reset",
        description: "We received a request to reset your password. Use the code below to set a new password.",
        ctaText: "Enter this code to reset your password",
        headerColor: "#f59e0b", // Amber for reset
        headerEmoji: "🔑",
      };

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, ${config.headerColor} 0%, ${adjustColor(config.headerColor, -20)} 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
          ${config.headerEmoji} GreenReceipt
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
          ${config.heading}
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px; background: #ffffff;">
        ${name ? `<p style="color: #1e293b; font-size: 16px; margin: 0 0 15px 0;">Hi ${name},</p>` : ''}
        
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
          ${config.description}
        </p>
        
        <!-- OTP Box -->
        <div style="background: #f8fafc; border: 2px dashed ${config.headerColor}; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <p style="color: #64748b; font-size: 13px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">
            Your verification code
          </p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: 'Courier New', monospace;">
            ${otp}
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0 0;">
            Valid for ${validityMinutes} minutes
          </p>
        </div>
        
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
          ${config.ctaText}
        </p>
        
        <!-- Security Notice -->
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 8px 8px 0; margin-top: 25px;">
          <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
            <strong>⚠️ Security tip:</strong> Never share this code with anyone. 
            GreenReceipt will never ask for this code via phone or chat.
          </p>
        </div>
        
        <p style="color: #94a3b8; font-size: 13px; margin: 25px 0 0 0; text-align: center;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} GreenReceipt. All rights reserved.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0 0;">
          Secure • Private • Paperless 🌿
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: config.subject,
    html,
  });
};

/**
 * Adjust hex color brightness
 * @param {string} hex - Hex color (e.g., "#10b981")
 * @param {number} percent - Negative for darker, positive for lighter
 * @returns {string} - Adjusted hex color
 */
function adjustColor(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

export default sendOtpEmail;
