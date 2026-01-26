# CodeSync Management Commands
# Usage: just <command>

set dotenv-load := true

# Paths
export PATH := env_var('HOME') + "/.bun/bin:" + env_var('PATH')
log_dir := justfile_directory() + "/logs"
api_dir := justfile_directory() + "/packages/api"
client_dir := justfile_directory() + "/packages/client"

# Date for log files
date := `date +%Y-%m-%d`

# PID files
api_pid := log_dir + "/api.pid"
client_pid := log_dir + "/client.pid"

# Log retention (days)
log_retention := "7"

# =============================================================================
# Main Commands
# =============================================================================

# Show available commands
default:
    @just --list

# Start all services (API + Client + Postgres)
start: _ensure-logs _cleanup-old-logs
    @echo "Starting CodeSync services..."
    just start-db
    just start-api
    just start-client
    @echo ""
    @echo "✅ CodeSync is running!"
    @echo "   Client: http://localhost:5173"
    @echo "   API:    http://localhost:8001"
    @echo "   Public: https://noon-disk.exe.xyz:5173/"

# Stop all services
stop:
    @echo "Stopping CodeSync services..."
    just stop-client
    just stop-api
    @echo "✅ Services stopped (database left running)"

# Restart all services
restart: stop start

# Show status of all services
status:
    @echo "=== CodeSync Service Status ==="
    @echo ""
    @echo "📦 PostgreSQL:"
    @docker ps --filter name=codesync-postgres --format '   {{ "{{.Status}}" }}' || echo "   Not running"
    @echo ""
    @echo "🔧 API (port 8001):"
    @if [ -f {{api_pid}} ] && kill -0 $(cat {{api_pid}}) 2>/dev/null; then \
        echo "   Running (PID: $(cat {{api_pid}}))"; \
    else \
        echo "   Not running"; \
    fi
    @echo ""
    @echo "🌐 Client (port 5173):"
    @if [ -f {{client_pid}} ] && kill -0 $(cat {{client_pid}}) 2>/dev/null; then \
        echo "   Running (PID: $(cat {{client_pid}}))"; \
    else \
        echo "   Not running"; \
    fi
    @echo ""
    @echo "📁 Today's logs:"
    @ls -lh {{log_dir}}/api-{{date}}.log {{log_dir}}/client-{{date}}.log 2>/dev/null || echo "   No logs for today yet"

# =============================================================================
# Individual Service Commands
# =============================================================================

# Start PostgreSQL
start-db:
    @echo "Starting PostgreSQL..."
    @cd {{justfile_directory()}} && docker compose up -d postgres
    @sleep 2

# Stop PostgreSQL
stop-db:
    @echo "Stopping PostgreSQL..."
    @cd {{justfile_directory()}} && docker compose down

# Start API server
start-api: _ensure-logs
    @if [ -f {{api_pid}} ] && kill -0 $(cat {{api_pid}}) 2>/dev/null; then \
        echo "API already running (PID: $(cat {{api_pid}}))"; \
    else \
        echo "Starting API server..."; \
        cd {{api_dir}} && \
        nohup bun --hot src/index.ts >> {{log_dir}}/api-{{date}}.log 2>&1 & \
        echo $! > {{api_pid}}; \
        echo "API started (PID: $!)"; \
    fi

# Stop API server
stop-api:
    @if [ -f {{api_pid}} ]; then \
        if kill -0 $(cat {{api_pid}}) 2>/dev/null; then \
            echo "Stopping API (PID: $(cat {{api_pid}}))..."; \
            kill $(cat {{api_pid}}); \
        fi; \
        rm -f {{api_pid}}; \
    else \
        echo "API not running (no PID file)"; \
        fuser -k 8001/tcp 2>/dev/null || true; \
    fi

# Restart API server
restart-api: stop-api start-api

# Start Client dev server
start-client: _ensure-logs
    @if [ -f {{client_pid}} ] && kill -0 $(cat {{client_pid}}) 2>/dev/null; then \
        echo "Client already running (PID: $(cat {{client_pid}}))"; \
    else \
        echo "Starting Client server..."; \
        cd {{client_dir}} && \
        nohup bun run dev >> {{log_dir}}/client-{{date}}.log 2>&1 & \
        echo $! > {{client_pid}}; \
        echo "Client started (PID: $!)"; \
    fi

