import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Merchant from "../models/Merchant.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Token config (same as authController)
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET + "_refresh";
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 30; // 30 days for Google auth
const REFRESH_TOKEN_EXPIRES_IN_MS = REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;

// Helper: Get allowed origins
const getAllowedOrigins = () => {
  const raw = process.env.CLIENT_URL;
  const defaults = ["http://localhost:5173", "https://green-recipt.vercel.app"];
  if (!raw) return defaults;
  const parsed = raw.split(",").map((o) => o.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : defaults;
};

// Helper: Check origin
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const allowed = getAllowedOrigins();
  return allowed.includes(origin);
};

const enforceAllowedOrigin = (req, res) => {
  const origin = req.headers.origin;
  if (!origin) return true;
  if (!isAllowedOrigin(origin)) {
    res.status(403).json({ message: "Forbidden origin", code: "FORBIDDEN_ORIGIN" });
    return false;
  }
  return true;
};

// Helper: Detect HTTPS
const isHttpsRequest = (req) => {
  if (String(process.env.FORCE_SECURE_COOKIES || "").toLowerCase() === "true") return true;
  if (req?.secure) return true;
  const xfProto = req?.headers?.["x-forwarded-proto"];
  if (typeof xfProto === "string" && xfProto.toLowerCase() === "https") return true;
  const origin = req?.headers?.origin;
  if (typeof origin === "string" && origin.toLowerCase().startsWith("https://")) return true;
  const referer = req?.headers?.referer;
  if (typeof referer === "string" && referer.toLowerCase().startsWith("https://")) return true;
  return false;
};

// Cookie options
const getRefreshCookieOptions = (req) => {
  const secure = process.env.NODE_ENV === "production" || isHttpsRequest(req);
  const sameSite = secure ? "none" : "lax";
  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: REFRESH_TOKEN_EXPIRES_IN_MS,
    path: "/",
  };
};

const getClearRefreshCookieOptions = (req) => {
  const secure = process.env.NODE_ENV === "production" || isHttpsRequest(req);
  const sameSite = secure ? "none" : "lax";
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  };
};

// Generate access token
const generateAccessToken = (account) => {
  return jwt.sign(
    {
      id: account._id,
      email: account.email,
      role: account.role,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
};

// Generate refresh token
const generateRefreshToken = (account) => {
  return jwt.sign(
    {
      id: account._id,
      role: account.role,
      tokenVersion: account.tokenVersion || 0,
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: `${REFRESH_TOKEN_EXPIRES_IN_DAYS}d` }
  );
};

// Persist refresh token (hashed)
const persistRefreshToken = async (account, token) => {
  account.refreshToken = await bcrypt.hash(token, 10);
  account.refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);
  await account.save();
};

/**
 * Google Authentication Handler
 * POST /api/auth/google
 * 
 * Receives Google ID token from frontend, verifies with Google,
 * creates/finds user, and issues JWT tokens
 */
export const googleAuth = async (req, res) => {
  try {
    if (!enforceAllowedOrigin(req, res)) return;

    const { credential, role = "customer" } = req.body;
    
    if (!credential) {
      return res.status(400).json({ 
        message: "Google credential is required", 
        code: "MISSING_CREDENTIAL" 
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("[GoogleAuth] GOOGLE_CLIENT_ID not configured");
      return res.status(500).json({ 
        message: "Google authentication is not configured", 
        code: "CONFIG_ERROR" 
      });
    }

    // 1. Verify Google ID token
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error("[GoogleAuth] Token verification failed:", verifyError.message);
      return res.status(401).json({ 
        message: "Invalid Google token", 
        code: "INVALID_GOOGLE_TOKEN" 
      });
    }

    const { email, name, picture, sub: googleId, email_verified } = payload;

    if (!email) {
      return res.status(400).json({ 
        message: "Email not provided by Google", 
        code: "NO_EMAIL" 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Determine which model to use based on role
    const Model = role === "merchant" ? Merchant : User;
    const otherModel = role === "merchant" ? User : Merchant;

    // 3. Check if email exists in the other role's collection
    const existsInOtherRole = await otherModel.findOne({ email: normalizedEmail });
    if (existsInOtherRole) {
      const otherRoleName = role === "merchant" ? "customer" : "merchant";
      return res.status(400).json({
        message: `This email is already registered as a ${otherRoleName}. Please use ${otherRoleName} login.`,
        code: "ROLE_MISMATCH",
        actualRole: otherRoleName,
      });
    }

    // 4. Find or create user
    let account = await Model.findOne({ email: normalizedEmail }).select("+tokenVersion");

    if (account) {
      // User exists - verify auth provider compatibility
      if (account.authProvider && account.authProvider !== "google" && account.authProvider !== "both") {
        // User registered with email/password, link Google account
        account.googleId = googleId;
        account.authProvider = "both"; // Now supports both methods
        if (!account.avatar && picture) {
          account.avatar = picture;
        }
        await account.save();
      } else if (!account.googleId) {
        // Update missing Google ID
        account.googleId = googleId;
        if (!account.authProvider) account.authProvider = "google";
        await account.save();
      }
    } else {
      // Create new user with Google
      const newAccountData = {
        email: normalizedEmail,
        name: name || "Google User",
        avatar: picture,
        googleId,
        authProvider: "google",
        isVerified: true,
        isEmailVerified: email_verified || true,
        // Generate a random password (user won't need it for Google auth)
        password: crypto.randomBytes(32).toString("hex"),
      };

      // Add role-specific fields
      if (role === "merchant") {
        newAccountData.shopName = name || "My Shop";
      }

      account = new Model(newAccountData);
      await account.save();

      console.log(`[GoogleAuth] New ${role} created: ${normalizedEmail}`);
    }

    // 5. Generate tokens
    const accessToken = generateAccessToken(account);
    const refreshToken = generateRefreshToken(account);

    // 6. Persist refresh token (hashed)
    await persistRefreshToken(account, refreshToken);

    // 7. Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, getRefreshCookieOptions(req));

    // 8. Update last login
    account.lastLoginAt = new Date();
    await account.save();

    // 9. Prepare user data for response
    const userData = {
      id: account._id,
      email: account.email,
      name: account.name,
      avatar: account.avatar,
      role: account.role,
      isVerified: account.isVerified,
      isProfileComplete: role === "merchant" 
        ? !!(account.shopName && account.shopName !== "My Shop")
        : !!account.name,
    };

    // Add merchant-specific fields
    if (role === "merchant") {
      userData.shopName = account.shopName;
      userData.gstNumber = account.gstNumber;
    }

    res.json({
      accessToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      refreshExpiresIn: REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60,
      role: account.role,
      user: userData,
      isNewUser: !account.lastLoginAt || (Date.now() - account.lastLoginAt.getTime() < 5000),
    });

  } catch (error) {
    console.error("[GoogleAuth] Error:", error);
    res.status(500).json({ 
      message: "Google authentication failed", 
      code: "AUTH_FAILED" 
    });
  }
};

/**
 * Check if Google Auth is configured
 * GET /api/auth/google/status
 */
export const googleAuthStatus = async (req, res) => {
  res.json({
    enabled: !!process.env.GOOGLE_CLIENT_ID,
    clientId: process.env.GOOGLE_CLIENT_ID ? "configured" : null,
  });
};
