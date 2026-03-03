import React from 'react';

const ScreenPriceBehavior = ({ selected, onSelect }) => {
  const options = [
    "Yes, mostly fixed",
    "Sometimes fixed, sometimes not",
    "Depends on quantity"
  ];

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h2>Do your prices usually stay same?</h2>
        <p>This helps with auto-suggestions</p>
      </div>

      <div className="vertical-list">
        {options.map((opt) => (
          <div 
            key={opt}
            className={`selection-card list-card ${selected === opt ? 'selected' : ''}`}
            onClick={() => onSelect(opt)}
            style={{ justifyContent: 'space-between' }}
          >
            <span className="card-label">{opt}</span>
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%',
              border: '2px solid #ccc',
              background: selected === opt ? '#4CAF50' : 'transparent'
            }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScreenPriceBehavior;