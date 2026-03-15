import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import Merchant from "../models/Merchant.js";
import { sendWelcomeEmail, sendMerchantWelcomeEmail } from "../utils/sendEmail.js";
import { sendOtpEmail } from "../utils/sendOtpEmail.js";
import {
  generateOtp,
  hashOtp,
  verifyOtp as verifyOtpHash,
  getOtpExpiry,
  isOtpExpired,
  canResendOtp,
  OTP_CONFIG,
} from "../utils/otp.js";

const JWT_SECRET = process.env.JWT_SECRET;
let REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// Token config
const ACCESS_TOKEN_EXPIRES_IN = "24h";
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 90;
const REFRESH_TOKEN_EXPIRES_IN_MS = REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;

const getAllowedOrigins = () => {
  const raw = process.env.CLIENT_URL;
  const defaults = [
    "http://localhost:5173",
    "https://green-receipt.vercel.app",
    "https://green-recipt.vercel.app",
  ];
  if (!raw) return defaults;
  const parsed = raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : defaults;
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Non-browser clients may not send Origin
  const allowed = getAllowedOrigins();
  return allowed.includes(origin);
};

const isStrictOriginCheckEnabled = () => {
  const raw = String(process.env.STRICT_ORIGIN_CHECK || "").toLowerCase();
  if (raw) return raw === "true";
  return process.env.NODE_ENV === "production";
};

const isOriginlessAllowed = () => {
  return String(process.env.ALLOW_ORIGINLESS_REQUESTS || "").toLowerCase() === "true";
};

const enforceAllowedOrigin = (req, res) => {
  const origin = req.headers.origin;
  if (!origin) {
    if (isStrictOriginCheckEnabled() && !isOriginlessAllowed()) {
      res.status(403).json({ message: "Forbidden origin", code: "FORBIDDEN_ORIGIN" });
      return false;
    }
    return true;
  }
  if (!isAllowedOrigin(origin)) {
    res.status(403).json({ message: "Forbidden origin", code: "FORBIDDEN_ORIGIN" });
    return false;
  }
  return true;
};

const isHttpsRequest = (req) => {
  // Priority order:
  // 1) Explicit override (useful for tricky proxy setups)
  if (String(process.env.FORCE_SECURE_COOKIES || "").toLowerCase() === "true") return true;

  // 2) Express req.secure (works when `trust proxy` is configured and x-forwarded-proto is correct)
  if (req?.secure) return true;

  // 3) Proxy header
  const xfProto = req?.headers?.["x-forwarded-proto"];
  if (typeof xfProto === "string" && xfProto.toLowerCase() === "https") return true;

  // 4) Browser-origin signal (very reliable for XHR/fetch)
  const origin = req?.headers?.origin;
  if (typeof origin === "string" && origin.toLowerCase().startsWith("https://")) return true;
  const referer = req?.headers?.referer;
  if (typeof referer === "string" && referer.toLowerCase().startsWith("https://")) return true;

  return false;
};

const getRefreshCookieOptions = (req) => {
  // Cross-site refresh cookies require: SameSite=None + Secure
  // Using request HTTPS detection makes this work even if NODE_ENV is misconfigured.
  const secure = process.env.NODE_ENV === "production" || isHttpsRequest(req);
  const sameSite = secure ? "none" : "lax";
  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: REFRESH_TOKEN_EXPIRES_IN_MS,
    path: "/api/auth/refresh",
  };
};

const getClearRefreshCookieOptions = (req) => {
  const secure = process.env.NODE_ENV === "production" || isHttpsRequest(req);
  const sameSite = secure ? "none" : "lax";
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/api/auth/refresh",
  };
};

// Legacy token expiry (kept for backward compat)
const JWT_EXPIRES_IN = "7d";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_WINDOW_MS = 60 * 1000; // 1 min cooldown

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Define it in your environment before starting the server.");
}

