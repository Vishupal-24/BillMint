import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, default: "Item" },
    unitPrice: { type: Number, required: false, min: 0, default: 0 },
    quantity: { type: Number, required: false, min: 1, default: 1 },
  },
  { _id: false }
);

itemSchema.virtual("lineTotal").get(function getLineTotal() {
  return (this.unitPrice || 0) * (this.quantity || 0);
});

const receiptSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: false,
    },
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "POSBill",
      default: undefined, // Use undefined instead of null for sparse index to work
    },
    merchantCode: {
      type: String,
      trim: true,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    items: {
      type: [itemSchema],
      default: [],
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    source: {
      type: String,
      enum: ["qr", "upload", "manual"],
      default: "qr",
    },
    status: {
      type: String,
      enum: ["completed", "pending", "void", "created", "waiting_for_merchant"],
      default: "completed",
    },
    // Khata (pending dues) fields
    pendingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastReminderSentAt: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "card", "cash", "other", "khata"],
      default: "upi",
    },
    transactionDate: {
      type: Date,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    excludeFromStats: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
      default: null,
      trim: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    footer: {
      type: String,
      default: "",
      trim: true,
    },
    merchantSnapshot: {
      shopName: { type: String, trim: true },
      merchantCode: { type: String, trim: true },
      address: { type: String, trim: true },
      phone: { type: String, trim: true },
      logoUrl: { type: String, trim: true },
      receiptHeader: { type: String, trim: true },
      receiptFooter: { type: String, trim: true },
      brandColor: { type: String, trim: true, default: "#10b981" },
      businessCategory: { type: String, trim: true },
    },
    customerSnapshot: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    // Customer-selected intent after scanning the QR (does NOT finalize payment)
    customerPaymentIntent: {
      type: String,
      enum: ["upi", "cash", "khata"],
      default: null,
    },
    customerPaymentIntentAt: {
      type: Date,
      default: null,
    },
    category: {
      type: String,
      trim: true,
      default: "general",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    // Receipt acknowledgment flow timestamps
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

receiptSchema.index({ merchantId: 1, transactionDate: -1 });
receiptSchema.index({ merchantCode: 1, transactionDate: -1 });
receiptSchema.index({ merchantId: 1, status: 1, transactionDate: 1 }); // For pending receipts (khata)
receiptSchema.index({ userId: 1, status: 1 }); // For customer pending receipts
receiptSchema.index({ userId: 1, transactionDate: -1 });
receiptSchema.index({ source: 1 });
receiptSchema.index({ excludeFromStats: 1 });
// billId index is defined here only (unique + sparse allows multiple documents without billId)
receiptSchema.index({ billId: 1 }, { unique: true, sparse: true });

const Receipt = mongoose.model("Receipt", receiptSchema);

export default Receipt;
