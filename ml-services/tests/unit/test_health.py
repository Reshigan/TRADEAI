"""
Unit tests for ML service health endpoint
"""
import pytest
from datetime import datetime


@pytest.mark.unit
def test_health_endpoint_returns_200(client):
    """Test that health endpoint returns 200 OK"""
    response = client.get("/health")
    assert response.status_code == 200


@pytest.mark.unit
def test_health_endpoint_structure(client):
    """Test that health endpoint returns correct structure"""
    response = client.get("/health")
    data = response.json()
    
    # Check required fields
    assert "status" in data
    assert "timestamp" in data
    assert "models" in data
    assert "version" in data


@pytest.mark.unit
def test_health_status_values(client):
    """Test that health status is either 'healthy' or 'degraded'"""
    response = client.get("/health")
    data = response.json()
    
    assert data["status"] in ["healthy", "degraded"]


@pytest.mark.unit
def test_health_models_structure(client):
    """Test that models field contains all expected models"""
    response = client.get("/health")
    data = response.json()
    
    models = data["models"]
    expected_models = [
        "demand_forecasting",
        "price_optimization",
        "promotion_lift",
        "recommendations"
    ]
    
    for model_name in expected_models:
        assert model_name in models
        assert isinstance(models[model_name], bool)


@pytest.mark.unit
def test_health_timestamp_format(client):
    """Test that timestamp is in ISO format"""
    response = client.get("/health")
    data = response.json()
    
    # Parse timestamp to verify it's valid ISO format
    try:
        datetime.fromisoformat(data["timestamp"])
    except ValueError:
        pytest.fail("Timestamp is not in valid ISO format")


@pytest.mark.unit
def test_health_version_present(client):
    """Test that version field is present and non-empty"""
    response = client.get("/health")
    data = response.json()
    
    assert data["version"]
    assert isinstance(data["version"], str)
    assert len(data["version"]) > 0


@pytest.mark.unit
def test_health_degraded_mode_detection(client):
    """Test that degraded mode is detected when models are not loaded"""
    response = client.get("/health")
    data = response.json()
    
    # Check if any model is not loaded
    models = data["models"]
    any_model_not_loaded = not all(models.values())
    
    # If any model is not loaded, status should be degraded
    if any_model_not_loaded:
        assert data["status"] == "degraded"


@pytest.mark.unit
def test_health_endpoint_consistency(client):
    """Test that health endpoint returns consistent results across multiple calls"""
    response1 = client.get("/health")
    response2 = client.get("/health")
    
    data1 = response1.json()
    data2 = response2.json()
    
    # Status should be consistent
    assert data1["status"] == data2["status"]
    
    # Models should be consistent
    assert data1["models"] == data2["models"]
    
    # Version should be consistent
    assert data1["version"] == data2["version"]
