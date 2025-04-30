import { useEffect, useState } from 'react';
import Link from 'next/link';

function getFireGlow(rank: number) {
  if (rank === undefined || rank > 10) return '';
  // The closer to 1, the more intense
  const intensity = 1 + (10 - rank) * 0.25;
  return `0 0 ${8 * intensity}px 2px rgba(255,0,0,${0.3 + 0.07 * (11 - rank)}), 0 0 ${16 * intensity}px 4px rgba(255,140,0,${0.2 + 0.05 * (11 - rank)})`;
}

export interface FantasyPointsTableProps {
  breakdown: Array<{
    stat: string;
    value: number;
    pointsPerUnit: number;
    points: number;
  }>;
  leagueRanks: Record<string, number>;
}

function FantasyPointsTable({ breakdown, leagueRanks }: FantasyPointsTableProps) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
      <thead>
        <tr>
          <th>Stat</th>
          <th>Value</th>
          <th>Points/Unit</th>
          <th>Fantasy Points</th>
        </tr>
      </thead>
      <tbody>
        {breakdown.map((row: any) => (
          <tr key={row.stat}>
            <td>{row.stat}</td>
            <td style={{
              fontWeight: 'bold',
              boxShadow: getFireGlow(leagueRanks[row.stat]),
              borderRadius: 6,
              background: leagueRanks[row.stat] && leagueRanks[row.stat] <= 10 ? 'rgba(255,0,0,0.07)' : undefined,
              color: leagueRanks[row.stat] && leagueRanks[row.stat] <= 3 ? '#d32f2f' : undefined,
              transition: 'box-shadow 0.3s',
            }}>{row.value}</td>
            <td>{row.pointsPerUnit}</td>
            <td>{row.points}</td>
          </tr>
        ))}
        <tr>
          <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</td>
          <td style={{ fontWeight: 'bold', fontSize: 18 }}>{breakdown.reduce((sum: number, r: any) => sum + r.points, 0)}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default FantasyPointsTable;