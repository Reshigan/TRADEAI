#!/usr/bin/env python3
"""
Trade AI Prediction API
This module provides a FastAPI service for making predictions using the Trade AI models.
"""

import os
import sys
import json
import glob
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query, Body
from pydantic import BaseModel, Field
import uvicorn

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.prediction_model import TradeAIPredictionModel
from utils.data_processor import TradeAIDataProcessor
from config import get_model_config, validate_config

# Define API models
class ProductData(BaseModel):
    """Product data for prediction"""
    product_name: str
    base_price: float
    avg_monthly_sales: float = Field(0.0, description="Average monthly sales (0 if unknown)")
    sales_volatility: Optional[float] = Field(None, description="Sales volatility (standard deviation)")
    seasonality_index: Optional[float] = Field(1.0, description="Seasonality index (1.0 = neutral)")
    competitor_intensity: Optional[float] = Field(0.5, description="Competitor intensity (0-1)")
    product_category: str
    margin_percentage: Optional[float] = Field(0.3, description="Product margin percentage")

class PromotionDetails(BaseModel):
    """Promotion details for prediction"""
    promo_type: str = Field(..., description="Type of promotion (Discount, BOGO, Bundle)")
    discount_percentage: float = Field(0.0, description="Discount percentage (0-100)")
    region: Optional[str] = Field("National", description="Region for the promotion")
    channel: Optional[str] = Field("Retail", description="Sales channel")
    promo_cost: float = Field(..., description="Cost of the promotion")
    promo_start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    promo_end_date: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")

class PromotionRequest(BaseModel):
    """Request for promotion impact prediction"""
    product: ProductData
    promotion: PromotionDetails

class PromotionResponse(BaseModel):
    """Response for promotion impact prediction"""
    product: str
    baseline_sales: float
    predicted_sales: float
    sales_lift: float
    sales_lift_percentage: float
    promo_cost: float
    incremental_margin: float
    roi: float
    confidence: float
    timestamp: str

class BulkPromotionRequest(BaseModel):
    """Request for bulk promotion impact prediction"""
    products: List[ProductData]
    promotion: PromotionDetails

class ModelInfo(BaseModel):
    """Model information"""
    model_id: str
    model_type: str
    training_date: str
    accuracy: float
    features: List[str]
    is_active: bool

# Initialize FastAPI app
app = FastAPI(
    title="Trade AI Prediction API",
    description="API for making predictions using Trade AI models",
    version="1.0.0"
)

# Global variables
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "test_data")

# Load models on startup
prediction_model = None
data_processor = None

@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    global prediction_model, data_processor
    
    # Initialize data processor
    data_processor = TradeAIDataProcessor(data_path=DATA_DIR)
    if not data_processor.load_data():
        print("Warning: Failed to load data. Some functionality may be limited.")
    
    # Load the latest model
    try:
        model_files = glob.glob(os.path.join(MODEL_DIR, "*_model_*.joblib"))
        if model_files:
            latest_model = max(model_files, key=os.path.getctime)
            prediction_model = TradeAIPredictionModel()
            prediction_model.load_model(latest_model)
            print(f"Loaded model from {latest_model}")
        else:
            # If no model file exists, create a default model
            print("No existing model found. Creating a default model.")
            prediction_model = TradeAIPredictionModel(model_type="ensemble")
            
            # If data is available, train a simple model
            if data_processor and hasattr(data_processor, 'sales_df') and data_processor.sales_df is not None:
                try:
                    # Prepare features
                    df = data_processor.prepare_features_for_model()
                    
                    # Drop non-feature columns
                    X = df.drop(['quantity_sold', 'product_name', 'date'], axis=1)
                    y = df['quantity_sold']
                    
                    # Train a simple model
                    prediction_model.train(X, y, optimize=False)
                    
                    # Save the model
                    os.makedirs(MODEL_DIR, exist_ok=True)
                    model_path = os.path.join(MODEL_DIR, f"default_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}.joblib")
                    prediction_model.save_model(model_path)
                    print(f"Trained and saved default model to {model_path}")
                except Exception as e:
                    print(f"Error training default model: {e}")
    except Exception as e:
        print(f"Error loading model: {e}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Trade AI Prediction API",
        "version": "1.0.0",
        "status": "active",
        "model_loaded": prediction_model is not None,
        "data_loaded": data_processor is not None and hasattr(data_processor, 'sales_df') and data_processor.sales_df is not None
    }

