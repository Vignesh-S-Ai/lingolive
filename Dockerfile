FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/ ./backend/

# Copy frontend application
COPY frontend/ ./frontend/

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    GNANI_API_KEY="" \
    LIVEKIT_URL="wss://your-livekit-instance.com" \
    LIVEKIT_API_KEY="" \
    LIVEKIT_API_SECRET="" \
    DATABASE_URL="postgresql+asyncpg://user:password@localhost/translator_db"

# Expose backend and frontend ports
EXPOSE 8000 5173

# Start both backend and frontend with concurrently
CMD ["sh", "-c", "cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 &] && [ -f frontend/package.json ] && cd frontend && npm run dev || true"]