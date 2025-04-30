use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use std::time::Duration;
use tokio::time;
use reqwest::Client;
use serde_json::{json, Value};
use tracing::{info, error, warn, debug, instrument};
use tracing_subscriber;
use tokio_postgres::NoTls;
use std::env;

async fn health() -> impl Responder {
    // Get DB URL from env or use default
    let db_url = env::var("DATABASE_URL").unwrap_or_else(|_| "postgres://postgres:postgres@database:5432/baseball_stats".to_string());
    // Try to connect to the database and run a simple query
    let db_status = match tokio_postgres::connect(&db_url, NoTls).await {
        Ok((client, connection)) => {
            // Spawn the connection to drive it
            tokio::spawn(connection);
            match client.simple_query("SELECT 1").await {
                Ok(_) => "ok",
                Err(_) => "error",
            }
        },
        Err(_) => "error",
    };
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "database": db_status
    }))
}

async fn upsert_team_stats(client: &Client, team_abbr: &str, season_year: i32, wins: i32, losses: i32, is_live: bool) {
    let payload = json!({
        "team": team_abbr.to_uppercase(),
        "season_year": season_year,
        "wins": wins,
        "losses": losses,
        "is_live": is_live
    });
    let _ = client.post("http://historical-stats:8000/upsert/team_stats")
        .json(&payload)
        .send()
        .await;
}

async fn upsert_player_stats(client: &Client, player_id: i32, season_year: i32, stat_json: serde_json::Value, is_live: bool) {
    let payload = json!({
        "player_id": player_id,
        "season_year": season_year,
        "stat_json": stat_json,
        "is_live": is_live
    });
    let _ = client.post("http://historical-stats:8000/upsert/player_stats")
        .json(&payload)
        .send()
        .await;
}

async fn upsert_team_schedule(client: &Client, team_abbr: &str, game_date: &str, opponent_abbr: &str, location: &str, status: &str, is_live: bool) {
    let payload = json!({
        "team": team_abbr.to_uppercase(),
        "game_date": game_date,
        "opponent": opponent_abbr.to_uppercase(),
        "location": location,
        "status": status,
        "is_live": is_live
    });
    let _ = client.post("http://historical-stats:8000/upsert/team_schedule")
        .json(&payload)
        .send()
        .await;
}

async fn upsert_player_injury(client: &Client, player_id: i32, injury: &str, status: &str, expected_return: &str, is_live: bool) {
    let payload = json!({
        "player_id": player_id,
        "injury": injury,
        "status": status,
        "expected_return": expected_return,
        "is_live": is_live
    });
    let _ = client.post("http://historical-stats:8000/upsert/player_injury")
        .json(&payload)
        .send()
        .await;
}

// Example scoring rules
fn calculate_fantasy_points(stats: &Value) -> f64 {
    let hr = stats["homeRuns"].as_i64().unwrap_or(0);
    let rbi = stats["rbi"].as_i64().unwrap_or(0);
    let sb = stats["stolenBases"].as_i64().unwrap_or(0);
    let runs = stats["runs"].as_i64().unwrap_or(0);
    let hits = stats["hits"].as_i64().unwrap_or(0);
    // Example: HR=4, RBI=1, SB=2, R=1, H=0.5
    // Fix: convert all operands to f64 before adding
    (hr as f64 * 4.0 + rbi as f64 * 1.0 + sb as f64 * 2.0 + runs as f64 * 1.0 + hits as f64 * 0.5)
}

async fn fetch_and_upsert_fantasy_points(client: &Client, player_id: i32, season: i32) {
    let url = format!("https://statsapi.mlb.com/api/v1/people/{}/stats?stats=gameLog&season={}", player_id, season);
    if let Ok(resp) = client.get(&url).send().await {
        if let Ok(json_resp) = resp.json::<Value>().await {
            if let Some(games) = json_resp["stats"][0]["splits"].as_array() {
                let mut total_points = 0.0;
                let mut game_count = 0;
                for game in games {
                    let stat = &game["stat"];
                    let game_date = game["date"].as_str().unwrap_or("");
                    let points = calculate_fantasy_points(stat);
                    total_points += points;
                    game_count += 1;
                    // Upsert per-game fantasy points
                    let payload = json!({
                        "player_id": player_id,
                        "game_date": game_date,
                        "points": points,
                        "stat_json": stat,
                        "is_live": true
                    });
                    let _ = client.post("http://historical-stats:8000/upsert/player_fantasy_points")
                        .json(&payload)
                        .send()
                        .await;
                }
                // Upsert season summary
                if game_count > 0 {
                    let avg_points = total_points / game_count as f64;
                    let payload = json!({
                        "player_id": player_id,
                        "season_year": season,
                        "total_points": total_points,
                        "avg_points": avg_points,
                        "stat_json": {}, // Optionally aggregate season stats
                        "is_live": true
                    });
                    let _ = client.post("http://historical-stats:8000/upsert/player_fantasy_season")
                        .json(&payload)
                        .send()
                        .await;
                }
            }
        }
    }
}

#[instrument]
async fn poll_and_update_stats() {
    let client = Client::new();
    loop {
        info!(service = "data-pipeline", "Polling and updating stats...");
        // Example: Fetch from source API (replace with real fetch)
        upsert_team_stats(&client, "NYY", 2025, 15, 8, true).await;
        upsert_player_stats(&client, 1, 2025, json!({"name": "Aaron Judge", "stat": "HR: 12"}), true).await;
        upsert_team_schedule(&client, "NYY", "2025-05-01", "BOS", "Home", "Scheduled", true).await;
        upsert_player_injury(&client, 1, "Hamstring", "Day-to-day", "2025-05-05", true).await;
        fetch_and_upsert_fantasy_points(&client, 1, 2025).await;
        // ...repeat for other teams/players...
        tokio::time::sleep(std::time::Duration::from_secs(3600)).await;
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter("info")
        .json()
        .init();
    info!(service = "data-pipeline", "Starting data-pipeline service...");
    // Start polling in the background
    tokio::spawn(async {
        info!(service = "data-pipeline", "Starting background polling for stats...");
        poll_and_update_stats().await;
    });
    HttpServer::new(|| {
        App::new()
            .route("/health", web::get().to(health))
    })
    .bind(("0.0.0.0", 8081))?
    .run()
    .await
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_health() {
        // TODO: Implement unit test for health endpoint
        assert_eq!(2 + 2, 4);
    }
}