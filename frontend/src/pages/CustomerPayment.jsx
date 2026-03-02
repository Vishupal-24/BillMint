import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Banknote, 
  Smartphone, 
  Store, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  ShoppingBag,
  ArrowRight,
  Leaf,
  LogIn,
  UserPlus,
  Receipt,
  CreditCard,
  Wallet,
  User,
  Phone,
  X,
  ShieldCheck
} from 'lucide-react';
import { 
  fetchPublicBill, 
  selectPaymentMethod, 
  claimPOSReceipt, 
  getStoredRole, 
  hasSession,
  getStoredUser,
  setStoredUser,
  createRazorpayOrder,
  verifyRazorpayPayment,
  updateCustomerPhone,
  fetchProfile
} from '../services/api';
import toast from 'react-hot-toast';

const CustomerPayment = () => {
  const { billId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [expiryCountdown, setExpiryCountdown] = useState(0);
  
  // Payment completion states
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [claimingReceipt, setClaimingReceipt] = useState(false);
  const [receiptClaimed, setReceiptClaimed] = useState(false);
  
  // UPI states - for showing UPI ID to copy
  const [showUPIDetails, setShowUPIDetails] = useState(false);
  
  // Razorpay state for "Other" payment option
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  
  // Khata flow states
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showKhataApproval, setShowKhataApproval] = useState(false);
  const [khataProcessing, setKhataProcessing] = useState(false);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneUpdating, setPhoneUpdating] = useState(false);
  
  // Check if customer is logged in
  const isLoggedIn = hasSession() && getStoredRole() === 'customer';

  const isKhataIntent = selectedMethod === 'khata' || bill?.paymentMethod === 'pending' || bill?.paymentMethod === 'khata';
  // Check if Khata is fully confirmed (PAID or PENDING_KHATA) or if legacy logic applies
  const isKhataConfirmed = (bill?.status === 'PAID' || bill?.status === 'PENDING_KHATA' || paymentComplete) && 
                           (bill?.paymentMethod === 'khata' || bill?.paymentMethod === 'pending');
  
  // Only show "Added to Khata" screen if confirmed by merchant
  const shouldShowKhataConfirmation = isKhataConfirmed;
  
  // Show "Waiting for Merchant" if user selected Khata but merchant hasn't confirmed yet
  const shouldShowKhataWaiting = isKhataIntent && !isKhataConfirmed && !showKhataApproval && !showLoginPrompt && !showPhonePrompt;
  
  // Check for khata redirect from login
  useEffect(() => {
    if (searchParams.get('showKhataApproval') === 'true' && isLoggedIn) {
      setShowKhataApproval(true);
      // Clear the query param
      searchParams.delete('showKhataApproval');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, isLoggedIn, setSearchParams]);

  // Load Razorpay SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Fetch bill data
  const loadBill = useCallback(async () => {
    try {
      console.log('[CustomerPayment] Loading bill:', billId);
      console.log('[CustomerPayment] API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:5001/api');
      
      const { data } = await fetchPublicBill(billId);
      console.log('[CustomerPayment] Bill loaded successfully:', data);
      setBill(data);

      // If customer already chose Khata, show Khata confirmation view
      if (data.paymentMethod === 'pending' && data.customerSelected) {
        setSelectedMethod('khata');
      }
      
      // Check if payment is complete
      if (data.status === 'PAID') {
        setPaymentComplete(true);
      }
      
      // Calculate initial countdown
      if (data.expiresAt) {
        const remaining = Math.max(0, Math.floor((new Date(data.expiresAt) - Date.now()) / 1000));
        setExpiryCountdown(remaining);
      }
      
      return data;
    } catch (err) {
      console.error('[CustomerPayment] Failed to load bill:', err);
      console.error('[CustomerPayment] Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      
      // More descriptive error messages
      let message = 'Bill not found or expired';
      if (err.code === 'ERR_NETWORK') {
        message = 'Cannot connect to server. Please check your internet connection.';
      } else if (err.response?.status === 404) {
        message = 'Bill not found. It may have expired or been cancelled.';
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      }
      
      setError(message);
      return null;
    }
  }, [billId]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadBill();
      setLoading(false);
    };
    
    if (billId) {
      init();
    }
  }, [billId, loadBill]);

  // Poll for payment status updates (when waiting for merchant confirmation)
  useEffect(() => {
    if (!bill || paymentComplete) return;
    // Continue polling if AWAITING_PAYMENT or PENDING (legacy)
    const isWaiting = bill.status === 'AWAITING_PAYMENT' || bill.status === 'PENDING';
    if (!isWaiting) return;
    
    if (!selectedMethod && !bill.customerSelected) return;
    
    // Poll every 2 seconds
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await fetchPublicBill(billId);
        
        // Payment was confirmed by merchant (PAID or PENDING_KHATA)
        if (data.status === 'PAID' || data.status === 'PENDING_KHATA') {
          setPaymentComplete(true);
          setBill(data);
          clearInterval(pollInterval);
          
          // Show success toast
          if (data.status === 'PENDING_KHATA') {
            toast.success('Added to Khata! 📒', { duration: 3000 });
          } else {
            toast.success('Payment confirmed! 🎉', { duration: 3000 });
          }
        }
        
        // Bill expired
        if (data.status === 'EXPIRED') {
          setError('Bill has expired. Please ask merchant to generate a new QR.');
          setBill(data);
          clearInterval(pollInterval);
        }
        
        // Bill cancelled
        if (data.status === 'CANCELLED') {
          setError('Bill was cancelled by merchant.');
          setBill(data);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);
    
    return () => clearInterval(pollInterval);
  }, [billId, bill, selectedMethod, paymentComplete]);

  // Countdown timer
  useEffect(() => {
    if (!bill?.expiresAt || bill.status !== 'AWAITING_PAYMENT') return;
    
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(bill.expiresAt) - Date.now()) / 1000));
      setExpiryCountdown(remaining);
      
      if (remaining <= 0) {
        setError('Bill has expired. Please ask merchant to generate a new QR.');
        setBill(prev => prev ? { ...prev, status: 'EXPIRED' } : null);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [bill?.expiresAt, bill?.status]);

  // Handle Khata button click - check login status and phone number
  const handleKhataClick = async () => {
    if (!isLoggedIn) {
      // Show login prompt
      setShowLoginPrompt(true);
      return;
    }
    
    // Fetch fresh user data from API to ensure we have latest phone
    try {
      setProcessing(true);
      const { data: freshUser } = await fetchProfile();
      
      // Update local storage with fresh data
      if (freshUser) {
        setStoredUser(freshUser);
      }
      
      if (freshUser?.phone) {
        // User has phone, show approval screen
        setPhoneNumber(freshUser.phone); // Pre-populate in case they want to edit
        setShowKhataApproval(true);
      } else {
        // No phone, show phone prompt
        // Pre-populate from local storage if available
        const storedUser = getStoredUser();
        if (storedUser?.phone) {
          setPhoneNumber(storedUser.phone);
        }
        setShowPhonePrompt(true);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      // Fallback to local storage
      const user = getStoredUser();
      if (user?.phone) {
        setPhoneNumber(user.phone);
        setShowKhataApproval(true);
      } else {
        setShowPhonePrompt(true);
      }
    } finally {
      setProcessing(false);
    }
  };

  // Handle phone number update
  const handlePhoneUpdate = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    
    setPhoneUpdating(true);
    
    try {
      // Update phone on backend
      const { data } = await updateCustomerPhone(phoneNumber);
      
      // Update local storage
      const user = getStoredUser();
      if (user) {
        user.phone = phoneNumber;
        setStoredUser(user);
      }
      
      toast.success('Phone number updated!');
      setShowPhonePrompt(false);
      
      // Now show khata approval screen
      setShowKhataApproval(true);
    } catch (err) {
      console.error('Failed to update phone:', err);
      toast.error(err.response?.data?.message || 'Failed to update phone number');
    } finally {
      setPhoneUpdating(false);
    }
  };

  // Handle confirming Khata after merchant approval
  const handleConfirmKhata = async () => {
    if (khataProcessing) return;
    
    const user = getStoredUser();
    const currentPhone = phoneNumber || user?.phone || '';
    
    // Validate phone number
    if (!currentPhone || currentPhone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    
    setKhataProcessing(true);
    
    try {
      // If phone was edited/added, save it to DB first
      if (phoneNumber && phoneNumber !== user?.phone) {
        try {
          await updateCustomerPhone(phoneNumber);
          // Update local storage
          if (user) {
            user.phone = phoneNumber;
            setStoredUser(user);
          }
          console.log('[CustomerPayment] Phone number saved to DB:', phoneNumber);
        } catch (phoneErr) {
          console.error('Failed to save phone number:', phoneErr);
          // Continue with khata even if phone save fails - backend will use provided phone
        }
      }
      
      const customerInfo = {
        customerName: user?.name || '',
        customerPhone: currentPhone,
        customerId: user?.id || user?._id || '',
      };
      
      const { data } = await selectPaymentMethod(billId, 'khata', customerInfo);
      console.log('[CustomerPayment] Khata response:', data);
      
      // Move to khata confirmation screen
      setSelectedMethod('khata');
      setShowKhataApproval(false);
      setBill(prev => ({ ...prev, paymentMethod: 'pending', customerSelected: true, status: 'AWAITING_PAYMENT' }));
      toast.success('Added to Khata! 📒', { duration: 3000 });
    } catch (err) {
      console.error('Failed to add to khata:', err);
      toast.error(err.response?.data?.message || 'Failed to add to Khata');
    } finally {
      setKhataProcessing(false);
    }
  };

  // Handle payment method selection
  const handleSelectMethod = async (method) => {
    if (processing) return;
    
    // Khata is handled separately
    if (method === 'khata') {
      handleKhataClick();
      return;
    }
    
    console.log('[CustomerPayment] Selecting payment method:', method);
    setSelectedMethod(method);
    setProcessing(true);

    try {
      const { data } = await selectPaymentMethod(billId, method);
      console.log('[CustomerPayment] Payment method response:', data);
      
      if (method === 'upi') {
        // Show UPI details screen - customer will open their UPI app and scan shop QR
        setShowUPIDetails(true);
        setBill(prev => ({ ...prev, paymentMethod: 'upi', customerSelected: true }));
      } else if (method === 'cash') {
        // Cash selected - show waiting for merchant confirmation
        setBill(prev => ({ ...prev, paymentMethod: 'cash', customerSelected: true }));
      }
    } catch (err) {
      console.error('Failed to select payment method:', err);
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setSelectedMethod(null);
    } finally {
      setProcessing(false);
    }
  };

  // Handle Razorpay payment for "Other" option (Card, Netbanking, Wallet)
  const handleRazorpayPayment = async () => {
    if (razorpayLoading) return;
    
    console.log('[CustomerPayment] Starting Razorpay payment flow');
    setRazorpayLoading(true);
    setSelectedMethod('other');
    
    try {
      // First, select the payment method on backend
      await selectPaymentMethod(billId, 'other');
      
      // Create Razorpay order on backend
      const { data } = await createRazorpayOrder(billId, {
        customerPhone: bill.customerPhone || '',
        customerName: bill.customerName || '',
        customerEmail: bill.customerEmail || '',
      });
      
      console.log('[CustomerPayment] Razorpay order created:', {
        orderId: data.orderId,
        keyId: data.keyId,
        amount: data.amount,
      });
      
      // Check if Razorpay is loaded
      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Payment gateway not loaded. Please refresh the page.');
      }
      
      // Razorpay Checkout options
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: data.merchantName || bill.merchant?.shopName || 'GreenReceipt',
        description: `Bill #${billId.slice(-8).toUpperCase()}`,
        order_id: data.orderId,
        
        // Payment methods - Card, Netbanking, Wallet (excluding UPI as we have separate option)
        method: {
          upi: false,
          card: true,
          netbanking: true,
          wallet: true,
          emi: true,
          paylater: true,
        },
        
        // Prefill customer details
        prefill: {
          name: data.prefill?.name || bill.customerName || '',
          email: data.prefill?.email || bill.customerEmail || '',
          contact: data.prefill?.contact || bill.customerPhone || '',
        },
        
        // Notes for reference
        notes: {
          billId: billId,
          merchantId: bill.merchant?._id || '',
        },
        
        // Theme customization
        theme: {
          color: '#10b981',
          backdrop_color: 'rgba(0,0,0,0.8)',
        },
        
        // Success callback
        handler: async function(response) {
          console.log('[CustomerPayment] Razorpay payment successful:', response);
          
          try {
            // Verify payment signature with backend
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              billId: billId,
            });
            
            // Payment successful
            setPaymentComplete(true);
            setBill(prev => ({ ...prev, status: 'PAID' }));
            toast.success('Payment successful! 🎉', { duration: 3000 });
            
          } catch (verifyErr) {
            console.error('[CustomerPayment] Payment verification failed:', verifyErr);
            // Even if verification fails, the webhook will handle it
            setPaymentComplete(true);
            toast.success('Payment received! Verifying...', { duration: 3000 });
          }
          
          setRazorpayLoading(false);
        },
        
        // Modal closed callback
        modal: {
          ondismiss: function() {
            console.log('[CustomerPayment] Razorpay checkout closed');
            setRazorpayLoading(false);
            setSelectedMethod(null);
            toast('Payment cancelled', { icon: '❌' });
          }
        }
      };
      
      // Open Razorpay Checkout
      const rzp = new window.Razorpay(options);
      
      // Handle payment failures
      rzp.on('payment.failed', function(response) {
        console.error('[CustomerPayment] Razorpay payment failed:', response.error);
        toast.error(response.error.description || 'Payment failed. Please try again.');
        setRazorpayLoading(false);
        setSelectedMethod(null);
      });
      
      rzp.open();
      
    } catch (err) {
      console.error('[CustomerPayment] Razorpay payment error:', err);
      toast.error(err.response?.data?.message || err.message || 'Payment gateway error');
      setSelectedMethod(null);
      setRazorpayLoading(false);
    }
  };

  // Open UPI app - just launch the app so customer can scan shop QR themselves
  // We're NOT pre-filling any payment data - customer will scan merchant's physical QR
  const handleOpenUPIApp = (specificApp = null) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // Android deep links and Play Store URLs (using market:// to open Play Store app directly)
    const ANDROID_APPS = {
      gpay: {
        deepLink: 'gpay://upi/',
        playStore: 'market://details?id=com.google.android.apps.nbu.paisa.user',
      },
      phonepe: {
        deepLink: 'phonepe://pay',
        playStore: 'market://details?id=com.phonepe.app',
      },
      paytm: {
        deepLink: 'paytm://upi',
        playStore: 'market://details?id=net.one97.paytm',
      },
      bhim: {
        deepLink: 'upi://pay',
        playStore: 'market://details?id=in.org.npci.upiapp',
      },
    };
    
    // iOS app schemes and App Store URLs (using itms-apps:// to open App Store app directly)
    const IOS_APPS = {
      gpay: {
        scheme: 'gpay://',
        appStore: 'itms-apps://apps.apple.com/app/google-pay/id1193357041',
      },
      phonepe: {
        scheme: 'phonepe://',
        appStore: 'itms-apps://apps.apple.com/app/phonepe-upi-payments-recharge/id1170055821',
      },
      paytm: {
        scheme: 'paytm://',
        appStore: 'itms-apps://apps.apple.com/app/paytm-payments-bank/id473941634',
      },
      bhim: {
        scheme: 'bhim://',
        appStore: 'itms-apps://apps.apple.com/app/bhim-making-india-cashless/id1200315258',
      },
    };
    
    if (isAndroid) {
      if (specificApp === 'default') {
        // Open system's default UPI app using generic upi:// scheme
        // This shows Android's app chooser if multiple UPI apps are installed
        window.location.href = 'upi://pay';
        return;
      }
      
      if (specificApp && ANDROID_APPS[specificApp]) {
        const app = ANDROID_APPS[specificApp];
        
        // Track if we're leaving the page (app opened successfully)
        let appOpened = false;
        
        // Listen for visibility change - if page becomes hidden, app opened
        const handleVisibilityChange = () => {
          if (document.hidden) {
            appOpened = true;
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Try to open the app
        window.location.href = app.deepLink;
        
        // If app doesn't open within 1.5 seconds, redirect to Play Store
        setTimeout(() => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          
          if (!appOpened && !document.hidden) {
            // App didn't open - redirect to Play Store
            toast(`${specificApp === 'gpay' ? 'Google Pay' : specificApp === 'phonepe' ? 'PhonePe' : specificApp === 'paytm' ? 'Paytm' : 'BHIM'} not installed. Opening Play Store...`, {
              duration: 2000,
              icon: '📲',
            });
            window.location.href = app.playStore;
          }
        }, 1500);
      }
      return;
    }
    
    if (isIOS) {
      if (specificApp === 'default') {
        // Try generic UPI scheme
        window.location.href = 'upi://';
        return;
      }
      
      if (specificApp && IOS_APPS[specificApp]) {
        const app = IOS_APPS[specificApp];
        
        // Track if we're leaving the page (app opened successfully)
        let appOpened = false;
        
        const handleVisibilityChange = () => {
          if (document.hidden) {
            appOpened = true;
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Try to open the app
        window.location.href = app.scheme;
        
        // If app doesn't open within 1.5 seconds, redirect to App Store
        setTimeout(() => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          
          if (!appOpened && !document.hidden) {
            // App didn't open - redirect to App Store
            toast(`${specificApp === 'gpay' ? 'Google Pay' : specificApp === 'phonepe' ? 'PhonePe' : specificApp === 'paytm' ? 'Paytm' : 'BHIM'} not installed. Opening App Store...`, {
              duration: 2000,
              icon: '📲',
            });
            window.location.href = app.appStore;
          }
        }, 1500);
      }
      return;
    }
    
    // Desktop fallback
    toast('Open your UPI app on your phone and scan the shop\'s QR code', {
      duration: 4000,
      icon: '📱',
    });
  };
  
  // Check if device is Android for showing individual app buttons
  const isAndroidDevice = /Android/.test(navigator.userAgent);
  
  // Check if device is iOS for showing individual app buttons
  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Check if mobile device (show app buttons)
  const isMobileDevice = isIOSDevice || isAndroidDevice;

  // Handle claiming receipt to customer account
  const handleClaimReceipt = async () => {
    if (!bill || !isLoggedIn) return;
    
    setClaimingReceipt(true);
    
    try {
      await claimPOSReceipt(billId);
      
      setReceiptClaimed(true);
      toast.success('Receipt saved to your account! 📱');
      
      // Dispatch event to update customer dashboard
      window.dispatchEvent(new Event('customer-receipts-updated'));
      
      // Navigate to customer dashboard after short delay
      setTimeout(() => {
        navigate('/customer-dashboard');
      }, 1500);
    } catch (err) {
      console.error('Failed to claim receipt:', err);
      toast.error(err.response?.data?.message || 'Failed to save receipt');
    } finally {
      setClaimingReceipt(false);
    }
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    // Store bill ID to claim after login
    sessionStorage.setItem('pendingBillClaim', billId);
    navigate('/customer-login', { state: { returnTo: `/pay/${billId}` } });
  };

  // Handle signup redirect
  const handleSignupRedirect = () => {
    sessionStorage.setItem('pendingBillClaim', billId);
    navigate('/customer-signup', { state: { returnTo: `/pay/${billId}` } });
  };

  // Format time remaining
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading bill details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !bill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center border border-slate-700/50">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Oops!</h1>
          <p className="text-slate-400 text-sm mb-4">{error || 'Bill not found'}</p>
          
          {/* Debug Info */}
          <div className="text-xs text-slate-600 bg-slate-900/50 rounded-lg p-2 mb-4 text-left">
            <div>Bill ID: {billId}</div>
            <div className="truncate">API: {import.meta.env.VITE_API_URL || 'localhost:5001'}</div>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-500 transition-colors mb-2 w-full"
          >
            Retry
          </button>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors w-full"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Bill expired state
  if (bill.status === 'EXPIRED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center border border-slate-700/50">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Bill Expired</h1>
          <p className="text-slate-400 text-sm">Please ask the merchant to generate a new QR code.</p>
        </div>
      </div>
    );
  }

  // Bill already paid - show success with claim option
  if ((bill.status === 'PAID' || paymentComplete) && !shouldShowKhataConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center border border-emerald-500/30">
          {/* Success Animation */}
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-[popIn_0.3s_ease-out]">
            <CheckCircle size={40} className="text-emerald-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Payment Complete!</h1>
          <p className="text-emerald-400 text-sm mb-6">
            Your payment has been confirmed.
          </p>
          
          {/* Receipt Summary */}
          <div className="bg-slate-900/50 rounded-2xl p-4 mb-6">
            <div className="text-3xl font-black text-emerald-400 mb-2">₹{bill.total}</div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Store size={12} />
              {bill.merchant?.shopName || 'Merchant'}
            </div>
            {bill.upiNote && (
              <div className="text-[10px] text-slate-600 mt-2 font-mono">
                Ref: {bill.upiNote}
              </div>
            )}
          </div>
          
          {/* Save Receipt Options */}
          {!receiptClaimed && (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs mb-3">
                Save this receipt to your GreenReceipt account
              </p>
              
              {isLoggedIn ? (
                // Logged in - Show save button
                <button
                  onClick={handleClaimReceipt}
                  disabled={claimingReceipt}
                  className="w-full p-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  {claimingReceipt ? (
                    <Loader2 size={20} className="animate-spin text-white" />
                  ) : (
                    <>
                      <Receipt size={20} className="text-white" />
                      <span className="font-bold text-white">Save to My Receipts</span>
                    </>
                  )}
                </button>
              ) : (
                // Not logged in - Show login/signup options
                <>
                  <button
                    onClick={handleLoginRedirect}
                    className="w-full p-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                  >
                    <LogIn size={20} className="text-white" />
                    <span className="font-bold text-white">Login to Save Receipt</span>
                  </button>
                  
                  <button
                    onClick={handleSignupRedirect}
                    className="w-full p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <UserPlus size={18} className="text-slate-300" />
                    <span className="text-slate-300 text-sm">Create Account</span>
                  </button>
                </>
              )}
              
              <button
                onClick={() => navigate('/')}
                className="w-full p-3 text-slate-500 text-sm hover:text-slate-400 transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}
          
          {/* Receipt Saved Confirmation */}
          {receiptClaimed && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-400 mb-4">
                <CheckCircle size={20} />
                <span className="font-medium">Receipt saved!</span>
              </div>
              <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // UPI selected - Show instructions to scan shop QR
  if (selectedMethod === 'upi' || showUPIDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full border border-purple-500/30">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone size={32} className="text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Pay via UPI</h1>
            <p className="text-slate-400 text-sm">Amount: <span className="text-white font-bold">₹{bill.total}</span></p>
          </div>

          {/* Instructions */}
          <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
            <h3 className="text-white font-medium mb-3 text-sm">Follow these steps:</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-400 text-xs font-bold">1</span>
                </div>
                <p className="text-slate-300 text-sm">Open your UPI app (GPay, PhonePe, Paytm, etc.)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-400 text-xs font-bold">2</span>
                </div>
                <p className="text-slate-300 text-sm">Scan the shop's QR code displayed at the counter</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-400 text-xs font-bold">3</span>
                </div>
                <p className="text-slate-300 text-sm">Pay <span className="text-white font-bold">₹{bill.total}</span> and come back here</p>
              </div>
            </div>
          </div>

          {/* Open UPI App Button(s) */}
          {isMobileDevice ? (
            // Mobile: Show app buttons with GPay as primary
            <div className="space-y-3 mb-4">
              {/* Primary: Popular UPI Apps */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleOpenUPIApp('gpay')}
                  className="p-4 bg-gradient-to-br from-blue-500 via-blue-600 to-green-500 hover:from-blue-400 hover:via-blue-500 hover:to-green-400 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/30"
                >
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <span className="text-white font-black text-lg">G</span>
                  </div>
                  <span className="text-white font-bold text-sm">Google Pay</span>
                </button>
                <button
                  onClick={() => handleOpenUPIApp('phonepe')}
                  className="p-4 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-500 hover:via-purple-600 hover:to-indigo-600 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 shadow-lg shadow-purple-500/30"
                >
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <span className="text-white font-black text-lg">Pe</span>
                  </div>
                  <span className="text-white font-bold text-sm">PhonePe</span>
                </button>
              </div>
              
              {/* Secondary: Other apps */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleOpenUPIApp('paytm')}
                  className="p-3 bg-gradient-to-br from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 rounded-xl flex items-center gap-3 transition-all active:scale-95 shadow-md shadow-sky-500/20"
                >
                  <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <span className="text-white font-semibold text-sm">Paytm</span>
                </button>
                <button
                  onClick={() => handleOpenUPIApp('bhim')}
                  className="p-3 bg-gradient-to-br from-orange-500 to-green-600 hover:from-orange-400 hover:to-green-500 rounded-xl flex items-center gap-3 transition-all active:scale-95 shadow-md shadow-orange-500/20"
                >
                  <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">B</span>
                  </div>
                  <span className="text-white font-semibold text-sm">BHIM</span>
                </button>
              </div>
              
              {/* Tertiary: Open any other bank app */}
              <button
                onClick={() => handleOpenUPIApp('default')}
                className="w-full p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Smartphone size={16} className="text-slate-400" />
                <span className="text-slate-300 text-sm">Open other bank/UPI app</span>
              </button>
              
              <p className="text-slate-500 text-[10px] text-center">
                Tap to open → scan shop's QR code at counter
              </p>
            </div>
          ) : (
            // Desktop: Show message
            <div className="bg-slate-900/50 rounded-xl p-4 mb-4 text-center">
              <Smartphone size={32} className="text-purple-400 mx-auto mb-2" />
              <p className="text-slate-300 text-sm">Open your UPI app on your phone</p>
              <p className="text-slate-500 text-xs mt-1">and scan the shop's QR code</p>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm">Pay to</span>
              <span className="text-white font-medium">{bill.merchant?.shopName || 'Merchant'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">Amount</span>
              <span className="text-purple-400 font-bold text-lg">₹{bill.total}</span>
            </div>
          </div>

          {/* Waiting status */}
          <div className="flex items-center justify-center gap-2 text-purple-400 text-sm mb-4">
            <Loader2 size={14} className="animate-spin" />
            <span>Waiting for merchant confirmation...</span>
          </div>
          
          <p className="text-[10px] text-slate-600 text-center mb-4">
            After you complete the payment, the merchant will confirm it
          </p>

          {/* Back button */}
          <button
            onClick={() => {
              setShowUPIDetails(false);
              setSelectedMethod(null);
            }}
            className="w-full py-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            ← Back to payment options
          </button>
        </div>
      </div>
    );
  }

  // Cash selected - waiting screen with polling
  if (selectedMethod === 'cash') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center border border-blue-500/30">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Banknote size={32} className="text-blue-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Pay by Cash</h1>
          <p className="text-slate-400 text-sm mb-6">
            Please pay <span className="text-white font-bold">₹{bill.total}</span> in cash to the merchant.
          </p>
          
          <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
            <div className="text-4xl font-black text-blue-400 mb-2">₹{bill.total}</div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Store size={12} />
              {bill.merchant?.shopName || 'Merchant'}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-amber-400 text-sm">
            <Loader2 size={14} className="animate-spin" />
            Waiting for merchant confirmation...
          </div>
          
          <p className="text-[10px] text-slate-600 mt-4 mb-4">
            This page will update automatically when the merchant confirms your payment
          </p>

          {/* Back button */}
          <button
            onClick={() => setSelectedMethod(null)}
            className="w-full py-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            ← Back to payment options
          </button>
        </div>
      </div>
    );
  }

  // Login Prompt Modal for Khata
  if (showLoginPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center border border-slate-700 relative">
          {/* Close button */}
          <button
            onClick={() => setShowLoginPrompt(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
          
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn size={32} className="text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Login Required</h1>
          <p className="text-slate-400 text-sm mb-6">
            Please login to use <span className="text-amber-400 font-semibold">Pay Later (Khata)</span>. 
            This helps the merchant track your pending dues.
          </p>
          
          <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
            <div className="text-2xl font-black text-white mb-1">₹{bill?.total}</div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Store size={12} />
              {bill?.merchant?.shopName || 'Merchant'}
            </div>
          </div>

          <div className="space-y-3">
            {/* Login button */}
            <button
              onClick={() => navigate(`/customer-login?redirect=/pay/${billId}&khata=true`)}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold hover:from-amber-500 hover:to-orange-500 transition-colors flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              Login to Continue
            </button>
            
            {/* Sign up button */}
            <button
              onClick={() => navigate(`/customer-signup?redirect=/pay/${billId}&khata=true`)}
              className="w-full py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus size={18} />
              Create Account
            </button>
            
            {/* Back button */}
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="w-full py-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              ← Back to payment options
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Phone Number Prompt Modal for Khata
  if (showPhonePrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center border border-amber-500/30">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone size={32} className="text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Phone Number Required</h1>
          <p className="text-slate-400 text-sm mb-6">
            Please add your phone number to use <span className="text-amber-400 font-semibold">Pay Later (Khata)</span>. 
            This helps the merchant contact you for payment reminders.
          </p>
          
          <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
            <label className="block text-left text-slate-400 text-xs mb-2">Phone Number</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-lg">+91</span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit number"
                className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg tracking-wider focus:outline-none focus:border-amber-500"
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-3">
            {/* Update phone button */}
            <button
              onClick={handlePhoneUpdate}
              disabled={phoneUpdating || phoneNumber.length < 10}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold hover:from-amber-500 hover:to-orange-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {phoneUpdating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Save & Continue
                </>
              )}
            </button>
            
            {/* Back button */}
            <button
              onClick={() => setShowPhonePrompt(false)}
              disabled={phoneUpdating}
              className="w-full py-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              ← Back to payment options
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Khata Approval Screen - Show customer details to merchant for approval
  if (showKhataApproval) {
    const user = getStoredUser();
    const hasExistingPhone = !!user?.phone;
    const displayPhone = hasExistingPhone ? user.phone : phoneNumber;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full border border-amber-500/30">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} className="text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Enable Khata</h1>
            <p className="text-slate-400 text-sm">
              Show this to the merchant for approval
            </p>
          </div>

          {/* Customer Details Card */}
          <div className="bg-slate-900/70 rounded-xl p-4 mb-4 border border-slate-700">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Customer Details</p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <User size={20} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{user?.name || 'Customer'}</p>
                  <p className="text-slate-500 text-xs">Name</p>
                </div>
              </div>
              
              {/* Phone Number - Editable only if user doesn't have one */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone size={20} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                  {hasExistingPhone ? (
                    // Show phone as read-only when user has it
                    <div>
                      <p className="text-white font-medium">+91 {user.phone}</p>
                      <p className="text-slate-500 text-xs">Phone Number</p>
                    </div>
                  ) : (
                    // Allow input when user doesn't have phone
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-sm">+91</span>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="Enter phone"
                          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                          maxLength={10}
                        />
                      </div>
                      <p className="text-amber-400 text-xs mt-1">* Phone required for Khata</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Amount Card */}
          <div className="bg-amber-500/10 rounded-xl p-4 mb-4 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-400 text-xs uppercase tracking-wider">Amount to Add</p>
                <p className="text-3xl font-black text-white">₹{bill?.total}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs">To Khata of</p>
                <p className="text-white font-medium">{bill?.merchant?.shopName || 'Merchant'}</p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-slate-900/50 rounded-xl p-3 mb-6">
            <p className="text-slate-400 text-xs text-center">
              📒 Once approved, this amount will be added to your pending dues. 
              You can pay it later from your dashboard.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleConfirmKhata}
              disabled={khataProcessing || (!hasExistingPhone && phoneNumber.length < 10)}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold hover:from-amber-500 hover:to-orange-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {khataProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Merchant Approved - Confirm
                </>
              )}
            </button>
            
            {!hasExistingPhone && phoneNumber.length < 10 && (
              <p className="text-red-400 text-xs text-center">Please enter a valid 10-digit phone number</p>
            )}
            
            <button
              onClick={() => setShowKhataApproval(false)}
              disabled={khataProcessing}
              className="w-full py-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              ← Back to payment options
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Khata Waiting Screen (Merchant Confirmation)
  if (shouldShowKhataWaiting) {
     return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center border border-amber-500/30">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Clock size={32} className="text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Waiting for Merchant</h1>
          <p className="text-slate-400 text-sm mb-6">
            Please ask the merchant to confirm your Khata request.
          </p>
          
          <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
            <div className="text-4xl font-black text-amber-400 mb-2">₹{bill.total}</div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Store size={12} />
              {bill.merchant?.shopName || 'Merchant'}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-amber-400 text-sm mb-6">
            <Loader2 size={16} className="animate-spin" />
            Waiting for confirmation...
          </div>

          <p className="text-[10px] text-slate-500 mb-4">
            Do not close this window. It will update automatically.
          </p>
        </div>
      </div>
    );
  }

  // Khata (Pay Later) selected - show confirmation screen
  if (shouldShowKhataConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center border border-amber-500/30">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet size={32} className="text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Added to Khata</h1>
          <p className="text-slate-400 text-sm mb-6">
            <span className="text-white font-bold">₹{bill.total}</span> has been added to your pending dues.
          </p>
          
          <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
            <div className="text-4xl font-black text-amber-400 mb-2">₹{bill.total}</div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Store size={12} />
              {bill.merchant?.shopName || 'Merchant'}
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
            <p className="text-amber-400 text-sm font-medium">📒 Pending Payment</p>
            <p className="text-slate-400 text-xs mt-1">
              You can pay this later from your Pending Dues section
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm mb-4">
            <CheckCircle size={14} />
            Added to your account
          </div>

          {/* View Pending Dues button */}
          <button
            onClick={() => navigate('/customer-dashboard?tab=pending')}
            className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-500 transition-colors mb-2"
          >
            View Pending Dues
          </button>

          {/* Back button */}
          <button
            onClick={() => setSelectedMethod(null)}
            className="w-full py-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            ← Back to payment options
          </button>
        </div>
      </div>
    );
  }

  // Main payment choice screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="p-4 pt-6">
        <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
          <Leaf size={20} className="fill-emerald-400" />
          <span className="font-bold text-sm">GreenReceipt</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full border border-slate-700/50 shadow-2xl">
          
          {/* Timer */}
          {expiryCountdown > 0 && (
            <div className={`flex items-center justify-center gap-2 mb-4 px-3 py-2 rounded-full text-xs font-medium ${
              expiryCountdown < 60 
                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                : expiryCountdown < 180 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-slate-700/50 text-slate-400'
            }`}>
              <Clock size={12} />
              <span>Expires in {formatTime(expiryCountdown)}</span>
            </div>
          )}

          {/* Merchant Info */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Store size={24} className="text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white">{bill.merchant?.shopName || 'Merchant'}</h2>
            <p className="text-slate-500 text-xs">{bill.merchant?.address || ''}</p>
          </div>

          {/* Amount */}
          <div className="bg-slate-900/50 rounded-2xl p-4 mb-6 text-center">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Amount to Pay</p>
            <div className="text-4xl font-black text-white">₹{bill.total}</div>
          </div>

          {/* Items Summary (Collapsible) */}
          {bill.items && bill.items.length > 0 && (
            <div className="bg-slate-900/30 rounded-xl p-3 mb-6">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <ShoppingBag size={12} />
                <span>{bill.items.length} item(s)</span>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {bill.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-slate-300">{item.name} × {item.quantity}</span>
                    <span className="text-slate-400">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bill Reference */}
          <div className="text-center mb-6">
            <p className="text-slate-600 text-[10px] uppercase tracking-wider">Bill Reference</p>
            <p className="text-slate-400 font-mono text-xs">{bill.upiNote || bill.id}</p>
          </div>

          {/* Payment Options */}
          <div className="space-y-3">
            <p className="text-center text-slate-400 text-xs mb-4">Choose Payment Method</p>
            
            {/* Pay by Cash */}
            <button
              onClick={() => handleSelectMethod('cash')}
              disabled={processing}
              className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Banknote size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-white">Pay via Cash</div>
                  <div className="text-blue-200 text-xs">Hand cash to merchant</div>
                </div>
              </div>
              <ArrowRight size={18} className="text-white/60" />
            </button>

            {/* Pay via UPI */}
            <button
              onClick={() => handleSelectMethod('upi')}
              disabled={processing}
              className="w-full p-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-purple-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Smartphone size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-white">Pay via UPI</div>
                  <div className="text-purple-200 text-xs">Scan shop QR & pay</div>
                </div>
              </div>
              <ArrowRight size={18} className="text-white/60" />
            </button>

            {/* Pay via Other (Razorpay - Card, Netbanking, Wallet) */}
            <button
              onClick={handleRazorpayPayment}
              disabled={processing || razorpayLoading}
              className="w-full p-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <CreditCard size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-white">Pay via Other</div>
                  <div className="text-emerald-200 text-xs">Card, Netbanking, Wallet</div>
                </div>
              </div>
              {razorpayLoading ? (
                <Loader2 size={18} className="text-white animate-spin" />
              ) : (
                <ArrowRight size={18} className="text-white/60" />
              )}
            </button>

            {/* Pay Later (Khata) - Available for all, prompts login if needed */}
            <button
              onClick={() => handleSelectMethod('khata')}
              disabled={processing}
              className="w-full p-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-amber-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Wallet size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-white">Pay Later (Khata)</div>
                  <div className="text-amber-200 text-xs">Add to pending dues</div>
                </div>
              </div>
              <ArrowRight size={18} className="text-white/60" />
            </button>
          </div>

          {/* Processing indicator */}
          {(processing || razorpayLoading) && (
            <div className="mt-4 flex items-center justify-center gap-2 text-slate-400 text-sm">
              <Loader2 size={14} className="animate-spin" />
              {razorpayLoading ? 'Opening payment gateway...' : 'Processing...'}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center">
        <p className="text-slate-600 text-[10px]">Powered by GreenReceipt • Digital receipts, zero paper</p>
      </div>
    </div>
  );
};

export default CustomerPayment;