# Stop Client server
stop-client:
    @if [ -f {{client_pid}} ]; then \
        if kill -0 $(cat {{client_pid}}) 2>/dev/null; then \
            echo "Stopping Client (PID: $(cat {{client_pid}}))..."; \
            kill $(cat {{client_pid}}); \
        fi; \
        rm -f {{client_pid}}; \
    else \
        echo "Client not running (no PID file)"; \
        fuser -k 5173/tcp 2>/dev/null || true; \
    fi

# Restart Client server
restart-client: stop-client start-client

# =============================================================================
# Log Commands
# =============================================================================

# View combined logs (today)
logs:
    @echo "=== API Logs ==="
    @tail -50 {{log_dir}}/api-{{date}}.log 2>/dev/null || echo "No API logs for today"
    @echo ""
    @echo "=== Client Logs ==="
    @tail -50 {{log_dir}}/client-{{date}}.log 2>/dev/null || echo "No Client logs for today"

# Follow API logs (live)
logs-api:
    @tail -f {{log_dir}}/api-{{date}}.log 2>/dev/null || echo "No API logs for today"

# Follow Client logs (live)
logs-client:
    @tail -f {{log_dir}}/client-{{date}}.log 2>/dev/null || echo "No Client logs for today"

# Follow all logs (live)
logs-follow:
    @tail -f {{log_dir}}/api-{{date}}.log {{log_dir}}/client-{{date}}.log 2>/dev/null

# View API logs for a specific date (usage: just logs-api-date 2026-01-25)
logs-api-date day:
    @cat {{log_dir}}/api-{{day}}.log 2>/dev/null || echo "No API logs for {{day}}"

# View Client logs for a specific date
logs-client-date day:
    @cat {{log_dir}}/client-{{day}}.log 2>/dev/null || echo "No Client logs for {{day}}"

# List all log files
logs-list:
    @echo "=== Log Files ==="
    @ls -lht {{log_dir}}/*.log 2>/dev/null || echo "No log files found"

# Search logs for a pattern (usage: just logs-search "error")
logs-search pattern:
    @echo "=== Searching for '{{pattern}}' in today's logs ==="
    @echo "--- API ---"
    @grep -i "{{pattern}}" {{log_dir}}/api-{{date}}.log 2>/dev/null || echo "No matches"
    @echo "--- Client ---"
    @grep -i "{{pattern}}" {{log_dir}}/client-{{date}}.log 2>/dev/null || echo "No matches"

# =============================================================================
# Development Commands
# =============================================================================

# Run database migrations
db-migrate:
    @cd {{api_dir}} && bun run db:migrate

# Open Drizzle Studio (database GUI)
db-studio:
    @cd {{api_dir}} && bun run db:studio

# Run type checking
typecheck:
    @cd {{justfile_directory()}} && bun run typecheck

# Build for production
build:
    @cd {{justfile_directory()}} && bun run build

# =============================================================================
# Utility Commands
# =============================================================================

# Clean up old log files (keeps last N days)
clean-logs:
    @echo "Cleaning logs older than {{log_retention}} days..."
    @find {{log_dir}} -name "*.log" -mtime +{{log_retention}} -delete -print 2>/dev/null || true
    @echo "Done."

# Kill any processes on our ports (emergency cleanup)
kill-ports:
    @echo "Killing processes on ports 5173 and 8001..."
    @fuser -k 5173/tcp 2>/dev/null || true
    @fuser -k 8001/tcp 2>/dev/null || true
    @rm -f {{api_pid}} {{client_pid}}
    @echo "Done."

# Show disk usage
disk:
    @echo "=== Disk Usage ==="
    @df -h / | tail -1
    @echo ""
    @echo "=== Log Directory ==="
    @du -sh {{log_dir}} 2>/dev/null || echo "No logs yet"
    @echo ""
    @echo "=== Bun Cache ==="
    @du -sh ~/.bun/install/cache 2>/dev/null || echo "No cache"

# Clear caches to free disk space
clear-cache:
    @echo "Clearing caches..."
    @rm -rf ~/.cache/* ~/.bun/install/cache/* 2>/dev/null || true
    @echo "Done."

# =============================================================================
# Internal Helpers
# =============================================================================

# Ensure log directory exists
_ensure-logs:
    @mkdir -p {{log_dir}}

# Clean up old logs on start
_cleanup-old-logs:
    @find {{log_dir}} -name "*.log" -mtime +{{log_retention}} -delete 2>/dev/null || true
