'use client';

import { useState } from 'react';

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
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">NFT Withdrawal Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={testWithdrawal}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test NFT Withdrawal'}
            </button>
            
            <button
              onClick={checkMyNFTs}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Check My NFTs'}
            </button>
            
            {withdrawalId && (
              <button
                onClick={checkStatus}
                disabled={loading}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Check Status'}
              </button>
            )}
          </div>

          {withdrawalId && (
            <div className="mb-4 p-3 bg-gray-100 rounded">
              <strong>Withdrawal ID:</strong> {withdrawalId}
            </div>
          )}
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {result.success ? '✅ Result' : '❌ Error'}
            </h2>
            <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 