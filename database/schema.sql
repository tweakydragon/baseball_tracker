-- migrations/001_create_players.sql
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    team VARCHAR(50),
    position VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- migrations/002_create_games.sql
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    home_team VARCHAR(50),
    away_team VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store team statistics
CREATE TABLE IF NOT EXISTS team_stats (
    id SERIAL PRIMARY KEY,
    team VARCHAR(50) NOT NULL,
    season_year INT NOT NULL,
    wins INT,
    losses INT,
    last_updated TIMESTAMP NOT NULL,
    is_live BOOLEAN DEFAULT TRUE
);

ALTER TABLE team_stats ADD CONSTRAINT unique_team_season UNIQUE (team, season_year);

-- Table to store player statistics
CREATE TABLE IF NOT EXISTS player_stats (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id),
    season_year INT NOT NULL,
    stat_json JSONB NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    is_live BOOLEAN DEFAULT TRUE
);

ALTER TABLE player_stats ADD CONSTRAINT unique_player_season UNIQUE (player_id, season_year);

-- Table to track data source status
CREATE TABLE IF NOT EXISTS data_source_status (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL,
    last_successful_pull TIMESTAMP,
    last_status VARCHAR(20),
    last_checked TIMESTAMP
);

-- Table to store team schedule
CREATE TABLE IF NOT EXISTS team_schedule (
    id SERIAL PRIMARY KEY,
    team VARCHAR(50) NOT NULL,
    game_date DATE NOT NULL,
    opponent VARCHAR(50),
    location VARCHAR(20),
    status VARCHAR(20),
    last_updated TIMESTAMP NOT NULL,
    is_live BOOLEAN DEFAULT TRUE
);
ALTER TABLE team_schedule ADD CONSTRAINT unique_team_game UNIQUE (team, game_date, opponent);

-- Table to store player injuries
CREATE TABLE IF NOT EXISTS player_injuries (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id),
    injury VARCHAR(100),
    status VARCHAR(50),
    expected_return DATE,
    last_updated TIMESTAMP NOT NULL,
    is_live BOOLEAN DEFAULT TRUE
);
ALTER TABLE player_injuries ADD CONSTRAINT unique_player_injury UNIQUE (player_id, injury);

-- Table to store player fantasy points per game
CREATE TABLE IF NOT EXISTS player_fantasy_points (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id),
    game_date DATE NOT NULL,
    points NUMERIC NOT NULL,
    stat_json JSONB NOT NULL, -- stores the stat breakdown for the game
    last_updated TIMESTAMP NOT NULL,
    is_live BOOLEAN DEFAULT TRUE
);
ALTER TABLE player_fantasy_points ADD CONSTRAINT unique_player_game UNIQUE (player_id, game_date);

-- Table to store player fantasy season summary
CREATE TABLE IF NOT EXISTS player_fantasy_season (
    id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(id),
    season_year INT NOT NULL,
    total_points NUMERIC NOT NULL,
    avg_points NUMERIC NOT NULL,
    stat_json JSONB NOT NULL, -- stores the stat breakdown for the season
    last_updated TIMESTAMP NOT NULL,
    is_live BOOLEAN DEFAULT TRUE
);
ALTER TABLE player_fantasy_season ADD CONSTRAINT unique_player_season_fantasy UNIQUE (player_id, season_year);

-- Add more migrations as needed
