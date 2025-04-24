#syntax=docker/dockerfile:1.5

FROM python:3.12-slim as build
COPY --from=ghcr.io/astral-sh/uv:0.6.14 /uv /uvx /bin/

WORKDIR /app

COPY ./pyproject.toml .
COPY ./uv.lock .

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-dev

COPY ./app ./app

FROM python:3.12-slim as app

WORKDIR /app

COPY --from=build /app/app ./app
COPY --from=build /app/.venv ./.venv

EXPOSE 8000

CMD ["./app/run.sh"]