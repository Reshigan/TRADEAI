# AI Orchestrator Guide

## Overview

The AI Orchestrator is a comprehensive system that uses **Ollama LLM** to intelligently route user requests to appropriate ML service endpoints and generate natural language explanations. This implements a **3-tier AI strategy** for 100% uptime and optimal user experience.

## Architecture

```
User Request → AI Orchestrator → Tool Selection (Ollama) → ML Service → Explanation (Ollama) → User
                                      ↓ (fallback)              ↓ (fallback)
                                  Rule-based Router      Rule-based Response
```

### 3-Tier Strategy

1. **Tier 1 - Ollama LLM**: Natural language understanding, tool selection, and explanation generation
2. **Tier 2 - ML Service**: Structured predictions with confidence intervals (Python/FastAPI)
3. **Tier 3 - Rule-based Fallback**: Deterministic responses when LLM/ML services are unavailable

## Components

### 1. AI Orchestrator Service (`backend/src/services/aiOrchestratorService.js`)

**Core Responsibilities:**
- Tool selection based on user intent
- ML service endpoint routing
- Natural language explanation generation
- Result caching (30-minute TTL)
- Tenant-aware request handling

**Available Tools:**
- `forecast_demand`: Predict future product demand
- `optimize_price`: Calculate optimal pricing with elasticity
- `analyze_promotion_lift`: Measure promotion effectiveness
- `predict_customer_ltv`: Estimate customer lifetime value
- `predict_churn`: Identify at-risk customers
- `segment_customers`: RFM/ML-based customer segmentation
- `detect_anomalies`: Identify unusual patterns in metrics

### 2. API Routes (`backend/src/routes/aiOrchestrator.js`)

**Endpoints:**

#### `POST /api/ai-orchestrator/orchestrate`
Main orchestration endpoint - routes user intent to appropriate tool.

**Request:**
```json
{
  "intent": "What will be the demand for product ABC next month?",
  "context": {
    "productId": "abc123",
    "customerId": "cust456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "tool": "forecast_demand",
  "data": {
    "predictions": [...],
    "confidence": 0.87,
    "trends": {...}
  },
  "explanation": "Based on historical data, we predict demand will be 1,250 units next month with 87% confidence. This represents a 15% increase from the current month.",
  "confidence": 0.85,
  "duration": 1234,
  "timestamp": "2025-11-13T18:30:00.000Z"
}
```

#### `POST /api/ai-orchestrator/explain`
Generate natural language explanation for ML results.

**Request:**
```json
{
  "data": {
    "predictedCLV": 15000,
    "confidence": 0.85
  },
  "context": {
    "userIntent": "What is this customer's value?",
    "toolName": "predict_customer_ltv"
  }
}
```

**Response:**
```json
{
  "success": true,
  "explanation": "This customer's predicted lifetime value is $15,000 with 85% confidence. Consider offering premium services to maximize retention.",
  "timestamp": "2025-11-13T18:30:00.000Z"
}
```

#### `GET /api/ai-orchestrator/tools`
List all available AI tools with descriptions and parameters.

#### `GET /api/ai-orchestrator/health`
Health check for orchestrator, Ollama, and ML service.

**Response:**
```json
{
  "orchestrator": "operational",
  "ollama": {
    "available": true,
    "status": "operational",
    "model": "phi3:mini"
  },
  "mlService": {
    "available": true,
    "status": "operational"
  },
  "fallback": {
    "enabled": true,
    "status": "operational"
  },
  "timestamp": "2025-11-13T18:30:00.000Z"
}
```

#### `POST /api/ai-orchestrator/cache/clear`
Clear orchestrator cache (admin only).

### 3. Ollama Service Configuration

**Docker Compose (`docker-compose.production.yml`):**
```yaml
ollama:
  image: ollama/ollama:latest
  container_name: tradeai-ollama
  restart: unless-stopped
  environment:
    OLLAMA_HOST: 0.0.0.0:11434
    OLLAMA_MODELS: /root/.ollama/models
  volumes:
    - ollama_models:/root/.ollama
  ports:
    - "11434:11434"
  networks:
    - tradeai-network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 120s
  deploy:
    resources:
      limits:
        memory: 4G
      reservations:
        memory: 2G
```

**Environment Variables:**
- `OLLAMA_URL`: Ollama service URL (default: `http://localhost:11434`)
- `OLLAMA_MODEL`: Model to use (default: `phi3:mini`)
- `OLLAMA_TIMEOUT`: Request timeout in ms (default: `60000`)

### 4. Model Initialization (`scripts/init-ollama.sh`)

Automatically pulls the configured Ollama model on container startup.

**Usage:**
```bash
# Run manually
./scripts/init-ollama.sh

# Run in Docker
docker exec tradeai-ollama /app/scripts/init-ollama.sh
```

## Deployment

### 1. Update Environment Variables

Add to `.env`:
```bash
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=phi3:mini
OLLAMA_TIMEOUT=60000
ML_SERVICE_URL=http://ml-service:8001
```

### 2. Start Services

```bash
# Start all services including Ollama
docker-compose -f docker-compose.production.yml up -d

# Initialize Ollama model
docker exec tradeai-ollama /app/scripts/init-ollama.sh

# Verify Ollama is ready
curl http://localhost:11434/api/tags

# Verify orchestrator health
curl http://localhost:5002/api/ai-orchestrator/health
```

### 3. Test Orchestration

```bash
# Test orchestration endpoint
curl -X POST http://localhost:5002/api/ai-orchestrator/orchestrate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "intent": "Forecast demand for product XYZ",
    "context": {
      "productId": "xyz123"
    }
  }'
```

## Usage Examples

### Example 1: Demand Forecasting

