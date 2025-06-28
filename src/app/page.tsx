import Link from 'next/link';
import AuthButton from '@/components/AuthButton';
import Navbar from '@/components/Navbar';
import Container from '@/components/Container';
import Card from '@/components/Card';

export default function Home() {
  return (
    <>
      <Navbar authButton={<AuthButton />} />
      <div style={{ 
        minHeight: '100vh',
        paddingTop: '4rem' // Account for fixed navbar
      }}>
        <Container size="xl">
          {/* Header */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '3rem',
            paddingTop: '2rem'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              {/* <AuthButton /> */}
            </div>
            <h1 style={{
              fontSize: '4rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 700,
              color: '#F8F9FA',
              marginBottom: '1rem',
              textShadow: '0 4px 8px rgba(0,0,0,0.3)',
              lineHeight: '1.1'
            }}>
              🏀 HOOPS TRIVIA SHOWDOWN
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: '#F8F9FA',
              marginBottom: '2rem',
              maxWidth: '42rem',
              margin: '0 auto 2rem auto',
              opacity: 0.9
            }}>
              Stake your NBA NFTs and battle in the ultimate basketball trivia 
              competition! Test your knowledge, win rewards, and claim victory on 
              the court.
            </p>
          </div>

          {/* Game Modes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            maxWidth: '72rem',
            margin: '0 auto 3rem auto'
          }}>
            {/* Quick Match */}
            <Link href="/automatch" style={{ textDecoration: 'none' }}>
              <Card className="text-center hover:scale-105 transition-transform duration-300">
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚡</div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 700,
                  color: '#F8F9FA',
                  marginBottom: '0.75rem'
                }}>
                  QUICK MATCH
                </h2>
                <p style={{
                  color: '#D1D5DB',
                  marginBottom: '1.5rem',
                  lineHeight: '1.5'
                }}>
                  Get matched automatically with opponents of the same NFT rarity
                </p>
                <div className="btn btn-primary" style={{
                  display: 'inline-block',
                  textDecoration: 'none'
                }}>
                  FIND MATCH
                </div>
              </Card>
            </Link>

            {/* Create Match */}
            <Link href="/create" style={{ textDecoration: 'none' }}>
              <Card className="text-center hover:scale-105 transition-transform duration-300">
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 700,
                  color: '#F8F9FA',
                  marginBottom: '0.75rem'
                }}>
                  CREATE MATCH
                </h2>
                <p style={{
                  color: '#D1D5DB',
                  marginBottom: '1.5rem',
                  lineHeight: '1.5'
                }}>
                  Start a new trivia battle and wait for an opponent to challenge you
                </p>
                <div className="btn btn-primary" style={{
                  display: 'inline-block',
                  textDecoration: 'none'
                }}>
                  CREATE GAME
                </div>
              </Card>
            </Link>

            {/* Join Match */}
            <Link href="/join" style={{ textDecoration: 'none' }}>
              <Card className="text-center hover:scale-105 transition-transform duration-300">
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔗</div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 700,
                  color: '#F8F9FA',
                  marginBottom: '0.75rem'
                }}>
                  JOIN MATCH
                </h2>
                <p style={{
                  color: '#D1D5DB',
                  marginBottom: '1.5rem',
                  lineHeight: '1.5'
                }}>
                  Enter a match ID and join an existing trivia battle
                </p>
                <div className="btn btn-primary" style={{
                  display: 'inline-block',
                  textDecoration: 'none'
                }}>
                  JOIN BATTLE
                </div>
              </Card>
            </Link>
          </div>

          {/* How to Play */}
          <div style={{ 
            maxWidth: '64rem', 
            margin: '0 auto 3rem auto',
            textAlign: 'center'
          }}>
            <Card>
            <h2 style={{
              fontSize: '2rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 700,
              color: '#F8F9FA',
              marginBottom: '2rem'
            }}>
              How to Play
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem'
            }}>
              <div style={{ color: '#F8F9FA' }}>
                <div style={{ 
                  fontSize: '3rem', 
                  marginBottom: '0.75rem',
                  background: 'linear-gradient(135deg, #FF6E00, #E63946)',
                  borderRadius: '50%',
                  width: '4rem',
                  height: '4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem auto'
                }}>
                  1
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 600,
                  marginBottom: '0.5rem'
                }}>
                  Select Your NFT
                </h3>
                <p style={{ color: '#D1D5DB' }}>
                  Choose your NBA NFT to stake in the match
                </p>
              </div>
              <div style={{ color: '#F8F9FA' }}>
                <div style={{ 
                  fontSize: '3rem', 
                  marginBottom: '0.75rem',
                  background: 'linear-gradient(135deg, #FF6E00, #E63946)',
                  borderRadius: '50%',
                  width: '4rem',
                  height: '4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem auto'
                }}>
                  2
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 600,
                  marginBottom: '0.5rem'
                }}>
                  Answer Questions
                </h3>
                <p style={{ color: '#D1D5DB' }}>
                  Beat the 24-second shot clock on NBA trivia
                </p>
              </div>
              <div style={{ color: '#F8F9FA' }}>
                <div style={{ 
                  fontSize: '3rem', 
                  marginBottom: '0.75rem',
                  background: 'linear-gradient(135deg, #FF6E00, #E63946)',
                  borderRadius: '50%',
                  width: '4rem',
                  height: '4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem auto'
                }}>
                  3
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 600,
                  marginBottom: '0.5rem'
                }}>
                  Win & Claim
                </h3>
                <p style={{ color: '#D1D5DB' }}>
                  Highest score wins both NFTs!
                </p>
              </div>
            </div>
            </Card>
          </div>

          {/* Footer */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '3rem',
            color: '#D1D5DB',
            opacity: 0.8
          }}>
            <p>Built with Next.js • Powered by Dapper Labs</p>
          </div>
        </Container>
      </div>
    </>
  );
}
