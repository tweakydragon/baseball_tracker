// Internal packages for business logic, authentication, and handlers
// Place your handler, auth, and service logic here

// Handlers for API Gateway endpoints
// Each handler should be documented with its purpose and usage.

// healthHandler returns the health status of the API Gateway service.
// Responds with a JSON object: {"status": "healthy"}
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy"}`))
}