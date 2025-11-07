"""
Pytest configuration and fixtures for ML service tests
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from serving.api import app


@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)


@pytest.fixture
def sample_forecast_request():
    """Sample forecast request data"""
    return {
        "product_id": "PROD001",
        "customer_id": "CUST001",
        "horizon_days": 7,
        "include_promotions": True,
        "confidence_level": 0.95
    }


@pytest.fixture
def sample_price_optimization_request():
    """Sample price optimization request data"""
    return {
        "product_id": "PROD001",
        "current_price": 25.99,
        "cost": 15.00,
        "constraints": {
            "min_price": 20.0,
            "max_price": 35.0
        },
        "optimization_objective": "profit"
    }


@pytest.fixture
def sample_customer_segmentation_request():
    """Sample customer segmentation request data"""
    return {
        "method": "rfm",
        "tenant_id": "tenant_123"
    }


@pytest.fixture
def sample_anomaly_detection_request():
    """Sample anomaly detection request data"""
    today = datetime.now()
    yesterday = today - timedelta(days=1)
    return {
        "metric_type": "sales",
        "tenant_id": "tenant_123",
        "start_date": yesterday.strftime("%Y-%m-%d"),
        "end_date": today.strftime("%Y-%m-%d"),
        "threshold": 2.5
    }


@pytest.fixture
def sample_promotion_lift_request():
    """Sample promotion lift request data"""
    today = datetime.now()
    return {
        "promotion_id": "PROMO001",
        "pre_period": {
            "start_date": (today - timedelta(days=30)).strftime("%Y-%m-%d"),
            "end_date": (today - timedelta(days=15)).strftime("%Y-%m-%d")
        },
        "post_period": {
            "start_date": (today - timedelta(days=14)).strftime("%Y-%m-%d"),
            "end_date": today.strftime("%Y-%m-%d")
        }
    }


@pytest.fixture
def sample_product_recommendation_request():
    """Sample product recommendation request data"""
    return {
        "customer_id": "CUST001",
        "context": {
            "season": "summer",
            "active_promotions": True
        },
        "top_n": 10
    }
