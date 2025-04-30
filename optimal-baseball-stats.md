# Baseball Stats Application - Polyglot Microservices Implementation

A comprehensive, high-performance baseball statistics application using a microservices architecture with specialized languages for each component.

## Architecture Overview

![Architecture Diagram](https://raw.githubusercontent.com/yourusername/baseball-stats/main/docs/architecture.png)

This application uses a polyglot microservices architecture with these key components:

1. **Data Pipeline Service** (Rust) - Ingests and processes MLB data
2. **API Gateway** (Go) - Routes requests and handles authentication
3. **Historical Stats Service** (Python/FastAPI) - Provides analytics and historical data
4. **Real-time Game Service** (Elixir/Phoenix) - Delivers live game updates
5. **Recommendation Engine** (Python) - Generates personalized insights
6. **Frontend Application** (Next.js/React) - User interface with data visualization
7. **Caching Layer** (Redis) - Improves performance and supports real-time features

## Project Structure

```
baseball-stats/
├── api-gateway/                  # Go service for routing and auth
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   ├── internal/
│   │   ├── auth/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   └── router/
│   ├── Dockerfile
│   └── go.mod
├── data-pipeline/                # Rust service for data ingestion
│   ├── src/
│   │   ├── main.rs
│   │   ├── models/
│   │   ├── extractors/
│   │   ├── transformers/
│   │   └── loaders/
│   ├── Cargo.toml
│   └── Dockerfile
├── historical-stats/             # Python/FastAPI service
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   ├── requirements.txt
│   └── Dockerfile
├── realtime-game/                # Elixir/Phoenix service
│   ├── lib/
│   │   ├── realtime/
│   │   └── realtime_web/
│   ├── mix.exs
│   └── Dockerfile
├── recommendation-engine/        # Python ML service
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── trainers/
│   │   └── predictors/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                     # Next.js application
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   ├── public/
│   ├── next.config.js
│   └── Dockerfile
├── database/                     # Database migrations and schema
│   ├── migrations/
│   └── schema.sql
├── docker-compose.yml            # Development environment
├── docker-compose.prod.yml       # Production configuration
├── kubernetes/                   # Production deployment
│   ├── api-gateway.yaml
│   ├── data-pipeline.yaml
│   └── ...
└── README.md                     # Setup and usage instructions
```

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- [Kubernetes](https://kubernetes.io/) for production deployment
- [MLB API credentials](#mlb-api-credentials)

### Quick Start with Docker

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/baseball-stats.git
   cd baseball-stats
   ```

2. Create a `.env` file in the project root with your MLB API credentials:
   ```
   MLB_API_KEY=your_api_key_here
   MLB_API_BASE_URL=https://statsapi.mlb.com/api/v1
   ```

3. Start the application:
   ```bash
   docker-compose up
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:8080
   - API Documentation: http://localhost:8080/docs

## Core Service Implementations

### 1. Data Pipeline Service (Rust)

The data pipeline ingests MLB statistics, processes them, and stores them in the database.

#### `data-pipeline/src/main.rs`

```rust
use std::env;
use std::time::Duration;
use tokio::time;
use reqwest::Client;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

mod models;
mod extractors;
mod transformers;
mod loaders;

use extractors::mlb_api::MlbApiExtractor;
use transformers::stats_transformer::StatsTransformer;
use loaders::postgres_loader::PostgresLoader;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    env_logger::init();
    log::info!("Starting Baseball Stats Data Pipeline");

    // Load environment variables
    dotenv::dotenv().ok();
    let mlb_api_key = env::var("MLB_API_KEY").expect("MLB_API_KEY must be set");
    let mlb_api_base_url = env::var("MLB_API_BASE_URL").expect("MLB_API_BASE_URL must be set");
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    
    // Setup database connection pool
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;
    
    // Initialize components
    let client = Client::new();
    let extractor = MlbApiExtractor::new(client, mlb_api_base_url, mlb_api_key);
    let transformer = StatsTransformer::new();
    let loader = PostgresLoader::new(pool.clone());
    
    // Start the periodic data pipeline
    log::info!("Starting periodic data extraction");
    let mut interval = time::interval(Duration::from_secs(300)); // every 5 minutes
    
    loop {
        interval.tick().await;
        if let Err(e) = process_data(&extractor, &transformer, &loader).await {
            log::error!("Error processing data: {}", e);
        }
    }
}

async fn process_data(
    extractor: &MlbApiExtractor,
    transformer: &StatsTransformer,
    loader: &PostgresLoader,
) -> Result<(), Box<dyn std::error::Error>> {
    // Extract data from MLB API
    log::info!("Extracting player stats data");
    let raw_player_stats = extractor.extract_player_stats().await?;
    
    // Transform the data
    log::info!("Transforming player stats data");
    let transformed_stats = transformer.transform_player_stats(raw_player_stats)?;
    
    // Load data into database
    log::info!("Loading player stats data into database");
    loader.load_player_stats(transformed_stats).await?;
    
    log::info!("Data processing completed successfully");
    Ok(())
}
```

#### `data-pipeline/src/models/player.rs`

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::types::Decimal;
use std::collections::HashMap;

/// Represents player statistics from the MLB API
#[derive(Debug, Serialize, Deserialize)]
pub struct PlayerStats {
    /// MLB player ID
    pub player_id: i32,
    /// Player's full name
    pub player_name: String,
    /// Team abbreviation (e.g., "NYY")
    pub team: String,
    /// Player's batting average
    pub batting_average: Decimal,
    /// Number of home runs
    pub home_runs: i32,
    /// Runs batted in
    pub rbi: i32,
    /// Total hits
    pub hits: i32,
    /// At bats
    pub at_bats: i32,
    /// On-base plus slugging percentage
    pub ops: Decimal,
    /// Optional: Number of stolen bases
    pub stolen_bases: Option<i32>,
    /// Optional: Games played this season
    pub games_played: Option<i32>,
    /// When this record was created
    pub created_at: DateTime<Utc>,
    /// When this record was last updated
    pub updated_at: DateTime<Utc>,
}

/// Raw player data from the MLB API
#[derive(Debug, Deserialize)]
pub struct MlbApiPlayerStats {
    pub stats: Vec<HashMap<String, serde_json::Value>>,
    pub player: MlbApiPlayer,
    pub team: MlbApiTeam,
}

#[derive(Debug, Deserialize)]
pub struct MlbApiPlayer {
    pub id: i32,
    pub fullName: String,
    pub firstName: String,
    pub lastName: String,
}

#[derive(Debug, Deserialize)]
pub struct MlbApiTeam {
    pub id: i32,
    pub name: String,
    pub abbreviation: String,
}
```

#### `data-pipeline/Cargo.toml`

```toml
[package]
name = "baseball-stats-pipeline"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1.28.1", features = ["full"] }
reqwest = { version = "0.11.18", features = ["json"] }
serde = { version = "1.0.163", features = ["derive"] }
serde_json = "1.0.96"
sqlx = { version = "0.6.3", features = ["runtime-tokio-rustls", "postgres", "chrono", "decimal", "json"] }
chrono = { version = "0.4.24", features = ["serde"] }
log = "0.4.17"
env_logger = "0.10.0"
dotenv = "0.15.0"
```

### 2. API Gateway (Go)

The API Gateway handles routing, authentication, rate limiting, and serves as a unified entry point.

#### `api-gateway/cmd/server/main.go`

```go
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/yourusername/baseball-stats/api-gateway/internal/auth"
	"github.com/yourusername/baseball-stats/api-gateway/internal/handlers"
	"github.com/yourusername/baseball-stats/api-gateway/internal/middleware"
	"github.com/yourusername/baseball-stats/api-gateway/internal/router"
)

func main() {
	// Initialize logger
	logger := log.New(os.Stdout, "API-GATEWAY: ", log.LstdFlags)
	
	// Load configuration
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	// Initialize auth service
	authService := auth.NewJWTAuthService(os.Getenv("JWT_SECRET"))
	
	// Create handler dependencies
	handlerDeps := handlers.Dependencies{
		HistoricalStatsURL: os.Getenv("HISTORICAL_STATS_URL"),
		RealtimeGameURL:    os.Getenv("REALTIME_GAME_URL"),
		RecommendationURL:  os.Getenv("RECOMMENDATION_URL"),
		AuthService:        authService,
		Logger:             logger,
	}
	
	// Initialize handlers
	handlers := handlers.NewHandlers(handlerDeps)
	
	// Set up middleware
	middlewareManager := middleware.NewManager(
		middleware.WithLogger(logger),
		middleware.WithRateLimiter(100, 1*time.Minute), // 100 requests per minute
		middleware.WithCORS([]string{"http://localhost:3000"}),
	)
	
	// Initialize router
	r := router.New(handlers, middlewareManager)
	
	// Create server
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}
	
	// Start server in a goroutine
	go func() {
		logger.Printf("Starting API Gateway on port %s\n", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatalf("Error starting server: %v\n", err)
		}
	}()
	
	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit
	
	// Create a deadline for server shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	logger.Println("Shutting down server...")
	if err := server.Shutdown(ctx); err != nil {
		logger.Fatalf("Server forced to shutdown: %v\n", err)
	}
	
	logger.Println("Server gracefully stopped")
}
```

#### `api-gateway/internal/handlers/stats_handler.go`

```go
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"
	
	"github.com/gorilla/mux"
)

