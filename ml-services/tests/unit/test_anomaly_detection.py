"""
Unit tests for anomaly detection endpoint
"""
import pytest
from datetime import datetime


@pytest.mark.unit
def test_anomaly_detection_returns_200(client, sample_anomaly_detection_request):
    """Test that anomaly detection endpoint returns 200 OK"""
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    assert response.status_code == 200


@pytest.mark.unit
def test_anomaly_detection_response_structure(client, sample_anomaly_detection_request):
    """Test that anomaly detection response has correct structure"""
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    data = response.json()
    
    # Check required fields (API uses camelCase)
    assert "metricType" in data
    assert "detectedAnomalies" in data
    assert "anomalies" in data
    assert "summary" in data
    assert "timestamp" in data


@pytest.mark.unit
def test_anomaly_detection_metric_type_match(client, sample_anomaly_detection_request):
    """Test that response matches request metric type"""
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    data = response.json()
    
    assert data["metricType"] == sample_anomaly_detection_request["metric_type"]


@pytest.mark.unit
def test_anomaly_detection_total_count_match(client, sample_anomaly_detection_request):
    """Test that total anomalies matches length of anomalies list"""
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    data = response.json()
    
    assert data["detectedAnomalies"] == len(data["anomalies"])


@pytest.mark.unit
def test_anomaly_detection_anomalies_list(client, sample_anomaly_detection_request):
    """Test that anomalies is a list"""
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    data = response.json()
    
    assert isinstance(data["anomalies"], list)


@pytest.mark.unit
def test_anomaly_detection_anomaly_structure(client, sample_anomaly_detection_request):
    """Test that each anomaly has correct structure"""
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    data = response.json()
    
    for anomaly in data["anomalies"]:
        assert "id" in anomaly
        assert "date" in anomaly  # API uses 'date' not 'timestamp'
        assert "severity" in anomaly
        assert "metricType" in anomaly  # API uses camelCase
        assert "expectedValue" in anomaly  # API uses camelCase
        assert "actualValue" in anomaly  # API uses camelCase
        assert "deviation" in anomaly


@pytest.mark.unit
def test_anomaly_detection_severity_values(client, sample_anomaly_detection_request):
    """Test that anomaly severity is valid"""
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    data = response.json()
    
    valid_severities = ["high", "medium", "low"]
    
    for anomaly in data["anomalies"]:
        assert anomaly["severity"] in valid_severities


@pytest.mark.unit
def test_anomaly_detection_deviation_values(client, sample_anomaly_detection_request):
    """Test that deviation values are numeric (can be positive or negative)"""
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    data = response.json()
    
    for anomaly in data["anomalies"]:
        # Deviation can be positive (spike) or negative (drop)
        assert isinstance(anomaly["deviation"], (int, float))


@pytest.mark.unit
def test_anomaly_detection_timestamp_valid(client, sample_anomaly_detection_request):
    """Test that response timestamp is valid ISO format"""
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    data = response.json()
    
    try:
        datetime.fromisoformat(data["timestamp"])
    except ValueError:
        pytest.fail("Timestamp is not in valid ISO format")


@pytest.mark.unit
def test_anomaly_detection_anomaly_dates_valid(client, sample_anomaly_detection_request):
    """Test that anomaly dates are valid date format"""
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    data = response.json()
    
    for anomaly in data["anomalies"]:
        try:
            # API uses 'date' field in YYYY-MM-DD format
            datetime.strptime(anomaly["date"], "%Y-%m-%d")
        except ValueError:
            pytest.fail(f"Anomaly date {anomaly['date']} is not in valid YYYY-MM-DD format")


@pytest.mark.unit
def test_anomaly_detection_summary_structure(client, sample_anomaly_detection_request):
    """Test that summary has correct structure"""
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    data = response.json()
    
    summary = data["summary"]
    assert "high" in summary
    assert "medium" in summary
    assert "low" in summary
    
    # All counts should be non-negative integers
    for severity in ["high", "medium", "low"]:
        assert isinstance(summary[severity], int)
        assert summary[severity] >= 0


@pytest.mark.unit
def test_anomaly_detection_summary_totals(client, sample_anomaly_detection_request):
    """Test that summary totals match anomaly count"""
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    data = response.json()
    
    summary = data["summary"]
    summary_total = summary["high"] + summary["medium"] + summary["low"]
    
    assert summary_total == data["detectedAnomalies"]


@pytest.mark.unit
def test_anomaly_detection_missing_metric_type(client, sample_anomaly_detection_request):
    """Test that request fails without metric_type"""
    del sample_anomaly_detection_request["metric_type"]
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    assert response.status_code == 422


@pytest.mark.unit
def test_anomaly_detection_missing_tenant_id(client, sample_anomaly_detection_request):
    """Test that request fails without tenant_id"""
    del sample_anomaly_detection_request["tenant_id"]
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    assert response.status_code == 422


@pytest.mark.unit
def test_anomaly_detection_with_date_range(client, sample_anomaly_detection_request):
    """Test anomaly detection with date range"""
    sample_anomaly_detection_request["start_date"] = "2024-01-01"
    sample_anomaly_detection_request["end_date"] = "2024-12-31"
    
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    assert response.status_code == 200


@pytest.mark.unit
def test_anomaly_detection_custom_threshold(client, sample_anomaly_detection_request):
    """Test anomaly detection with custom threshold"""
    sample_anomaly_detection_request["threshold"] = 3.0
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    assert response.status_code == 200


@pytest.mark.unit
def test_anomaly_detection_negative_threshold(client, sample_anomaly_detection_request):
    """Test that negative threshold is handled"""
    sample_anomaly_detection_request["threshold"] = -1.0
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    # Should either reject or use default
    assert response.status_code in [200, 422]


@pytest.mark.unit
def test_anomaly_detection_zero_threshold(client, sample_anomaly_detection_request):
    """Test that zero threshold is handled"""
    sample_anomaly_detection_request["threshold"] = 0.0
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    # Should either reject or use default
    assert response.status_code in [200, 422]


@pytest.mark.unit
def test_anomaly_detection_different_metrics(client, sample_anomaly_detection_request):
    """Test anomaly detection with different metric types"""
    metric_types = ["sales", "inventory", "returns", "traffic"]
    
    for metric_type in metric_types:
        sample_anomaly_detection_request["metric_type"] = metric_type
        response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
        assert response.status_code == 200


@pytest.mark.unit
def test_anomaly_detection_anomaly_ids_unique(client, sample_anomaly_detection_request):
    """Test that anomaly IDs are unique"""
    response = client.post("/api/v1/detect/anomalies", json=sample_anomaly_detection_request)
    data = response.json()
    
    anomaly_ids = [anomaly["id"] for anomaly in data["anomalies"]]
    assert len(anomaly_ids) == len(set(anomaly_ids)), "Anomaly IDs should be unique"
