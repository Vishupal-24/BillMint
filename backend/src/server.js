import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import receiptRoutes from "./routes/receiptRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import merchantRoutes from "./routes/merchantRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import posRoutes from "./routes/posRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { startScheduler, stopScheduler } from "./services/reminderScheduler.js";

const app = express();
app.disable("x-powered-by");

// Trust proxy headers (needed for rate limiting behind Render/Cloudflare)
app.set("trust proxy", 1);

// Database
connectDB();

// Security & middleware
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((o) => o.trim()).filter(Boolean)
  : [
      "http://localhost:5173",
      "https://green-receipt.vercel.app",
      "https://green-recipt.vercel.app",
    ];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow non-browser clients
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS not allowed"), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(helmet());
app.use(cookieParser());

// ==========================================
// RAZORPAY WEBHOOK - RAW BODY PARSER
// CRITICAL: Must be BEFORE express.json() middleware
// Webhooks require raw body for HMAC signature verification
// ==========================================
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// Customer receipt uploads may include base64 data URLs (images), which exceed 10kb.
// Keep a conservative cap to avoid overly large payloads.
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(mongoSanitize());
app.use(hpp());
app.use(compression());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", globalLimiter);

// Routes
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is awake and healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/merchant", merchantRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/payments", paymentRoutes); // Cashfree payment gateway routes

// Start reminder scheduler after routes are set up (opt-in for production)
if (String(process.env.RUN_SCHEDULER || "").toLowerCase() === "true") {
  startScheduler();
} else {
  console.log("[Scheduler] RUN_SCHEDULER is disabled. Scheduler will not start.");
}

// Error handlers
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  const isProd = process.env.NODE_ENV === "production";
  res.status(err.status || 500).json({
    message: isProd ? "Something went wrong" : err.message,
  });
});

// Start server
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  stopScheduler();
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});
