import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

// Generate short unique bill reference: GR-XXXXXXXX
const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);

/**
 * POSBill Schema - Merchant-Confirmed UPI Payment Model
 * 
 * This is a bank-grade POS system where:
 * - Money is moved by UPI apps (GPay, PhonePe, etc.)
 * - Money confirmation is ONLY by merchant
 * - No webhooks, no gateways - pure UPI deep link flow
 * 
 * Flow:
 * 1. Merchant creates bill → QR generated with UPI intent
 * 2. Customer scans → pays via any UPI app
 * 3. Merchant sees payment in their UPI app
 * 4. Merchant clicks "I RECEIVED" → bill marked PAID
 * 5. Receipt is auto-generated
 */

const billItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: false }
);

// Virtual for line total
billItemSchema.virtual("lineTotal").get(function () {
  return this.price * this.quantity;
});

const posBillSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
      index: true,
    },
    
    // Bill items
    items: {
      type: [billItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: "Bill must have at least one item",
      },
    },
    
    // Total amount
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Bill status - CORE STATE MACHINE
    // AWAITING_PAYMENT: QR generated, waiting for merchant confirmation
    // PAID: Merchant confirmed payment received
    // EXPIRED: Bill timed out (10 min default)
    // CANCELLED: Merchant cancelled the bill
    // PENDING_KHATA: Customer selected Khata, waiting for merchant confirmation
    status: {
      type: String,
      enum: ["AWAITING_PAYMENT", "PAID", "EXPIRED", "CANCELLED", "PENDING", "PENDING_KHATA"],
      default: "AWAITING_PAYMENT",
      index: true,
    },
    
    // Unique reference shown in UPI transaction note
    // This is how merchant matches UPI payment to bill
    upiNote: {
      type: String,
      unique: true,
      sparse: true,
    },
    
    // Payment timestamps
    paidAt: {
      type: Date,
      default: null,
    },
    
    // Expiry tracking (default 10 minutes)
    expiresAt: {
      type: Date,
      required: true,
    },
    
    // Reference to generated receipt (after payment confirmed)
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receipt",
      default: null,
    },
    
    // Optional customer info (if provided during payment)
    customerPhone: {
      type: String,
      trim: true,
      default: null,
    },
    customerName: {
      type: String,
      trim: true,
      default: null,
    },
    
    // Reference to customer who claimed this receipt (if logged in)
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    
    // Payment method selected by customer (cash or upi)
    paymentMethod: {
      type: String,
      // 'other' is used for Razorpay checkout options like card/netbanking/wallet
      // 'pending' is used for Khata (pay later)
      // 'khata' is now explicitly supported
      enum: ["cash", "upi", "other", "pending", "khata", null],
      default: null,
    },
    
    // Flag to track if customer has selected payment method
    customerSelected: {
      type: Boolean,
      default: false,
    },
    
    // Currency (always INR for UPI)
    currency: {
      type: String,
      default: "INR",
    },
    
    // ==========================================
    // RAZORPAY PAYMENT GATEWAY FIELDS
    // Used for Razorpay-based UPI payments (Zomato-style flow)
    // ==========================================
    
    // Razorpay order ID (returned by Razorpay API when order is created)
    // Format: order_XXXXXXX - unique identifier in Razorpay system
    razorpayOrderId: {
      type: String,
      sparse: true,
      index: true,
    },
    
    // Razorpay payment ID (received after successful payment)
    // Format: pay_XXXXXXX - the actual payment transaction ID
    razorpayPaymentId: {
      type: String,
      sparse: true,
    },
    
    // Razorpay signature (used for payment verification)
    // Verified using HMAC-SHA256 with secret key
    razorpaySignature: {
      type: String,
      sparse: true,
    },
    
    // Order status from Razorpay (tracked for reconciliation)
    // created, attempted, paid (Razorpay's order states)
    razorpayOrderStatus: {
      type: String,
      enum: ["created", "attempted", "paid", null],
      default: null,
    },
    
    // Raw webhook payload (stored for debugging/reconciliation)
    razorpayWebhookPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    
    // Whether payment was via Razorpay gateway (vs direct UPI deep link)
    isRazorpayPayment: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook to generate unique UPI note
posBillSchema.pre("save", async function (next) {
  if (!this.upiNote) {
    // Generate unique reference: GR-XXXXXXXX
    let note;
    let exists = true;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (exists && attempts < maxAttempts) {
      note = `GR-${nanoid()}`;
      exists = await mongoose.model("POSBill").findOne({ upiNote: note });
      attempts++;
    }
    
    if (exists) {
      return next(new Error("Failed to generate unique bill reference"));
    }
    
    this.upiNote = note;
  }
  
  // Set expiry if not set (default 10 minutes)
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  }
  
  next();
});

// Virtual to check if bill is expired
posBillSchema.virtual("isExpired").get(function () {
  return this.status === "AWAITING_PAYMENT" && new Date() > this.expiresAt;
});

// Method to check and update expiry status
posBillSchema.methods.checkAndExpire = async function () {
  if (this.status === "AWAITING_PAYMENT" && new Date() > this.expiresAt) {
    this.status = "EXPIRED";
    await this.save();
    return true;
  }
  return false;
};

// Static method to expire old bills (for scheduled cleanup)
posBillSchema.statics.expireOldBills = async function () {
  const result = await this.updateMany(
    {
      status: "AWAITING_PAYMENT",
      expiresAt: { $lt: new Date() },
    },
    {
      $set: { status: "EXPIRED" },
    }
  );
  return result.modifiedCount;
};

// Indexes for efficient queries
posBillSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
// Note: upiNote index is already created via unique:true in schema
posBillSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: "EXPIRED" } });

const POSBill = mongoose.model("POSBill", posBillSchema);

export default POSBill;
