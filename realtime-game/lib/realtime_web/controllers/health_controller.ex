defmodule RealtimeWeb.HealthController do
  use RealtimeWeb, :controller

  def index(conn, _params) do
    json(conn, %{status: "healthy"})
  end
end
