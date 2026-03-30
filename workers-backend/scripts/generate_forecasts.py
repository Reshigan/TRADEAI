#!/usr/bin/env python3
"""
Generate ML/AI forecast data for Methodist demo company based on seeded historical data.
Inserts forecast records, predictions, and scenario results directly into D1.
"""
import random
import json
from datetime import datetime

random.seed(42)

COMPANY_ID = "comp-methodist-001"
YEAR = 2026

# Monthly seasonality from seed data
SEASONALITY = {
    1: 0.85, 2: 0.90, 3: 1.05, 4: 1.15, 5: 1.10, 6: 1.20,
    7: 1.15, 8: 0.95, 9: 1.00, 10: 1.05, 11: 1.10, 12: 1.25,
}

CUSTOMERS = [
    ("cust-meth-001", "Shoprite Holdings", 0.22),
    ("cust-meth-002", "Pick n Pay", 0.18),
    ("cust-meth-003", "Woolworths", 0.12),
    ("cust-meth-004", "Spar Group", 0.11),
    ("cust-meth-005", "Checkers", 0.10),
    ("cust-meth-006", "Makro", 0.08),
    ("cust-meth-007", "Cambridge Food", 0.05),
    ("cust-meth-008", "Boxer", 0.05),
    ("cust-meth-009", "Food Lovers Market", 0.05),
    ("cust-meth-010", "Game", 0.04),
]

PRODUCTS = [
    ("prod-meth-001", "Methodist Premium Coffee 250g", "Beverages", 45.99),
    ("prod-meth-002", "Methodist Instant Coffee 200g", "Beverages", 32.99),
    ("prod-meth-003", "Methodist Rooibos Tea 80s", "Beverages", 28.99),
    ("prod-meth-004", "Methodist Green Tea 40s", "Beverages", 35.99),
    ("prod-meth-005", "Methodist Hot Chocolate 500g", "Beverages", 52.99),
    ("prod-meth-006", "Methodist Digestive Biscuits 200g", "Snacks", 24.99),
    ("prod-meth-007", "Methodist Rusks 500g", "Snacks", 42.99),
    ("prod-meth-008", "Methodist Granola Cereal 450g", "Breakfast", 48.99),
    ("prod-meth-009", "Methodist Oats 1kg", "Breakfast", 38.99),
    ("prod-meth-010", "Methodist Muesli 500g", "Breakfast", 62.99),
]

ANNUAL_REVENUE = 52000000

def esc(s):
    return str(s).replace("'", "''")

def sql_val(v):
    if v is None:
        return "NULL"
    return f"'{esc(v)}'"

lines = []
lines.append("-- ============================================================================")
lines.append("-- ML/AI FORECAST DATA FOR METHODIST DEMO COMPANY")
lines.append("-- Generated forecast predictions, scenarios, and analytics")
lines.append("-- ============================================================================")
lines.append("")

# ============================================================================
# 1. REVENUE FORECASTS (monthly for next 12 months - 2027)
# ============================================================================
lines.append("-- REVENUE FORECASTS (ML-generated for 2027)")

fc_counter = 200
forecast_types = [
    ("Revenue Forecast 2027 - ML Ensemble", "revenue", "ml_predicted", 2027, 0.92),
    ("Revenue Forecast 2027 - Growth Rate", "revenue", "growth_rate", 2027, 0.85),
    ("Revenue Forecast 2027 - Weighted MA", "revenue", "weighted_moving_average", 2027, 0.88),
    ("Demand Forecast Q1 2027", "demand", "ml_predicted", 2027, 0.90),
    ("Demand Forecast Q2 2027", "demand", "ml_predicted", 2027, 0.87),
    ("Demand Forecast Q3 2027", "demand", "weighted_moving_average", 2027, 0.84),
    ("Demand Forecast Q4 2027", "demand", "ml_predicted", 2027, 0.91),
    ("Budget Forecast 2027", "budget", "historical", 2027, 0.89),
    ("Volume Forecast 2027 - All Products", "volume", "ml_predicted", 2027, 0.86),
    ("Volume Forecast 2027 - Premium Line", "volume", "weighted_moving_average", 2027, 0.83),
]

