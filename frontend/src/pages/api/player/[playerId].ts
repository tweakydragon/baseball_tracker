import { NextApiRequest, NextApiResponse } from 'next';

const playerProfiles = {
  1: {
    id: 1,
    name: 'Aaron Judge',
    team: 'nyy',
    image: '/images/players/aaron_judge.png',
    bio: 'Aaron Judge is an outfielder for the New York Yankees.',
    stats: 'HR: 12, AVG: .310, RBI: 28',
    recentGames: [
      { date: '2025-04-28', opponent: 'BOS', result: 'W 5-3', hr: 1, rbi: 2 },
      { date: '2025-04-27', opponent: 'BOS', result: 'L 2-4', hr: 0, rbi: 0 },
    ],
  },
  2: {
    id: 2,
    name: 'Giancarlo Stanton',
    team: 'nyy',
    image: '/images/players/giancarlo_stanton.png',
    bio: 'Giancarlo Stanton is a designated hitter for the New York Yankees.',
    stats: 'HR: 8, AVG: .295, RBI: 22',
    recentGames: [
      { date: '2025-04-28', opponent: 'BOS', result: 'W 5-3', hr: 0, rbi: 1 },
      { date: '2025-04-27', opponent: 'BOS', result: 'L 2-4', hr: 1, rbi: 2 },
    ],
  },
  3: {
    id: 3,
    name: 'Rafael Devers',
    team: 'bos',
    image: '/images/players/rafael_devers.png',
    bio: 'Rafael Devers is a third baseman for the Boston Red Sox.',
    stats: 'HR: 8, AVG: .280, RBI: 19',
    recentGames: [
      { date: '2025-04-28', opponent: 'NYY', result: 'L 3-5', hr: 0, rbi: 1 },
      { date: '2025-04-27', opponent: 'NYY', result: 'W 4-2', hr: 1, rbi: 2 },
    ],
  },
  4: {
    id: 4,
    name: 'Xander Bogaerts',
    team: 'bos',
    image: '/images/players/xander_bogaerts.png',
    bio: 'Xander Bogaerts is a shortstop for the Boston Red Sox.',
    stats: 'HR: 4, AVG: .310, RBI: 15',
    recentGames: [
      { date: '2025-04-28', opponent: 'NYY', result: 'L 3-5', hr: 0, rbi: 0 },
      { date: '2025-04-27', opponent: 'NYY', result: 'W 4-2', hr: 0, rbi: 1 },
    ],
  },
  5: {
    id: 5,
    name: 'Mike Trout',
    team: 'laa',
    image: '/images/players/mike_trout.png',
    bio: 'Mike Trout is a center fielder for the Los Angeles Angels.',
    stats: 'HR: 10, AVG: .320, RBI: 25',
    recentGames: [
      { date: '2025-04-28', opponent: 'BOS', result: 'W 6-2', hr: 2, rbi: 3 },
      { date: '2025-04-27', opponent: 'BOS', result: 'L 1-3', hr: 0, rbi: 0 },
    ],
  },
  6: {
    id: 6,
    name: 'Shohei Ohtani',
    team: 'laa',
    image: '/images/players/shohei_ohtani.png',
    bio: 'Shohei Ohtani is a pitcher and designated hitter for the Los Angeles Angels.',
    stats: 'HR: 7, ERA: 2.45, RBI: 18',
    recentGames: [
      { date: '2025-04-28', opponent: 'BOS', result: 'W 6-2', hr: 1, rbi: 2 },
      { date: '2025-04-27', opponent: 'BOS', result: 'L 1-3', hr: 0, rbi: 0 },
    ],
  },
  7: {
    id: 7,
    name: 'Austin Riley',
    team: 'atl',
    image: '/images/players/austin_riley.png',
    bio: 'Austin Riley is a third baseman for the Atlanta Braves.',
    stats: 'HR: 9, AVG: .285, RBI: 27',
    recentGames: [
      { date: '2025-04-28', opponent: 'NYM', result: 'W 6-4', hr: 1, rbi: 3 },
      { date: '2025-04-27', opponent: 'NYM', result: 'L 2-5', hr: 0, rbi: 0 },
    ],
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { playerId } = req.query;
  if (!playerId || typeof playerId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid playerId' });
  }
  const profile = playerProfiles[playerId];
  if (!profile) return res.status(404).json({ error: 'Player not found' });
  res.status(200).json(profile);
}
