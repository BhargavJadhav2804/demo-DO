/**
 * AiAgent Durable Object
 * 
 * This is the stateful "brain" of the agent and the single source of truth.
 * It manages chat history using SQLite-backed storage and generates responses
 * using Cloudflare's Workers AI.
 */

interface Message {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

interface Env {
	AI: any; // Cloudflare Workers AI binding
}

export class AiAgent {
	private state: DurableObjectState;
	private env: Env;

	constructor(state: DurableObjectState, env: Env) {
		this.state = state;
		this.env = env;
	}

	/**
	 * Handle incoming requests from the SvelteKit API route
	 */
	async fetch(request: Request): Promise<Response> {
		try {
			// Parse the incoming request
			const { message } = await request.json() as { message: string };

			if (!message || typeof message !== 'string') {
				return new Response(
					JSON.stringify({ error: 'Invalid message format' }),
					{ status: 400, headers: { 'Content-Type': 'application/json' } }
				);
			}

			// Load chat history from Durable Object storage
			const history = await this.loadHistory();

			// Add the user's message to history
			const userMessage: Message = {
				role: 'user',
				content: message
			};
			history.push(userMessage);

			// Call Cloudflare Workers AI to generate a response
			const aiResponse = await this.generateAIResponse(history);

			// Add the AI's response to history
			const assistantMessage: Message = {
				role: 'assistant',
				content: aiResponse
			};
			history.push(assistantMessage);

			// Save the updated history to Durable Object storage
			await this.saveHistory(history);

			// Return only the latest AI response to the API route
			return new Response(
				JSON.stringify({ response: aiResponse }),
				{ status: 200, headers: { 'Content-Type': 'application/json' } }
			);
		} catch (error) {
			console.error('Error in AiAgent:', error);
			return new Response(
				JSON.stringify({ 
					error: 'Internal server error',
					details: error instanceof Error ? error.message : 'Unknown error'
				}),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}
	}

	/**
	 * Load chat history from Durable Object storage
	 */
	private async loadHistory(): Promise<Message[]> {
		const stored = await this.state.storage.get<Message[]>('chat_history');
		return stored || [];
	}

	/**
	 * Save chat history to Durable Object storage
	 */
	private async saveHistory(history: Message[]): Promise<void> {
		await this.state.storage.put('chat_history', history);
	}

	/**
	 * Generate AI response using Cloudflare Workers AI
	 */
	private async generateAIResponse(history: Message[]): Promise<string> {
		try {
			// Call the Cloudflare Workers AI model
			const response = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
				messages: history
			});

			// Extract the response content
			if (response && response.response) {
				return response.response;
			}

			return 'I apologize, but I was unable to generate a response. Please try again.';
		} catch (error) {
			console.error('Error calling AI model:', error);
			return 'I apologize, but I encountered an error while processing your request. Please try again.';
		}
	}
}
