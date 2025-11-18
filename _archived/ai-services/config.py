"""
AI Services Configuration for Trade AI Platform
Local ML Models Configuration - No External APIs Required
"""

import os

# AI Model Configuration
AI_MODEL_TYPE = os.getenv('AI_MODEL_TYPE', 'local_ml')
AI_MODEL_PATH = os.getenv('AI_MODEL_PATH', '/app/models')
AI_USE_LOCAL_MODELS = os.getenv('AI_USE_LOCAL_MODELS', 'true').lower() == 'true'

# Model Types Available
AVAILABLE_MODELS = {
    'ensemble': 'RandomForestRegressor with ensemble features',
    'random_forest': 'Random Forest Regressor',
    'gradient_boosting': 'Gradient Boosting Regressor',
    'elastic_net': 'Elastic Net Regressor'
}

# Default Model Configuration
DEFAULT_MODEL_CONFIG = {
    'model_type': 'ensemble',
    'n_estimators': 200,
    'max_depth': 20,
    'min_samples_split': 5,
    'min_samples_leaf': 2,
    'random_state': 42
}

# Feature Configuration
FEATURE_CONFIG = {
    'categorical_features': ['product_category', 'promo_type', 'region', 'channel'],
    'numerical_features': [
        'base_price', 'discount_percentage', 'avg_monthly_sales', 
        'sales_volatility', 'seasonality_index', 'competitor_intensity'
    ]
}

# Training Configuration
TRAINING_CONFIG = {
    'test_size': 0.2,
    'validation_split': 0.2,
    'cross_validation_folds': 5,
    'hyperparameter_optimization': True
}

# Prediction Configuration
PREDICTION_CONFIG = {
    'confidence_threshold': 0.7,
    'max_prediction_horizon_days': 90,
    'min_historical_data_points': 30
}

# Data Processing Configuration
DATA_CONFIG = {
    'max_missing_values_ratio': 0.1,
    'outlier_detection_method': 'iqr',
    'feature_scaling_method': 'standard',
    'categorical_encoding_method': 'onehot'
}

# Model Performance Thresholds
PERFORMANCE_THRESHOLDS = {
    'min_r2_score': 0.6,
    'max_mae_ratio': 0.15,  # MAE should be < 15% of mean target value
    'max_rmse_ratio': 0.20   # RMSE should be < 20% of mean target value
}

# Logging Configuration
LOGGING_CONFIG = {
    'level': os.getenv('LOG_LEVEL', 'INFO'),
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'file_path': '/app/logs/ai_services.log'
}

def get_model_config():
    """Get the current model configuration"""
    return {
        'ai_model_type': AI_MODEL_TYPE,
        'ai_model_path': AI_MODEL_PATH,
        'use_local_models': AI_USE_LOCAL_MODELS,
        'available_models': AVAILABLE_MODELS,
        'default_config': DEFAULT_MODEL_CONFIG,
        'features': FEATURE_CONFIG,
        'training': TRAINING_CONFIG,
        'prediction': PREDICTION_CONFIG,
        'data_processing': DATA_CONFIG,
        'performance_thresholds': PERFORMANCE_THRESHOLDS
    }

def validate_config():
    """Validate the AI configuration"""
    errors = []
    
    if not AI_USE_LOCAL_MODELS:
        errors.append("AI_USE_LOCAL_MODELS must be set to 'true' for local ML models")
    
    if AI_MODEL_TYPE not in AVAILABLE_MODELS:
        errors.append(f"AI_MODEL_TYPE '{AI_MODEL_TYPE}' not in available models: {list(AVAILABLE_MODELS.keys())}")
    
    if not os.path.exists(AI_MODEL_PATH):
        try:
            os.makedirs(AI_MODEL_PATH, exist_ok=True)
        except Exception as e:
            errors.append(f"Cannot create AI_MODEL_PATH '{AI_MODEL_PATH}': {e}")
    
    return errors

# Validate configuration on import
config_errors = validate_config()
if config_errors:
    print("AI Configuration Warnings:")
    for error in config_errors:
        print(f"  - {error}")
else:
    print("AI Configuration: Local ML models ready ✅")