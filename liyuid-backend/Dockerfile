FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DEFAULT_TIMEOUT=1000 \
    PIP_RETRIES=10 \
    PYTHONPATH="/app:/app/liyuid-backend:${PYTHONPATH}"

WORKDIR /app

# Copy requirements file (available both in root context and subfolder context)
COPY requirements.txt .

# Pre-install lightweight CPU PyTorch wheel and dependencies
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu torch && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Run migrations then uvicorn dynamically regardless of root or subfolder context
CMD ["sh", "-c", "if [ -d liyuid-backend/app ]; then cd liyuid-backend; fi && alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
