'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

interface TestResult {
  success?: boolean;
  error?: string;
  withdrawalResponse?: {
    id: string;
  };
  withdrawal?: object;
  [key: string]: unknown;
}

export default function TestNFTPage() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [withdrawalId, setWithdrawalId] = useState('');

  const testWithdrawal = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/test-nft-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setResult(data);
      
      // Store withdrawal ID for status checking
      if (data.withdrawalResponse?.id) {
        setWithdrawalId(data.withdrawalResponse.id);
      }
    } catch (error) {
      setResult({ error: 'Failed to test withdrawal', details: error });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!withdrawalId) {
      setResult({ error: 'No withdrawal ID available' });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`/api/test-nft-transfer?id=${withdrawalId}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to check status', details: error });
    } finally {
      setLoading(false);
    }
  };

  const checkMyNFTs = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/test-nft-transfer', {
        method: 'PUT',
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to get NFTs', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ 
        maxWidth: '64rem', 
        margin: '0 auto', 
        padding: '2rem 1rem',
        paddingTop: '6rem'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#F8F9FA'
        }}>
          🏀 NFT Withdrawal Test
        </h1>
        
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={testWithdrawal}
              disabled={loading}
              className="btn btn-primary"
              style={{
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Testing...' : 'Test NFT Withdrawal'}
            </button>
            
            <button
              onClick={checkMyNFTs}
              disabled={loading}
              className="btn"
              style={{
                backgroundColor: '#8B5CF6',
                color: '#F8F9FA',
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Loading...' : 'Check My NFTs'}
            </button>
            
            {withdrawalId && (
              <button
                onClick={checkStatus}
                disabled={loading}
                className="btn"
                style={{
                  backgroundColor: '#10B981',
                  color: '#F8F9FA',
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Checking...' : 'Check Status'}
              </button>
            )}
          </div>

          {withdrawalId && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(75, 85, 99, 0.3)',
              borderRadius: '0.5rem'
            }}>
              <strong style={{ color: '#F8F9FA' }}>Withdrawal ID:</strong>{' '}
              <span style={{ color: '#D1D5DB' }}>{withdrawalId}</span>
            </div>
          )}
        </div>

        {result && (
          <div className="card">
            <h2 style={{
              fontSize: '1.25rem',
              fontFamily: 'var(--font-montserrat), Montserrat, system-ui, sans-serif',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#F8F9FA'
            }}>
              {result.success ? '✅ Result' : '❌ Error'}
            </h2>
            <pre style={{
              backgroundColor: '#1F2937',
              color: '#10B981',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
              fontSize: '0.875rem',
              fontFamily: 'monospace'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 