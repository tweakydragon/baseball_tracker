import { NextApiRequest, NextApiResponse } from 'next';

const rosters = {
  nyy: [
    { id: 1, name: 'Aaron Judge', position: 'RF', number: 99 },
    { id: 2, name: 'Giancarlo Stanton', position: 'DH', number: 27 },
  ],
  bos: [
    { id: 3, name: 'Rafael Devers', position: '3B', number: 11 },
    { id: 4, name: 'Xander Bogaerts', position: 'SS', number: 2 },
  ],
  laa: [
    { id: 5, name: 'Mike Trout', position: 'CF', number: 27 },
    { id: 6, name: 'Shohei Ohtani', position: 'P/DH', number: 17 },
  ],
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid teamId' });
  }
  res.status(200).json(rosters[teamId] || []);
}
