import Link from 'next/link';
import AuthButton from '@/components/AuthButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <AuthButton />
          </div>
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg animate-pulse">
            🏀 HOOPS TRIVIA SHOWDOWN
          </h1>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Stake your NBA NFTs and battle in the ultimate basketball trivia competition! 
            Test your knowledge, win rewards, and claim victory on the court.
          </p>
        </div>

        {/* Game Modes */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Create Match */}
          <Link href="/create" className="group">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center hover:bg-white/20 transition-all duration-300 border-2 border-white/20 hover:border-white/40 transform hover:scale-105 hover:shadow-2xl">
              <div className="text-6xl mb-4 group-hover:animate-bounce">⚡</div>
              <h2 className="text-2xl font-bold text-white mb-3">CREATE MATCH</h2>
              <p className="text-orange-100 mb-6">
                Start a new trivia battle and wait for an opponent to challenge you
              </p>
              <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold py-3 px-6 rounded-lg group-hover:from-orange-300 group-hover:to-red-400 transition-all duration-200 transform group-hover:scale-110">
                🚀 CREATE GAME
              </div>
            </div>
          </Link>

          {/* Join Match */}
          <Link href="/join" className="group">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center hover:bg-white/20 transition-all duration-300 border-2 border-white/20 hover:border-white/40 transform hover:scale-105 hover:shadow-2xl">
              <div className="text-6xl mb-4 group-hover:animate-bounce">🎯</div>
              <h2 className="text-2xl font-bold text-white mb-3">JOIN MATCH</h2>
              <p className="text-orange-100 mb-6">
                Enter a match ID and join an existing trivia battle
              </p>
              <div className="bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold py-3 px-6 rounded-lg group-hover:from-blue-300 group-hover:to-purple-400 transition-all duration-200 transform group-hover:scale-110">
                ⚔️ JOIN BATTLE
              </div>
            </div>
          </Link>
        </div>

        {/* How to Play */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">How to Play</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="text-white group hover:transform hover:scale-105 transition-all duration-200">
              <div className="text-4xl mb-3 group-hover:animate-pulse">1️⃣</div>
              <h3 className="text-xl font-semibold mb-2">Select Your NFT</h3>
              <p className="text-orange-100">Choose your NBA NFT to stake in the match</p>
            </div>
            <div className="text-white group hover:transform hover:scale-105 transition-all duration-200">
              <div className="text-4xl mb-3 group-hover:animate-pulse">2️⃣</div>
              <h3 className="text-xl font-semibold mb-2">Answer Questions</h3>
              <p className="text-orange-100">Beat the 24-second shot clock on NBA trivia</p>
            </div>
            <div className="text-white group hover:transform hover:scale-105 transition-all duration-200">
              <div className="text-4xl mb-3 group-hover:animate-pulse">3️⃣</div>
              <h3 className="text-xl font-semibold mb-2">Win & Claim</h3>
              <p className="text-orange-100">Highest score wins both NFTs!</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-orange-100">
          <p>Built with Next.js • Powered by Dapper Labs</p>
        </div>
      </div>
    </div>
  );
}
