import React from 'react';

const ScreenUnits = ({ selectedUnits, onUpdate, onNext }) => {
  const options = [
    { label: "Piece", sub: "(item, plate)" },
    { label: "Kg", sub: "" },
    { label: "Gram", sub: "" },
    { label: "Liter", sub: "" },
    { label: "Packet", sub: "" },
    { label: "Box", sub: "" },
  ];

  const toggleUnit = (unit) => {
    if (selectedUnits.includes(unit)) {
      onUpdate(selectedUnits.filter(u => u !== unit));
    } else {
      onUpdate([...selectedUnits, unit]);
    }
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="header">
        <h2>Which units do you use?</h2>
        <p>We’ll show only these while making bills</p>
      </div>

      <div className="grid-2-col">
        {options.map((opt) => (
          <div 
            key={opt.label}
            className={`selection-card ${selectedUnits.includes(opt.label) ? 'selected' : ''}`}
            onClick={() => toggleUnit(opt.label)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <div 
              style={{
                width: '20px', height: '20px', 
                borderRadius: '4px', 
                border: '2px solid #ccc',
                background: selectedUnits.includes(opt.label) ? '#4CAF50' : 'transparent'
              }} 
            />
            <div style={{ textAlign: 'left' }}>
              <span className="card-label">{opt.label}</span>
              {opt.sub && <div style={{ fontSize: '11px', color: '#999' }}>{opt.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      <button 
        className="primary-btn" 
        onClick={onNext}
        disabled={selectedUnits.length === 0}
      >
        Next
      </button>
    </div>
  );
};

export default ScreenUnits;