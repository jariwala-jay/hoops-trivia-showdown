'use client';

import { Match, Question } from '@/types';
import Navbar from '@/components/Navbar';
import ShotClock from '@/components/ShotClock';
import AnimatedButton from '@/components/AnimatedButton';
import { truncateName } from '@/lib/utils';



interface GameInProgressProps {
  match: Match;
  currentQuestion: Question;
  timeLeft: number;
  hasAnswered: boolean;
  onAnswerSelect: (answerIndex: number) => void;
  selectedAnswer: number | null;
  showFeedback: boolean;
  waitingForOpponent: boolean;
  onTimeUp: () => void;
}

export default function GameInProgress({
  match,
  currentQuestion,
  timeLeft,
  hasAnswered,
  onAnswerSelect,
  selectedAnswer,
  showFeedback,
  waitingForOpponent,
  onTimeUp,
}: GameInProgressProps) {

  return (
    <>
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ 
        maxWidth: '80rem', 
        margin: '0 auto', 
        marginTop: '2rem',
        padding: '1rem',
        paddingTop: '5rem' // Reduced padding to prevent overlap
      }}>
        {/* Game Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          marginBottom: '1.5rem',
          gap: '1rem'
        }}>
          {/* Player A Score */}
          <div style={{ textAlign: 'center', minWidth: '120px' }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 700,
              color: '#F8F9FA',
              marginBottom: '0.5rem'
            }}>
              {truncateName(match.playerA.name)}
            </h3>
            <div style={{
              fontSize: '2rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 700,
              color: '#FF6E00'
            }}>
              {match.scoreA}
            </div>
          </div>
          
          {/* Shot Clock Timer */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#D1D5DB',
              marginBottom: '0.5rem'
            }}>
              Question {(match.currentQuestionIndex || 0) + 1} of {match.questions.length}
            </div>
            <ShotClock 
              duration={24}
              timeLeft={timeLeft}
              onTimeUp={onTimeUp}
              isActive={!hasAnswered}
              size="lg"
            />
            <div style={{
              fontSize: '0.875rem',
              color: '#D1D5DB',
              marginTop: '0.5rem'
            }}>
              seconds
            </div>
          </div>
          
          {/* Player B Score */}
          <div style={{ textAlign: 'right', minWidth: '120px' }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 700,
              color: '#F8F9FA',
              marginBottom: '0.5rem'
            }}>
              {truncateName(match.playerB?.name)}
            </h3>
            <div style={{
              fontSize: '2rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 700,
              color: '#00C176'
            }}>
              {match.scoreB}
            </div>
          </div>
        </div>

        {/* Waiting for opponent indicator */}
        {waitingForOpponent && (
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="card" style={{
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem' 
              }}>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                <span style={{ color: '#FDE68A' }}>Waiting for opponent&apos;s answer...</span>
              </div>
            </div>
          </div>
        )}

        {/* Question */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
            fontWeight: 700,
            color: '#F8F9FA',
            marginBottom: '1.5rem',
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            {currentQuestion.question}
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: '1rem',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              
              // Enhanced feedback logic
              let feedbackState: 'neutral' | 'correct' | 'incorrect' = 'neutral';
              let variant: 'primary' | 'secondary' | 'success' | 'error' = isSelected ? 'primary' : 'secondary';
              
              if (showFeedback) {
                if (isSelected && isCorrect) {
                  feedbackState = 'correct';
                  variant = 'success';
                } else if (isSelected && !isCorrect) {
                  feedbackState = 'incorrect';
                  variant = 'error';
                } else if (!isSelected && isCorrect) {
                  // Show correct answer when user selected wrong
                  feedbackState = 'correct';
                  variant = 'success';
                }
              }
              
              return (
                <AnimatedButton
                  key={index}
                  onClick={() => onAnswerSelect(index)}
                  disabled={hasAnswered}
                  variant={variant}
                  feedbackState={feedbackState}
                  className={`text-left ${hasAnswered && !isSelected && !isCorrect ? 'opacity-50' : ''}`}
                >
                  <span style={{ 
                    fontWeight: 700, 
                    marginRight: '0.5rem',
                    color: (isSelected || (showFeedback && isCorrect)) ? '#F8F9FA' : '#FF6E00'
                  }}>
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span style={{
                    color: '#F8F9FA'
                  }}>
                    {option}
                  </span>
                </AnimatedButton>
              );
            })}
          </div>
          
          {hasAnswered && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ 
                color: '#10B981', 
                fontWeight: 700,
                fontSize: '1.125rem'
              }}>
                ✓ Answer submitted!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
} 