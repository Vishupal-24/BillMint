import React from 'react';

const ScreenBillingStyle = ({ selected, onSelect }) => {
  const options = [
    { id: 'item', label: "Per Item", sub: "₹20 for 1 samosa" },
    { id: 'weight', label: "By Weight", sub: "₹50 per kg" },
    { id: 'both', label: "Both (Item & Weight)", sub: "Most shops use this" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h2>How do you usually charge?</h2>
        <p>Select the one you use most</p>
      </div>

      <div className="vertical-list">
        {options.map((opt) => (
          <div 
            key={opt.id}
            className={`selection-card list-card ${selected === opt.id ? 'selected' : ''}`}
            onClick={() => onSelect(opt.id)}
            style={{ flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}
          >
            <span className="card-label" style={{ fontSize: '18px' }}>{opt.label}</span>
            <span style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>
              {opt.sub}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScreenBillingStyle;