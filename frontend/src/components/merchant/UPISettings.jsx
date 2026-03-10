import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Save, 
  Info,
  CreditCard,
  Shield,
  QrCode,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchUPISettings, updateUPISettings, verifyUPISettings } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * UPI Settings Component
 * Allows merchants to configure their UPI ID for receiving payments
 * Part of the Merchant-Confirmed UPI Payment System
 */
const UPISettings = () => {
  const { isDark } = useTheme();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [upiType, setUpiType] = useState('PERSONAL');
  const [personalUpiQrImage, setPersonalUpiQrImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load UPI settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await fetchUPISettings();
      setSettings(data);
      setUpiId(data.upiId || '');
      setUpiName(data.upiName || '');
      setUpiType(data.upiType || 'PERSONAL');
      setPersonalUpiQrImage(data.personalUpiQrImage || null);
    } catch (err) {
      console.error('Failed to load UPI settings:', err);
      toast.error('Failed to load UPI settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle QR image upload (converts to base64)
  const handleQrImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPersonalUpiQrImage(event.target.result);
      setIsEditing(true);
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  // Remove QR image
  const handleRemoveQrImage = () => {
    setPersonalUpiQrImage(null);
    setIsEditing(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!upiId.trim()) {
      toast.error('Please enter your UPI ID');
      return;
    }

    // Basic validation
    if (!upiId.includes('@')) {
      toast.error('Invalid UPI ID format. Example: yourname@upi');
      return;
    }

    setSaving(true);
    try {
      const { data } = await updateUPISettings({ 
        upiId: upiId.trim(), 
        upiName: upiName.trim() || null,
        upiType,
        personalUpiQrImage
      });
      
      setSettings(data);
      setIsEditing(false);
      toast.success('UPI settings saved successfully!');
    } catch (err) {
      console.error('Failed to save UPI settings:', err);
      toast.error(err.response?.data?.message || 'Failed to save UPI settings');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    setSaving(true);
    try {
      const { data } = await verifyUPISettings();
      setSettings(prev => ({ ...prev, isUpiVerified: true }));
      toast.success('UPI ID verified successfully!');
    } catch (err) {
      console.error('Failed to verify UPI:', err);
      toast.error(err.response?.data?.message || 'Failed to verify UPI');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border shadow-sm p-6`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-purple-500" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700 bg-gradient-to-r from-purple-900/30 to-indigo-900/30' : 'border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
            <Smartphone className="text-purple-500" size={20} />
          </div>
          <div>
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              UPI Payment Settings
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Configure your UPI ID to receive payments
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Status Badge */}
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          settings?.isConfigured 
            ? isDark ? 'bg-emerald-900/20 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
            : isDark ? 'bg-amber-900/20 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
        }`}>
          {settings?.isConfigured ? (
            <>
              <CheckCircle className="text-emerald-500" size={20} />
              <div className="flex-1">
                <p className={`font-medium text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  UPI Configured
                </p>
                <p className={`text-xs ${isDark ? 'text-emerald-400/70' : 'text-emerald-600'}`}>
                  {settings.upiId}
                </p>
              </div>
              {settings.isUpiVerified && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                  <Shield size={12} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-500">Verified</span>
                </div>
              )}
            </>
          ) : (
            <>
              <AlertCircle className="text-amber-500" size={20} />
              <div className="flex-1">
                <p className={`font-medium text-sm ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  UPI Not Configured
                </p>
                <p className={`text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                  Add your UPI ID to start receiving payments
                </p>
              </div>
            </>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              UPI ID / VPA
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  setIsEditing(true);
                }}
                placeholder="yourname@upi, 9876543210@paytm"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none font-medium transition-all ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                }`}
              />
            </div>
            <p className={`text-[10px] mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              This is your Virtual Payment Address (VPA) from any UPI app
            </p>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Display Name (Optional)
            </label>
            <input
              type="text"
              value={upiName}
              onChange={(e) => {
                setUpiName(e.target.value);
                setIsEditing(true);
              }}
              placeholder="Your Shop Name"
              className={`w-full px-4 py-3 rounded-xl border outline-none font-medium transition-all ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500'
              }`}
            />
            <p className={`text-[10px] mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Shown to customers when scanning QR
            </p>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              UPI Account Type
            </label>
            <div className={`p-1 rounded-xl flex ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-slate-100 border border-slate-200'}`}>
              <button
                type="button"
                onClick={() => { setUpiType('PERSONAL'); setIsEditing(true); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  upiType === 'PERSONAL'
                    ? (isDark ? 'bg-slate-700 text-white shadow' : 'bg-white text-purple-600 shadow')
                    : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                Personal (P2P)
              </button>
              <button
                type="button"
                onClick={() => { setUpiType('MERCHANT'); setIsEditing(true); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  upiType === 'MERCHANT'
                    ? (isDark ? 'bg-slate-700 text-white shadow' : 'bg-white text-purple-600 shadow')
                    : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                Merchant (P2M)
              </button>
            </div>
            {upiType === 'PERSONAL' ? (
               <p className={`text-[10px] mt-1.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  ⚠️ Personal accounts don't support auto-filled amounts. Customers must enter amount manually.
               </p>
            ) : (
               <p className={`text-[10px] mt-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  ✅ Supports auto-filled amounts for faster payments. Requires a business UPI account.
               </p>
            )}
          </div>

          {/* Personal UPI QR Image Upload - Only show for PERSONAL type */}
          {upiType === 'PERSONAL' && (
            <div>
              <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Personal UPI QR Image
              </label>
              <div className={`p-4 rounded-xl border-2 border-dashed ${
                isDark ? 'border-slate-600 bg-slate-700/30' : 'border-slate-200 bg-slate-50'
              }`}>
                {personalUpiQrImage ? (
                  <div className="relative">
                    <div className="flex justify-center">
                      <div className={`relative p-2 rounded-xl ${isDark ? 'bg-white' : 'bg-white shadow-sm'}`}>
                        <img 
                          src={personalUpiQrImage} 
                          alt="Personal UPI QR Code"
                          className="w-40 h-40 object-contain rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveQrImage}
                          className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <p className={`text-center text-[10px] mt-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      ✓ QR image uploaded - Customers will scan this for payment
                    </p>
                  </div>
                ) : (
                  <div 
                    className="text-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-3 ${
                      isDark ? 'bg-slate-600' : 'bg-slate-200'
                    }`}>
                      <Upload size={24} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                    </div>
                    <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Upload your Personal UPI QR
                    </p>
                    <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Get it from GPay/PhonePe → Profile → QR Code
                    </p>
                    <button
                      type="button"
                      className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isDark 
                          ? 'bg-purple-600 text-white hover:bg-purple-700' 
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      <ImageIcon size={14} className="inline mr-2" />
                      Choose Image
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQrImageUpload}
                  className="hidden"
                />
              </div>
              <div className={`mt-2 p-3 rounded-lg ${isDark ? 'bg-emerald-900/20 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                <p className={`text-[10px] ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  <span className="font-bold">💡 Why upload QR?</span> Using your personal QR ensures P2P payments that never fail with "merchant not verified" errors. Customers simply scan and pay - no UPI intents, no fees.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        {isEditing && (
          <button
            onClick={handleSave}
            disabled={saving || !upiId.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Save size={18} />
                Save UPI Settings
              </>
            )}
          </button>
        )}

        {/* Verify Button (only show if configured but not verified) */}
        {settings?.isConfigured && !settings?.isUpiVerified && !isEditing && (
          <button
            onClick={handleVerify}
            disabled={saving}
            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
              isDark
                ? 'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Shield size={16} />
                Verify UPI ID
              </>
            )}
          </button>
        )}

        {/* Info Box */}
        <div className={`flex gap-3 p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
          <Info className={`shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} size={16} />
          <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} space-y-2`}>
            <p className="font-medium">How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              {settings?.personalUpiQrImage && settings?.upiType === 'PERSONAL' ? (
                // P2P flow with personal QR
                <>
                  <li>Customer sees your personal QR code</li>
                  <li>Customer opens GPay/PhonePe and scans QR</li>
                  <li>Customer enters amount (₹) manually</li>
                  <li>Customer enters PIN and pays (P2P transfer)</li>
                  <li>You see payment in your UPI app</li>
                  <li>Click "I Received" to confirm & generate receipt</li>
                </>
              ) : (
                // Standard flow
                <>
                  <li>Customer scans the QR code with GPay/PhonePe</li>
                  <li>UPI app opens{settings?.upiType === 'MERCHANT' ? ' with amount pre-filled' : ''}</li>
                  {settings?.upiType === 'PERSONAL' && <li>Customer enters amount manually</li>}
                  <li>Customer enters PIN and pays</li>
                  <li>You see payment in your UPI app</li>
                  <li>Click "I Received" to confirm & generate receipt</li>
                </>
              )}
            </ol>
          </div>
        </div>

        {/* Example QR Preview */}
        {settings?.isConfigured && (
          <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-slate-700/30' : 'bg-purple-50/50'}`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <QrCode size={16} className="text-purple-500" />
              <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {settings?.personalUpiQrImage ? 'Your Personal QR' : 'QR Preview'}
              </span>
            </div>
            <div className={`inline-block p-3 rounded-xl ${isDark ? 'bg-white' : 'bg-white'} shadow-sm`}>
              {/* Show uploaded personal QR if available */}
              {settings?.personalUpiQrImage ? (
                <img 
                  src={settings.personalUpiQrImage}
                  alt="Personal UPI QR"
                  className="w-24 h-24 object-contain"
                />
              ) : (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                    settings.upiType === 'MERCHANT'
                      ? `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.upiName || 'Merchant')}&am=100&cu=INR&tn=Test&mode=02`
                      : `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.upiName || 'Merchant')}&cu=INR`
                  )}`}
                  alt="UPI QR Preview"
                  className="w-24 h-24"
                />
              )}
            </div>
            <p className={`text-[10px] mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {settings?.personalUpiQrImage 
                ? '✓ Using your uploaded personal QR (P2P)' 
                : settings.upiType === 'MERCHANT' 
                  ? 'Sample QR for ₹100 payment' 
                  : 'Sample QR (amount manually entered)'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UPISettings;
