import express from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import {
	getOnboardingStatus,
	saveBusinessInfo,
	saveOperatingHours,
	saveCategories,
	saveItems,
	completeOnboarding,
	skipOnboarding,
	getFullProfile,
	getUPISettings,
	updateUPISettings,
	verifyUPI,
} from "../controllers/merchantController.js";
import {
	getCategories,
	createCategory,
	updateCategory,
	deleteCategory,
	reorderCategories,
} from "../controllers/categoryController.js";
import {
	getItems,
	getItemById,
	createItem,
	createItemsBulk,
	updateItem,
	deleteItem,
	toggleAvailability,
	reorderItems,
} from "../controllers/itemController.js";

const router = express.Router();

// All routes require authentication and merchant role
router.use(protect);
router.use(requireRole("merchant"));

// Onboarding
router.get("/onboarding/status", getOnboardingStatus);
router.post("/onboarding/business-info", saveBusinessInfo);
router.post("/onboarding/operating-hours", saveOperatingHours);
router.post("/onboarding/categories", saveCategories);
router.post("/onboarding/items", saveItems);
router.post("/onboarding/complete", completeOnboarding);
router.post("/onboarding/skip", skipOnboarding);

// Profile
router.get("/profile/full", getFullProfile);

// UPI Payment Settings (for POS system)
router.get("/upi-settings", getUPISettings);
router.post("/upi-settings", updateUPISettings);
router.post("/upi-settings/verify", verifyUPI);

// Categories
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.patch("/categories/reorder", reorderCategories);
router.patch("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// Items
router.get("/items", getItems);
router.post("/items", createItem);
router.post("/items/bulk", createItemsBulk);
router.patch("/items/reorder", reorderItems);
router.get("/items/:id", getItemById);
router.patch("/items/:id", updateItem);
router.patch("/items/:id/availability", toggleAvailability);
router.delete("/items/:id", deleteItem);

export default router;