for name, ftype, method, fyear, confidence in forecast_types:
    fc_counter += 1
    fid = f"forecast-meth-{fc_counter:03d}"
    
    base_value = ANNUAL_REVENUE * random.uniform(0.95, 1.05)
    growth = random.uniform(0.03, 0.12)
    total_forecast = round(base_value * (1 + growth), 2)
    
    # For completed months, add actual data
    total_actual = round(total_forecast * random.uniform(0.88, 1.08), 2) if fc_counter <= 205 else None
    variance = round(total_actual - total_forecast, 2) if total_actual else None
    variance_pct = round((variance / total_forecast) * 100, 2) if variance else None
    
    # Monthly breakdown in data JSON
    monthly_data = {}
    for m in range(1, 13):
        month_forecast = round(total_forecast / 12 * SEASONALITY[m], 2)
        month_actual = round(month_forecast * random.uniform(0.9, 1.1), 2) if m <= 3 else None
        monthly_data[f"month_{m}"] = {
            "forecast": month_forecast,
            "actual": month_actual,
            "variance": round(month_actual - month_forecast, 2) if month_actual else None,
            "confidence": round(confidence - (0.01 * m), 2)
        }
    
    data_json = json.dumps({
        "baseValue": round(base_value, 2),
        "growthRate": round(growth, 4),
        "generatedAt": f"{YEAR}-03-30T12:00:00Z",
        "model": method,
        "monthlyBreakdown": monthly_data,
        "assumptions": [
            "Based on 12 months historical sales data",
            f"Growth rate: {round(growth*100, 1)}%",
            f"Seasonality factors applied",
            f"Confidence level: {confidence}"
        ],
        "features": ["seasonality", "trend", "customer_mix", "promotion_impact"],
        "trainingDataPoints": random.randint(1500, 3000),
        "mape": round(random.uniform(4.5, 12.0), 2),
        "rmse": round(random.uniform(50000, 200000), 2)
    })
    
    actual_str = str(total_actual) if total_actual else "NULL"
    var_str = str(variance) if variance else "NULL"
    var_pct_str = str(variance_pct) if variance_pct else "NULL"
    
    lines.append(
        f"INSERT OR IGNORE INTO forecasts (id, company_id, name, forecast_type, status, period_type, "
        f"base_year, forecast_year, total_forecast, total_actual, variance, variance_percent, "
        f"method, confidence_level, created_by, data, created_at, updated_at) "
        f"VALUES ({sql_val(fid)}, {sql_val(COMPANY_ID)}, {sql_val(name)}, {sql_val(ftype)}, "
        f"'active', 'monthly', {YEAR}, {fyear}, {total_forecast}, {actual_str}, {var_str}, {var_pct_str}, "
        f"{sql_val(method)}, {confidence}, 'user-meth-analyst-001', {sql_val(data_json)}, "
        f"'{YEAR}-03-15 12:00:00', '{YEAR}-03-30 12:00:00');"
    )

lines.append("")

# ============================================================================
# 2. PREDICTIONS (ML model outputs per customer/product)
# ============================================================================
lines.append("-- PREDICTIONS (ML model outputs)")

pred_counter = 100
for ci, (cust_id, cust_name, weight) in enumerate(CUSTOMERS):
    for pi, (prod_id, prod_name, category, price) in enumerate(PRODUCTS):
        pred_counter += 1
        pid = f"pred-meth-{pred_counter:04d}"
        
        base_volume = int(2000 * weight * random.uniform(0.7, 1.3))
        predicted_revenue = round(base_volume * price * 1.05, 2)
        predicted_volume = int(base_volume * 1.05)
        confidence = round(random.uniform(0.75, 0.95), 2)
        
        pred_data = json.dumps({
            "model": "ensemble_v2",
            "features": {
                "seasonality": round(random.uniform(0.8, 1.2), 2),
                "trend": round(random.uniform(0.98, 1.08), 2),
                "promotion_lift": round(random.uniform(1.0, 1.35), 2),
                "price_elasticity": round(random.uniform(-1.5, -0.5), 2),
                "customer_loyalty": round(random.uniform(0.6, 0.95), 2)
            },
            "next_6_months": [
                {"month": m, "volume": int(predicted_volume / 12 * SEASONALITY.get(m, 1.0)), 
                 "revenue": round(predicted_revenue / 12 * SEASONALITY.get(m, 1.0), 2)}
                for m in range(4, 10)
            ]
        })
        
        lines.append(
            f"INSERT OR IGNORE INTO predictions (id, company_id, prediction_type, model_name, model_version, "
            f"status, confidence_score, customer_id, product_id, predicted_value, actual_value, "
            f"prediction_date, horizon_months, data, created_at, updated_at) "
            f"VALUES ({sql_val(pid)}, {sql_val(COMPANY_ID)}, 'revenue', 'ensemble_v2', '2.1.0', "
            f"'active', {confidence}, {sql_val(cust_id)}, {sql_val(prod_id)}, {predicted_revenue}, "
            f"NULL, '{YEAR}-03-30', 6, {sql_val(pred_data)}, "
            f"'{YEAR}-03-30 12:00:00', '{YEAR}-03-30 12:00:00');"
        )

