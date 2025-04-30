import psycopg2
from fastapi import FastAPI, APIRouter
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from typing import Optional
import os
import logging
import structlog
import sys

logging.basicConfig(format="%(message)s", stream=sys.stdout, level=logging.INFO)
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_log_level,
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)
logger = structlog.get_logger()

logger.info("Starting historical-stats service", service="historical-stats")

app = FastAPI()
router = APIRouter()

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/baseball_stats")

def get_db_conn():
    """
    Establishes and returns a new database connection using the configured DB_URL.
    Returns:
        psycopg2 connection object
    """
    return psycopg2.connect(DB_URL)

def get_team_id_by_abbr(abbr):
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM teams WHERE abbreviation = %s", (abbr.upper(),))
            row = cur.fetchone()
            if row:
                return row[0]
            raise ValueError(f"Team abbreviation {abbr} not found")

def get_team_record(team_id: int):
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT wins, losses, last_updated, is_live
                FROM team_stats
                WHERE team_id = %s
                ORDER BY last_updated DESC
                LIMIT 1
            """, (team_id,))
            row = cur.fetchone()
            if row:
                wins, losses, last_updated, is_live = row
                return {
                    "team_id": team_id,
                    "wins": wins,
                    "losses": losses,
                    "last_updated": last_updated.isoformat(),
                    "is_live": is_live
                }
            return {
                "team_id": team_id,
                "wins": 0,
                "losses": 0,
                "last_updated": None,
                "is_live": False
            }

def get_top_players(team_id: int):
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT stat_json, last_updated, is_live
                FROM player_stats
                WHERE player_id IN (
                    SELECT id FROM players WHERE team_id = %s
                )
                ORDER BY last_updated DESC
                LIMIT 5
            """, (team_id,))
            players = []
            last_updated = None
            is_live = False
            for row in cur.fetchall():
                stat_json, lu, live = row
                players.append(stat_json)
                if not last_updated or lu > last_updated:
                    last_updated = lu
                is_live = is_live or live
            return {
                "players": players,
                "last_updated": last_updated.isoformat() if last_updated else None,
                "is_live": is_live
            }

def upsert_team_stats(team_abbr, season_year, wins, losses, is_live):
    team_id = get_team_id_by_abbr(team_abbr)
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO team_stats (team_id, season_year, wins, losses, last_updated, is_live)
                VALUES (%s, %s, %s, %s, NOW(), %s)
                ON CONFLICT (team_id, season_year)
                DO UPDATE SET
                    wins = EXCLUDED.wins,
                    losses = EXCLUDED.losses,
                    last_updated = NOW(),
                    is_live = EXCLUDED.is_live
            """, (team_id, season_year, wins, losses, is_live))
        conn.commit()

def upsert_team_schedule(team_abbr, game_date, opponent_abbr, location, status, is_live):
    team_id = get_team_id_by_abbr(team_abbr)
    opponent_id = get_team_id_by_abbr(opponent_abbr)
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO team_schedule (team_id, game_date, opponent_id, location, status, last_updated, is_live)
                VALUES (%s, %s, %s, %s, %s, NOW(), %s)
                ON CONFLICT (team_id, game_date, opponent_id)
                DO UPDATE SET
                    location = EXCLUDED.location,
                    status = EXCLUDED.status,
                    last_updated = NOW(),
                    is_live = EXCLUDED.is_live
            """, (team_id, game_date, opponent_id, location, status, is_live))
        conn.commit()

