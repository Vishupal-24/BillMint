import React, { useState } from "react";
import { Store, MapPin, Check, AlertCircle, Loader2, Building2, Phone, User, FileText } from "lucide-react";
import * as api from "../../services/api";
import AppWalkthrough from "./AppWalkthrough";

const popularCategories = ["Grocery", "Restaurant", "Cafe", "Bakery", "Electronics", "Clothing", "Pharmacy", "Hardware", "Stationery", "Salon", "Gym", "General Store"];

const MerchantOnboardingWizard = ({ onComplete, initialData = {} }) => {
	const [stage, setStage] = useState("form");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const initialCategoryIsPreset = popularCategories.some(
		(cat) => cat.toLowerCase() === (initialData.businessCategory || "").toLowerCase()
	);
	const [formData, setFormData] = useState({
		shopName: initialData.shopName || "",
		businessCategory: initialData.businessCategory || "",
		businessDescription: initialData.businessDescription || "",
		ownerName: initialData.ownerName || "",
		phone: initialData.phone || "",
		addressLine: initialData.addressLine || "",
	});
	const [categoryMode, setCategoryMode] = useState(initialCategoryIsPreset ? "preset" : "other");
	const [customCategory, setCustomCategory] = useState(
		initialCategoryIsPreset ? "" : initialData.businessCategory || ""
	);

	const updateField = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setError("");
	};

	const saveBusinessInfo = async (event) => {
		event?.preventDefault();
		if (!formData.shopName.trim()) {
			setError("Shop name is required");
			return;
		}

		const finalCategory = categoryMode === "other" ? customCategory.trim() : formData.businessCategory.trim();
		if (!finalCategory) {
			setError("Business category is required");
			return;
		}

		setLoading(true);
		setError("");
		try {
			await api.saveBusinessInfo({
				shopName: formData.shopName.trim(),
				businessCategory: finalCategory,
				businessDescription: formData.businessDescription.trim(),
				ownerName: formData.ownerName.trim(),
				phone: formData.phone.trim(),
				addressLine: formData.addressLine.trim(),
			});
			setStage("walkthrough");
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to save business info");
		} finally {
			setLoading(false);
		}
	};

	const finishOnboarding = async () => {
		setLoading(true);
		setError("");
		try {
			await api.completeOnboarding();
			localStorage.setItem("isProfileComplete", "true");
			onComplete?.();
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to finish onboarding");
		} finally {
			setLoading(false);
		}
	};

	if (stage === "walkthrough") {
		return (
			<div className="relative">
				{error && (
					<div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 shadow">
						<div className="flex items-center gap-2 text-sm font-medium">
							<AlertCircle size={18} />
							<span>{error}</span>
						</div>
					</div>
				)}
				<AppWalkthrough onFinish={finishOnboarding} />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-10 px-4 flex items-center">
			<div className="max-w-2xl mx-auto w-full">
				<div className="flex items-center justify-between mb-6">
					<div>
						<p className="text-sm text-emerald-700 font-semibold">Step 1 of 2</p>
						<h1 className="text-2xl font-bold text-slate-900">Tell us about your business</h1>
						<p className="text-slate-500">Just the essentials. We will guide you with a quick walkthrough next.</p>
					</div>
				</div>

				<div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-emerald-50">
					{error && (
						<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
							<AlertCircle size={20} />
							<span className="text-sm font-medium">{error}</span>
						</div>
					)}

					<form className="space-y-5" onSubmit={saveBusinessInfo}>
						<div className="text-center">
							<div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
								<Store className="w-8 h-8 text-emerald-600" />
							</div>
							<h2 className="text-xl font-semibold text-slate-900">Business basics</h2>
							<p className="text-slate-500 text-sm">This helps us personalize your experience and receipts.</p>
						</div>

						<div className="space-y-4">
							<label className="block text-sm font-semibold text-slate-700 mb-1">Shop / Business name *</label>
							<div className="relative">
								<Building2 className="absolute left-4 top-3.5 text-slate-400" size={18} />
								<input
									type="text"
									value={formData.shopName}
									onChange={(e) => updateField("shopName", e.target.value)}
									placeholder="e.g., Green Grocery Store"
									className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
									required
								/>
							</div>
						</div>

						<div className="space-y-3">
							<label className="block text-sm font-semibold text-slate-700">Business category *</label>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
								{popularCategories.map((cat) => {
									const isSelected = categoryMode === "preset" && formData.businessCategory.toLowerCase() === cat.toLowerCase();
									return (
										<button
											key={cat}
											type="button"
											onClick={() => {
												setCategoryMode("preset");
												setCustomCategory("");
												updateField("businessCategory", cat);
											}}
										className={`p-3 rounded-xl border-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
											isSelected
												? "border-emerald-500 bg-emerald-50 text-emerald-700"
												: "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
										}`}
										>
											<span className="text-sm font-medium">{cat}</span>
										</button>
									);
								})}
								<button
									type="button"
									onClick={() => {
										setCategoryMode("other");
										updateField("businessCategory", customCategory.trim());
									}}
									className={`p-3 rounded-xl border-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
										categoryMode === "other"
											? "border-emerald-500 bg-emerald-50 text-emerald-700"
											: "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
									}`}
								>
									<span className="text-sm font-medium">Other</span>
								</button>
							</div>

							{categoryMode === "other" && (
								<div className="mt-2">
									<label className="block text-xs font-medium text-slate-600 mb-1">Enter your category</label>
									<div className="relative">
										<FileText className="absolute left-4 top-3.5 text-slate-400" size={18} />
										<input
											type="text"
											value={customCategory}
											onChange={(e) => {
												setCustomCategory(e.target.value);
												updateField("businessCategory", e.target.value);
											}}
											placeholder="Describe your business category"
											className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
											required
										/>
									</div>
									<p className="text-xs text-slate-500">We'll save exactly what you type and use it on your receipts.</p>
								</div>
							)}

							{categoryMode === "preset" && (
								<p className="text-xs text-slate-500">You can also pick Other to type your own category.</p>
							)}
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-semibold text-slate-700 mb-1">Owner name</label>
								<div className="relative">
									<User className="absolute left-4 top-3.5 text-slate-400" size={18} />
									<input
										type="text"
										value={formData.ownerName}
										onChange={(e) => updateField("ownerName", e.target.value)}
										placeholder="Your name"
										className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
									/>
								</div>
							</div>
							<div>
								<label className="block text-sm font-semibold text-slate-700 mb-1">Contact number</label>
								<div className="relative">
									<Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
									<input
										type="tel"
										value={formData.phone}
										onChange={(e) => updateField("phone", e.target.value)}
										placeholder="+91 98765 43210"
										className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
									/>
								</div>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-slate-700 mb-1">Business address</label>
							<div className="relative">
								<MapPin className="absolute left-4 top-3.5 text-slate-400" size={18} />
								<input
									type="text"
									value={formData.addressLine}
									onChange={(e) => updateField("addressLine", e.target.value)}
									placeholder="Street address, City, State"
									className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-slate-700 mb-1">Business description</label>
							<div className="relative">
								<FileText className="absolute left-4 top-3.5 text-slate-400" size={18} />
								<textarea
									value={formData.businessDescription}
									onChange={(e) => updateField("businessDescription", e.target.value)}
									placeholder="Brief description of your business..."
									rows={3}
									maxLength={500}
									className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
								/>
							</div>
							<p className="text-xs text-slate-400 mt-1 text-right">{formData.businessDescription.length}/500</p>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full mt-4 flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50"
						>
							{loading ? (
								<>
									<Loader2 className="animate-spin" size={20} />
									Saving...
								</>
							) : (
								<>
									Next: Quick tour
									<Check size={18} />
								</>
							)}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default MerchantOnboardingWizard;