if (!REFRESH_TOKEN_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("REFRESH_TOKEN_SECRET is not set. Define it in your environment before starting the server.");
  }
  console.warn("[Auth] REFRESH_TOKEN_SECRET not set. Falling back to JWT_SECRET + '_refresh' (non-production only).");
  REFRESH_TOKEN_SECRET = `${JWT_SECRET}_refresh`;
}

// ==========================================
// FLOW 1: EMAIL VERIFICATION BEFORE SIGNUP
// ==========================================

/**
 * STEP 1: Send OTP for Signup
 * POST /api/auth/send-signup-otp
 * 
 * This creates a "pending" record with just email + OTP
 * The actual user account is created only after OTP verification
 */
export const sendSignupOtp = async (req, res) => {
  try {
    const { email, role = "customer" } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists (across both collections)
    const [customerExists, merchantExists] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      Merchant.findOne({ email: normalizedEmail }),
    ]);

    if (customerExists || merchantExists) {
      // Generic response to prevent user enumeration
      // But we'll hint if they should use the other role's login
      return res.status(400).json({ 
        message: "This email is already registered. Please login instead.",
        code: "EMAIL_EXISTS" 
      });
    }

    // Check for existing pending signup (stored in the model with isEmailVerified: false)
    const Model = role === "merchant" ? Merchant : User;
    let pendingAccount = await Model.findOne({ 
      email: normalizedEmail, 
      isEmailVerified: false,
      isVerified: false 
    }).select("+emailOtp +emailOtpExpires +otpLastSentAt");

    // Check cooldown
    if (pendingAccount) {
      const { canSend, waitSeconds } = canResendOtp(pendingAccount.otpLastSentAt);
      if (!canSend) {
        return res.status(429).json({ 
          message: `Please wait ${waitSeconds} seconds before requesting another code.`,
          code: "COOLDOWN",
          waitSeconds 
        });
      }
    }

    // Generate OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpires = getOtpExpiry();

    if (pendingAccount) {
      // Update existing pending account
      pendingAccount.emailOtp = otpHash;
      pendingAccount.emailOtpExpires = otpExpires;
      pendingAccount.otpLastSentAt = new Date();
      await pendingAccount.save();
    } else {
      // Create a temporary pending record
      // We'll store minimal info; the rest is added during verification
      if (role === "merchant") {
        pendingAccount = new Merchant({
          email: normalizedEmail,
          password: "PENDING_" + crypto.randomBytes(16).toString("hex"), // Temporary, will be replaced
          shopName: "Pending Verification", // Temporary
          isVerified: false,
          isEmailVerified: false,
          emailOtp: otpHash,
          emailOtpExpires: otpExpires,
          otpLastSentAt: new Date(),
        });
      } else {
        pendingAccount = new User({
          email: normalizedEmail,
          password: "PENDING_" + crypto.randomBytes(16).toString("hex"), // Temporary
          name: "Pending Verification", // Temporary
          isVerified: false,
          isEmailVerified: false,
          emailOtp: otpHash,
          emailOtpExpires: otpExpires,
          otpLastSentAt: new Date(),
        });
      }
      await pendingAccount.save();
    }

    // Send OTP email (don't await to speed up response)
    sendOtpEmail({ email: normalizedEmail, otp, purpose: "verify" }).catch((err) => {
      console.error("[Auth] Failed to send signup OTP email:", err.message);
    });

    // Log OTP in development only
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Signup OTP for ${normalizedEmail}: ${otp}`);
    }

    res.json({ 
      message: "Verification code sent to your email. Please check your inbox.",
      email: normalizedEmail,
      expiresIn: OTP_CONFIG.EXPIRY_MINUTES * 60, // seconds
    });
  } catch (error) {
    console.error("sendSignupOtp error:", error);
    res.status(500).json({ message: "Failed to send verification code" });
  }
};

/**
 * STEP 2: Verify OTP and Complete Signup
 * POST /api/auth/verify-signup-otp
 */
export const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp, password, role = "customer", name, shopName } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const Model = role === "merchant" ? Merchant : User;

    // Find pending account
    const pendingAccount = await Model.findOne({
      email: normalizedEmail,
      isEmailVerified: false,
      isVerified: false,
    }).select("+emailOtp +emailOtpExpires");

    if (!pendingAccount) {
      return res.status(400).json({ 
        message: "No pending verification found. Please request a new code.",
        code: "NO_PENDING_VERIFICATION"
      });
    }

    // Check if OTP expired
    if (isOtpExpired(pendingAccount.emailOtpExpires)) {
      return res.status(400).json({ 
        message: "Verification code has expired. Please request a new one.",
        code: "OTP_EXPIRED"
      });
    }

    // Check if OTP exists
    if (!pendingAccount.emailOtp) {
      return res.status(400).json({ 
        message: "Invalid verification code.",
        code: "INVALID_OTP"
      });
    }

    // Verify OTP hash
    let isMatch = false;
    try {
      isMatch = verifyOtpHash(otp, pendingAccount.emailOtp);
    } catch (err) {
      console.error("OTP verification error:", err);
      return res.status(400).json({ 
        message: "Invalid verification code.",
        code: "INVALID_OTP"
      });
    }

    if (!isMatch) {
      return res.status(400).json({ 
        message: "Invalid verification code.",
        code: "INVALID_OTP"
      });
    }

    // OTP is valid - complete the signup
    if (role === "merchant") {
      pendingAccount.shopName = shopName;
    } else {
      pendingAccount.name = name;
    }
    pendingAccount.password = password; // Will be hashed by pre-save hook
    pendingAccount.isEmailVerified = true;
    pendingAccount.isVerified = true;
    
    // Clear OTP fields (single-use)
    pendingAccount.emailOtp = undefined;
    pendingAccount.emailOtpExpires = undefined;
    pendingAccount.otpLastSentAt = undefined;

    await pendingAccount.save();

    // Send welcome email (async)
    if (role === "merchant") {
      sendMerchantWelcomeEmail(normalizedEmail, shopName).catch((err) => {
        console.error("[Auth] Welcome email failed:", err.message);
      });
    } else {
      sendWelcomeEmail(normalizedEmail, name).catch((err) => {
        console.error("[Auth] Welcome email failed:", err.message);
      });
    }

    res.status(201).json({
      message: "Email verified successfully! Your account has been created.",
      email: normalizedEmail,
      role,
      redirect: role === "merchant" ? "/merchant-login" : "/customer-login",
    });
  } catch (error) {
    console.error("verifySignupOtp error:", error);
    res.status(500).json({ message: "Failed to verify code" });
  }
};

// ==========================================
// FLOW 2: FORGOT PASSWORD
// ==========================================

/**
 * STEP 3: Request Password Reset OTP
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email, role = "customer" } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Find account in the appropriate collection
    const Model = role === "merchant" ? Merchant : User;
    const account = await Model.findOne({ email: normalizedEmail })
      .select("+resetPasswordOtp +resetPasswordExpires +otpLastSentAt");

    // Always return success to prevent user enumeration
    // But only send email if account exists
    if (!account) {
      // Add small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500));
      return res.json({ 
        message: "If an account exists with this email, a reset code has been sent.",
      });
    }

    // Check cooldown
    const { canSend, waitSeconds } = canResendOtp(account.otpLastSentAt);
    if (!canSend) {
      return res.status(429).json({ 
        message: `Please wait ${waitSeconds} seconds before requesting another code.`,
        code: "COOLDOWN",
        waitSeconds 
      });
    }

    // Generate OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpires = getOtpExpiry();

    // Store hashed OTP
    account.resetPasswordOtp = otpHash;
    account.resetPasswordExpires = otpExpires;
    account.otpLastSentAt = new Date();
    await account.save();

    // Send OTP email
    const accountName = role === "merchant" ? account.shopName : account.name;
    sendOtpEmail({ 
      email: normalizedEmail, 
      otp, 
      purpose: "reset",
      name: accountName 
    }).catch((err) => {
      console.error("[Auth] Failed to send reset OTP email:", err.message);
    });

    // Log OTP in development only
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Reset OTP for ${normalizedEmail}: ${otp}`);
    }

    res.json({ 
      message: "If an account exists with this email, a reset code has been sent.",
      expiresIn: OTP_CONFIG.EXPIRY_MINUTES * 60, // seconds
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ message: "Failed to process request" });
  }
};

