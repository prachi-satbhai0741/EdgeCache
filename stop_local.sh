#!/bin/bash
# ==============================================================================
# EdgeCache — Local Cluster Terminator
# Gracefully stops all EdgeCache background processes
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "🛑 Stopping all EdgeCache processes..."

for pidfile in logs/*.pid; do
    if [ -f "$pidfile" ]; then
        PID=$(cat "$pidfile")
        if kill -0 "$PID" 2>/dev/null; then
            echo "Killing process $PID ($(basename "$pidfile" .pid))..."
            kill "$PID" 2>/dev/null || true
        fi
        rm -f "$pidfile"
    fi
done

# Also ensure any lingering ports are freed
fuser -k 9080/tcp 2>/dev/null || true
fuser -k 8001/tcp 2>/dev/null || true
fuser -k 8002/tcp 2>/dev/null || true
fuser -k 8003/tcp 2>/dev/null || true
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || true

echo "✅ All EdgeCache services stopped."
