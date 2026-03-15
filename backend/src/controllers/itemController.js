import Item from "../models/Item.js";
import Category from "../models/Category.js";

// Item CRUD

/**
 * GET /api/merchant/items
 * Get all items for the logged-in merchant
 * Supports filtering by category, availability, search
 */
export const getItems = async (req, res) => {
	try {
		const { categoryId, isAvailable, search, page = 1, limit = 100 } = req.query;

		const query = { merchantId: req.user.id, isActive: true };

		// Apply filters
		if (categoryId) {
			query.categoryId = categoryId;
		}
		if (isAvailable !== undefined) {
			query.isAvailable = isAvailable === "true";
		}
		if (search) {
			query.$or = [
				{ name: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
				{ tags: { $in: [new RegExp(search, "i")] } },
			];
		}

		const skip = (parseInt(page) - 1) * parseInt(limit);

		const [items, total] = await Promise.all([
			Item.find(query)
				.populate("categoryId", "name color")
				.sort({ displayOrder: 1, createdAt: -1 })
				.skip(skip)
				.limit(parseInt(limit))
				.lean(),
			Item.countDocuments(query),
		]);

		res.json({
			items,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				pages: Math.ceil(total / parseInt(limit)),
			},
		});
	} catch (error) {
		console.error("getItems error:", error);
		res.status(500).json({ message: "Failed to fetch items" });
	}
};

/**
 * GET /api/merchant/items/:id
 * Get a single item by ID
 */
export const getItemById = async (req, res) => {
	try {
		const { id } = req.params;

		const item = await Item.findOne({
			_id: id,
			merchantId: req.user.id,
		}).populate("categoryId", "name color");

		if (!item) {
			return res.status(404).json({ message: "Item not found" });
		}

		res.json(item);
	} catch (error) {
		console.error("getItemById error:", error);
		res.status(500).json({ message: "Failed to fetch item" });
	}
};

/**
 * POST /api/merchant/items
 * Create a new item
 */
export const createItem = async (req, res) => {
	try {
		const {
			categoryId,
			name,
			description,
			price,
			unit,
			isAvailable,
			stockQuantity,
			lowStockThreshold,
			discountPrice,
			isDiscounted,
			imageUrl,
			hasVariants,
			variants,
			tags,
			barcode,
			sku,
			taxRate,
			displayOrder,
		} = req.body;

		// Validate required fields
		if (!categoryId) {
			return res.status(400).json({ message: "Category is required" });
		}
		if (!name || !name.trim()) {
			return res.status(400).json({ message: "Item name is required" });
		}
		if (price === undefined || price === null || price < 0) {
			return res.status(400).json({ message: "Valid price is required" });
		}

		// Verify category belongs to this merchant
		const category = await Category.findOne({
			_id: categoryId,
			merchantId: req.user.id,
		});

		if (!category) {
			return res.status(400).json({ message: "Invalid category" });
		}

		// Get the highest display order for this category
		const lastItem = await Item.findOne({
			merchantId: req.user.id,
			categoryId,
		})
			.sort({ displayOrder: -1 })
			.lean();

		const item = new Item({
			merchantId: req.user.id,
			categoryId,
			name: name.trim(),
			description: description?.trim(),
			price,
			unit: unit || "piece",
			isAvailable: isAvailable !== false,
			stockQuantity: stockQuantity ?? null,
			lowStockThreshold: lowStockThreshold ?? 10,
			discountPrice,
			isDiscounted: isDiscounted || false,
			imageUrl: imageUrl?.trim(),
			hasVariants: hasVariants || false,
			variants: variants || [],
			tags: tags || [],
			barcode: barcode?.trim(),
			sku: sku?.trim(),
			taxRate: taxRate ?? 0,
			displayOrder: displayOrder ?? (lastItem?.displayOrder ?? 0) + 1,
		});

		await item.save();

		// Populate category info for response
		await item.populate("categoryId", "name color");

		res.status(201).json(item);
	} catch (error) {
		console.error("createItem error:", error);
		res.status(500).json({ message: "Failed to create item" });
	}
};

/**
 * POST /api/merchant/items/bulk
 * Create multiple items at once (for onboarding)
 */
