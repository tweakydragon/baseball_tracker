import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const resp = await fetch('http://historical-stats:8000/teams');
    if (!resp.ok) throw new Error('Failed to fetch teams from backend');
    const teams = await resp.json();
    res.status(200).json(teams);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch teams from backend', details: String(err) });
  }
}