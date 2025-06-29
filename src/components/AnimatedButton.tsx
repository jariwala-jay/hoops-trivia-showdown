'use client';

import { useState, useEffect } from 'react';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'success' | 'error' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  feedbackState?: 'correct' | 'incorrect' | 'neutral';
  className?: string;
}

export default function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  feedbackState = 'neutral',
  className = ''
}: AnimatedButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation when feedback state changes
  useEffect(() => {
    if (feedbackState !== 'neutral') {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [feedbackState]);

  const baseClasses = 'btn transition-all duration-200 transform font-semibold';
  
  const variantClasses = {
    primary: 'btn-primary',
    success: 'btn-success',
    error: 'btn-error',
    secondary: 'btn-secondary'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const feedbackClasses = {
    correct: 'animate-pulse-success bg-success hover:bg-green-600',
    incorrect: 'animate-shake bg-error hover:bg-red-600',
    neutral: ''
  };

  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed transform-none hover:scale-100' 
    : 'hover:scale-105 active:scale-95';

  const animationClasses = isAnimating ? feedbackClasses[feedbackState] : '';

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${animationClasses}
        ${className}
      `.trim()}
    >
      {children}
    </button>
  );
} 