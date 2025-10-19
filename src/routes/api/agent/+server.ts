/**
 * SvelteKit API Route - Stateless Proxy
 * 
 * This endpoint acts as a bridge between the frontend and the Durable Object.
 * It has no state of its own - it simply forwards requests to the appropriate
 * Durable Object instance and returns the response.
 */

import type { RequestHandler } from './$types';

interface Env {
	AI_AGENT_DO: DurableObjectNamespace;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		// Access the Durable Object binding from platform.env
		const env = platform?.env as Env | undefined;
		
		if (!env || !env.AI_AGENT_DO) {
			return new Response(
				JSON.stringify({ error: 'Durable Object binding not available' }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Get a specific Durable Object instance using a named ID
		// Using 'shared-agent' so all users share the same agent instance
		const id = env.AI_AGENT_DO.idFromName('shared-agent');
		const stub = env.AI_AGENT_DO.get(id);

		// Forward the request to the Durable Object
		const response = await stub.fetch(request);

		// Return the Durable Object's response back to the frontend
		return response;
	} catch (error) {
		console.error('Error in API route:', error);
		return new Response(
			JSON.stringify({ 
				error: 'Failed to process request',
				details: error instanceof Error ? error.message : 'Unknown error'
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
