"""
Unit tests for demand forecasting endpoint
"""
import pytest
from datetime import datetime


@pytest.mark.unit
def test_forecast_demand_returns_200(client, sample_forecast_request):
    """Test that demand forecast endpoint returns 200 OK"""
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    assert response.status_code == 200


@pytest.mark.unit
def test_forecast_demand_response_structure(client, sample_forecast_request):
    """Test that forecast response has correct structure"""
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    data = response.json()
    
    # Check required fields
    assert "product_id" in data
    assert "customer_id" in data
    assert "forecast" in data
    assert "accuracy_estimate" in data
    assert "model_version" in data
    assert "features_count" in data
    assert "timestamp" in data


@pytest.mark.unit
def test_forecast_demand_product_customer_match(client, sample_forecast_request):
    """Test that response matches request product and customer IDs"""
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    data = response.json()
    
    assert data["product_id"] == sample_forecast_request["product_id"]
    assert data["customer_id"] == sample_forecast_request["customer_id"]


@pytest.mark.unit
def test_forecast_demand_horizon_length(client, sample_forecast_request):
    """Test that forecast length matches requested horizon"""
    horizon = 7
    sample_forecast_request["horizon_days"] = horizon
    
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    data = response.json()
    
    assert len(data["forecast"]) == horizon


@pytest.mark.unit
def test_forecast_demand_point_structure(client, sample_forecast_request):
    """Test that each forecast point has correct structure"""
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    data = response.json()
    
    for point in data["forecast"]:
        assert "date" in point
        assert "predicted_volume" in point
        assert "confidence_lower" in point
        assert "confidence_upper" in point


@pytest.mark.unit
def test_forecast_demand_positive_values(client, sample_forecast_request):
    """Test that forecast values are positive"""
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    data = response.json()
    
    for point in data["forecast"]:
        assert point["predicted_volume"] >= 0
        assert point["confidence_lower"] >= 0
        assert point["confidence_upper"] >= 0


@pytest.mark.unit
def test_forecast_demand_confidence_intervals(client, sample_forecast_request):
    """Test that confidence intervals are correctly ordered"""
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    data = response.json()
    
    for point in data["forecast"]:
        # Lower bound <= predicted <= upper bound
        assert point["confidence_lower"] <= point["predicted_volume"]
        assert point["predicted_volume"] <= point["confidence_upper"]


@pytest.mark.unit
def test_forecast_demand_accuracy_range(client, sample_forecast_request):
    """Test that accuracy estimate is between 0 and 1"""
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    data = response.json()
    
    assert 0 <= data["accuracy_estimate"] <= 1


@pytest.mark.unit
def test_forecast_demand_timestamp_valid(client, sample_forecast_request):
    """Test that timestamp is valid ISO format"""
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    data = response.json()
    
    try:
        datetime.fromisoformat(data["timestamp"])
    except ValueError:
        pytest.fail("Timestamp is not in valid ISO format")


@pytest.mark.unit
def test_forecast_demand_missing_product_id(client, sample_forecast_request):
    """Test that request fails without product_id"""
    del sample_forecast_request["product_id"]
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    assert response.status_code == 422  # Validation error


@pytest.mark.unit
def test_forecast_demand_missing_customer_id(client, sample_forecast_request):
    """Test that request fails without customer_id"""
    del sample_forecast_request["customer_id"]
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    assert response.status_code == 422  # Validation error


@pytest.mark.unit
def test_forecast_demand_invalid_horizon(client, sample_forecast_request):
    """Test that invalid horizon values are rejected"""
    # Test negative horizon
    sample_forecast_request["horizon_days"] = -1
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    assert response.status_code == 422
    
    # Test zero horizon
    sample_forecast_request["horizon_days"] = 0
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    assert response.status_code == 422
    
    # Test horizon > 365
    sample_forecast_request["horizon_days"] = 400
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    assert response.status_code == 422


@pytest.mark.unit
def test_forecast_demand_invalid_confidence_level(client, sample_forecast_request):
    """Test that invalid confidence levels are rejected"""
    # Test confidence < 0.5
    sample_forecast_request["confidence_level"] = 0.3
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    assert response.status_code == 422
    
    # Test confidence > 0.99
    sample_forecast_request["confidence_level"] = 1.0
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    assert response.status_code == 422


@pytest.mark.unit
def test_forecast_demand_with_promotions_flag(client, sample_forecast_request):
    """Test that include_promotions flag is processed"""
    # Test with promotions
    sample_forecast_request["include_promotions"] = True
    response1 = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    assert response1.status_code == 200
    
    # Test without promotions
    sample_forecast_request["include_promotions"] = False
    response2 = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    assert response2.status_code == 200


@pytest.mark.unit
def test_forecast_demand_date_progression(client, sample_forecast_request):
    """Test that forecast dates progress correctly"""
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    data = response.json()
    
    forecast = data["forecast"]
    for i in range(len(forecast) - 1):
        date1 = datetime.fromisoformat(forecast[i]["date"])
        date2 = datetime.fromisoformat(forecast[i + 1]["date"])
        
        # Date should progress by approximately 1 day
        diff = (date2 - date1).days
        assert diff >= 0, "Dates should be in ascending order"


@pytest.mark.unit
def test_forecast_demand_model_version_present(client, sample_forecast_request):
    """Test that model version is present and non-empty"""
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    data = response.json()
    
    assert data["model_version"]
    assert isinstance(data["model_version"], str)
    assert len(data["model_version"]) > 0


@pytest.mark.unit
def test_forecast_demand_features_count(client, sample_forecast_request):
    """Test that features_count is a positive integer"""
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    data = response.json()
    
    assert isinstance(data["features_count"], int)
    assert data["features_count"] > 0
