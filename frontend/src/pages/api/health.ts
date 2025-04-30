import type { NextApiRequest, NextApiResponse } from 'next';

// TODO: Add Prometheus metrics, OpenTelemetry tracing, and structured logging setup here

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ status: 'healthy' });
}