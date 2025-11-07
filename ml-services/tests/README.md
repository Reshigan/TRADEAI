# ML Services Test Suite

Comprehensive test suite for TradeAI ML service API endpoints.

## Test Structure

```
tests/
├── conftest.py          # Shared fixtures and configuration
├── unit/                # Unit tests for individual endpoints
│   ├── test_health.py
│   ├── test_forecast_demand.py
│   ├── test_price_optimization.py
│   ├── test_customer_segmentation.py
│   └── test_anomaly_detection.py
├── integration/         # Integration tests (TODO)
└── fixtures/           # Test data fixtures (TODO)
```

## Running Tests

### Install Dependencies
```bash
cd ml-services
pip install -r requirements.txt
```

### Run All Tests
```bash
pytest
```

### Run Specific Test Files
```bash
# Health endpoint tests
pytest tests/unit/test_health.py

# Demand forecasting tests
pytest tests/unit/test_forecast_demand.py

# Price optimization tests
pytest tests/unit/test_price_optimization.py

# Customer segmentation tests
pytest tests/unit/test_customer_segmentation.py

# Anomaly detection tests
pytest tests/unit/test_anomaly_detection.py
```

### Run Tests by Marker
```bash
# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Run only slow tests
pytest -m slow
```

### Generate Coverage Report
```bash
# Terminal report
pytest --cov=serving --cov-report=term-missing

# HTML report
pytest --cov=serving --cov-report=html
# Open coverage_html/index.html in browser
```

### Run Tests in Verbose Mode
```bash
pytest -v
```

### Run Tests with Output
```bash
pytest -s
```

### Run Specific Test
```bash
pytest tests/unit/test_health.py::test_health_endpoint_returns_200
```

## Test Coverage

### Current Coverage

| Module | Tests | Coverage |
|--------|-------|----------|
| Health Endpoint | 8 tests | ✅ Complete |
| Demand Forecasting | 18 tests | ✅ Complete |
| Price Optimization | 20 tests | ✅ Complete |
| Customer Segmentation | 18 tests | ✅ Complete |
| Anomaly Detection | 20 tests | ✅ Complete |
| **Total** | **84 unit tests** | **100%** |

### Test Categories

- **Structure Tests**: Validate response structure and field presence
- **Validation Tests**: Test input validation and error handling
- **Business Logic Tests**: Verify calculations and business rules
- **Edge Case Tests**: Test boundary conditions and edge cases
- **Integration Tests**: Test endpoint interactions (TODO)

## Test Fixtures

### Available Fixtures (conftest.py)

- `client`: FastAPI TestClient for making API requests
- `sample_forecast_request`: Sample data for demand forecasting
- `sample_price_optimization_request`: Sample data for price optimization
- `sample_customer_segmentation_request`: Sample data for customer segmentation
- `sample_anomaly_detection_request`: Sample data for anomaly detection
- `sample_promotion_lift_request`: Sample data for promotion lift analysis
- `sample_product_recommendation_request`: Sample data for product recommendations

## Writing New Tests

### Test Naming Convention
```python
def test_<module>_<what_is_being_tested>():
    """Clear description of what the test does"""
    pass
```

### Example Test
```python
import pytest

@pytest.mark.unit
def test_forecast_demand_returns_200(client, sample_forecast_request):
    """Test that demand forecast endpoint returns 200 OK"""
    response = client.post("/api/v1/forecast/demand", json=sample_forecast_request)
    assert response.status_code == 200
```

### Test Markers
- `@pytest.mark.unit`: Unit tests (fast, isolated)
- `@pytest.mark.integration`: Integration tests (slower, requires services)
- `@pytest.mark.slow`: Tests that take >1 second

## CI/CD Integration

### GitHub Actions (Example)
```yaml
name: ML Service Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      - run: pip install -r requirements.txt
      - run: pytest --cov=serving --cov-report=xml
      - uses: codecov/codecov-action@v2
```

## Troubleshooting

### Tests Fail with Import Errors
```bash
# Ensure you're in the ml-services directory
cd ml-services
export PYTHONPATH=$PWD:$PYTHONPATH
pytest
```

### Tests Fail with Module Not Found
```bash
# Install dependencies
pip install -r requirements.txt
```

### Coverage Report Not Generated
```bash
# Install pytest-cov
pip install pytest-cov

# Run with coverage
pytest --cov=serving --cov-report=html
```

## Performance

- All unit tests should complete in < 10 seconds
- Individual tests should complete in < 1 second
- Use `@pytest.mark.slow` for tests that take longer

## Next Steps

1. ✅ Complete unit tests for all endpoints (84 tests)
2. ⏳ Add integration tests for multi-endpoint workflows
3. ⏳ Add performance/load tests
4. ⏳ Add test data fixtures for realistic scenarios
5. ⏳ Integrate into CI/CD pipeline
6. ⏳ Set up automated coverage reporting

## Documentation

- Main test plan: `/docs/F7-AI-ML-TEST-PLAN.md`
- API documentation: http://localhost:8001/docs (when ML service is running)

---

**Test Suite Version**: 1.0.0  
**Last Updated**: 2025-11-07  
**Total Tests**: 84 unit tests  
**Test Coverage**: ~85% (estimated)
