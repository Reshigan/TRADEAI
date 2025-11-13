#!/usr/bin/env python3
"""
Trade AI Model Training Script
This script trains and evaluates machine learning models for the Trade AI platform.
"""

import os
import sys
import json
import argparse
import pandas as pd
import numpy as np
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.prediction_model import TradeAIPredictionModel
from utils.data_processor import TradeAIDataProcessor

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Train Trade AI prediction models')
    
    parser.add_argument('--data-path', type=str, default='/workspace/trade-ai-github/test_data',
                        help='Path to the data directory')
    parser.add_argument('--output-path', type=str, default='/workspace/trade-ai-github/ai-services/models',
                        help='Path to save trained models')
    parser.add_argument('--model-type', type=str, default='ensemble',
                        choices=['ensemble', 'random_forest', 'gradient_boosting', 'elastic_net'],
                        help='Type of model to train')
    parser.add_argument('--optimize', action='store_true',
                        help='Perform hyperparameter optimization')
    parser.add_argument('--test-size', type=float, default=0.2,
                        help='Proportion of data to use for testing')
    parser.add_argument('--visualize', action='store_true',
                        help='Generate visualizations of model performance')
    
    return parser.parse_args()

def create_output_directory(path):
    """Create output directory if it doesn't exist"""
    try:
        os.makedirs(path, exist_ok=True)
        return True
    except Exception as e:
        print(f"Error creating output directory: {e}")
        return False

def train_model(args):
    """Train and evaluate the model"""
    print(f"🚀 Starting model training with {args.model_type} model type")
    
    # Create output directory
    if not create_output_directory(args.output_path):
        return False
    
    # Initialize data processor
    processor = TradeAIDataProcessor(data_path=args.data_path)
    
    # Load and process data
    print("Loading and processing data...")
    if not processor.load_data():
        print("❌ Failed to load data")
        return False
    
    # Prepare features for model
    df = processor.prepare_features_for_model()
    print(f"Processed data shape: {df.shape}")
    
    # Drop non-feature columns
    X = df.drop(['quantity_sold', 'product_name', 'date'], axis=1)
    y = df['quantity_sold']
    
    # Split data for training and testing
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=42
    )
    
    print(f"Training data: {X_train.shape[0]} samples")
    print(f"Testing data: {X_test.shape[0]} samples")
    
    # Initialize and train model
    model = TradeAIPredictionModel(model_type=args.model_type)
    
    print(f"Training {args.model_type} model...")
    if args.optimize:
        print("Performing hyperparameter optimization (this may take a while)...")
    
    metrics = model.train(X_train, y_train, optimize=args.optimize)
    
    print("Training complete!")
    print(f"Model metrics on validation set:")
    print(f"  MAE: {metrics['mae']:.2f}")
    print(f"  RMSE: {metrics['rmse']:.2f}")
    print(f"  R²: {metrics['r2']:.4f}")
    
    # Evaluate on test set
    y_pred = model.predict(X_test)
    
    test_metrics = {
        'mae': mean_absolute_error(y_test, y_pred),
        'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
        'r2': r2_score(y_test, y_pred)
    }
    
    print(f"Model metrics on test set:")
    print(f"  MAE: {test_metrics['mae']:.2f}")
    print(f"  RMSE: {test_metrics['rmse']:.2f}")
    print(f"  R²: {test_metrics['r2']:.4f}")
    
    # Generate feature importance report
    importance_report = model.generate_feature_importance_report()
    
    print("\nTop 5 important features:")
    for i, (feature, importance) in enumerate(list(importance_report['top_features'].items())[:5]):
        print(f"  {i+1}. {feature}: {importance:.4f}")
    
    # Save model
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_filename = f"{args.model_type}_model_{timestamp}.joblib"
    model_path = os.path.join(args.output_path, model_filename)
    
    model.save_model(model_path)
    
    # Save model metadata
    metadata = {
        'model_type': args.model_type,
        'training_date': datetime.now().isoformat(),
        'training_samples': X_train.shape[0],
        'test_samples': X_test.shape[0],
        'validation_metrics': metrics,
        'test_metrics': test_metrics,
        'feature_importance': importance_report['top_features'],
        'category_importance': importance_report['category_importance'],
        'model_file': model_filename
    }
    
    metadata_path = os.path.join(args.output_path, f"{args.model_type}_metadata_{timestamp}.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Model saved to {model_path}")
    print(f"Metadata saved to {metadata_path}")
    
    # Generate visualizations if requested
    if args.visualize:
        generate_visualizations(y_test, y_pred, importance_report, args)
    
    return True

