import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import FantasyPointsTable from '../components/FantasyPointsTable';

// Team color mapping for gradient backgrounds
const TEAM_COLORS: Record<string, string[]> = {
  nyy: ['#132448', '#ffffff'], // Yankees: navy, white
  bos: ['#bd3039', '#0c2340'], // Red Sox: red, navy
  laa: ['#ba0021', '#003263'], // Angels: red, blue
};

export default function PlayerProfile() {
  const router = useRouter();
  const { playerId } = router.query;
  const [profile, setProfile] = useState<any>(null);
  const [fantasy, setFantasy] = useState<any>(null);
  const [leagueRanks, setLeagueRanks] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/player/${playerId}`).then(res => res.json()),
      fetch(`/api/player/${playerId}/fantasy`).then(res => res.json()),
      fetch(`/api/player/${playerId}/fantasy-league-ranks`).then(res => res.json()),
    ]).then(([profile, fantasy, leagueRanks]) => {
      setProfile(profile);
      setFantasy(fantasy);
      setLeagueRanks(leagueRanks);
      setLoading(false);
    });
  }, [playerId]);

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!profile) return <div style={{ padding: 40 }}>Player not found.</div>;

  const colors = TEAM_COLORS[profile.team] || ['#e0e0e0', '#ffffff'];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(to top, ${colors[0]} 0%, ${colors[1]} 40%, #fff 100%)`,
        color: '#222',
        padding: 0,
        margin: 0,
      }}
    >
      <div style={{ maxWidth: 700, margin: '0 auto', background: 'rgba(255,255,255,0.95)', borderRadius: 16, boxShadow: '0 2px 16px #0001', marginTop: 40, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <img src={profile.image} alt={profile.name} style={{ width: 160, height: 160, borderRadius: '50%', objectFit: 'cover', border: `4px solid ${colors[0]}` }} />
          <div>
            <h1 style={{ margin: 0 }}>{profile.name}</h1>
            <p style={{ margin: '8px 0' }}>{profile.bio}</p>
            <p style={{ fontWeight: 'bold', fontSize: 18 }}>{profile.stats}</p>
          </div>
        </div>
        <h2 style={{ marginTop: 32 }}>Fantasy Points Breakdown</h2>
        {fantasy && fantasy.breakdown && (
          <FantasyPointsTable breakdown={fantasy.breakdown} leagueRanks={leagueRanks} />
        )}
        <h2 style={{ marginTop: 32 }}>Recent Games</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8 }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Opponent</th>
              <th>Result</th>
              <th>HR</th>
              <th>RBI</th>
            </tr>
          </thead>
          <tbody>
            {profile.recentGames.map((g: any, idx: number) => (
              <tr key={idx}>
                <td>{g.date}</td>
                <td>{g.opponent}</td>
                <td>{g.result}</td>
                <td>{g.hr}</td>
                <td>{g.rbi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
