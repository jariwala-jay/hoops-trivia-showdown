'use client';

import Link from 'next/link';
import ClientAuthButton from '@/components/ClientAuthButton';
import Navbar from '@/components/Navbar';
import Container from '@/components/Container';
import Card from '@/components/Card';
import Hero from '@/components/Hero';
import ProtectedLink from '@/components/ProtectedLink';
import Image from 'next/image';

export default function Home() {
  return (
    <>
      <Navbar authButton={<ClientAuthButton />} />
      
      {/* Hero Section */}
      <Hero />

      {/* Game Modes Section */}
      <div style={{ 
        paddingTop: '4rem',
        paddingBottom: '4rem',
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
      }}>
        <Container size="xl">
          <div style={{
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 700,
              color: '#F8F9FA',
              marginBottom: '1rem'
            }}>
              Choose Your Battle Mode
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#D1D5DB',
              maxWidth: '48rem',
              margin: '0 auto',
              opacity: 0.9
            }}>
              Three ways to compete in the ultimate NBA trivia showdown
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            maxWidth: '72rem',
            margin: '0 auto'
          }}>
            {/* Quick Match */}
            <ProtectedLink href="/automatch" style={{ textDecoration: 'none' }}>
              <Card className="text-center hover:scale-105 transition-transform duration-300 h-full">
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem auto',
                  fontSize: '1.5rem'
                }}>
                  <Image src="/quick_match.png" alt="Quick Match" width={50} height={50} />
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 700,
                  color: '#F8F9FA',
                  marginBottom: '0.75rem'
                }}>
                  Quick Match
                </h3>
                <p style={{
                  color: '#D1D5DB',
                  marginBottom: '1.5rem',
                  lineHeight: '1.5'
                }}>
                  Get matched automatically with opponents of the same NFT rarity. 
                  Fast, fair, and instant competition.
                </p>
                <div className="btn btn-primary" style={{
                  display: 'inline-block',
                  textDecoration: 'none'
                }}>
                  Find Match
                </div>
              </Card>
            </ProtectedLink>

            {/* Create Match */}
            <ProtectedLink href="/create" style={{ textDecoration: 'none' }}>
              <Card className="text-center hover:scale-105 transition-transform duration-300 h-full">
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem auto',
                  fontSize: '1.5rem'
                }}>
                  <Image src="/create_match.png" alt="Create Match" width={50} height={50} />
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 700,
                  color: '#F8F9FA',
                  marginBottom: '0.75rem'
                }}>
                  Create Match
                </h3>
                <p style={{
                  color: '#D1D5DB',
                  marginBottom: '1.5rem',
                  lineHeight: '1.5'
                }}>
                  Start a new trivia battle and share with friends. 
                  Set the stakes and wait for challengers.
                </p>
                <div className="btn btn-primary" style={{
                  display: 'inline-block',
                  textDecoration: 'none'
                }}>
                  Create Game
                </div>
              </Card>
            </ProtectedLink>

            {/* Join Match */}
            <ProtectedLink href="/join" style={{ textDecoration: 'none' }}>
              <Card className="text-center hover:scale-105 transition-transform duration-300 h-full">
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem auto',
                  fontSize: '1.5rem'
                }}>
                  <Image src="/join_match.png" alt="Join Match" width={50} height={50} />
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 700,
                  color: '#F8F9FA',
                  marginBottom: '0.75rem'
                }}>
                  Join Match
                </h3>
                <p style={{
                  color: '#D1D5DB',
                  marginBottom: '1.5rem',
                  lineHeight: '1.5'
                }}>
                  Enter a match ID and join an existing trivia battle. 
                  Challenge friends or accept their invitation.
                </p>
                <div className="btn btn-primary" style={{
                  display: 'inline-block',
                  textDecoration: 'none'
                }}>
                  Join Battle
                </div>
              </Card>
            </ProtectedLink>
          </div>
        </Container>
      </div>

      {/* How to Play Section */}
      <div style={{ 
        paddingTop: '4rem',
        paddingBottom: '4rem'
      }}>
        <Container size="xl">
          <div style={{ 
            maxWidth: '64rem', 
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 700,
              color: '#F8F9FA',
              marginBottom: '1rem'
            }}>
              How to Play
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#D1D5DB',
              marginBottom: '3rem',
              opacity: 0.9
            }}>
              Three simple steps to basketball trivia glory
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '3rem'
            }}>
              <div style={{ 
                textAlign: 'center',
                padding: '2rem',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ 
                  fontSize: '2rem', 
                  marginBottom: '1rem',
                  background: 'linear-gradient(135deg, #FF6E00, #E63946)',
                  borderRadius: '50%',
                  width: '4rem',
                  height: '4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  color: 'white',
                  fontWeight: 700
                }}>
                  1
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  color: '#F8F9FA'
                }}>
                  Select Your NFT
                </h3>
                <p style={{ 
                  color: '#D1D5DB',
                  lineHeight: '1.5'
                }}>
                  Choose your NBA TopShot NFT to stake in the match. 
                  Only players with the same rarity can compete.
                </p>
              </div>

              <div style={{ 
                textAlign: 'center',
                padding: '2rem',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ 
                  fontSize: '2rem', 
                  marginBottom: '1rem',
                  background: 'linear-gradient(135deg, #FF6E00, #E63946)',
                  borderRadius: '50%',
                  width: '4rem',
                  height: '4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  color: 'white',
                  fontWeight: 700
                }}>
                  2
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  color: '#F8F9FA'
                }}>
                  Answer Questions
                </h3>
                <p style={{ 
                  color: '#D1D5DB',
                  lineHeight: '1.5'
                }}>
                  Beat the 24-second shot clock on NBA trivia questions. 
                  Quick thinking and basketball knowledge are key.
                </p>
              </div>

              <div style={{ 
                textAlign: 'center',
                padding: '2rem',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ 
                  fontSize: '2rem', 
                  marginBottom: '1rem',
                  background: 'linear-gradient(135deg, #FF6E00, #E63946)',
                  borderRadius: '50%',
                  width: '4rem',
                  height: '4rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  color: 'white',
                  fontWeight: 700
                }}>
                  3
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  color: '#F8F9FA'
                }}>
                  Win & Claim
                </h3>
                <p style={{ 
                  color: '#D1D5DB',
                  lineHeight: '1.5'
                }}>
                  Highest score wins both NFTs! 
                  The champion takes all the stakes.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Footer */}
      <div style={{ 
        paddingTop: '2rem',
        paddingBottom: '2rem',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Container>
          <div style={{ 
            textAlign: 'center',
            color: '#9CA3AF'
          }}>
            <p style={{ margin: 0 }}>
              NBA TopShot Integration • Powered by Dapper Labs • Summer Hackathon 2025
            </p>
          </div>
        </Container>
      </div>
    </>
  );
}
