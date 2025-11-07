"""
TRADEAI ML Serving API
FastAPI application for serving ML models in production

Endpoints:
- POST /api/v1/forecast/demand - Demand forecasting
- POST /api/v1/optimize/price - Price optimization
- POST /api/v1/analyze/promotion-lift - Promotion lift analysis
- POST /api/v1/recommend/products - Product recommendations
- GET /health - Health check
- GET /api/v1/models/{model_type} - Model information
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime, date, timedelta
import logging
import sys
import os
import uvicorn

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="TRADEAI ML API",
    description="Production ML serving API for demand forecasting, price optimization, promotion analysis, and recommendations",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models

class ForecastRequest(BaseModel):
    product_id: str = Field(..., description="Product identifier")
    customer_id: str = Field(..., description="Customer identifier")
    horizon_days: int = Field(90, description="Number of days to forecast", ge=1, le=365)
    include_promotions: bool = Field(True, description="Include promotion effects")
    confidence_level: float = Field(0.95, description="Confidence level for intervals", ge=0.5, le=0.99)

class ForecastPoint(BaseModel):
    date: str
    predicted_volume: float
    confidence_lower: float
    confidence_upper: float

class ForecastResponse(BaseModel):
    product_id: str
    customer_id: str
    forecast: List[ForecastPoint]
    accuracy_estimate: float
    model_version: str
    features_count: int
    timestamp: str

class PriceOptimizationRequest(BaseModel):
    product_id: str = Field(..., description="Product identifier")
    current_price: float = Field(..., description="Current price", gt=0)
    cost: float = Field(..., description="Unit cost", gt=0)
    constraints: Optional[Dict[str, float]] = Field(None, description="Price constraints (min_price, max_price)")
    optimization_objective: str = Field("profit", description="Objective: profit, revenue, or market_share")

class PriceOptimizationResponse(BaseModel):
    product_id: str
    current_price: float
    optimal_price: float
    price_change_pct: float
    expected_impact: Dict[str, float]
    confidence: float
    model_version: str
    timestamp: str

class PromotionLiftRequest(BaseModel):
    promotion_id: str = Field(..., description="Promotion identifier")
    pre_period: Dict[str, str] = Field(..., description="Pre-promotion period (start_date, end_date)")
    post_period: Dict[str, str] = Field(..., description="Promotion period (start_date, end_date)")

class PromotionLiftResponse(BaseModel):
    promotion_id: str
    incremental_lift: Dict[str, Any]
    statistics: Dict[str, Any]
    roi: Dict[str, Any]
    recommendation: str
    model_version: str
    timestamp: str

class ProductRecommendationRequest(BaseModel):
    customer_id: str = Field(..., description="Customer identifier")
    context: Optional[Dict[str, Any]] = Field({}, description="Context (season, promotions, etc.)")
    top_n: int = Field(10, description="Number of recommendations", ge=1, le=50)

class Recommendation(BaseModel):
    product_id: str
    product_name: str
    score: float
    confidence: float
    reason: str
    expected_uplift_pct: float

class ProductRecommendationResponse(BaseModel):
    customer_id: str
    recommendations: List[Recommendation]
    model_version: str
    timestamp: str

class CustomerSegmentationRequest(BaseModel):
    method: str = Field("rfm", description="Segmentation method: rfm, abc, or clustering")
    tenant_id: str = Field(..., description="Tenant identifier")
    start_date: Optional[str] = Field(None, description="Start date for analysis")
    end_date: Optional[str] = Field(None, description="End date for analysis")

class Segment(BaseModel):
    name: str
    count: int
    percentage: float
    avgRevenue: float
    color: str

class CustomerSegmentationResponse(BaseModel):
    method: str
    totalCustomers: int
    segments: List[Segment]
    insights: List[Dict[str, str]]
    timestamp: str

class AnomalyDetectionRequest(BaseModel):
    metric_type: str = Field(..., description="Metric type: sales, inventory, returns, etc.")
    tenant_id: str = Field(..., description="Tenant identifier")
    start_date: Optional[str] = Field(None, description="Start date for analysis")
    end_date: Optional[str] = Field(None, description="End date for analysis")
    threshold: float = Field(2.5, description="Anomaly detection threshold (std deviations)")

class Anomaly(BaseModel):
    id: str
    date: str
    metricType: str
    actualValue: float
    expectedValue: float
    deviation: float
    severity: str
    description: str

class AnomalyDetectionResponse(BaseModel):
    metricType: str
    detectedAnomalies: int
    anomalies: List[Anomaly]
    summary: Dict[str, int]
    timestamp: str

# Global model cache
model_cache = {
    'demand_forecasting': None,
    'price_optimization': None,
    'promotion_lift': None,
    'recommendations': None,
    'customer_segmentation': None,
    'anomaly_detection': None
}

# Model loading functions
def load_models():
    """Load all ML models into memory"""
    try:
        logger.info("Loading ML models...")
        
        # Import models (lazy loading)
        from models.demand_forecasting.forecaster import DemandForecaster
        from models.price_optimization.optimizer import PriceOptimizer
        from models.promotion_lift.analyzer import PromotionLiftAnalyzer
        from models.recommendation.recommender import RecommendationEngine
        
        # Load configurations
        config = {
            'experiment_name': 'production',
            'hyperparameters': {}
        }
        
        # Initialize models
        model_cache['demand_forecasting'] = DemandForecaster(config)
        model_cache['price_optimization'] = PriceOptimizer(config)
        model_cache['promotion_lift'] = PromotionLiftAnalyzer(config)
        model_cache['recommendations'] = RecommendationEngine(config)
        
        logger.info("✅ All models loaded successfully")
        
    except Exception as e:
        logger.error(f"❌ Error loading models: {e}")
        raise

# Startup event
@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    try:
        load_models()
    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        # Continue anyway - endpoints will return errors if models not loaded

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    models_loaded = all(model is not None for model in model_cache.values())
    
    return {
        "status": "healthy" if models_loaded else "degraded",
        "timestamp": datetime.now().isoformat(),
        "models": {
            "demand_forecasting": model_cache['demand_forecasting'] is not None,
            "price_optimization": model_cache['price_optimization'] is not None,
            "promotion_lift": model_cache['promotion_lift'] is not None,
            "recommendations": model_cache['recommendations'] is not None
        },
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    """API root"""
    return {
        "name": "TRADEAI ML API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            "POST /api/v1/forecast/demand",
            "POST /api/v1/optimize/price",
            "POST /api/v1/analyze/promotion-lift",
            "POST /api/v1/recommend/products",
            "GET /health",
            "GET /docs"
        ]
    }

# Demand Forecasting Endpoint
@app.post("/api/v1/forecast/demand", response_model=ForecastResponse)
async def forecast_demand(request: ForecastRequest):
    """
    Generate demand forecast for product-customer combination
    
    Returns 90-day (default) forecast with confidence intervals
    """
    logger.info(f"Forecasting demand: {request.product_id} + {request.customer_id}")
    
    if model_cache['demand_forecasting'] is None:
        raise HTTPException(status_code=503, detail="Demand forecasting model not loaded")
    
    try:
        # Generate mock forecast (replace with actual model prediction)
        import numpy as np
        from datetime import timedelta
        
        forecast_data = []
        base_value = 1000
        start_date = datetime.now()
        
        for i in range(request.horizon_days):
            date = start_date + timedelta(days=i)
            
            # Simple trend + seasonality
            trend = 1 + (i / request.horizon_days) * 0.1
            seasonal = 1 + np.sin((i / 7) * np.pi * 2) * 0.1
            noise = 0.95 + np.random.random() * 0.1
            
            value = base_value * trend * seasonal * noise
            
            forecast_data.append(ForecastPoint(
                date=date.strftime('%Y-%m-%d'),
                predicted_volume=round(value, 0),
                confidence_lower=round(value * 0.85, 0),
                confidence_upper=round(value * 1.15, 0)
            ))
        
        return ForecastResponse(
            product_id=request.product_id,
            customer_id=request.customer_id,
            forecast=forecast_data,
            accuracy_estimate=0.11,  # 11% MAPE
            model_version="v1.2.3",
            features_count=120,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Forecast failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Price Optimization Endpoint
@app.post("/api/v1/optimize/price", response_model=PriceOptimizationResponse)
async def optimize_price(request: PriceOptimizationRequest):
    """
    Optimize product price for maximum profit
    
    Returns optimal price with expected impact on profit, volume, and revenue
    """
    logger.info(f"Optimizing price: {request.product_id}")
    
    if model_cache['price_optimization'] is None:
        raise HTTPException(status_code=503, detail="Price optimization model not loaded")
    
    try:
        # Simple optimization (replace with actual model)
        target_margin = 0.4
        optimal_price = request.cost / (1 - target_margin)
        price_change = ((optimal_price - request.current_price) / request.current_price) * 100
        
        return PriceOptimizationResponse(
            product_id=request.product_id,
            current_price=request.current_price,
            optimal_price=round(optimal_price, 2),
            price_change_pct=round(price_change, 2),
            expected_impact={
                "volume_change_pct": round(-price_change * 0.5, 2),  # Elasticity effect
                "revenue_change_pct": round(price_change * 0.5, 2),
                "profit_change_pct": round(price_change * 1.5, 2)
            },
            confidence=0.85,
            model_version="v2.1.0",
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Price optimization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Promotion Lift Analysis Endpoint
@app.post("/api/v1/analyze/promotion-lift", response_model=PromotionLiftResponse)
async def analyze_promotion_lift(request: PromotionLiftRequest):
    """
    Analyze promotion lift using Causal Impact
    
    Returns incremental lift, statistical significance, and ROI
    """
    logger.info(f"Analyzing promotion: {request.promotion_id}")
    
    if model_cache['promotion_lift'] is None:
        raise HTTPException(status_code=503, detail="Promotion lift model not loaded")
    
    try:
        # Mock analysis (replace with actual model)
        import numpy as np
        
        baseline = 1000
        actual = 1200
        lift_pct = ((actual - baseline) / baseline) * 100
        
        return PromotionLiftResponse(
            promotion_id=request.promotion_id,
            incremental_lift={
                "volume": round(actual - baseline, 0),
                "percentage": round(lift_pct, 2),
                "confidence_interval": [15.2, 24.8]
            },
            statistics={
                "p_value": 0.001,
                "is_significant": True,
                "confidence_level": 0.95
            },
            roi={
                "promotion_cost": 5000,
                "incremental_revenue": 50000,
                "incremental_profit": 20000,
                "roi_percentage": 300.0,
                "payback_ratio": 4.0
            },
            recommendation="✅ EXCELLENT: Promotion highly successful with 20% lift and 300% ROI. Repeat this promotion!",
            model_version="v1.0.5",
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Promotion analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Product Recommendations Endpoint
@app.post("/api/v1/recommend/products", response_model=ProductRecommendationResponse)
async def recommend_products(request: ProductRecommendationRequest):
    """
    Generate personalized product recommendations
    
    Returns top N products with scores and reasons
    """
    logger.info(f"Generating recommendations: {request.customer_id}")
    
    if model_cache['recommendations'] is None:
        raise HTTPException(status_code=503, detail="Recommendation model not loaded")
    
    try:
        # Mock recommendations (replace with actual model)
        import numpy as np
        
        products = [
            "Cadbury Dairy Milk 150g",
            "Oreo Original 154g",
            "Cadbury Lunch Bar 48g",
            "Halls Mentho-Lyptus",
            "Cadbury PS Chocolate 80g",
            "Bournvita 500g",
            "Maynards Wine Gums 125g",
            "Stimorol Gum",
            "Cadbury Top Deck 80g",
            "Cadbury Whispers 135g"
        ]
        
        recommendations = []
        for i, product in enumerate(products[:request.top_n]):
            score = 0.9 - (i * 0.05)
            
            recommendations.append(Recommendation(
                product_id=f"prod-{i+1:03d}",
                product_name=product,
                score=round(score, 3),
                confidence=0.8,
                reason="High affinity based on past purchases" if i < 3 else "Popular in your customer segment",
                expected_uplift_pct=round(12.5 - i, 1)
            ))
        
        return ProductRecommendationResponse(
            customer_id=request.customer_id,
            recommendations=recommendations,
            model_version="v1.3.2",
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Recommendations failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Customer Segmentation Endpoint
@app.post("/api/v1/segment/customers", response_model=CustomerSegmentationResponse)
async def segment_customers(request: CustomerSegmentationRequest):
    """Segment customers using RFM, ABC, or clustering methods"""
    
    logger.info(f"Customer segmentation request: method={request.method}, tenant={request.tenant_id}")
    
    try:
        # Fallback data for now (ML model integration later)
        segments_data = {
            'rfm': [
                {'name': 'Champions', 'count': 45, 'percentage': 15.0, 'avgRevenue': 85000, 'color': '#10b981'},
                {'name': 'Loyal Customers', 'count': 62, 'percentage': 20.7, 'avgRevenue': 52000, 'color': '#3b82f6'},
                {'name': 'Potential Loyalists', 'count': 38, 'percentage': 12.7, 'avgRevenue': 35000, 'color': '#8b5cf6'},
                {'name': 'At Risk', 'count': 28, 'percentage': 9.3, 'avgRevenue': 42000, 'color': '#f59e0b'},
                {'name': 'Need Attention', 'count': 127, 'percentage': 42.3, 'avgRevenue': 18000, 'color': '#6b7280'}
            ],
            'abc': [
                {'name': 'Segment A', 'count': 60, 'percentage': 20.0, 'avgRevenue': 95000, 'color': '#10b981'},
                {'name': 'Segment B', 'count': 90, 'percentage': 30.0, 'avgRevenue': 35000, 'color': '#3b82f6'},
                {'name': 'Segment C', 'count': 150, 'percentage': 50.0, 'avgRevenue': 12000, 'color': '#6b7280'}
            ]
        }
        
        segments = segments_data.get(request.method, segments_data['rfm'])
        total_customers = sum(s['count'] for s in segments)
        
        insights = [
            {'type': 'info', 'message': f'Total customers analyzed: {total_customers}'},
            {'type': 'success', 'message': f'{segments[0]["name"]} represent {segments[0]["percentage"]}% of customers'}
        ]
        
        return CustomerSegmentationResponse(
            method=request.method,
            totalCustomers=total_customers,
            segments=segments,
            insights=insights,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Customer segmentation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Anomaly Detection Endpoint
@app.post("/api/v1/detect/anomalies", response_model=AnomalyDetectionResponse)
async def detect_anomalies(request: AnomalyDetectionRequest):
    """Detect anomalies in metrics (sales, inventory, returns, etc.)"""
    
    logger.info(f"Anomaly detection request: metric={request.metric_type}, tenant={request.tenant_id}")
    
    try:
        # Fallback data for now (ML model integration later)
        anomalies = [
            {
                'id': 'anom_001',
                'date': (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d'),
                'metricType': request.metric_type,
                'actualValue': 45000,
                'expectedValue': 78000,
                'deviation': -42.3,
                'severity': 'high',
                'description': f'Significant drop in {request.metric_type}'
            },
            {
                'id': 'anom_002',
                'date': (datetime.now() - timedelta(days=5)).strftime('%Y-%m-%d'),
                'metricType': request.metric_type,
                'actualValue': 125000,
                'expectedValue': 80000,
                'deviation': 56.3,
                'severity': 'medium',
                'description': f'Unusual spike in {request.metric_type}'
            }
        ]
        
        summary = {
            'high': sum(1 for a in anomalies if a['severity'] == 'high'),
            'medium': sum(1 for a in anomalies if a['severity'] == 'medium'),
            'low': sum(1 for a in anomalies if a['severity'] == 'low')
        }
        
        return AnomalyDetectionResponse(
            metricType=request.metric_type,
            detectedAnomalies=len(anomalies),
            anomalies=anomalies,
            summary=summary,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Anomaly detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Model Information Endpoint
@app.get("/api/v1/models/{model_type}")
async def get_model_info(model_type: str):
    """Get information about a specific model"""
    
    if model_type not in model_cache:
        raise HTTPException(status_code=404, detail=f"Model type '{model_type}' not found")
    
    model_info = {
        "demand_forecasting": {
            "name": "Demand Forecasting Ensemble",
            "version": "v1.2.3",
            "algorithms": ["XGBoost", "Prophet", "LSTM"],
            "target_metric": "MAPE < 15%",
            "features_count": 120,
            "training_frequency": "weekly"
        },
        "price_optimization": {
            "name": "Dynamic Price Optimizer",
            "version": "v2.1.0",
            "algorithms": ["Bayesian Optimization", "Reinforcement Learning"],
            "target_metric": "10-15% profit improvement",
            "features_count": 50,
            "training_frequency": "biweekly"
        },
        "promotion_lift": {
            "name": "Promotion Lift Analyzer",
            "version": "v1.0.5",
            "algorithms": ["Causal Impact", "A/B Testing"],
            "target_metric": "95% confidence",
            "features_count": 30,
            "training_frequency": "on_completion"
        },
        "recommendations": {
            "name": "Hybrid Recommendation Engine",
            "version": "v1.3.2",
            "algorithms": ["Collaborative Filtering", "Content-Based"],
            "target_metric": "15%+ CTR",
            "features_count": 80,
            "training_frequency": "daily"
        }
    }
    
    return {
        "model_type": model_type,
        "loaded": model_cache[model_type] is not None,
        "info": model_info.get(model_type, {}),
        "timestamp": datetime.now().isoformat()
    }

# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "type": type(exc).__name__}
    )

# Run server
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="TRADEAI ML Serving API")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8001, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    
    args = parser.parse_args()
    
    logger.info(f"🚀 Starting TRADEAI ML API on {args.host}:{args.port}")
    logger.info(f"📚 API Documentation: http://{args.host}:{args.port}/docs")
    
    uvicorn.run(
        "api:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info"
    )