export const createItemsBulk = async (req, res) => {
	try {
		const { items } = req.body;

		if (!Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ message: "Items array is required" });
		}

		// Validate and prepare items
		const preparedItems = [];
		const errors = [];

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			if (!item.categoryId) {
				errors.push({ index: i, message: "Category is required" });
				continue;
			}
			if (!item.name || !item.name.trim()) {
				errors.push({ index: i, message: "Item name is required" });
				continue;
			}
			if (item.price === undefined || item.price === null || item.price < 0) {
				errors.push({ index: i, message: "Valid price is required" });
				continue;
			}

			// Verify category belongs to this merchant
			const category = await Category.findOne({
				_id: item.categoryId,
				merchantId: req.user.id,
			});

			if (!category) {
				errors.push({ index: i, message: "Invalid category" });
				continue;
			}

			preparedItems.push({
				merchantId: req.user.id,
				categoryId: item.categoryId,
				name: item.name.trim(),
				description: item.description?.trim(),
				price: item.price,
				unit: item.unit || "piece",
				isAvailable: item.isAvailable !== false,
				displayOrder: i,
			});
		}

		if (preparedItems.length === 0) {
			return res.status(400).json({
				message: "No valid items to create",
				errors,
			});
		}

		const createdItems = await Item.insertMany(preparedItems);

		res.status(201).json({
			message: `Successfully created ${createdItems.length} items`,
			items: createdItems,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (error) {
		console.error("createItemsBulk error:", error);
		res.status(500).json({ message: "Failed to create items" });
	}
};

/**
 * PATCH /api/merchant/items/:id
 * Update an item
 */
export const updateItem = async (req, res) => {
	try {
		const { id } = req.params;
		const updates = req.body;

		const item = await Item.findOne({
			_id: id,
			merchantId: req.user.id,
		});

		if (!item) {
			return res.status(404).json({ message: "Item not found" });
		}

		// If changing category, verify new category belongs to this merchant
		if (updates.categoryId && updates.categoryId !== item.categoryId.toString()) {
			const category = await Category.findOne({
				_id: updates.categoryId,
				merchantId: req.user.id,
			});

			if (!category) {
				return res.status(400).json({ message: "Invalid category" });
			}
			item.categoryId = updates.categoryId;
		}

		// Update allowed fields
		const allowedFields = [
			"name",
			"description",
			"price",
			"unit",
			"isAvailable",
			"stockQuantity",
			"lowStockThreshold",
			"discountPrice",
			"isDiscounted",
			"imageUrl",
			"hasVariants",
			"variants",
			"tags",
			"barcode",
			"sku",
			"taxRate",
			"displayOrder",
			"isActive",
		];

		for (const field of allowedFields) {
			if (updates[field] !== undefined) {
				if (typeof updates[field] === "string") {
					item[field] = updates[field].trim();
				} else {
					item[field] = updates[field];
				}
			}
		}

		await item.save();
		await item.populate("categoryId", "name color");

		res.json(item);
	} catch (error) {
		console.error("updateItem error:", error);
		res.status(500).json({ message: "Failed to update item" });
	}
};

/**
 * DELETE /api/merchant/items/:id
 * Delete an item (soft delete by setting isActive to false)
 */
export const deleteItem = async (req, res) => {
	try {
		const { id } = req.params;
		const { permanent } = req.query;

		const item = await Item.findOne({
			_id: id,
			merchantId: req.user.id,
		});

		if (!item) {
			return res.status(404).json({ message: "Item not found" });
		}

		if (permanent === "true") {
			await Item.deleteOne({ _id: id });
		} else {
			item.isActive = false;
			await item.save();
		}

		res.json({ message: "Item deleted successfully" });
	} catch (error) {
		console.error("deleteItem error:", error);
		res.status(500).json({ message: "Failed to delete item" });
	}
};

/**
 * PATCH /api/merchant/items/:id/availability
 * Toggle item availability
 */
export const toggleAvailability = async (req, res) => {
	try {
		const { id } = req.params;
		const { isAvailable } = req.body;

		const item = await Item.findOneAndUpdate(
			{ _id: id, merchantId: req.user.id },
			{ isAvailable },
			{ new: true }
		).populate("categoryId", "name color");

		if (!item) {
			return res.status(404).json({ message: "Item not found" });
		}

		res.json(item);
	} catch (error) {
		console.error("toggleAvailability error:", error);
		res.status(500).json({ message: "Failed to update availability" });
	}
};

/**
 * PATCH /api/merchant/items/reorder
 * Reorder items within a category
 */
export const reorderItems = async (req, res) => {
	try {
		const { itemIds } = req.body; // Array of item IDs in new order

		if (!Array.isArray(itemIds) || itemIds.length === 0) {
			return res.status(400).json({ message: "Item IDs array is required" });
		}

		// Update display order for each item
		const updates = itemIds.map((id, index) =>
			Item.updateOne({ _id: id, merchantId: req.user.id }, { displayOrder: index })
		);

		await Promise.all(updates);

		res.json({ message: "Items reordered successfully" });
	} catch (error) {
		console.error("reorderItems error:", error);
		res.status(500).json({ message: "Failed to reorder items" });
	}
};
