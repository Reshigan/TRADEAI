# Trade AI - AI Services

This directory contains the AI and machine learning components of the Trade AI platform.

## 🧠 Overview

The AI services provide predictive analytics capabilities for the Trade AI platform, including:

- Sales forecasting
- Promotion impact prediction
- Product performance analysis
- ROI optimization
- Seasonality detection

## 🛠️ Components

### 1. Prediction Model (`src/prediction_model.py`)

The core prediction model that uses ensemble methods to forecast sales and promotional effectiveness.

Features:
- Multiple model types (Random Forest, Gradient Boosting, Elastic Net)
- Hyperparameter optimization
- Feature importance analysis
- Confidence scoring

### 2. Data Processor (`utils/data_processor.py`)

Utilities for data loading, cleaning, feature engineering, and preparation for ML models.

Features:
- Data cleaning and preprocessing
- Feature engineering
- Seasonality calculation
- Competitor intensity simulation

### 3. Model Training (`src/train_models.py`)

Script for training and evaluating machine learning models.

Features:
- Command-line interface
- Hyperparameter optimization
- Performance visualization
- Model metadata tracking

### 4. Prediction API (`src/prediction_api.py`)

FastAPI service for making predictions using the trained models.

Features:
- RESTful API
- Single and bulk prediction endpoints
- Model information endpoint
- Feature importance analysis

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Required packages (see `requirements.txt`)

### Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

### Training a Model

```bash
# Basic training
python src/train_models.py --data-path /path/to/data --output-path /path/to/save/models

# With hyperparameter optimization
python src/train_models.py --data-path /path/to/data --output-path /path/to/save/models --optimize

# With visualizations
python src/train_models.py --data-path /path/to/data --output-path /path/to/save/models --visualize
```

### Starting the Prediction API

```bash
# Start the API server
python src/prediction_api.py
```

The API will be available at http://localhost:8000

## 📊 API Endpoints

### Prediction Endpoints

- `POST /predict/promotion`: Predict the impact of a promotion on a single product
- `POST /predict/bulk`: Predict the impact of a promotion on multiple products

### Information Endpoints

- `GET /models`: Get information about available models
- `GET /features/importance`: Get feature importance from the current model
- `GET /health`: Health check endpoint

## 📝 Example Usage

### Predicting Promotion Impact

```python
import requests
import json

# API endpoint
url = "http://localhost:8000/predict/promotion"

# Request data
data = {
    "product": {
        "product_name": "Diplomat Sparkling Water",
        "base_price": 50,
        "avg_monthly_sales": 5000,
        "sales_volatility": 1000,
        "seasonality_index": 1.1,
        "competitor_intensity": 0.7,
        "product_category": "Beverage",
        "margin_percentage": 0.4
    },
    "promotion": {
        "promo_type": "Discount",
        "discount_percentage": 20,
        "region": "South",
        "channel": "Retail",
        "promo_cost": 2000
    }
}

# Make request
response = requests.post(url, json=data)
result = response.json()

print(json.dumps(result, indent=2))
```

## 📈 Model Performance

The default ensemble model typically achieves:
- R² score: 0.85-0.92
- RMSE: 500-800 units
- MAE: 300-500 units

Performance varies based on data quality and product characteristics.

## 🔄 Integration with Main Application

The AI services integrate with the main Trade AI application through:

1. **REST API**: The prediction API provides endpoints for the main application
2. **Shared Data**: Both systems access the same data sources
3. **Event-based Updates**: Model retraining can be triggered by data updates

## 🛡️ Security Considerations

- API authentication is handled by the main application
- No sensitive data is stored in model files
- Input validation prevents injection attacks
- Rate limiting protects against DoS attacks