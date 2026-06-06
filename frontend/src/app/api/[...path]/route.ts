/**
 * Runtime API proxy: forwards /api/* requests to the backend.
 * BACKEND_URL is read at request time, so Vercel env changes do not need a rebuild.
 */
import { type NextRequest, NextResponse } from 'next/server';

const BACKEND = (process.env.BACKEND_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'origin',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathname = path.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND}/api/${pathname}${search}`;

  // This is a server-to-server request. Do not forward Origin, otherwise the
  // backend can reject the proxy call with a CORS error.
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });

  let body: ArrayBuffer | undefined;
  if (!['GET', 'HEAD'].includes(request.method)) {
    body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      // @ts-expect-error Node fetch requires duplex for streaming request bodies.
      duplex: 'half',
    });

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

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