@app.get("/models", response_model=List[ModelInfo])
async def get_models():
    """Get information about available models"""
    try:
        model_files = glob.glob(os.path.join(MODEL_DIR, "*_model_*.joblib"))
        metadata_files = glob.glob(os.path.join(MODEL_DIR, "*_metadata_*.json"))
        
        models = []
        for model_file in model_files:
            model_id = os.path.basename(model_file).replace(".joblib", "")
            
            # Find corresponding metadata file
            metadata_file = next((f for f in metadata_files if model_id.replace("_model_", "_metadata_") in f), None)
            
            if metadata_file:
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                
                # Check if this is the active model
                is_active = False
                if prediction_model and hasattr(prediction_model, 'model'):
                    # Compare creation time as a simple way to check if it's the same model
                    model_time = os.path.getctime(model_file)
                    is_active = model_file == max(model_files, key=os.path.getctime)
                
                models.append(ModelInfo(
                    model_id=model_id,
                    model_type=metadata.get('model_type', 'unknown'),
                    training_date=metadata.get('training_date', ''),
                    accuracy=metadata.get('test_metrics', {}).get('r2', 0.0),
                    features=list(metadata.get('feature_importance', {}).keys())[:5],
                    is_active=is_active
                ))
            else:
                # Basic info if metadata not available
                models.append(ModelInfo(
                    model_id=model_id,
                    model_type="unknown",
                    training_date=datetime.fromtimestamp(os.path.getctime(model_file)).isoformat(),
                    accuracy=0.0,
                    features=[],
                    is_active=False
                ))
        
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving models: {str(e)}")

@app.post("/predict/promotion", response_model=PromotionResponse)
async def predict_promotion_impact(request: PromotionRequest):
    """Predict the impact of a promotion on sales"""
    if prediction_model is None:
        raise HTTPException(status_code=503, detail="Prediction model not available")
    
    try:
        # Convert request to the format expected by the model
        product_data = request.product.dict()
        promotion_details = request.promotion.dict()
        
        # Make prediction
        result = prediction_model.predict_promotion_impact(product_data, promotion_details)
        
        # Add timestamp
        result['timestamp'] = datetime.now().isoformat()
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/predict/bulk", response_model=List[PromotionResponse])
async def predict_bulk_promotion_impact(request: BulkPromotionRequest):
    """Predict the impact of a promotion on multiple products"""
    if prediction_model is None:
        raise HTTPException(status_code=503, detail="Prediction model not available")
    
    try:
        results = []
        promotion_details = request.promotion.dict()
        
        for product in request.products:
            product_data = product.dict()
            result = prediction_model.predict_promotion_impact(product_data, promotion_details)
            result['timestamp'] = datetime.now().isoformat()
            results.append(result)
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk prediction error: {str(e)}")

@app.get("/features/importance")
async def get_feature_importance():
    """Get feature importance from the model"""
    if prediction_model is None:
        raise HTTPException(status_code=503, detail="Prediction model not available")
    
    try:
        importance_report = prediction_model.generate_feature_importance_report()
        return importance_report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving feature importance: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": prediction_model is not None,
        "data_loaded": data_processor is not None and hasattr(data_processor, 'sales_df') and data_processor.sales_df is not None
    }

def start_server(host="0.0.0.0", port=8000):
    """Start the API server"""
    uvicorn.run("prediction_api:app", host=host, port=port, reload=True)

if __name__ == "__main__":
    # Create model directory if it doesn't exist
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Start the server
    start_server()