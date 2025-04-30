# Baseball Stats Application

This is a polyglot microservices-based baseball statistics application. Each service is implemented in the language best suited for its domain.

## Getting Started

1. Copy `.env.example` to `.env` and fill in your credentials.
2. Build and start all services:
   ```bash
   docker-compose up --build
   ```
3. Access the frontend at http://localhost:3000

## Services
- **api-gateway/** (Go): API routing and authentication
- **data-pipeline/** (Rust): MLB data ingestion
- **historical-stats/** (Python/FastAPI): Analytics and historical data
- **realtime-game/** (Elixir/Phoenix): Real-time game updates
- **recommendation-engine/** (Python): ML recommendations
- **frontend/** (Next.js/React): User interface
- **database/**: Database schema and migrations
- **redis/**: Caching

See optimal-baseball-stats.md for full architecture and details.

## Production & Orchestration
- See `docker-compose.prod.yml` for production Docker Compose overrides.
- See `kubernetes/` for Kubernetes manifests and deployment examples.

## Monitoring & Observability
- Each service includes a placeholder for Prometheus metrics, OpenTelemetry tracing, and structured logging. See comments in main entrypoints.

## Testing
- Each service includes a basic test file or module. Expand these for full coverage.

## Contribution
- Follow the structure in each service for adding new endpoints, business logic, and tests.

## Required Tools

To run and develop this application, you will need the following tools:

- **Docker Desktop** (with Docker Compose)
  - Download: https://www.docker.com/products/docker-desktop
  - Required for building, running, and orchestrating all services locally and in production.
  - **How to install:** Download the installer, run it, and follow the on-screen instructions. After installation, start Docker Desktop from the Start menu.
- **Node.js** (LTS recommended)
  - Download: https://nodejs.org/
  - Required for local frontend (Next.js/React) development.
  - **How to install:** Download the Windows installer (MSI), run it, and follow the setup wizard. Verify installation with `node -v` and `npm -v` in Command Prompt.
- **Rust Toolchain** (for data-pipeline development)
  - Download: https://www.rust-lang.org/tools/install
  - Required if you want to build or test the Rust data pipeline service outside Docker.
  - **How to install:** Open Command Prompt and run `curl https://sh.rustup.rs -sSf | sh` or use the Windows rustup-init.exe installer from the website. Follow prompts to complete setup.
- **Go** (for API Gateway development)
  - Download: https://go.dev/dl/
  - Required if you want to build or test the Go API Gateway outside Docker.
  - **How to install:** Download the Windows installer (MSI), run it, and follow the setup wizard. Verify with `go version` in Command Prompt.
- **Python 3.11+** (for historical-stats and recommendation-engine)
  - Download: https://www.python.org/downloads/
  - Required if you want to run or test Python services outside Docker.
  - **How to install:** Download the Windows installer, run it, and check 'Add Python to PATH' during setup. Verify with `python --version`.
- **Elixir & Erlang** (for realtime-game development)
  - Download: https://elixir-lang.org/install.html
  - Required if you want to run or test the Elixir/Phoenix service outside Docker.
  - **How to install:** Use the Windows installer from the Elixir website, which includes Erlang. Follow the setup wizard and verify with `elixir --version`.
- **PostgreSQL** (optional, for direct DB access)
  - Download: https://www.postgresql.org/download/
  - Useful for inspecting or managing the database directly.
  - **How to install:** Download the Windows installer, run it, and follow the setup wizard. Use pgAdmin or `psql` for database access.

All of these tools are available for Windows, macOS, and Linux. For most users, Docker Desktop is sufficient, as it encapsulates all other dependencies for running the full stack.

## Services Overview

- **api-gateway/** (Go): Central API gateway for routing, authentication, and aggregation of microservice responses. Handles public API endpoints and authentication logic.
- **data-pipeline/** (Rust): Ingests, transforms, and loads MLB data from external sources into the database. Handles ETL and data normalization.
- **historical-stats/** (Python/FastAPI): Provides analytics and historical statistics endpoints, including player and team stats, trends, and advanced metrics.
- **realtime-game/** (Elixir/Phoenix): Manages real-time game updates, live scores, and event streaming for in-progress games.
- **recommendation-engine/** (Python): Machine learning service for player and team recommendations, predictions, and personalized content.
- **frontend/** (Next.js/React): User interface for browsing teams, players, live games, and stats. Features team and player images, dynamic gradients, and modern UI/UX.
- **database/**: Contains schema and migration files for the PostgreSQL database.
- **kubernetes/**: Placeholder for Kubernetes manifests for production orchestration.

## Local Development Instructions

1. **Install Prerequisites:**
   - [Docker Desktop](https://www.docker.com/products/docker-desktop) (includes Docker Compose)
   - [Node.js](https://nodejs.org/) (for frontend development, optional)

2. **Clone the Repository & Prepare Environment:**
   - Copy `.env.example` to `.env` and fill in any required secrets or API keys.

3. **Add Image Assets:**
   - Place team logos in `frontend/public/images/teams/` as `nyy.png`, `bos.png`, `laa.png`, and `default.png`.
   - Place player images in `frontend/public/images/players/` as `aaron_judge.png`, `giancarlo_stanton.png`, etc., and `player-default.png`.

4. **Start All Services:**
   ```bash
   docker-compose up --build
   ```
   This will build and start all backend, frontend, and database services.

5. **Access the Application:**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:8080
   - Historical Stats: http://localhost:8000
   - Realtime Game: http://localhost:4000
   - Recommendation Engine: http://localhost:8001

6. **Development Tips:**
   - You can run `docker-compose down` to stop all services.
   - For frontend-only development, run `npm install && npm run dev` in the `frontend/` directory.

## Notes
- All API endpoints use mock data by default. Integrate with real data sources and backend services as needed.
- See `optimal-baseball-stats.md` for full architecture and design details.

## Code Quality & Documentation

- All services are modularized and include function-level documentation for maintainability.
- Placeholder and `.keep` files have been removed for a cleaner repository.
- Redundant or duplicate API endpoints have been consolidated.

## Testing

- Each service includes a health check endpoint and a basic test file/module.
- Please expand test coverage as you add new features.

## Mock Data

- The frontend now relies on backend APIs for data in production.
- Mock data is only used for local development and testing.

## Contribution

- All new code should include clear docstrings or comments.
- Follow the modular structure in each service for adding endpoints, business logic, and tests.

## External Services & APIs

This project relies on several external services and APIs. Below is a list of these services, which internal services consume them, and where in the codebase they are used.

### MLB Stats API
- **Purpose:** Used to fetch live and historical baseball statistics.
- **Consumed by:**
  - `data-pipeline` (Rust)
    - See: `data-pipeline/src/main.rs` (look for MLB API fetch logic)
- **Access:** Public API, no authentication required for basic endpoints. See [MLB Stats API documentation](https://appac.github.io/mlb-data-api-docs/).

### PostgreSQL Database
- **Purpose:** Stores all baseball stats, player data, schedules, and more.
- **Consumed by:**
  - `historical-stats` (Python/FastAPI)
    - See: `historical-stats/app/main.py` (database connection and queries)
  - `recommendation-engine` (Python)
    - See: `recommendation-engine/app/main.py` (if using DB for recommendations)
  - `data-pipeline` (Rust)
    - See: `data-pipeline/src/main.rs` (if writing directly to DB)
  - `api-gateway` (Go)
    - See: `api-gateway/internal/services/` (if aggregating from DB)
- **Provisioned by:** Docker Compose (`database` service)
- **Connection String Example:**
  ```
  postgres://postgres:postgres@localhost:5432/baseball_stats
  ```

### Redis (Optional)
- **Purpose:** Used for caching and fast data access.
- **Consumed by:**
  - Any service that implements caching (add details as you implement)
- **Provisioned by:** Docker Compose (`redis` service)
- **Connection Example:**
  ```
  redis://localhost:6379
  ```

### MLB Player Images (Unofficial)
- **Purpose:** Used to display player headshots in the frontend.
- **Consumed by:**
  - `frontend` (Next.js/React)
    - See: `frontend/src/pages/player/[playerId].tsx` and related components
- **Access:** Public CDN, no authentication required. Example usage:
  ```
  https://img.mlbstatic.com/mlb-photos/image/upload/v1/people/{player_id}/headshot/67/current.png
  ```
  Replace `{player_id}` with the MLBAM player ID.

### Additional Notes
- If you wish to use other external APIs (e.g., for advanced stats or fantasy data), you may need to register for API keys and update the relevant service configuration files or environment variables.
- For production deployments, ensure you secure API keys and sensitive credentials using environment variables or a secrets manager.

## Health Checks

Each service exposes a health check endpoint to verify that it is running and able to connect to its dependencies (such as the database). You can use these endpoints for monitoring, troubleshooting, and Docker healthchecks.

| Service                | Endpoint URL                        | Description                                 |
|------------------------|--------------------------------------|---------------------------------------------|
| API Gateway            | http://localhost:8080/health         | Checks if the API Gateway is running        |
| Data Pipeline          | http://localhost:8081/health         | Checks service and database connectivity    |
| Historical Stats       | http://localhost:8000/health         | Checks service and database connectivity    |
| Recommendation Engine  | http://localhost:8001/health         | Checks if the service is running            |
| Realtime Game          | http://localhost:4000/health         | Checks if the service is running            |
| Frontend               | http://localhost:3000/api/health     | Checks if the frontend API is running       |

**How to use:**
- Open your browser or use `curl` to access any of the above URLs.
- Example:
  ```bash
  curl http://localhost:8081/health
  ```
- A healthy service will return a JSON response such as:
  ```json
  { "status": "healthy", "database": "ok" }
  ```
- If a service is unhealthy or cannot connect to its dependencies, the response will indicate an error.

## Service Startup & Validation Order

To ensure a smooth startup and validation of all services, follow this recommended order. This sequence ensures that each service's dependencies are available and healthy before moving to the next step.

| Order | Service                | Validation Step                                                      |
|-------|------------------------|---------------------------------------------------------------------|
| 1     | database               | Check DB logs, connect with psql or a DB client                     |
| 2     | historical-stats       | Check [http://localhost:8000/health](http://localhost:8000/health), ensure DB connection |
| 3     | recommendation-engine  | Check [http://localhost:8001/health](http://localhost:8001/health), ensure DB connection |
| 4     | realtime-game          | Check [http://localhost:4000/health](http://localhost:4000/health)  |
| 5     | data-pipeline          | Check [http://localhost:8081/health](http://localhost:8081/health), ensure it can POST to historical-stats and DB |
| 6     | api-gateway            | Check [http://localhost:8080/health](http://localhost:8080/health), test API endpoints |
| 7     | frontend               | Check [http://localhost:3000/api/health](http://localhost:3000/api/health), load UI, verify data |

**Instructions:**
1. Start each service in the order above, using Docker Compose or individually.
2. After starting each service, use the provided health check URL to verify it is running and connected to its dependencies.
3. Only proceed to the next service once the current one is healthy.
4. For troubleshooting, consult the logs for each service and use the health check endpoints as described in the [Health Checks](#health-checks) section.

This order ensures a reliable and observable startup process for local development and production deployments.
