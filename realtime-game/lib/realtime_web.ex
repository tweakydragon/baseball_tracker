defmodule RealtimeWeb do
  def controller do
    quote do
      use Phoenix.Controller, namespace: RealtimeWeb
      import Plug.Conn
      # import RealtimeWeb.Router.Helpers # Phoenix 1.7+ uses path helpers differently
      # import RealtimeWeb.Gettext # Uncomment if you add Gettext
    end
  end

  def router do
    quote do
      use Phoenix.Router
    end
  end

  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end
end
