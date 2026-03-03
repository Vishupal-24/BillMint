import React from 'react';

const ScreenSuccess = ({ onFinish }) => {
  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      
      <div style={{ marginBottom: '40px' }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</div>
        <h2 style={{ color: '#2E3A2F', marginBottom: '10px' }}>You’re all set!</h2>
        <p style={{ color: '#666' }}>Let’s create your first bill.</p>
      </div>

      <button className="primary-btn" onClick={onFinish}>
        Create Bill
      </button>
    </div>
  );
};

export default ScreenSuccess;