/**
 * Runtime API Proxy — forwards all /api/* requests to the backend
 * Reads BACKEND_URL at request time (not build time) so Vercel env vars always work
 */
import { type NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:4000';

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathname = path.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND}/api/${pathname}${search}`;

  // Forward all headers except host (which would confuse the backend)
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host') headers.set(key, value);
  });

  // Forward body for write methods
  let body: ArrayBuffer | undefined;
  if (!['GET', 'HEAD'].includes(request.method)) {
    body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      // @ts-expect-error — needed to forward cookies correctly on Node.js fetch
      duplex: 'half',
    });

    // Forward ALL response headers — critical for Set-Cookie (auth tokens)
    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      responseHeaders.append(key, value);
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error(`[proxy] Failed to reach ${targetUrl}:`, err);
    return NextResponse.json(
      { success: false, error: { message: 'Backend unreachable', code: 'PROXY_ERROR' } },
      { status: 502 },
    );
  }
}

export const GET     = handler;
export const POST    = handler;
export const PUT     = handler;
export const PATCH   = handler;
export const DELETE  = handler;
export const OPTIONS = handler;
