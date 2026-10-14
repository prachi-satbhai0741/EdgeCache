#!/bin/bash
# ==============================================================================
# EdgeCache — Local Cluster Launcher
# Runs all 5 backend processes and 1 frontend dev server concurrently
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=================================================="
echo "🚀 Starting EdgeCache Distributed Simulator"
echo "=================================================="

# Check Python venv
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    ./venv/bin/pip install -r origin_server/requirements.txt
fi

mkdir -p logs

# 1. Start Origin Server (:9080)
echo "🌐 [1/6] Launching Origin Server on port 9080..."
ORIGIN_PORT=9080 ORIGIN_LATENCY_MS=500 ./venv/bin/python origin_server/main.py > logs/origin.log 2>&1 &
ORIGIN_PID=$!
echo $ORIGIN_PID > logs/origin.pid

# 2. Start Cache Node 1 (:8001)
echo "📦 [2/6] Launching Cache Node 1 on port 8001..."
NODE_ID=node-1 NODE_PORT=8001 ORIGIN_URL=http://localhost:9080 CACHE_CAPACITY=5 CACHE_TTL=60 ./venv/bin/python cache_node/main.py > logs/node1.log 2>&1 &
NODE1_PID=$!
echo $NODE1_PID > logs/node1.pid

# 3. Start Cache Node 2 (:8002)
echo "📦 [3/6] Launching Cache Node 2 on port 8002..."
NODE_ID=node-2 NODE_PORT=8002 ORIGIN_URL=http://localhost:9080 CACHE_CAPACITY=5 CACHE_TTL=60 ./venv/bin/python cache_node/main.py > logs/node2.log 2>&1 &
NODE2_PID=$!
echo $NODE2_PID > logs/node2.pid

# 4. Start Cache Node 3 (:8003)
echo "📦 [4/6] Launching Cache Node 3 on port 8003..."
NODE_ID=node-3 NODE_PORT=8003 ORIGIN_URL=http://localhost:9080 CACHE_CAPACITY=5 CACHE_TTL=60 ./venv/bin/python cache_node/main.py > logs/node3.log 2>&1 &
NODE3_PID=$!
echo $NODE3_PID > logs/node3.pid

# Give nodes a second to start
sleep 1.5

# 5. Start Router (:8000)
echo "🔀 [5/6] Launching Router / Load Balancer on port 8000..."
ROUTER_PORT=8000 ORIGIN_URL=http://localhost:9080 NODE_1_URL=http://localhost:8001 NODE_2_URL=http://localhost:8002 NODE_3_URL=http://localhost:8003 ./venv/bin/python router/main.py > logs/router.log 2>&1 &
ROUTER_PID=$!
echo $ROUTER_PID > logs/router.pid

# 6. Start Frontend (:5173)
echo "💻 [6/6] Launching Frontend Dashboard on port 5173..."
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..

echo "=================================================="
echo "✅ EdgeCache is UP and RUNNING!"
echo "   - Frontend UI:      http://localhost:5173"
echo "   - Router / API:     http://localhost:8000"
echo "   - Cache Node 1:     http://localhost:8001"
echo "   - Cache Node 2:     http://localhost:8002"
echo "   - Cache Node 3:     http://localhost:8003"
echo "   - Origin Server:    http://localhost:8080"
echo "   - Output logs:      ./logs/"
echo "To shut down all services, run: ./stop_local.sh"
echo "=================================================="
