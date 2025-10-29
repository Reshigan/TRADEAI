"""
TRADEAI Promotion Lift Analysis Model
Production-grade causal inference for measuring promotion effectiveness

Target: 95% confidence intervals
Method: Causal Impact (Bayesian structural time-series)
Output: Incremental lift, ROI, statistical significance
Training: After each promotion completion
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
import logging

# Causal Inference
from causalimpact import CausalImpact
from statsmodels.tsa.statespace.structural import UnobservedComponents
import scipy.stats as stats

# ML
from sklearn.preprocessing import StandardScaler

# MLOps
import mlflow

logger = logging.getLogger(__name__)


class PromotionLiftAnalyzer:
    """
    Causal Impact Analysis for Promotion Lift
    
    Uses Bayesian structural time-series to estimate counterfactual:
    "What would have happened WITHOUT the promotion?"
    
    Then compares actual vs counterfactual to measure incremental lift
    """
    
    def __init__(self, config: Dict):
        self.config = config
        self.scaler = StandardScaler()
        
        # Initialize MLflow
        mlflow.set_experiment(config.get('experiment_name', 'promotion-lift'))
    
    def analyze_promotion(
        self,
        promotion_id: str,
        sales_data: pd.DataFrame,
        pre_period: Tuple[datetime, datetime],
        post_period: Tuple[datetime, datetime],
        control_data: Optional[pd.DataFrame] = None
    ) -> Dict:
        """
        Analyze promotion lift using Causal Impact
        
        Args:
            promotion_id: Promotion identifier
            sales_data: Daily sales data with columns [date, sales_volume]
            pre_period: (start_date, end_date) of pre-promotion period
            post_period: (start_date, end_date) of promotion period
            control_data: Optional control group data (no promotion)
            
        Returns:
            Dict with lift metrics and statistical significance
        """
        logger.info(f"Analyzing promotion {promotion_id}")
        
        with mlflow.start_run(run_name=f"promo_lift_{promotion_id}"):
            
            # Log parameters
            mlflow.log_param("promotion_id", promotion_id)
            mlflow.log_param("pre_period_days", (pre_period[1] - pre_period[0]).days)
            mlflow.log_param("post_period_days", (post_period[1] - post_period[0]).days)
            
            # Prepare data
            df = sales_data.copy()
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date').set_index('date')
            
            # Ensure we have the target column
            if 'sales_volume' not in df.columns:
                raise ValueError("sales_data must have 'sales_volume' column")
            
            # Add control variables if available
            if control_data is not None:
                control_df = control_data.copy()
                control_df['date'] = pd.to_datetime(control_df['date'])
                control_df = control_df.sort_values('date').set_index('date')
                df = df.join(control_df.add_suffix('_control'), how='left')
            
            # Define pre and post periods for CausalImpact
            pre_period_idx = [
                df.index.get_loc(pre_period[0]),
                df.index.get_loc(pre_period[1])
            ]
            post_period_idx = [
                df.index.get_loc(post_period[0]),
                df.index.get_loc(post_period[1])
            ]
            
            try:
                # Run Causal Impact analysis
                ci = CausalImpact(
                    df[['sales_volume']],
                    pre_period_idx,
                    post_period_idx,
                    prior_level_sd=self.config.get('prior_level_sd', 0.01),
                    niter=self.config.get('niter', 1000)
                )
                
                # Extract results
                summary = ci.summary()
                summary_data = ci.summary_data
                
                # Calculate metrics
                baseline_volume = summary_data.loc['average', 'predicted']
                actual_volume = summary_data.loc['average', 'actual']
                incremental_volume = summary_data.loc['average', 'abs_effect']
                incremental_pct = summary_data.loc['average', 'rel_effect'] * 100
                
                # Confidence intervals
                ci_lower = summary_data.loc['average', 'abs_effect_lower']
                ci_upper = summary_data.loc['average', 'abs_effect_upper']
                
                # Statistical significance
                p_value = summary_data.loc['average', 'p_value']
                is_significant = p_value < 0.05
                
                # Calculate ROI (if cost data available)
                promotion_cost = df.get('promotion_cost', pd.Series([0])).sum()
                margin_pct = self.config.get('margin_percentage', 0.3)
                incremental_revenue = incremental_volume * df['price'].mean() if 'price' in df else incremental_volume * 15
                incremental_profit = incremental_revenue * margin_pct
                roi = ((incremental_profit - promotion_cost) / promotion_cost * 100) if promotion_cost > 0 else 0
                
                result = {
                    'promotion_id': promotion_id,
                    'analysis_date': datetime.now().isoformat(),
                    'baseline': {
                        'volume': round(float(baseline_volume), 0),
                        'revenue': round(float(baseline_volume * df['price'].mean()), 2) if 'price' in df else None
                    },
                    'actual': {
                        'volume': round(float(actual_volume), 0),
                        'revenue': round(float(actual_volume * df['price'].mean()), 2) if 'price' in df else None
                    },
                    'incremental_lift': {
                        'volume': round(float(incremental_volume), 0),
                        'percentage': round(float(incremental_pct), 2),
                        'confidence_interval': [round(float(ci_lower), 0), round(float(ci_upper), 0)]
                    },
                    'statistics': {
                        'p_value': round(float(p_value), 4),
                        'is_significant': bool(is_significant),
                        'confidence_level': 0.95
                    },
                    'roi': {
                        'promotion_cost': float(promotion_cost),
                        'incremental_revenue': round(float(incremental_revenue), 2),
                        'incremental_profit': round(float(incremental_profit), 2),
                        'roi_percentage': round(float(roi), 2),
                        'payback_ratio': round(float(incremental_profit / promotion_cost), 2) if promotion_cost > 0 else None
                    },
                    'recommendation': self._generate_recommendation(incremental_pct, p_value, roi),
                    'plot_data': self._prepare_plot_data(ci)
                }
                
                # Log metrics
                mlflow.log_metric("incremental_lift_pct", float(incremental_pct))
                mlflow.log_metric("p_value", float(p_value))
                mlflow.log_metric("roi_pct", float(roi))
                mlflow.log_metric("is_significant", 1 if is_significant else 0)
                
                logger.info(f"Promotion analysis complete: {incremental_pct:.1f}% lift, p={p_value:.4f}, ROI={roi:.1f}%")
                
                return result
                
            except Exception as e:
                logger.error(f"Causal Impact analysis failed: {e}")
                
                # Fallback: Simple before/after comparison
                return self._fallback_analysis(promotion_id, df, pre_period, post_period)
    
    def _fallback_analysis(
        self,
        promotion_id: str,
        df: pd.DataFrame,
        pre_period: Tuple[datetime, datetime],
        post_period: Tuple[datetime, datetime]
    ) -> Dict:
        """
        Fallback analysis using simple before/after comparison
        
        Used when Causal Impact fails
        """
        logger.warning("Using fallback analysis (simple before/after)")
        
        # Filter data
        pre_data = df[(df.index >= pre_period[0]) & (df.index <= pre_period[1])]
        post_data = df[(df.index >= post_period[0]) & (df.index <= post_period[1])]
        
        # Calculate averages
        pre_avg = pre_data['sales_volume'].mean()
        post_avg = post_data['sales_volume'].mean()
        
        # Calculate lift
        incremental_volume = post_avg - pre_avg
        incremental_pct = (incremental_volume / pre_avg * 100) if pre_avg > 0 else 0
        
        # Statistical test (t-test)
        t_stat, p_value = stats.ttest_ind(post_data['sales_volume'], pre_data['sales_volume'])
        is_significant = p_value < 0.05
        
        # Confidence interval (assuming normal distribution)
        std_error = pre_data['sales_volume'].std() / np.sqrt(len(pre_data))
        ci_lower = incremental_volume - 1.96 * std_error
        ci_upper = incremental_volume + 1.96 * std_error
        
        return {
            'promotion_id': promotion_id,
            'analysis_date': datetime.now().isoformat(),
            'method': 'fallback_ttest',
            'baseline': {
                'volume': round(float(pre_avg), 0)
            },
            'actual': {
                'volume': round(float(post_avg), 0)
            },
            'incremental_lift': {
                'volume': round(float(incremental_volume), 0),
                'percentage': round(float(incremental_pct), 2),
                'confidence_interval': [round(float(ci_lower), 0), round(float(ci_upper), 0)]
            },
            'statistics': {
                'p_value': round(float(p_value), 4),
                'is_significant': bool(is_significant),
                'confidence_level': 0.95
            },
            'warning': 'Fallback method used. Results may be less accurate than Causal Impact.'
        }
    
    def _generate_recommendation(self, lift_pct: float, p_value: float, roi: float) -> str:
        """Generate actionable recommendation based on results"""
        
        if p_value >= 0.05:
            return "❌ NOT SIGNIFICANT: Promotion did not have statistically significant impact. Consider discontinuing or redesigning."
        
        if roi < 100:
            return f"⚠️ POOR ROI: Promotion was significant but ROI is only {roi:.0f}%. Review costs or increase discount depth."
        
        if roi >= 300:
            return f"✅ EXCELLENT: Promotion highly successful with {lift_pct:.0f}% lift and {roi:.0f}% ROI. Repeat this promotion!"
        
        if roi >= 200:
            return f"✅ GOOD: Promotion successful with {lift_pct:.0f}% lift and {roi:.0f}% ROI. Consider expanding."
        
        return f"✓ ACCEPTABLE: Promotion achieved {lift_pct:.0f}% lift with {roi:.0f}% ROI. Monitor future performance."
    
    def _prepare_plot_data(self, ci: CausalImpact) -> Dict:
        """Prepare data for frontend visualization"""
        
        # Get the inferences dataframe
        inferences = ci.inferences
        
        return {
            'dates': inferences.index.strftime('%Y-%m-%d').tolist(),
            'actual': inferences['actual'].tolist(),
            'predicted': inferences['predicted'].tolist(),
            'predicted_lower': inferences['predicted_lower'].tolist(),
            'predicted_upper': inferences['predicted_upper'].tolist()
        }
    
    def batch_analyze_promotions(self, promotions: List[Dict]) -> pd.DataFrame:
        """
        Analyze multiple promotions in batch
        
        Args:
            promotions: List of promotion dicts with required data
            
        Returns:
            DataFrame with results for all promotions
        """
        logger.info(f"Batch analyzing {len(promotions)} promotions")
        
        results = []
        
        for promo in promotions:
            try:
                result = self.analyze_promotion(
                    promotion_id=promo['id'],
                    sales_data=promo['sales_data'],
                    pre_period=promo['pre_period'],
                    post_period=promo['post_period'],
                    control_data=promo.get('control_data')
                )
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to analyze promotion {promo['id']}: {e}")
        
        # Convert to DataFrame
        df_results = pd.DataFrame(results)
        
        return df_results
    
    def compare_promotions(self, promotion_results: List[Dict]) -> Dict:
        """
        Compare multiple promotions to identify best performers
        
        Args:
            promotion_results: List of promotion analysis results
            
        Returns:
            Comparison metrics and rankings
        """
        df = pd.DataFrame(promotion_results)
        
        # Rank by different metrics
        rankings = {
            'by_lift': df.nlargest(5, 'incremental_lift.percentage')[['promotion_id', 'incremental_lift.percentage']].to_dict('records'),
            'by_roi': df.nlargest(5, 'roi.roi_percentage')[['promotion_id', 'roi.roi_percentage']].to_dict('records'),
            'by_volume': df.nlargest(5, 'incremental_lift.volume')[['promotion_id', 'incremental_lift.volume']].to_dict('records')
        }
        
        # Summary statistics
        summary = {
            'total_promotions': len(df),
            'significant_promotions': len(df[df['statistics.is_significant'] == True]),
            'avg_lift_pct': df['incremental_lift.percentage'].mean(),
            'avg_roi': df['roi.roi_percentage'].mean(),
            'total_incremental_volume': df['incremental_lift.volume'].sum(),
            'best_promotion': df.loc[df['roi.roi_percentage'].idxmax(), 'promotion_id'] if len(df) > 0 else None
        }
        
        return {
            'rankings': rankings,
            'summary': summary,
            'recommendations': self._generate_portfolio_recommendations(df)
        }
    
    def _generate_portfolio_recommendations(self, df: pd.DataFrame) -> List[str]:
        """Generate recommendations for promotion portfolio"""
        
        recommendations = []
        
        # High performers
        high_performers = df[df['roi.roi_percentage'] > 200]
        if len(high_performers) > 0:
            recommendations.append(f"✅ {len(high_performers)} promotions have excellent ROI (>200%). Scale these up.")
        
        # Low performers
        low_performers = df[df['roi.roi_percentage'] < 100]
        if len(low_performers) > 0:
            recommendations.append(f"❌ {len(low_performers)} promotions have poor ROI (<100%). Consider discontinuing.")
        
        # Non-significant
        non_significant = df[df['statistics.is_significant'] == False]
        if len(non_significant) > 0:
            recommendations.append(f"⚠️ {len(non_significant)} promotions are not statistically significant. Reevaluate.")
        
        # Overall portfolio health
        avg_roi = df['roi.roi_percentage'].mean()
        if avg_roi > 200:
            recommendations.append(f"✅ Portfolio performing well with {avg_roi:.0f}% average ROI.")
        elif avg_roi > 100:
            recommendations.append(f"✓ Portfolio acceptable with {avg_roi:.0f}% average ROI. Room for improvement.")
        else:
            recommendations.append(f"❌ Portfolio underperforming with {avg_roi:.0f}% average ROI. Urgent review needed.")
        
        return recommendations


class ABTestAnalyzer:
    """
    A/B Test Analysis for Promotions
    
    Compare treatment (promotion) vs control (no promotion) groups
    to measure true incremental impact
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
    
    def analyze_ab_test(
        self,
        treatment_data: pd.DataFrame,
        control_data: pd.DataFrame,
        metric: str = 'sales_volume'
    ) -> Dict:
        """
        Analyze A/B test results
        
        Args:
            treatment_data: Data from treatment group (with promotion)
            control_data: Data from control group (without promotion)
            metric: Metric to compare (e.g., 'sales_volume', 'revenue')
            
        Returns:
            Test results with statistical significance
        """
        logger.info("Analyzing A/B test")
        
        # Extract metric values
        treatment_values = treatment_data[metric].values
        control_values = control_data[metric].values
        
        # Calculate means
        treatment_mean = np.mean(treatment_values)
        control_mean = np.mean(control_values)
        
        # Calculate lift
        absolute_lift = treatment_mean - control_mean
        relative_lift = (absolute_lift / control_mean * 100) if control_mean > 0 else 0
        
        # Statistical test (t-test)
        t_stat, p_value = stats.ttest_ind(treatment_values, control_values)
        
        # Effect size (Cohen's d)
        pooled_std = np.sqrt((np.var(treatment_values) + np.var(control_values)) / 2)
        cohens_d = absolute_lift / pooled_std if pooled_std > 0 else 0
        
        # Confidence interval
        std_error = np.sqrt(np.var(treatment_values)/len(treatment_values) + np.var(control_values)/len(control_values))
        ci_lower = absolute_lift - 1.96 * std_error
        ci_upper = absolute_lift + 1.96 * std_error
        
        # Determine significance
        is_significant = p_value < 0.05
        
        result = {
            'test_type': 'ab_test',
            'metric': metric,
            'treatment': {
                'mean': round(float(treatment_mean), 2),
                'std': round(float(np.std(treatment_values)), 2),
                'n': len(treatment_values)
            },
            'control': {
                'mean': round(float(control_mean), 2),
                'std': round(float(np.std(control_values)), 2),
                'n': len(control_values)
            },
            'lift': {
                'absolute': round(float(absolute_lift), 2),
                'relative_pct': round(float(relative_lift), 2),
                'confidence_interval': [round(float(ci_lower), 2), round(float(ci_upper), 2)]
            },
            'statistics': {
                't_statistic': round(float(t_stat), 4),
                'p_value': round(float(p_value), 4),
                'is_significant': bool(is_significant),
                'effect_size': round(float(cohens_d), 3),
                'confidence_level': 0.95
            },
            'interpretation': self._interpret_ab_test(relative_lift, p_value, cohens_d)
        }
        
        logger.info(f"A/B test complete: {relative_lift:.1f}% lift, p={p_value:.4f}")
        
        return result
    
    def _interpret_ab_test(self, lift_pct: float, p_value: float, effect_size: float) -> str:
        """Interpret A/B test results"""
        
        if p_value >= 0.05:
            return "❌ No significant difference detected between treatment and control groups."
        
        if effect_size < 0.2:
            return f"✓ Small but significant effect: {lift_pct:.1f}% lift (effect size: {effect_size:.2f})"
        elif effect_size < 0.5:
            return f"✅ Medium effect: {lift_pct:.1f}% lift (effect size: {effect_size:.2f})"
        else:
            return f"✅ Large effect: {lift_pct:.1f}% lift (effect size: {effect_size:.2f})"


