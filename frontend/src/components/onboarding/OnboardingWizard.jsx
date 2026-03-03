import React, { useState } from 'react';
import ProgressBar from './ProgressBar';
import ScreenShopType from './ScreenShopType';
import ScreenBillingStyle from './ScreenBillingStyle';
import ScreenUnits from './ScreenUnits';
import ScreenPriceBehavior from './ScreenPriceBehavior';
import ScreenSuccess from './ScreenSuccess';
import './Onboarding.css';

const OnboardingWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    shopType: '',
    billingStyle: '',
    units: [],
    priceBehavior: ''
  });

  // Handle data updates
  const updateData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Navigation Logic
  const nextStep = () => setStep(prev => prev + 1);
  
  // Skip Logic: Sets defaults and finishes
  const handleSkip = () => {
    const defaultData = {
      shopType: 'General Store',
      billingStyle: 'Both',
      units: ['Piece', 'Kg'],
      priceBehavior: 'Sometimes fixed'
    };
    onComplete(defaultData); // Save defaults
  };

  const renderStep = () => {
    switch(step) {
      case 1: return <ScreenShopType 
                        selected={formData.shopType} 
                        onSelect={(val) => { updateData('shopType', val); nextStep(); }} 
                     />;
      case 2: return <ScreenBillingStyle 
                        selected={formData.billingStyle} 
                        onSelect={(val) => { updateData('billingStyle', val); nextStep(); }} 
                     />;
      case 3: return <ScreenUnits 
                        selectedUnits={formData.units} 
                        onUpdate={(val) => updateData('units', val)}
                        onNext={nextStep}
                     />;
      case 4: return <ScreenPriceBehavior 
                        selected={formData.priceBehavior} 
                        onSelect={(val) => { updateData('priceBehavior', val); nextStep(); }} 
                     />;
      case 5: return <ScreenSuccess onFinish={() => onComplete(formData)} />;
      default: return null;
    }
  };

  return (
    <div className="onboarding-container">
      {step < 5 && (
        <div className="top-bar">
          <ProgressBar currentStep={step} totalSteps={4} />
          <button className="skip-btn" onClick={handleSkip}>Skip</button>
        </div>
      )}
      {renderStep()}
    </div>
  );
};

export default OnboardingWizard;