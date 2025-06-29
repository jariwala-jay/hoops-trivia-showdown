'use client';

import { useRef, useEffect } from 'react';
import AnimatedButton from './AnimatedButton';
import ProtectedLink from './ProtectedLink';
import Image from 'next/image';
export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      // Ensure video plays automatically and loops
      videoRef.current.play().catch(console.error);
    }
  }, []);

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      paddingTop: '4rem' // Account for navbar
    }}>
      {/* Background Gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(26, 35, 50, 0.95) 0%, rgba(45, 55, 72, 0.9) 50%, rgba(26, 35, 50, 0.95) 100%)',
        zIndex: 1
      }} />

      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '0 1rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '4rem',
        alignItems: 'center'
      }}>
        {/* Hero Content */}
        <div style={{
          textAlign: 'left',
          maxWidth: '36rem'
        }}>
          <div style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(255, 110, 0, 0.1)',
            borderRadius: '2rem',
            border: '1px solid rgba(255, 110, 0, 0.3)',
            marginBottom: '1.5rem'
          }}>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#FF6E00',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              NBA TopShot Trivia
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
            fontWeight: 800,
            color: '#F8F9FA',
            lineHeight: '1.1',
            marginBottom: '1.5rem',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>
            HOOPS TRIVIA
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #FF6E00, #E63946)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              SHOWDOWN
            </span>
          </h1>

          <p style={{
            fontSize: '1.25rem',
            color: '#D1D5DB',
            lineHeight: '1.6',
            marginBottom: '2rem',
            opacity: 0.9
          }}>
            Stake your NBA TOPSHOT NFTs and battle in the ultimate basketball trivia competition! 
            Test your knowledge, win rewards, and claim victory on the court.
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <ProtectedLink href="/automatch" style={{ textDecoration: 'none' }}>
              <AnimatedButton variant="primary" size="lg">
                Quick Match
              </AnimatedButton>
            </ProtectedLink>
            
            <ProtectedLink href="/create" style={{ textDecoration: 'none' }}>
              <AnimatedButton variant="secondary" size="lg">
                Create Match
              </AnimatedButton>
            </ProtectedLink>
          </div>

          {/* Value Proposition Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>

          </div>
        </div>

        {/* Video Player */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '40rem',
          margin: '0 auto'
        }}>
          <div style={{
            position: 'relative',
            borderRadius: '1.5rem',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            border: '2px solid rgba(255, 110, 0, 0.3)'
          }}>
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                aspectRatio: '16/9'
              }}
            >
              <source src="/hero_video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {/* Video Overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(45deg, rgba(255, 110, 0, 0.1) 0%, rgba(230, 57, 70, 0.1) 100%)',
              pointerEvents: 'none'
            }} />
          </div>

          {/* Floating Elements */}
          <div style={{
            position: 'absolute',
            top: '-1rem',
            right: '-1rem',
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: '0 8px 16px rgba(255, 110, 0, 0.3)',
            animation: 'float 3s ease-in-out infinite'
          }}>
            <Image src="/fire_basketball.png" alt="Quick Match" width={70} height={70} />
          </div>

          <div style={{
            position: 'absolute',
            bottom: '-0.5rem',
            left: '-0.5rem',
            width: '3rem',
            height: '3rem',
            backgroundColor: 'rgba(255, 110, 0, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(255, 110, 0, 0.4)',
            animation: 'float 3s ease-in-out infinite reverse',
            overflow: 'hidden'
          }}>
            <Image 
              src="/basketball.png" 
              alt="Basketball Player" 
              width={50} 
              height={50}
              style={{
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))'
              }}
            />
          </div>
        </div>
      </div>

      {/* Floating Animation Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
} 