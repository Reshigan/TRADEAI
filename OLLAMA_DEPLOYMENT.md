# Ollama Deployment Guide for TRADEAI

## Overview

TRADEAI uses Ollama with the phi3:mini model for AI-powered tool selection and natural language explanation generation. This guide covers deployment, configuration, and troubleshooting.

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available for Ollama
- Network access to pull Ollama models (~2.2GB for phi3:mini)

## Deployment Options

### Option 1: Docker Compose (Recommended)

The TRADEAI platform includes Ollama in the production docker-compose configuration.

**1. Start Ollama Service**
```bash
docker-compose -f docker-compose.production.yml up -d ollama
```

**2. Verify Ollama is Running**
```bash
docker ps | grep ollama
# Should show: tradeai-ollama container running
```

**3. Pull the phi3:mini Model**
```bash
docker exec tradeai-ollama ollama pull phi3:mini
```

**4. Verify Model is Available**
```bash
docker exec tradeai-ollama ollama list
# Should show: phi3:mini with size ~2.2GB
```

**5. Test Ollama API**
```bash
curl http://localhost:11434/api/tags
# Should return JSON with available models
```

### Option 2: Standalone Ollama Installation

If you prefer to run Ollama outside of Docker:

**1. Install Ollama**
```bash
# Linux
curl -fsSL https://ollama.com/install.sh | sh

# macOS
brew install ollama

# Windows
# Download from https://ollama.com/download
```

**2. Start Ollama Service**
```bash
ollama serve
```

**3. Pull phi3:mini Model**
```bash
ollama pull phi3:mini
```

**4. Verify Installation**
```bash
ollama list
curl http://localhost:11434/api/tags
```

## Configuration

### Environment Variables

Configure Ollama connection in your backend `.env` file:

```bash
# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=phi3:mini
OLLAMA_TIMEOUT=60000

# ML Service Configuration
ML_SERVICE_URL=http://localhost:8001
```

For Docker deployments, these are set in `docker-compose.production.yml`:

```yaml
services:
  backend:
    environment:
      - OLLAMA_URL=http://ollama:11434
      - OLLAMA_MODEL=phi3:mini
      - OLLAMA_TIMEOUT=60000
```

### Model Selection

TRADEAI uses **phi3:mini** (3.8B parameters, Q4_0 quantization) by default. This model provides:
- Good instruction following for tool selection
- Strong business prose generation
- Low resource requirements (~2GB RAM)
- Fast inference times

**Alternative Models:**

If phi3:mini doesn't meet your needs, you can use:

1. **llama3.2:3b** - Similar size, good general performance
   ```bash
   ollama pull llama3.2:3b
   # Update OLLAMA_MODEL=llama3.2:3b
   ```

2. **mistral:7b** - Larger model, better accuracy, higher resource requirements
   ```bash
   ollama pull mistral:7b
   # Update OLLAMA_MODEL=mistral:7b
   # Requires ~8GB RAM
   ```

3. **gemma2:2b** - Smaller model, faster inference, lower accuracy
   ```bash
   ollama pull gemma2:2b
   # Update OLLAMA_MODEL=gemma2:2b
   # Requires ~1.5GB RAM
   ```

## Health Checks

### Check AI Orchestrator Health

```bash
curl http://localhost:5000/api/ai-orchestrator/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
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
  "timestamp": "2025-11-15T00:00:00.000Z"
}
```

### Test Tool Selection

```bash
curl -X POST http://localhost:5000/api/ai-orchestrator/orchestrate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIntent": "Forecast demand for product ABC",
    "context": {
      "tenantId": "test_tenant"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "tool": "forecast_demand",
  "data": { ... },
  "explanation": "Based on historical data, we predict demand will be...",
  "confidence": 0.85,
  "duration": 1234,
  "timestamp": "2025-11-15T00:00:00.000Z"
}
```

## Performance Tuning

### Ollama Configuration

Create `~/.ollama/config.json` (or mount in Docker):

```json
{
  "num_parallel": 4,
  "num_gpu": 0,
  "num_thread": 8,
  "num_ctx": 2048,
  "temperature": 0.1
}
```

**Parameters:**
- `num_parallel`: Number of parallel requests (default: 4)
- `num_gpu`: Number of GPUs to use (0 for CPU-only)
- `num_thread`: CPU threads for inference
- `num_ctx`: Context window size (tokens)
- `temperature`: Randomness (0.1 for deterministic, 0.7 for creative)

### Backend Caching

The AI orchestrator includes a 30-minute cache for results:

```javascript
// Cache configuration in aiOrchestratorService.js
this.cacheTTL = 30 * 60 * 1000; // 30 minutes
```

To clear cache:
```bash
curl -X POST http://localhost:5000/api/ai-orchestrator/cache/clear \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Resource Limits

For Docker deployments, set resource limits in `docker-compose.production.yml`:

```yaml
services:
  ollama:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
        reservations:
          cpus: '2'
          memory: 2G