/**
 * STEP 4: Reset Password Using OTP
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, role = "customer", otp, newPassword } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const Model = role === "merchant" ? Merchant : User;
    const account = await Model.findOne({ email: normalizedEmail })
      .select("+resetPasswordOtp +resetPasswordExpires +tokenVersion");

    if (!account) {
      return res.status(400).json({ 
        message: "Invalid or expired reset code.",
        code: "INVALID_REQUEST"
      });
    }

    // Check if OTP exists
    if (!account.resetPasswordOtp) {
      return res.status(400).json({ 
        message: "No reset code found. Please request a new one.",
        code: "NO_OTP"
      });
    }

    // Check if OTP expired
    if (isOtpExpired(account.resetPasswordExpires)) {
      // Clear expired OTP
      account.resetPasswordOtp = undefined;
      account.resetPasswordExpires = undefined;
      await account.save();
      
      return res.status(400).json({ 
        message: "Reset code has expired. Please request a new one.",
        code: "OTP_EXPIRED"
      });
    }

    // Verify OTP hash
    let isMatch = false;
    try {
      isMatch = verifyOtpHash(otp, account.resetPasswordOtp);
    } catch (err) {
      console.error("OTP verification error:", err);
      return res.status(400).json({ 
        message: "Invalid reset code.",
        code: "INVALID_OTP"
      });
    }

    if (!isMatch) {
      return res.status(400).json({ 
        message: "Invalid reset code.",
        code: "INVALID_OTP"
      });
    }

    // OTP is valid - update password
    account.password = newPassword; // Will be hashed by pre-save hook
    
    // Clear OTP fields (single-use)
    account.resetPasswordOtp = undefined;
    account.resetPasswordExpires = undefined;
    account.otpLastSentAt = undefined;
    
    // Invalidate all existing sessions (security best practice)
    account.tokenVersion = (account.tokenVersion || 0) + 1;
    account.refreshToken = undefined;
    account.refreshTokenExpiry = undefined;

    await account.save();

    res.json({ 
      message: "Password reset successful. Please login with your new password.",
      redirect: role === "merchant" ? "/merchant-login" : "/customer-login",
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

// Token helpers

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
    REFRESH_TOKEN_SECRET,
    { expiresIn: `${REFRESH_TOKEN_EXPIRES_IN_DAYS}d` }
  );

// Legacy token generation (7d expiry)
const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

const generateRandomToken = () => crypto.randomBytes(64).toString("hex");

const persistRefreshToken = async (account, refreshToken) => {
  const hashedToken = await bcrypt.hash(refreshToken, 10);
  account.refreshToken = hashedToken;
  account.refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);
  account.lastLoginAt = new Date();
  await account.save();
};

const clearRefreshToken = async (account) => {
  account.refreshToken = undefined;
  account.refreshTokenExpiry = undefined;
  await account.save();
};

const generateOtpCode = () =>
  crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");

const persistOtp = async (account) => {
  const code = generateOtpCode();
  const hash = await bcrypt.hash(code, 10);
  account.otpCodeHash = hash;
  account.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  account.otpAttempts = 0;
  account.otpLastSentAt = new Date();
  await account.save();
  return code;
};

const findAccountByRole = async (email, role = "customer") => {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : null;
  if (!normalizedEmail) return null;
  if (!["customer", "merchant"].includes(role)) return null;

  const primaryModel = role === "merchant" ? Merchant : User;
  const fallbackModel = role === "merchant" ? User : Merchant;

  let account = await primaryModel
    .findOne({ email: normalizedEmail })
    .select("+otpCodeHash +otpExpiresAt +otpAttempts +otpLastSentAt");

  if (!account) {
    // Try the other collection in case role was wrong
    account = await fallbackModel
      .findOne({ email: normalizedEmail })
      .select("+otpCodeHash +otpExpiresAt +otpAttempts +otpLastSentAt");
  }

  return account;
};

export const registerCustomer = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const [customerExists, merchantExists] = await Promise.all([
      User.findOne({ email }),
      Merchant.findOne({ email }),
    ]);

    if (customerExists || merchantExists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = new User({ name, email, password, isVerified: true });
    // Skip OTP - auto-verify
    await user.save();

    // Send welcome email (async, don't await - don't block signup)
    sendWelcomeEmail(email, name).catch((err) => {
      console.error("[Auth] Welcome email failed:", err.message);
    });

    res.status(201).json({
      message: "Registration successful. Your account is verified. Please login.",
      email: user.email,
      role: user.role,
      autoVerified: true,
      redirect: "/customer-login",
      next: { type: "redirect", path: "/customer-login" },
    });
  } catch (error) {
    console.error("registerCustomer error", error);
    res.status(500).json({ message: "Failed to sign up customer" });
  }
};

export const registerMerchant = async (req, res) => {
  try {
    const { shopName, email, password, confirmPassword } = req.body;

    if (!shopName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Shop name, email, and password are required" });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const [customerExists, merchantExists] = await Promise.all([
      User.findOne({ email }),
      Merchant.findOne({ email }),
    ]);

    if (customerExists || merchantExists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const merchant = new Merchant({ shopName, email, password, isVerified: true });
    // Skip OTP - auto-verify
    await merchant.save();

    // Send welcome email (async, don't await - don't block signup)
    sendMerchantWelcomeEmail(email, shopName).catch((err) => {
      console.error("[Auth] Merchant welcome email failed:", err.message);
    });

    res.status(201).json({
      message: "Registration successful. Your account is verified. Please login.",
      email: merchant.email,
      role: merchant.role,
      autoVerified: true,
      redirect: "/merchant-login",
      next: { type: "redirect", path: "/merchant-login" },
    });
  } catch (error) {
    console.error("registerMerchant error", error);
    res.status(500).json({ message: "Failed to sign up merchant" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role = "customer" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!["customer", "merchant"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const Model = role === "merchant" ? Merchant : User;
    const OtherModel = role === "merchant" ? User : Merchant;

    // Fetch account with auth fields
    const account = await Model.findOne({ email: normalizedEmail })
      .select("+password +refreshToken +refreshTokenExpiry +tokenVersion");

    // If not found in expected model, check if account exists in the other model
    if (!account) {
      const otherAccount = await OtherModel.findOne({ email: normalizedEmail }).select("_id");
      if (otherAccount) {
        // Wrong login portal
        const actualRole = role === "merchant" ? "customer" : "merchant";
        return res.status(403).json({
          message: `This email is registered as a ${actualRole}. Please use the ${actualRole} login.`,
          code: "ROLE_MISMATCH",
          actualRole,
        });
      }
      // Email not found anywhere
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(account);
    const refreshToken = generateRefreshToken(account);

    // Save refresh token
    await persistRefreshToken(account, refreshToken);

    // Set HTTP-only cookie
    res.cookie("refreshToken", refreshToken, getRefreshCookieOptions(req));

    res.json({
      accessToken,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
      refreshExpiresIn: REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60, // 90 days in seconds
      role: account.role,
      user:
        account.role === "customer"
          ? { id: account._id, name: account.name, email: account.email }
          : {
              id: account._id,
              shopName: account.shopName,
              email: account.email,
              isProfileComplete: account.isProfileComplete || false,
            },
    });
  } catch (error) {
    console.error("login error", error);
    res.status(500).json({ message: "Failed to login" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, JWT_SECRET);
    const Model = decoded.role === "merchant" ? Merchant : User;

    await Model.findByIdAndUpdate(decoded.id, { isVerified: true });

    res.send(`
      <h2>Email verified successfully 🎉</h2>
      <p>You can now login to GreenReceipt.</p>
    `);
  } catch (error) {
    res.status(400).send("Invalid or expired link");
  }
};

export const getProfile = async (req, res) => {
  try {
    const isMerchant = req.user.role === "merchant";
    const Model = isMerchant ? Merchant : User;
    const account = await Model.findById(req.user.id).lean();

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const payload = isMerchant
      ? {
          id: account._id,
          role: account.role,
          shopName: account.shopName,
          ownerName: account.ownerName || null,
          email: account.email,
          phone: account.phone || null,
          address: account.address || null,
          addressLine: account.addressLine || null,
          businessCategory: account.businessCategory || null,
          businessDescription: account.businessDescription || null,
          operatingHours: account.operatingHours || [],
          receiptFooter: account.receiptFooter || "Thank you! Visit again.",
          receiptHeader: account.receiptHeader || "",
          brandColor: account.brandColor || "#10b981",
          currency: account.currency || "INR",
          merchantCode: account.merchantCode || null,
          logoUrl: account.logoUrl || null,
          isVerified: account.isVerified,
          isProfileComplete: account.isProfileComplete || false,
          onboardingStep: account.onboardingStep || 0,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        }
      : {
          id: account._id,
          role: account.role,
          name: account.name,
          email: account.email,
          phone: account.phone || null,
          address: account.address || null,
          isVerified: account.isVerified,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        };

    res.json(payload);
  } catch (error) {
    console.error("getProfile error", error);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const isMerchant = req.user.role === "merchant";
    const Model = isMerchant ? Merchant : User;
    const updates = {};

    if (isMerchant) {
      // Merchant profile updates
      const { 
        shopName, ownerName, email, phone, address, addressLine, 
        businessCategory, businessDescription, operatingHours,
        receiptFooter, receiptHeader, brandColor, logoUrl, currency 
      } = req.body;

      if (shopName) updates.shopName = shopName.trim();
      if (ownerName !== undefined) updates.ownerName = ownerName?.trim() || null;
      if (phone !== undefined) updates.phone = phone?.trim() || null;
      if (addressLine !== undefined) updates.addressLine = addressLine?.trim() || null;
      if (address !== undefined && typeof address === 'object') updates.address = address;
      if (businessCategory !== undefined) updates.businessCategory = businessCategory;
      if (businessDescription !== undefined) updates.businessDescription = businessDescription?.trim() || null;
      if (operatingHours !== undefined) updates.operatingHours = operatingHours;
      if (receiptFooter !== undefined) updates.receiptFooter = receiptFooter?.trim() || "Thank you! Visit again.";
      if (receiptHeader !== undefined) updates.receiptHeader = receiptHeader?.trim() || "";
      if (brandColor !== undefined) updates.brandColor = brandColor?.trim() || "#10b981";
      if (logoUrl !== undefined) updates.logoUrl = logoUrl?.trim() || null;
      if (currency) updates.currency = currency.trim();

      if (email) {
        const normalized = email.trim().toLowerCase();
        const [otherUser, otherMerchant] = await Promise.all([
          User.findOne({ email: normalized }),
          Merchant.findOne({ email: normalized, _id: { $ne: req.user.id } }),
        ]);
        if (otherUser || otherMerchant) {
          return res.status(400).json({ message: "Email already in use" });
        }
        updates.email = normalized;
      }

      const account = await Merchant.findByIdAndUpdate(req.user.id, updates, { new: true }).lean();
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      return res.json({
        id: account._id,
        role: account.role,
        shopName: account.shopName,
        ownerName: account.ownerName || null,
        email: account.email,
        phone: account.phone || null,
        address: account.address || null,
        addressLine: account.addressLine || null,
        businessCategory: account.businessCategory || null,
        businessDescription: account.businessDescription || null,
        operatingHours: account.operatingHours || [],
        receiptFooter: account.receiptFooter || "Thank you! Visit again.",
        receiptHeader: account.receiptHeader || "",
        brandColor: account.brandColor || "#10b981",
        currency: account.currency || "INR",
        merchantCode: account.merchantCode || null,
        logoUrl: account.logoUrl || null,
        isVerified: account.isVerified,
        isProfileComplete: account.isProfileComplete || false,
        onboardingStep: account.onboardingStep || 0,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      });
    }

    // Customer profile updates
    const { name, email, phone, address } = req.body;

    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;

    if (email) {
      const normalized = email.trim().toLowerCase();
      const [otherUser, otherMerchant] = await Promise.all([
        User.findOne({ email: normalized, _id: { $ne: req.user.id } }),
        Merchant.findOne({ email: normalized }),
      ]);
      if (otherUser || otherMerchant) {
        return res.status(400).json({ message: "Email already in use" });
      }
      updates.email = normalized;
    }

    const account = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).lean();
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json({
      id: account._id,
      role: account.role,
      name: account.name,
      email: account.email,
      phone: account.phone || null,
      address: account.address || null,
      isVerified: account.isVerified,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    });
  } catch (error) {
    console.error("updateProfile error", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

export const requestOtp = async (req, res) => {
  try {
    // OTP flow disabled - just return success message
    return res.json({ message: "If an account exists, a verification code has been sent." });
  } catch (error) {
    console.error("requestOtp error", error);
    res.status(500).json({ message: "Failed to send code" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    // OTP verification disabled - auto-approve
    return res.json({ message: "Account verified." });
  } catch (error) {
    console.error("verifyOtp error", error);
    res.status(500).json({ message: "Failed to verify code" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const Model = req.user.role === "merchant" ? Merchant : User;
    const account = await Model.findById(req.user.id).select("+tokenVersion");

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Verify current password
    const isMatch = await account.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password (pre-save hook hashes it)
    account.password = newPassword;
    
    // Invalidate all existing sessions
    account.tokenVersion = (account.tokenVersion || 0) + 1;
    account.refreshToken = undefined;
    account.refreshTokenExpiry = undefined;
    
    await account.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("changePassword error", error);
    res.status(500).json({ message: "Failed to change password" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const Model = req.user.role === "merchant" ? Merchant : User;
    
    // Delete the account
    const result = await Model.findByIdAndDelete(req.user.id);

    if (!result) {
      return res.status(404).json({ message: "Account not found" });
    }

    // TODO: Consider keeping receipts for audit, or anonymize them
    // await Receipt.deleteMany({ userId: req.user.id });

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("deleteAccount error", error);
    res.status(500).json({ message: "Failed to delete account" });
  }
};

// Refresh token endpoints

/**
 * Refresh access token
 * POST /auth/refresh
 */
