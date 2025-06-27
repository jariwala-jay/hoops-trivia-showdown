# 🏀 Hoops Trivia Showdown

**Stake your NBA NFTs and battle in the ultimate basketball trivia competition!**

A Next.js web application where players can stake NBA NFTs and compete in real-time trivia matches. Winner takes all!

## ✨ Features

### MVP Features (Current)
- 🎮 **Create/Join Matches** - Start new trivia battles or join existing ones
- 🏀 **NBA Trivia Questions** - Curated basketball knowledge challenges
- ⏱️ **24-Second Shot Clock** - Beat the clock like in real NBA games
- 🃏 **NFT Staking** - Choose your NBA NFT to stake in matches
- 🏆 **Winner Takes All** - Highest score wins both NFTs
- 📱 **Responsive Design** - Works on desktop and mobile

### Future Features
- 🔐 **Auth0 Integration** - Secure authentication with Dapper wallet
- 🌐 **GraphQL API** - Real NFT data from Dapper Labs
- 🤖 **AI-Generated Questions** - Dynamic trivia via n8n + OpenAI
- 💫 **Animated UI** - Shot clock animations and sound effects
- 🔄 **Real-time Updates** - Live match status and scoring

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ (Note: Some dependencies may show warnings with Node 16)
- npm or yarn

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
   # Add your Auth0 credentials when ready
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   Visit [http://localhost:4000](http://localhost:4000)

## 🎯 How to Play

1. **Create a Match**
   - Go to "Create Match"
   - Enter your player name
   - Select an NBA NFT to stake
   - Share the match ID with your opponent

2. **Join a Match**
   - Go to "Join Match" 
   - Enter the match ID from your opponent
   - Enter your player name
   - Select your NBA NFT to stake

3. **Play Trivia**
   - Answer NBA trivia questions
   - Beat the 24-second shot clock
   - Earn points for correct answers and speed
   - Highest total score wins both NFTs!

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Data Fetching**: SWR for real-time updates
- **Notifications**: React Hot Toast
- **Storage**: In-memory database (MVP), upgradeable to PostgreSQL

### API Routes
- `POST /api/match/create` - Create new match
- `POST /api/match/join` - Join existing match
- `GET /api/match/[id]` - Get match details
- `POST /api/match/answer` - Submit trivia answers

### Project Structure
```
src/
├── app/                 # Next.js App Router pages
│   ├── create/         # Create match page
│   ├── join/           # Join match page
│   ├── match/[id]/     # Match gameplay page
│   └── api/            # API routes
├── components/         # Reusable React components
├── lib/               # Utility functions and data
├── types/             # TypeScript type definitions
└── globals.css        # Global styles
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables
```bash
# Auth0 Configuration (Future)
AUTH0_ISSUER_BASE_URL=https://YOUR_AUTH0_DOMAIN
AUTH0_CLIENT_ID=YOUR_CLIENT_ID
AUTH0_CLIENT_SECRET=YOUR_CLIENT_SECRET
AUTH0_BASE_URL=http://localhost:4000
AUTH0_CLIENT_SECRET=YOUR_AUTH0_SECRET

# GraphQL Endpoints (Future)
NEXT_PUBLIC_GRAPHQL_WALLET_URL=''
NEXT_PUBLIC_GRAPHQL_ACCOUNTS_URL=''
```

## 🎨 Design

The application features an NBA-themed design with:
- **Orange/Red gradient backgrounds** - Heat and energy colors
- **Basketball court aesthetics** - Professional sports feel
- **24-second shot clock** - Authentic NBA timing
- **Card-based NFT display** - Clean, modern interface
- **Responsive layout** - Mobile-first approach

## 🧪 Testing a Match

1. **Start the server** (`npm run dev`)
2. **Create a match**:
   - Visit `/create`
   - Enter player name "Player 1"
   - Select any NFT
   - Copy the match ID
3. **Join the match**:
   - Open new tab to `/join`
   - Paste the match ID
   - Enter player name "Player 2"
   - Select different NFT
4. **View the match**:
   - Go to `/match/[match-id]`
   - See both players and their staked NFTs

## 🚢 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Build
```bash
npm run build
npm run start
```

## 🔮 Roadmap

### Phase 1: Core Gameplay ✅
- [x] Match creation and joining
- [x] NFT selection interface
- [x] Basic trivia gameplay
- [x] Scoring system

### Phase 2: Authentication & Real Data
- [ ] Auth0 integration
- [ ] Real NFT data from GraphQL
- [ ] User profiles and history

### Phase 3: Enhanced Experience
- [ ] AI-generated questions via n8n
- [ ] Animations and sound effects
- [ ] Tournament brackets
- [ ] Leaderboards

### Phase 4: Advanced Features
- [ ] Mobile app
- [ ] Live streaming integration
- [ ] Social features
- [ ] Marketplace integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is part of a hackathon and is for demonstration purposes.

## 🏆 Credits

- **Built for**: Dapper Labs Hackathon
- **Tech Stack**: Next.js, Tailwind CSS, TypeScript
- **NBA Data**: Hardcoded trivia questions (MVP)
- **Design**: Custom NBA-themed interface

---

**Ready to shoot your shot? 🏀 Let's ball!**
