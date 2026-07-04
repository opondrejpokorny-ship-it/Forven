# Running Forven from Base / static web hosts

Forven is a full-stack local-first app: the dashboard is a SvelteKit frontend, but the trading research engine, storage, agents, jobs, and API run in the Python/FastAPI backend.

That means Base/static hosting can run the **frontend shell**, but the Forven backend still has to run somewhere else:

- on your own machine,
- on a private VPS,
- on a container host,
- or on another backend service that can run Python 3.11+ and persistent storage.

Do not expose a live/mainnet trading backend without understanding the security model. Keep `FORVEN_EXECUTION_MODE=paper` unless you deliberately opt into unsupported live execution.

## Can the backend run in Base?

Only if the Base runtime you are using supports all of these at the same time:

- a long-running Python 3.11+ web process,
- an exposed HTTP/WebSocket port for the FastAPI service,
- persistent filesystem/storage for `FORVEN_HOME`, SQLite, Chroma, logs, credentials, and downloaded market data,
- background jobs/worker loops that can keep running outside a single request,
- environment variables/secrets for API keys and exchange/testnet credentials.

If Base only hosts static frontend files or request/response functions, it is not enough to run the full Forven backend. In that case, use Base for the dashboard and run the backend in a terminal, container, VPS, or another Python-capable host.

## Can the backend run in a terminal?

Yes. A terminal is the simplest dev/single-user setup. From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e .
cp .env.example .env
START_BOT=0 START_DAEMON=0 python -m uvicorn --app-dir . forven.api:app --host 127.0.0.1 --port 8003
```

Then build or run the frontend with `VITE_API_BASE=http://127.0.0.1:8003/api`.

This terminal mode is usually best for local testing. It stops when the terminal/process stops unless you wrap it with a service manager such as Docker, systemd, pm2, tmux/screen, or a managed container platform.

## Frontend build

From the repository root:

```bash
npm install
npm run build
```

The root build script delegates to `frontend/`, enables the packaged static SvelteKit adapter, and copies the final static site to:

```text
dist/
```

Use `dist` as the publish/output directory.

## Required frontend environment

Set the backend URL at build time:

```bash
VITE_API_BASE=https://your-forven-backend.example.com/api npm run build
```

`VITE_API_BASE` can include or omit `/api`; the client normalizes requests. The packaged build also adds this origin to the frontend Content-Security-Policy `connect-src` allowlist.

Optional, but prefer entering these in the dashboard/local browser storage instead of baking them into a public build:

```bash
VITE_FORVEN_API_KEY=...
VITE_FORVEN_OPERATOR_KEY=...
```

## Backend checklist

For a backend reachable from a hosted frontend, configure the backend with explicit auth and CORS:

```bash
FORVEN_EXECUTION_MODE=paper
START_BOT=0
START_DAEMON=0
FORVEN_BIND_HOST=0.0.0.0
FORVEN_API_KEY=<long-random-api-key>
FORVEN_OPERATOR_KEY=<long-random-operator-key>
FORVEN_CORS_ORIGINS=https://your-base-app.example.com
python -m uvicorn --app-dir . forven.api:app --host 0.0.0.0 --port 8003
```

Forven intentionally refuses to start an API exposed beyond localhost unless both `FORVEN_API_KEY` and `FORVEN_OPERATOR_KEY` are configured.

## What works in this mode

- The Base/static host serves the dashboard UI.
- The browser talks to the external Forven backend via `VITE_API_BASE`.
- Paper/testnet workflows can work if the backend has its local state, credentials, and dependencies configured.

## What does not become “serverless” automatically

Base/static hosting does not replace the Forven backend. The following still require the Python service and persistent runtime state:

- backtesting jobs,
- SQLite/Chroma data,
- agent runs,
- market data ingestion,
- paper trading runtime,
- MCP server,
- any exchange integration.
