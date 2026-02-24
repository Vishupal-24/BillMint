import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      const role = error.response?.data?.role || localStorage.getItem("role");
      const redirect = role === "merchant" ? "/merchant-login" : "/customer-login";
      if (typeof window !== "undefined") {
        window.location.replace(redirect);
      }
    }
    return Promise.reject(error);
  }
);

export const setSession = ({ token, role }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
};

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
};

export const signupCustomer = (payload) => api.post("/auth/signup/customer", payload);
export const signupMerchant = (payload) => api.post("/auth/signup/merchant", payload);
export const loginUser = (payload) => api.post("/auth/login", payload);
export const requestOtp = (payload) => api.post("/auth/otp/request", payload);
export const verifyOtpCode = (payload) => api.post("/auth/otp/verify", payload);
export const forgotPassword = (payload) => api.post("/auth/forgot-password", payload);
export const resetPassword = (payload) => api.post("/auth/reset-password", payload);

export const fetchCustomerReceipts = () => api.get("/receipts/customer");
export const fetchMerchantReceipts = () => api.get("/receipts/merchant");
export const fetchCustomerAnalytics = () => api.get("/analytics/customer");
export const fetchMerchantAnalytics = () => api.get("/analytics/merchant");

export default api;