lines.append("")

# ============================================================================
# 3. SCENARIO RESULTS (what-if analysis outcomes)
# ============================================================================
lines.append("-- SCENARIO RESULTS (ML-driven what-if analysis)")

sr_counter = 200
scenarios = [
    ("scenario-meth-101", "10% Price Increase Impact"),
    ("scenario-meth-102", "New Product Launch"),
    ("scenario-meth-103", "Competitor Entry Response"),
    ("scenario-meth-104", "Recession Preparedness"),
    ("scenario-meth-105", "Aggressive Growth"),
    ("scenario-meth-106", "Supply Chain Disruption"),
]

for scen_id, scen_name in scenarios:
    for ci, (cust_id, cust_name, weight) in enumerate(CUSTOMERS[:5]):
        sr_counter += 1
        srid = f"sr-meth-{sr_counter:03d}"
        
        base_revenue = round(ANNUAL_REVENUE * weight, 2)
        impact_pct = round(random.uniform(-15, 25), 2)
        projected = round(base_revenue * (1 + impact_pct / 100), 2)
        
        result_data = json.dumps({
            "customer": cust_name,
            "baseRevenue": base_revenue,
            "projectedRevenue": projected,
            "impactPercent": impact_pct,
            "riskScore": round(random.uniform(0.1, 0.9), 2),
            "recommendations": [
                f"Adjust pricing strategy for {cust_name}",
                f"Review trade spend allocation",
                f"Monitor competitive response"
            ]
        })
        
        lines.append(
            f"INSERT OR IGNORE INTO scenario_results (id, scenario_id, company_id, metric_name, "
            f"base_value, projected_value, impact_percent, data, created_at) "
            f"VALUES ({sql_val(srid)}, {sql_val(scen_id)}, {sql_val(COMPANY_ID)}, "
            f"'revenue_impact_{cust_name.lower().replace(' ', '_')}', "
            f"{base_revenue}, {projected}, {impact_pct}, {sql_val(result_data)}, "
            f"'{YEAR}-03-30 12:00:00');"
        )

lines.append("")

# ============================================================================
# 4. DEMAND SIGNALS (AI-enriched with predictions)
# ============================================================================
lines.append("-- DEMAND SIGNALS (AI-enriched predictions for Q2-Q4 2026)")

ds_counter = 2000
for month in range(4, 13):  # April to December (future predictions)
    season = SEASONALITY[month]
    for ci in range(len(CUSTOMERS)):
        for week in range(4):
            ds_counter += 1
            dsid = f"ds-meth-{ds_counter:05d}"
            
            cust_id = CUSTOMERS[ci][0]
            weight = CUSTOMERS[ci][2]
            
            base_volume = int(500 * weight * season * random.uniform(0.7, 1.3))
            predicted_volume = int(base_volume * random.uniform(1.02, 1.15))
            confidence = round(random.uniform(0.70, 0.95) - (0.02 * (month - 4)), 2)
            
            signal_data = json.dumps({
                "type": "ml_prediction",
                "model": "demand_forecast_v3",
                "features": ["pos_data", "weather", "events", "seasonality"],
                "predicted_volume": predicted_volume,
                "confidence": confidence,
                "anomaly_score": round(random.uniform(0, 0.3), 2)
            })
            
            week_start = min(28, 1 + week * 7)
            
            lines.append(
                f"INSERT OR IGNORE INTO demand_signals (id, company_id, customer_id, signal_type, "
                f"signal_value, confidence, source, period_start, period_end, data, created_at, updated_at) "
                f"VALUES ({sql_val(dsid)}, {sql_val(COMPANY_ID)}, {sql_val(cust_id)}, "
                f"'ml_forecast', {predicted_volume}, {confidence}, 'ai_engine', "
                f"'{YEAR}-{month:02d}-{week_start:02d}', '{YEAR}-{month:02d}-{min(28, week_start+6):02d}', "
                f"{sql_val(signal_data)}, '{YEAR}-03-30 12:00:00', '{YEAR}-03-30 12:00:00');"
            )

lines.append("")

# ============================================================================
# 5. PREDICTIVE MODELS (model registry)
# ============================================================================
lines.append("-- PREDICTIVE MODELS (model registry)")

