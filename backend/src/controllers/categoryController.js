import Category from "../models/Category.js";
import Item from "../models/Item.js";

// Category CRUD

/**
 * GET /api/merchant/categories
 * Get all categories for the logged-in merchant
 */
export const getCategories = async (req, res) => {
	try {
		const categories = await Category.find({ merchantId: req.user.id })
			.sort({ displayOrder: 1, createdAt: 1 })
			.lean();

		// Get item counts for each category
		const categoriesWithCounts = await Promise.all(
			categories.map(async (cat) => {
				const itemCount = await Item.countDocuments({
					merchantId: req.user.id,
					categoryId: cat._id,
					isActive: true,
				});
				return { ...cat, itemCount };
			})
		);

		res.json(categoriesWithCounts);
	} catch (error) {
		console.error("getCategories error:", error);
		res.status(500).json({ message: "Failed to fetch categories" });
	}
};

/**
 * POST /api/merchant/categories
 * Create a new category
 */
export const createCategory = async (req, res) => {
	try {
		const { name, description, color, icon, displayOrder } = req.body;

		if (!name || !name.trim()) {
			return res.status(400).json({ message: "Category name is required" });
		}

		// Check for duplicate category name for this merchant
		const existing = await Category.findOne({
			merchantId: req.user.id,
			name: name.trim(),
		});

		if (existing) {
			return res.status(400).json({ message: "Category with this name already exists" });
		}

		// Get the highest display order to add new category at the end
		const lastCategory = await Category.findOne({ merchantId: req.user.id })
			.sort({ displayOrder: -1 })
			.lean();

		const category = new Category({
			merchantId: req.user.id,
			name: name.trim(),
			description: description?.trim(),
			color: color?.trim(),
			icon: icon?.trim(),
			displayOrder: displayOrder ?? (lastCategory?.displayOrder ?? 0) + 1,
		});

		await category.save();

		res.status(201).json(category);
	} catch (error) {
		console.error("createCategory error:", error);
		if (error.code === 11000) {
			return res.status(400).json({ message: "Category with this name already exists" });
		}
		res.status(500).json({ message: "Failed to create category" });
	}
};

/**
 * PATCH /api/merchant/categories/:id
 * Update a category
 */
export const updateCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, description, color, icon, displayOrder, isActive } = req.body;

		const category = await Category.findOne({
			_id: id,
			merchantId: req.user.id,
		});

		if (!category) {
			return res.status(404).json({ message: "Category not found" });
		}

		// Check for duplicate name if name is being changed
		if (name && name.trim() !== category.name) {
			const existing = await Category.findOne({
				merchantId: req.user.id,
				name: name.trim(),
				_id: { $ne: id },
			});

			if (existing) {
				return res.status(400).json({ message: "Category with this name already exists" });
			}
			category.name = name.trim();
		}

		if (description !== undefined) category.description = description?.trim();
		if (color !== undefined) category.color = color?.trim();
		if (icon !== undefined) category.icon = icon?.trim();
		if (displayOrder !== undefined) category.displayOrder = displayOrder;
		if (isActive !== undefined) category.isActive = isActive;

		await category.save();

		res.json(category);
	} catch (error) {
		console.error("updateCategory error:", error);
		res.status(500).json({ message: "Failed to update category" });
	}
};

/**
 * DELETE /api/merchant/categories/:id
 * Delete a category (and optionally reassign items)
 */
export const deleteCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const { reassignTo } = req.query; // Optional: category ID to move items to

		const category = await Category.findOne({
			_id: id,
			merchantId: req.user.id,
		});

		if (!category) {
			return res.status(404).json({ message: "Category not found" });
		}

		// Check if category has items
		const itemCount = await Item.countDocuments({
			merchantId: req.user.id,
			categoryId: id,
		});

		if (itemCount > 0) {
			if (reassignTo) {
				// Verify the target category belongs to this merchant
				const targetCategory = await Category.findOne({
					_id: reassignTo,
					merchantId: req.user.id,
				});

				if (!targetCategory) {
					return res.status(400).json({ message: "Target category not found" });
				}

				// Reassign items to the new category
				await Item.updateMany(
					{ merchantId: req.user.id, categoryId: id },
					{ categoryId: reassignTo }
				);
			} else {
				return res.status(400).json({
					message: `Cannot delete category with ${itemCount} items. Either delete items first or specify a category to reassign them to.`,
					itemCount,
				});
			}
		}

		await Category.deleteOne({ _id: id });

		res.json({ message: "Category deleted successfully" });
	} catch (error) {
		console.error("deleteCategory error:", error);
		res.status(500).json({ message: "Failed to delete category" });
	}
};

/**
 * PATCH /api/merchant/categories/reorder
 * Reorder categories
 */
export const reorderCategories = async (req, res) => {
	try {
		const { categoryIds } = req.body; // Array of category IDs in new order

		if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
			return res.status(400).json({ message: "Category IDs array is required" });
		}

		// Update display order for each category
		const updates = categoryIds.map((id, index) =>
			Category.updateOne(
				{ _id: id, merchantId: req.user.id },
				{ displayOrder: index }
			)
		);

		await Promise.all(updates);

		res.json({ message: "Categories reordered successfully" });
	} catch (error) {
		console.error("reorderCategories error:", error);
		res.status(500).json({ message: "Failed to reorder categories" });
	}
};
