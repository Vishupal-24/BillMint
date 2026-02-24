import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import receiptRoutes from "./routes/receiptRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

const app = express();

const allowedOrigin = process.env.CLIENT_URL || "*";
const corsOptions = {
	origin: allowedOrigin === "*" ? "*" : [allowedOrigin],
	credentials: allowedOrigin !== "*",
};

app.use(cors(corsOptions));
app.use(express.json());

connectDB();

app.get("/api/health", (req, res) => {
	res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((err, req, res, next) => {
	console.error("Unhandled error", err);
	res.status(500).json({ message: "Something went wrong" });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});