export const refreshAccessToken = async (req, res) => {
  try {
    if (!enforceAllowedOrigin(req, res)) return;

    // Cookie is primary, body is fallback for legacy clients
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided", code: "NO_REFRESH_TOKEN" });
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (error) {
      // Clear bad cookie
      res.clearCookie("refreshToken", getClearRefreshCookieOptions(req));

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Refresh token expired. Please login again.", code: "REFRESH_TOKEN_EXPIRED" });
      }
      return res.status(401).json({ message: "Invalid refresh token", code: "INVALID_REFRESH_TOKEN" });
    }

    // Find the account
    const Model = decoded.role === "merchant" ? Merchant : User;
    const account = await Model.findById(decoded.id).select("+refreshToken +refreshTokenExpiry +tokenVersion");

    if (!account) {
      return res.status(401).json({ message: "Account not found", code: "ACCOUNT_NOT_FOUND" });
    }

    // Validate stored token exists
    if (!account.refreshToken || !account.refreshTokenExpiry) {
      res.clearCookie("refreshToken", getClearRefreshCookieOptions(req));
      return res.status(401).json({ message: "Session expired. Please login again.", code: "SESSION_EXPIRED" });
    }

    // Check if expired
    if (account.refreshTokenExpiry < new Date()) {
      // Clean up expired token
      await clearRefreshToken(account);
      res.clearCookie("refreshToken", getClearRefreshCookieOptions(req));
      return res.status(401).json({ message: "Session expired. Please login again.", code: "SESSION_EXPIRED" });
    }

    // Version mismatch = password was changed
    if (decoded.tokenVersion !== (account.tokenVersion || 0)) {
      await clearRefreshToken(account);
      res.clearCookie("refreshToken", getClearRefreshCookieOptions(req));
      return res.status(401).json({ message: "Session invalidated. Please login again.", code: "SESSION_INVALIDATED" });
    }

    // Verify stored hash matches - detect token reuse attacks
    const isValidToken = await bcrypt.compare(refreshToken, account.refreshToken);
    if (!isValidToken) {
      // Clear all tokens on suspected attack
      await clearRefreshToken(account);
      res.clearCookie("refreshToken", getClearRefreshCookieOptions(req));
      return res.status(401).json({ message: "Invalid session. Please login again.", code: "INVALID_SESSION" });
    }

    // Issue new access token
    const newAccessToken = generateAccessToken(account);

    // Rotate refresh token for security
    const newRefreshToken = generateRefreshToken(account);
    await persistRefreshToken(account, newRefreshToken);

    // Update cookie
    res.cookie("refreshToken", newRefreshToken, getRefreshCookieOptions(req));

    res.json({
      accessToken: newAccessToken,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
      refreshExpiresIn: REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60,
      role: account.role,
    });
  } catch (error) {
    console.error("refreshAccessToken error", error);
    res.status(500).json({ message: "Failed to refresh token" });
  }
};

