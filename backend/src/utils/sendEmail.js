/**
 * SendGrid Email Utility for GreenReceipt
 * 
 * WHY SENDGRID (Backend Only):
 * - SendGrid is a backend-only service for security (API keys must never be exposed to frontend)
 * - More reliable than Gmail SMTP for production (no rate limits, better deliverability)
 * - Proper sender authentication prevents emails going to spam
 * 
 * WHY EMAIL FAILURES SHOULD NOT CRASH THE API:
 * - User experience: Signup/receipt should succeed even if email fails
 * - Retry logic: Emails can be retried later via background jobs
 * - Resilience: Network issues shouldn't block core functionality
 */

import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key from environment
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Core email sending function - reusable across all email types
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML content of the email
 * @returns {Promise<void>}
 */
export const sendEmail = async ({ to, subject, html }) => {
  // Skip if SendGrid is not configured (development/testing)
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.log("[Email] SendGrid not configured, skipping email to:", to);
    return;
  }

  const message = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: "GreenReceipt"
    },
    subject,
    html
  };

  try {
    await sgMail.send(message);
    console.log("[Email] ✅ Sent successfully to:", to);
  } catch (error) {
    // Log detailed error for debugging but don't crash the application
    console.error("[Email] ❌ SendGrid Error:", error.response?.body || error.message);
    throw error; // Re-throw so caller can handle (but should use try-catch)
  }
};

/**
 * Send welcome email after customer signup
 * @param {string} email - Customer's email
 * @param {string} name - Customer's name
 */
export const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
          🌱 GreenReceipt
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
          Your Digital Receipt Companion
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 30px; background: #ffffff;">
        <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">
          Welcome, ${name}! 👋
        </h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Your account has been created successfully. You're now part of the paperless revolution!
        </p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0;">
          <h3 style="color: #166534; margin: 0 0 10px 0; font-size: 16px;">
            🧾 What you can do now:
          </h3>
          <ul style="color: #166534; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Scan QR codes to save receipts instantly</li>
            <li>Track all your purchases in one place</li>
            <li>Get spending insights and analytics</li>
            <li>Help save trees with every digital receipt</li>
          </ul>
        </div>
        
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
          If you have any questions, just reply to this email. We're here to help!
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
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
    subject: "Welcome to GreenReceipt 🌱",
    html
  });
};

/**
 * Send welcome email after merchant signup
 * @param {string} email - Merchant's email
 * @param {string} shopName - Shop name
 */
export const sendMerchantWelcomeEmail = async (email, shopName) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
          🏪 GreenReceipt
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
          Merchant Portal
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 30px; background: #ffffff;">
        <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">
          Welcome, ${shopName}! 🎉
        </h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Your merchant account is ready. Start generating digital receipts for your customers today!
        </p>
        
        <div style="background: #f1f5f9; border-left: 4px solid #1e293b; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0;">
          <h3 style="color: #1e293b; margin: 0 0 10px 0; font-size: 16px;">
            🚀 Get started:
          </h3>
          <ul style="color: #334155; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Complete your shop profile</li>
            <li>Add your menu/inventory items</li>
            <li>Generate QR receipts for customers</li>
            <li>Track sales and analytics</li>
          </ul>
        </div>
        
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
          Need help setting up? Reply to this email and we'll assist you.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} GreenReceipt. All rights reserved.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0 0;">
          Grow your business, save the planet 🌿
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Welcome to GreenReceipt Merchant Portal 🏪",
    html
  });
};

/**
 * Send digital receipt email to customer after purchase
 * @param {Object} options - Receipt details
 * @param {string} options.to - Customer email
 * @param {string} options.customerName - Customer name
 * @param {string} options.merchantName - Shop name
 * @param {number} options.total - Total amount
 * @param {string} options.date - Transaction date
 * @param {Array} options.items - List of items purchased
 * @param {string} options.paymentMethod - Payment method used
 */
