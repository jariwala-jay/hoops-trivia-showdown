'use client';

import Link from 'next/link';
import toast from 'react-hot-toast';
import { Match } from '@/types';
import Navbar from '@/components/Navbar';

interface MatchLobbyProps {
  match: Match;
}

export default function MatchLobby({ match }: MatchLobbyProps) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ 
        maxWidth: '56rem', 
        margin: '0 auto', 
        padding: '2rem 1rem',
        paddingTop: '6rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
          fontWeight: 700,
          color: '#F8F9FA',
          marginBottom: '2rem'
        }}>
          ⏳ Waiting for Opponent...
        </h1>
        
        <div className="card" style={{ marginBottom: '2rem' }}>
          <p style={{
            color: '#F8F9FA',
            fontSize: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            Share this Match ID with your opponent:
          </p>
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '0.5rem',
            padding: '1rem',
            fontFamily: 'monospace',
            color: '#F8F9FA',
            fontSize: '1.125rem',
            wordBreak: 'break-all',
            marginBottom: '1rem'
          }}>
            {match.id}
          </div>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(match.id);
                toast.success('Match ID copied to clipboard!');
              }}
              className="btn btn-primary"
            >
              📋 Copy Match ID
            </button>
            <button
              onClick={() => {
                const shareUrl = `${window.location.origin}/join?id=${match.id}`;
                navigator.clipboard.writeText(shareUrl);
                toast.success('Share link copied to clipboard!');
              }}
              className="btn btn-secondary"
            >
              🔗 Share Link
            </button>
          </div>
        </div>

        <div className="animate-pulse">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{
            color: '#F8F9FA',
            fontSize: '1.25rem',
            marginBottom: '1rem'
          }}>
            Waiting for player to join the arena...
          </p>
          <div style={{ 
            marginTop: '1rem', 
            display: 'flex', 
            justifyContent: 'center',
            gap: '0.25rem'
          }}>
            <div className="animate-bounce" style={{ color: '#FF6E00' }}>●</div>
            <div className="animate-bounce" style={{ color: '#FF6E00', animationDelay: '0.1s' }}>●</div>
            <div className="animate-bounce" style={{ color: '#FF6E00', animationDelay: '0.2s' }}>●</div>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <Link 
            href="/" 
            style={{
              color: '#F8F9FA',
              textDecoration: 'none',
              opacity: 0.8,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 