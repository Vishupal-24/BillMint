import React from "react";
import { useNavigate } from "react-router-dom";
import { Store, User, ArrowRight } from "lucide-react";
import useForceLightMode from "../../hooks/useForceLightMode";

const AuthSelection = () => {
  useForceLightMode();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome to <span className="text-emerald-600">Green</span>
          <span className="text-slate-900">Receipt</span>
        </h1>
        <p className="text-slate-500">Choose how you want to continue</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
        {/* MERCHANT CARD */}
        <div
          onClick={() => navigate("/merchant-login")}
          className="group relative bg-white p-8 rounded-2xl border-2 border-slate-100 hover:border-slate-800 cursor-pointer transition-all hover:shadow-xl flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Store className="w-10 h-10 text-slate-800" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            I own a Shop
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Create bills, manage sales, and track your business growth.
          </p>
          <span className="mt-auto flex items-center text-slate-900 font-bold group-hover:gap-2 transition-all">
            Merchant Login <ArrowRight className="w-4 h-4 ml-2" />
          </span>
        </div>

        {/* CUSTOMER CARD */}
        <div
          onClick={() => navigate("/customer-login")}
          className="group relative bg-white p-8 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 cursor-pointer transition-all hover:shadow-xl flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <User className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            I am a Customer
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            View your past receipts, track expenses, and manage budget.
          </p>
          <span className="mt-auto flex items-center text-emerald-600 font-bold group-hover:gap-2 transition-all">
            Customer Login <ArrowRight className="w-4 h-4 ml-2" />
          </span>
        </div>
      </div>

      <p className="mt-12 text-slate-400 text-sm">
        New here? Don't worry, we'll set you up after you log in.
      </p>
    </div>
  );
};

export default AuthSelection;
