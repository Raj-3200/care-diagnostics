import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── Lazy import so env errors return 500 instead of crashing Vercel ──────────
let handler: ((req: VercelRequest, res: VercelResponse) => void) | null = null;
let initError: Error | null = null;

async function loadApp() {
  if (handler || initError) return;
  try {
    const { default: app } = await import('../src/app.js');
    // Warm up Prisma connection once on cold start
    try {
      const { prisma } = await import('../src/config/database.js');
      await prisma.$connect();
    } catch {
      // Non-fatal — Prisma will reconnect on first query
    }
    handler = app as unknown as (req: VercelRequest, res: VercelResponse) => void;
  } catch (err) {
    initError = err instanceof Error ? err : new Error(String(err));
    console.error('❌ Failed to load app:', initError.message);
  }
}

// Pre-warm on module load (reduces cold-start latency)
void loadApp();

export default async function serverlessHandler(req: VercelRequest, res: VercelResponse) {
  await loadApp();

  if (initError || !handler) {
    console.error('App init error:', initError?.message);
    res.status(500).json({
      success: false,
      error: {
        message: 'Server initialisation failed. Check environment variables.',
        detail: initError?.message ?? 'Unknown error',
      },
    });
    return;
  }

  return handler(req, res);
}
