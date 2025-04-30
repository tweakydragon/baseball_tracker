FROM golang:1.20-alpine
WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o api-gateway ./cmd/server
EXPOSE 8080
CMD ["/app/api-gateway"]
