import pino from 'pino';
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export default function handler(req, res) {
  logger.info({ method: req.method, url: req.url, endpoint: '/api/health' }, 'Health check called');
  res.status(200).json({ status: 'healthy' });
}