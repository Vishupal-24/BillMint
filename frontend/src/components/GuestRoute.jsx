import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * GuestRoute
 * Renders children only when the user is NOT authenticated.
 * If already authenticated, redirects to the appropriate dashboard.
 */
const GuestRoute = ({ children }) => {
  const location = useLocation();
  const { isLoading, isAuthenticated, role } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) return children;

  const target = role === "merchant" ? "/merchant/overview" : "/customer-dashboard";

  // If user came here due to a redirect, we still want to land on dashboard.
  // (Avoid redirecting back into login pages.)
  const from = location.state?.from?.pathname;
  const isLoginPage = typeof from === "string" && from.includes("login");

  return <Navigate to={isLoginPage ? target : target} replace />;
};

export default GuestRoute;
