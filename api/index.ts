import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app.js';

// Vercel serverless handler — wraps the Express app
export default function handler(req: VercelRequest, res: VercelResponse) {
  // @ts-expect-error — Express handler accepts VercelRequest/Response
  return app(req, res);
}
