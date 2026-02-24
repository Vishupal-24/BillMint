import Receipt from "../models/Receipt.js";

export const createReceipt = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { userId, items = [], total, category = "general" } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Customer (userId) is required" });
    }

    const computedTotal = items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );

    const receipt = await Receipt.create({
      merchantId,
      userId,
      items,
      total: typeof total === "number" ? total : computedTotal,
      category,
    });

    res.status(201).json(receipt);
  } catch (error) {
    console.error("createReceipt error", error);
    res.status(500).json({ message: "Failed to create receipt" });
  }
};

export const getCustomerReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(receipts);
  } catch (error) {
    console.error("getCustomerReceipts error", error);
    res.status(500).json({ message: "Failed to load receipts" });
  }
};

export const getMerchantReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find({ merchantId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(receipts);
  } catch (error) {
    console.error("getMerchantReceipts error", error);
    res.status(500).json({ message: "Failed to load receipts" });
  }
};

export const getReceiptById = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id).lean();

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    const isOwner =
      (req.user.role === "customer" && receipt.userId.toString() === req.user.id) ||
      (req.user.role === "merchant" && receipt.merchantId.toString() === req.user.id);

    if (!isOwner) {
      return res.status(403).json({ message: "Not authorized to view this receipt" });
    }

    res.json(receipt);
  } catch (error) {
    console.error("getReceiptById error", error);
    res.status(500).json({ message: "Failed to load receipt" });
  }
};
