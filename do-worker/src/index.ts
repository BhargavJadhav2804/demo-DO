import { DurableObject } from "cloudflare:workers";

/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

/** A Durable Object's behavior is defined in an exported Javascript class */
export class MyDurableObject extends DurableObject<Env> {

	current: number = 0;
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);

		this.ctx.blockConcurrencyWhile(async () => {
			// Initialize Durable Object state here.
			this.current = (await this.ctx.storage.get<number>("counter")) || 0;
		});
	}

	/**
	 * The Durable Object exposes an RPC method sayHello which will be invoked when when a Durable
	 *  Object instance receives a request from a Worker via the same method invocation on the stub
	 *
	 * @param name - The name provided to a Durable Object instance from a Worker
	 * @returns The greeting to be sent back to the Worker
	 */
	async sayHello(name: string): Promise<string> {
		return `Hello, ${name}!`;
	}

	async fetch(request: Request): Promise<Response> {
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		this.ctx.acceptWebSocket(server);

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
		// Broadcast the message to all connected clients except the sender
		const allWebSockets = this.ctx.getWebSockets();

		allWebSockets.forEach((client) => {
			// Skip the sender
			if (client !== ws) {
				client.send(message);
			}
		});

		// Optionally log the broadcast
		console.log(`Broadcasted message to ${allWebSockets.length - 1} clients`);
	}

	async webSocketClose(
		ws: WebSocket,
		code: number,
		reason: string,
		wasClean: boolean,
	) {
		// If the client closes the connection, the runtime will invoke the webSocketClose() handler.
		ws.close(code, "Durable Object is closing WebSocket");
	}
}

export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	async fetch(request, env, ctx): Promise<Response> {
		// Create a stub to open a communication channel with the Durable Object
		// instance named "foo".
		//
		// Requests from all Workers to the Durable Object instance named "foo"
		// will go to a single remote Durable Object instance.

		console.log('inside worker fetch: ', request)

		let params = new URL(request.url).searchParams.get("name") || "foo";

		let doId = env.MY_DURABLE_OBJECT.idFromName(params);

		console.log("\n\n ( From worker ) Durable Object ID:", doId.toString());


		const stub = env.MY_DURABLE_OBJECT.get(doId);

		console.log("\n\n ( From worker ) Durable Object Stub:", stub);

		// Call the `sayHello()` RPC method on the stub to invoke the method on
		// the remote Durable Object instance.
		const response = await stub.fetch(request);

		return response;
	},
} satisfies ExportedHandler<Env>;
