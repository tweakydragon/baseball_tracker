import { NextApiRequest, NextApiResponse } from 'next';

const liveGames = {
  nyy: {
    in_progress: true,
    teamName: 'New York Yankees',
    opponent: 'Boston Red Sox',
    status: 'Top 6th',
    scorecard: [
      { inning: 1, teamScore: 0, opponentScore: 1 },
      { inning: 2, teamScore: 2, opponentScore: 0 },
      { inning: 3, teamScore: 0, opponentScore: 0 },
      { inning: 4, teamScore: 1, opponentScore: 0 },
      { inning: 5, teamScore: 0, opponentScore: 1 },
      { inning: 6, teamScore: 1, opponentScore: 0 },
    ],
  },
  bos: {
    in_progress: false,
  },
  laa: {
    in_progress: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = req.query;
  if (!teamId || typeof teamId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid teamId' });
  }
  res.status(200).json(liveGames[teamId] || { in_progress: false });
}
