<script lang="ts">
	let ws: WebSocket | undefined = $state();
	let messages: Array<{ type: 'sent' | 'received'; data: string }> = $state([]);
	let inputMessage = $state('');
	let connected = $state(false);

	function connectWebSocket() {
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const wsUrl = `${protocol}//${window.location.host}/api`;
		
		ws = new WebSocket(wsUrl);
		
		ws.onopen = () => {
			connected = true;
			console.log('WebSocket connected');
		};
		
		ws.onmessage = (event) => {
			messages = [...messages, { type: 'received', data: event.data }];
		};
		
		ws.onerror = (error) => {
			console.error('WebSocket error:', error);
		};
		
		ws.onclose = () => {
			connected = false;
			console.log('WebSocket closed');
		};
	}

	function disconnect() {
		if (ws) {
			ws.close();
		}
	}

	function sendMessage() {
		if (ws && ws.readyState === WebSocket.OPEN && inputMessage.trim()) {
			ws.send(inputMessage);
			messages = [...messages, { type: 'sent', data: inputMessage }];
			inputMessage = '';
		}
	}
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<div class="websocket-demo">
	<h2>WebSocket Connection</h2>
	<p>Status: <span class:connected class:disconnected={!connected}>{connected ? 'Connected' : 'Disconnected'}</span></p>
	
	<div class="connection-controls">
		{#if !connected}
			<button onclick={connectWebSocket}>Connect</button>
		{:else}
			<button onclick={disconnect}>Disconnect</button>
		{/if}
	</div>

	<div class="message-input">
		<input 
			type="text" 
			bind:value={inputMessage} 
			placeholder="Type a message..."
			onkeypress={(e) => e.key === 'Enter' && sendMessage()}
			disabled={!connected}
		/>
		<button onclick={sendMessage} disabled={!connected}>Send</button>
	</div>

	<div class="messages">
		<h3>Messages:</h3>
		{#each messages as message}
			<div class="message {message.type}">
				<strong>{message.type === 'sent' ? 'Sent:' : 'Received:'}</strong> {message.data}
			</div>
		{/each}
	</div>
</div>

<style>
	.websocket-demo {
		margin-top: 2rem;
		padding: 1rem;
		border: 1px solid #ccc;
		border-radius: 8px;
	}

	.connected {
		color: green;
		font-weight: bold;
	}

	.disconnected {
		color: red;
		font-weight: bold;
	}

	.connection-controls {
		margin: 1rem 0;
	}

	.connection-controls button {
		padding: 0.5rem 1rem;
		background: #2196F3;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.connection-controls button:hover {
		background: #1976D2;
	}

	.message-input {
		display: flex;
		gap: 0.5rem;
		margin: 1rem 0;
	}

	.message-input input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.message-input button {
		padding: 0.5rem 1rem;
		background: #4CAF50;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.message-input button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.messages {
		margin-top: 1rem;
	}

	.message {
		padding: 0.5rem;
		margin: 0.5rem 0;
		border-radius: 4px;
	}

	.message.sent {
		background: #e3f2fd;
	}

	.message.received {
		background: #f1f8e9;
	}
</style>
