FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV NODE_ID=node-1
ENV NODE_PORT=8001
ENV ORIGIN_URL=http://origin:9080
ENV CACHE_CAPACITY=5
ENV CACHE_TTL=60

EXPOSE 8001

CMD ["python", "main.py"]