models = [
    ("model-meth-001", "Revenue Ensemble v2.1", "ensemble", "revenue_prediction", 0.92, 5.8, 2800),
    ("model-meth-002", "Demand Forecast LSTM", "deep_learning", "demand_forecasting", 0.89, 7.2, 3200),
    ("model-meth-003", "Promotion ROI Predictor", "gradient_boosting", "promotion_optimization", 0.87, 8.1, 1500),
    ("model-meth-004", "Customer Churn Risk", "random_forest", "churn_prediction", 0.91, 4.5, 2100),
    ("model-meth-005", "Price Elasticity Model", "linear_regression", "pricing", 0.85, 9.3, 1200),
    ("model-meth-006", "Anomaly Detector", "isolation_forest", "anomaly_detection", 0.94, 3.2, 4500),
    ("model-meth-007", "Basket Analysis Engine", "association_rules", "cross_sell", 0.82, 11.5, 8000),
    ("model-meth-008", "Seasonal Decomposition", "stl_decomposition", "seasonality", 0.93, 4.1, 2400),
]

for mid, mname, mtype, purpose, accuracy, mape, training_samples in models:
    model_data = json.dumps({
        "hyperparameters": {
            "learning_rate": 0.01,
            "n_estimators": random.randint(100, 500),
            "max_depth": random.randint(5, 15),
            "min_samples_split": random.randint(2, 10)
        },
        "trainingMetrics": {
            "accuracy": accuracy,
            "mape": mape,
            "rmse": round(random.uniform(10000, 100000), 2),
            "r_squared": round(accuracy - random.uniform(0.02, 0.08), 2),
            "training_samples": training_samples,
            "validation_split": 0.2,
            "cross_validation_folds": 5
        },
        "featureImportance": {
            "seasonality": round(random.uniform(0.15, 0.30), 2),
            "trend": round(random.uniform(0.10, 0.25), 2),
            "promotion_flag": round(random.uniform(0.08, 0.20), 2),
            "price": round(random.uniform(0.05, 0.15), 2),
            "customer_segment": round(random.uniform(0.05, 0.12), 2),
            "day_of_week": round(random.uniform(0.02, 0.08), 2)
        },
        "lastTrainedAt": f"{YEAR}-03-28T08:00:00Z",
        "nextRetrainAt": f"{YEAR}-04-28T08:00:00Z"
    })
    
    lines.append(
        f"INSERT OR IGNORE INTO predictive_models (id, company_id, name, model_type, purpose, "
        f"status, accuracy, version, data, created_by, created_at, updated_at) "
        f"VALUES ({sql_val(mid)}, {sql_val(COMPANY_ID)}, {sql_val(mname)}, {sql_val(mtype)}, "
        f"{sql_val(purpose)}, 'active', {accuracy}, '2.1.0', {sql_val(model_data)}, "
        f"'user-meth-analyst-001', '{YEAR}-01-15 12:00:00', '{YEAR}-03-28 12:00:00');"
    )

lines.append("")

# ============================================================================
# 6. PROMOTION OPTIMIZATIONS (AI recommendations)
# ============================================================================
lines.append("-- PROMOTION OPTIMIZATIONS (AI-driven recommendations)")

po_counter = 100
for ci, (cust_id, cust_name, weight) in enumerate(CUSTOMERS):
    po_counter += 1
    poid = f"promo-opt-meth-{po_counter:03d}"
    
    current_roi = round(random.uniform(1.5, 3.5), 2)
    optimized_roi = round(current_roi * random.uniform(1.15, 1.45), 2)
    current_spend = round(ANNUAL_REVENUE * weight * 0.08, 2)
    optimized_spend = round(current_spend * random.uniform(0.85, 1.1), 2)
    
    opt_data = json.dumps({
        "customer": cust_name,
        "currentROI": current_roi,
        "optimizedROI": optimized_roi,
        "roiImprovement": round((optimized_roi - current_roi) / current_roi * 100, 1),
        "currentSpend": current_spend,
        "recommendedSpend": optimized_spend,
        "spendChange": round((optimized_spend - current_spend) / current_spend * 100, 1),
        "recommendations": [
            {"type": "shift_budget", "from": "listing_fee", "to": "promotional", "amount": round(current_spend * 0.1, 2)},
            {"type": "timing", "suggestion": f"Increase spend in months with seasonality > 1.1"},
            {"type": "product_mix", "suggestion": f"Focus on premium products for {cust_name}"}
        ],
        "confidenceScore": round(random.uniform(0.78, 0.94), 2)
    })
    
    lines.append(
        f"INSERT OR IGNORE INTO promotion_optimizations (id, company_id, name, status, "
        f"optimization_type, customer_id, current_roi, projected_roi, data, "
        f"created_by, created_at, updated_at) "
        f"VALUES ({sql_val(poid)}, {sql_val(COMPANY_ID)}, "
        f"{sql_val(f'AI Optimization - {cust_name}')}, 'recommended', 'roi_maximization', "
        f"{sql_val(cust_id)}, {current_roi}, {optimized_roi}, {sql_val(opt_data)}, "
        f"'user-meth-analyst-001', '{YEAR}-03-30 12:00:00', '{YEAR}-03-30 12:00:00');"
    )

