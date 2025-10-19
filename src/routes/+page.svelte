<script lang="ts">
	/**
	 * AI Agent Chat Interface
	 * 
	 * A clean, modern chat interface that communicates with our SvelteKit API route.
	 * It has no direct knowledge of the Durable Object architecture.
	 */

	interface ChatMessage {
		role: 'user' | 'assistant';
		content: string;
	}

	let messages: ChatMessage[] = $state([]);
	let inputMessage = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');

	/**
	 * Send a message to the AI agent via our API route
	 */
	async function sendMessage() {
		if (!inputMessage.trim() || isLoading) return;

		const userMessage = inputMessage.trim();
		inputMessage = ''; // Clear input immediately
		errorMessage = '';

		// Add user message to the UI
		messages = [...messages, { role: 'user', content: userMessage }];
		isLoading = true;

		try {
			// Call our SvelteKit API route
			const response = await fetch('/api/agent', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ message: userMessage })
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to get response');
			}

			const data = await response.json();

			// Add AI response to the UI
			messages = [...messages, { role: 'assistant', content: data.response }];
		} catch (error) {
			console.error('Error sending message:', error);
			errorMessage = error instanceof Error ? error.message : 'An error occurred';
			
			// Remove the user message if the request failed
			messages = messages.slice(0, -1);
			inputMessage = userMessage; // Restore the input
		} finally {
			isLoading = false;
		}
	}

	/**
	 * Handle form submission
	 */
	function handleSubmit(event: Event) {
		event.preventDefault();
		sendMessage();
	}

	/**
	 * Handle Enter key press (without Shift)
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}
</script>

<svelte:head>
	<title>AI Agent Chat</title>
	<meta name="description" content="Chat with an AI agent powered by Cloudflare Durable Objects" />
</svelte:head>

<div class="container">
	<header>
		<h1>🤖 AI Agent Chat</h1>
		<p>Powered by SvelteKit & Cloudflare Durable Objects</p>
	</header>

	<main class="chat-container">
		<div class="messages">
			{#if messages.length === 0}
				<div class="empty-state">
					<p>👋 Hello! Start a conversation with the AI agent.</p>
				</div>
			{/if}

			{#each messages as message}
				<div class="message {message.role}">
					<div class="message-header">
						{message.role === 'user' ? '👤 You' : '🤖 Agent'}
					</div>
					<div class="message-content">
						{message.content}
					</div>
				</div>
			{/each}

			{#if isLoading}
				<div class="message assistant loading">
					<div class="message-header">🤖 Agent</div>
					<div class="message-content">
						<span class="thinking">Thinking...</span>
					</div>
				</div>
			{/if}
		</div>

		{#if errorMessage}
			<div class="error">
				⚠️ {errorMessage}
			</div>
		{/if}

		<form class="input-form" onsubmit={handleSubmit}>
			<textarea
				bind:value={inputMessage}
				onkeydown={handleKeydown}
				placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
				disabled={isLoading}
				rows="3"
			></textarea>
			<button type="submit" disabled={!inputMessage.trim() || isLoading}>
				{isLoading ? 'Sending...' : 'Send'}
			</button>
		</form>
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem 1rem;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	header {
		text-align: center;
		color: white;
		margin-bottom: 2rem;
	}

	header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2.5rem;
		font-weight: 700;
	}

	header p {
		margin: 0;
		font-size: 1rem;
		opacity: 0.9;
	}

	.chat-container {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow: hidden;
		max-height: calc(100vh - 200px);
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.empty-state {
		text-align: center;
		color: #888;
		padding: 3rem 1rem;
		font-size: 1.1rem;
	}

	.message {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 80%;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.message.user {
		align-self: flex-end;
	}

	.message.assistant {
		align-self: flex-start;
	}

	.message-header {
		font-size: 0.85rem;
		font-weight: 600;
		color: #666;
	}

	.message-content {
		padding: 1rem;
		border-radius: 1rem;
		white-space: pre-wrap;
		word-wrap: break-word;
		line-height: 1.5;
	}

	.message.user .message-content {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-bottom-right-radius: 0.25rem;
	}

	.message.assistant .message-content {
		background: #f0f0f0;
		color: #333;
		border-bottom-left-radius: 0.25rem;
	}

	.message.loading .message-content {
		background: #f0f0f0;
		color: #666;
		font-style: italic;
	}

	.thinking {
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.error {
		margin: 0 1.5rem;
		padding: 1rem;
		background: #fee;
		color: #c33;
		border-radius: 0.5rem;
		border-left: 4px solid #c33;
	}

	.input-form {
		padding: 1.5rem;
		border-top: 1px solid #e0e0e0;
		display: flex;
		gap: 1rem;
		background: #fafafa;
	}

	textarea {
		flex: 1;
		padding: 1rem;
		border: 2px solid #e0e0e0;
		border-radius: 0.5rem;
		font-family: inherit;
		font-size: 1rem;
		resize: none;
		transition: border-color 0.2s;
	}

	textarea:focus {
		outline: none;
		border-color: #667eea;
	}

	textarea:disabled {
		background: #f5f5f5;
		cursor: not-allowed;
	}

	button {
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s, opacity 0.2s;
		white-space: nowrap;
	}

	button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	button:active:not(:disabled) {
		transform: translateY(0);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem 0.5rem;
		}

		header h1 {
			font-size: 2rem;
		}

		.message {
			max-width: 90%;
		}

		.input-form {
			flex-direction: column;
		}

		button {
			width: 100%;
		}
	}
</style>
