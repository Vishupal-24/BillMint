import { z } from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;
const objectId = z.string().regex(objectIdRegex, "Invalid id");

// Allow null/undefined for optional money fields
const money = z.coerce
  .number({ invalid_type_error: "Must be a number" })
  .min(0, "Price must be positive")
  .nullable()
  .optional();

// Allow null/undefined for optional quantity fields  
const quantity = z.coerce
  .number({ invalid_type_error: "Must be a number" })
  .int("Quantity must be an integer")
  .min(1, "Quantity must be at least 1")
  .nullable()
  .optional();

// Phone number validation (Indian format)
const phoneNumber = z.string()
  .trim()
  .regex(/^(\+91)?[6-9]\d{9}$/, "Invalid phone number")
  .transform(val => val.replace(/^\+91/, ""))
  .optional()
  .nullable();

export const createReceiptSchema = {
  body: z.object({
    userId: objectId.optional().nullable(),
    merchantId: objectId.optional().nullable(),
    merchantCode: z.string().trim().optional().nullable(),
    // merchantName is used when customer scans QR from unregistered merchant
    merchantName: z.string().trim().max(200).optional().nullable(),
    // mid is an alias for merchantCode (short key from QR)
    mid: z.string().trim().optional().nullable(),
    items: z
      .array(
        z.object({
          name: z.string().optional().nullable(),
          unitPrice: money,
          quantity: quantity,
          // Allow QR short keys; controller will normalize
          n: z.string().optional().nullable(),
          p: z.coerce.number().optional().nullable(),
          q: z.coerce.number().optional().nullable(),
          price: z.coerce.number().optional().nullable(),
          qty: z.coerce.number().optional().nullable(),
        }).passthrough() // Allow extra fields
      )
      .default([]),
    source: z.enum(["qr", "upload", "manual"]).default("qr"),
    paymentMethod: z.enum(["upi", "card", "cash", "other", "khata"]).default("upi"),
    status: z.enum(["completed", "pending", "void"]).optional().nullable(),
    transactionDate: z
      .union([z.string(), z.date()])
      .optional()
      .nullable(),
    note: z.string().trim().max(500).optional().nullable(),
    imageUrl: z.string().optional().nullable(), // Allow base64 data URLs too, not just http URLs
    excludeFromStats: z.boolean().optional().nullable(),
    footer: z.string().trim().max(200).optional().nullable(),
    category: z.string().trim().max(100).optional().nullable(),
    total: z.coerce.number().min(0).optional().nullable(),
    // Khata (pending) fields
    customerName: z.string().trim().max(200).optional().nullable(),
    customerPhone: z.string().trim().optional().nullable(),
  }).passthrough(), // Allow extra fields from QR codes
};

export const claimReceiptSchema = {
  body: z.object({
    receiptId: objectId,
    paymentIntent: z.enum(["upi", "cash", "khata"]).optional().nullable(),
  }),
};

export const receiptIdParamSchema = { params: z.object({ id: objectId }) };

// Schema for marking receipt as paid - merchant only
export const markPaidSchema = {
  params: z.object({ id: objectId }),
  body: z.object({
    paymentMethod: z.enum(["upi", "cash", "card", "other", "pending", "khata"]).optional(),
  }),
};

export const updateReceiptSchema = {
  params: z.object({ id: objectId }),
  body: z.object({
    paymentMethod: z.enum(["upi", "card", "cash", "other", "khata"]).optional(),
    status: z.enum(["completed", "pending", "void"]).optional(),
    note: z.string().trim().max(500).optional(),
    excludeFromStats: z.boolean().optional(),
    category: z.string().trim().max(100).optional(),
  }),
};

// Schema for sending payment reminder
export const sendReminderSchema = {
  params: z.object({ id: objectId }),
};

// Schema for customer paying pending bill
export const payPendingSchema = {
  params: z.object({ id: objectId }),
  body: z.object({
    paymentMethod: z.enum(["upi", "cash", "card", "other"]).optional(),
  }),
};
