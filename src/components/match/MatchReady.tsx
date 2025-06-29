'use client';

import { Match } from '@/types';
import Navbar from '@/components/Navbar';
import { truncateName } from '@/lib/utils';
import Image from 'next/image';

interface MatchReadyProps {
  match: Match;
  onStartGame: () => void;
}

export default function MatchReady({ match, onStartGame }: MatchReadyProps) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ 
        maxWidth: '64rem', 
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
          🏀 Match Ready!
        </h1>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div className="card">
            <h2 style={{
              fontSize: '1.5rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 700,
              color: '#F8F9FA',
              marginBottom: '1rem'
            }}>
              {truncateName(match.playerA.name)}
            </h2>
            <div style={{
              width: '8rem',
              height: '10rem',
              margin: '0 auto 1rem auto',
              borderRadius: '0.5rem',
              overflow: 'hidden'
            }}>
              <Image
                src={match.nftA.image}
                alt={match.nftA.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                width={100}
                height={100}
              />
            </div>
            <p style={{ color: '#D1D5DB' }}>{match.nftA.name}</p>
          </div>

          {match.playerB && (
            <div className="card">
              <h2 style={{
                fontSize: '1.5rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 700,
                color: '#F8F9FA',
                marginBottom: '1rem'
              }}>
                {truncateName(match.playerB.name)}
              </h2>
              <div style={{
                width: '8rem',
                height: '10rem',
                margin: '0 auto 1rem auto',
                borderRadius: '0.5rem',
                overflow: 'hidden'
              }}>
                <Image
                  src={match.nftB!.image}
                  alt={match.nftB!.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  width={100}
                  height={100}
                />
              </div>
              <p style={{ color: '#D1D5DB' }}>{match.nftB!.name}</p>
            </div>
          )}
        </div>

        <button
          onClick={onStartGame}
          className="btn btn-primary"
          style={{ fontSize: '1.25rem', padding: '1rem 2rem' }}
        >
          Start Game!
        </button>
      </div>
    </div>
  );
} 