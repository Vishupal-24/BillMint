import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "../components/common/Logo";
import useForceLightMode from "../hooks/useForceLightMode";

const SignupSuccess = () => {
  useForceLightMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  // Get user type and email from navigation state
  const userType = location.state?.userType || "customer";
  const email = location.state?.email || "";
  const name = location.state?.name || "there";

  const loginPath = userType === "merchant" ? "/merchant-login" : "/customer-login";
  const dashboardPath = userType === "merchant" ? "/merchant" : "/customer";

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigate(loginPath);
    }
  }, [countdown, navigate, loginPath]);

  const features = userType === "merchant" 
    ? [
        { icon: "📊", title: "Analytics Dashboard", desc: "Track your sales and customer insights" },
        { icon: "🧾", title: "Digital Receipts", desc: "Send eco-friendly receipts instantly" },
        { icon: "📱", title: "Mobile Friendly", desc: "Manage your business on the go" },
      ]
    : [
        { icon: "🌿", title: "Go Paperless", desc: "All your receipts in one place" },
        { icon: "📈", title: "Spending Insights", desc: "Track and analyze your expenses" },
        { icon: "🔔", title: "Smart Notifications", desc: "Never miss important updates" },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col">
      {/* Header */}
      <header className="p-4 sm:p-6">
        <Link to="/" className="inline-block">
          <Logo />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Success Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden"
          >
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 sm:px-10 sm:py-12 text-center">
              {/* Animated Checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-white rounded-full flex items-center justify-center mb-6 shadow-lg"
              >
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="w-10 h-10 sm:w-12 sm:h-12 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl sm:text-3xl font-bold text-white mb-2"
              >
                Welcome to Green Receipt! 🎉
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-green-100 text-base sm:text-lg"
              >
                Your {userType === "merchant" ? "business" : ""} account has been created successfully
              </motion.p>
            </div>

            {/* Content Body */}
            <div className="px-6 py-8 sm:px-10 sm:py-10">
              {/* Personalized Message */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center mb-8"
              >
                <p className="text-gray-600 text-base sm:text-lg">
                  Hey <span className="font-semibold text-gray-800">{name}</span>! 👋
                </p>
                {email && (
                  <p className="text-gray-500 text-sm mt-1">
                    We've set up your account with <span className="font-medium">{email}</span>
                  </p>
                )}
              </motion.div>

              {/* Features Preview */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-8"
              >
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">
                  What you can do with Green Receipt
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="bg-green-50 rounded-xl p-4 text-center hover:bg-green-100 transition-colors"
                    >
                      <span className="text-2xl mb-2 block">{feature.icon}</span>
                      <h4 className="font-semibold text-gray-800 text-sm mb-1">{feature.title}</h4>
                      <p className="text-gray-500 text-xs">{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="space-y-4"
              >
                {/* Primary Button */}
                <button
                  onClick={() => navigate(loginPath)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <span>Continue to Login</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>

                {/* Auto-redirect Notice */}
                <div className="text-center">
                  <p className="text-gray-400 text-sm">
                    Redirecting automatically in{" "}
                    <span className="font-semibold text-green-600">{countdown}</span> seconds
                  </p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                    <motion.div
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 10, ease: "linear" }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Divider */}
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-gray-400 text-sm">or</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Secondary Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/"
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-center"
                >
                  ← Back to Home
                </Link>
                <a
                  href="mailto:support@greenreceipt.com"
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-center"
                >
                  Need Help?
                </a>
              </div>
            </div>
          </motion.div>

          {/* Footer Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center text-gray-400 text-sm mt-6"
          >
            🌱 Thank you for choosing sustainability with Green Receipt
          </motion.p>
        </div>
      </main>
    </div>
  );
};

export default SignupSuccess;
