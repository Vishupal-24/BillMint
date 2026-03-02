// import React from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// import Home from "./pages/Home";
// import CustomerLogin from "./pages/CustomerLogin";
// import MerchantLogin from "./pages/MerchantLogin";
// import CustomerSignup from "./pages/CustomerSignup";
// import MerchantSignup from "./pages/MerchantSignup";
// import CustomerVerify from "./pages/CustomerVerify";
// import MerchantVerify from "./pages/MerchantVerify";
// import CustomerDashboard from "./pages/CustomerDashboard";
// import MerchantDashboard from "./pages/MerchantDashboard";
// import ProtectedRoute from "./components/ProtectedRoute";
// import ForgotPassword from "./pages/ForgotPassword";
// import ResetPassword from "./pages/ResetPassword";
// import OnboardingWizard from "./components/onboarding/OnboardingWizard";
// import AuthSelection from './components/auth/AuthSelection';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         {/* 1. The Landing Page */}
//         <Route path="/" element={<Home />} />
//         {/* 2. Customer Routes*/}
//         <Route path="/customer-signup" element={<CustomerSignup />} />
//         <Route path="/verify-customer" element={<CustomerVerify />} />
//         <Route path="/customer-login" element={<CustomerLogin />} />
//         import AuthSelection from './components/auth/AuthSelection';
//         {/* // Inside your <Routes> */}
//         <Route path="/login" element={<AuthSelection />} />
//         <Route
//           path="/customer-dashboard"
//           element={
//             <ProtectedRoute role="customer">
//               <CustomerDashboard />
//             </ProtectedRoute>
//           }
//         />
//         <Route path="/forgot-password" element={<ForgotPassword />} />
//         <Route path="/reset-password" element={<ResetPassword />} />
//         {/* 3. Merchant Routes (Keep commented for now) */}
//         <Route path="/merchant-signup" element={<MerchantSignup />} />
//         <Route path="/verify-merchant" element={<MerchantVerify />} />
//         <Route path="/merchant/*" element={<MerchantDashboard />} />
//         <Route path="/merchant-login" element={<MerchantLogin />} />
//         <Route
//           path="/merchant-dashboard"
//           element={
//             <ProtectedRoute role="merchant">
//               <MerchantDashboard />
//             </ProtectedRoute>
//           }
//         />
//         {/* <Route
//           path="/test-onboarding"
//           element={
//             <OnboardingWizard
//               onComplete={(data) => console.log("Onboarding Data:", data)}
//             />
//           }
//         /> */}
//         {/* 4. 404 Fallback */}
//         <Route path="*" element={<Home />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

// import React from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// // Pages & Components
// import Home from "./pages/Home";
// import AuthSelection from './components/auth/AuthSelection';

// // Customer Pages
// import CustomerLogin from "./pages/CustomerLogin";
// import CustomerSignup from "./pages/CustomerSignup";
// import CustomerVerify from "./pages/CustomerVerify";
// import CustomerDashboard from "./pages/CustomerDashboard";

// // Merchant Pages
// import MerchantLogin from "./pages/MerchantLogin";
// import MerchantSignup from "./pages/MerchantSignup";
// import MerchantVerify from "./pages/MerchantVerify";
// import MerchantDashboard from "./pages/MerchantDashboard"; // This now handles sub-routes

// // Utils
// import ProtectedRoute from "./components/ProtectedRoute";
// import ForgotPassword from "./pages/ForgotPassword";
// import ResetPassword from "./pages/ResetPassword";

// function App() {
//   return (
//     <Router>
//       <Routes>
//         {/* 1. Public Routes */}
//         <Route path="/" element={<Home />} />
//         <Route path="/login" element={<AuthSelection />} />
//         <Route path="/forgot-password" element={<ForgotPassword />} />
//         <Route path="/reset-password" element={<ResetPassword />} />

//         {/* 2. Customer Routes */}
//         <Route path="/customer-login" element={<CustomerLogin />} />
//         <Route path="/customer-signup" element={<CustomerSignup />} />
//         <Route path="/verify-customer" element={<CustomerVerify />} />

//         <Route
//           path="/customer-dashboard"
//           element={
//             <ProtectedRoute role="customer">
//               <CustomerDashboard />
//             </ProtectedRoute>
//           }
//         />