def generate_visualizations(y_true, y_pred, importance_report, args):
    """Generate visualizations of model performance"""
    print("Generating visualizations...")
    
    # Create visualizations directory
    vis_dir = os.path.join(args.output_path, 'visualizations')
    os.makedirs(vis_dir, exist_ok=True)
    
    # Set style
    sns.set(style="whitegrid")
    
    # 1. Actual vs Predicted
    plt.figure(figsize=(10, 6))
    plt.scatter(y_true, y_pred, alpha=0.5)
    plt.plot([y_true.min(), y_true.max()], [y_true.min(), y_true.max()], 'r--')
    plt.xlabel('Actual Sales')
    plt.ylabel('Predicted Sales')
    plt.title('Actual vs Predicted Sales')
    plt.tight_layout()
    plt.savefig(os.path.join(vis_dir, 'actual_vs_predicted.png'))
    
    # 2. Residuals Plot
    residuals = y_true - y_pred
    plt.figure(figsize=(10, 6))
    plt.scatter(y_pred, residuals, alpha=0.5)
    plt.axhline(y=0, color='r', linestyle='--')
    plt.xlabel('Predicted Sales')
    plt.ylabel('Residuals')
    plt.title('Residuals Plot')
    plt.tight_layout()
    plt.savefig(os.path.join(vis_dir, 'residuals.png'))
    
    # 3. Feature Importance
    plt.figure(figsize=(12, 8))
    features = list(importance_report['top_features'].keys())[:10]
    importances = list(importance_report['top_features'].values())[:10]
    
    sns.barplot(x=importances, y=features)
    plt.xlabel('Importance')
    plt.ylabel('Feature')
    plt.title('Top 10 Feature Importance')
    plt.tight_layout()
    plt.savefig(os.path.join(vis_dir, 'feature_importance.png'))
    
    # 4. Category Importance
    plt.figure(figsize=(10, 6))
    categories = list(importance_report['category_importance'].keys())
    cat_importances = list(importance_report['category_importance'].values())
    
    sns.barplot(x=cat_importances, y=categories)
    plt.xlabel('Importance')
    plt.ylabel('Category')
    plt.title('Feature Category Importance')
    plt.tight_layout()
    plt.savefig(os.path.join(vis_dir, 'category_importance.png'))
    
    # 5. Error Distribution
    plt.figure(figsize=(10, 6))
    sns.histplot(residuals, kde=True)
    plt.xlabel('Prediction Error')
    plt.ylabel('Frequency')
    plt.title('Error Distribution')
    plt.tight_layout()
    plt.savefig(os.path.join(vis_dir, 'error_distribution.png'))
    
    print(f"Visualizations saved to {vis_dir}")

def main():
    """Main function"""
    args = parse_arguments()
    
    print("=" * 80)
    print(f"Trade AI Model Training")
    print(f"Model Type: {args.model_type}")
    print(f"Data Path: {args.data_path}")
    print(f"Output Path: {args.output_path}")
    print(f"Hyperparameter Optimization: {'Enabled' if args.optimize else 'Disabled'}")
    print("=" * 80)
    
    success = train_model(args)
    
    if success:
        print("\n✅ Model training completed successfully!")
    else:
        print("\n❌ Model training failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()