FROM rust:1.74-slim
WORKDIR /app
COPY . .
RUN cargo build --release
EXPOSE 8081
CMD ["/app/target/release/data-pipeline"]
