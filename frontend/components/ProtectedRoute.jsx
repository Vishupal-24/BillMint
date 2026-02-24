import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token || (role && userRole !== role)) {
    return <Navigate to={userRole === "merchant" ? "/merchant-login" : "/customer-login"} replace />;
  }

  return children;
};

export default ProtectedRoute;
