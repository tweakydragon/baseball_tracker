import { NextApiRequest, NextApiResponse } from 'next';

const playerStats = {
  nyy: {
    1: { id: 1, name: 'Aaron Judge', position: 'RF', number: 99, stats: 'HR: 12, AVG: .310, RBI: 28' },
    2: { id: 2, name: 'Giancarlo Stanton', position: 'DH', number: 27, stats: 'HR: 8, AVG: .295, RBI: 22' },
  },
  bos: {
    3: { id: 3, name: 'Rafael Devers', position: '3B', number: 11, stats: 'HR: 8, AVG: .280, RBI: 19' },
    4: { id: 4, name: 'Xander Bogaerts', position: 'SS', number: 2, stats: 'HR: 4, AVG: .310, RBI: 15' },
  },
  laa: {
    5: { id: 5, name: 'Mike Trout', position: 'CF', number: 27, stats: 'HR: 10, AVG: .320, RBI: 25' },
    6: { id: 6, name: 'Shohei Ohtani', position: 'P/DH', number: 17, stats: 'HR: 7, ERA: 2.45, RBI: 18' },
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId, playerId } = req.query;
  if (!teamId || typeof teamId !== 'string' || !playerId || typeof playerId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid teamId/playerId' });
  }
  const stats = playerStats[teamId]?.[playerId];
  if (!stats) return res.status(404).json({ error: 'Player not found' });
  res.status(200).json(stats);
}
