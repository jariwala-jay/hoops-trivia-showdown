'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Match } from '@/types';

const maxReconnectAttempts = 3;

export function useMatchState(id: string, { onMatchFinished }: { onMatchFinished: () => void }) {
  const [matchData, setMatchData] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [finishedMatchData, setFinishedMatchData] = useState<Match | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const reconnectAttemptsRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finishedMatchDataRef = useRef<Match | null>(null);
  const hasInitializedRef = useRef(false);

  // Keep finishedMatchData in sync with ref
  useEffect(() => {
    finishedMatchDataRef.current = finishedMatchData;
  }, [finishedMatchData]);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetch('/auth/profile');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.sub);
        }
      } catch (error) {
        console.error('[USER] Failed to get current user:', error);
      }
    };
    getCurrentUser();
  }, []);

  const fetchMatchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/match/${id}`);
      if (response.ok) {
        const data = await response.json();
        return data.match;
      }
      return null;
    } catch (error) {
      console.error('Error fetching match data:', error);
      return null;
    }
  }, [id]);

  const connectSSE = useCallback(() => {  
    setConnectionStatus('connecting');

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/match/${id}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnectionStatus('connected');
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'match_state':
          case 'match_update':
            setMatchData(data.match);
            if (data.match.status === 'FINISHED') {
              setFinishedMatchData(data.match);
            }
            break;
          case 'match_finished':
            setMatchData(data.match);
            setFinishedMatchData(data.match);
            onMatchFinished();
            break;
          case 'match_deleted':
            if (!finishedMatchDataRef.current) {
              setError('Match no longer exists');
            }
            break;
          case 'connected':
            break;
          case 'error':
            setError(data.message || 'Connection error');
            break;
        }
      } catch (err) {
        console.error('[MATCH SSE] Error parsing message:', err);
      }
    };

    eventSource.onerror = () => {
      setConnectionStatus('disconnected');
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connectSSE, 2000 * reconnectAttemptsRef.current);
      } else {
        setError('Connection lost. Please refresh the page.');
      }
    };
  }, [id, onMatchFinished]);

  useEffect(() => {
    if (!id || hasInitializedRef.current) return;

    const initializeMatch = async () => {
      hasInitializedRef.current = true;
      
      const initialMatch = await fetchMatchData();
      if (initialMatch) {
        setMatchData(initialMatch);
        if (initialMatch.status === 'FINISHED') {
          setFinishedMatchData(initialMatch);
          return;
        }
        connectSSE();
      } else {
        setError('Match not found');
      }
    };

    initializeMatch();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      hasInitializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id, not the callbacks to avoid infinite loops

  const match = finishedMatchData || matchData;

  return { match, error, connectionStatus, currentUserId, reconnectAttempts: reconnectAttemptsRef.current, maxReconnectAttempts };
} 