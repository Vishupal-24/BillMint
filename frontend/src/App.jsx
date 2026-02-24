import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import CustomerLogin from './pages/CustomerLogin';
import MerchantLogin from './pages/MerchantLogin';
import CustomerSignup from './pages/CustomerSignup';
import MerchantSignup from './pages/MerchantSignup';
import CustomerVerify from './pages/CustomerVerify';
import MerchantVerify from './pages/MerchantVerify';
import CustomerDashboard from './pages/CustomerDashboard';
import MerchantDashboard from './pages/MerchantDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. The Landing Page */}
        <Route path="/" element={<Home />} />

        {/* 2. Customer Routes */}
        <Route path="/customer-signup" element={<CustomerSignup />} />
        <Route path="/verify-customer" element={<CustomerVerify />} />
        <Route path="/customer-login" element={<CustomerLogin />} />

        
        <Route
          path="/customer-dashboard"
          element={
            <ProtectedRoute role="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* 3. Merchant Routes (Keep commented for now) */}
        <Route path="/merchant-signup" element={<MerchantSignup />} />
        <Route path="/verify-merchant" element={<MerchantVerify />} />
        <Route path="/merchant-login" element={<MerchantLogin />} />

        <Route
          path="/merchant-dashboard"
          element={
            <ProtectedRoute role="merchant">
              <MerchantDashboard />
            </ProtectedRoute>
          }
        />

        {/* 4. 404 Fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;