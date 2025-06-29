# 🏀 Hoops Trivia Showdown

**Stake your NBA NFTs and battle in the ultimate basketball trivia competition!**

A Next.js web application where players can stake NBA NFTs and compete in real-time trivia matches. Winner takes all!

## ✨ Features

### Core Features ✅
- 🎮 **Create/Join Matches** - Start new trivia battles or join existing ones
- 🏀 **NBA Trivia Questions** - Curated basketball knowledge challenges with AI generation
- ⏱️ **24-Second Shot Clock** - Beat the clock like in real NBA games with sound effects
- 🃏 **NFT Staking** - Choose your NBA TopShot NFT to stake in matches
- 🏆 **Winner Takes All** - Highest score wins both NFTs with automatic transfer
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 🔐 **Auth0 Integration** - Secure authentication with Dapper wallet support
- 🌐 **Real NFT Data** - Live NBA TopShot moments from Dapper Labs GraphQL API
- ✨ **Radiant NFT Borders** - TopShot-style rainbow glow effects on all NFT cards
- 🎯 **Player Perspective** - Current player always displayed on left side
- 🔊 **Sound Effects** - Immersive audio with beeps, buzzers, swish, and cheer sounds
- 🤖 **AI-Generated Questions** - Dynamic trivia powered by OpenAI
- 💫 **Animated UI** - Smooth animations and professional game interface
- 🔄 **Real-time Updates** - Live match status, scoring, and game state synchronization

