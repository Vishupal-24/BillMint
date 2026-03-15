import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
	{
		merchantId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Merchant",
			required: true,
			index: true,
		},
		categoryId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Category",
			required: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 100,
		},
		description: {
			type: String,
			trim: true,
			maxlength: 500,
		},
		price: {
			type: Number,
			required: true,
			min: 0,
		},
		unit: {
			type: String,
			trim: true,
			default: "piece",
			enum: ["piece", "kg", "g", "l", "ml", "dozen", "pack", "plate", "cup", "glass", "serving", "other"],
		},
		// Stock
		isAvailable: {
			type: Boolean,
			default: true,
		},
		stockQuantity: {
			type: Number,
			default: null, // null = unlimited
			min: 0,
		},
		lowStockThreshold: {
			type: Number,
			default: 10,
			min: 0,
		},
		// Discounts
		discountPrice: {
			type: Number,
			min: 0,
		},
		isDiscounted: {
			type: Boolean,
			default: false,
		},
		// Display
		displayOrder: {
			type: Number,
			default: 0,
		},
		imageUrl: {
			type: String,
			trim: true,
		},
		// Variants (size, etc.)
		hasVariants: {
			type: Boolean,
			default: false,
		},
		variants: [
			{
				name: { type: String, trim: true },
				price: { type: Number, min: 0 },
				isAvailable: { type: Boolean, default: true },
			},
		],
		// Tags
		tags: [
			{
				type: String,
				trim: true,
				lowercase: true,
			},
		],
		// Identifiers
		barcode: {
			type: String,
			trim: true,
			sparse: true,
		},
		sku: {
			type: String,
			trim: true,
			sparse: true,
		},
		// Tax (percentage)
		taxRate: {
			type: Number,
			default: 0, // Percentage
			min: 0,
			max: 100,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

// Indexes
itemSchema.index({ merchantId: 1, categoryId: 1 });
itemSchema.index({ merchantId: 1, name: "text" });
itemSchema.index({ merchantId: 1, isAvailable: 1 });
itemSchema.index({ merchantId: 1, isActive: 1 });
itemSchema.index({ merchantId: 1, displayOrder: 1 });
itemSchema.index({ merchantId: 1, barcode: 1 }, { sparse: true });
itemSchema.index({ merchantId: 1, sku: 1 }, { sparse: true });
itemSchema.index({ merchantId: 1, tags: 1 });

// Price after discount
itemSchema.virtual("effectivePrice").get(function () {
	if (this.isDiscounted && this.discountPrice !== undefined && this.discountPrice !== null) {
		return this.discountPrice;
	}
	return this.price;
});

// Stock status derived from quantity
itemSchema.virtual("stockStatus").get(function () {
	if (this.stockQuantity === null) return "unlimited";
	if (this.stockQuantity === 0) return "out_of_stock";
	if (this.stockQuantity <= this.lowStockThreshold) return "low_stock";
	return "in_stock";
});

itemSchema.set("toJSON", { virtuals: true });
itemSchema.set("toObject", { virtuals: true });

const Item = mongoose.model("Item", itemSchema);

export default Item;
