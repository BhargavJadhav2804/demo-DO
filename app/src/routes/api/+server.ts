
export const GET = async ({ platform,request,url }) => {
    const DO = platform!.env.MY_DURABLE_OBJECT;

    let params = url.searchParams.get("name") || "foo";

    let doId= DO?.idFromName(params);

    console.log("\n\n Durable Object ID:", doId.toString());

    let stub = platform?.env.MY_DURABLE_OBJECT.get(doId);

    console.log("\n\n Durable Object Stub:", stub);

    if (!stub) {
        return new Response("Not found", { status: 404 });
    }

    // Methods on the Durable Object are invoked via the stub
    const rpcResponse = await stub.fetch(request);

    return rpcResponse;
};