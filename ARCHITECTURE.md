# System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                       (Web Browser)                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP POST
                            │ { message: "Hello" }
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: FRONTEND                            │
│                   src/routes/+page.svelte                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Chat Interface                                        │  │
│  │  • Message Display                                       │  │
│  │  • Loading States ("Thinking...")                       │  │
│  │  • Error Handling                                        │  │
│  │  • NO knowledge of Durable Objects                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ fetch('/api/agent', ...)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 LAYER 2: API ROUTE (STATELESS PROXY)            │
│              src/routes/api/agent/+server.ts                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Receive request from frontend                        │  │
│  │  2. Get DO binding: platform.env.AI_AGENT_DO            │  │
│  │  3. Get DO stub: idFromName('shared-agent')             │  │
│  │  4. Forward request: stub.fetch(request)                │  │
│  │  5. Return response to frontend                          │  │
│  │                                                           │  │
│  │  ⚠️  NO BUSINESS LOGIC                                   │  │
│  │  ⚠️  NO STATE MANAGEMENT                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ stub.fetch()
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│           LAYER 3: DURABLE OBJECT (STATEFUL BRAIN)              │
│                    src/lib/AiAgent.ts                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SINGLE SOURCE OF TRUTH                                  │  │
│  │                                                           │  │
│  │  async fetch(request) {                                  │  │
│  │    1. Parse incoming message                             │  │
│  │    2. Load history from storage ──────────┐             │  │
│  │    3. Add user message                     │             │  │
│  │    4. Call AI model ─────────────────┐    │             │  │
│  │    5. Add AI response                 │    │             │  │
│  │    6. Save history to storage ────────│────┘             │  │
│  │    7. Return AI response              │                  │  │
│  │  }                                    │                  │  │
│  └───────────────────────────────────────┼──────────────────┘  │
│                                          │                     │
│  ┌──────────────────────────────────────▼──────────────────┐  │
│  │         DURABLE OBJECT STORAGE (SQLITE)                 │  │
│  │                                                          │  │
│  │  • Chat History: [{role, content}, ...]                │  │
│  │  • Persistent & Replicated                             │  │
│  │  • Strongly Consistent                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ AI.run()
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CLOUDFLARE WORKERS AI                          │
│                @cf/meta/llama-3-8b-instruct                     │
│                                                                 │
│  Input: messages = [{role: 'user', content: '...'}, ...]      │
│  Output: { response: 'AI generated response' }                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Example

### User sends: "What is AI?"

```
1. Frontend (+page.svelte)
   ├─ User types "What is AI?" and clicks Send
   ├─ Display user message in UI
   ├─ Show "Thinking..." indicator
   └─ POST /api/agent { message: "What is AI?" }

2. API Route (+server.ts)
   ├─ Receive request
   ├─ Get AI_AGENT_DO binding from platform.env
   ├─ Get stub: idFromName('shared-agent')
   └─ Forward: stub.fetch(request)

3. Durable Object (AiAgent.ts)
   ├─ Parse: { message: "What is AI?" }
   ├─ Load history: []
   ├─ Add: [{ role: 'user', content: 'What is AI?' }]
   ├─ Call AI: AI.run('@cf/meta/llama-3-8b-instruct', { messages })
   ├─ Receive: "AI stands for Artificial Intelligence..."
   ├─ Add: [{ role: 'assistant', content: '...' }]
   ├─ Save history: [user_msg, assistant_msg]
   └─ Return: { response: "AI stands for..." }

4. API Route (+server.ts)
   └─ Return response to frontend

5. Frontend (+page.svelte)
   ├─ Hide "Thinking..." indicator
   ├─ Display AI response in chat
   └─ Ready for next message
```

## Key Architectural Principles

### ✅ Separation of Concerns
- **Frontend**: UI/UX only
- **API Route**: Routing only
- **Durable Object**: Business logic & state

### ✅ Single Source of Truth
- Only the Durable Object manages state
- All persistence happens in DO storage
- API route is completely stateless

### ✅ Scalability
- Durable Objects are globally distributed
- Automatic scaling and load balancing
- Low-latency access worldwide

### ✅ Reliability
- SQLite-backed storage is durable
- Automatic replication
- Strongly consistent reads/writes

## Configuration Files

### wrangler.toml
```
Bindings:
  - AI_AGENT_DO → Durable Object namespace
  - AI → Workers AI binding

Migration:
  - v1: Enable AiAgent with SQLite storage
```

### Environment Types (app.d.ts)
```typescript
Platform.env:
  - AI_AGENT_DO: DurableObjectNamespace
  - AI: Workers AI interface
```

## Message Format

### Request (Frontend → API → DO):
```json
{
  "message": "User's text message"
}
```

### Response (DO → API → Frontend):
```json
{
  "response": "AI's generated response"
}
```

### Storage Format (in DO):
```json
{
  "chat_history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi there!" },
    { "role": "user", "content": "What is AI?" },
    { "role": "assistant", "content": "AI is..." }
  ]
}
```

## Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | SvelteKit | 2.47.1 | UI Framework |
| Backend | Cloudflare Workers | - | Serverless Runtime |
| State | Durable Objects | - | Stateful Management |
| Storage | SQLite | - | Persistent Storage |
| AI | Workers AI | - | LLM Integration |
| Language | TypeScript | 5.9.3 | Type Safety |
| Build | Vite | 7.1.10 | Build Tool |

## Deployment Flow

```
Local Development
    ↓
npm run build
    ↓
.svelte-kit/cloudflare/
    ↓
Cloudflare Pages
    ↓
Production (Global CDN)
```

## Benefits of This Architecture

✅ **Clear Separation**: Each layer has one responsibility  
✅ **Testable**: Layers can be tested independently  
✅ **Scalable**: Cloudflare handles scaling automatically  
✅ **Maintainable**: Easy to understand and modify  
✅ **Type-Safe**: TypeScript ensures correctness  
✅ **Fast**: Edge computing + global distribution  
✅ **Persistent**: Chat history survives across sessions  
