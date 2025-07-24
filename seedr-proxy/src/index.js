export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const fileUrl = url.searchParams.get("videoUrl");
    if (!fileUrl) {
      return new Response("Missing videoUrl", { status: 400 });
    }

    // Build Basic auth header
    const auth = btoa(`${env.SEEDR_EMAIL}:${env.SEEDR_PASSWORD}`);

    // Force a full‐file byte range so Seedr never returns 401
    // Use the incoming Range if you really need scrubbing later.
    const incomingRange = request.headers.get("Range");
    const rangeHeader = incomingRange || "bytes=0-";

    const upstream = await fetch(fileUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        Range: rangeHeader
      }
    });

    // Debug 401s
    if (upstream.status === 401) {
      console.error("🔒 Seedr auth still failing!");
    }

    // Preserve all upstream headers (Accept-Ranges, Content-Range, etc.)
    const respHeaders = new Headers(upstream.headers);
    respHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(upstream.body, {
      status:     upstream.status,
      statusText: upstream.statusText,
      headers:    respHeaders
    });
  }
};
