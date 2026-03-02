import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

// Import Components
import MerchantSidebar from '../components/merchant/MerchantSidebar'; 
import BottomNav from '../components/merchant/BottomNav';

// Import Pages
import MerchantOverview from '../components/merchant/MerchantOverview';
import MerchantCalendar from '../components/merchant/MerchantCalendar';
import MerchantBilling from '../components/merchant/MerchantBilling';
import MerchantItems from '../components/merchant/MerchantItems';
import MerchantInsights from '../components/merchant/MerchantInsights';
import MerchantProfile from '../components/merchant/MerchantProfile';
import MerchantOnboardingWizard from '../components/onboarding/MerchantOnboardingWizard';
import MerchantVerify from '../components/merchant/MerchantVerify';

const MerchantDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Profile state
  const [profile, setProfile] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(null); // null = loading, true/false = loaded
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if currently on onboarding page
  const isOnboardingPage = location.pathname.includes('/onboarding');

  // Check onboarding status on mount
  useEffect(() => {
    const checkProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.fetchProfile();
        setProfile(data);
        const profileComplete = data.isProfileComplete === true;
        setIsProfileComplete(profileComplete);
        localStorage.setItem('isProfileComplete', String(profileComplete));
      } catch (err) {
        console.error('Failed to check profile:', err);
        // Use cached value on error
        const cached = localStorage.getItem('isProfileComplete');
        setIsProfileComplete(cached === 'true');
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    checkProfile();
  }, []);

  // Handle redirects after profile is loaded
  useEffect(() => {
    if (loading || isProfileComplete === null) return;

    // If profile is NOT complete and NOT on onboarding page, redirect to onboarding
    if (!isProfileComplete && !isOnboardingPage) {
      navigate('/merchant/onboarding', { replace: true });
    }
    // If profile IS complete and ON onboarding page, redirect to overview
    else if (isProfileComplete && isOnboardingPage) {
      navigate('/merchant/overview', { replace: true });
    }
  }, [loading, isProfileComplete, isOnboardingPage, navigate]);

  // Handle onboarding completion - use callback to ensure stable reference
  const handleOnboardingComplete = useCallback(() => {
    console.log('Onboarding complete! Redirecting to dashboard...');
    // Update state first
    setIsProfileComplete(true);
    localStorage.setItem('isProfileComplete', 'true');
    // Use setTimeout to ensure state is updated before navigation
    setTimeout(() => {
      navigate('/merchant/overview', { replace: true });
    }, 100);
  }, [navigate]);

  // Inventory state for billing (fetched from API)
  const [inventory, setInventory] = useState([]);
  
  // Load inventory function (reusable)
  const loadInventory = useCallback(async () => {
    if (!isProfileComplete) return;
    try {
      const { data } = await api.fetchItems();
      const items = (data.items || [])
        .filter(item => item.isAvailable !== false) // Only include available items
        .map(item => ({
          id: item._id,
          name: item.name,
          price: item.price,
          category: item.categoryId?.name || 'Other',
          isAvailable: item.isAvailable,
          imageUrl: item.imageUrl,
        }));
      setInventory(items);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  }, [isProfileComplete]);

  // Initial inventory load
  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Listen for inventory updates from MerchantItems
  useEffect(() => {
    const handleItemsUpdate = () => {
      loadInventory();
    };
    
    window.addEventListener('merchant-items-updated', handleItemsUpdate);
    return () => window.removeEventListener('merchant-items-updated', handleItemsUpdate);
  }, [loadInventory]);

  // Show loading while checking profile
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f0f12] transition-colors duration-300">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding wizard if profile is not complete (regardless of route)
  if (!isProfileComplete) {
    return <MerchantOnboardingWizard onComplete={handleOnboardingComplete} initialData={profile} />;
  }

  // Hide Bottom Bar when on the Billing Page
  const isBillingPage = location.pathname.includes('billing');

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0f0f12] font-sans text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      
      {/* 🖥️ DESKTOP: Sidebar (Hidden on Mobile) */}
      <div className="hidden md:flex h-full">
         <MerchantSidebar />
      </div>

      {/* ⚪ MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative dark-ambient">
        
        {/* Scrollable Content */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-8 ${!isBillingPage ? 'pb-24 md:pb-8' : ''} relative z-10`}>
            <div className="max-w-6xl mx-auto">
                
                <Routes>
                  {/* Default redirect to overview */}
                  <Route path="/" element={<Navigate to="/merchant/overview" replace />} />
                  
                  {/* Onboarding route - redirects to overview since profile is complete */}
                  <Route path="onboarding" element={<Navigate to="/merchant/overview" replace />} />
                  
                  {/* Main Dashboard Routes */}
                  <Route path="overview" element={<MerchantOverview />} />
                  <Route path="calendar" element={<MerchantCalendar />} />
                  <Route path="billing" element={<MerchantBilling inventory={inventory} profile={profile} />} />
                  <Route path="items" element={<MerchantItems />} />
                  <Route path="insights" element={<MerchantInsights />} />
                  <Route path="profile" element={<MerchantProfile />} />
                  {/* Verify route still disabled */}
                  {/* <Route path="verify" element={<MerchantVerify />} /> */}
                  
                  {/* Catch-all redirect to overview */}
                  <Route path="*" element={<Navigate to="/merchant/overview" replace />} />
                </Routes>

            </div>
        </main>

        {/* 📱 MOBILE: Bottom Nav */}
        {!isBillingPage && (
           <div className="md:hidden">
              <BottomNav />
           </div>
        )}

      </div>

    </div>
  );
};

export default MerchantDashboard;