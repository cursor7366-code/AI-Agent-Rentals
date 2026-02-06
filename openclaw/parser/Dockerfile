# OpenClaw Doc Parser - Sandboxed extraction container
# NO INTERNET EGRESS - opint_parse_net only

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PDF/OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmupdf-dev \
    mupdf-tools \
    tesseract-ocr \
    tesseract-ocr-eng \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ /app/

# Create non-root user
RUN useradd -m -u 1000 parser && \
    chown -R parser:parser /app

USER parser

EXPOSE 8000

# Simple HTTP server for parsing requests
CMD ["python", "server.py"]
