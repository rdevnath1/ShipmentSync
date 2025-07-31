# Migration Guide: Replit → Cursor + Vercel

This guide will help you migrate your ShipmentSync application from Replit to a local development environment with Cursor and deploy to Vercel.

## Prerequisites

1. **Node.js** (v18 or later)
2. **Git** 
3. **Cursor IDE** (already installed)
4. **Vercel CLI**: `npm i -g vercel`

## Step 1: Database Setup (Neon PostgreSQL)

### Option A: Neon (Recommended for Vercel)
1. Go to [Neon.tech](https://neon.tech) and create a free account
2. Create a new project called "shipmentsync"
3. Copy the connection string (looks like: `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/shipmentsync`)

### Option B: Local PostgreSQL
```bash
# Install PostgreSQL locally
brew install postgresql  # macOS
# or use Docker
docker run --name shipmentsync-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

## Step 2: Local Development Setup

1. **Clone/Copy your code** (if not already local)
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your actual values:
   ```env
   DATABASE_URL=postgresql://username:password@host:port/database
   SESSION_SECRET=your-super-secret-key
   NODE_ENV=development
   PORT=3000
   
   # Add your carrier API keys
   SHIPSTATION_API_KEY=your_key
   SHIPSTATION_API_SECRET=your_secret
   # ... other keys
   ```

4. **Set up the database**:
   ```bash
   npm run db:push
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

Your app should be running at `http://localhost:3000`

## Step 3: Vercel Deployment

1. **Login to Vercel**:
   ```bash
   npx vercel login
   ```

2. **Deploy to Vercel**:
   ```bash
   npx vercel
   ```
   
   Follow the prompts:
   - Link to existing project? **N**
   - Project name: **shipmentsync** (or your choice)
   - Directory: **./** (current directory)

3. **Set environment variables** in Vercel:
   ```bash
   # Set each environment variable
   npx vercel env add DATABASE_URL
   npx vercel env add SESSION_SECRET
   npx vercel env add SHIPSTATION_API_KEY
   # ... add all your environment variables
   ```

   Or set them in the Vercel dashboard at: `vercel.com/[username]/[project]/settings/environment-variables`

4. **Deploy production**:
   ```bash
   npx vercel --prod
   ```

## Step 4: Custom Domain (Optional)

1. In Vercel dashboard, go to **Domains**
2. Add your custom domain
3. Follow DNS setup instructions

## Alternative Deployment Options

### Option 1: Railway (Better for persistent servers)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Option 2: Render
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `npm run build`
4. Set start command: `npm start`

## Key Changes Made

✅ **Removed Replit dependencies**:
- `@replit/vite-plugin-cartographer`
- `@replit/vite-plugin-runtime-error-modal`

✅ **Added deployment configurations**:
- `vercel.json` for Vercel deployment
- `.env.example` for environment setup
- Updated build scripts

✅ **Enhanced package.json scripts**:
- Separate client/server builds
- Database migration commands
- Cleanup scripts

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `SESSION_SECRET` | Session encryption key | ✅ |
| `NODE_ENV` | Environment (development/production) | ✅ |
| `PORT` | Server port (default: 3000) | ❌ |
| `SHIPSTATION_API_KEY` | ShipStation API key | ✅ |
| `SHIPSTATION_API_SECRET` | ShipStation API secret | ✅ |
| `FEDEX_API_KEY` | FedEx API key | ❌ |
| `USPS_API_KEY` | USPS API key | ❌ |
| `JIAYOU_API_KEY` | Jiayou API key | ❌ |
| `SHIPENGINE_API_KEY` | ShipEngine API key | ❌ |

## Troubleshooting

### Database Connection Issues
- Ensure your DATABASE_URL is correct
- Check if your database allows external connections
- Verify Neon database is not paused

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run check`
- Clear build cache: `npm run clean`

### Deployment Issues
- Check Vercel function logs in dashboard
- Ensure all environment variables are set
- Verify build succeeds locally: `npm run build`

## Next Steps

1. Set up monitoring (Vercel Analytics, Sentry)
2. Configure custom domain
3. Set up CI/CD with GitHub Actions
4. Consider Redis for caching (Upstash for Vercel)

Need help? Check the Vercel docs or create an issue in your repository.