'use client';

import { useEffect, useState } from 'react';

interface ScoreDisplayProps {
  playerName: string;
  score: number;
  isCurrentPlayer?: boolean;
  className?: string;
}

export default function ScoreDisplay({ 
  playerName, 
  score, 
  isCurrentPlayer = false,
  className = '' 
}: ScoreDisplayProps) {
  const [displayScore, setDisplayScore] = useState(score);
  const [isFlashing, setIsFlashing] = useState(false);
  const [previousScore, setPreviousScore] = useState(score);

  // Animate score changes
  useEffect(() => {
    if (score !== previousScore) {
      setIsFlashing(true);
      
      // Count up animation
      const difference = score - previousScore;
      const steps = Math.min(Math.abs(difference), 10);
      const stepValue = difference / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const newScore = previousScore + (stepValue * currentStep);
        setDisplayScore(Math.round(newScore));

        if (currentStep >= steps) {
          setDisplayScore(score);
          clearInterval(interval);
          
          // Stop flashing after animation
          setTimeout(() => setIsFlashing(false), 300);
        }
      }, 50);

      setPreviousScore(score);

      return () => clearInterval(interval);
    }
  }, [score, previousScore]);

  return (
    <div className={`card ${isCurrentPlayer ? 'card-highlight' : ''} ${className}`}>
      <div className="flex items-center justify-between">
        {/* Player Info */}
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isCurrentPlayer ? 'bg-accent' : 'bg-gray-500'}`}></div>
          <div>
            <div className="font-heading font-semibold text-text-light">
              {playerName}
            </div>
            {isCurrentPlayer && (
              <div className="text-xs text-accent font-medium">
                Your Turn
              </div>
            )}
          </div>
        </div>

        {/* Score */}
        <div className={`text-right ${isFlashing ? 'animate-score-flash' : ''}`}>
          <div className="font-heading font-bold text-2xl text-text-light">
            {displayScore}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Points
          </div>
        </div>
      </div>

      {/* Score Increase Indicator */}
      {isFlashing && score > previousScore && (
        <div className="absolute -top-2 -right-2 bg-success text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
          +{score - previousScore}
        </div>
      )}
    </div>
  );
} 