export const sendReceiptEmail = async ({ to, customerName, merchantName, total, date, items = [], paymentMethod }) => {
  const itemsHtml = items.length > 0 
    ? items.map(item => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #334155;">
            ${item.name || item.n || 'Item'}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; text-align: center;">
            ${item.quantity || item.qty || item.q || 1}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #334155; text-align: right;">
            ₹${((item.unitPrice || item.price || item.p || 0) * (item.quantity || item.qty || item.q || 1)).toFixed(2)}
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="3" style="padding: 12px 0; color: #64748b; text-align: center;">No items</td></tr>';

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
          🧾 Your Digital Receipt
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
          from ${merchantName}
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px; background: #ffffff;">
        <p style="color: #475569; font-size: 15px; margin: 0 0 25px 0;">
          Hi ${customerName || 'Customer'}, thanks for your purchase! Here's your receipt:
        </p>
        
        <!-- Receipt Details -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="color: #64748b; padding: 8px 0;">Date</td>
              <td style="color: #1e293b; text-align: right; font-weight: 600;">${date || new Date().toLocaleDateString('en-IN')}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 8px 0;">Payment</td>
              <td style="color: #1e293b; text-align: right; font-weight: 600; text-transform: uppercase;">${paymentMethod || 'N/A'}</td>
            </tr>
          </table>
        </div>
        
        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0;">
              <th style="text-align: left; padding: 12px 0; color: #64748b; font-weight: 600;">Item</th>
              <th style="text-align: center; padding: 12px 0; color: #64748b; font-weight: 600;">Qty</th>
              <th style="text-align: right; padding: 12px 0; color: #64748b; font-weight: 600;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <!-- Total -->
        <div style="background: #10b981; color: #ffffff; padding: 20px; border-radius: 12px; text-align: center;">
          <p style="margin: 0 0 5px 0; font-size: 14px; opacity: 0.9;">Total Amount</p>
          <p style="margin: 0; font-size: 32px; font-weight: 700;">₹${total?.toFixed(2) || '0.00'}</p>
        </div>
        
        <p style="color: #64748b; font-size: 13px; text-align: center; margin: 25px 0 0 0;">
          This receipt is saved securely in your GreenReceipt account 🌱
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} GreenReceipt • Secure • Private • Paperless 🌿
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Receipt from ${merchantName} - ₹${total?.toFixed(2) || '0.00'} 🧾`,
    html
  });
};

/**
 * Send OTP email for verification (kept for future use)
 * @param {string} email - Recipient email
 * @param {string} code - OTP code
 */
export const sendOtpEmail = async (email, code) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
      <!-- Header -->
      <div style="text-align: center; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-size: 24px; font-weight: 800; color: #10b981;">
          GreenReceipt
        </div>
        <div style="font-size: 13px; color: #64748b; margin-top: 6px;">
          Secure verification code
        </div>
      </div>

      <!-- Content -->
      <div style="padding: 20px 0;">
        <h2 style="font-size: 20px; margin: 0 0 10px 0; color: #0f172a;">
          Verify your email
        </h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 14px 0;">
          Use the verification code below to confirm your GreenReceipt account.
          This code is valid for <strong>10 minutes</strong>.
        </p>

        <!-- OTP Box -->
        <div style="background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #166534;">
            ${code}
          </div>
        </div>

        <p style="font-size: 13px; color: #64748b; margin: 0;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
          © ${new Date().getFullYear()} GreenReceipt. All rights reserved.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Your GreenReceipt Verification Code 🔐",
    html
  });
};

/**
 * Send verification email with link (kept for future use)
 * @param {string} email - Recipient email
 * @param {string} link - Verification link
 */
export const sendVerificationEmail = async (email, link) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
      <div style="background: #10b981; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">GreenReceipt</h1>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #1e293b; margin: 0 0 15px 0;">Verify your email</h2>
        <p style="color: #475569; line-height: 1.6;">
          Click the button below to verify your email address and activate your account.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="display: inline-block; padding: 14px 30px; background: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Verify Email
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">
          This link will expire in 10 minutes. If you didn't create an account, ignore this email.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Verify your GreenReceipt account ✅",
    html
  });
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetLink - Password reset link
 */
export const sendPasswordResetEmail = async (email, resetLink) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
      <div style="background: #f59e0b; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔑 Password Reset</h1>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #1e293b; margin: 0 0 15px 0;">Reset your password</h2>
        <p style="color: #475569; line-height: 1.6;">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; padding: 14px 30px; background: #f59e0b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Reset Password
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">
          This link expires in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Reset your GreenReceipt password 🔑",
    html
  });
};
// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// export const sendVerificationEmail = async (email, link) => {
//   await transporter.sendMail({
//     from: `"GreenReceipt" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Verify your GreenReceipt account",
//     html: `
//       <h2>Welcome to GreenReceipt 🌱</h2>
//       <p>Please verify your email to activate your account.</p>
//       <a href="${link}" style="padding:10px 20px;background:#16A34A;color:white;border-radius:6px;text-decoration:none;">
//         Verify Email
//       </a>
//       <p>This link will expire in 10 minutes.</p>
//     `,
//   });
// };

// export const sendOtpEmail = async (email, code) => {
//   await transporter.sendMail({
//     from: `"GreenReceipt" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Your GreenReceipt verification code",
//     html: `
//       <div style="font-family:Arial, Helvetica, sans-serif; max-width:520px; margin:0 auto; padding:24px; border:1px solid #e5e7eb; border-radius:12px; background:#ffffff; color:#0f172a;">

//   <!-- Header -->
//   <header style="text-align:center; padding-bottom:16px; border-bottom:1px solid #e5e7eb;">
//     <div style="font-size:24px; font-weight:800; color:#16a34a; letter-spacing:0.5px;">
//       GreenReceipt
//     </div>
//     <div style="font-size:13px; color:#64748b; margin-top:6px;">
//       Secure verification code
//     </div>
//   </header>

//   <!-- Main Content -->
//   <main style="padding:20px 0;">
//     <h2 style="font-size:20px; margin:0 0 10px 0; color:#0f172a;">
//       Verify your email
//     </h2>

//     <p style="font-size:14px; line-height:1.6; color:#475569; margin:0 0 14px 0;">
//       Use the verification code below to confirm your GreenReceipt account.
//       This code is valid for <strong>10 minutes</strong>.
//     </p>

//     <!-- OTP Box -->
//     <div style="background:#f8fafc; border:1px dashed #16a34a; border-radius:10px; padding:16px; margin:20px 0; text-align:center;">
//       <div style="font-size:30px; font-weight:800; letter-spacing:8px; color:#0f172a;">
//         ${code}
//       </div>
//     </div>

//     <p style="font-size:13px; line-height:1.6; color:#475569; margin:0 0 12px 0;">
//       If you didn’t request this code, you can safely ignore this email.
//       Your account security is not affected.
//     </p>

//     <p style="font-size:13px; line-height:1.6; color:#475569; margin:0;">
//       Need help? Contact us at
//       <a href="mailto:support@greenreceipt.com" style="color:#16a34a; text-decoration:none; font-weight:600;">
//         support@greenreceipt.com
//       </a>
//     </p>
//   </main>

//   <!-- Footer -->
//   <footer style="text-align:center; padding-top:16px; border-top:1px solid #e5e7eb;">
//     <p style="font-size:12px; color:#94a3b8; margin:0;">
//       © ${new Date().getFullYear()} GreenReceipt. All rights reserved.
//     </p>
//     <p style="font-size:12px; color:#94a3b8; margin:6px 0 0 0;">
//       Secure • Private • Paperless
//     </p>
//   </footer>

// </div>

//     `,
//   });
// };

// import nodemailer from "nodemailer";

// // 👇 UPDATED CONFIGURATION WITH TIMEOUTS
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS, // Make sure this is the 16-char App Password
//   },
//   // ⚡ Fix for Render Timeout Issues
//   connectionTimeout: 10000, // Wait max 10 seconds for connection
//   greetingTimeout: 5000,    // Wait max 5 seconds for greeting
//   socketTimeout: 10000,     // Close socket if no data for 10 seconds
// });

// export const sendVerificationEmail = async (email, link) => {
//   await transporter.sendMail({
//     from: `"GreenReceipt" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Verify your GreenReceipt account",
//     html: `
//       <h2>Welcome to GreenReceipt 🌱</h2>
//       <p>Please verify your email to activate your account.</p>
//       <a href="${link}" style="padding:10px 20px;background:#16A34A;color:white;border-radius:6px;text-decoration:none;">
//         Verify Email
//       </a>
//       <p>This link will expire in 10 minutes.</p>
//     `,
//   });
// };

// export const sendOtpEmail = async (email, code) => {
//   await transporter.sendMail({
//     from: `"GreenReceipt" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Your GreenReceipt verification code",
//     html: `
//       <div style="font-family:Arial, Helvetica, sans-serif; max-width:520px; margin:0 auto; padding:24px; border:1px solid #e5e7eb; border-radius:12px; background:#ffffff; color:#0f172a;">

//   <header style="text-align:center; padding-bottom:16px; border-bottom:1px solid #e5e7eb;">
//     <div style="font-size:24px; font-weight:800; color:#16a34a; letter-spacing:0.5px;">
//       GreenReceipt
//     </div>
//     <div style="font-size:13px; color:#64748b; margin-top:6px;">
//       Secure verification code
//     </div>
//   </header>

//   <main style="padding:20px 0;">
//     <h2 style="font-size:20px; margin:0 0 10px 0; color:#0f172a;">
//       Verify your email
//     </h2>

//     <p style="font-size:14px; line-height:1.6; color:#475569; margin:0 0 14px 0;">
//       Use the verification code below to confirm your GreenReceipt account.
//       This code is valid for <strong>10 minutes</strong>.
//     </p>

//     <div style="background:#f8fafc; border:1px dashed #16a34a; border-radius:10px; padding:16px; margin:20px 0; text-align:center;">
//       <div style="font-size:30px; font-weight:800; letter-spacing:8px; color:#0f172a;">
//         ${code}
//       </div>
//     </div>

//     <p style="font-size:13px; line-height:1.6; color:#475569; margin:0 0 12px 0;">
//       If you didn’t request this code, you can safely ignore this email.
//       Your account security is not affected.
//     </p>

//     <p style="font-size:13px; line-height:1.6; color:#475569; margin:0;">
//       Need help? Contact us at
//       <a href="mailto:support@greenreceipt.com" style="color:#16a34a; text-decoration:none; font-weight:600;">
//         support@greenreceipt.com
//       </a>
//     </p>
//   </main>

//   <footer style="text-align:center; padding-top:16px; border-top:1px solid #e5e7eb;">
//     <p style="font-size:12px; color:#94a3b8; margin:0;">
//       © ${new Date().getFullYear()} GreenReceipt. All rights reserved.
//     </p>
//     <p style="font-size:12px; color:#94a3b8; margin:6px 0 0 0;">
//       Secure • Private • Paperless
//     </p>
//   </footer>

// </div>
//     `,
//   });
// };

// import nodemailer from "nodemailer";

// // 👇 UPDATED: Use Port 465 (Secure) to fix Render timeouts
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com", // Explicitly use Gmail Host
//   port: 465,              // Secure Port (Best for Cloud/Render)
//   secure: true,           // Must be true for Port 465
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS, // Your 16-digit App Password
//   },
//   // Keep timeouts to prevent hanging
//   connectionTimeout: 10000, 
//   greetingTimeout: 5000,    
//   socketTimeout: 10000,
// });

// export const sendVerificationEmail = async (email, link) => {
//   await transporter.sendMail({
//     from: `"GreenReceipt" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Verify your GreenReceipt account",
//     html: `
//       <h2>Welcome to GreenReceipt 🌱</h2>
//       <p>Please verify your email to activate your account.</p>
//       <a href="${link}" style="padding:10px 20px;background:#16A34A;color:white;border-radius:6px;text-decoration:none;">
//         Verify Email
//       </a>
//       <p>This link will expire in 10 minutes.</p>
//     `,
//   });
// };

// export const sendOtpEmail = async (email, code) => {
//   await transporter.sendMail({
//     from: `"GreenReceipt" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Your GreenReceipt verification code",
//     html: `
//       <div style="font-family:Arial, Helvetica, sans-serif; max-width:520px; margin:0 auto; padding:24px; border:1px solid #e5e7eb; border-radius:12px; background:#ffffff; color:#0f172a;">

//   <header style="text-align:center; padding-bottom:16px; border-bottom:1px solid #e5e7eb;">
//     <div style="font-size:24px; font-weight:800; color:#16a34a; letter-spacing:0.5px;">
//       GreenReceipt
//     </div>
//     <div style="font-size:13px; color:#64748b; margin-top:6px;">
//       Secure verification code
//     </div>
//   </header>

//   <main style="padding:20px 0;">
//     <h2 style="font-size:20px; margin:0 0 10px 0; color:#0f172a;">
//       Verify your email
//     </h2>

//     <p style="font-size:14px; line-height:1.6; color:#475569; margin:0 0 14px 0;">
//       Use the verification code below to confirm your GreenReceipt account.
//       This code is valid for <strong>10 minutes</strong>.
//     </p>

//     <div style="background:#f8fafc; border:1px dashed #16a34a; border-radius:10px; padding:16px; margin:20px 0; text-align:center;">
//       <div style="font-size:30px; font-weight:800; letter-spacing:8px; color:#0f172a;">
//         ${code}
//       </div>
//     </div>

//     <p style="font-size:13px; line-height:1.6; color:#475569; margin:0 0 12px 0;">
//       If you didn’t request this code, you can safely ignore this email.
//       Your account security is not affected.
//     </p>

//     <p style="font-size:13px; line-height:1.6; color:#475569; margin:0;">
//       Need help? Contact us at
//       <a href="mailto:support@greenreceipt.com" style="color:#16a34a; text-decoration:none; font-weight:600;">
//         support@greenreceipt.com
//       </a>
//     </p>
//   </main>

//   <footer style="text-align:center; padding-top:16px; border-top:1px solid #e5e7eb;">
//     <p style="font-size:12px; color:#94a3b8; margin:0;">
//       © ${new Date().getFullYear()} GreenReceipt. All rights reserved.
//     </p>
//     <p style="font-size:12px; color:#94a3b8; margin:6px 0 0 0;">
//       Secure • Private • Paperless
//     </p>
//   </footer>

// </div>
//     `,
//   });
// };

// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// export const sendVerificationEmail = async (email, link) => {
//   await transporter.sendMail({
//     from: `"GreenReceipt" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Verify your GreenReceipt account",
//     html: `
//       <h2>Welcome to GreenReceipt 🌱</h2>
//       <p>Please verify your email to activate your account.</p>
//       <a href="${link}" style="padding:10px 20px;background:#16A34A;color:white;border-radius:6px;text-decoration:none;">
//         Verify Email
//       </a>
//       <p>This link will expire in 10 minutes.</p>
//     `,
//   });
// };

// export const sendOtpEmail = async (email, code) => {
//   await transporter.sendMail({
//     from: `"GreenReceipt" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Your GreenReceipt verification code",
//     html: `
//       <div style="font-family:Arial, Helvetica, sans-serif; max-width:520px; margin:0 auto; padding:24px; border:1px solid #e5e7eb; border-radius:12px; background:#ffffff; color:#0f172a;">

//   <!-- Header -->
//   <header style="text-align:center; padding-bottom:16px; border-bottom:1px solid #e5e7eb;">
//     <div style="font-size:24px; font-weight:800; color:#16a34a; letter-spacing:0.5px;">
//       GreenReceipt
//     </div>
//     <div style="font-size:13px; color:#64748b; margin-top:6px;">
//       Secure verification code
//     </div>
//   </header>

//   <!-- Main Content -->
//   <main style="padding:20px 0;">
//     <h2 style="font-size:20px; margin:0 0 10px 0; color:#0f172a;">
//       Verify your email
//     </h2>

//     <p style="font-size:14px; line-height:1.6; color:#475569; margin:0 0 14px 0;">
//       Use the verification code below to confirm your GreenReceipt account.
//       This code is valid for <strong>10 minutes</strong>.
//     </p>

//     <!-- OTP Box -->
//     <div style="background:#f8fafc; border:1px dashed #16a34a; border-radius:10px; padding:16px; margin:20px 0; text-align:center;">
//       <div style="font-size:30px; font-weight:800; letter-spacing:8px; color:#0f172a;">
//         ${code}
//       </div>
//     </div>

//     <p style="font-size:13px; line-height:1.6; color:#475569; margin:0 0 12px 0;">
//       If you didn’t request this code, you can safely ignore this email.
//       Your account security is not affected.
//     </p>

//     <p style="font-size:13px; line-height:1.6; color:#475569; margin:0;">
//       Need help? Contact us at
//       <a href="mailto:support@greenreceipt.com" style="color:#16a34a; text-decoration:none; font-weight:600;">
//         support@greenreceipt.com
//       </a>
//     </p>
//   </main>

//   <!-- Footer -->
//   <footer style="text-align:center; padding-top:16px; border-top:1px solid #e5e7eb;">
//     <p style="font-size:12px; color:#94a3b8; margin:0;">
//       ©️ ${new Date().getFullYear()} GreenReceipt. All rights reserved.
//     </p>
//     <p style="font-size:12px; color:#94a3b8; margin:6px 0 0 0;">
//       Secure • Private • Paperless
//     </p>
//   </footer>

// </div>

//     `,
//   });
// };

// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// export const sendVerificationEmail = async (email, link) => {
//   await transporter.sendMail({
//     from: `"GreenReceipt" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Verify your GreenReceipt account",
//     html: `
//       <h2>Welcome to GreenReceipt 🌱</h2>
//       <p>Please verify your email to activate your account.</p>
//       <a href="${link}" style="padding:10px 20px;background:#16A34A;color:white;border-radius:6px;text-decoration:none;">
//         Verify Email
//       </a>
//       <p>This link will expire in 10 minutes.</p>
//     `,
//   });
// };

// export const sendOtpEmail = async (email, code) => {
//   await transporter.sendMail({
//     from: `"GreenReceipt" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Your GreenReceipt verification code",
//     html: `
//       <div style="font-family:Arial, Helvetica, sans-serif; max-width:520px; margin:0 auto; padding:24px; border:1px solid #e5e7eb; border-radius:12px; background:#ffffff; color:#0f172a;">

//   <!-- Header -->
//   <header style="text-align:center; padding-bottom:16px; border-bottom:1px solid #e5e7eb;">
//     <div style="font-size:24px; font-weight:800; color:#16a34a; letter-spacing:0.5px;">
//       GreenReceipt
//     </div>
//     <div style="font-size:13px; color:#64748b; margin-top:6px;">
//       Secure verification code
//     </div>
//   </header>

//   <!-- Main Content -->
//   <main style="padding:20px 0;">
//     <h2 style="font-size:20px; margin:0 0 10px 0; color:#0f172a;">
//       Verify your email
//     </h2>

//     <p style="font-size:14px; line-height:1.6; color:#475569; margin:0 0 14px 0;">
//       Use the verification code below to confirm your GreenReceipt account.
//       This code is valid for <strong>10 minutes</strong>.
//     </p>

//     <!-- OTP Box -->
//     <div style="background:#f8fafc; border:1px dashed #16a34a; border-radius:10px; padding:16px; margin:20px 0; text-align:center;">
//       <div style="font-size:30px; font-weight:800; letter-spacing:8px; color:#0f172a;">
//         ${code}
//       </div>
//     </div>

//     <p style="font-size:13px; line-height:1.6; color:#475569; margin:0 0 12px 0;">
//       If you didn’t request this code, you can safely ignore this email.
//       Your account security is not affected.
//     </p>

//     <p style="font-size:13px; line-height:1.6; color:#475569; margin:0;">
//       Need help? Contact us at
//       <a href="mailto:support@greenreceipt.com" style="color:#16a34a; text-decoration:none; font-weight:600;">
//         support@greenreceipt.com
//       </a>
//     </p>
//   </main>

//   <!-- Footer -->
//   <footer style="text-align:center; padding-top:16px; border-top:1px solid #e5e7eb;">
//     <p style="font-size:12px; color:#94a3b8; margin:0;">
//       ©️ ${new Date().getFullYear()} GreenReceipt. All rights reserved.
//     </p>
//     <p style="font-size:12px; color:#94a3b8; margin:6px 0 0 0;">
//       Secure • Private • Paperless
//     </p>
//   </footer>

// </div>

//     `,
//   });
// };

// import nodemailer from "nodemailer";

// // 👇 UPDATED CONFIGURATION WITH TIMEOUTS
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS, // Make sure this is the 16-char App Password
//   },
//   // ⚡ Fix for Render Timeout Issues
//   connectionTimeout: 10000, // Wait max 10 seconds for connection
//   greetingTimeout: 5000,    // Wait max 5 seconds for greeting
//   socketTimeout: 10000,     // Close socket if no data for 10 seconds
// });

// export const sendVerificationEmail = async (email, link) => {
//   await transporter.sendMail({
//     from: `"GreenReceipt" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Verify your GreenReceipt account",
//     html: `
//       <h2>Welcome to GreenReceipt 🌱</h2>
//       <p>Please verify your email to activate your account.</p>
//       <a href="${link}" style="padding:10px 20px;background:#16A34A;color:white;border-radius:6px;text-decoration:none;">
//         Verify Email
//       </a>
//       <p>This link will expire in 10 minutes.</p>
//     `,
//   });
// };

// export const sendOtpEmail = async (email, code) => {
//   await transporter.sendMail({
//     from: `"GreenReceipt" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Your GreenReceipt verification code",
//     html: `
//       <div style="font-family:Arial, Helvetica, sans-serif; max-width:520px; margin:0 auto; padding:24px; border:1px solid #e5e7eb; border-radius:12px; background:#ffffff; color:#0f172a;">

//   <header style="text-align:center; padding-bottom:16px; border-bottom:1px solid #e5e7eb;">
//     <div style="font-size:24px; font-weight:800; color:#16a34a; letter-spacing:0.5px;">
//       GreenReceipt
//     </div>
//     <div style="font-size:13px; color:#64748b; margin-top:6px;">
//       Secure verification code
//     </div>
//   </header>

//   <main style="padding:20px 0;">
//     <h2 style="font-size:20px; margin:0 0 10px 0; color:#0f172a;">
//       Verify your email
//     </h2>

//     <p style="font-size:14px; line-height:1.6; color:#475569; margin:0 0 14px 0;">
//       Use the verification code below to confirm your GreenReceipt account.
//       This code is valid for <strong>10 minutes</strong>.
//     </p>

//     <div style="background:#f8fafc; border:1px dashed #16a34a; border-radius:10px; padding:16px; margin:20px 0; text-align:center;">
//       <div style="font-size:30px; font-weight:800; letter-spacing:8px; color:#0f172a;">
//         ${code}
//       </div>
//     </div>

//     <p style="font-size:13px; line-height:1.6; color:#475569; margin:0 0 12px 0;">
//       If you didn’t request this code, you can safely ignore this email.
//       Your account security is not affected.
//     </p>

//     <p style="font-size:13px; line-height:1.6; color:#475569; margin:0;">
//       Need help? Contact us at
//       <a href="mailto:support@greenreceipt.com" style="color:#16a34a; text-decoration:none; font-weight:600;">
//         support@greenreceipt.com
//       </a>
//     </p>
//   </main>

//   <footer style="text-align:center; padding-top:16px; border-top:1px solid #e5e7eb;">
//     <p style="font-size:12px; color:#94a3b8; margin:0;">
//       ©️ ${new Date().getFullYear()} GreenReceipt. All rights reserved.
//     </p>
//     <p style="font-size:12px; color:#94a3b8; margin:6px 0 0 0;">
//       Secure • Private • Paperless
//     </p>
//   </footer>

// </div>
//     `,
//   });
// };

// NOTE: Nodemailer disabled per request to skip email/OTP flows.
// import nodemailer from "nodemailer";
// const transporter = nodemailer.createTransport({ ... });

// No-op senders keep call sites intact while preventing outbound email.
// export const sendVerificationEmail = async () => {
// 	// Email sending disabled intentionally; verification is now automatic.
// 	return Promise.resolve();
// };

// export const sendOtpEmail = async () => {
// 	// OTP emails disabled; accounts are auto-verified during signup.
// 	return Promise.resolve();
// };