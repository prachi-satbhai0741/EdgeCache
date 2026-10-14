FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV ROUTER_PORT=8000
ENV ORIGIN_URL=http://origin:8080
ENV NODE_1_URL=http://cache-node-1:8001
ENV NODE_2_URL=http://cache-node-2:8002
ENV NODE_3_URL=http://cache-node-3:8003

EXPOSE 8000

CMD ["python", "main.py"]
