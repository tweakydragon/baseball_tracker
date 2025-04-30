import { NextApiRequest, NextApiResponse } from 'next';

const injuries = {
  nyy: [
    { id: 1, player: 'Aaron Judge', injury: 'Hamstring', status: 'Day-to-day', expectedReturn: '2025-05-05' },
  ],
  bos: [
    { id: 2, player: 'Rafael Devers', injury: 'Wrist', status: '10-day IL', expectedReturn: '2025-05-10' },
  ],
  laa: [
    { id: 3, player: 'Mike Trout', injury: 'Back', status: 'Day-to-day', expectedReturn: '2025-05-03' },
  ],
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid teamId' });
  }
  res.status(200).json(injuries[teamId] || []);
}
