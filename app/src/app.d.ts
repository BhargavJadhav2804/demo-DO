// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

/// <reference types="../../do-worker/worker-configuration.d.ts" />

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		 interface Platform {
			env:{
				MY_DURABLE_OBJECT: DurableObjectNamespace<MyDurableObject>;
			}
		 }
	}
}

export {};
