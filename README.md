# Morphix

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-5-blue?style=flat&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-darkblue?style=flat&logo=prisma)](https://www.prisma.io/)
[![Remotion](https://img.shields.io/badge/Remotion-Video-blueviolet?style=flat)](https://www.remotion.dev/)

> **Transform your product into cinema.**

Morphix is an AI-powered video creation platform. Users can describe animations in natural language, and the AI generates Remotion TSX code that compiles and previews directly in the browser. 

## 🚀 Features

- **AI-Powered Code Generation**: Describe your scene in natural language, and let Claude AI write the Remotion code for you!
- **In-Browser Preview**: Instantly compile and preview generated TSX code without running a local dev server.
- **Multimodal Support**: Edit videos using both text prompts and vision via image uploads.
- **Cloud Rendering**: Render your videos locally using FFmpeg or in the cloud using Remotion Lambda.
- **Authentication**: Seamless user authentication via Supabase.
- **Templates**: Save and load custom scene templates.

## 🏗️ Architecture Stack

Morphix uses a modern monorepo architecture:
- **Frontend**: Next.js 16 (App Router), Vercel AI SDK
- **Backend**: Express 5 REST API, Prisma ORM (PostgreSQL)
- **Video Engine**: Remotion (React for Video)
- **Database / Auth**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: Anthropic Claude API (claude-sonnet-4-6)

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- npm, pnpm, or yarn
- Supabase Project
- Anthropic API Key

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/morphix.git
   cd morphix
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```
   *Create a `.env.local` file in `frontend/` with:*
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ANTHROPIC_API_KEY=your_anthropic_key
   REMOTION_REGION=us-east-1
   REMOTION_FUNCTION_NAME=remotion-render
   REMOTION_SERVE_URL=your_serve_url
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   *Create a `.env` file in `backend/` with:*
   ```env
   SUPABASE_JWT_SECRET=your_jwt_secret
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ANTHROPIC_API_KEY=your_anthropic_key
   DATABASE_URL=your_db_pool_url
   DIRECT_URL=your_db_direct_url
   FRONTEND_URL=http://localhost:3000
   ```
   *Run migrations to setup the database:*
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

### Running the App Locally

Start the Next.js frontend (port 3000):
```bash
cd frontend
npm run dev
```

Start the Express backend (port 8000):
```bash
cd backend
npm run dev
```

## 🧠 AI Generation Flow

Morphix leverages the Vercel AI SDK and Anthropic's Claude to translate natural language into video components:
1. User provides a prompt or images via the Chat UI.
2. The AI generates Remotion TSX component code.
3. The in-browser compiler (Babel) strips imports, applies edits, and evaluates the component.
4. The generated component is mounted in `@remotion/player` for an instant visual preview.

## 📄 License

This project is licensed under the MIT License.