// StatsHandler handles routing to the appropriate stats service
type StatsHandler struct {
	historicalStatsURL string
	realtimeGameURL    string
	recommendationURL  string
	logger             Logger
}

// NewStatsHandler creates a new stats handler
func NewStatsHandler(deps Dependencies) *StatsHandler {
	return &StatsHandler{
		historicalStatsURL: deps.HistoricalStatsURL,
		realtimeGameURL:    deps.RealtimeGameURL,
		recommendationURL:  deps.RecommendationURL,
		logger:             deps.Logger,
	}
}

// TopBatters handles requests for top batters stats
func (h *StatsHandler) TopBatters(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	limit := r.URL.Query().Get("limit")
	if limit == "" {
		limit = "10" // Default limit
	}
	
	// Forward to historical stats service
	targetURL, err := url.Parse(h.historicalStatsURL + "/api/baseball/top-batters?limit=" + limit)
	if err != nil {
		h.logger.Printf("Error parsing URL: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	
	proxy := httputil.NewSingleHostReverseProxy(targetURL)
	proxy.ServeHTTP(w, r)
}

// LiveGameStats handles requests for real-time game statistics
func (h *StatsHandler) LiveGameStats(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["gameId"]
	
	// Forward to real-time game service
	targetURL, err := url.Parse(h.realtimeGameURL + "/api/games/" + gameID + "/live")
	if err != nil {
		h.logger.Printf("Error parsing URL: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	
	proxy := httputil.NewSingleHostReverseProxy(targetURL)
	proxy.ServeHTTP(w, r)
}

// PlayerRecommendations handles requests for player recommendations
func (h *StatsHandler) PlayerRecommendations(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	playerID := vars["playerId"]
	
	// Forward to recommendation engine
	targetURL, err := url.Parse(h.recommendationURL + "/api/recommendations/players/" + playerID)
	if err != nil {
		h.logger.Printf("Error parsing URL: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	
	proxy := httputil.NewSingleHostReverseProxy(targetURL)
	proxy.ServeHTTP(w, r)
}
```

#### `api-gateway/internal/router/router.go`

```go
package router

import (
	"net/http"
	
	"github.com/gorilla/mux"
	"github.com/yourusername/baseball-stats/api-gateway/internal/handlers"
	"github.com/yourusername/baseball-stats/api-gateway/internal/middleware"
)

// New creates a new router with all application routes
func New(h *handlers.Handlers, m *middleware.Manager) *mux.Router {
	r := mux.NewRouter()
	
	// Apply global middleware
	r.Use(m.LoggingMiddleware)
	r.Use(m.RateLimiterMiddleware)
	r.Use(m.CORSMiddleware)
	
	// API Health Check
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy"}`))
	}).Methods("GET")
	
	// Stats API routes
	statsRouter := r.PathPrefix("/api/public/baseball").Subrouter()
	statsRouter.HandleFunc("/top-batters", h.Stats.TopBatters).Methods("GET")
	statsRouter.HandleFunc("/games/{gameId}/live", h.Stats.LiveGameStats).Methods("GET")
	
	// Auth-required routes
	protectedRouter := r.PathPrefix("/api").Subrouter()
	protectedRouter.Use(m.AuthMiddleware)
	protectedRouter.HandleFunc("/recommendations/players/{playerId}", h.Stats.PlayerRecommendations).Methods("GET")
	
	// Auth routes
	r.HandleFunc("/api/auth/login", h.Auth.Login).Methods("POST")
	r.HandleFunc("/api/auth/register", h.Auth.Register).Methods("POST")
	
	// Documentation
	r.PathPrefix("/docs/").Handler(http.StripPrefix("/docs/", http.FileServer(http.Dir("./docs"))))
	
	return r
}
```

### 3. Historical Stats Service (Python/FastAPI)

The Historical Stats Service provides access to baseball analytics and historical statistics.

#### `historical-stats/app/main.py`

```python
"""
Historical Baseball Stats Service.
Provides access to historical baseball statistics and analytics.
"""
from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from typing import List

from app.api import router
from app.services.database import get_db_connection
from app.services.cache import get_redis_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("historical-stats")

# Create FastAPI application
app = FastAPI(
    title="Baseball Historical Stats API",
    description="Access historical baseball statistics and analytics",
    version="1.0.0",
)

# Configure CORS
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy"}

# Startup event handler
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Historical Stats Service")
    
    # Initialize database connection
    db = get_db_connection()
    logger.info("Database connection initialized")
    
    # Initialize Redis client
    redis = get_redis_client()
    logger.info("Redis client initialized")

# Shutdown event handler
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    logger.info("Shutting down Historical Stats Service")
    
    # Close database connection
    db = get_db_connection()
    await db.close()
    logger.info("Database connection closed")
```

#### `historical-stats/app/api/endpoints/player_stats.py`

```python
"""
Player statistics endpoints.
Provides historical player statistics and analytics.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import logging

from app.models.player import PlayerStatsResponse
from app.services.database import get_db_session
from app.services.stats_service import StatsService
from app.services.cache import get_cache_service

router = APIRouter()
logger = logging.getLogger("historical-stats")

@router.get(
    "/baseball/top-batters",
    response_model=List[PlayerStatsResponse],
    summary="Get top baseball batters",
    description="Returns a list of top baseball batters ranked by batting average"
)
async def get_top_batters(
    limit: int = Query(10, description="Maximum number of players to return", ge=1, le=50),
    db: AsyncSession = Depends(get_db_session),
    cache_service = Depends(get_cache_service),
    stats_service: StatsService = Depends(),
):
    """
    Get top baseball batters with pagination support.
    
    Args:
        limit: Maximum number of players to return (default: 10)
        db: Database session
        cache_service: Caching service
        stats_service: Stats service
        
    Returns:
        List of top batters with their statistics
    """
    # Log request for monitoring
    logger.info(f"Received request for top batters, limit: {limit}")
    
    # Try to get from cache
    cache_key = f"top_batters:{limit}"
    cached_result = await cache_service.get(cache_key)
    if cached_result:
        logger.info(f"Cache hit for {cache_key}")
        return cached_result
    
    # Get from database
    logger.info(f"Cache miss for {cache_key}, querying database")
    result = await stats_service.get_top_batters(db, limit)
    
    # Store in cache for 5 minutes
    await cache_service.set(cache_key, result, expires_in=300)
    
    return result

@router.get(
    "/baseball/players/{player_id}",
    response_model=PlayerStatsResponse,
    summary="Get player statistics",
    description="Returns detailed statistics for a specific player"
)
async def get_player_stats(
    player_id: int,
    db: AsyncSession = Depends(get_db_session),
    cache_service = Depends(get_cache_service),
    stats_service: StatsService = Depends(),
):
    """
    Get detailed statistics for a specific player.
    
    Args:
        player_id: The MLB player ID
        db: Database session
        cache_service: Caching service
        stats_service: Stats service
        
    Returns:
        Detailed player statistics
    """
    # Try to get from cache
    cache_key = f"player:{player_id}"
    cached_result = await cache_service.get(cache_key)
    if cached_result:
        logger.info(f"Cache hit for {cache_key}")
        return cached_result
    
    # Get from database
    player_stats = await stats_service.get_player_stats(db, player_id)
    if not player_stats:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Store in cache for 5 minutes
    await cache_service.set(cache_key, player_stats, expires_in=300)
    
    return player_stats

@router.get(
    "/baseball/compare",
    response_model=List[PlayerStatsResponse],
    summary="Compare player statistics",
    description="Compare statistics between multiple players"
)
async def compare_players(
    player_ids: str = Query(..., description="Comma-separated list of player IDs"),
    db: AsyncSession = Depends(get_db_session),
    stats_service: StatsService = Depends(),
):
    """
    Compare statistics between multiple players.
    
    Args:
        player_ids: Comma-separated list of player IDs
        db: Database session
        stats_service: Stats service
        
    Returns:
        List of player statistics for comparison
    """
    # Parse player IDs
    try:
        ids = [int(pid.strip()) for pid in player_ids.split(",")]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid player IDs format")
    
    # Limit number of players to compare
    if len(ids) > 10:
        raise HTTPException(status_code=400, detail="Cannot compare more than 10 players")
    
    # Get player statistics
    players = await stats_service.get_multiple_players(db, ids)
    
    return players
```

#### `historical-stats/app/models/player.py`

```python
"""
Player data models and schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base_class import Base

# Database model
class PlayerStats(Base):
    """Player statistics database model"""
    __tablename__ = "player_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, index=True)
    player_name = Column(String, index=True)
    team = Column(String, index=True)
    batting_average = Column(Float)
    home_runs = Column(Integer)
    rbi = Column(Integer)
    hits = Column(Integer)
    at_bats = Column(Integer)
    ops = Column(Float)
    stolen_bases = Column(Integer, nullable=True)
    games_played = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# API response model
class PlayerStatsResponse(BaseModel):
    """Player statistics API response model"""
    name: str
    team: str
    avg: float = Field(..., description="Batting average")
    hr: int = Field(..., description="Home runs")
    rbi: int = Field(..., description="Runs batted in")
    ops: Optional[float] = Field(None, description="On-base plus slugging")
    games_played: Optional[int] = Field(None, description="Games played this season")
    player_image_url: Optional[str] = Field(None, description="URL to player's image")
    
    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "name": "Mike Trout",
                "team": "LAA",
                "avg": 0.331,
                "hr": 42,
                "rbi": 120,
                "ops": 1.088,
                "games_played": 148,
                "player_image_url": "/images/players/laa/mike_trout.jpg"
            }
        }
        
    # Map from database model to API response
    @classmethod
    def from_orm(cls, db_obj):
        return cls(
            name=db_obj.player_name,
            team=db_obj.team,
            avg=db_obj.batting_average,
            hr=db_obj.home_runs,
            rbi=db_obj.rbi,
            ops=db_obj.ops,
            games_played=db_obj.games_played,
            player_image_url=f"/images/players/{db_obj.team.lower()}/{db_obj.player_name.lower().replace(' ', '_')}.jpg"
        )
```

### 4. Real-time Game Service (Elixir/Phoenix)

The Real-time Game Service provides live updates for ongoing games.

#### `realtime-game/lib/realtime/application.ex`

```elixir
defmodule Realtime.Application do
  @moduledoc """
  The Realtime Application Service.

  The realtime system starts with this application.
  """
  use Application

  def start(_type, _args) do
    children = [
      # Start the Telemetry supervisor
      RealtimeWeb.Telemetry,
      # Start the PubSub system
      {Phoenix.PubSub, name: Realtime.PubSub},
      # Start the Endpoint (http/https)
      RealtimeWeb.Endpoint,
      # Start the Game Supervisor
      Realtime.Games.Supervisor,
      # Start the MLB API client
      Realtime.MlbApi.Client,
      # Start the GamePoller
      {Realtime.Games.GamePoller, interval: 10_000} # Poll every 10 seconds
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Realtime.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  def config_change(changed, _new, removed) do
    RealtimeWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
```

#### `realtime-game/lib/realtime/games/game.ex`

```elixir
defmodule Realtime.Games.Game do
  @moduledoc """
  A GenServer process that tracks the state of a baseball game.
  """
  use GenServer
  require Logger
  alias Realtime.MlbApi.Client, as: MlbApi
  alias Phoenix.PubSub

  # Client API

  @doc """
  Starts a game process for the given game ID.
  """
  def start_link(game_id) do
    GenServer.start_link(__MODULE__, game_id, name: via_tuple(game_id))
  end

  @doc """
  Returns the current state of the game.
  """
  def get_state(game_id) do
    GenServer.call(via_tuple(game_id), :get_state)
  end

  @doc """
  Refreshes the game state from the MLB API.
  """
  def refresh(game_id) do
    GenServer.cast(via_tuple(game_id), :refresh)
  end

  # GenServer callbacks

  @impl true
  def init(game_id) do
    Logger.info("Starting game process for game #{game_id}")
    
    # Immediately fetch the initial state
    send(self(), :refresh)
    
    {:ok, %{game_id: game_id, state: nil, last_update: nil}}
  end

  @impl true
  def handle_call(:get_state, _from, state) do
    {:reply, state.state, state}
  end

  @impl true
  def handle_cast(:refresh, state) do
    # Send ourselves a message to refresh
    send(self(), :refresh)
    {:noreply, state}
  end

  @impl true
  def handle_info(:refresh, state) do
    # Fetch game data from MLB API
    case MlbApi.get_game(state.game_id) do
      {:ok, game_data} ->
        # Check if the state has changed
        if game_data != state.state do
          # Broadcast the updated state to all subscribers
          PubSub.broadcast(
            Realtime.PubSub,
            "game:#{state.game_id}",
            {:game_updated, state.game_id, game_data}
          )
          
          # Schedule next refresh
          Process.send_after(self(), :refresh, refresh_interval(game_data))
          
          # Update our state
          {:noreply, %{state | state: game_data, last_update: DateTime.utc_now()}}
        else
          # No change, schedule next refresh
          Process.send_after(self(), :refresh, refresh_interval(game_data))
          {:noreply, %{state | last_update: DateTime.utc_now()}}
        end
        
      {:error, reason} ->
        Logger.error("Failed to refresh game #{state.game_id}: #{inspect(reason)}")
        # Retry after a delay
        Process.send_after(self(), :refresh, 30_000) # 30 seconds
        {:noreply, state}
    end
  end

  # Helper functions

  defp via_tuple(game_id) do
    {:via, Registry, {Realtime.Games.Registry, "game:#{game_id}"}}
  end
  
  # Determine refresh interval based on game state
  defp refresh_interval(game_data) do
    case game_data do
      %{status: "In Progress"} -> 10_000  # 10 seconds during active play
      %{status: "Warmup"} -> 30_000      # 30 seconds during warmup
      %{status: "Pre-Game"} -> 60_000    # 1 minute before game
      %{status: "Final"} -> 300_000      # 5 minutes after game ends
      _ -> 60_000                        # Default 1 minute
    end
  end
end
```

#### `realtime-game/lib/realtime_web/channels/game_channel.ex`

```elixir
defmodule RealtimeWeb.GameChannel do
  @moduledoc """
  Phoenix Channel for real-time game updates.
  """
  use Phoenix.Channel
  require Logger
  alias Realtime.Games.{Game, GameRegistry}

  @doc """
  Join a game channel for real-time updates.
  """
  def join("game:" <> game_id, _params, socket) do
    game_id = String.to_integer(game_id)
    
    # Start tracking the game if not already
    case GameRegistry.lookup_game(game_id) do
      {:ok, _pid} ->
        # Game process exists
        :ok
        
      {:error, :not_found} ->
        # Start a new game process
        Realtime.Games.Supervisor.start_game(game_id)
    end
    
    # Subscribe to game updates
    Phoenix.PubSub.subscribe(Realtime.PubSub, "game:#{game_id}")
    
    # Get initial game state
    case Game.get_state(game_id) do
      nil ->
        # Initial state not yet available, it will be sent when ready
        {:ok, assign(socket, :game_id, game_id)}
        
      game_state ->
        # Send initial state immediately
        {:ok, %{game: game_state}, assign(socket, :game_id, game_id)}
    end
  end

  @doc """
  Handle client requests for specific game data.
  """
  def handle_in("get_play_by_play", _params, socket) do
    game_id = socket.assigns.game_id
    
    case Game.get_state(game_id) do
      %{plays: plays} ->
        {:reply, {:ok, %{plays: plays}}, socket}
        
      _ ->
        {:reply, {:error, %{reason: "Play data not available"}}, socket}
    end
  end

  def handle_in("get_boxscore", _params, socket) do
    game_id = socket.assigns.game_id
    
    case Game.get_state(game_id) do
      %{boxscore: boxscore} ->
        {:reply, {:ok, %{boxscore: boxscore}}, socket}
        
      _ ->
        {:reply, {:error, %{reason: "Boxscore not available"}}, socket}
    end
  end

  @doc """
  Handle game update events from PubSub and forward to the client.
  """
  def handle_info({:game_updated, game_id, game_data}, socket) do
    if socket.assigns.game_id == game_id do
      push(socket, "game_update", %{game: game_data})
    end
    
    {:noreply, socket}
  end
end
```

### 5. Frontend Application (Next.js/React)

The frontend application provides the user interface with data visualization.

#### `frontend/src/app/page.tsx`

```tsx
// Home page component
import { Suspense } from 'react';
import Link from 'next/link';
import { TopBattersTable } from '@/components/TopBattersTable';
import { LiveGameScoreboard } from '@/components/LiveGameScoreboard';
import { Loading } from '@/components/Loading';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Baseball Stats Hub</h1>
        <p className="text-xl text-gray-600">
          Your source for real-time and historical baseball statistics
        </p>
      </section>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Batters Section */}
        <section className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Top Batters</h2>
              <Link 
                href="/stats/batting" 
                className="text-blue-600 hover:text-blue-800"
              >
                View All
              </Link>
            </div>
            
            <Suspense fallback={<Loading message="Loading top batters..." />}>
              <TopBattersTable limit={10} />
            </Suspense>
          </div>
        </section>
        
        {/* Live Games Section */}
        <section className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Live Games</h2>
              <Link 
                href="/games" 
                className="text-blue-600 hover:text-blue-800"
              >
                All Games
              </Link>
            </div>
            
            <Suspense fallback={<Loading message="Loading live games..." />}>
              <LiveGameScoreboard />
            </Suspense>
          </div>
        </section>
      </div>
      
      {/* Features Section */}
      <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Historical Stats</h3>
          <p className="text-gray-600 mb-4">
            Explore decades of baseball statistics with in-depth analysis tools.
          </p>
          <Link 
            href="/stats/historical" 
            className="text-blue-600 hover:text-blue-800"
          >
            Explore History
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Player Comparisons</h3>
          <p className="text-gray-600 mb-4">
            Compare players across eras with advanced metrics and visualizations.
          </p>
          <Link 
            href="/stats/compare" 
            className="text-blue-600 hover:text-blue-800"
          >
            Compare Players
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Team Analytics</h3>
          <p className="text-gray-600 mb-4">
            Dive into team performance with detailed analytical breakdowns.
          </p>
          <Link 
            href="/stats/teams" 
            className="text-blue-600 hover:text-blue-800"
          >
            Team Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
```

#### `frontend/src/components/TopBattersTable.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { StatsApiClient } from '@/lib/api-client';
import { PlayerStats } from '@/lib/types';
import { formatBattingAverage } from '@/lib/formatters';

interface TopBattersTableProps {
  limit?: number;
}

export function TopBattersTable({ limit = 10 }: TopBattersTableProps) {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await StatsApiClient.getTopBatters(limit);
        setPlayers(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching top batters:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [limit]);
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-md mb-2"></div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button 
          onClick={() => setLoading(true)}
          className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gray-100 text-gray-700 uppercase text-sm">
            <th className="py-3 px-4 text-left">Player</th>
            <th className="py-3 px-4 text-left">Team</th>
            <th className="py-3 px-4 text-right">AVG</th>
            <th className="py-3 px-4 text-right">HR</th>
            <th className="py-3 px-4 text-right">RBI</th>
            <th className="py-3 px-4 text-right">OPS</th>
          </tr>
        </thead>
        <tbody className="text-gray-600">
          {players.map((player) => (
            <tr 
              key={`${player.name}-${player.team}`}
              className="border-b border-gray-200 hover:bg-gray-50"
            >
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 relative mr-3">
                    <Image
                      src={player.player_image_url || '/images/player-default.png'}
                      alt={player.name}
                      fill
                      className="rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/player-default.png';
                      }}
                    />
                  </div>
                  <span className="font-medium">{player.name}</span>
                </div>
              </td>
              <td className="py-3 px-4">{player.team}</td>
              <td className="py-3 px-4 text-right font-mono">
                {formatBattingAverage(player.avg)}
              </td>
              <td className="py-3 px-4 text-right">{player.hr}</td>
              <td className="py-3 px-4 text-right">{player.rbi}</td>
              <td className="py-3 px-4 text-right font-mono">
                {player.ops ? player.ops.toFixed(3) : '---'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### `frontend/src/lib/api-client.ts`

```typescript
/**
 * API client for baseball statistics services.
 * Handles communication with the backend services.
 */

import axios from 'axios';
import { PlayerStats, GameData, TeamStats } from './types';

// Create configured axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/public',
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Add authentication token to requests if available
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle common API errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

/**
 * Stats API methods
 */
export const StatsApiClient = {
  /**
   * Get top baseball batters
   * 
   * @param limit - Maximum number of players to return
   * @returns Promise resolving to array of player stats
   */
  async getTopBatters(limit = 10): Promise<PlayerStats[]> {
    const response = await apiClient.get('/baseball/top-batters', {
      params: { limit }
    });
    return response.data;
  },
  
  /**
   * Get stats for a specific player
   * 
   * @param playerId - Player ID
   * @returns Promise resolving to player stats
   */
  async getPlayerStats(playerId: number): Promise<PlayerStats> {
    const response = await apiClient.get(`/baseball/players/${playerId}`);
    return response.data;
  },
  
  /**
   * Compare multiple players
   * 
   * @param playerIds - Array of player IDs to compare
   * @returns Promise resolving to array of player stats
   */
  async comparePlayers(playerIds: number[]): Promise<PlayerStats[]> {
    const response = await apiClient.get('/baseball/compare', {
      params: { player_ids: playerIds.join(',') }
    });
    return response.data;
  },
  
  /**
   * Get live game data
   * 
   * @param gameId - Game ID
   * @returns Promise resolving to game data
   */
  async getLiveGame(gameId: number): Promise<GameData> {
    const response = await apiClient.get(`/baseball/games/${gameId}/live`);
    return response.data;
  },
  
  /**
   * Get all active games
   * 
   * @returns Promise resolving to array of game data
   */
  async getActiveGames(): Promise<GameData[]> {
    const response = await apiClient.get('/baseball/games/active');
    return response.data;
  },
  
  /**
   * Get team statistics
   * 
   * @param teamId - Team ID
   * @returns Promise resolving to team stats
   */
  async getTeamStats(teamId: number): Promise<TeamStats> {
    const response = await apiClient.get(`/baseball/teams/${teamId}/stats`);
    return response.data;
  },
  
  /**
   * Get personalized recommendations for a player
   * 
   * @param playerId - Player ID
   * @returns Promise resolving to array of recommended players
   */
  async getPlayerRecommendations(playerId: number): Promise<PlayerStats[]> {
    const response = await apiClient.get(`/recommendations/players/${playerId}`);
    return response.data;
  }
};
```

### 6. Docker Compose Configuration

#### `docker-compose.yml`

```yaml
version: '3.8'

services:
  # API Gateway (Go)
  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: Dockerfile
    container_name: baseball-api-gateway
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - HISTORICAL_STATS_URL=http://historical-stats:8000
      - REALTIME_GAME_URL=http://realtime-game:4000
      - RECOMMENDATION_URL=http://recommendation-engine:8001
      - JWT_SECRET=${JWT_SECRET:-supersecretkey}
    depends_on:
      - historical-stats
      - realtime-game
      - recommendation-engine
    networks:
      - baseball-network
    restart: unless-stopped

  # Data Pipeline (Rust)
  data-pipeline:
    build:
      context: ./data-pipeline
      dockerfile: Dockerfile
    container_name: baseball-data-pipeline
    environment:
      - DATABASE_URL=postgres://postgres:postgres@database:5432/baseball_stats
      - MLB_API_KEY=${MLB_API_KEY}
      - MLB_API_BASE_URL=${MLB_API_BASE_URL}
      - RUST_LOG=info
    depends_on:
      - database
    networks:
      - baseball-network
    restart: unless-stopped

  # Historical Stats Service (Python/FastAPI)
  historical-stats:
    build:
      context: ./historical-stats
      dockerfile: Dockerfile
    container_name: baseball-historical-stats
    ports:
      - "8000:8000"  # For direct access during development
    environment:
      - DATABASE_URL=postgres://postgres:postgres@database:5432/baseball_stats
      - REDIS_URL=redis://redis:6379/0
      - ALLOWED_ORIGINS=http://localhost:3000,http://frontend:3000
    depends_on:
      - database
      - redis
    networks:
      - baseball-network
    restart: unless-stopped

  # Real-time Game Service (Elixir/Phoenix)
  realtime-game:
    build:
      context: ./realtime-game
      dockerfile: Dockerfile
    container_name: baseball-realtime-game
    ports:
      - "4000:4000"  # For direct access during development
    environment:
      - PORT=4000
      - SECRET_KEY_BASE=${PHOENIX_SECRET_KEY:-somereallylongsecretkey}
      - MLB_API_KEY=${MLB_API_KEY}
      - MLB_API_BASE_URL=${MLB_API_BASE_URL}
      - REDIS_URL=redis://redis:6379/1
    depends_on:
      - redis
    networks:
      - baseball-network
    restart: unless-stopped

  # Recommendation Engine (Python)
  recommendation-engine:
    build:
      context: ./recommendation-engine
      dockerfile: Dockerfile
    container_name: baseball-recommendation-engine
    ports:
      - "8001:8001"  # For direct access during development
    environment:
      - DATABASE_URL=postgres://postgres:postgres@database:5432/baseball_stats
      - REDIS_URL=redis://redis:6379/2
      - MODEL_PATH=/app/models
    depends_on:
      - database
      - redis
    networks:
      - baseball-network
    restart: unless-stopped

  # Frontend (Next.js/React)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: baseball-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/public
    networks:
      - baseball-network
    restart: unless-stopped

  # PostgreSQL Database
  database:
    image: postgres:14-alpine
    container_name: baseball-database
    ports:
      - "5432:5432"  # For direct access during development
    environment:
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_USER=postgres
      - POSTGRES_DB=baseball_stats
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    networks:
      - baseball-network
    restart: unless-stopped

  # Redis for Caching
  redis:
    image: redis:7-alpine
    container_name: baseball-redis
    ports:
      - "6379:6379"  # For direct access during development
    volumes:
      - redis_data:/data
    networks:
      - baseball-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  baseball-network:
    driver: bridge
```

## Key Features

### 1. Performance Optimization

- **Rust Data Pipeline**: High-performance data ingestion with minimal overhead
- **Go API Gateway**: Efficient request routing with low latency
- **Redis Caching**: In-memory data access for frequently requested information
- **Elixir WebSockets**: Highly concurrent real-time updates using BEAM VM

### 2. Scalability

- **Independent Microservices**: Each component can scale independently
- **Data Partitioning**: Player and game data can be sharded for horizontal scaling
- **Stateless Design**: API gateway and historical stats service are stateless
- **Connection Pooling**: Database and Redis connections are pooled for efficiency

### 3. Developer Experience

- **Language-Specific Strengths**: Each component uses the best language for its purpose
- **Clear Service Boundaries**: Well-defined interfaces between services
- **Comprehensive Documentation**: API documentation built into services
- **Containerized Development**: Easy local setup with Docker Compose

### 4. User Experience

- **Responsive UI**: Fast, interactive frontend with React
- **Real-time Updates**: Live game data pushed to users via WebSockets
- **Data Visualization**: Interactive charts and comparisons for statistical analysis
- **Personalized Recommendations**: ML-powered player and team recommendations

## MLB API Credentials

To use this application, you need valid MLB API credentials:

1. Sign up for access at [MLB.com Developer Portal](https://developer.mlb.com/)
2. Generate an API key
3. Add your API key to the `.env` file or environment variables

## Production Deployment

For production deployment:

1. Build optimized container images:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. Deploy to Kubernetes:
   ```bash
   kubectl apply -f kubernetes/
   ```

3. Set up monitoring with Prometheus and Grafana:
   ```bash
   kubectl apply -f kubernetes/monitoring/
   ```

## Monitoring and Observability

This application includes comprehensive monitoring:

1. **Metrics**: Each service exposes Prometheus metrics
2. **Logging**: Structured JSON logs with correlation IDs
3. **Tracing**: Distributed tracing with OpenTelemetry
4. **Dashboards**: Pre-configured Grafana dashboards for all services

## Contribution Guidelines

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
