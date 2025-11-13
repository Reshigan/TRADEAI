#!/bin/bash

set -e

OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
MODEL="${OLLAMA_MODEL:-phi3:mini}"
MAX_RETRIES=30
RETRY_DELAY=2

echo "🤖 Initializing Ollama service..."
echo "   Host: $OLLAMA_HOST"
echo "   Model: $MODEL"

echo "⏳ Waiting for Ollama service to start..."
for i in $(seq 1 $MAX_RETRIES); do
    if curl -s "$OLLAMA_HOST/api/tags" > /dev/null 2>&1; then
        echo "✅ Ollama service is ready"
        break
    fi
    
    if [ $i -eq $MAX_RETRIES ]; then
        echo "❌ Ollama service failed to start after $MAX_RETRIES attempts"
        exit 1
    fi
    
    echo "   Attempt $i/$MAX_RETRIES - waiting ${RETRY_DELAY}s..."
    sleep $RETRY_DELAY
done

echo "🔍 Checking if model '$MODEL' is available..."
if curl -s "$OLLAMA_HOST/api/tags" | grep -q "\"name\":\"$MODEL\""; then
    echo "✅ Model '$MODEL' is already available"
    exit 0
fi

echo "📥 Pulling model '$MODEL'..."
echo "   This may take several minutes depending on model size..."

if curl -X POST "$OLLAMA_HOST/api/pull" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$MODEL\"}" \
    --max-time 600 \
    --silent \
    --show-error; then
    echo "✅ Model '$MODEL' pulled successfully"
else
    echo "❌ Failed to pull model '$MODEL'"
    exit 1
fi

echo "🔍 Verifying model installation..."
if curl -s "$OLLAMA_HOST/api/tags" | grep -q "\"name\":\"$MODEL\""; then
    echo "✅ Model '$MODEL' verified and ready to use"
    
    echo ""
    echo "📋 Available models:"
    curl -s "$OLLAMA_HOST/api/tags" | grep -o '"name":"[^"]*"' | cut -d'"' -f4
else
    echo "❌ Model verification failed"
    exit 1
fi

echo ""
echo "🎉 Ollama initialization complete!"
