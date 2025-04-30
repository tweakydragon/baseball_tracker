import { NextApiRequest, NextApiResponse } from 'next';

const records = {
  nyy: { wins: 15, losses: 8 },
  bos: { wins: 12, losses: 11 },
  laa: { wins: 10, losses: 13 },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid teamId' });
  }
  res.status(200).json(records[teamId] || { wins: 0, losses: 0 });
}
