import { useEffect, useState } from 'react';
import Link from 'next/link';

const TEAMS_API = '/api/teams';
const TEAM_RECORD_API = (teamId: string) => `/api/teams/${teamId}/record`;
const TEAM_TOP_PLAYERS_API = (teamId: string) => `/api/teams/${teamId}/top-players`;
const TEAM_LIVE_GAME_API = (teamId: string) => `/api/teams/${teamId}/live-game`;
const TEAM_ROSTER_API = (teamId: string) => `/api/teams/${teamId}/roster`;
const TEAM_INJURIES_API = (teamId: string) => `/api/teams/${teamId}/injuries`;
const TEAM_SCHEDULE_API = (teamId: string) => `/api/teams/${teamId}/schedule`;

// Team color mapping for gradient backgrounds and team images
const TEAM_COLORS: Record<string, string[]> = {
  nyy: ['#132448', '#ffffff'], // Yankees: navy, white
  bos: ['#bd3039', '#0c2340'], // Red Sox: red, navy
  laa: ['#ba0021', '#003263'], // Angels: red, blue
};
const TEAM_IMAGES: Record<string, string> = {
  nyy: '/images/teams/nyy.png',
  bos: '/images/teams/bos.png',
  laa: '/images/teams/laa.png',
};

const menuOptions = [
  { key: 'record', label: 'Current Record' },
  { key: 'topPlayers', label: 'Top Players' },
  { key: 'liveGame', label: 'Live Game' },
  { key: 'roster', label: 'Roster' },
  { key: 'injuries', label: 'Injury Report' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'players', label: 'Player Stats' },
];

function DataStatusBadge({ isLive }: { isLive: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      marginLeft: 12,
      padding: '2px 10px',
      borderRadius: 12,
      background: isLive ? '#4caf50' : '#ff9800',
      color: '#fff',
      fontWeight: 600,
      fontSize: 13,
      verticalAlign: 'middle',
    }}>
      {isLive ? 'Live' : 'Archived'}
    </span>
  );
}

