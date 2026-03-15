import POSBill from "../models/POSBill.js";
import Receipt from "../models/Receipt.js";
import Merchant from "../models/Merchant.js";

/**
 * finalizeBillAndCreateReceipt
 *
 * Centralized, idempotent receipt creation for POS bills.
 * Only call this from:
 * - Razorpay webhook handler
 * - Merchant confirm payment endpoint
 */
export const finalizeBillAndCreateReceipt = async (billId, source = "system") => {
  if (!billId) return null;

  const bill = await POSBill.findById(billId);
  if (!bill) return null;

  // If bill already linked to a receipt, return it
  if (bill.receiptId) {
    return Receipt.findById(bill.receiptId);
  }

  // If receipt already exists by billId, return it (idempotency)
  const existingByBillId = await Receipt.findOne({ billId: bill._id });
  if (existingByBillId) {
    bill.receiptId = existingByBillId._id;
    await bill.save();
    return existingByBillId;
  }

  const merchant = await Merchant.findById(bill.merchantId).select(
    "shopName merchantCode addressLine phone logoUrl receiptHeader receiptFooter brandColor businessCategory"
  ).lean();

  const isKhata = bill.paymentMethod === "khata" || bill.paymentMethod === "pending";
  // The receipt is "pending" only if it's a Khata bill AND it is NOT paid (PENDING_KHATA).
  // If merchant confirmed it (status=PAID), then receipt is completed even if method=khata.
  const isPendingKhata = isKhata && bill.status !== "PAID";
  
  const resolvedPaymentMethod = bill.paymentMethod === "pending" ? "khata" : (bill.paymentMethod || "upi");

  const receiptPayload = {
    billId: bill._id,
    merchantId: bill.merchantId,
    merchantCode: merchant?.merchantCode,
    userId: bill.customerId || (isKhata ? bill.customerId : undefined),
    items: (bill.items || []).map(item => ({
      name: item.name,
      unitPrice: item.price,
      quantity: item.quantity || 1,
    })),
    total: bill.total,
    subtotal: bill.total,
    discount: 0,
    source: "qr",
    status: isPendingKhata ? "pending" : "completed",
    paymentMethod: resolvedPaymentMethod,
    transactionDate: bill.paidAt || new Date(),
    paidAt: isPendingKhata ? null : (bill.paidAt || new Date()),
    pendingAmount: isPendingKhata ? bill.total : 0,
    currency: bill.currency || "INR",
    note: `POS Bill: ${bill.upiNote || "N/A"} | Source: ${source}`,
    merchantSnapshot: {
      shopName: merchant?.shopName,
      merchantCode: merchant?.merchantCode,
      address: merchant?.addressLine || null,
      phone: merchant?.phone || null,
      logoUrl: merchant?.logoUrl || null,
      receiptHeader: merchant?.receiptHeader || "",
      receiptFooter: merchant?.receiptFooter || "Thank you! Visit again.",
      brandColor: merchant?.brandColor || "#10b981",
      businessCategory: merchant?.businessCategory || "general",
    },
    customerSnapshot: {
      name: bill.customerName || null,
      phone: bill.customerPhone || null,
    },
  };

  const receipt = await Receipt.findOneAndUpdate(
    { billId: bill._id },
    { $setOnInsert: receiptPayload },
    { new: true, upsert: true }
  );

  if (!bill.receiptId && receipt?._id) {
    bill.receiptId = receipt._id;
    await bill.save();
  }

  return receipt;
};
