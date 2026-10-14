FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV ORIGIN_PORT=9080
ENV ORIGIN_LATENCY_MS=500

EXPOSE 9080

CMD ["python", "main.py"]
