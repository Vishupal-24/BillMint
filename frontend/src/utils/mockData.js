// src/utils/mockData.js

// 1. Helper to get Month Names
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// 2. Generator Function (Used by Calendar)
export const getMonthData = (year, month) => {
  const data = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 1; i <= daysInMonth; i++) {
    // Format: YYYY-MM-DD
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    
    // Randomly decide if this day had sales (80% chance)
    if (Math.random() > 0.2) {
      const dailyBills = [];
      const numBills = Math.floor(Math.random() * 8) + 2; // 2 to 10 bills
      
      for (let b = 0; b < numBills; b++) {
        dailyBills.push({
          id: `${dateKey}-${b}`,
          time: `${9 + b}:30 AM`,
          amount: Math.floor(Math.random() * 500) + 50,
          items: ["Tea", "Samosa", "Sandwich"] 
        });
      }
      data[dateKey] = dailyBills;
    }
  }
  return data;
};

// 3. Static Exports (Used by MerchantOverview.jsx)
// We pre-generate data for December 2025 so the Home page doesn't crash
export const TODAY_KEY = "2025-12-20"; 
export const MOCK_DB = getMonthData(2025, 11); // 11 = December