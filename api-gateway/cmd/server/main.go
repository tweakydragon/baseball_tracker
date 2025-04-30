package main

import (
	"fmt"
	"net/http"
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
	http.HandleFunc("/health", healthHandler)
	fmt.Println("API Gateway running on :8080")
	http.ListenAndServe(":8080, nil)
}