def upsert_player_stats(player_id, season_year, stat_json, is_live):
    """
    Inserts or updates player stats for the given player and season year.
    Args:
        player_id (int): Player identifier
        season_year (int): Season year
        stat_json (dict): Player stats in JSON format
        is_live (bool): Whether the data is live
    """
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO player_stats (player_id, season_year, stat_json, last_updated, is_live)
                VALUES (%s, %s, %s, NOW(), %s)
                ON CONFLICT (player_id, season_year)
                DO UPDATE SET
                    stat_json = EXCLUDED.stat_json,
                    last_updated = NOW(),
                    is_live = EXCLUDED.is_live
            """, (player_id, season_year, stat_json, is_live))
        conn.commit()

def upsert_player_injury(player_id, injury, status, expected_return, is_live):
    """
    Inserts or updates player injury information.
    Args:
        player_id (int): Player identifier
        injury (str): Injury description
        status (str): Injury status
        expected_return (str): Expected return date
        is_live (bool): Whether the data is live
    """
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO player_injuries (player_id, injury, status, expected_return, last_updated, is_live)
                VALUES (%s, %s, %s, %s, NOW(), %s)
                ON CONFLICT (player_id, injury)
                DO UPDATE SET
                    status = EXCLUDED.status,
                    expected_return = EXCLUDED.expected_return,
                    last_updated = NOW(),
                    is_live = EXCLUDED.is_live
            """, (player_id, injury, status, expected_return, is_live))
        conn.commit()

def get_team_schedule(team_id: int):
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT game_date, opponent_id, location, status, last_updated, is_live
                FROM team_schedule
                WHERE team_id = %s
                ORDER BY game_date ASC
            """, (team_id,))
            games = []
            last_updated = None
            is_live = False
            for row in cur.fetchall():
                game_date, opponent_id, location, status, lu, live = row
                games.append({
                    "date": game_date.isoformat(),
                    "opponent_id": opponent_id,
                    "location": location,
                    "status": status
                })
                if not last_updated or lu > last_updated:
                    last_updated = lu
                is_live = is_live or live
            return {
                "schedule": games,
                "last_updated": last_updated.isoformat() if last_updated else None,
                "is_live": is_live
            }

def get_player_injuries(team_id: int):
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT pi.player_id, p.name, pi.injury, pi.status, pi.expected_return, pi.last_updated, pi.is_live
                FROM player_injuries pi
                JOIN players p ON pi.player_id = p.id
                WHERE p.team_id = %s
            """, (team_id,))
            injuries = []
            last_updated = None
            is_live = False
            for row in cur.fetchall():
                player_id, name, injury, status, expected_return, lu, live = row
                injuries.append({
                    "id": player_id,
                    "player": name,
                    "injury": injury,
                    "status": status,
                    "expectedReturn": expected_return.isoformat() if expected_return else None
                })
                if not last_updated or lu > last_updated:
                    last_updated = lu
                is_live = is_live or live
            return {
                "injuries": injuries,
                "last_updated": last_updated.isoformat() if last_updated else None,
                "is_live": is_live
            }

def is_db_empty():
    """
    Checks if the database is empty by counting records in key tables.
    Returns:
        bool: True if the database is empty, False otherwise
    """
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM team_stats")
            team_stats_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM player_stats")
            player_stats_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM team_schedule")
            schedule_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM player_injuries")
            injuries_count = cur.fetchone()[0]
            return (team_stats_count + player_stats_count + schedule_count + injuries_count) == 0

@app.on_event("startup")
def check_and_seed_db():
    """
    Checks if the database is empty and seeds it with initial data if necessary.
    """
    if is_db_empty():
        # TODO: Replace with real fetch and upsert logic
        print("Database is empty. Pulling in fresh data...")
        upsert_team_stats("nyy", 2025, 15, 8, True)
        upsert_player_stats(1, 2025, {"name": "Aaron Judge", "stat": "HR: 12"}, True)
        upsert_team_schedule("nyy", "2025-05-01", "BOS", "Home", "Scheduled", True)
        upsert_player_injury(1, "Hamstring", "Day-to-day", "2025-05-05", True)
        # ...repeat for other teams/players as needed...

@app.get("/teams/{team_abbr}/record")
def team_record(team_abbr: str):
    team_id = get_team_id_by_abbr(team_abbr)
    return get_team_record(team_id)

@app.get("/teams/{team_abbr}/top-players")
def team_top_players(team_abbr: str):
    team_id = get_team_id_by_abbr(team_abbr)
    return get_top_players(team_id)

@app.get("/teams/{team_abbr}/schedule")
def team_schedule(team_abbr: str):
    team_id = get_team_id_by_abbr(team_abbr)
    return get_team_schedule(team_id)

