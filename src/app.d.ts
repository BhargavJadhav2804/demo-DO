// TypeScript definitions for Cloudflare platform bindings

declare global {
	namespace App {
		interface Platform {
			env?: {
				AI_AGENT_DO: DurableObjectNamespace;
				AI: any;
			};
			context?: ExecutionContext;
			caches?: CacheStorage & { default: Cache };
		}
	}
}

export {};