### Advanced Features ✅
- 🏃 **Auto-matching** - Quick match system for instant gameplay
- 🎨 **Premium UI/UX** - NBA-themed design with basketball court aesthetics
- 🔄 **NFT Transfer System** - Automatic winner NFT collection after matches
- 📊 **Live Scoring** - Real-time score updates and match progression
- 🎪 **Match Lobby** - Professional waiting room with player information
- 🏁 **Game Results** - Detailed winner announcement with NFT showcase

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Auth0 account for authentication
- Dapper Labs API access for NFT data

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hoops-trivia-showdown
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Add your credentials:
   ```bash
   # Auth0 Configuration
   AUTH0_ISSUER_BASE_URL=https://YOUR_AUTH0_DOMAIN
   AUTH0_CLIENT_ID=YOUR_CLIENT_ID
   AUTH0_CLIENT_SECRET=YOUR_CLIENT_SECRET
   AUTH0_BASE_URL=http://localhost:4000
   AUTH0_SECRET=YOUR_AUTH0_SECRET

   #Vercel KV credentials
   KV_URL=""
   KV_REST_API_URL=""
   KV_REST_API_TOKEN=""
   KV_REST_API_READ_ONLY_TOKEN=""
   REDIS_URL=""

   # GraphQL Endpoints
   NEXT_PUBLIC_GRAPHQL_WALLET_URL=''
   NEXT_PUBLIC_GRAPHQL_ACCOUNTS_URL=''

   # OpenAI for AI Questions
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   Visit [http://localhost:4000](http://localhost:4000)

## 🎯 How to Play

### Quick Match (Recommended)
1. **Auto-Match**
   - Click "Quick Match" on homepage
   - Select your NBA TopShot NFT to stake
   - Get instantly matched with another player
   - Start playing immediately!

### Custom Match
1. **Create a Match**
   - Go to "Create Match"
   - Select an NBA TopShot NFT to stake
   - Share the match ID with your opponent

2. **Join a Match**
   - Go to "Join Match" 
   - Enter the match ID from your opponent
   - Select your NBA TopShot NFT to stake

3. **Play Trivia**
   - Answer NBA trivia questions within 24 seconds
   - Earn points for correct answers and speed bonuses
   - Current player always appears on the left
   - Listen for audio cues (beeps, buzzer, swish sounds)
   - Highest total score wins both NFTs!

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with custom NBA theme
- **Authentication**: Auth0 with Dapper wallet integration
- **Data Fetching**: GraphQL with Apollo Client for real NFT data
- **Real-time**: Server-Sent Events (SSE) for live updates
- **AI**: OpenAI GPT for dynamic question generation
- **Audio**: HTML5 Audio API for sound effects
- **Storage**: Vercel KV Redis Cache

### API Routes
- `POST /api/match/create` - Create new match
- `POST /api/match/join` - Join existing match
- `GET /api/match/[id]` - Get match details
- `GET /api/match/[id]/stream` - Real-time match updates
- `POST /api/match/answer` - Submit trivia answers
- `POST /api/match/start` - Start match gameplay
- `POST /api/match/transfer-nft` - Handle NFT transfers
- `POST /api/match/automatch` - Auto-matching system
- `GET /api/match/automatch/stream` - Auto-match queue updates
- `POST /api/questions/generate` - AI question generation
- `GET /api/user-tokens` - Get user's NFT collection

### Project Structure
```
src/
├── app/                 # Next.js App Router pages
│   ├── create/         # Create match page
│   ├── join/           # Join match page
│   ├── automatch/      # Quick match page
│   ├── match/[id]/     # Match gameplay page
│   └── api/            # API routes
├── components/         # Reusable React components
│   ├── match/          # Match-specific components
│   ├── RadiantBorder.tsx # TopShot-style NFT borders
│   ├── NFTSelector.tsx # NFT selection with glow effects
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useGameLogic.ts # Game state and timer management
│   ├── useMatchState.ts # Real-time match updates
│   ├── useSound.ts     # Audio effects management
│   └── useUserMoments.ts # NFT data fetching
├── lib/               # Utility functions and configurations
│   ├── auth0.ts       # Auth0 configuration
│   ├── apollo.ts      # GraphQL client setup
│   ├── ai.ts          # OpenAI integration
│   └── nftTransfer.ts # NFT transfer logic
├── types/             # TypeScript type definitions
└── globals.css        # Global styles with NBA theme
```

## 🎨 Design & UX

The application features a premium NBA-themed design:

- **🏀 Basketball Court Aesthetics** - Professional sports arena feel
- **🔥 Orange/Red Gradients** - Heat and energy color scheme
- **✨ Radiant NFT Borders** - TopShot-style rainbow glow effects
- **⏱️ 24-Second Shot Clock** - Authentic NBA timing with animations
- **🎵 Immersive Audio** - Basketball sound effects (swish, buzzer, cheers)
- **📱 Mobile-First Design** - Responsive across all devices
- **🎯 Player-Centric View** - Current player always on left side
- **💫 Smooth Animations** - Professional transitions and effects

### Key UI Components
- **RadiantBorder**: TopShot-inspired rainbow glow for NFT cards
- **ShotClock**: Animated 24-second countdown with audio
- **GameInProgress**: Real-time gameplay interface
- **MatchLobby**: Professional waiting room
- **NFTSelector**: Premium NFT selection with glow effects

## 🧪 Testing the Complete Experience

1. **Authentication Flow**:
   - Visit homepage and click "Sign In"
   - Authenticate with Auth0/Dapper
   - Your real TopShot NFTs will load

2. **Quick Match**:
   - Click "Quick Match" 
   - Select a TopShot NFT to stake
   - Get auto-matched with another player
   - Experience full gameplay with sounds

3. **Custom Match**:
   - Create match with specific NFT
   - Share match ID with friend
   - Both join and play competitive trivia

## 🚢 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy automatically on push

### Environment Setup
Ensure all required environment variables are configured:
- Auth0 credentials for authentication
- GraphQL endpoints for NFT data
- OpenAI API key for question generation

## 🏆 Final Feature Set

### ✅ Completed Features
- [x] **Authentication & Real Data** - Auth0 + Dapper integration
- [x] **Real NFT Integration** - Live TopShot moments via GraphQL
- [x] **Enhanced UI/UX** - Radiant borders, animations, sound effects
- [x] **AI-Generated Questions** - Dynamic trivia via OpenAI
- [x] **Auto-Matching System** - Quick match functionality
- [x] **Player Perspective Fix** - Current player always on left
- [x] **Sound Effects** - Immersive audio experience
- [x] **NFT Transfer System** - Automatic winner collection
- [x] **Real-time Updates** - Live match synchronization
- [x] **Premium Design** - TopShot-style aesthetics
- [x] **Mobile Optimization** - Responsive across devices

### 🎯 Production Ready
- Professional-grade UI/UX matching TopShot standards
- Secure authentication and NFT handling
- Real-time multiplayer functionality
- AI-powered dynamic content
- Comprehensive error handling
- Mobile-responsive design
- Audio-visual feedback system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly across devices
5. Submit a pull request

## 📝 License

This project was built for the Dapper Labs Hackathon and showcases NBA TopShot integration.

## 🏆 Credits

- **Built for**: Dapper Labs Hackathon
- **Tech Stack**: Next.js, TypeScript, Tailwind CSS, Auth0, GraphQL
- **NBA Data**: Real TopShot moments via Dapper Labs API
- **AI**: OpenAI GPT for dynamic question generation
- **Design**: Custom NBA-themed interface with TopShot aesthetics
- **Audio**: Basketball sound effects for immersive gameplay

---

**🏀 Ready to stake your TopShot NFTs and dominate the court? Let's ball! 🔥**

*The ultimate NBA trivia experience with real NFT stakes, AI-powered questions, and TopShot-quality design.*
