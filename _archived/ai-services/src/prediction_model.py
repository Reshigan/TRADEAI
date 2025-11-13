import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import (
    RandomForestRegressor, GradientBoostingRegressor, ExtraTreesRegressor, 
    VotingRegressor, StackingRegressor
)
from sklearn.linear_model import ElasticNet, Ridge, Lasso
from sklearn.svm import SVR
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler, OneHotEncoder, RobustScaler
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import (
    train_test_split, GridSearchCV, TimeSeriesSplit, cross_val_score
)
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score, 
    mean_absolute_percentage_error
)
from sklearn.feature_selection import SelectKBest, f_regression, RFE
import warnings
warnings.filterwarnings('ignore')

class TradeAIPredictionModel:
    """
    Advanced prediction model for Trade AI platform that uses ensemble methods
    to forecast sales and promotional effectiveness.
    """
    
    def __init__(self, model_type="advanced_ensemble"):
        """
        Initialize the prediction model with enhanced ML capabilities.
        
        Args:
            model_type (str): Type of model to use. Options: 
                             "advanced_ensemble", "stacking_ensemble", "voting_ensemble",
                             "random_forest", "gradient_boosting", "neural_network", "svm"
        """
        self.model_type = model_type
        self.model = None
        self.feature_importance = {}
        self.metrics = {}
        self.preprocessor = None
        self.feature_selector = None
        self.categorical_features = ['product_category', 'promo_type', 'region', 'channel']
        self.numerical_features = ['base_price', 'discount_percentage', 'avg_monthly_sales', 
                                  'sales_volatility', 'seasonality_index', 'competitor_intensity',
                                  'margin_percentage', 'promo_cost']
        self.model_performance = {}
        self.cross_validation_scores = {}
        
    def _create_preprocessor(self, use_robust_scaler=True):
        """Create an enhanced preprocessor for the data"""
        # Use RobustScaler for better handling of outliers
        scaler = RobustScaler() if use_robust_scaler else StandardScaler()
        
        numerical_transformer = Pipeline(steps=[
            ('scaler', scaler)
        ])
        
        categorical_transformer = Pipeline(steps=[
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        
        return ColumnTransformer(
            transformers=[
                ('num', numerical_transformer, self.numerical_features),
                ('cat', categorical_transformer, self.categorical_features)
            ],
            remainder='passthrough'
        )
    
    def _create_feature_selector(self, n_features=20):
        """Create feature selector for dimensionality reduction"""
        return SelectKBest(score_func=f_regression, k=min(n_features, len(self.numerical_features) + 10))
    
    def _create_model(self):
        """Create advanced prediction models with ensemble techniques"""
        if self.model_type == "random_forest":
            return RandomForestRegressor(
                n_estimators=200, 
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
        elif self.model_type == "gradient_boosting":
            return GradientBoostingRegressor(
                n_estimators=150,
                learning_rate=0.1,
                max_depth=6,
                subsample=0.8,
                random_state=42
            )
        elif self.model_type == "neural_network":
            return MLPRegressor(
                hidden_layer_sizes=(100, 50, 25),
                activation='relu',
                solver='adam',
                alpha=0.001,
                learning_rate='adaptive',
                max_iter=500,
                random_state=42
            )
        elif self.model_type == "svm":
            return SVR(
                kernel='rbf',
                C=100,
                gamma='scale',
                epsilon=0.1
            )
        elif self.model_type == "voting_ensemble":
            # Voting ensemble with multiple algorithms
            rf = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
            gb = GradientBoostingRegressor(n_estimators=100, random_state=42)
            et = ExtraTreesRegressor(n_estimators=100, random_state=42, n_jobs=-1)
            
            return VotingRegressor([
                ('rf', rf),
                ('gb', gb),
                ('et', et)
            ])
        elif self.model_type == "stacking_ensemble":
            # Stacking ensemble with meta-learner
            base_models = [
                ('rf', RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)),
                ('gb', GradientBoostingRegressor(n_estimators=100, random_state=42)),
                ('et', ExtraTreesRegressor(n_estimators=100, random_state=42, n_jobs=-1)),
                ('ridge', Ridge(alpha=1.0))
            ]
            
            return StackingRegressor(
                estimators=base_models,
                final_estimator=ElasticNet(alpha=0.1, l1_ratio=0.5),
                cv=5
            )
        else:  # advanced_ensemble (default)
            # Advanced ensemble with optimized parameters
            rf = RandomForestRegressor(
                n_estimators=200, 
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
            gb = GradientBoostingRegressor(
                n_estimators=150,
                learning_rate=0.1,
                max_depth=6,
                subsample=0.8,
                random_state=42
            )
            et = ExtraTreesRegressor(
                n_estimators=150,
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
            
            return VotingRegressor([
                ('rf', rf),
                ('gb', gb),
                ('et', et)
            ], weights=[0.4, 0.35, 0.25])
    
    def train(self, X, y, optimize=False, use_time_series_cv=False):
        """
        Train the prediction model with enhanced evaluation.
        
        Args:
            X (pd.DataFrame): Features dataframe
            y (pd.Series): Target variable
            optimize (bool): Whether to perform hyperparameter optimization
            use_time_series_cv (bool): Use time series cross-validation
            
        Returns:
            dict: Comprehensive training metrics
        """
        # Create preprocessor and feature selector
        self.preprocessor = self._create_preprocessor()
        self.feature_selector = self._create_feature_selector()
        base_model = self._create_model()
        
        # Create full pipeline with feature selection
        self.model = Pipeline(steps=[
            ('preprocessor', self.preprocessor),
            ('feature_selector', self.feature_selector),
            ('model', base_model)
        ])
        
        # Split data for training and validation
        if use_time_series_cv:
            # Use time series split for temporal data
            tscv = TimeSeriesSplit(n_splits=5)
            cv_strategy = tscv
        else:
            cv_strategy = 5
            
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=None
        )
        
        # Hyperparameter optimization if requested
        if optimize:
            param_grid = self._get_param_grid()
            
            grid_search = GridSearchCV(
                self.model,
                param_grid,
                cv=cv_strategy,
                scoring=['neg_mean_squared_error', 'neg_mean_absolute_error', 'r2'],
                refit='neg_mean_squared_error',
                n_jobs=-1,
                verbose=1
            )
            
            grid_search.fit(X_train, y_train)
            self.model = grid_search.best_estimator_
            print(f"Best parameters: {grid_search.best_params_}")
            print(f"Best CV score: {grid_search.best_score_:.4f}")
        else:
            # Train the model
            self.model.fit(X_train, y_train)
        
        # Perform cross-validation for robust evaluation
        cv_scores = cross_val_score(
            self.model, X_train, y_train, 
            cv=cv_strategy, 
            scoring='neg_mean_squared_error',
            n_jobs=-1
        )
        self.cross_validation_scores = {
            'mse_scores': -cv_scores,
            'mean_mse': -cv_scores.mean(),
            'std_mse': cv_scores.std()
        }
        
        # Evaluate on validation set
        y_pred = self.model.predict(X_val)
        
        # Calculate comprehensive metrics
        self.metrics = {
            'mse': mean_squared_error(y_val, y_pred),
            'rmse': np.sqrt(mean_squared_error(y_val, y_pred)),
            'mae': mean_absolute_error(y_val, y_pred),
            'r2': r2_score(y_val, y_pred),
            'mape': mean_absolute_percentage_error(y_val, y_pred) * 100,
            'cv_mean_mse': self.cross_validation_scores['mean_mse'],
            'cv_std_mse': self.cross_validation_scores['std_mse']
        }
        
        # Extract feature importance if available
        self._extract_feature_importance()
        
        print(f"Model Training Complete:")
        print(f"  R² Score: {self.metrics['r2']:.4f}")
        print(f"  RMSE: {self.metrics['rmse']:.4f}")
        print(f"  MAE: {self.metrics['mae']:.4f}")
        print(f"  MAPE: {self.metrics['mape']:.2f}%")
        print(f"  CV Mean MSE: {self.metrics['cv_mean_mse']:.4f} ± {self.metrics['cv_std_mse']:.4f}")
        
        return self.metrics
    
    def _get_param_grid(self):
        """Get parameter grid for hyperparameter optimization"""
        if self.model_type in ["random_forest", "advanced_ensemble"]:
            return {
                'model__n_estimators': [100, 150, 200],
                'model__max_depth': [10, 15, 20, None],
                'model__min_samples_split': [2, 5, 10],
                'model__min_samples_leaf': [1, 2, 4]
            }
        elif self.model_type == "gradient_boosting":
            return {
                'model__n_estimators': [100, 150, 200],
                'model__learning_rate': [0.05, 0.1, 0.15],
                'model__max_depth': [3, 5, 7],
                'model__subsample': [0.8, 0.9, 1.0]
            }
        elif self.model_type == "neural_network":
            return {
                'model__hidden_layer_sizes': [(50,), (100,), (100, 50), (100, 50, 25)],
                'model__alpha': [0.0001, 0.001, 0.01],
                'model__learning_rate_init': [0.001, 0.01, 0.1]
            }
        else:
            return {}
    
    def _extract_feature_importance(self):
        """Extract feature importance from the trained model"""
        try:
            # Get the final model from the pipeline
            final_model = self.model.named_steps['model']
            
            # Get feature names after preprocessing
            feature_names = self._get_feature_names()
            
            if hasattr(final_model, 'feature_importances_'):
                # For tree-based models
                importances = final_model.feature_importances_
            elif hasattr(final_model, 'coef_'):
                # For linear models
                importances = np.abs(final_model.coef_)
            elif hasattr(final_model, 'estimators_'):
                # For ensemble models
                if hasattr(final_model.estimators_[0], 'feature_importances_'):
                    importances = np.mean([est.feature_importances_ for est in final_model.estimators_], axis=0)
                else:
                    importances = None
            else:
                importances = None
            
            if importances is not None and len(feature_names) == len(importances):
                self.feature_importance = dict(zip(feature_names, importances))
                # Sort by importance
                self.feature_importance = dict(sorted(
                    self.feature_importance.items(), 
                    key=lambda x: x[1], 
                    reverse=True
                ))
        except Exception as e:
            print(f"Could not extract feature importance: {e}")
            self.feature_importance = {}
    
    def _get_feature_names(self):
        """Get feature names after preprocessing"""
        try:
            # Get feature names from preprocessor
            preprocessor = self.model.named_steps['preprocessor']
            
            # Numerical features
            num_features = self.numerical_features
            
            # Categorical features (after one-hot encoding)
            cat_features = []
            if hasattr(preprocessor.named_transformers_['cat'], 'named_steps'):
                onehot = preprocessor.named_transformers_['cat'].named_steps['onehot']
                if hasattr(onehot, 'get_feature_names_out'):
                    cat_features = onehot.get_feature_names_out(self.categorical_features).tolist()
            
            return num_features + cat_features
        except Exception as e:
            print(f"Could not get feature names: {e}")
            return [f"feature_{i}" for i in range(len(self.numerical_features) + 10)]
    
    def predict(self, X):
        """
        Make predictions using the trained model.
        
        Args:
            X (pd.DataFrame): Features dataframe
            
        Returns:
            np.array: Predictions
        """
        if self.model is None:
            raise ValueError("Model has not been trained yet. Call train() first.")
        
        return self.model.predict(X)
    
    def predict_with_confidence(self, X, confidence_level=0.95):
        """
        Make predictions with confidence intervals (for ensemble models).
        
        Args:
            X (pd.DataFrame): Features dataframe
            confidence_level (float): Confidence level for intervals
            
        Returns:
            dict: Predictions with confidence intervals
        """
        if self.model is None:
            raise ValueError("Model has not been trained yet. Call train() first.")
        
        predictions = self.model.predict(X)
        
        # For ensemble models, calculate prediction intervals
        if hasattr(self.model.named_steps['model'], 'estimators_'):
            # Get predictions from all estimators
            estimator_predictions = []
            for estimator in self.model.named_steps['model'].estimators_:
                # Transform data through preprocessing pipeline
                X_transformed = self.model.named_steps['preprocessor'].transform(X)
                X_selected = self.model.named_steps['feature_selector'].transform(X_transformed)
                pred = estimator.predict(X_selected)
                estimator_predictions.append(pred)
            
            estimator_predictions = np.array(estimator_predictions)
            
            # Calculate confidence intervals
            alpha = 1 - confidence_level
            lower_percentile = (alpha / 2) * 100
            upper_percentile = (1 - alpha / 2) * 100
            
            lower_bound = np.percentile(estimator_predictions, lower_percentile, axis=0)
            upper_bound = np.percentile(estimator_predictions, upper_percentile, axis=0)
            
            return {
                'predictions': predictions,
                'lower_bound': lower_bound,
                'upper_bound': upper_bound,
                'confidence_level': confidence_level
            }
        else:
            # For non-ensemble models, return predictions without intervals
            return {
                'predictions': predictions,
                'lower_bound': predictions,
                'upper_bound': predictions,
                'confidence_level': confidence_level
            }
    
    def predict_promotion_impact(self, product_data, promotion_details):
        """
        Predict the impact of a promotion on sales.
        
        Args:
            product_data (dict): Product data including historical sales
            promotion_details (dict): Details of the promotion
            
        Returns:
            dict: Prediction results including lift and ROI
        """
        # Extract features
        base_price = product_data.get('base_price', 0)
        avg_monthly_sales = product_data.get('avg_monthly_sales', 0)
        discount_percentage = promotion_details.get('discount_percentage', 0)
        promo_type = promotion_details.get('promo_type', 'Discount')
        
        # Create feature dataframe
        X_pred = pd.DataFrame({
            'base_price': [base_price],
            'discount_percentage': [discount_percentage],
            'avg_monthly_sales': [avg_monthly_sales],
            'sales_volatility': [product_data.get('sales_volatility', avg_monthly_sales * 0.2)],
            'seasonality_index': [product_data.get('seasonality_index', 1.0)],
            'competitor_intensity': [product_data.get('competitor_intensity', 0.5)],
            'product_category': [product_data.get('product_category', 'Unknown')],
            'promo_type': [promo_type],
            'region': [promotion_details.get('region', 'National')],
            'channel': [promotion_details.get('channel', 'Retail')]
        })
        
        # Make prediction
        predicted_sales = self.predict(X_pred)[0]
        
        # Calculate lift and ROI
        sales_lift = predicted_sales - avg_monthly_sales
        sales_lift_percentage = (sales_lift / avg_monthly_sales) * 100 if avg_monthly_sales > 0 else 0
        
        # Calculate ROI
        promo_cost = promotion_details.get('promo_cost', 0)
        product_margin = product_data.get('margin_percentage', 0.3)
        incremental_margin = sales_lift * base_price * product_margin
        roi = (incremental_margin / promo_cost) * 100 if promo_cost > 0 else 0
        
        return {
            'product': product_data.get('product_name', 'Unknown'),
            'baseline_sales': avg_monthly_sales,
            'predicted_sales': predicted_sales,
            'sales_lift': sales_lift,
            'sales_lift_percentage': sales_lift_percentage,
            'promo_cost': promo_cost,
            'incremental_margin': incremental_margin,
            'roi': roi,
            'confidence': self._calculate_confidence(X_pred)
        }
    
    def _calculate_confidence(self, X):
        """
        Calculate prediction confidence based on data similarity to training set.
        This is a simplified implementation.
        
        Args:
            X (pd.DataFrame): Features for prediction
            
        Returns:
            float: Confidence score between 0 and 1
        """
        # Simplified confidence calculation
        # In a real implementation, this would use more sophisticated methods
        base_confidence = 0.85
        
        # Adjust based on metrics
        if self.metrics:
            r2_factor = max(0, min(1, self.metrics.get('r2', 0)))
            base_confidence = 0.7 + (r2_factor * 0.3)
        
        return base_confidence
    
    def evaluate_model(self, X_test, y_test):
        """
        Evaluate model performance on test data.
        
        Args:
            X_test (pd.DataFrame): Test features
            y_test (pd.Series): Test targets
            
        Returns:
            dict: Comprehensive evaluation metrics
        """
        if self.model is None:
            raise ValueError("Model has not been trained yet. Call train() first.")
        
        # Make predictions
        y_pred = self.model.predict(X_test)
        
        # Calculate metrics
        evaluation_metrics = {
            'test_mse': mean_squared_error(y_test, y_pred),
            'test_rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
            'test_mae': mean_absolute_error(y_test, y_pred),
            'test_r2': r2_score(y_test, y_pred),
            'test_mape': mean_absolute_percentage_error(y_test, y_pred) * 100
        }
        
        # Add residual analysis
        residuals = y_test - y_pred
        evaluation_metrics.update({
            'residual_mean': np.mean(residuals),
            'residual_std': np.std(residuals),
            'residual_skewness': self._calculate_skewness(residuals),
            'residual_kurtosis': self._calculate_kurtosis(residuals)
        })
        
        return evaluation_metrics
    
    def _calculate_skewness(self, data):
        """Calculate skewness of data"""
        mean = np.mean(data)
        std = np.std(data)
        if std == 0:
            return 0
        return np.mean(((data - mean) / std) ** 3)
    
    def _calculate_kurtosis(self, data):
        """Calculate kurtosis of data"""
        mean = np.mean(data)
        std = np.std(data)
        if std == 0:
            return 0
        return np.mean(((data - mean) / std) ** 4) - 3
    
    def get_model_summary(self):
        """
        Get comprehensive model summary.
        
        Returns:
            dict: Model summary with metrics and feature importance
        """
        summary = {
            'model_type': self.model_type,
            'training_metrics': self.metrics,
            'cross_validation_scores': self.cross_validation_scores,
            'feature_importance': self.feature_importance,
            'model_parameters': self._get_model_parameters()
        }
        
        return summary
    
    def _get_model_parameters(self):
        """Get model parameters"""
        if self.model is None:
            return {}
        
        try:
            final_model = self.model.named_steps['model']
            return final_model.get_params()
        except Exception as e:
            print(f"Could not get model parameters: {e}")
            return {}
    
    def save_model(self, filepath):
        """
        Save the model to a file.
        
        Args:
            filepath (str): Path to save the model
        """
        import joblib
        
        model_data = {
            'model': self.model,
            'feature_importance': self.feature_importance,
            'metrics': self.metrics,
            'model_type': self.model_type,
            'categorical_features': self.categorical_features,
            'numerical_features': self.numerical_features,
            'timestamp': datetime.now().isoformat()
        }
        
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath):
        """
        Load the model from a file.
        
        Args:
            filepath (str): Path to load the model from
        """
        import joblib
        
        model_data = joblib.load(filepath)
        
        self.model = model_data['model']
        self.feature_importance = model_data['feature_importance']
        self.metrics = model_data['metrics']
        self.model_type = model_data['model_type']
        self.categorical_features = model_data['categorical_features']
        self.numerical_features = model_data['numerical_features']
        
        print(f"Model loaded from {filepath}")
        
    def generate_feature_importance_report(self):
        """
        Generate a report of feature importances.
        
        Returns:
            dict: Feature importance report
        """
        if not self.feature_importance:
            return {"error": "No feature importance available. Model may not support feature importance or has not been trained."}
        
        # Get top features
        top_features = {k: v for k, v in list(self.feature_importance.items())[:10]}
        
        # Group features by category
        grouped_features = {}
        for feature, importance in self.feature_importance.items():
            category = None
            
            # Determine category based on feature name
            if feature in self.numerical_features:
                category = "numerical"
            else:
                # For one-hot encoded features, extract the original category
                for cat_feature in self.categorical_features:
                    if cat_feature in feature:
                        category = cat_feature
                        break
                
                if category is None:
                    category = "other"
            
            if category not in grouped_features:
                grouped_features[category] = {}
            
            grouped_features[category][feature] = importance
        
        # Calculate total importance by category
        category_importance = {}
        for category, features in grouped_features.items():
            category_importance[category] = sum(features.values())
        
        # Sort by importance
        category_importance = {k: v for k, v in sorted(
            category_importance.items(), 
            key=lambda item: item[1], 
            reverse=True
        )}
        
        return {
            "top_features": top_features,
            "category_importance": category_importance,
            "all_features": self.feature_importance,
            "model_metrics": self.metrics
        }


# Example usage
if __name__ == "__main__":
    # Create sample data
    np.random.seed(42)
    
    # Sample data
    n_samples = 1000
    
    # Create features
    data = {
        'base_price': np.random.uniform(10, 100, n_samples),
        'discount_percentage': np.random.uniform(0, 30, n_samples),
        'avg_monthly_sales': np.random.uniform(1000, 10000, n_samples),
        'sales_volatility': np.random.uniform(100, 2000, n_samples),
        'seasonality_index': np.random.uniform(0.7, 1.3, n_samples),
        'competitor_intensity': np.random.uniform(0, 1, n_samples),
        'product_category': np.random.choice(['Beverage', 'Snack', 'Condiment'], n_samples),
        'promo_type': np.random.choice(['Discount', 'BOGO', 'Bundle'], n_samples),
        'region': np.random.choice(['North', 'South', 'East', 'West'], n_samples),
        'channel': np.random.choice(['Retail', 'Wholesale', 'Online'], n_samples)
    }
    
    # Create target
    # Simple model: higher discount = higher sales, higher price = lower sales
    base_sales = data['avg_monthly_sales']
    discount_effect = data['discount_percentage'] * 50
    price_effect = data['base_price'] * -10
    seasonality_effect = (data['seasonality_index'] - 1) * 1000
    
    # Add promo type effect
    promo_effect = np.zeros(n_samples)
    promo_effect[data['promo_type'] == 'BOGO'] = 500
    promo_effect[data['promo_type'] == 'Bundle'] = 300
    
    # Create target with some noise
    target = base_sales + discount_effect + price_effect + seasonality_effect + promo_effect
    target = target + np.random.normal(0, 500, n_samples)
    
    # Create dataframe
    df = pd.DataFrame(data)
    df['sales'] = target
    
    # Train model
    model = TradeAIPredictionModel(model_type="ensemble")
    metrics = model.train(df.drop('sales', axis=1), df['sales'], optimize=True)
    
    print(f"Model metrics: {metrics}")
    
    # Get feature importance
    importance_report = model.generate_feature_importance_report()
    print("\nTop features:")
    for feature, importance in list(importance_report['top_features'].items())[:5]:
        print(f"  {feature}: {importance:.4f}")
    
    # Make a prediction
    product_data = {
        'product_name': 'Test Product',
        'base_price': 50,
        'avg_monthly_sales': 5000,
        'sales_volatility': 1000,
        'seasonality_index': 1.1,
        'competitor_intensity': 0.7,
        'product_category': 'Beverage',
        'margin_percentage': 0.4
    }
    
    promotion_details = {
        'promo_type': 'Discount',
        'discount_percentage': 20,
        'region': 'South',
        'channel': 'Retail',
        'promo_cost': 2000
    }
    
    prediction = model.predict_promotion_impact(product_data, promotion_details)
    print("\nPromotion impact prediction:")
    for key, value in prediction.items():
        print(f"  {key}: {value}")
    
    # Save model
    model.save_model("test_model.joblib")