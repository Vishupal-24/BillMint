import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, link) => {
  await transporter.sendMail({
    from: `"GreenReceipt" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your GreenReceipt account",
    html: `
      <h2>Welcome to GreenReceipt 🌱</h2>
      <p>Please verify your email to activate your account.</p>
      <a href="${link}" style="padding:10px 20px;background:#16A34A;color:white;border-radius:6px;text-decoration:none;">
        Verify Email
      </a>
      <p>This link will expire in 10 minutes.</p>
    `,
  });
};

export const sendOtpEmail = async (email, code) => {
  await transporter.sendMail({
    from: `"GreenReceipt" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your GreenReceipt verification code",
    html: `
      <div style="font-family:Arial, Helvetica, sans-serif; max-width:520px; margin:0 auto; padding:24px; border:1px solid #e5e7eb; border-radius:12px; background:#ffffff; color:#0f172a;">

  <!-- Header -->
  <header style="text-align:center; padding-bottom:16px; border-bottom:1px solid #e5e7eb;">
    <div style="font-size:24px; font-weight:800; color:#16a34a; letter-spacing:0.5px;">
      GreenReceipt
    </div>
    <div style="font-size:13px; color:#64748b; margin-top:6px;">
      Secure verification code
    </div>
  </header>

  <!-- Main Content -->
  <main style="padding:20px 0;">
    <h2 style="font-size:20px; margin:0 0 10px 0; color:#0f172a;">
      Verify your email
    </h2>

    <p style="font-size:14px; line-height:1.6; color:#475569; margin:0 0 14px 0;">
      Use the verification code below to confirm your GreenReceipt account.
      This code is valid for <strong>10 minutes</strong>.
    </p>

    <!-- OTP Box -->
    <div style="background:#f8fafc; border:1px dashed #16a34a; border-radius:10px; padding:16px; margin:20px 0; text-align:center;">
      <div style="font-size:30px; font-weight:800; letter-spacing:8px; color:#0f172a;">
        ${code}
      </div>
    </div>

    <p style="font-size:13px; line-height:1.6; color:#475569; margin:0 0 12px 0;">
      If you didn’t request this code, you can safely ignore this email.
      Your account security is not affected.
    </p>

    <p style="font-size:13px; line-height:1.6; color:#475569; margin:0;">
      Need help? Contact us at
      <a href="mailto:support@greenreceipt.com" style="color:#16a34a; text-decoration:none; font-weight:600;">
        support@greenreceipt.com
      </a>
    </p>
  </main>

  <!-- Footer -->
  <footer style="text-align:center; padding-top:16px; border-top:1px solid #e5e7eb;">
    <p style="font-size:12px; color:#94a3b8; margin:0;">
      © ${new Date().getFullYear()} GreenReceipt. All rights reserved.
    </p>
    <p style="font-size:12px; color:#94a3b8; margin:6px 0 0 0;">
      Secure • Private • Paperless
    </p>
  </footer>

</div>

    `,
  });
};
