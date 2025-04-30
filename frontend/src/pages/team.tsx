import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import 'bootstrap/dist/css/bootstrap.min.css';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());
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
  const [selectedTeam, setSelectedTeam] = useState('');
  const [record, setRecord] = useState(null);
  // Change topPlayers state to match expected object structure
  const [topPlayers, setTopPlayers] = useState<{ players: any[]; is_live?: boolean; last_updated?: string } | null>(null);
  const [liveGame, setLiveGame] = useState(null);
  const [roster, setRoster] = useState([]);
  const [injuries, setInjuries] = useState<{ injuries: any[]; is_live?: boolean; last_updated?: string } | null>(null);
  const [schedule, setSchedule] = useState<{ schedule: any[]; is_live?: boolean; last_updated?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState('record');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Mouse event handlers for slide-out menu
  const menuAreaRef = useRef<HTMLDivElement>(null);
  const [isMouseInMenu, setIsMouseInMenu] = useState(false);

  // Keep menu open as long as mouse is in menu area or menu is pinned
  useEffect(() => {
    setMenuOpen(isMouseInMenu || isPinned);
  }, [isMouseInMenu, isPinned]);

  // Fetch teams from backend
  const { data: teams = [], isLoading: teamsLoading } = useSWR('/api/teams', fetcher);

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
    ]).then(([record, players, live, roster, injuriesData, scheduleData]) => {
      setRecord(record);
      setTopPlayers(players);
      setLiveGame(live && live.in_progress ? live : null);
      setRoster(roster);
      setInjuries({ injuries: injuriesData });
      setSchedule({ schedule: scheduleData });
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

  // Determine menu background color
  const menuBgColor = selectedTeam ? (TEAM_COLORS[selectedTeam]?.[0] || '#132448') : '#132448';

  // When displaying opponent in schedule, map opponent_id to abbreviation/name if needed
  function getTeamNameOrAbbr(teamIdOrAbbr: string | number) {
    if (typeof teamIdOrAbbr === 'string') {
      const team = teams.find((t: any) => t.abbreviation === teamIdOrAbbr.toUpperCase());
      return team ? team.name : teamIdOrAbbr;
    }
    const team = teams.find((t: any) => t.id === teamIdOrAbbr);
    return team ? team.name : teamIdOrAbbr;
  }

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
        fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      }}
    >
      {/* Hamburger trigger area */}
      <div
        style={{ position: 'fixed', left: 0, top: 0, width: 40, height: '100vh', zIndex: 1050 }}
        onMouseEnter={() => setIsMouseInMenu(true)}
      />
      {/* Slide-out menu area */}
      <div
        ref={menuAreaRef}
        className={`offcanvas offcanvas-start${menuOpen ? ' show' : ''}`}
        tabIndex={-1}
        style={{
          width: 250,
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
          zIndex: 1060,
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          background: menuBgColor,
          color: '#fff',
          boxShadow: '2px 0 8px #0002',
          fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
        }}
        onMouseEnter={() => setIsMouseInMenu(true)}
        onMouseLeave={() => setIsMouseInMenu(false)}
      >
        <div className="offcanvas-header d-flex align-items-center justify-content-between p-3 border-bottom">
          <span style={{ fontWeight: 'bold', fontSize: 20 }}>Menu</span>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className={`btn btn-sm ${isPinned ? 'btn-success' : 'btn-outline-light'}`}
              title={isPinned ? 'Unpin menu' : 'Pin menu'}
              onClick={() => setIsPinned(p => !p)}
              style={{ marginRight: 8 }}
            >
              {isPinned ? '📌' : '📍'}
            </button>
            <button type="button" className="btn-close" aria-label="Close" onClick={() => { setIsPinned(false); setMenuOpen(false); }}></button>
          </div>
        </div>
        {/* Team Picker moved to menu */}
        <div className="p-3 border-bottom">
          <h6 className="text-white">Select a Team</h6>
          <select
            value={selectedTeam}
            onChange={e => {
              setSelectedTeam(e.target.value);
              setActiveMenu('record');
            }}
            className="form-select"
            style={{ fontSize: 16, marginBottom: 8 }}
          >
            <option value="">-- Choose a team --</option>
            {teams.map((team: any) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          {selectedTeam && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <img src={teamImage} alt={selectedTeamObj?.name} style={{ width: 60, height: 60, objectFit: 'contain', margin: '0 auto' }} />
              <div style={{ fontWeight: 'bold', fontSize: 16, marginTop: 4 }}>{selectedTeamObj?.name}</div>
            </div>
          )}
        </div>
        <nav className="offcanvas-body p-3">
          <ul className="nav flex-column">
            {/* Only show menu options if a team is selected */}
            {selectedTeam && menuOptions.map(opt => (
              <li className="nav-item mb-2" key={opt.key}>
                <button
                  className={`btn w-100 text-start ${activeMenu === opt.key ? 'btn-primary' : 'btn-outline-light'}`}
                  onClick={() => setActiveMenu(opt.key)}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {/* Main content area, centered and modernized */}
      <div
        style={{
          minHeight: '100vh',
          marginLeft: 250,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
          background: 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 700,
            background: 'rgba(255,255,255,0.97)',
            borderRadius: 18,
            boxShadow: '0 4px 32px #0002',
            padding: 40,
            margin: '40px 0',
            fontSize: 18,
            fontWeight: 400,
            color: '#222',
            letterSpacing: 0.01,
          }}
        >
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
                          <td>{getTeamNameOrAbbr(game.opponent_id || game.opponent)}</td>
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
