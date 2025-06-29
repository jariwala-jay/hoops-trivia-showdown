'use client';

import { Match } from '@/types';
import Navbar from '@/components/Navbar';
import { truncateName } from '@/lib/utils';
import Image from 'next/image';

interface MatchReadyProps {
  match: Match;
  currentUserId: string | null;
  onStartGame: () => void;
}

export default function MatchReady({ match, currentUserId, onStartGame }: MatchReadyProps) {
  const isPlayerB = currentUserId === match.playerB?.id;

  const playerA = isPlayerB ? match.playerB : match.playerA;
  const playerB = isPlayerB ? match.playerA : match.playerB;
  const nftA = isPlayerB ? match.nftB : match.nftA;
  const nftB = isPlayerB ? match.nftA : match.nftB;

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
         
           Match Ready!
        </h1>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {nftA && (
            <div className="card">
              <h2 style={{
                fontSize: '1.5rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 700,
                color: '#F8F9FA',
                marginBottom: '1rem'
              }}>
                {truncateName(playerA?.name)}
              </h2>
              <div style={{
                width: '8rem',
                height: '10rem',
                margin: '0 auto 1rem auto',
                borderRadius: '0.5rem',
                overflow: 'hidden'
              }}>
                <Image
                  src={nftA.image}
                  alt={nftA.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  width={100}
                  height={100}
                />
              </div>
              <p style={{ color: '#D1D5DB' }}>{nftA.name}</p>
            </div>
          )}

          {playerB && nftB && (
            <div className="card">
              <h2 style={{
                fontSize: '1.5rem',
                fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                fontWeight: 700,
                color: '#F8F9FA',
                marginBottom: '1rem'
              }}>
                {truncateName(playerB.name)}
              </h2>
              <div style={{
                width: '8rem',
                height: '10rem',
                margin: '0 auto 1rem auto',
                borderRadius: '0.5rem',
                overflow: 'hidden'
              }}>
                <Image
                  src={nftB.image}
                  alt={nftB.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  width={100}
                  height={100}
                />
              </div>
              <p style={{ color: '#D1D5DB' }}>{nftB.name}</p>
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