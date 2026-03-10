import axios from "axios";

// ==========================================
// CONFIGURATION
// ==========================================
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Token storage keys (refresh token now stored in HTTP-only cookie, not localStorage)
const TOKEN_KEY = "accessToken";
const TOKEN_EXPIRY_KEY = "tokenExpiry";
const ROLE_KEY = "role";
const USER_KEY = "user";
const IS_PROFILE_COMPLETE_KEY = "isProfileComplete";

// Create axios instance with credentials for HTTP-only cookie support
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Required for HTTP-only cookies
});

// ==========================================
// TOKEN MANAGEMENT
// ==========================================

// Track if we're currently refreshing to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshSubscribers = [];

// Subscribe to token refresh
const subscribeToTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Notify all subscribers when token is refreshed
const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

// Notify all subscribers when refresh fails
const onRefreshFailed = (error) => {
  refreshSubscribers.forEach((callback) => callback(null, error));
  refreshSubscribers = [];
};

// Get stored access token
export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);

// Check if user has a session (refresh token is in HTTP-only cookie, so we check for role)
// The actual refresh token validation happens server-side
export const hasSession = () => {
  const role = localStorage.getItem(ROLE_KEY);
  return !!role;
};

// Legacy function for backward compatibility
export const isAuthenticated = () => hasSession();

// Check if access token is expired or about to expire (within 1 minute)
export const isTokenExpired = () => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return true;
  // Consider expired if within 60 seconds of expiry
  return Date.now() >= parseInt(expiry, 10) - 60000;
};

// Get stored user info
export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

// Set stored user info (for updating user data locally)
export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

// Get stored role
export const getStoredRole = () => localStorage.getItem(ROLE_KEY);

// ==========================================
// SESSION MANAGEMENT
// ==========================================

/**
 * Store session data after login/signup
 * Note: Refresh token is now stored in HTTP-only cookie by the server
 */
export const setSession = ({ accessToken, expiresIn, role, user, isProfileComplete }) => {
  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
  }
  if (expiresIn) {
    // Store expiry time as timestamp
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
  if (role) {
    localStorage.setItem(ROLE_KEY, role);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  if (isProfileComplete !== undefined) {
    localStorage.setItem(IS_PROFILE_COMPLETE_KEY, isProfileComplete.toString());
  }
};

/**
 * Update tokens after refresh
 * Note: Refresh token is managed via HTTP-only cookie by the server
 */
export const updateTokens = ({ accessToken, expiresIn }) => {
  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
  }
  if (expiresIn) {
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
};

/**
 * Clear all session data (logout)
 * Note: Server clears the HTTP-only refresh token cookie
 */
export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(IS_PROFILE_COMPLETE_KEY);
  // Also remove legacy refresh token if it exists (migration cleanup)
  localStorage.removeItem("refreshToken");
};

/**
 * Refresh the access token using HTTP-only cookie refresh token
 * The refresh token is sent automatically via cookies (withCredentials: true)
 */
