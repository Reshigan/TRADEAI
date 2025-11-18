FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies with retry logic
RUN for i in $(seq 1 5); do \
      echo "Attempt $i to install dependencies..." && \
      pip install --no-cache-dir -r requirements.txt && exit 0 || \
      echo "Attempt $i failed, waiting before retry..." && \
      sleep 5; \
    done && \
    echo "All attempts failed" && \
    exit 1

# Copy application code
COPY . .

# Create directories for models and data
RUN mkdir -p models data logs

# Set environment variables
ENV PORT=8000
ENV HOST=0.0.0.0
ENV MODEL_DIR=/app/models
ENV DATA_DIR=/app/data
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "src/prediction_api.py"]