import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.impute import SimpleImputer

class TradeAIDataProcessor:
    """
    Data processing utilities for Trade AI platform.
    Handles data loading, cleaning, feature engineering, and preparation for ML models.
    """
    
    def __init__(self, data_path=None):
        """
        Initialize the data processor.
        
        Args:
            data_path (str): Path to the data directory
        """
        self.data_path = data_path
        self.sales_df = None
        self.promo_df = None
        self.product_catalog = None
        self.company_profile = None
        
    def load_data(self, data_path=None):
        """
        Load all required data files.
        
        Args:
            data_path (str): Path to the data directory (overrides init path)
            
        Returns:
            bool: True if data loaded successfully
        """
        if data_path:
            self.data_path = data_path
            
        if not self.data_path:
            raise ValueError("Data path not specified")
            
        try:
            # Load sales data
            sales_path = os.path.join(self.data_path, "sales_data.csv")
            self.sales_df = pd.read_csv(sales_path)
            
            # Load promotional data
            promo_path = os.path.join(self.data_path, "promotional_data.csv")
            self.promo_df = pd.read_csv(promo_path)
            
            # Load product catalog
            catalog_path = os.path.join(self.data_path, "product_catalog.json")
            with open(catalog_path, 'r') as f:
                self.product_catalog = json.load(f)
                
            # Load company profile
            profile_path = os.path.join(self.data_path, "company_profile.json")
            with open(profile_path, 'r') as f:
                self.company_profile = json.load(f)
                
            return True
        except Exception as e:
            print(f"Error loading data: {e}")
            return False
    
    def clean_sales_data(self):
        """
        Clean and preprocess sales data.
        
        Returns:
            pd.DataFrame: Cleaned sales dataframe
        """
        if self.sales_df is None:
            raise ValueError("Sales data not loaded. Call load_data() first.")
            
        # Make a copy to avoid modifying the original
        df = self.sales_df.copy()
        
        # Convert date to datetime
        df['date'] = pd.to_datetime(df['date'])
        
        # Handle missing values
        df['quantity_sold'].fillna(0, inplace=True)
        df['revenue'].fillna(0, inplace=True)
        
        # Remove negative sales (data errors)
        df = df[df['quantity_sold'] >= 0]
        
        # Add derived features
        df['year'] = df['date'].dt.year
        df['month'] = df['date'].dt.month
        df['day'] = df['date'].dt.day
        df['day_of_week'] = df['date'].dt.dayofweek
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        
        # Calculate unit price
        df['unit_price'] = np.where(df['quantity_sold'] > 0, 
                                    df['revenue'] / df['quantity_sold'], 
                                    0)
        
        return df
    
    def clean_promo_data(self):
        """
        Clean and preprocess promotional data.
        
        Returns:
            pd.DataFrame: Cleaned promotional dataframe
        """
        if self.promo_df is None:
            raise ValueError("Promotional data not loaded. Call load_data() first.")
            
        # Make a copy to avoid modifying the original
        df = self.promo_df.copy()
        
        # Convert dates to datetime
        df['promo_start_date'] = pd.to_datetime(df['promo_start_date'])
        df['promo_end_date'] = pd.to_datetime(df['promo_end_date'])
        
        # Calculate promotion duration
        df['promo_duration'] = (df['promo_end_date'] - df['promo_start_date']).dt.days + 1
        
        # Handle missing discount percentages
        df['discount_percentage'].fillna(0, inplace=True)
        
        # Ensure discount percentage is between 0 and 100
        df['discount_percentage'] = df['discount_percentage'].clip(0, 100)
        
        return df
    
    def merge_sales_and_promo(self):
        """
        Merge sales and promotional data to create a comprehensive dataset.
        
        Returns:
            pd.DataFrame: Merged dataframe with sales and promotion information
        """
        if self.sales_df is None or self.promo_df is None:
            raise ValueError("Data not loaded. Call load_data() first.")
            
        # Clean data
        sales_df = self.clean_sales_data()
        promo_df = self.clean_promo_data()
        
        # Create a flag for promotional periods
        result_df = sales_df.copy()
        result_df['is_promo'] = 0
        result_df['promo_type'] = None
        result_df['discount_percentage'] = 0
        
        # For each promotion, mark the corresponding sales records
        for _, promo in promo_df.iterrows():
            mask = ((result_df['date'] >= promo['promo_start_date']) & 
                   (result_df['date'] <= promo['promo_end_date']) & 
                   (result_df['product_name'] == promo['product_name']))
            
            result_df.loc[mask, 'is_promo'] = 1
            result_df.loc[mask, 'promo_type'] = promo['promo_type']
            result_df.loc[mask, 'discount_percentage'] = promo['discount_percentage']
        
        return result_df
    
    def add_product_features(self, df):
        """
        Add product features from the product catalog to the dataframe.
        
        Args:
            df (pd.DataFrame): Input dataframe with product_name column
            
        Returns:
            pd.DataFrame: Enhanced dataframe with product features
        """
        if self.product_catalog is None:
            raise ValueError("Product catalog not loaded. Call load_data() first.")
            
        # Create a product features dictionary
        product_features = {}
        for product in self.product_catalog:
            product_name = product['product_name']
            product_features[product_name] = {
                'product_category': product.get('category', 'Unknown'),
                'base_price': product.get('base_price', 0),
                'margin_percentage': product.get('margin_percentage', 0)
            }
        
        # Convert to dataframe for merging
        product_df = pd.DataFrame.from_dict(product_features, orient='index').reset_index()
        product_df.rename(columns={'index': 'product_name'}, inplace=True)
        
        # Merge with input dataframe
        result_df = df.merge(product_df, on='product_name', how='left')
        
        return result_df
    
    def calculate_seasonality(self, df, window=30):
        """
        Calculate seasonality index for each product.
        
        Args:
            df (pd.DataFrame): Input dataframe with sales data
            window (int): Rolling window size for seasonality calculation
            
        Returns:
            pd.DataFrame: Dataframe with seasonality index
        """
        # Group by product and date
        product_daily = df.groupby(['product_name', 'date'])['quantity_sold'].sum().reset_index()
        
        # Create a pivot table with products as rows and dates as columns
        pivot_df = product_daily.pivot(index='product_name', columns='date', values='quantity_sold')
        
        # Fill missing values with 0
        pivot_df.fillna(0, inplace=True)
        
        # Calculate rolling average
        rolling_avg = pivot_df.T.rolling(window=window, min_periods=1).mean().T
        
        # Calculate seasonality index (actual / rolling average)
        seasonality = pivot_df / rolling_avg
        
        # Replace inf and NaN with 1 (neutral seasonality)
        seasonality.replace([np.inf, -np.inf], 1, inplace=True)
        seasonality.fillna(1, inplace=True)
        
        # Convert back to long format
        seasonality_df = seasonality.stack().reset_index()
        seasonality_df.columns = ['product_name', 'date', 'seasonality_index']
        
        # Merge with original dataframe
        result_df = df.merge(seasonality_df, on=['product_name', 'date'], how='left')
        
        # Fill missing seasonality with 1
        result_df['seasonality_index'].fillna(1, inplace=True)
        
        return result_df
    
    def calculate_competitor_intensity(self, df):
        """
        Simulate competitor intensity based on available data.
        In a real implementation, this would use actual competitor data.
        
        Args:
            df (pd.DataFrame): Input dataframe
            
        Returns:
            pd.DataFrame: Dataframe with competitor intensity
        """
        # Group by date and category
        date_category = df.groupby(['date', 'product_category'])['is_promo'].mean().reset_index()
        date_category.columns = ['date', 'product_category', 'category_promo_intensity']
        
        # Merge back to original dataframe
        result_df = df.merge(date_category, on=['date', 'product_category'], how='left')
        
        # Scale to 0-1 range to represent competitor intensity
        # Higher values mean more promotional activity in the category
        scaler = MinMaxScaler()
        result_df['competitor_intensity'] = scaler.fit_transform(
            result_df[['category_promo_intensity']]
        )
        
        # Drop intermediate column
        result_df.drop('category_promo_intensity', axis=1, inplace=True)
        
        return result_df
    
    def prepare_features_for_model(self, include_target=True):
        """
        Prepare features for machine learning model.
        
        Args:
            include_target (bool): Whether to include the target variable
            
        Returns:
            pd.DataFrame: Feature dataframe ready for ML model
        """
        # Merge sales and promo data
        df = self.merge_sales_and_promo()
        
        # Add product features
        df = self.add_product_features(df)
        
        # Calculate seasonality
        df = self.calculate_seasonality(df)
        
        # Calculate competitor intensity
        df = self.calculate_competitor_intensity(df)
        
        # Calculate sales volatility (rolling standard deviation)
        product_daily = df.groupby(['product_name', 'date'])['quantity_sold'].sum().reset_index()
        product_daily['sales_volatility'] = product_daily.groupby('product_name')['quantity_sold'].transform(
            lambda x: x.rolling(window=30, min_periods=1).std()
        )
        
        # Fill missing volatility with 0
        product_daily['sales_volatility'].fillna(0, inplace=True)
        
        # Merge volatility back to main dataframe
        volatility_df = product_daily[['product_name', 'date', 'sales_volatility']]
        df = df.merge(volatility_df, on=['product_name', 'date'], how='left')
        
        # Calculate average monthly sales
        df['avg_monthly_sales'] = df.groupby(['product_name', 'year', 'month'])['quantity_sold'].transform('mean')
        
        # Select features for model
        features = [
            'product_name', 'date', 'product_category', 'base_price', 'discount_percentage',
            'promo_type', 'is_promo', 'avg_monthly_sales', 'sales_volatility',
            'seasonality_index', 'competitor_intensity', 'margin_percentage'
        ]
        
        if include_target:
            features.append('quantity_sold')
            
        # Select only needed columns
        result_df = df[features].copy()
        
        # Handle missing values
        for col in result_df.columns:
            if result_df[col].dtype.kind in 'ifc':  # integer, float, complex
                result_df[col].fillna(0, inplace=True)
            else:
                result_df[col].fillna('Unknown', inplace=True)
        
        return result_df
    
    def generate_prediction_dataset(self, start_date=None, end_date=None, products=None):
        """
        Generate a dataset for making predictions.
        
        Args:
            start_date (str): Start date for predictions (YYYY-MM-DD)
            end_date (str): End date for predictions (YYYY-MM-DD)
            products (list): List of product names to include
            
        Returns:
            pd.DataFrame: Dataset for making predictions
        """
        # Prepare features
        df = self.prepare_features_for_model(include_target=True)
        
        # Filter by date range if specified
        if start_date and end_date:
            start_date = pd.to_datetime(start_date)
            end_date = pd.to_datetime(end_date)
            df = df[(df['date'] >= start_date) & (df['date'] <= end_date)]
        
        # Filter by products if specified
        if products:
            df = df[df['product_name'].isin(products)]
        
        return df
    
    def aggregate_by_product(self, df):
        """
        Aggregate data by product for product-level analysis.
        
        Args:
            df (pd.DataFrame): Input dataframe
            
        Returns:
            pd.DataFrame: Aggregated dataframe
        """
        # Group by product
        agg_df = df.groupby('product_name').agg({
            'quantity_sold': 'sum',
            'base_price': 'mean',
            'discount_percentage': 'mean',
            'is_promo': 'mean',
            'avg_monthly_sales': 'mean',
            'sales_volatility': 'mean',
            'seasonality_index': 'mean',
            'competitor_intensity': 'mean',
            'margin_percentage': 'mean',
            'product_category': 'first'
        }).reset_index()
        
        # Rename columns
        agg_df.rename(columns={
            'is_promo': 'promo_frequency',
            'quantity_sold': 'total_sales'
        }, inplace=True)
        
        return agg_df
    
    def export_processed_data(self, output_path):
        """
        Export processed data to CSV and JSON files.
        
        Args:
            output_path (str): Path to save the processed data
            
        Returns:
            bool: True if export successful
        """
        try:
            # Create output directory if it doesn't exist
            os.makedirs(output_path, exist_ok=True)
            
            # Prepare features
            df = self.prepare_features_for_model()
            
            # Save full dataset
            df.to_csv(os.path.join(output_path, 'processed_data.csv'), index=False)
            
            # Save aggregated product data
            agg_df = self.aggregate_by_product(df)
            agg_df.to_csv(os.path.join(output_path, 'product_aggregated.csv'), index=False)
            
            # Save product profiles as JSON
            product_profiles = {}
            for _, row in agg_df.iterrows():
                product_name = row['product_name']
                product_profiles[product_name] = row.to_dict()
            
            with open(os.path.join(output_path, 'product_profiles.json'), 'w') as f:
                json.dump(product_profiles, f, indent=2)
                
            return True
        except Exception as e:
            print(f"Error exporting data: {e}")
            return False


# Example usage
if __name__ == "__main__":
    # Initialize data processor
    processor = TradeAIDataProcessor(data_path="/workspace/trade-ai-github/test_data")
    
    # Load data
    if processor.load_data():
        print("Data loaded successfully")
        
        # Process data
        processed_df = processor.prepare_features_for_model()
        print(f"Processed data shape: {processed_df.shape}")
        
        # Export processed data
        if processor.export_processed_data("/workspace/trade-ai-github/processed_data"):
            print("Data exported successfully")
            
        # Generate prediction dataset
        pred_df = processor.generate_prediction_dataset(
            start_date="2023-01-01",
            end_date="2023-12-31",
            products=["Diplomat Sparkling Water", "Diplomat Energy Drink"]
        )
        print(f"Prediction dataset shape: {pred_df.shape}")
    else:
        print("Failed to load data")