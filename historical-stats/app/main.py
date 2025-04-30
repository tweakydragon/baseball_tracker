import psycopg2
from fastapi import FastAPI, APIRouter
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from typing import Optional
import os

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

def get_team_record(team_id: str):
    """
    Retrieves the latest team record for the given team_id.
    Args:
        team_id (str): Team identifier
    Returns:
        dict: Team record with wins, losses, last_updated, and is_live
    """
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT wins, losses, last_updated, is_live
                FROM team_stats
                WHERE team = %s
                ORDER BY last_updated DESC
                LIMIT 1
            """, (team_id,))
            row = cur.fetchone()
            if row:
                wins, losses, last_updated, is_live = row
                return {
                    "team": team_id,
                    "wins": wins,
                    "losses": losses,
                    "last_updated": last_updated.isoformat(),
                    "is_live": is_live
                }
            # fallback: archived
            return {
                "team": team_id,
                "wins": 0,
                "losses": 0,
                "last_updated": None,
                "is_live": False
            }

def get_top_players(team_id: str):
    """
    Retrieves the top players for the given team_id.
    Args:
        team_id (str): Team identifier
    Returns:
        dict: Top players with their stats, last_updated, and is_live
    """
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT stat_json, last_updated, is_live
                FROM player_stats
                WHERE player_id IN (
                    SELECT id FROM players WHERE team = %s
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

def upsert_team_stats(team, season_year, wins, losses, is_live):
    """
    Inserts or updates team stats for the given team and season year.
    Args:
        team (str): Team identifier
        season_year (int): Season year
        wins (int): Number of wins
        losses (int): Number of losses
        is_live (bool): Whether the data is live
    """
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO team_stats (team, season_year, wins, losses, last_updated, is_live)
                VALUES (%s, %s, %s, %s, NOW(), %s)
                ON CONFLICT (team, season_year)
                DO UPDATE SET
                    wins = EXCLUDED.wins,
                    losses = EXCLUDED.losses,
                    last_updated = NOW(),
                    is_live = EXCLUDED.is_live
            """, (team, season_year, wins, losses, is_live))
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

def upsert_team_schedule(team, game_date, opponent, location, status, is_live):
    """
    Inserts or updates team schedule for the given team and game date.
    Args:
        team (str): Team identifier
        game_date (str): Game date
        opponent (str): Opponent team identifier
        location (str): Game location
        status (str): Game status
        is_live (bool): Whether the data is live
    """
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO team_schedule (team, game_date, opponent, location, status, last_updated, is_live)
                VALUES (%s, %s, %s, %s, %s, NOW(), %s)
                ON CONFLICT (team, game_date, opponent)
                DO UPDATE SET
                    location = EXCLUDED.location,
                    status = EXCLUDED.status,
                    last_updated = NOW(),
                    is_live = EXCLUDED.is_live
            """, (team, game_date, opponent, location, status, is_live))
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

def get_team_schedule(team_id: str):
    """
    Retrieves the schedule for the given team_id.
    Args:
        team_id (str): Team identifier
    Returns:
        dict: Team schedule with games, last_updated, and is_live
    """
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT game_date, opponent, location, status, last_updated, is_live
                FROM team_schedule
                WHERE team = %s
                ORDER BY game_date ASC
            """, (team_id,))
            games = []
            last_updated = None
            is_live = False
            for row in cur.fetchall():
                game_date, opponent, location, status, lu, live = row
                games.append({
                    "date": game_date.isoformat(),
                    "opponent": opponent,
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

def get_player_injuries(team_id: str):
    """
    Retrieves the player injuries for the given team_id.
    Args:
        team_id (str): Team identifier
    Returns:
        dict: Player injuries with details, last_updated, and is_live
    """
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT pi.player_id, p.name, pi.injury, pi.status, pi.expected_return, pi.last_updated, pi.is_live
                FROM player_injuries pi
                JOIN players p ON pi.player_id = p.id
                WHERE p.team = %s
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

@app.get("/teams/{team_id}/record")
def team_record(team_id: str):
    """
    Endpoint to get the team record for the given team_id.
    Args:
        team_id (str): Team identifier
    Returns:
        dict: Team record
    """
    return get_team_record(team_id)

@app.get("/teams/{team_id}/top-players")
def team_top_players(team_id: str):
    """
    Endpoint to get the top players for the given team_id.
    Args:
        team_id (str): Team identifier
    Returns:
        dict: Top players
    """
    return get_top_players(team_id)

@app.get("/teams/{team_id}/schedule")
def team_schedule(team_id: str):
    """
    Endpoint to get the team schedule for the given team_id.
    Args:
        team_id (str): Team identifier
    Returns:
        dict: Team schedule
    """
    return get_team_schedule(team_id)

@app.get("/teams/{team_id}/injuries")
def team_injuries(team_id: str):
    """
    Endpoint to get the player injuries for the given team_id.
    Args:
        team_id (str): Team identifier
    Returns:
        dict: Player injuries
    """
    return get_player_injuries(team_id)

@app.get("/health")
def health():
    """
    Endpoint to check the health status of the application.
    Returns:
        dict: Health status
    """
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