@app.get("/teams/{team_abbr}/injuries")
def team_injuries(team_abbr: str):
    team_id = get_team_id_by_abbr(team_abbr)
    return get_player_injuries(team_id)

@app.get("/health")
def health():
    logger.info("Health check endpoint called", endpoint="/health")
    return {"status": "healthy"}

def get_fantasy_breakdown(player_id: int, season_year: int = 2025):
    """
    Retrieves the fantasy breakdown for the given player and season year.
    Args:
        player_id (int): Player identifier
        season_year (int): Season year
    Returns:
        dict: Fantasy breakdown with stats and points
    """
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT stat_json, points, game_date
                FROM player_fantasy_points
                WHERE player_id = %s AND EXTRACT(YEAR FROM game_date) = %s
                ORDER BY game_date DESC
                LIMIT 1
            """, (player_id, season_year))
            row = cur.fetchone()
            if not row:
                return None
            stat_json, points, game_date = row
            # Example breakdown (should match your scoring rules)
            breakdown = [
                {"stat": "Home Runs", "value": stat_json.get("homeRuns", 0), "pointsPerUnit": 4, "points": stat_json.get("homeRuns", 0) * 4},
                {"stat": "RBI", "value": stat_json.get("rbi", 0), "pointsPerUnit": 1, "points": stat_json.get("rbi", 0) * 1},
                {"stat": "Stolen Bases", "value": stat_json.get("stolenBases", 0), "pointsPerUnit": 2, "points": stat_json.get("stolenBases", 0) * 2},
                {"stat": "Runs", "value": stat_json.get("runs", 0), "pointsPerUnit": 1, "points": stat_json.get("runs", 0) * 1},
                {"stat": "Hits", "value": stat_json.get("hits", 0), "pointsPerUnit": 0.5, "points": stat_json.get("hits", 0) * 0.5},
            ]
            return {"breakdown": breakdown, "total": points, "game_date": game_date}

def get_league_ranks(season_year: int = 2025):
    """
    Retrieves the league ranks for various stats for the given season year.
    Args:
        season_year (int): Season year
    Returns:
        dict: League ranks for each stat
    """
    # Returns a dict: {stat_name: {player_id: rank}}
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            stats = ["homeRuns", "rbi", "stolenBases", "runs", "hits"]
            league_ranks = {stat: {} for stat in stats}
            for stat in stats:
                cur.execute(f"""
                    SELECT player_id, stat_json->>'{stat}' AS value
                    FROM player_fantasy_points
                    WHERE EXTRACT(YEAR FROM game_date) = %s
                """, (season_year,))
                rows = cur.fetchall()
                # Sort and rank
                sorted_rows = sorted(rows, key=lambda r: int(r[1] or 0), reverse=True)
                for rank, (player_id, value) in enumerate(sorted_rows, 1):
                    league_ranks[stat][int(player_id)] = rank
            return league_ranks

@router.get("/api/player/{player_id}/fantasy")
def player_fantasy_breakdown(player_id: int):
    """
    Endpoint to get the fantasy breakdown for the given player_id.
    Args:
        player_id (int): Player identifier
    Returns:
        dict: Fantasy breakdown
    """
    breakdown = get_fantasy_breakdown(player_id)
    if not breakdown:
        return JSONResponse(status_code=404, content={"error": "No fantasy data found"})
    return breakdown

@router.get("/api/player/{player_id}/fantasy-league-ranks")
def player_fantasy_league_ranks(player_id: int):
    """
    Endpoint to get the fantasy league ranks for the given player_id.
    Args:
        player_id (int): Player identifier
    Returns:
        dict: Fantasy league ranks
    """
    league_ranks = get_league_ranks()
    # For this player, return {stat: rank}
    player_ranks = {stat: league_ranks[stat].get(player_id) for stat in league_ranks}
    return player_ranks

def create_app():
    """
    Creates and returns a FastAPI application with the included router.
    Returns:
        FastAPI application
    """
    app = FastAPI()
    app.include_router(router)
    return app

app = create_app()