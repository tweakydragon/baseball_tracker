from fastapi import FastAPI

app = FastAPI()

# TODO: Add Prometheus metrics, OpenTelemetry tracing, and structured logging setup here

@app.get("/health")
def health():
    return {"status": "healthy"}