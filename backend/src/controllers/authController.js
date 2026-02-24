import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import Merchant from "../models/Merchant.js";
import { sendOtpEmail } from "../utils/sendEmail.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_WINDOW_MS = 60 * 1000; // 1 minute cooldown between OTP sends

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Define it in your environment before starting the server.");
}

export const forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;

    // Helper to find the right collection
    const account = await findAccountByRole(email, role); // Reuse your existing helper

    if (!account) {
      // Security: Don't reveal if user exists or not, but for dev we return 404
      return res.status(404).json({ message: "Account not found" });
    }

    // Resend cooldown
    if (account.otpLastSentAt && Date.now() - account.otpLastSentAt.getTime() < OTP_RESEND_WINDOW_MS) {
      const waitSeconds = Math.ceil((OTP_RESEND_WINDOW_MS - (Date.now() - account.otpLastSentAt.getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${waitSeconds}s before requesting another code.` });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // Save OTP to User
    account.otpCodeHash = otpHash;
    account.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    account.otpLastSentAt = new Date();
    await account.save();

    // Send Email
    await sendOtpEmail(email, otp);

    res.json({ message: "OTP sent to email" });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. RESET PASSWORD (Verifies OTP + Sets New Password)
export const resetPassword = async (req, res) => {
  try {
    const { email, role, otp, newPassword } = req.body;

    const account = await findAccountByRole(email, role);
    if (!account) return res.status(404).json({ message: "Account not found" });

    // Verify OTP Logic (Same as verifyOtp)
    if (!account.otpCodeHash || !account.otpExpiresAt || account.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const isMatch = await bcrypt.compare(otp, account.otpCodeHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid code" });
    }

    account.password = newPassword;
    
    // Clear OTP fields so it can't be reused
    account.otpCodeHash = undefined;
    account.otpExpiresAt = undefined;
    
    await account.save();

    res.json({ message: "Password reset successful" });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

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
    // If role was wrong, attempt the other collection so users aren't blocked by a role mismatch.
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

    const user = new User({ name, email, password, isVerified: false });
    const code = await persistOtp(user);
    await sendOtpEmail(user.email, code);

    res.status(201).json({
      message: "Registration successful. Enter the code we sent to verify your account.",
      email: user.email,
      role: user.role,
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

    const merchant = new Merchant({ shopName, email, password, isVerified: false });
    const code = await persistOtp(merchant);
    await sendOtpEmail(merchant.email, code);

    res.status(201).json({
      message: "Registration successful. Enter the code we sent to verify your account.",
      email: merchant.email,
      role: merchant.role,
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

    const Model = role === "customer" ? User : Merchant;
    const account = await Model.findOne({ email });

    if (!account) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!account.isVerified) {
      return res.status(401).json({ message: "Please verify your email first" });
    }

    const isMatch = await account.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(account);

    res.json({
      token,
      role: account.role,
      user:
        role === "customer"
          ? { id: account._id, name: account.name, email: account.email }
          : { id: account._id, shopName: account.shopName, email: account.email },
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

export const requestOtp = async (req, res) => {
  try {
    const { email, role = "customer" } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const account = await findAccountByRole(email, role);

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (account.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    if (account.otpLastSentAt && Date.now() - account.otpLastSentAt.getTime() < OTP_RESEND_WINDOW_MS) {
      const waitSeconds = Math.ceil((OTP_RESEND_WINDOW_MS - (Date.now() - account.otpLastSentAt.getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${waitSeconds}s before requesting another code.` });
    }

    const code = await persistOtp(account);
    await sendOtpEmail(account.email, code);

    res.json({ message: "Verification code sent" });
  } catch (error) {
    console.error("requestOtp error", error);
    res.status(500).json({ message: "Failed to send code" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, role = "customer", code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const account = await findAccountByRole(email, role);

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (account.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    if (!account.otpCodeHash || !account.otpExpiresAt) {
      return res.status(400).json({ message: "No active code. Request a new one." });
    }

    if (account.otpExpiresAt.getTime() < Date.now()) {
      account.otpCodeHash = undefined;
      account.otpExpiresAt = undefined;
      await account.save();
      return res.status(400).json({ message: "Code expired. Request a new one." });
    }

    if (account.otpAttempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ message: "Too many attempts. Request a new code." });
    }

    const isMatch = await bcrypt.compare(code, account.otpCodeHash);

    if (!isMatch) {
      account.otpAttempts += 1;
      await account.save();
      return res.status(400).json({ message: "Invalid code" });
    }

    account.isVerified = true;
    account.otpCodeHash = undefined;
    account.otpExpiresAt = undefined;
    account.otpAttempts = 0;
    await account.save();

    const token = generateToken(account);

    res.json({
      message: "Account verified successfully",
      token,
      role: account.role,
      user:
        account.role === "merchant"
          ? { id: account._id, shopName: account.shopName, email: account.email }
          : { id: account._id, name: account.name, email: account.email },
    });
  } catch (error) {
    console.error("verifyOtp error", error);
    res.status(500).json({ message: "Failed to verify code" });
  }
};