/**
 * Logout and invalidate refresh token
 * POST /auth/logout
 */
export const logout = async (req, res) => {
  try {
    if (!enforceAllowedOrigin(req, res)) return;

    // Cookie first, body fallback
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    // Clear cookie regardless
    res.clearCookie("refreshToken", getClearRefreshCookieOptions(req));

    if (!refreshToken) {
      const authHeader = req.headers.authorization || "";
      const accessToken = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;

      if (accessToken) {
        try {
          const accessDecoded = jwt.verify(accessToken, JWT_SECRET);
          const Model = accessDecoded.role === "merchant" ? Merchant : User;
          const account = await Model.findById(accessDecoded.id).select("+refreshToken");
          if (account && account.refreshToken) {
            await clearRefreshToken(account);
          }
        } catch (error) {
          // Ignore errors - logout is idempotent
        }
      }

      // No refresh token but still succeed (idempotent)
      return res.json({ message: "Logged out successfully" });
    }

    // Decode token to find account
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (error) {
      // Bad token - still succeed
      return res.json({ message: "Logged out successfully" });
    }

    // Clear stored token
    const Model = decoded.role === "merchant" ? Merchant : User;
    const account = await Model.findById(decoded.id).select("+refreshToken");

    if (account && account.refreshToken) {
      await clearRefreshToken(account);
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("logout error", error);
    // Always succeed for logout
    res.json({ message: "Logged out successfully" });
  }
};

/**
 * Logout from all devices
 * POST /auth/logout-all
 */
export const logoutAll = async (req, res) => {
  try {
    const Model = req.user.role === "merchant" ? Merchant : User;
    const account = await Model.findById(req.user.id).select("+tokenVersion");

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Bump version to invalidate all tokens
    account.tokenVersion = (account.tokenVersion || 0) + 1;
    account.refreshToken = undefined;
    account.refreshTokenExpiry = undefined;
    await account.save();

    res.json({ message: "Logged out from all devices successfully" });
  } catch (error) {
    console.error("logoutAll error", error);
    res.status(500).json({ message: "Failed to logout from all devices" });
  }
};

/**
 * Validate token and return user info
 * GET /auth/session
 */
export const getSession = async (req, res) => {
  try {
    const Model = req.user.role === "merchant" ? Merchant : User;
    const account = await Model.findById(req.user.id).lean();

    if (!account) {
      return res.status(404).json({ message: "Account not found", valid: false });
    }

    res.json({
      valid: true,
      role: account.role,
      user:
        account.role === "merchant"
          ? {
              id: account._id,
              shopName: account.shopName,
              email: account.email,
              isProfileComplete: account.isProfileComplete || false,
            }
          : {
              id: account._id,
              name: account.name,
              email: account.email,
            },
    });
  } catch (error) {
    console.error("getSession error", error);
    res.status(500).json({ message: "Failed to get session", valid: false });
  }
};