```javascript
// Frontend code
const response = await fetch('/api/ai-orchestrator/orchestrate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    intent: 'What will be the demand for Product ABC in the next 30 days?',
    context: {
      productId: 'abc123',
      tenantId: 'tenant1'
    }
  })
});

const result = await response.json();
console.log(result.explanation);
// "Based on historical data, we predict demand will be 1,250 units over the next 30 days..."
```

### Example 2: Customer Churn Prediction

```javascript
const response = await fetch('/api/ai-orchestrator/orchestrate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    intent: 'Is customer XYZ at risk of churning?',
    context: {
      customerId: 'xyz789',
      tenantId: 'tenant1'
    }
  })
});

const result = await response.json();
console.log(result.explanation);
// "Churn risk is high with a 78% probability. Consider retention strategies..."
```

### Example 3: Price Optimization

```javascript
const response = await fetch('/api/ai-orchestrator/orchestrate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    intent: 'What is the optimal price for Product ABC?',
    context: {
      productId: 'abc123',
      constraints: {
        minPrice: 10,
        maxPrice: 50,
        targetMargin: 0.3
      }
    }
  })
});

const result = await response.json();
console.log(result.explanation);
// "The optimal price is $32.50, which should generate $15,000 in additional revenue..."
```

## Fallback Behavior

The AI Orchestrator implements graceful degradation:

1. **Ollama Unavailable**: Falls back to rule-based tool selection using keyword matching
2. **ML Service Unavailable**: Returns rule-based predictions with lower confidence
3. **Both Unavailable**: Returns deterministic responses based on business rules

**Example Fallback Response:**
```json
{
  "success": true,
  "tool": "forecast_demand",
  "data": {
    "predictions": [...],
    "confidence": 0.7
  },
  "explanation": "Based on historical trends, demand is expected to increase by 10%.",
  "fallback": true,
  "timestamp": "2025-11-13T18:30:00.000Z"
}
```

## Caching Strategy

- **Cache TTL**: 30 minutes
- **Cache Key**: `{toolName}_{parameters_hash}`
- **Cache Cleanup**: Automatic when cache size exceeds 1000 entries
- **Manual Clear**: `POST /api/ai-orchestrator/cache/clear` (admin only)

## Monitoring

### Health Checks

```bash
# Check orchestrator health
curl http://localhost:5002/api/ai-orchestrator/health

# Check Ollama directly
curl http://localhost:11434/api/tags

# Check ML service
curl http://localhost:8001/health
```

### Logs

```bash
# View orchestrator logs
docker logs tradeai-backend | grep "AI orchestration"

# View Ollama logs
docker logs tradeai-ollama

# View ML service logs
docker logs tradeai-ml-service
```

## Performance Considerations

- **Ollama Response Time**: 2-5 seconds (depends on model size and prompt complexity)
- **ML Service Response Time**: 100-500ms (depends on model complexity)
- **Cache Hit Rate**: Target 60%+ for production workloads
- **Memory Usage**: Phi-3-mini requires ~2GB RAM (quantized)

## Model Selection

### Recommended Models

1. **phi3:mini** (Default)
   - Size: ~2GB (quantized)
   - Speed: Fast
   - Quality: Good for tool selection and business explanations
   - Best for: Production deployments with limited resources

2. **llama3.2:3b**
   - Size: ~2GB
   - Speed: Fast
   - Quality: Excellent JSON adherence
   - Best for: Strict tool calling requirements

3. **mistral:7b**
   - Size: ~4GB
   - Speed: Moderate
   - Quality: Excellent reasoning
   - Best for: Complex business logic and detailed explanations

### Changing Models

```bash
# Update environment variable
export OLLAMA_MODEL=llama3.2:3b

# Pull new model
docker exec tradeai-ollama ollama pull llama3.2:3b

# Restart backend to use new model
docker restart tradeai-backend
```

## Security

- **Authentication**: All endpoints require JWT authentication
- **Tenant Isolation**: Automatic tenantId injection from JWT
- **Rate Limiting**: Standard API rate limits apply
- **Audit Logging**: All orchestration requests are logged
- **Data Redaction**: Sensitive data is not sent to LLM

## Troubleshooting

### Issue: Ollama service not starting

**Solution:**
```bash
# Check Ollama logs
docker logs tradeai-ollama

# Restart Ollama
docker restart tradeai-ollama

# Verify health
curl http://localhost:11434/api/tags
```

### Issue: Model not found

**Solution:**
```bash
# Pull model manually
docker exec tradeai-ollama ollama pull phi3:mini

# Run init script
docker exec tradeai-ollama /app/scripts/init-ollama.sh
```

### Issue: Slow response times

**Solutions:**
1. Use smaller model (phi3:mini instead of mistral:7b)
2. Increase cache TTL
3. Pre-warm cache with common queries
4. Add more memory to Ollama container

### Issue: Tool selection errors

**Solutions:**
1. Check Ollama logs for JSON parsing errors
2. Verify model supports JSON output
3. Fallback to rule-based selection is automatic
4. Consider using llama3.2 for better JSON adherence

## Future Enhancements

- [ ] Function calling support for better tool selection
- [ ] Streaming responses for real-time explanations
- [ ] Multi-model support (fallback chain)
- [ ] Fine-tuned models for domain-specific tasks
- [ ] A/B testing for explanation quality
- [ ] User feedback loop for continuous improvement

## References

- [Ollama Documentation](https://github.com/ollama/ollama)
- [Phi-3 Model Card](https://huggingface.co/microsoft/Phi-3-mini-4k-instruct)
- [ML Service API Documentation](./ml-services/README.md)
- [Frontend Integration Guide](./FRONTEND_MIGRATION.md)
