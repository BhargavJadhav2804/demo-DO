# AI Agent with SvelteKit & Cloudflare Durable Objects

A production-ready AI Agent application built with SvelteKit and Cloudflare Durable Objects, following the "Stateful Proxy" pattern.

## Architecture Overview

This application implements the **Stateful Proxy Pattern** with three distinct layers:

1. **Frontend (`+page.svelte`)**: Modern chat interface that communicates only with our SvelteKit API
2. **API Route (`/api/agent/+server.ts`)**: Stateless proxy that forwards requests to the Durable Object
3. **Durable Object (`AiAgent.ts`)**: Stateful "brain" that manages chat history and AI interactions

### Key Features

- ✅ SvelteKit 2.0+ with TypeScript
- ✅ Cloudflare Durable Objects for state management
- ✅ SQLite-backed storage for chat history persistence
- ✅ Cloudflare Workers AI integration (`@cf/meta/llama-3-8b-instruct`)
- ✅ Modern, responsive chat interface
- ✅ Loading states and error handling
- ✅ Clean separation of concerns

## Project Structure

```
demo-DO/
├── src/
│   ├── lib/
│   │   └── AiAgent.ts          # Durable Object class (stateful brain)
│   ├── routes/
│   │   ├── +page.svelte        # Chat UI (frontend)
│   │   └── api/
│   │       └── agent/
│   │           └── +server.ts  # API route (stateless proxy)
│   ├── app.d.ts                # TypeScript definitions
│   ├── app.html                # HTML template
│   └── index.ts                # Worker entry point
├── static/
│   └── favicon.png
├── wrangler.toml               # Cloudflare configuration
├── package.json
├── svelte.config.js
├── tsconfig.json
└── vite.config.ts
```

## Core Files

### 1. `wrangler.toml`
Configures the Cloudflare Workers environment with:
- Durable Object binding (`AI_AGENT_DO`)
- AI binding for Workers AI (`AI`)
- SQLite storage migration

### 2. `src/lib/AiAgent.ts`
The Durable Object class that:
- Manages persistent chat history
- Calls Cloudflare Workers AI
- Acts as the single source of truth

### 3. `src/routes/api/agent/+server.ts`
Stateless API proxy that:
- Receives frontend requests
- Forwards to Durable Object
- Returns AI responses

### 4. `src/routes/+page.svelte`
Clean chat interface with:
- Message history display
- Loading states ("Thinking...")
- Error handling
- Responsive design

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (for deployment)

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Preview locally (requires Cloudflare Workers environment)
npm run preview
```

### Development

```bash
# Start development server
npm run dev
```

### Deployment to Cloudflare Pages

```bash
# Deploy to Cloudflare Pages
npm run deploy
```

Or use the Cloudflare Dashboard:
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set build output directory: `.svelte-kit/cloudflare`
4. Deploy!

## How It Works

### Message Flow

1. **User sends message** → Frontend (`+page.svelte`)
2. **Frontend calls** → API route (`POST /api/agent`)
3. **API route forwards** → Durable Object (`AiAgent`)
4. **Durable Object**:
   - Loads chat history from storage
   - Adds user message to history
   - Calls Cloudflare Workers AI
   - Adds AI response to history
   - Saves history to storage
   - Returns AI response
5. **API route returns** → Frontend
6. **Frontend displays** → AI response to user

### Data Persistence

Chat history is stored in the Durable Object's built-in SQLite-backed storage:
- Persists across requests
- Automatic replication
- Low latency access
- Strongly consistent

## Technology Stack

- **Frontend**: SvelteKit 2.0+ with TypeScript
- **Backend**: Cloudflare Workers & Durable Objects
- **AI**: Cloudflare Workers AI (Llama 3 8B Instruct)
- **Storage**: Durable Object SQLite storage
- **Deployment**: Cloudflare Pages

## Configuration

### Cloudflare Bindings

The application requires two Cloudflare bindings:

1. **AI_AGENT_DO**: Durable Object namespace for the `AiAgent` class
2. **AI**: Workers AI binding for accessing AI models

These are configured in `wrangler.toml` and automatically available in production.

## Best Practices Implemented

✅ **Stateful Proxy Pattern**: Clear separation between stateless proxy and stateful Durable Object  
✅ **Single Source of Truth**: All state managed in Durable Object  
✅ **Type Safety**: Full TypeScript support throughout  
✅ **Error Handling**: Comprehensive error handling and user feedback  
✅ **Modern Svelte**: Uses Svelte 5 runes (`$state`)  
✅ **Responsive Design**: Mobile-friendly interface  
✅ **Loading States**: Clear feedback during AI processing  

## License

ISC

## Author

Bhargav
