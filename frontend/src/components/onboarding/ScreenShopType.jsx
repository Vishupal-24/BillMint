
import React from 'react';

const ScreenShopType = ({ selected, onSelect }) => {
  const options = [
    { label: "Kirana / Grocery", icon: "🛒" },
    { label: "Food / Snacks", icon: "🍔" },
    { label: "Sweets / Bakery", icon: "🍬" },
    { label: "Clothes / Acc.", icon: "👕" },
    { label: "Hardware", icon: "🧰" },
    { label: "General / Mix", icon: "📦" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h2>What do you mostly sell?</h2>
        <p>This helps us set things up for you</p>
      </div>

      <div className="grid-2-col">
        {options.map((opt) => (
          <div 
            key={opt.label}
            className={`selection-card ${selected === opt.label ? 'selected' : ''}`}
            onClick={() => onSelect(opt.label)}
          >
            <span className="emoji-icon">{opt.icon}</span>
            <span className="card-label">{opt.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScreenShopType;