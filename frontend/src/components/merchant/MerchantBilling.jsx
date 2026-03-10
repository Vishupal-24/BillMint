import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Zap,
  QrCode,
  X,
  Loader2,
  Smartphone,
  Banknote,
  Clock,
  CheckCircle,
  Link as LinkIcon,
  ArrowLeft,
  ChevronDown,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createReceipt,
  createPOSBill,
  confirmPOSPayment,
  cancelPOSBill,
  fetchPublicBill,
} from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";

// ============================================================================
// CONSTANTS
// ============================================================================
const POLL_INTERVAL_MS = 2000;
const QR_EXPIRY_MINUTES = 10;
const QR_CODE_SIZE = 300;
const DEFAULT_CATEGORY = "General";
const ALL_CATEGORIES = "All";

const PAYMENT_METHODS = {
  UPI: "upi",
  CASH: "cash",
  PENDING: "pending",
  KHATA: "khata",
};

const BILL_STATUS = {
  PENDING: "PENDING",
  EXPIRED: "EXPIRED",
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const getItemId = (item) => item._id || item.id;
const getItemImage = (item) => item.imageUrl || item.image || item.img || item.photo;
const formatTime = (seconds) => 
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
const generateQrUrl = (paymentLink) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${QR_CODE_SIZE}x${QR_CODE_SIZE}&data=${encodeURIComponent(paymentLink)}`;
const formatCurrency = (amount) => `₹${amount}`;

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook to manage cart state and operations
 */
const useCart = () => {
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const finalTotal = useMemo(
    () => Math.max(0, cartTotal - discount),
    [cartTotal, discount]
  );

  const addToCart = useCallback((item) => {
    setCart((prev) => {
      const itemId = getItemId(item);
      const exists = prev.find((i) => i.id === itemId);
      const itemImage = getItemImage(item);

      if (exists) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, id: itemId, quantity: 1, imageUrl: itemImage }];
    });
  }, []);

  const addManualItem = useCallback((name, price) => {
    const newItem = {
      id: `manual-${Date.now()}`,
      name,
      price: parseFloat(price),
      quantity: 1,
      isManual: true,
    };
    setCart((prev) => [...prev, newItem]);
  }, []);

  const updateQuantity = useCallback((itemId, delta) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscount(0);
  }, []);

  return {
    cart,
    discount,
    setDiscount,
    cartTotal,
    totalItems,
    finalTotal,
    addToCart,
    addManualItem,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
};

/**
 * Hook to manage inventory filtering
 */
const useInventoryFilter = (inventory) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);

  const categories = useMemo(
    () => [ALL_CATEGORIES, ...new Set(inventory.map((i) => i.category || DEFAULT_CATEGORY))],
    [inventory]
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return inventory.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(query);
      const itemCategory = item.category || DEFAULT_CATEGORY;
      const matchesCategory =
        selectedCategory === ALL_CATEGORIES || itemCategory === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchQuery, selectedCategory]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredItems,
  };
};

/**
 * Hook to manage payment flow
 */
const usePaymentFlow = (cart, finalTotal, cartTotal, discount, profile, onSuccess) => {
  const [posBill, setPosBill] = useState(null);
  const [showPaymentQr, setShowPaymentQr] = useState(false);
  const [paymentQrUrl, setPaymentQrUrl] = useState("");
  const [expiryCountdown, setExpiryCountdown] = useState(0);
  const [customerPaymentMethod, setCustomerPaymentMethod] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const pollIntervalRef = useRef(null);
  const expiryTimerRef = useRef(null);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
    };
  }, []);

  // Poll for customer action
  useEffect(() => {
    if (!showPaymentQr || !posBill?.bill?.id) return;

    const pollForUpdates = async () => {
      try {
        const { data } = await fetchPublicBill(posBill.bill.id);

        if (data.customerSelected && data.paymentMethod) {
          setCustomerPaymentMethod(data.paymentMethod);
          if (data.customerName || data.customerPhone) {
            setCustomerInfo({
              name: data.customerName || "",
              phone: data.customerPhone || "",
            });
          }
        }

        if (data.status === BILL_STATUS.PENDING || data.paymentMethod === PAYMENT_METHODS.PENDING) {
          toast.success("Added to Khata! 📒", { duration: 4000 });
          handleSuccessCleanup();
        }

        if (data.status === BILL_STATUS.EXPIRED) {
          toast.error("Bill expired");
          handleClosePaymentQr();
        }
      } catch {
        // Silent catch for polling errors
      }
    };

    pollIntervalRef.current = setInterval(pollForUpdates, POLL_INTERVAL_MS);
    return () => clearInterval(pollIntervalRef.current);
  }, [showPaymentQr, posBill?.bill?.id]);

  // Expiry timer
  useEffect(() => {
    if (!showPaymentQr || !posBill?.bill?.expiresAt) return;

    const expiryTime = new Date(posBill.bill.expiresAt).getTime();

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setExpiryCountdown(remaining);
      if (remaining <= 0) {
        toast.error("QR Code Expired");
        handleClosePaymentQr();
      }
    };

    updateCountdown();
    expiryTimerRef.current = setInterval(updateCountdown, 1000);
    return () => clearInterval(expiryTimerRef.current);
  }, [showPaymentQr, posBill?.bill?.expiresAt]);

  const handleSuccessCleanup = useCallback(() => {
    setShowPaymentQr(false);
    setPosBill(null);
    setCustomerPaymentMethod(null);
    setPaymentQrUrl("");
    onSuccess?.();
    window.dispatchEvent(new Event("merchant-receipts-updated"));
  }, [onSuccess]);

  const handleClosePaymentQr = useCallback(async () => {
    if (posBill?.bill?.id) {
      try {
        await cancelPOSBill(posBill.bill.id);
      } catch {
        // Silent fail
      }
    }
    setShowPaymentQr(false);
    setPosBill(null);
    setCustomerPaymentMethod(null);
    setPaymentQrUrl("");
  }, [posBill?.bill?.id]);

  const handleGeneratePaymentQR = useCallback(async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const receiptPayload = {
        items: cart.map((i) => ({
          name: i.name,
          unitPrice: i.price,
          quantity: i.quantity,
        })),
        source: "qr",
        paymentMethod: "other",
        transactionDate: new Date().toISOString(),
        total: finalTotal,
        subtotal: cartTotal,
        discount,
        footer: profile?.receiptFooter,
        status: "pending",
      };

      await createReceipt(receiptPayload);

      const posPayload = {
        items: cart.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        expiryMinutes: QR_EXPIRY_MINUTES,
      };

      const { data } = await createPOSBill(posPayload);

      setPosBill(data);
      const paymentLink = `${window.location.origin}/pay/${data.bill.id}`;
      setPaymentQrUrl(generateQrUrl(paymentLink));
      setShowPaymentQr(true);
      toast.success("QR Generated");
    } catch (err) {
      console.error("Failed to generate bill:", err);
      toast.error(err.response?.data?.message || "Failed to generate bill");
    } finally {
      setIsProcessing(false);
    }
  }, [cart, finalTotal, cartTotal, discount, profile?.receiptFooter]);

  const handleConfirmPayment = useCallback(async () => {
    if (!posBill?.bill?.id) return;
    setIsProcessing(true);

    try {
      await confirmPOSPayment(posBill.bill.id);
      toast.success("Payment Confirmed & Receipt Sent!", { icon: "✅" });
      handleSuccessCleanup();
    } catch {
      toast.error("Confirmation failed");
    } finally {
      setIsProcessing(false);
    }
  }, [posBill?.bill?.id, handleSuccessCleanup]);

  const copyPaymentLink = useCallback(() => {
    if (!posBill?.bill?.id) return;
    const url = `${window.location.origin}/pay/${posBill.bill.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Payment link copied to clipboard!");
  }, [posBill?.bill?.id]);

  return {
    posBill,
    showPaymentQr,
    paymentQrUrl,
    expiryCountdown,
    customerPaymentMethod,
    customerInfo,
    isProcessing,
    handleGeneratePaymentQR,
    handleConfirmPayment,
    handleClosePaymentQr,
    copyPaymentLink,
  };
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const MobileTopBar = ({ onBack, isDark }) => (
  <header
    className={`fixed top-0 left-0 w-full z-30 border-b px-4 h-14 flex items-center justify-between shrink-0 shadow-sm md:hidden ${
      isDark ? "bg-dark-card border-dark-border" : "bg-white border-slate-200"
    }`}
  >
    <button
      onClick={onBack}
      className={`p-2 -ml-2 rounded-full transition-colors ${
        isDark ? "text-slate-400 hover:bg-dark-surface" : "text-slate-600 hover:bg-slate-100"
      }`}
      aria-label="Go back"
    >
      <ArrowLeft size={22} />
    </button>
    <h1 className={`font-bold text-base ${isDark ? "text-white" : "text-slate-800"}`}>
      New Bill
    </h1>
    <div className="w-10" aria-hidden="true" />
  </header>
);