```

## Monitoring

### Ollama Logs

**Docker:**
```bash
docker logs -f tradeai-ollama
```

**Standalone:**
```bash
journalctl -u ollama -f
```

### Backend AI Orchestrator Logs

```bash
docker logs -f tradeai-backend | grep "AI orchestration"
```

**Key Metrics to Monitor:**
- Tool selection accuracy
- Response times (should be <5s for tool selection, <10s for explanations)
- Cache hit rate
- Error rates

### Prometheus Metrics (Future)

Add metrics endpoint to track:
- `ai_orchestrator_requests_total`
- `ai_orchestrator_duration_seconds`
- `ai_orchestrator_cache_hits_total`
- `ollama_inference_duration_seconds`

## Troubleshooting

### Issue: Ollama Not Available

**Symptoms:**
```json
{
  "success": false,
  "error": "Ollama service is not available. Please ensure Ollama is running."
}
```

**Solutions:**
1. Check if Ollama is running:
   ```bash
   docker ps | grep ollama
   # or
   ps aux | grep ollama
   ```

2. Verify network connectivity:
   ```bash
   curl http://localhost:11434/api/tags
   ```

3. Check Docker network (if using Docker):
   ```bash
   docker network inspect tradeai-network
   ```

4. Restart Ollama:
   ```bash
   docker-compose restart ollama
   # or
   systemctl restart ollama
   ```

### Issue: Model Not Found

**Symptoms:**
```json
{
  "error": "model 'phi3:mini' not found"
}
```

**Solutions:**
1. Pull the model:
   ```bash
   docker exec tradeai-ollama ollama pull phi3:mini
   ```

2. Verify model is available:
   ```bash
   docker exec tradeai-ollama ollama list
   ```

3. Check disk space (model requires ~2.2GB):
   ```bash
   df -h
   ```

### Issue: Slow Response Times

**Symptoms:**
- Tool selection takes >10 seconds
- Explanation generation times out

**Solutions:**
1. Check CPU usage:
   ```bash
   docker stats tradeai-ollama
   ```

2. Increase CPU allocation:
   ```yaml
   # docker-compose.production.yml
   services:
     ollama:
       deploy:
         resources:
           limits:
             cpus: '8'  # Increase from 4
   ```

3. Use a smaller model:
   ```bash
   ollama pull gemma2:2b
   # Update OLLAMA_MODEL=gemma2:2b
   ```

4. Reduce context window:
   ```json
   {
     "num_ctx": 1024  // Reduce from 2048
   }
   ```

### Issue: Out of Memory

**Symptoms:**
```
Error: failed to allocate memory
```

**Solutions:**
1. Check available memory:
   ```bash
   free -h
   ```

2. Increase Docker memory limit:
   ```yaml
   services:
     ollama:
       deploy:
         resources:
           limits:
             memory: 6G  # Increase from 4G
   ```

3. Use a smaller quantization:
   ```bash
   ollama pull phi3:mini-q2  # Smaller quantization
   ```

4. Restart Ollama to clear memory:
   ```bash
   docker-compose restart ollama
   ```

### Issue: JSON Parsing Errors

**Symptoms:**
```
Failed to parse tool selection: No JSON found in response
```

**Solutions:**
1. Lower temperature for more deterministic output:
   ```javascript
   // In aiOrchestratorService.js
   temperature: 0.05  // Lower from 0.1
   ```

2. Add more explicit JSON formatting in prompts
3. Implement retry logic with exponential backoff

## Security Considerations

### Network Security

1. **Firewall Rules**: Ollama should not be exposed to the internet
   ```bash
   # Only allow localhost and Docker network
   ufw allow from 172.18.0.0/16 to any port 11434
   ```

2. **Docker Network Isolation**: Use internal Docker networks
   ```yaml
   networks:
     tradeai-network:
       internal: true
   ```

### Authentication

Ollama itself doesn't have built-in authentication. Protect it by:
1. Running on internal network only
2. Using backend authentication for all AI orchestrator endpoints
3. Implementing rate limiting

### Data Privacy

1. **No Data Persistence**: Ollama doesn't store prompts by default
2. **Local Deployment**: All inference happens locally, no external API calls
3. **Tenant Isolation**: Backend ensures tenant data separation

## Scaling

### Horizontal Scaling

For high-traffic deployments:

1. **Multiple Ollama Instances**:
   ```yaml
   services:
     ollama-1:
       image: ollama/ollama:latest
       ...
     ollama-2:
       image: ollama/ollama:latest
       ...
   ```

2. **Load Balancer**:
   ```yaml
   services:
     ollama-lb:
       image: nginx:alpine
       volumes:
         - ./nginx-ollama.conf:/etc/nginx/nginx.conf
   ```

3. **Backend Configuration**:
   ```bash
   OLLAMA_URL=http://ollama-lb:11434
   ```

### Vertical Scaling

For better performance on single instance:

1. **GPU Acceleration** (if available):
   ```yaml
   services:
     ollama:
       deploy:
         resources:
           reservations:
             devices:
               - driver: nvidia
                 count: 1
                 capabilities: [gpu]
   ```

2. **More CPU/RAM**:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '16'
         memory: 16G
   ```

## Backup and Recovery

### Model Backup

Models are stored in Ollama's data directory:

**Docker:**
```bash
docker cp tradeai-ollama:/root/.ollama/models ./ollama-models-backup
```

**Standalone:**
```bash
cp -r ~/.ollama/models ~/ollama-models-backup
```

### Restore Models

```bash
docker cp ./ollama-models-backup/. tradeai-ollama:/root/.ollama/models
docker-compose restart ollama
```

## Production Checklist

- [ ] Ollama service is running and healthy
- [ ] phi3:mini model is pulled and available
- [ ] Health check endpoint returns "operational"
- [ ] Test tool selection works end-to-end
- [ ] Resource limits are configured appropriately
- [ ] Monitoring and logging are set up
- [ ] Firewall rules restrict external access
- [ ] Backup strategy is in place
- [ ] Documentation is updated with deployment details
- [ ] Team is trained on troubleshooting procedures

## Support

For issues not covered in this guide:
- Check Ollama documentation: https://ollama.com/docs
- Review TRADEAI logs: `docker logs tradeai-backend`
- Contact support: reshigan@gonxt.tech
