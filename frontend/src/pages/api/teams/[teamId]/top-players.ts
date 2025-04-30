import { NextApiRequest, NextApiResponse } from 'next';

const topPlayers = {
  nyy: [
    { id: 1, name: 'Aaron Judge', stat: 'HR: 12' },
    { id: 2, name: 'Giancarlo Stanton', stat: 'AVG: .295' },
  ],
  bos: [
    { id: 3, name: 'Rafael Devers', stat: 'HR: 8' },
    { id: 4, name: 'Xander Bogaerts', stat: 'AVG: .310' },
  ],
  laa: [
    { id: 5, name: 'Mike Trout', stat: 'HR: 10' },
    { id: 6, name: 'Shohei Ohtani', stat: 'ERA: 2.45' },
  ],
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid teamId' });
  }
  res.status(200).json(topPlayers[teamId] || []);
}