lines.append("")

# ============================================================================
# 7. SIMULATION RESULTS
# ============================================================================
lines.append("-- SIMULATIONS (Monte Carlo and what-if)")

sim_counter = 100
sim_defs = [
    ("Price Sensitivity Analysis - Coffee Range", "price_sensitivity", "completed"),
    ("Trade Spend Optimization - Shoprite", "spend_optimization", "completed"),
    ("New Market Entry - Eastern Cape", "market_expansion", "completed"),
    ("Promotion Calendar Optimization 2027", "calendar_optimization", "running"),
    ("Supply Chain Risk Assessment", "risk_assessment", "completed"),
]

for sim_name, sim_type, status in sim_defs:
    sim_counter += 1
    sid = f"sim-meth-{sim_counter:03d}"
    
    iterations = random.randint(5000, 50000)
    sim_data = json.dumps({
        "type": sim_type,
        "iterations": iterations,
        "convergence": round(random.uniform(0.001, 0.01), 4),
        "results": {
            "mean": round(random.uniform(48000000, 58000000), 2),
            "median": round(random.uniform(48000000, 58000000), 2),
            "std_dev": round(random.uniform(2000000, 5000000), 2),
            "p5": round(random.uniform(42000000, 46000000), 2),
            "p25": round(random.uniform(46000000, 50000000), 2),
            "p75": round(random.uniform(54000000, 58000000), 2),
            "p95": round(random.uniform(58000000, 65000000), 2)
        },
        "keyInsights": [
            f"Revenue most sensitive to pricing in premium segment",
            f"Trade spend ROI peaks at 8-10% of revenue",
            f"Seasonality accounts for 35% of variance"
        ]
    })
    
    lines.append(
        f"INSERT OR IGNORE INTO simulations (id, company_id, name, simulation_type, status, "
        f"iterations, data, created_by, created_at, updated_at) "
        f"VALUES ({sql_val(sid)}, {sql_val(COMPANY_ID)}, {sql_val(sim_name)}, {sql_val(sim_type)}, "
        f"{sql_val(status)}, {iterations}, {sql_val(sim_data)}, "
        f"'user-meth-analyst-001', '{YEAR}-03-25 12:00:00', '{YEAR}-03-30 12:00:00');"
    )

lines.append("")

# ============================================================================
# 8. UPDATE EXISTING FORECASTS WITH ACTUALS
# ============================================================================
lines.append("-- UPDATE existing forecasts with actual data from seeded sales")

# Update the existing forecast records with calculated actuals based on sales_history
for fid_num in range(101, 114):
    fid = f"forecast-meth-{fid_num:03d}"
    actual = round(ANNUAL_REVENUE * random.uniform(0.22, 0.28), 2)
    forecast_val = round(actual * random.uniform(0.92, 1.08), 2)
    variance = round(actual - forecast_val, 2)
    var_pct = round((variance / forecast_val) * 100, 2) if forecast_val else 0
    
    lines.append(
        f"UPDATE forecasts SET total_actual = {actual}, variance = {variance}, "
        f"variance_percent = {var_pct}, status = 'active', "
        f"updated_at = '{YEAR}-03-30 12:00:00' "
        f"WHERE id = {sql_val(fid)} AND company_id = {sql_val(COMPANY_ID)};"
    )

lines.append("")

# ============================================================================
# FOOTER
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- ML/AI FORECAST GENERATION COMPLETE")
lines.append("-- ============================================================================")

# Write to file
output_path = "/home/ubuntu/repos/TRADEAI/workers-backend/migrations/0072_seed_methodist_forecasts.sql"
with open(output_path, "w") as f:
    f.write("\n".join(lines))

total_inserts = sum(1 for l in lines if l.startswith("INSERT") or l.startswith("UPDATE"))
print(f"Generated {total_inserts} statements (INSERT + UPDATE)")
print(f"Written to {output_path}")
print(f"File size: {len(chr(10).join(lines)) / 1024:.1f} KB")
