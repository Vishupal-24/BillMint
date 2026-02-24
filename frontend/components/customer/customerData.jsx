export const MOCK_RECEIPTS = [
  {
    id: "R-101",
    merchant: "College Canteen",
    date: "2025-12-20",
    time: "1:30 PM",
    amount: 65,
    type: "qr", // 'qr' or 'upload'
    items: [
      { name: "Veg Sandwich", qty: 1, price: 45 },
      { name: "Tea", qty: 2, price: 10 }
    ],
    footer: "Thank you! Visit again."
  },
  {
    id: "R-102",
    merchant: "City Stationery",
    date: "2025-12-19",
    time: "5:15 PM",
    amount: 120,
    type: "upload",
    image: "https://placehold.co/300x500/e2e8f0/64748b?text=Receipt+Image", 
    note: "Notebooks for semester"
  },
  {
    id: "R-103",
    merchant: "Starbucks Coffee",
    date: "2025-12-18",
    time: "10:00 AM",
    amount: 350,
    type: "qr",
    items: [
      { name: "Cappuccino", qty: 1, price: 250 },
      { name: "Cookie", qty: 1, price: 100 }
    ],
    footer: "Brewed with love."
  },
  {
    id: "R-104",
    merchant: "Uber Ride",
    date: "2025-12-18",
    time: "9:00 AM",
    amount: 185,
    type: "upload",
    image: null,
    note: "Commute to college"
  }
];

export const USER_PROFILE = {
  name: "Aditya Sharma",
  email: "aditya.student@gmail.com",
  joined: "Sept 2024",
  totalSaved: "850g Paper"
};