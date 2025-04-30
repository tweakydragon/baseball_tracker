defmodule Realtime.Application do
  use Application

  def start(_type, _args) do
    children = [
      # TODO: Add Prometheus metrics, OpenTelemetry tracing, and structured logging setup here
    ]
    opts = [strategy: :one_for_one, name: Realtime.Supervisor]
    Supervisor.start_link(children, opts)
  end
end