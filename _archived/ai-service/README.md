# TRADEAI AI Service

## Overview
AI microservice for TRADEAI - integrates Ollama + Llama3 for intelligent trade promotion management.

## Features
- 🤖 **Conversational AI Assistant**: Chat interface for user queries
- 📊 **Promotion Analysis**: AI-powered insights on promotion effectiveness
- 👥 **Customer Insights**: Intelligent customer segmentation and recommendations
- 💰 **Budget Optimization**: AI suggestions for budget allocation
- 🗣️ **NLP Query Processing**: Natural language to data query conversion

## Endpoints

### Health Check
```
GET /health
```

### Chat with AI Assistant
```
POST /api/chat
Body: {
  "message": "What are the best practices for trade promotions?",
  "context": {} // optional
}
```

### Analyze Promotion
```
POST /api/analyze/promotion
Body: {
  "promotion": {
    "name": "Summer Sale",
    "type": "Discount",
    "startDate": "2025-06-01",
    "endDate": "2025-06-30",
    "budget": 50000
  }
}
```

### Analyze Customer
```
POST /api/analyze/customer
Body: {
  "customer": {
    "name": "Walmart",
    "revenue": 1000000,
    "location": "USA",
    "status": "Active"
  }
}
```

### Optimize Budget
```
POST /api/analyze/budget
Body: {
  "budget": {
    "name": "Q1 Marketing",
    "totalAmount": 100000,
    "allocated": 60000,
    "remaining": 40000
  }
}
```

### NLP Query Processing
```
POST /api/nlp/query
Body: {
  "query": "Show me top 5 active promotions"
}
```

### List Available Models
```
GET /api/models
```

## Installation

```bash
cd ai-service
npm install
npm start
```

## Environment Variables
- `PORT`: Service port (default: 5001)
- `OLLAMA_URL`: Ollama API URL (default: http://localhost:11434)
- `NODE_ENV`: Environment (default: production)

## Requirements
- Node.js >= 18.0.0
- Ollama installed and running
- Llama3.2:1b model downloaded

## Deployment
```bash
# On production server
cd /opt/tradeai/ai-service
npm install --production
pm2 start server.js --name tradeai-ai-service
```

## Architecture
```
TRADEAI Frontend → AI Service (Port 5001) → Ollama (Port 11434) → Llama3.2
```

## Performance
- Response time: 1-3 seconds (CPU mode)
- Concurrent requests: Up to 10 (CPU limited)
- Model: llama3.2:1b (1.3GB, optimized for speed)

## Future Enhancements
- [ ] Streaming responses for better UX
- [ ] Model fine-tuning on TPM domain data
- [ ] GPU acceleration for faster responses
- [ ] Caching for common queries
- [ ] Multi-model support (mistral, GPT-4)
- [ ] Advanced NLP with embeddings
- [ ] Real-time ML predictions integration