export default function TeamPage() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [record, setRecord] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);
  const [liveGame, setLiveGame] = useState(null);
  const [roster, setRoster] = useState([]);
  const [injuries, setInjuries] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState('record');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);

  useEffect(() => {
    fetch(TEAMS_API)
      .then(res => res.json())
      .then(setTeams);
  }, []);

  useEffect(() => {
    if (!selectedTeam) return;
    setLoading(true);
    Promise.all([
      fetch(TEAM_RECORD_API(selectedTeam)).then(res => res.json()),
      fetch(TEAM_TOP_PLAYERS_API(selectedTeam)).then(res => res.json()),
      fetch(TEAM_LIVE_GAME_API(selectedTeam)).then(res => res.json()),
      fetch(TEAM_ROSTER_API(selectedTeam)).then(res => res.json()),
      fetch(TEAM_INJURIES_API(selectedTeam)).then(res => res.json()),
      fetch(TEAM_SCHEDULE_API(selectedTeam)).then(res => res.json()),
    ]).then(([record, players, live, roster, injuries, schedule]) => {
      setRecord(record);
      setTopPlayers(players);
      setLiveGame(live && live.in_progress ? live : null);
      setRoster(roster);
      setInjuries(injuries);
      setSchedule(schedule);
      setLoading(false);
    });
    setPlayerStats(null);
    setSelectedPlayer(null);
  }, [selectedTeam]);

  useEffect(() => {
    if (activeMenu === 'players' && selectedPlayer) {
      fetch(`/api/teams/${selectedTeam}/players/${selectedPlayer}`)
        .then(res => res.json())
        .then(setPlayerStats);
    }
  }, [activeMenu, selectedPlayer, selectedTeam]);

  // Add team colors and image for background and header
  const selectedTeamObj = teams.find((t: any) => t.id === selectedTeam);
  const teamColors = TEAM_COLORS[selectedTeam] || ['#e0e0e0', '#ffffff'];
  const teamImage = TEAM_IMAGES[selectedTeam] || '/images/teams/default.png';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: selectedTeam
          ? `linear-gradient(to top, ${teamColors[0]} 0%, ${teamColors[1]} 40%, #fff 100%)`
          : '#fff',
        color: '#222',
        padding: 0,
        margin: 0,
      }}
    >
      <div style={{ display: 'flex', maxWidth: 1000, margin: '0 auto', padding: 24 }}>
        <div style={{ minWidth: 220, marginRight: 32 }}>
          <h1>Select a Team</h1>
          <select
            value={selectedTeam}
            onChange={e => {
              setSelectedTeam(e.target.value);
              setActiveMenu('record');
            }}
            style={{ fontSize: 18, padding: 8, width: '100%' }}
          >
            <option value="">-- Choose a team --</option>
            {teams.map((team: any) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          {selectedTeam && (
            <>
              <div style={{ margin: '32px 0', textAlign: 'center' }}>
                <img src={teamImage} alt={selectedTeamObj?.name} style={{ width: 100, height: 100, objectFit: 'contain', margin: '0 auto' }} />
                <div style={{ fontWeight: 'bold', fontSize: 18, marginTop: 8 }}>{selectedTeamObj?.name}</div>
              </div>
              <nav>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {menuOptions.map(opt => (
                    <li key={opt.key} style={{ marginBottom: 12 }}>
                      <button
                        style={{
                          width: '100%',
                          padding: 10,
                          background: activeMenu === opt.key ? '#1976d2' : '#f0f0f0',
                          color: activeMenu === opt.key ? '#fff' : '#222',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontWeight: activeMenu === opt.key ? 'bold' : 'normal',
                        }}
                        onClick={() => setActiveMenu(opt.key)}
                      >
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </>
          )}
        </div>
        <div style={{ flex: 1 }}>
          {loading && <p>Loading...</p>}
          {!selectedTeam && <p>Please select a team to view details.</p>}
          {selectedTeam && !loading && (
            <>
              {activeMenu === 'record' && record && (
                <div>
                  <h2>Current Record
                    <DataStatusBadge isLive={record.is_live} />
                  </h2>
                  <p>{record.wins} Wins / {record.losses} Losses</p>
                  <p style={{ fontSize: 13, color: '#888' }}>Last updated: {record.last_updated ? new Date(record.last_updated).toLocaleString() : 'N/A'}</p>
                </div>
              )}
              {activeMenu === 'topPlayers' && topPlayers && topPlayers.players && topPlayers.players.length > 0 && (
                <div>
                  <h2>Top Players
                    <DataStatusBadge isLive={topPlayers.is_live} />
                  </h2>
                  <ul>
                    {topPlayers.players.map((player: any, idx: number) => (
                      <li key={player.id || idx}>
                        {player.name} - {player.stat}
                      </li>
                    ))}
                  </ul>
                  <p style={{ fontSize: 13, color: '#888' }}>Last updated: {topPlayers.last_updated ? new Date(topPlayers.last_updated).toLocaleString() : 'N/A'}</p>
                </div>
              )}
              {activeMenu === 'liveGame' && liveGame && (
                <div style={{ border: '1px solid #ccc', padding: 16 }}>
                  <h2>Live Game</h2>
                  <p>{liveGame.opponent} - {liveGame.status}</p>
                  <table style={{ width: '100%', marginTop: 8 }}>
                    <thead>
                      <tr>
                        <th>Inning</th>
                        <th>{liveGame.teamName}</th>
                        <th>{liveGame.opponent}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveGame.scorecard.map((inning: any, idx: number) => (
                        <tr key={idx}>
                          <td>{inning.inning}</td>
                          <td>{inning.teamScore}</td>
                          <td>{inning.opponentScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {activeMenu === 'roster' && roster && roster.length > 0 && (
                <div>
                  <h2>Current Roster</h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Number</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map((player: any) => (
                        <tr key={player.id}>
                          <td>{player.name}</td>
                          <td>{player.position}</td>
                          <td>{player.number}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {activeMenu === 'injuries' && injuries && injuries.injuries && injuries.injuries.length > 0 && (
                <div>
                  <h2>Injury Report
                    <DataStatusBadge isLive={injuries.is_live} />
                  </h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Injury</th>
                        <th>Status</th>
                        <th>Expected Return</th>
                      </tr>
                    </thead>
                    <tbody>
                      {injuries.injuries.map((inj: any) => (
                        <tr key={inj.id + inj.injury}>
                          <td>{inj.player}</td>
                          <td>{inj.injury}</td>
                          <td>{inj.status}</td>
                          <td>{inj.expectedReturn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ fontSize: 13, color: '#888' }}>Last updated: {injuries.last_updated ? new Date(injuries.last_updated).toLocaleString() : 'N/A'}</p>
                </div>
              )}
              {activeMenu === 'schedule' && schedule && schedule.schedule && schedule.schedule.length > 0 && (
                <div>
                  <h2>Schedule
                    <DataStatusBadge isLive={schedule.is_live} />
                  </h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Opponent</th>
                        <th>Location</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.schedule.map((game: any) => (
                        <tr key={game.date + game.opponent}>
                          <td>{game.date}</td>
                          <td>{game.opponent}</td>
                          <td>{game.location}</td>
                          <td>{game.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ fontSize: 13, color: '#888' }}>Last updated: {schedule.last_updated ? new Date(schedule.last_updated).toLocaleString() : 'N/A'}</p>
                </div>
              )}
              {activeMenu === 'players' && (
                <div>
                  <h2>Player Stats</h2>
                  <select
                    value={selectedPlayer || ''}
                    onChange={e => setSelectedPlayer(e.target.value)}
                    style={{ fontSize: 16, padding: 6, marginBottom: 12 }}
                  >
                    <option value="">-- Select a player --</option>
                    {roster.map((player: any) => (
                      <option key={player.id} value={player.id}>{player.name}</option>
                    ))}
                  </select>
                  {playerStats && (
                    <div style={{ marginTop: 12 }}>
                      <h3>{playerStats.name}</h3>
                      <p>Position: {playerStats.position}</p>
                      <p>Number: {playerStats.number}</p>
                      <p>Stats: {playerStats.stats}</p>
                      <Link href={`/player/${playerStats.id}`}>View Full Profile</Link>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
