// components/LogoIntro.tsx
import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, Variants } from 'framer-motion';
import { useSound } from '@/hooks/useSound';

const logoVariants: Variants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
      duration: 0.6
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.3 }
  }
};

interface LogoIntroProps {
  onComplete: () => void;
  playSound?: boolean;
}

export function LogoIntro({ onComplete, playSound = false }: LogoIntroProps) {
  const controls = useAnimation();
  const { play: playSwish } = useSound('/sfx/swish.mp3', { debounceMs: 0 }); // No debouncing for intro
  const hasStartedRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const [isMounted, setIsMounted] = useState(false);

  // Update the callback ref when it changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    // Prevent multiple executions
    if (hasStartedRef.current || hasCompletedRef.current || !isMounted) {
      console.log('LogoIntro: Already started, completed, or not mounted, skipping');
      return;
    }

    hasStartedRef.current = true;

    async function sequence() {
      try {
        console.log('LogoIntro sequence starting, playSound:', playSound);
        
        // Small delay to ensure audio context is ready
        await new Promise(r => setTimeout(r, 100));
        
        // Play sound if enabled
        if (playSound) {
          console.log('Attempting to play intro swish sound');
          try {
            await playSwish();
            console.log('Intro swish sound played successfully');
          } catch (error) {
            console.warn('Could not play intro sound:', error);
          }
        }
        
        // Ensure component is still mounted before starting animation
        if (!isMounted) return;
        
        // Start the animation
        await controls.start('visible');
        
        // Hold for a moment
        await new Promise((r) => setTimeout(r, 1000));
        
        // Ensure component is still mounted before exit animation
        if (!isMounted) return;
        
        // Exit animation
        await controls.start('exit');
        
        // Mark as completed and call the callback
        if (!hasCompletedRef.current && isMounted) {
          hasCompletedRef.current = true;
          onCompleteRef.current();
          console.log('LogoIntro sequence completed');
        }
      } catch (error) {
        console.error('LogoIntro animation error:', error);
        // Still complete even if there's an error
        if (!hasCompletedRef.current && isMounted) {
          hasCompletedRef.current = true;
          onCompleteRef.current();
        }
      }
    }
    
    sequence();
  }, [isMounted]); // Only depend on isMounted

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #1a2332 0%, #2d3748 50%, #1a2332 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <motion.img
        src="/logo.png"
        alt="Hoops Trivia Showdown"
        variants={logoVariants}
        initial="hidden"
        animate={controls}
        style={{
          width: 550,
          height: 'auto',
          filter: 'drop-shadow(0 0 20px rgba(255, 110, 0, 0.5))'
        }}
      />
    </div>
  );
}
