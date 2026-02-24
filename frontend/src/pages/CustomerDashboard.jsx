import React, { useState } from 'react';
import CustomerSidebar from '../components/customer/CustomerSidebar';
import CustomerHome from '../components/customer/CustomerHome';
import CustomerReceipts from '../components/customer/CustomerReceipts';
import CustomerCalendar from '../components/customer/CustomerCalendar';
import CustomerInsights from '../components/customer/CustomerInsights';
import CustomerProfile from '../components/customer/CustomerProfile';
import CustomerNotifications from '../components/customer/CustomerNotifications'; // 👈 IMPORT
import { Receipt, ScanLine, Bell, X, Camera, CheckCircle } from 'lucide-react'; // 👈 ICONS

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  
  // 📸 GLOBAL SCANNER STATE (Lifted Up)
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('scanning');

  // Trigger Scanner Function
  const handleGlobalScan = () => {
    setIsScanning(true);
    setScanStatus('scanning');
    
    // Simulate Scan Process
    setTimeout(() => {
        setScanStatus('success');
        // In a real app, you would parse the QR data here and pass it to a context/store
        // For now, we simulate success and close
        setTimeout(() => {
            setIsScanning(false);
            setActiveTab('receipts'); // Redirect user to see their new receipt
            // Note: In a real app, we'd actually inject the new receipt here.
            // Since we are using mock data inside components, the 'success' is visual for now.
        }, 1500);
    }, 2500);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Navigation */}
      <CustomerSidebar 
        activeTab={activeTab} 
        onNavigate={setActiveTab} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* 📱 MOBILE HEADER (Scan - Logo - Bell) */}
        <div className="md:hidden h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 shrink-0 sticky top-0 z-30 shadow-sm">
             
             {/* 1. TOP LEFT: SCAN */}
             <button 
                onClick={handleGlobalScan}
                className="p-2 bg-slate-50 text-slate-600 rounded-full hover:bg-slate-100 active:scale-95 transition-all"
                title="Scan QR"
             >
                <ScanLine size={22} />
             </button>

             {/* 2. CENTER: LOGO */}
             <div className="flex items-center gap-2 text-emerald-700">
                <span className="font-bold text-lg tracking-tight">GreenReceipt</span>
             </div>

             {/* 3. TOP RIGHT: NOTIFICATIONS */}
             <button 
                onClick={() => setActiveTab('notifications')}
                className="p-2 bg-slate-50 text-slate-600 rounded-full hover:bg-slate-100 active:scale-95 transition-all relative"
                title="Notifications"
             >
                <Bell size={22} />
                {/* Notification Dot */}
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>
        </div>
        
        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
           <div className="max-w-4xl mx-auto animate-fade-in">
              {/* Pass the global scan handler to Home so the big button still works */}
              {activeTab === 'home' && <CustomerHome onNavigate={setActiveTab} onScanTrigger={handleGlobalScan} />}
              {activeTab === 'receipts' && <CustomerReceipts />}
              {activeTab === 'calendar' && <CustomerCalendar />}
              {activeTab === 'insights' && <CustomerInsights />}
              {activeTab === 'profile' && <CustomerProfile />}
              {activeTab === 'notifications' && <CustomerNotifications />}
           </div>
        </main>
      </div>

      {/* 📸 GLOBAL SCANNER OVERLAY */}
      {isScanning && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center animate-fade-in">
            <button onClick={() => setIsScanning(false)} className="absolute top-6 right-6 text-white/50 hover:text-white p-2"><X size={32} /></button>
            <div className="w-full max-w-sm px-8 text-center">
                {scanStatus === 'scanning' ? (
                    <>
                         <div className="relative w-64 h-64 mx-auto border-2 border-emerald-500/50 rounded-3xl flex items-center justify-center overflow-hidden bg-slate-800/50 mb-8">
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                            <Camera className="text-white/20" size={64} />
                            {/* Corner Markers */}
                            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl"></div>
                            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl"></div>
                            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl"></div>
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl"></div>
                         </div>
                         <h3 className="text-white text-xl font-bold mb-2">Scanning...</h3>
                         <p className="text-slate-400 text-sm">Align the QR code within the frame</p>
                    </>
                ) : (
                    <div className="animate-[popIn_0.3s_ease-out]">
                        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)]"><CheckCircle className="text-white" size={48} /></div>
                        <h3 className="text-white text-2xl font-bold mb-2">Receipt Found!</h3>
                    </div>
                )}
            </div>
            <style>{`@keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }`}</style>
        </div>
      )}

    </div>
  );
};

export default CustomerDashboard;