FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DEFAULT_TIMEOUT=1000 \
    PIP_RETRIES=10 \
    HF_HOME=/app/.cache/huggingface

WORKDIR /app

# 1. System packages (Debian layer)
RUN echo 'Acquire::http::Timeout "60";' > /etc/apt/apt.conf.d/99timeout && \
    echo 'Acquire::Retries "10";' >> /etc/apt/apt.conf.d/99timeout && \
    apt-get update -o Acquire::CompressionTypes::Order::=gz && \
    apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

# 2. PyTorch CPU-only installation
RUN pip install --no-cache-dir --default-timeout=1000 --retries 10 torch --index-url https://download.pytorch.org/whl/cpu

# 3. Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=1000 --retries 10 -r requirements.txt
RUN pip uninstall -y torchvision || true

# 4. Create standard unprivileged system user
RUN useradd -m -u 1000 -s /bin/bash appuser && \
    mkdir -p /app/.cache/huggingface && \
    chown -R appuser:appuser /app

# 5. Pre-cache SentenceTransformer model weights into /app/.cache
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')" && \
    chown -R appuser:appuser /app/.cache

# 6. Copy application code with unprivileged user ownership
COPY --chown=appuser:appuser . .

# 7. Drop privileges from root to appuser
USER appuser

CMD ["celery", "-A", "tasks", "worker", "--loglevel=info", "--concurrency=2"]