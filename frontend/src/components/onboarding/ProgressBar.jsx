
import React from 'react';

const ProgressBar = ({ currentStep, totalSteps }) => {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {[...Array(totalSteps)].map((_, index) => (
        <div 
          key={index}
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: index + 1 <= currentStep ? '#4CAF50' : '#E0E0E0',
            transition: 'background-color 0.3s ease'
          }}
        />
      ))}
    </div>
  );
};

export default ProgressBar;