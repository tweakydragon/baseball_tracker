package main

import (
	"fmt"
	"net/http"

	log "github.com/sirupsen/logrus"
)

// healthHandler returns the health status of the API Gateway service.
// Responds with a JSON object: {"status": "healthy"}
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy"}`))
}

// main is the entry point for the API Gateway server.
// It sets up the HTTP server and routes.
func main() {
	log.SetFormatter(&log.JSONFormatter{})
	log.SetLevel(log.InfoLevel)
	log.WithField("service", "api-gateway").Info("Starting API Gateway...")
	http.HandleFunc("/health", healthHandler)
	fmt.Println("API Gateway running on :8080")
	http.ListenAndServe(":8080, nil)
}

// Example: add logging to a handler
func SomeHandler(w http.ResponseWriter, r *http.Request) {
	log.WithFields(log.Fields{"method": r.Method, "path": r.URL.Path}).Info("Received request")
}