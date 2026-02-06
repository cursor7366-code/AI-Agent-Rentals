# OpenClaw Pipeline - Main cycle runner
# Runs one cycle and exits (no daemon mode)

FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY scripts/ /app/scripts/

# Create non-root user for safety
RUN useradd -m -u 1000 opint && \
    mkdir -p /data /app/opint_logs /app/opint_reports && \
    chown -R opint:opint /app /data

USER opint

# Entry point: run one cycle and exit
ENTRYPOINT ["python", "-m", "scripts.main_cycle"]
