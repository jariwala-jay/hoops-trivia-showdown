'use client';

interface LoadingScreenProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

export default function LoadingScreen({ connectionStatus, reconnectAttempts, maxReconnectAttempts }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-xl">Loading match...</p>
        <div className="mt-4 flex items-center justify-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-400' : 
            connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
          }`}></div>
          <span className="text-sm text-white/80 capitalize">{connectionStatus}</span>
          {reconnectAttempts > 0 && (
            <span className="text-sm text-white/60">
              (Reconnect attempt {reconnectAttempts}/{maxReconnectAttempts})
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 