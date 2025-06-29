'use client';

import { useEffect, useState } from 'react';
import { useSound } from '@/hooks/useSound';

interface ShotClockProps {
  duration: number; // in seconds
  timeLeft?: number; // external time control
  onTimeUp?: () => void;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ShotClock({ 
  duration, 
  timeLeft: externalTimeLeft,
  onTimeUp, 
  isActive = true,
  size = 'md' 
}: ShotClockProps) {
  const [internalTimeLeft, setInternalTimeLeft] = useState(duration);
  const [isWarning, setIsWarning] = useState(false);
  const [hasPlayedWarningSound, setHasPlayedWarningSound] = useState(false);
  
  // Sound effects
  const beepSound = useSound('/sfx/beep.mp3');
  
  // Use external time if provided, otherwise use internal
  const timeLeft = externalTimeLeft !== undefined ? externalTimeLeft : internalTimeLeft;

  const strokeWidth = size === 'lg' ? '4' : size === 'md' ? '3' : '2';
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = ((duration - timeLeft) / duration) * circumference;

  // Only run internal timer if no external timeLeft is provided
  useEffect(() => {
    if (!isActive || externalTimeLeft !== undefined) return;

    const interval = setInterval(() => {
      setInternalTimeLeft(prev => {
        const newTime = prev - 0.1;
        
        // Time's up
        if (newTime <= 0) {
          onTimeUp?.();
          return 0;
        }
        
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, onTimeUp, externalTimeLeft]);

  // Reset when duration changes
  useEffect(() => {
    setInternalTimeLeft(duration);
    setIsWarning(false);
    setHasPlayedWarningSound(false);
  }, [duration]);

  // Handle warning state and sound effects
  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0) {
      setIsWarning(true);
      
      // Play beep sound for last 5 seconds (but only once per second)
      const currentSecond = Math.ceil(timeLeft);
      if (currentSecond <= 5 && !hasPlayedWarningSound) {
        beepSound.play();
        setHasPlayedWarningSound(true);
        setTimeout(() => setHasPlayedWarningSound(false), 1000); // Reset for next beep
      }
    } else {
      setIsWarning(false);
    }
  }, [timeLeft, beepSound, hasPlayedWarningSound]);

  const displayTime = Math.ceil(timeLeft);
  const strokeColor = isWarning ? '#E63946' : '#FF6E00';

  return (
    <div style={{ 
      position: 'relative',
      width: size === 'lg' ? '8rem' : size === 'md' ? '6rem' : '4rem',
      height: size === 'lg' ? '8rem' : size === 'md' ? '6rem' : '4rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Background Circle */}
      <svg 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          transform: 'rotate(-90deg)',
          width: '100%',
          height: '100%'
        }}
      >
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{
            transition: 'all 0.1s ease',
            filter: isWarning ? 'drop-shadow(0 0 8px #E63946)' : 'none'
          }}
        />
      </svg>
      
      {/* Time Display */}
      <div style={{
        fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
        fontWeight: 700,
        fontSize: size === 'lg' ? '1.5rem' : size === 'md' ? '1.125rem' : '1rem',
        color: '#F8F9FA',
        zIndex: 10,
        animation: isWarning ? 'pulse 1s infinite' : 'none'
      }}>
        {displayTime}
      </div>

      {/* Warning Glow Effect */}
      {isWarning && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          backgroundColor: 'rgba(230, 57, 70, 0.2)',
          animation: 'pulse 1s infinite'
        }}></div>
      )}
    </div>
  );
} 