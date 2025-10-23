# Fantasy Basketball App

A Next.js fantasy basketball application with real-time NBA player statistics.

## Environment Setup

1. Copy `.env.local.example` to `.env.local`:
   \`\`\`bash
   cp .env.local.example .env.local
   \`\`\`

2. Add your Ball Don't Lie API key to `.env.local`:
   \`\`\`
   BALLDONTLIE_API_KEY=your_api_key_here
   \`\`\`

3. Get your API key from [Ball Don't Lie](https://www.balldontlie.io/)

## Architecture

This app uses a **secure backend proxy pattern**:

- ✅ **Frontend components** call `/api/nba/*` routes (our backend)
- ✅ **Backend API routes** handle all external API calls
- ✅ **API keys** are stored server-side only in environment variables
- ✅ **No API keys** in client-side code
- ✅ **Caching** is implemented at the API route level

### API Routes

- `/api/nba/players` - Get all players (with pagination and search)
- `/api/nba/players/[id]` - Get specific player details
- `/api/nba/stats/averages` - Get player season averages
- `/api/nba/stats/game-logs` - Get player game logs

### Client Library

The `lib/balldontlie-api.ts` file provides TypeScript functions that:
- Call our backend API routes (not external APIs)
- Provide type-safe interfaces
- Handle error cases gracefully
- Cache data where appropriate

## Security

✅ API keys are **never exposed** to the client
✅ All external API calls go through **server-side API routes**
✅ Environment variables are properly configured
✅ Rate limiting is handled by Next.js API routes

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

Visit `http://localhost:3000`