//         {/* 3. Merchant Routes */}
//         <Route path="/merchant-login" element={<MerchantLogin />} />
//         <Route path="/merchant-signup" element={<MerchantSignup />} />
//         <Route path="/verify-merchant" element={<MerchantVerify />} />

//         {/* 👇 CRITICAL CHANGE:
//             We use "/merchant/*" so it captures all sub-pages (e.g., /merchant/billing).
//             We wrap the WHOLE thing in ProtectedRoute so the dashboard checks login.
//         */}
//         <Route
//           path="/merchant/*"
//           element={
//             <ProtectedRoute role="merchant">
//               <MerchantDashboard />
//             </ProtectedRoute>
//           }
//         />

//         {/* 4. 404 Fallback */}
//         <Route path="*" element={<Home />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import AppWalkthrough from "./components/onboarding/AppWalkthrough";

// 1. 👇 Import Splash Screen only
import ServerAwake from "./components/common/ServerAwake";

// Auth Provider
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Pages & Components
import Home from "./pages/Home";
import AuthSelection from "./components/auth/AuthSelection";

// Customer Pages
import CustomerLogin from "./pages/CustomerLogin";
import CustomerSignup from "./pages/CustomerSignup";
import CustomerVerify from "./pages/CustomerVerify";
import CustomerDashboard from "./pages/CustomerDashboard";

// Merchant Pages
import MerchantLogin from "./pages/MerchantLogin";
import MerchantSignup from "./pages/MerchantSignup";
import MerchantVerify from "./pages/MerchantVerify";
import MerchantDashboard from "./pages/MerchantDashboard";

// Customer Payment Page (Public - for QR scan)
import CustomerPayment from "./pages/CustomerPayment";

// Payment Result Page (Public - for Cashfree redirect)
import PaymentResult from "./pages/PaymentResult";

// Receipt View Page (Public - for clean receipt QR scan)
import ReceiptView from "./pages/ReceiptView";

// Success Page
import SignupSuccess from "./pages/SignupSuccess";

// Utils
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const RootRoute = () => {
  const { isLoading, isAuthenticated, role } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Home />;
  return <Navigate to={role === 'merchant' ? '/merchant/overview' : '/customer-dashboard'} replace />;
};

function App() {
  // 2. 👇 State: Track if the backend is awake
  const [isServerReady, setIsServerReady] = useState(false);

  // 3. 👇 If server is NOT ready, show the Splash Screen
  if (!isServerReady) {
    return <ServerAwake onReady={() => setIsServerReady(true)} />;
  }

  // 4. 👇 Once ready, render the Router with AuthProvider
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 1. Public Routes */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<GuestRoute><AuthSelection /></GuestRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Customer Payment Page (Public - QR scan destination) */}
          <Route path="/pay/:billId" element={<CustomerPayment />} />
          
          {/* Payment Result Page (Public - Cashfree redirect destination) */}
          <Route path="/pay/result" element={<PaymentResult />} />
          
          {/* Receipt View Page (Public - Clean receipt QR scan) */}
          <Route path="/r/:receiptId" element={<ReceiptView />} />

          {/* 2. Customer Routes */}
          <Route path="/customer-login" element={<GuestRoute><CustomerLogin /></GuestRoute>} />
          <Route path="/customer-signup" element={<GuestRoute><CustomerSignup /></GuestRoute>} />
          <Route path="/verify-customer" element={<GuestRoute><CustomerVerify /></GuestRoute>} />
          
          {/* Signup Success Page */}
          <Route path="/signup-success" element={<GuestRoute><SignupSuccess /></GuestRoute>} />

          {/* TEMP: Preview Route (Delete this later) */}
          {/* <Route path="/test-tour" element={<AppWalkthrough />} /> */}

          <Route
            path="/customer-dashboard"
            element={
              <ProtectedRoute role="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* 3. Merchant Routes */}
          <Route path="/merchant-login" element={<GuestRoute><MerchantLogin /></GuestRoute>} />
          <Route path="/merchant-signup" element={<GuestRoute><MerchantSignup /></GuestRoute>} />
          <Route path="/verify-merchant" element={<GuestRoute><MerchantVerify /></GuestRoute>} />

          {/* Merchant Dashboard (Wildcard handles sub-routes) */}
          <Route
            path="/merchant/*"
            element={
              <ProtectedRoute role="merchant">
                <MerchantDashboard />
              </ProtectedRoute>
            }
          />

          {/* 4. 404 Fallback */}
          <Route path="*" element={<RootRoute />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