const SearchBar = ({ value, onChange, isDark }) => (
  <div className="relative">
    <Search
      className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
        isDark ? "text-slate-500" : "text-slate-400"
      }`}
      size={16}
      aria-hidden="true"
    />
    <input
      type="text"
      placeholder="Search inventory..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium ${
        isDark
          ? "bg-dark-surface border-dark-border text-white placeholder:text-slate-500"
          : "bg-slate-100 border-transparent text-slate-800 placeholder:text-slate-400"
      }`}
      aria-label="Search inventory"
    />
  </div>
);

const CategoryFilter = ({ categories, selected, onSelect, isDark }) => (
  <nav
    className="flex gap-2 overflow-x-auto pb-1 no-scrollbar"
    role="tablist"
    aria-label="Filter by category"
  >
    {categories.map((cat) => (
      <button
        key={cat}
        onClick={() => onSelect(cat)}
        role="tab"
        aria-selected={selected === cat}
        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all border ${
          selected === cat
            ? "bg-emerald-600 text-white border-emerald-600"
            : isDark
            ? "bg-dark-surface text-slate-400 border-dark-border hover:border-slate-500"
            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
        }`}
      >
        {cat}
      </button>
    ))}
  </nav>
);

const EmptyState = ({ icon: Icon, message, isDark }) => (
  <div className="h-full flex flex-col items-center justify-center opacity-60">
    <Icon size={32} className={isDark ? "text-slate-600" : "text-slate-400"} />
    <p className={`mt-2 text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}>
      {message}
    </p>
  </div>
);

const InventoryItem = ({ item, quantity, onAdd, isDark }) => {
  const itemImage = getItemImage(item);
  const isInCart = quantity > 0;

  return (
    <button
      onClick={() => onAdd(item)}
      className={`
        relative flex flex-row md:flex-col items-start md:items-stretch text-left 
        p-3 md:p-0 gap-3 md:gap-0
        rounded-xl border transition-all active:scale-[0.98] overflow-hidden group
        ${
          isInCart
            ? "border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-50/10"
            : isDark
            ? "bg-dark-surface border-dark-border hover:border-emerald-500/30"
            : "bg-white border-slate-200 hover:border-emerald-500/50"
        }
      `}
      aria-label={`Add ${item.name} to cart. Price: ${formatCurrency(item.price)}${
        isInCart ? `. Currently ${quantity} in cart` : ""
      }`}
    >
      {/* Image Section */}
      <div
        className={`
          relative shrink-0 
          w-24 h-24 md:w-full md:aspect-[4/3] md:h-auto
          rounded-xl md:rounded-none md:rounded-t-xl overflow-hidden
          ${isDark ? "bg-slate-800" : "bg-slate-100"}
        `}
      >
        {itemImage ? (
          <img
            src={itemImage}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}

        {/* Fallback Icon */}
        <div
          className={`w-full h-full flex-col items-center justify-center ${
            isDark ? "text-slate-600" : "text-slate-300"
          } ${itemImage ? "hidden" : "flex"}`}
        >
          <ShoppingBag size={24} className="mb-1 opacity-50" />
          <span className="text-[9px] font-bold uppercase opacity-50">No Img</span>
        </div>

        {/* Desktop Add Overlay */}
        <div className="hidden md:flex absolute bottom-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg">
          <Plus size={14} strokeWidth={3} />
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 h-full justify-between md:p-4 min-w-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                isDark ? "border-emerald-500/50" : "border-emerald-600"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isDark ? "bg-emerald-500" : "bg-emerald-600"
                }`}
              />
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide truncate max-w-[100px] ${
                isDark ? "text-emerald-400" : "text-emerald-700"
              }`}
            >
              {item.category || DEFAULT_CATEGORY}
            </span>
          </div>
          <h4
            className={`font-bold text-sm leading-tight line-clamp-2 ${
              isDark ? "text-slate-100" : "text-slate-800"
            }`}
          >
            {item.name}
          </h4>
        </div>

        <div className="flex justify-between items-end mt-2">
          <span className={`text-sm font-black ${isDark ? "text-white" : "text-slate-900"}`}>
            {formatCurrency(item.price)}
          </span>
          {isInCart && (
            <div className="flex items-center gap-1 bg-emerald-500 text-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">
              {quantity}x
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

const MobileCartFloatingBar = ({ totalItems, cartTotal, onOpen, isDark }) => (
  <div
    className={`md:hidden fixed bottom-4 left-4 right-4 p-3 rounded-2xl shadow-xl z-40 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform ${
      isDark ? "bg-emerald-600" : "bg-slate-900"
    }`}
    onClick={onOpen}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && onOpen()}
    aria-label={`View cart with ${totalItems} items totaling ${formatCurrency(cartTotal)}`}
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold">
        {totalItems}
      </div>
      <div className="text-white">
        <p className="text-[10px] font-bold uppercase opacity-80">Total Bill</p>
        <p className="text-lg font-black">{formatCurrency(cartTotal)}</p>
      </div>
    </div>
    <div className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
      View <ChevronDown size={14} className="rotate-180" />
    </div>
  </div>
);

const QuickAddForm = ({ onAdd, isDark }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    onAdd(name.trim(), price);
    setName("");
    setPrice("");
  };

  return (
    <div
      className={`p-4 border-b ${
        isDark ? "bg-dark-surface border-dark-border" : "bg-slate-50 border-slate-100"
      }`}
    >
      <h3
        className={`text-[10px] font-bold uppercase mb-2 flex items-center gap-1 ${
          isDark ? "text-slate-400" : "text-slate-500"
        }`}
      >
        <Zap size={10} className="text-amber-500" /> Quick Add
      </h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${
            isDark ? "bg-dark-card border-dark-border text-white" : "bg-white border-slate-200"
          }`}
          placeholder="Item Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Item name"
        />
        <div className="relative w-20">
          <span
            className={`absolute left-2 top-1/2 -translate-y-1/2 text-xs ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            ₹
          </span>
          <input
            className={`w-full pl-5 pr-2 py-2 rounded-lg border text-sm outline-none font-bold focus:ring-2 focus:ring-emerald-500 ${
              isDark ? "bg-dark-card border-dark-border text-white" : "bg-white border-slate-200"
            }`}
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-label="Item price"
          />
        </div>
        <button
          type="submit"
          className="bg-slate-800 text-white w-10 rounded-lg flex items-center justify-center hover:bg-slate-900 transition-colors disabled:opacity-50"
          disabled={!name.trim() || !price}
          aria-label="Add item"
        >
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
};

const CartItem = ({ item, onUpdateQuantity, onRemove, isDark }) => {
  const itemTotal = item.price * item.quantity;

  return (
    <div
      className={`p-3 rounded-xl border flex flex-col gap-2 ${
        item.isManual
          ? isDark
            ? "border-amber-500/20 bg-amber-900/10"
            : "border-amber-200 bg-amber-50"
          : isDark
          ? "border-dark-border bg-dark-surface"
          : "border-slate-100 bg-white shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className={`font-bold text-sm ${isDark ? "text-slate-100" : "text-slate-800"}`}>
            {item.name}
          </div>
          {item.isManual && (
            <span className="text-[9px] uppercase font-bold text-amber-500">Manual</span>
          )}
        </div>
        <div className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
          {formatCurrency(itemTotal)}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          {formatCurrency(item.price)}/unit
        </div>
        <div
          className={`flex items-center h-8 rounded-lg border ${
            isDark ? "bg-black/20 border-white/10" : "bg-slate-50 border-slate-200"
          }`}
        >
          <button
            onClick={() =>
              item.quantity === 1 ? onRemove(item.id) : onUpdateQuantity(item.id, -1)
            }
            className={`w-8 h-full flex items-center justify-center rounded-l-lg hover:bg-red-500 hover:text-white transition-colors ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
            aria-label={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
          >
            {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
          </button>
          <span
            className={`w-8 text-center text-xs font-bold ${
              isDark ? "text-white" : "text-slate-800"
            }`}
            aria-label={`Quantity: ${item.quantity}`}
          >
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, 1)}
            className="w-8 h-full flex items-center justify-center rounded-r-lg hover:bg-emerald-500 hover:text-white text-emerald-500 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const CartSummary = ({
  cartTotal,
  discount,
  onDiscountChange,
  finalTotal,
  isDisabled,
  isProcessing,
  onGenerateQR,
  isDark,
}) => (
  <div
    className={`p-4 border-t space-y-4 ${
      isDark ? "border-dark-border bg-dark-surface" : "border-slate-100 bg-slate-50"
    }`}
  >
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className={isDark ? "text-slate-400" : "text-slate-500"}>Subtotal</span>
        <span className={isDark ? "text-slate-200" : "text-slate-800"}>
          {formatCurrency(cartTotal)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className={isDark ? "text-slate-400" : "text-slate-500"}>Discount</span>
        <div className="flex items-center gap-1">
          <span className="text-red-500 font-bold">- ₹</span>
          <input
            type="number"
            min="0"
            max={cartTotal}
            value={discount || ""}
            onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className={`w-16 py-1 px-2 rounded-md text-right font-bold outline-none border focus:ring-2 focus:ring-emerald-500 ${
              isDark
                ? "bg-dark-card border-dark-border text-red-400"
                : "bg-white border-slate-200 text-red-600"
            }`}
            aria-label="Discount amount"
          />
        </div>
      </div>
      <div
        className={`flex justify-between items-end pt-3 border-t border-dashed ${
          isDark ? "border-gray-700" : "border-gray-300"
        }`}
      >
        <span className="font-bold">Total Payable</span>
        <span className="text-2xl font-black text-emerald-500">
          {formatCurrency(finalTotal)}
        </span>
      </div>
    </div>

    <button
      onClick={onGenerateQR}
      disabled={isDisabled || isProcessing}
      className="w-full py-4 rounded-xl font-bold bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 active:scale-[0.98] transition-all"
      aria-label="Generate payment QR code"
    >
      {isProcessing ? (
        <Loader2 className="animate-spin" size={18} />
      ) : (
        <>
          <QrCode size={18} /> Generate Payment QR
        </>
      )}
    </button>
  </div>
);

const PaymentMethodIcon = ({ method }) => {
  switch (method) {
    case PAYMENT_METHODS.UPI:
      return <Smartphone size={24} />;
    case PAYMENT_METHODS.CASH:
      return <Banknote size={24} />;
    default:
      return <Clock size={24} />;
  }
};

const PaymentStatusIndicator = ({ method, customerName, isDark }) => {
  const getStyles = () => {
    switch (method) {
      case PAYMENT_METHODS.UPI:
        return {
          container: "bg-emerald-500/10 border-emerald-500/30",
          icon: "bg-emerald-500/20 text-emerald-500",
        };
      case PAYMENT_METHODS.CASH:
        return {
          container: "bg-blue-500/10 border-blue-500/30",
          icon: "bg-blue-500/20 text-blue-500",
        };
      default:
        return {
          container: "bg-amber-500/10 border-amber-500/30",
          icon: "bg-amber-500/20 text-amber-500",
        };
    }
  };

  const styles = getStyles();
  const isKhata = method === PAYMENT_METHODS.PENDING || method === PAYMENT_METHODS.KHATA;

  return (
    <div className={`mb-6 p-4 rounded-2xl border ${styles.container}`}>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className={`p-3 rounded-full ${styles.icon}`}>
          <PaymentMethodIcon method={method} />
        </div>
        <div>
          <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
            {isKhata ? "Khata Request" : `${method.toUpperCase()} Selected`}
          </h3>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {customerName ? (
              <span className="font-bold text-emerald-500">{customerName}</span>
            ) : (
              "Customer"
            )}{" "}
            is waiting for confirmation.
          </p>
        </div>
      </div>
    </div>
  );
};

const QrCodeDisplay = ({ qrUrl, countdown, isDark }) => (
  <div className="relative mb-6">
    <div
      className={`p-4 rounded-2xl border-2 mx-auto max-w-[280px] ${
        isDark ? "bg-black/30 border-emerald-500/30" : "bg-white border-emerald-100"
      }`}
    >
      {qrUrl ? (
        <img
          src={qrUrl}
          alt="Payment QR Code"
          className="w-full aspect-square rounded-xl object-contain mix-blend-multiply dark:mix-blend-normal"
        />
      ) : (
        <div className="w-full aspect-square flex items-center justify-center">
          <Loader2 className="animate-spin text-emerald-500" size={40} />
        </div>
      )}
    </div>
    <div
      className={`text-center mt-3 text-xs ${
        countdown < 60 ? "text-red-500 font-bold animate-pulse" : "text-gray-500"
      }`}
    >
      Expires in {formatTime(countdown)}
    </div>
  </div>
);

// ✅ CENTER ALIGNED MODAL COMPONENT
const PaymentQrModal = ({
  isOpen,
  posBill,
  qrUrl,
  countdown,
  customerPaymentMethod,
  customerInfo,
  isProcessing,
  onConfirm,
  onClose,
  onCopyLink,
  isDark,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div
        className={`relative rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 ${
          isDark ? "bg-[#1E1E1E] border border-gray-800" : "bg-white"
        }`}
      >
        {/* Close Button - Absolutely positioned to keep header text centered */}
        <button
          onClick={onClose}
          className={`absolute right-5 top-5 p-2 rounded-full transition-colors z-10 ${
            isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
          aria-label="Close payment modal"
        >
          <X size={20} />
        </button>

        {/* Header - Center Aligned */}
        <div className="px-6 pt-8 pb-2 text-center w-full">
          <h2
            id="payment-modal-title"
            className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Collect Payment
          </h2>
          <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Scan to pay {formatCurrency(posBill?.bill?.total || 0)}
          </p>
        </div>

        <div className="p-6 pt-4">
          {customerPaymentMethod ? (
            <PaymentStatusIndicator
              method={customerPaymentMethod}
              customerName={customerInfo.name}
              isDark={isDark}
            />
          ) : (
            <QrCodeDisplay qrUrl={qrUrl} countdown={countdown} isDark={isDark} />
          )}

          {/* Action Button */}
          <button
            onClick={onConfirm}
            disabled={!customerPaymentMethod || isProcessing}
            className={`w-full py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              customerPaymentMethod
                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/30"
                : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
            }`}
            aria-label={
              customerPaymentMethod ? "Confirm payment" : "Waiting for customer to select payment"
            }
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" size={18} />
            ) : customerPaymentMethod ? (
              <>
                <CheckCircle size={20} /> Confirm Payment
              </>
            ) : (
              "Waiting for customer selection..."
            )}
          </button>

          {/* Copy Link */}
          <div
            className={`mt-6 pt-4 border-t flex justify-center ${
              isDark ? "border-gray-800" : "border-gray-100"
            }`}
          >
            <button
              onClick={onCopyLink}
              className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                isDark
                  ? "text-gray-400 hover:text-white hover:bg-white/10"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <LinkIcon size={12} />
              Copy Payment Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MerchantBilling = ({ inventory = [], profile }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Custom hooks
  const {
    cart,
    discount,
    setDiscount,
    cartTotal,
    totalItems,
    finalTotal,
    addToCart,
    addManualItem,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredItems,
  } = useInventoryFilter(inventory);

  const handlePaymentSuccess = useCallback(() => {
    clearCart();
    setIsMobileCartOpen(false);
  }, [clearCart]);

  const {
    posBill,
    showPaymentQr,
    paymentQrUrl,
    expiryCountdown,
    customerPaymentMethod,
    customerInfo,
    isProcessing,
    handleGeneratePaymentQR,
    handleConfirmPayment,
    handleClosePaymentQr,
    copyPaymentLink,
  } = usePaymentFlow(cart, finalTotal, cartTotal, discount, profile, handlePaymentSuccess);

  // Navigation handler
  const handleBack = useCallback(() => {
    if (cart.length > 0) {
      if (window.confirm("Discard current bill?")) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  }, [cart.length, navigate]);

  // Get quantity in cart for an item
  const getCartQuantity = useCallback(
    (item) => {
      const itemId = getItemId(item);
      return cart.find((c) => c.id === itemId)?.quantity || 0;
    },
    [cart]
  );

  return (
    <div
      className={`flex flex-col h-full relative pt-14 animate-fade-in ${
        isDark ? "bg-dark-bg" : "bg-slate-50"
      }`}
    >
      {/* Mobile Top Bar */}
      <MobileTopBar onBack={handleBack} isDark={isDark} />

      <div className="flex-1 flex flex-col md:flex-row md:gap-6 overflow-hidden p-0 md:p-4">
        {/* Left Panel: Inventory */}
        <section
          className={`flex-1 md:rounded-2xl md:border flex flex-col overflow-hidden md:shadow-sm ${
            isDark ? "bg-dark-card md:border-dark-border" : "bg-white md:border-slate-200"
          }`}
          aria-label="Inventory"
        >
          {/* Search & Categories */}
          <div
            className={`p-3 border-b sticky top-0 z-20 backdrop-blur-md space-y-3 ${
              isDark ? "border-dark-border bg-dark-card/90" : "border-slate-100 bg-white/90"
            }`}
          >
            <SearchBar value={searchQuery} onChange={setSearchQuery} isDark={isDark} />
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              isDark={isDark}
            />
          </div>

          {/* Items Grid */}
          <div
            className={`flex-1 overflow-y-auto p-3 pb-32 md:pb-4 ${
              isDark ? "bg-dark-bg" : "bg-slate-50/50"
            }`}
          >
            {filteredItems.length === 0 ? (
              <EmptyState icon={Search} message="No items found" isDark={isDark} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredItems.map((item) => (
                  <InventoryItem
                    key={getItemId(item)}
                    item={item}
                    quantity={getCartQuantity(item)}
                    onAdd={addToCart}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Mobile Floating Cart Bar */}
        {!isMobileCartOpen && cart.length > 0 && (
          <MobileCartFloatingBar
            totalItems={totalItems}
            cartTotal={cartTotal}
            onOpen={() => setIsMobileCartOpen(true)}
            isDark={isDark}
          />
        )}

        {/* Right Panel: Cart */}
        <aside
          className={`fixed inset-0 z-50 flex flex-col transition-transform duration-300 md:static md:w-96 md:rounded-2xl md:border md:shadow-sm md:translate-y-0 ${
            isMobileCartOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"
          } ${
            isDark
              ? "bg-dark-card md:border-dark-border"
              : "bg-white md:border-slate-200"
          }`}
          aria-label="Shopping cart"
        >
          {/* Cart Header */}
          <div
            className={`p-4 border-b flex items-center justify-between ${
              isDark ? "border-dark-border" : "border-slate-100"
            }`}
          >
            <h2 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-800"}`}>
              Current Bill
            </h2>
            <button
              onClick={() => setIsMobileCartOpen(false)}
              className={`md:hidden p-2 rounded-full ${
                isDark ? "bg-dark-surface" : "bg-slate-100"
              }`}
              aria-label="Close cart"
            >
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Quick Add Form */}
          <QuickAddForm onAdd={addManualItem} isDark={isDark} />

          {/* Cart Items */}
          <div
            className={`flex-1 overflow-y-auto p-4 space-y-3 ${
              isDark ? "bg-dark-card" : "bg-white"
            }`}
          >
            {cart.length === 0 ? (
              <EmptyState icon={ShoppingCart} message="Cart is empty" isDark={isDark} />
            ) : (
              cart.map((item, idx) => (
                <CartItem
                  key={`${item.id}-${idx}`}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                  isDark={isDark}
                />
              ))
            )}
          </div>

          {/* Cart Summary & Actions */}
          <CartSummary
            cartTotal={cartTotal}
            discount={discount}
            onDiscountChange={setDiscount}
            finalTotal={finalTotal}
            isDisabled={cart.length === 0}
            isProcessing={isProcessing}
            onGenerateQR={handleGeneratePaymentQR}
            isDark={isDark}
          />
        </aside>
      </div>

      {/* Payment QR Modal */}
      <PaymentQrModal
        isOpen={showPaymentQr}
        posBill={posBill}
        qrUrl={paymentQrUrl}
        countdown={expiryCountdown}
        customerPaymentMethod={customerPaymentMethod}
        customerInfo={customerInfo}
        isProcessing={isProcessing}
        onConfirm={handleConfirmPayment}
        onClose={handleClosePaymentQr}
        onCopyLink={copyPaymentLink}
        isDark={isDark}
      />
    </div>
  );
};

export default MerchantBilling;