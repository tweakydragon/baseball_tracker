import { NextApiRequest, NextApiResponse } from 'next';

const schedules = {
  nyy: [
    { id: 1, date: '2025-05-01', opponent: 'Boston Red Sox', location: 'Home', status: 'Scheduled' },
    { id: 2, date: '2025-05-03', opponent: 'Los Angeles Angels', location: 'Away', status: 'Scheduled' },
  ],
  bos: [
    { id: 3, date: '2025-05-01', opponent: 'New York Yankees', location: 'Away', status: 'Scheduled' },
    { id: 4, date: '2025-05-04', opponent: 'Los Angeles Angels', location: 'Home', status: 'Scheduled' },
  ],
  laa: [
    { id: 5, date: '2025-05-03', opponent: 'New York Yankees', location: 'Home', status: 'Scheduled' },
    { id: 6, date: '2025-05-04', opponent: 'Boston Red Sox', location: 'Away', status: 'Scheduled' },
  ],
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid teamId' });
  }
  res.status(200).json(schedules[teamId] || []);
}
