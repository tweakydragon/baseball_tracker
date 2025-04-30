FROM elixir:1.14-alpine
WORKDIR /app
COPY . .
RUN mix local.hex --force && mix local.rebar --force
RUN mix deps.get
EXPOSE 4000
CMD ["mix", "phx.server"]
