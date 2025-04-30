FROM rust:1.81-slim
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN cargo build --release
EXPOSE 8081
CMD ["/app/target/release/data-pipeline"]
