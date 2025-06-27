import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

// Try to import KV, but handle gracefully if not available
let kv: { 
  smembers: (key: string) => Promise<string[]>;
  del: (key: string) => Promise<number>;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const kvModule = require('@vercel/kv');
  kv = kvModule.kv;
} catch {
  console.log('KV not available for cleanup');
}

export async function POST() {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!kv) {
      return NextResponse.json({ 
        message: 'KV not available, using in-memory storage (no cleanup needed)' 
      });
    }

    const rarities = ['common', 'rare', 'epic', 'legendary', 'fandom'];
    let totalCleaned = 0;

    for (const rarity of rarities) {
      const queueKey = `automatch:${rarity}`;
      
      try {
        // Clear the entire queue for this rarity
        const deleted = await kv.del(queueKey);
        if (deleted > 0) {
          totalCleaned += deleted;
          console.log(`Cleared ${deleted} entries from ${rarity} queue`);
        }
      } catch (error) {
        console.error(`Error cleaning ${rarity} queue:`, error);
      }
    }

    return NextResponse.json({
      message: `Cleanup completed. Cleared ${totalCleaned} queue entries.`,
      clearedQueues: totalCleaned
    });

  } catch (error) {
    console.error('Error in cleanup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 