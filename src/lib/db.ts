import { Match } from '@/types';

// Try to import KV, but handle gracefully if not available
let kv: { 
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  del: (key: string) => Promise<number>;
  sadd: (key: string, value: string) => Promise<number>;
  srem: (key: string, value: string) => Promise<number>;
  smembers: (key: string) => Promise<string[]>;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const kvModule = require('@vercel/kv');
  kv = kvModule.kv;
} catch {
  console.log('KV not available, using in-memory fallback');
}

// Redis-based persistent storage for multiplayer support
const MATCH_PREFIX = 'match:';
const MATCHES_LIST = 'matches:all';

// Development fallback for when KV is not available
class InMemoryDB {
  private matches: Map<string, Match> = new Map();

  async createMatch(match: Match): Promise<Match> {
    this.matches.set(match.id, match);
    return match;
  }

  async getMatch(id: string): Promise<Match | null> {
    return this.matches.get(id) || null;
  }

  async updateMatch(id: string, updates: Partial<Match>): Promise<Match | null> {
    const match = this.matches.get(id);
    if (!match) return null;

    const updatedMatch = { ...match, ...updates };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }

  async getAllMatches(): Promise<Match[]> {
    return Array.from(this.matches.values());
  }

  async deleteMatch(id: string): Promise<boolean> {
    return this.matches.delete(id);
  }

  async cleanupOldMatches(): Promise<number> {
    return 0; // No cleanup needed for in-memory
  }
}

// Create fallback instance
const fallbackDB = new InMemoryDB();

// KV-based database implementation
const kvDB = {
  // Create a new match
  createMatch: async (match: Match): Promise<Match> => {
    try {
      if (!kv) return fallbackDB.createMatch(match);
      
      // Store the match in Redis
      await kv.set(`${MATCH_PREFIX}${match.id}`, JSON.stringify(match));
      
      // Add to matches list for debugging/listing
      await kv.sadd(MATCHES_LIST, match.id);
      
      return match;
    } catch (error) {
      console.error('Error creating match:', error);
      console.log('Falling back to in-memory storage');
      return fallbackDB.createMatch(match);
    }
  },

  // Get a match by ID
  getMatch: async (id: string): Promise<Match | null> => {
    try {
      if (!kv) return fallbackDB.getMatch(id);
      
      const matchData = await kv.get(`${MATCH_PREFIX}${id}`);
      if (!matchData) return null;
      
      return typeof matchData === 'string' ? JSON.parse(matchData) : matchData;
    } catch (error) {
      console.error('Error getting match:', error);
      return fallbackDB.getMatch(id);
    }
  },

  // Update a match
  updateMatch: async (id: string, updates: Partial<Match>): Promise<Match | null> => {
    try {
      if (!kv) return fallbackDB.updateMatch(id, updates);
      
      const existingMatch = await kvDB.getMatch(id);
      if (!existingMatch) return null;

      const updatedMatch = { ...existingMatch, ...updates };
      await kv.set(`${MATCH_PREFIX}${id}`, JSON.stringify(updatedMatch));
      
      return updatedMatch;
    } catch (error) {
      console.error('Error updating match:', error);
      return fallbackDB.updateMatch(id, updates);
    }
  },

  // Get all matches (for debugging)
  getAllMatches: async (): Promise<Match[]> => {
    try {
      if (!kv) return fallbackDB.getAllMatches();
      
      const matchIds = await kv.smembers(MATCHES_LIST);
      if (!matchIds || matchIds.length === 0) return [];
      
      const matches: Match[] = [];
      for (const id of matchIds) {
        const match = await kvDB.getMatch(id as string);
        if (match) matches.push(match);
      }
      
      return matches;
    } catch (error) {
      console.error('Error getting all matches:', error);
      return fallbackDB.getAllMatches();
    }
  },

  // Delete a match
  deleteMatch: async (id: string): Promise<boolean> => {
    try {
      if (!kv) return fallbackDB.deleteMatch(id);
      
      const deleted = await kv.del(`${MATCH_PREFIX}${id}`);
      await kv.srem(MATCHES_LIST, id);
      return deleted > 0;
    } catch (error) {
      console.error('Error deleting match:', error);
      return fallbackDB.deleteMatch(id);
    }
  },

  // Clean up old matches (optional utility)
  cleanupOldMatches: async (olderThanHours: number = 24): Promise<number> => {
    try {
      if (!kv) return fallbackDB.cleanupOldMatches();
      
      const matches = await kvDB.getAllMatches();
      const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
      
      let deletedCount = 0;
      for (const match of matches) {
        const matchDate = new Date(match.createdAt);
        if (matchDate < cutoffTime) {
          await kvDB.deleteMatch(match.id);
          deletedCount++;
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up matches:', error);
      return 0;
    }
  }
};

export const db = kvDB;

// Helper function to calculate score based on correct answers and time
export function calculateScore(isCorrect: boolean, timeRemaining: number, totalTime: number = 24): number {
  if (!isCorrect) return 0;
  
  // Base points for correct answer
  const basePoints = 100;
  
  // Bonus points for speed (up to 50 bonus points)
  const speedBonus = Math.floor((timeRemaining / totalTime) * 50);
  
  return basePoints + speedBonus;
} 