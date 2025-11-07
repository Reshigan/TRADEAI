"""
Unit tests for price optimization endpoint
"""
import pytest
from datetime import datetime


@pytest.mark.unit
def test_price_optimization_returns_200(client, sample_price_optimization_request):
    """Test that price optimization endpoint returns 200 OK"""
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    assert response.status_code == 200


@pytest.mark.unit
def test_price_optimization_response_structure(client, sample_price_optimization_request):
    """Test that optimization response has correct structure"""
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    data = response.json()
    
    # Check required fields
    assert "product_id" in data
    assert "current_price" in data
    assert "optimal_price" in data
    assert "price_change_pct" in data
    assert "expected_impact" in data
    assert "confidence" in data
    assert "model_version" in data
    assert "timestamp" in data


@pytest.mark.unit
def test_price_optimization_product_match(client, sample_price_optimization_request):
    """Test that response matches request product ID"""
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    data = response.json()
    
    assert data["product_id"] == sample_price_optimization_request["product_id"]
    assert data["current_price"] == sample_price_optimization_request["current_price"]


@pytest.mark.unit
def test_price_optimization_optimal_price_positive(client, sample_price_optimization_request):
    """Test that optimal price is positive"""
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    data = response.json()
    
    assert data["optimal_price"] > 0


@pytest.mark.unit
def test_price_optimization_respects_constraints(client, sample_price_optimization_request):
    """Test that optimal price respects min/max constraints"""
    constraints = {"min_price": 20.0, "max_price": 35.0}
    sample_price_optimization_request["constraints"] = constraints
    
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    data = response.json()
    
    # Optimal price should be within constraints (with small tolerance for rounding)
    assert data["optimal_price"] >= constraints["min_price"] - 0.01
    assert data["optimal_price"] <= constraints["max_price"] + 0.01


@pytest.mark.unit
def test_price_optimization_change_percentage(client, sample_price_optimization_request):
    """Test that price change percentage is calculated correctly"""
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    data = response.json()
    
    current = data["current_price"]
    optimal = data["optimal_price"]
    change_pct = data["price_change_pct"]
    
    # Calculate expected change percentage
    expected_change = ((optimal - current) / current) * 100
    
    # Allow small tolerance for floating point arithmetic
    assert abs(change_pct - expected_change) < 0.1


@pytest.mark.unit
def test_price_optimization_expected_impact_structure(client, sample_price_optimization_request):
    """Test that expected_impact has correct structure"""
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    data = response.json()
    
    impact = data["expected_impact"]
    # API uses _change_pct suffix
    expected_keys = ["revenue_change_pct", "profit_change_pct", "volume_change_pct"]
    
    for key in expected_keys:
        assert key in impact
        assert isinstance(impact[key], (int, float))


@pytest.mark.unit
def test_price_optimization_confidence_range(client, sample_price_optimization_request):
    """Test that confidence is between 0 and 1"""
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    data = response.json()
    
    assert 0 <= data["confidence"] <= 1


@pytest.mark.unit
def test_price_optimization_timestamp_valid(client, sample_price_optimization_request):
    """Test that timestamp is valid ISO format"""
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    data = response.json()
    
    try:
        datetime.fromisoformat(data["timestamp"])
    except ValueError:
        pytest.fail("Timestamp is not in valid ISO format")


@pytest.mark.unit
def test_price_optimization_missing_product_id(client, sample_price_optimization_request):
    """Test that request fails without product_id"""
    del sample_price_optimization_request["product_id"]
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    assert response.status_code == 422


@pytest.mark.unit
def test_price_optimization_missing_current_price(client, sample_price_optimization_request):
    """Test that request fails without current_price"""
    del sample_price_optimization_request["current_price"]
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    assert response.status_code == 422


@pytest.mark.unit
def test_price_optimization_missing_cost(client, sample_price_optimization_request):
    """Test that request fails without cost"""
    del sample_price_optimization_request["cost"]
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    assert response.status_code == 422


@pytest.mark.unit
def test_price_optimization_negative_price(client, sample_price_optimization_request):
    """Test that negative price is rejected"""
    sample_price_optimization_request["current_price"] = -10.0
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    assert response.status_code == 422


@pytest.mark.unit
def test_price_optimization_zero_price(client, sample_price_optimization_request):
    """Test that zero price is rejected"""
    sample_price_optimization_request["current_price"] = 0.0
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    assert response.status_code == 422


@pytest.mark.unit
def test_price_optimization_negative_cost(client, sample_price_optimization_request):
    """Test that negative cost is rejected"""
    sample_price_optimization_request["cost"] = -5.0
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    assert response.status_code == 422


@pytest.mark.unit
def test_price_optimization_profit_objective(client, sample_price_optimization_request):
    """Test price optimization with profit objective"""
    sample_price_optimization_request["optimization_objective"] = "profit"
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    assert response.status_code == 200


@pytest.mark.unit
def test_price_optimization_revenue_objective(client, sample_price_optimization_request):
    """Test price optimization with revenue objective"""
    sample_price_optimization_request["optimization_objective"] = "revenue"
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    assert response.status_code == 200


@pytest.mark.unit
def test_price_optimization_market_share_objective(client, sample_price_optimization_request):
    """Test price optimization with market_share objective"""
    sample_price_optimization_request["optimization_objective"] = "market_share"
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    assert response.status_code == 200


@pytest.mark.unit
def test_price_optimization_without_constraints(client, sample_price_optimization_request):
    """Test price optimization without constraints"""
    del sample_price_optimization_request["constraints"]
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    assert response.status_code == 200


@pytest.mark.unit
def test_price_optimization_model_version_present(client, sample_price_optimization_request):
    """Test that model version is present and non-empty"""
    response = client.post("/api/v1/optimize/price", json=sample_price_optimization_request)
    data = response.json()
    
    assert data["model_version"]
    assert isinstance(data["model_version"], str)
    assert len(data["model_version"]) > 0
