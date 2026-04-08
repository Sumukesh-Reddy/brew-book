import React, { useState, useEffect } from 'react';
import './LoadingAnimation.css';

const LoadingAnimation = ({ 
  show = true, 
  text = "Loading...", 
  size = "medium",
  fullScreen = false 
}) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Small delay to ensure animation starts properly
    setTimeout(() => {
      setLoaded(true);
    }, 100);
  }, []);

  if (!show) return null;

  // Size mappings
  const sizeMap = {
    small: { cupSize: 60, steamHeight: 25 },
    medium: { cupSize: 100, steamHeight: 40 },
    large: { cupSize: 140, steamHeight: 60 }
  };

  const { cupSize, steamHeight } = sizeMap[size] || sizeMap.medium;

  return (
    <div className={`loading-animation ${fullScreen ? 'full-screen' : ''}`}>
      <div className="animation-content">
        {/* Coffee Cup Animation */}
        <div className="coffee-cup" style={{ width: `${cupSize}px`, height: `${cupSize * 0.9}px` }}>
          <div className="cup" style={{ 
            width: `${cupSize * 0.8}px`, 
            height: `${cupSize * 0.7}px`,
            left: `${cupSize * 0.08}px`
          }}></div>
          <div className="handle" style={{
            width: `${cupSize * 0.25}px`,
            height: `${cupSize * 0.5}px`,
            borderWidth: `${cupSize * 0.12}px`,
            right: `-${cupSize * 0.12}px`,
            top: `${cupSize * 0.15}px`
          }}></div>
          
          {/* Steam */}
          <div className="steam steam1" style={{ 
            width: `${cupSize * 0.07}px`,
            height: `${steamHeight}px`,
            left: `${cupSize * 0.2}px`,
            bottom: `${cupSize * 0.7}px`
          }}></div>
          <div className="steam steam2" style={{ 
            width: `${cupSize * 0.07}px`,
            height: `${steamHeight}px`,
            left: `${cupSize * 0.4}px`,
            bottom: `${cupSize * 0.7}px`
          }}></div>
          <div className="steam steam3" style={{ 
            width: `${cupSize * 0.07}px`,
            height: `${steamHeight}px`,
            left: `${cupSize * 0.6}px`,
            bottom: `${cupSize * 0.7}px`
          }}></div>
        </div>

        {/* Loading Text */}
        <div className="loading-text">
          <div className="text-animation">
            {text.split('').map((letter, index) => (
              <span 
                key={index} 
                className={`letter ${loaded ? 'loaded' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>

        {/* Optional: Loading dots */}
        <div className="loading-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;