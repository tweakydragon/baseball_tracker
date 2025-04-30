import { NextApiRequest, NextApiResponse } from 'next';

// Mock data for demonstration
const teams = [
  { id: 'nyy', name: 'New York Yankees' },
  { id: 'bos', name: 'Boston Red Sox' },
  { id: 'laa', name: 'Los Angeles Angels' },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(teams);
}