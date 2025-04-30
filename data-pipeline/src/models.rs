// models.rs: Data models for pipeline
pub mod models {
    // Data models for the data pipeline
    // Each struct should be documented with its fields and purpose.

    /// Represents a player's game log stats for a single game.
    #[derive(Debug, serde::Serialize, serde::Deserialize)]
    pub struct PlayerGameLog {
        /// MLB player ID
        pub player_id: i32,
        /// Date of the game (YYYY-MM-DD)
        pub game_date: String,
        /// Home runs in the game
        pub home_runs: i32,
        /// Runs batted in
        pub rbi: i32,
        /// Stolen bases
        pub stolen_bases: i32,
        /// Runs scored
        pub runs: i32,
        /// Hits
        pub hits: i32,
        /// Raw stat JSON (optional, for extensibility)
        pub stat_json: serde_json::Value,
    }
}

// extractors.rs: Data extraction logic
pub mod extractors {
    // Define your data extraction logic here
}

// transformers.rs: Data transformation logic
pub mod transformers {
    // Define your data transformation logic here
}

// loaders.rs: Data loading logic
pub mod loaders {
    // Define your data loading logic here
}