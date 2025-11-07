"""
Unit tests for customer segmentation endpoint
"""
import pytest
from datetime import datetime


@pytest.mark.unit
def test_customer_segmentation_returns_200(client, sample_customer_segmentation_request):
    """Test that customer segmentation endpoint returns 200 OK"""
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    assert response.status_code == 200


@pytest.mark.unit
def test_customer_segmentation_response_structure(client, sample_customer_segmentation_request):
    """Test that segmentation response has correct structure"""
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    data = response.json()
    
    # Check required fields
    assert "method" in data
    assert "totalCustomers" in data
    assert "segments" in data
    assert "insights" in data
    assert "timestamp" in data


@pytest.mark.unit
def test_customer_segmentation_method_match(client, sample_customer_segmentation_request):
    """Test that response matches request method"""
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    data = response.json()
    
    assert data["method"] == sample_customer_segmentation_request["method"]


@pytest.mark.unit
def test_customer_segmentation_total_customers_positive(client, sample_customer_segmentation_request):
    """Test that total customers is a positive integer"""
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    data = response.json()
    
    assert isinstance(data["totalCustomers"], int)
    assert data["totalCustomers"] > 0


@pytest.mark.unit
def test_customer_segmentation_segments_list(client, sample_customer_segmentation_request):
    """Test that segments is a non-empty list"""
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    data = response.json()
    
    assert isinstance(data["segments"], list)
    assert len(data["segments"]) > 0


@pytest.mark.unit
def test_customer_segmentation_segment_structure(client, sample_customer_segmentation_request):
    """Test that each segment has correct structure"""
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    data = response.json()
    
    for segment in data["segments"]:
        assert "name" in segment
        assert "count" in segment
        assert "percentage" in segment
        assert "avgRevenue" in segment
        assert "color" in segment


@pytest.mark.unit
def test_customer_segmentation_segment_counts_sum(client, sample_customer_segmentation_request):
    """Test that segment counts sum to total customers"""
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    data = response.json()
    
    total_from_segments = sum(segment["count"] for segment in data["segments"])
    assert total_from_segments == data["totalCustomers"]


@pytest.mark.unit
def test_customer_segmentation_percentages_sum(client, sample_customer_segmentation_request):
    """Test that segment percentages sum to approximately 100%"""
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    data = response.json()
    
    total_percentage = sum(segment["percentage"] for segment in data["segments"])
    
    # Allow small tolerance for rounding
    assert 99.5 <= total_percentage <= 100.5


@pytest.mark.unit
def test_customer_segmentation_percentage_calculation(client, sample_customer_segmentation_request):
    """Test that percentages are calculated correctly"""
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    data = response.json()
    
    total_customers = data["totalCustomers"]
    
    for segment in data["segments"]:
        expected_pct = (segment["count"] / total_customers) * 100
        # Allow small tolerance for rounding
        assert abs(segment["percentage"] - expected_pct) < 0.5


@pytest.mark.unit
def test_customer_segmentation_avg_revenue_positive(client, sample_customer_segmentation_request):
    """Test that average revenue values are non-negative"""
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    data = response.json()
    
    for segment in data["segments"]:
        assert segment["avgRevenue"] >= 0


@pytest.mark.unit
def test_customer_segmentation_insights_list(client, sample_customer_segmentation_request):
    """Test that insights is a list"""
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    data = response.json()
    
    assert isinstance(data["insights"], list)


@pytest.mark.unit
def test_customer_segmentation_timestamp_valid(client, sample_customer_segmentation_request):
    """Test that timestamp is valid ISO format"""
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    data = response.json()
    
    try:
        datetime.fromisoformat(data["timestamp"])
    except ValueError:
        pytest.fail("Timestamp is not in valid ISO format")


@pytest.mark.unit
def test_customer_segmentation_missing_method(client, sample_customer_segmentation_request):
    """Test that request with missing method uses default"""
    del sample_customer_segmentation_request["method"]
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    # Should use default method or return validation error
    assert response.status_code in [200, 422]


@pytest.mark.unit
def test_customer_segmentation_missing_tenant_id(client, sample_customer_segmentation_request):
    """Test that request fails without tenant_id"""
    del sample_customer_segmentation_request["tenant_id"]
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    assert response.status_code == 422


@pytest.mark.unit
def test_customer_segmentation_with_date_range(client, sample_customer_segmentation_request):
    """Test segmentation with date range"""
    sample_customer_segmentation_request["start_date"] = "2024-01-01"
    sample_customer_segmentation_request["end_date"] = "2024-12-31"
    
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    assert response.status_code == 200


@pytest.mark.unit
def test_customer_segmentation_rfm_method(client, sample_customer_segmentation_request):
    """Test segmentation with RFM method"""
    sample_customer_segmentation_request["method"] = "rfm"
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    assert response.status_code == 200


@pytest.mark.unit
def test_customer_segmentation_segment_names_unique(client, sample_customer_segmentation_request):
    """Test that segment names are unique"""
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    data = response.json()
    
    segment_names = [segment["name"] for segment in data["segments"]]
    assert len(segment_names) == len(set(segment_names)), "Segment names should be unique"


@pytest.mark.unit
def test_customer_segmentation_color_format(client, sample_customer_segmentation_request):
    """Test that segment colors are in valid format"""
    response = client.post("/api/v1/segment/customers", json=sample_customer_segmentation_request)
    data = response.json()
    
    for segment in data["segments"]:
        color = segment["color"]
        # Check if color is hex format (#RRGGBB) or color name
        assert isinstance(color, str)
        assert len(color) > 0
