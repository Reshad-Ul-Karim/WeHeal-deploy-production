import React, { useState, useEffect } from 'react';
import { getRandomHealthTip } from '../data/healthTips';
import './HealthTips.css';

const HealthTips = ({ collapsed = false }) => {
  const [currentTip, setCurrentTip] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  // Function to change tip with animation
  const changeTip = () => {
    setIsChanging(true);
    setTimeout(() => {
      setCurrentTip(getRandomHealthTip());
      setIsChanging(false);
    }, 250);
  };

  // Get a new random tip every 15 seconds
  useEffect(() => {
    const updateTip = () => {
      changeTip();
    };

    // Set initial tip
    if (!currentTip) {
      setCurrentTip(getRandomHealthTip());
    }

    // Update tip every 15 seconds
    const interval = setInterval(updateTip, 15000);

    return () => clearInterval(interval);
  }, [currentTip]);

  // Don't render if sidebar is collapsed
  if (collapsed || !currentTip) {
    return null;
  }

  return (
    <div className={`health-tips-widget ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="health-tips-header">
        <div className="tips-icon">
          💡
        </div>
        <h4>Health Tip</h4>
        <button 
          className="close-tip-btn"
          onClick={() => setIsVisible(false)}
          title="Hide tip"
        >
          ×
        </button>
      </div>
      
      <div className={`tip-content ${isChanging ? 'changing' : ''}`}>
        <div className="tip-category">
          <span className="category-icon">{currentTip.icon}</span>
          <span className="category-text">{currentTip.category}</span>
        </div>
        
        <h5 className="tip-title">{currentTip.title}</h5>
        <p className="tip-description">{currentTip.tip}</p>
      </div>

      <div className="tip-footer">
        <button 
          className="new-tip-btn"
          onClick={changeTip}
          title="Get new tip"
          disabled={isChanging}
        >
          🔄 New Tip
        </button>
      </div>
    </div>
  );
};

export default HealthTips;
