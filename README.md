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