export const refreshAccessToken = async () => {
  try {
    // Use a separate axios instance to avoid interceptors, but with credentials
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL || "http://localhost:5001/api"}/auth/refresh`,
      {}, // Empty body - refresh token is in HTTP-only cookie
      { 
        timeout: API_TIMEOUT,
        withCredentials: true, // Required for HTTP-only cookies
      }
    );

    const { accessToken, expiresIn } = response.data;
    
    updateTokens({ accessToken, expiresIn });
    
    return accessToken;
  } catch (error) {
    // IMPORTANT:
    // Do NOT blindly clear local session on any refresh error.
    // - Network/server errors should not log users out immediately.
    // - Only clear when the server definitively says the refresh token/session is invalid.
    const status = error.response?.status;
    const code = error.response?.data?.code;

    const isDefinitiveRefreshFailure =
      status === 401 &&
      [
        "NO_REFRESH_TOKEN",
        "REFRESH_TOKEN_EXPIRED",
        "INVALID_REFRESH_TOKEN",
        "SESSION_EXPIRED",
        "SESSION_INVALIDATED",
        "INVALID_SESSION",
        "ACCOUNT_NOT_FOUND",
      ].includes(code);

    if (isDefinitiveRefreshFailure) {
      clearSession();
    }

    throw error;
  }
};

// ==========================================
// AXIOS INTERCEPTORS
// ==========================================

// Helper to delay retry attempts
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Check if error is retryable
const isRetryable = (error) => {
  if (!error.response) return true; // Network error
  const status = error.response?.status;
  return status >= 500 && status < 600;
};

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    // Skip token refresh for auth endpoints
    const isAuthEndpoint = config.url?.includes("/auth/refresh") || 
                           config.url?.includes("/auth/login") ||
                           config.url?.includes("/auth/logout") ||
                           config.url?.includes("/auth/signup");
    
    if (!isAuthEndpoint) {
      let token = getAccessToken();
      
      // Check if token is expired and we have a session
      if (isTokenExpired() && hasSession()) {
        // If already refreshing, wait for it
        if (isRefreshing) {
          token = await new Promise((resolve, reject) => {
            subscribeToTokenRefresh((newToken, error) => {
              if (error) reject(error);
              else resolve(newToken);
            });
          });
        } else {
          // Start refreshing
          isRefreshing = true;
          try {
            token = await refreshAccessToken();
            onTokenRefreshed(token);
          } catch (error) {
            onRefreshFailed(error);
            throw error;
          } finally {
            isRefreshing = false;
          }
        }
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Track retry count
    config.__retryCount = config.__retryCount || 0;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error.response?.status;
    const errorCode = error.response?.data?.code;

    // Handle 401 errors
    if (status === 401) {
      const isAuthEndpoint = config.url?.includes("/auth/refresh") ||
                            config.url?.includes("/auth/login") ||
                            config.url?.includes("/auth/logout");

      const isTokenError =
        errorCode === "TOKEN_EXPIRED" ||
        errorCode === "TOKEN_MISSING" ||
        errorCode === "TOKEN_INVALID" ||
        !errorCode;

      // Attempt refresh once for token-related 401s (even if local storage is empty)
      if (!isAuthEndpoint && isTokenError && !config.__isRetry) {
        config.__isRetry = true;

        try {
          // If already refreshing, wait for it
          if (isRefreshing) {
            const newToken = await new Promise((resolve, reject) => {
              subscribeToTokenRefresh((token, err) => {
                if (err) reject(err);
                else resolve(token);
              });
            });
            config.headers.Authorization = `Bearer ${newToken}`;
            return api(config);
          }

          // Start refreshing
          isRefreshing = true;
          const newToken = await refreshAccessToken();
          onTokenRefreshed(newToken);
          isRefreshing = false;

          // Retry the original request with new token
          config.headers.Authorization = `Bearer ${newToken}`;
          return api(config);
        } catch (refreshError) {
          isRefreshing = false;
          onRefreshFailed(refreshError);

          const refreshStatus = refreshError.response?.status;
          const refreshCode = refreshError.response?.data?.code;
          const isDefinitiveRefreshFailure =
            refreshStatus === 401 &&
            [
              "NO_REFRESH_TOKEN",
              "REFRESH_TOKEN_EXPIRED",
              "INVALID_REFRESH_TOKEN",
              "SESSION_EXPIRED",
              "SESSION_INVALIDATED",
              "INVALID_SESSION",
              "ACCOUNT_NOT_FOUND",
            ].includes(refreshCode);

          if (isDefinitiveRefreshFailure) {
            const role = getStoredRole() || localStorage.getItem(ROLE_KEY);
            clearSession();
            const redirect = role === "merchant" ? "/merchant-login" : "/customer-login";
            if (typeof window !== "undefined") {
              window.location.replace(redirect);
            }
          }

          return Promise.reject(refreshError);
        }
      }

      // Other 401 errors (invalid token, etc.) - clear session and redirect
      if (errorCode !== "TOKEN_EXPIRED") {
        const role = error.response?.data?.role || getStoredRole() || localStorage.getItem(ROLE_KEY);
        clearSession();
        const redirect = role === "merchant" ? "/merchant-login" : "/customer-login";
        if (typeof window !== "undefined") {
          window.location.replace(redirect);
        }
      }

      return Promise.reject(error);
    }

    // Handle 403 errors
    if (status === 403) {
      // Forbidden - user doesn't have permission
      return Promise.reject(error);
    }

    // Retry logic for network/server errors
    if (isRetryable(error) && config && config.__retryCount < MAX_RETRIES) {
      config.__retryCount += 1;
      console.log(`Retrying request (${config.__retryCount}/${MAX_RETRIES}):`, config.url);
      await delay(RETRY_DELAY * config.__retryCount);
      return api(config);
    }

    // Enhanced error object
    const enhancedError = {
      ...error,
      isNetworkError: !error.response,
      isTimeout: error.code === 'ECONNABORTED',
      userMessage: getErrorMessage(error),
    };

    return Promise.reject(enhancedError);
  }
);

// Get user-friendly error message
const getErrorMessage = (error) => {
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }
  const status = error.response?.status;
  const serverMessage = error.response?.data?.message;
  
  if (serverMessage) return serverMessage;
  
  switch (status) {
    case 400: return 'Invalid request. Please check your input.';
    case 401: return 'Session expired. Please login again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'Resource not found.';
    case 429: return 'Too many requests. Please wait a moment.';
    case 500: return 'Server error. Please try again later.';
    default: return 'Something went wrong. Please try again.';
  }
};

// ==========================================
// AUTH APIs
// ==========================================
export const signupCustomer = (payload) => api.post("/auth/signup/customer", payload);
export const signupMerchant = (payload) => api.post("/auth/signup/merchant", payload);
export const loginUser = (payload) => api.post("/auth/login", payload);
export const requestOtp = (payload) => api.post("/auth/otp/request", payload);
export const verifyOtpCode = (payload) => api.post("/auth/otp/verify", payload);
export const forgotPassword = (payload) => api.post("/auth/forgot-password", payload);
export const resetPassword = (payload) => api.post("/auth/reset-password", payload);

// Google OAuth
export const googleAuth = (payload) => api.post("/auth/google", payload);
export const getGoogleAuthStatus = () => api.get("/auth/google/status");

// Session management APIs
export const refreshToken = () => api.post("/auth/refresh"); // Refresh token sent via cookie
export const logoutUser = () => api.post("/auth/logout"); // Server clears the cookie
export const logoutAllDevices = () => api.post("/auth/logout-all");
export const validateSession = () => api.get("/auth/session");

// ==========================================
// RECEIPT APIs
// ==========================================
export const fetchCustomerReceipts = (page = 1, limit = 50) => 
  api.get(`/receipts/customer?page=${page}&limit=${limit}`);
export const fetchMerchantReceipts = (page = 1, limit = 50) => 
  api.get(`/receipts/merchant?page=${page}&limit=${limit}`);
export const createReceipt = (payload) => api.post("/receipts", payload);
export const claimReceipt = (payload) => api.post("/receipts/claim", payload);
// Mark receipt as paid - MERCHANT ONLY (source of truth for payment)
// For "pending" method, extra customerInfo { customerName, customerPhone } can be passed
export const markReceiptPaid = (id, paymentMethod, customerInfo = {}) => 
  api.patch(`/receipts/${id}/mark-paid`, { paymentMethod, ...customerInfo });
export const updateReceipt = (id, payload) => api.patch(`/receipts/${id}`, payload);
export const deleteReceipt = (id) => api.delete(`/receipts/${id}`);
export const getReceiptById = (id) => api.get(`/receipts/${id}`);
export const fetchCustomerAnalytics = () => api.get("/analytics/customer");
export const fetchMerchantAnalytics = () => api.get("/analytics/merchant");
export const fetchProfile = () => api.get("/auth/me");
export const updateProfile = (payload) => api.patch("/auth/me", payload);
export const changePassword = (payload) => api.post("/auth/change-password", payload);
export const deleteAccount = () => api.delete("/auth/me");

// Update customer phone number (for Khata feature)
export const updateCustomerPhone = (phone) => api.patch("/auth/me", { phone });

// ==========================================
// RECEIPT ACKNOWLEDGMENT FLOW APIs
// (Clean receipt-only system - no payment processing)
// ==========================================
// Public receipt view (for QR scanning - no auth required)
export const getPublicReceipt = (id) => api.get(`/receipts/public/${id}`);

// Customer acknowledges receipt ("I received the bill")
export const acknowledgeReceipt = (receiptId) => 
  api.post("/receipts/acknowledge", { receiptId });

// Merchant verification APIs
export const fetchAwaitingVerification = (page = 1, limit = 50) => 
  api.get(`/receipts/merchant/awaiting-verification?page=${page}&limit=${limit}`);
export const fetchVerificationSummary = () => 
  api.get("/receipts/merchant/verification-summary");
export const verifyReceiptPayment = (receiptId, status, paymentMethod = null) => 
  api.post(`/receipts/${receiptId}/verify`, { status, paymentMethod });

// ==========================================
// KHATA (PENDING DUES) APIs
// ==========================================
// Merchant APIs
export const fetchMerchantPendingReceipts = (page = 1, limit = 50) => 
  api.get(`/receipts/merchant/pending?page=${page}&limit=${limit}`);
export const fetchMerchantPendingSummary = () => 
  api.get("/receipts/merchant/pending/summary");
export const sendPaymentReminder = (receiptId) => 
  api.post(`/receipts/${receiptId}/send-reminder`);
export const markPendingAsPaid = (receiptId, paymentMethod = "cash") => 
  api.post(`/receipts/${receiptId}/mark-paid-manual`, { paymentMethod });

// Customer APIs
export const fetchCustomerPendingReceipts = (page = 1, limit = 50) => 
  api.get(`/receipts/customer/pending?page=${page}&limit=${limit}`);
export const fetchCustomerPendingSummary = () => 
  api.get("/receipts/customer/pending/summary");
export const payPendingBill = (receiptId, paymentMethod = "upi") => 
  api.post(`/receipts/${receiptId}/pay-pending`, { paymentMethod });

// ==========================================
// MERCHANT ONBOARDING APIs
// ==========================================
export const getOnboardingStatus = () => api.get("/merchant/onboarding/status");
export const saveBusinessInfo = (payload) => api.post("/merchant/onboarding/business-info", payload);
export const saveOperatingHours = (payload) => api.post("/merchant/onboarding/operating-hours", payload);
export const saveOnboardingCategories = (payload) => api.post("/merchant/onboarding/categories", payload);
export const saveOnboardingItems = (payload) => api.post("/merchant/onboarding/items", payload);
export const completeOnboarding = () => api.post("/merchant/onboarding/complete");
export const skipOnboarding = () => api.post("/merchant/onboarding/skip");
export const getMerchantFullProfile = () => api.get("/merchant/profile/full");

// ==========================================
// CATEGORY APIs
// ==========================================
export const fetchCategories = () => api.get("/merchant/categories");
export const createCategory = (payload) => api.post("/merchant/categories", payload);
export const updateCategory = (id, payload) => api.patch(`/merchant/categories/${id}`, payload);
export const deleteCategory = (id, reassignTo = null) => 
  api.delete(`/merchant/categories/${id}${reassignTo ? `?reassignTo=${reassignTo}` : ''}`);
export const reorderCategories = (categoryIds) => api.patch("/merchant/categories/reorder", { categoryIds });

//Items API 
export const fetchItems = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params.isAvailable !== undefined) queryParams.append('isAvailable', params.isAvailable);
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  const queryString = queryParams.toString();
  return api.get(`/merchant/items${queryString ? `?${queryString}` : ''}`);
};
export const fetchItemById = (id) => api.get(`/merchant/items/${id}`);
export const createItem = (payload) => api.post("/merchant/items", payload);
export const createItemsBulk = (items) => api.post("/merchant/items/bulk", { items });
export const updateItem = (id, payload) => api.patch(`/merchant/items/${id}`, payload);
export const deleteItem = (id, permanent = false) => 
  api.delete(`/merchant/items/${id}${permanent ? '?permanent=true' : ''}`);
export const toggleItemAvailability = (id, isAvailable) => 
  api.patch(`/merchant/items/${id}/availability`, { isAvailable });
export const reorderItems = (itemIds) => api.patch("/merchant/items/reorder", { itemIds });

// ==========================================
// RECURRING BILL APIs
// ==========================================

/**
 * Create a new recurring bill
 * @param {Object} payload - Bill data (name, amount, billCycle, dueDay, reminderOffsets, etc.)
 */
export const createBill = (payload) => api.post("/bills", payload);

/**
 * Get all recurring bills for the user
 * @param {Object} params - Query params (status, category, page, limit)
 */
export const fetchBills = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.category) queryParams.append('category', params.category);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  const queryString = queryParams.toString();
  return api.get(`/bills${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get a single bill by ID
 * @param {string} id - Bill ID
 */
export const fetchBillById = (id) => api.get(`/bills/${id}`);

/**
 * Update a recurring bill
 * @param {string} id - Bill ID
 * @param {Object} payload - Fields to update
 */
export const updateBill = (id, payload) => api.patch(`/bills/${id}`, payload);

/**
 * Delete a recurring bill
 * @param {string} id - Bill ID
 * @param {boolean} permanent - If true, permanently delete
 */
export const deleteBill = (id, permanent = false) => 
  api.delete(`/bills/${id}${permanent ? '?permanent=true' : ''}`);

/**
 * Toggle bill status (pause/resume)
 * @param {string} id - Bill ID
 * @param {string} status - 'active' or 'paused'
 */
export const toggleBillStatus = (id, status) => 
  api.patch(`/bills/${id}/status`, { status });

/**
 * Mark a bill as paid for the current cycle
 * @param {string} id - Bill ID
 */
export const markBillPaid = (id) => api.post(`/bills/${id}/mark-paid`);

/**
 * Get upcoming bills summary (for dashboard widget)
 * @param {number} days - Number of days to look ahead (default: 7)
 */
export const fetchUpcomingBills = (days = 7) => 
  api.get(`/bills/upcoming?days=${days}`);

/**
 * Get bill categories with counts
 */
export const fetchBillCategories = () => api.get("/bills/categories");

// ==========================================
// NOTIFICATION APIs
// ==========================================

/**
 * Get notifications for the user
 * @param {Object} params - Query params (page, limit, type, unreadOnly)
 */
export const fetchNotifications = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.type) queryParams.append('type', params.type);
  if (params.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly);
  const queryString = queryParams.toString();
  return api.get(`/notifications${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get unread notification count
 */
export const fetchNotificationCount = () => api.get("/notifications/count");

/**
 * Mark a single notification as read
 * @param {string} id - Notification ID
 */
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);

/**
 * Mark all notifications as read
 * @param {string} type - Optional: only mark specific type as read
 */
export const markAllNotificationsRead = (type = null) => 
  api.post("/notifications/mark-all-read", type ? { type } : {});

/**
 * Dismiss a notification
 * @param {string} id - Notification ID
 */
export const dismissNotification = (id) => api.delete(`/notifications/${id}`);

/**
 * Dismiss all notifications
 * @param {string} type - Optional: only dismiss specific type
 */
export const dismissAllNotifications = (type = null) => 
  api.post("/notifications/dismiss-all", type ? { type } : {});

/**
 * Get notification preferences
 */
export const fetchNotificationPreferences = () => api.get("/notifications/preferences");

// ==========================================
// POS (Point of Sale) APIs - Merchant UPI Payment System
// ==========================================

/**
 * Create a new POS bill and get UPI QR data
 * @param {Object} payload - { items: [{ name, price, quantity }], customerPhone?, customerName?, expiryMinutes? }
 */
export const createPOSBill = (payload) => api.post("/pos/bills", payload);

/**
 * Get all POS bills with filtering
 * @param {Object} params - { status?, page?, limit? }
 */
export const fetchPOSBills = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  const queryString = queryParams.toString();
  return api.get(`/pos/bills${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get a single POS bill by ID
 * @param {string} billId - Bill ID
 */
export const fetchPOSBillById = (billId) => api.get(`/pos/bills/${billId}`);

/**
 * Get active (awaiting payment) bills
 */
export const fetchActivePOSBills = () => api.get("/pos/bills/active");

/**
 * Confirm payment received for a bill - MERCHANT CONFIRMS
 * This is the ONLY way to mark a bill as PAID.
 * @param {string} billId - Bill ID
 * @param {Object} payload - { customerPhone?, customerName? }
 */
export const confirmPOSPayment = (billId, payload = {}) => 
  api.post(`/pos/bills/${billId}/confirm`, payload);

/**
 * Cancel a pending bill
 * @param {string} billId - Bill ID
 */
export const cancelPOSBill = (billId) => api.post(`/pos/bills/${billId}/cancel`);

/**
 * Get POS statistics
 * @param {string} period - 'today' | 'week' | 'month'
 */
export const fetchPOSStats = (period = 'today') => 
  api.get(`/pos/stats?period=${period}`);

// ==========================================
// PUBLIC POS APIs (No Auth Required)
// For customer payment page
// ==========================================

/**
 * Get bill details for customer payment page (PUBLIC - No auth)
 * @param {string} billId - Bill ID
 */
export const fetchPublicBill = (billId) => api.get(`/pos/public/bills/${billId}`);

/**
 * Customer selects payment method (PUBLIC - No auth)
 * @param {string} billId - Bill ID
 * @param {string} method - 'cash' | 'upi'
 * @param {Object} customerInfo - { customerName?, customerPhone? }
 */
export const selectPaymentMethod = (billId, method, customerInfo = {}) => 
  api.post(`/pos/public/bills/${billId}/select-payment`, { method, ...customerInfo });

/**
 * Claim a POS receipt and link it to customer's account (AUTH REQUIRED)
 * @param {string} billId - The POS Bill ID to claim
 */
export const claimPOSReceipt = (billId) => 
  api.post(`/pos/bills/${billId}/claim`);

// ==========================================
// RAZORPAY PAYMENT GATEWAY APIs
// Used for Zomato-style payment flow (Razorpay Checkout)
// ==========================================

/**
 * Create a Razorpay order for a bill (PUBLIC - No auth)
 * This initiates the Razorpay payment flow
 * 
 * @param {string} billId - Bill ID to create order for
 * @param {Object} customerInfo - Optional customer details
 * @param {string} customerInfo.customerPhone - Customer phone (optional)
 * @param {string} customerInfo.customerEmail - Customer email (optional)
 * @param {string} customerInfo.customerName - Customer name (optional)
 * @returns {Promise<{orderId, keyId, amount, currency, billId, merchantName}>}
 */
export const createRazorpayOrder = (billId, customerInfo = {}) =>
  api.post(`/payments/create-order/${billId}`, customerInfo);

/**
 * Verify Razorpay payment signature (PUBLIC - No auth)
 * Called after Razorpay Checkout returns success
 * 
 * @param {Object} paymentDetails - Razorpay payment details
 * @param {string} paymentDetails.razorpay_order_id - Razorpay order ID
 * @param {string} paymentDetails.razorpay_payment_id - Razorpay payment ID
 * @param {string} paymentDetails.razorpay_signature - Razorpay signature
 * @param {string} paymentDetails.billId - Our bill ID
 * @returns {Promise<{success, billId, receiptId}>}
 */
export const verifyRazorpayPayment = (paymentDetails) =>
  api.post('/payments/verify', paymentDetails);

/**
 * Get payment status for a bill (PUBLIC - No auth)
 * Used for polling payment completion after Razorpay checkout
 * 
 * @param {string} billId - Bill ID to check status for
 * @param {boolean} verify - If true, verifies status with Razorpay API
 * @returns {Promise<{billId, status, paymentMethod, amount, paidAt, razorpayOrderId}>}
 */
export const getPaymentStatus = (billId, verify = false) =>
  api.get(`/payments/status/${billId}${verify ? '?verify=true' : ''}`);

// ==========================================
// UPI Settings APIs
// ==========================================

/**
 * Get merchant's UPI settings
 */
export const fetchUPISettings = () => api.get("/merchant/upi-settings");

/**
 * Update merchant's UPI settings
 * @param {Object} payload - { upiId: string, upiName?: string }
 */
export const updateUPISettings = (payload) => api.post("/merchant/upi-settings", payload);

/**
 * Verify UPI ID (marks as verified)
 */
export const verifyUPISettings = () => api.post("/merchant/upi-settings/verify");

export default api;