if __name__ == "__main__":
    # Example usage
    
    # Generate sample data
    np.random.seed(42)
    
    # Pre-promotion period (4 weeks)
    pre_dates = pd.date_range('2024-01-01', periods=28, freq='D')
    pre_sales = np.random.normal(1000, 100, 28)
    
    # Promotion period (2 weeks) with 20% lift
    post_dates = pd.date_range('2024-01-29', periods=14, freq='D')
    post_sales = np.random.normal(1200, 100, 14)
    
    # Combine data
    df = pd.DataFrame({
        'date': list(pre_dates) + list(post_dates),
        'sales_volume': list(pre_sales) + list(post_sales),
        'price': 15.99,
        'promotion_cost': [0]*28 + [5000/14]*14  # R5000 total cost
    })
    
    # Initialize analyzer
    config = {
        'experiment_name': 'promotion-lift-test',
        'margin_percentage': 0.3,
        'prior_level_sd': 0.01,
        'niter': 1000
    }
    analyzer = PromotionLiftAnalyzer(config)
    
    # Analyze promotion
    result = analyzer.analyze_promotion(
        promotion_id='promo-001',
        sales_data=df,
        pre_period=(pre_dates[0], pre_dates[-1]),
        post_period=(post_dates[0], post_dates[-1])
    )
    
    print(f"\nPromotion Lift Analysis:")
    print(f"Incremental Lift: {result['incremental_lift']['percentage']:.1f}%")
    print(f"P-value: {result['statistics']['p_value']:.4f}")
    print(f"Significant: {result['statistics']['is_significant']}")
    print(f"ROI: {result['roi']['roi_percentage']:.1f}%")
    print(f"Recommendation: {result['recommendation']}")
