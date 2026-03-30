#!/usr/bin/env python3
import random, json, os

random.seed(42)
CID = 'comp-methodist-001'
Y = 2026
S = {1:0.85,2:0.90,3:1.05,4:1.15,5:1.10,6:1.20,7:1.15,8:0.95,9:1.00,10:1.05,11:1.10,12:1.25}
CS = [('cust-meth-001','Shoprite Holdings',0.22),('cust-meth-002','Pick n Pay',0.18),('cust-meth-003','Woolworths',0.12),('cust-meth-004','Spar Group',0.11),('cust-meth-005','Checkers',0.10),('cust-meth-006','Makro',0.08),('cust-meth-007','Cambridge Food',0.05),('cust-meth-008','Boxer',0.05),('cust-meth-009','Food Lovers Market',0.05),('cust-meth-010','Game',0.04)]
PS = [('prod-meth-001','Methodist Premium Coffee 250g','Beverages',45.99),('prod-meth-002','Methodist Instant Coffee 200g','Beverages',32.99),('prod-meth-003','Methodist Rooibos Tea 80s','Beverages',28.99),('prod-meth-004','Methodist Green Tea 40s','Beverages',35.99),('prod-meth-005','Methodist Hot Chocolate 500g','Beverages',52.99),('prod-meth-006','Methodist Digestive Biscuits 200g','Snacks',24.99),('prod-meth-007','Methodist Rusks 500g','Snacks',42.99),('prod-meth-008','Methodist Granola Cereal 450g','Breakfast',48.99),('prod-meth-009','Methodist Oats 1kg','Breakfast',38.99),('prod-meth-010','Methodist Muesli 500g','Breakfast',62.99)]
AR = 52000000
Q = chr(39)
def e(s): return str(s).replace(Q, Q+Q)
def q(v):
    if v is None: return 'NULL'
    return Q+e(v)+Q

L = []
L.append('-- ML/AI FORECAST DATA FOR METHODIST DEMO COMPANY')
L.append('-- All columns verified against live D1 schema')
L.append('')

# 1. FORECASTS
L.append('-- FORECASTS')
fc = 200
ftypes = [('Revenue Forecast 2027 - ML Ensemble','revenue','ml_predicted',2027,0.92),('Revenue Forecast 2027 - Growth Rate','revenue','growth_rate',2027,0.85),('Revenue Forecast 2027 - Weighted MA','revenue','weighted_moving_average',2027,0.88),('Demand Forecast Q1 2027','demand','ml_predicted',2027,0.90),('Demand Forecast Q2 2027','demand','ml_predicted',2027,0.87),('Demand Forecast Q3 2027','demand','weighted_moving_average',2027,0.84),('Demand Forecast Q4 2027','demand','ml_predicted',2027,0.91),('Budget Forecast 2027','budget','historical',2027,0.89),('Volume Forecast 2027 - All Products','volume','ml_predicted',2027,0.86),('Volume Forecast 2027 - Premium Line','volume','weighted_moving_average',2027,0.83)]
for name,ft,method,fy,conf in ftypes:
    fc+=1; fid=f'forecast-meth-{fc:03d}'
    bv=AR*random.uniform(0.95,1.05); g=random.uniform(0.03,0.12); tf=round(bv*(1+g),2)
    ta=round(tf*random.uniform(0.88,1.08),2) if fc<=205 else None
    v=round(ta-tf,2) if ta else None; vp=round((v/tf)*100,2) if v else None
    md={}
    for m in range(1,13):
        mf=round(tf/12*S[m],2); ma=round(mf*random.uniform(0.9,1.1),2) if m<=3 else None
        md[f'month_{m}']={'f':mf,'a':ma}
    dj=json.dumps({'bv':round(bv,2),'gr':round(g,4),'mb':md,'mape':round(random.uniform(4.5,12.0),2)})
    tas=str(ta) if ta else 'NULL'; vs=str(v) if v else 'NULL'; vps=str(vp) if vp else 'NULL'
    L.append(f"INSERT OR IGNORE INTO forecasts (id,company_id,name,forecast_type,status,period_type,base_year,forecast_year,total_forecast,total_actual,variance,variance_percent,method,confidence_level,created_by,data,created_at,updated_at) VALUES ({q(fid)},{q(CID)},{q(name)},{q(ft)},'active','monthly',{Y},{fy},{tf},{tas},{vs},{vps},{q(method)},{conf},'user-meth-analyst-001',{q(dj)},'{Y}-03-15 12:00:00','{Y}-03-30 12:00:00');")
L.append('')

# 2. PREDICTIONS - correct schema: model_id, entity_type, entity_id, entity_name, period, period_start, period_end, predicted_value, confidence_low, confidence_high, confidence_pct, factors, trend_direction, trend_strength, seasonality_index, status, data
L.append('-- PREDICTIONS')
pc=100
for ci,(cid,cn,w) in enumerate(CS):
    for pi,(pid2,pn,cat,price) in enumerate(PS):
        pc+=1; pid3=f'pred-meth-{pc:04d}'
        bvol=int(2000*w*random.uniform(0.7,1.3)); prev=round(bvol*price*1.05,2)
        cpct=round(random.uniform(0.75,0.95),2); cl=round(prev*0.85,2); ch=round(prev*1.15,2)
        td=random.choice(['up','stable','down']); ts2=round(random.uniform(0.3,0.9),2); si=round(random.uniform(0.8,1.2),2)
        fj=json.dumps({'seasonality':round(random.uniform(0.8,1.2),2),'trend':round(random.uniform(0.98,1.08),2),'promo_lift':round(random.uniform(1.0,1.35),2)})
        pd2=json.dumps({'model':'ensemble_v2','n6m':[{'m':m,'v':int(bvol/12*S.get(m,1.0))} for m in range(4,10)]})
        en=cn+' - '+pn
        L.append(f"INSERT OR IGNORE INTO predictions (id,company_id,model_id,prediction_type,entity_type,entity_id,entity_name,period,period_start,period_end,predicted_value,confidence_low,confidence_high,confidence_pct,factors,trend_direction,trend_strength,seasonality_index,status,data,created_at,updated_at) VALUES ({q(pid3)},{q(CID)},'model-meth-001','revenue','customer_product',{q(cid)},{q(en)},'2027-Q1','2027-01-01','2027-03-31',{prev},{cl},{ch},{cpct},{q(fj)},{q(td)},{ts2},{si},'active',{q(pd2)},'{Y}-03-30 12:00:00','{Y}-03-30 12:00:00');")
L.append('')

# 3. DEMAND SIGNALS - correct schema: source_id, source_name, signal_type, signal_date, period_start, period_end, granularity, customer_id, customer_name, units_sold, revenue, volume, confidence, trend_direction, data
L.append('-- DEMAND SIGNALS')
dc=2000
for month in range(4,13):
    sea=S[month]
    for ci in range(len(CS)):
        for week in range(4):
            dc+=1; did=f'ds-meth-{dc:05d}'
            cid2=CS[ci][0]; cn2=CS[ci][1]; w2=CS[ci][2]
            bv2=int(500*w2*sea*random.uniform(0.7,1.3)); pv2=int(bv2*random.uniform(1.02,1.15))
            pr2=round(pv2*38.50,2); co=round(random.uniform(0.70,0.95)-(0.02*(month-4)),2)
            tr=random.choice(['up','stable','up'])
            sd2=json.dumps({'type':'ml_prediction','model':'demand_forecast_v3'})
            ws=min(28,1+week*7); we=min(28,ws+6)
            L.append(f"INSERT OR IGNORE INTO demand_signals (id,company_id,source_id,source_name,signal_type,signal_date,period_start,period_end,granularity,customer_id,customer_name,units_sold,revenue,volume,confidence,trend_direction,data,created_at,updated_at) VALUES ({q(did)},{q(CID)},'ai-engine-001','AI Demand Engine','ml_forecast','{Y}-{month:02d}-{ws:02d}','{Y}-{month:02d}-{ws:02d}','{Y}-{month:02d}-{we:02d}','weekly',{q(cid2)},{q(cn2)},{pv2},{pr2},{pv2},{co},{q(tr)},{q(sd2)},'{Y}-03-30 12:00:00','{Y}-03-30 12:00:00');")
L.append('')

# 4. PREDICTIVE MODELS - correct schema: name, description, model_type, target_metric, status, algorithm, features, hyperparameters, training_data_start, training_data_end, training_records, accuracy, mae, rmse, r_squared, mape, confidence_level, last_trained_at, last_predicted_at, version, created_by, data
L.append('-- PREDICTIVE MODELS')
models=[('model-meth-001','Revenue Ensemble v2.1','ensemble','revenue','gradient_boosting',0.92,5.8,2800),('model-meth-002','Demand Forecast LSTM','deep_learning','demand','lstm',0.89,7.2,3200),('model-meth-003','Promotion ROI Predictor','gradient_boosting','roi','xgboost',0.87,8.1,1500),('model-meth-004','Customer Churn Risk','classification','churn','random_forest',0.91,4.5,2100),('model-meth-005','Price Elasticity Model','regression','price_elasticity','linear_regression',0.85,9.3,1200),('model-meth-006','Anomaly Detector','anomaly_detection','anomaly','isolation_forest',0.94,3.2,4500),('model-meth-007','Basket Analysis Engine','association','cross_sell','apriori',0.82,11.5,8000),('model-meth-008','Seasonal Decomposition','time_series','seasonality','stl',0.93,4.1,2400)]
for mid,mn,mt,tgt,alg,acc,mape,ts in models:
    fj2=json.dumps(['seasonality','trend','promotion_flag','price','customer_segment'])
    hj=json.dumps({'lr':0.01,'ne':random.randint(100,500),'md':random.randint(5,15)})
    md2=json.dumps({'fi':{'s':round(random.uniform(0.15,0.30),2),'t':round(random.uniform(0.10,0.25),2)}})
    rmse=round(random.uniform(10000,100000),2); mae=round(rmse*0.7,2); rsq=round(acc-random.uniform(0.02,0.08),2)
    L.append(f"INSERT OR IGNORE INTO predictive_models (id,company_id,name,description,model_type,target_metric,status,algorithm,features,hyperparameters,training_data_start,training_data_end,training_records,accuracy,mae,rmse,r_squared,mape,confidence_level,last_trained_at,last_predicted_at,version,created_by,data,created_at,updated_at) VALUES ({q(mid)},{q(CID)},{q(mn)},{q(mn+' - Methodist')},{q(mt)},{q(tgt)},'active',{q(alg)},{q(fj2)},{q(hj)},'2025-01-01','2026-03-28',{ts},{acc},{mae},{rmse},{rsq},{mape},{round(acc-0.05,2)},'2026-03-28 08:00:00','2026-03-30 12:00:00','2.1.0','user-meth-analyst-001',{q(md2)},'2026-01-15 12:00:00','2026-03-28 12:00:00');")
L.append('')

# 5. PROMOTION OPTIMIZATIONS - correct schema
L.append('-- PROMOTION OPTIMIZATIONS')
po=100
for ci,(cid3,cn3,w3) in enumerate(CS):
    po+=1; poid=f'promo-opt-meth-{po:03d}'
    br=round(AR*w3,2); bu=int(br/38.50)
    os2=round(br*0.08*random.uniform(0.85,1.1),2); or2=round(br*random.uniform(1.05,1.25),2)
    oroi=round(random.uniform(2.5,5.5),2); ol=round(random.uniform(8,25),2)
    imp=round(random.uniform(12,35),2); co2=round(random.uniform(0.78,0.94),2)
    od=json.dumps({'recs':[{'t':'shift_budget'},{'t':'timing'},{'t':'product_mix'}]})
    L.append(f"INSERT OR IGNORE INTO promotion_optimizations (id,company_id,name,description,optimization_type,status,objective,customer_id,customer_name,baseline_revenue,baseline_units,optimized_spend,optimized_revenue,optimized_roi,optimized_lift_pct,improvement_pct,confidence_score,model_version,run_count,created_by,data,created_at,updated_at) VALUES ({q(poid)},{q(CID)},{q('AI Optimization - '+cn3)},{q('ML optimization for '+cn3)},'roi_maximization','recommended','maximize_roi',{q(cid3)},{q(cn3)},{br},{bu},{os2},{or2},{oroi},{ol},{imp},{co2},'2.1.0',{random.randint(3,15)},'user-meth-analyst-001',{q(od)},'{Y}-03-30 12:00:00','{Y}-03-30 12:00:00');")
L.append('')

# 6. SIMULATIONS - correct schema
L.append('-- SIMULATIONS')
sc=100
sdefs=[('Price Sensitivity - Coffee','price_sensitivity','completed'),('Trade Spend Opt - Shoprite','spend_optimization','completed'),('New Market Entry - EC','market_expansion','completed'),('Promo Calendar Opt 2027','calendar_optimization','running'),('Supply Chain Risk','risk_assessment','completed')]
for sn,st,ss in sdefs:
    sc+=1; sid2=f'sim-meth-{sc:03d}'
    cj=json.dumps({'iterations':random.randint(5000,50000),'convergence':0.001})
    rj=json.dumps({'mean':round(random.uniform(48e6,58e6),2),'p5':round(random.uniform(42e6,46e6),2),'p95':round(random.uniform(58e6,65e6),2)})
    pj=json.dumps({'growth_rate':0.05,'seasonality':True})
    L.append(f"INSERT OR IGNORE INTO simulations (id,company_id,name,description,simulation_type,status,config,results,parameters,created_by,data,created_at,updated_at) VALUES ({q(sid2)},{q(CID)},{q(sn)},{q(sn+' for Methodist')},{q(st)},{q(ss)},{q(cj)},{q(rj)},{q(pj)},'user-meth-analyst-001',NULL,'{Y}-03-25 12:00:00','{Y}-03-30 12:00:00');")
L.append('')

# 7. SCENARIO RESULTS - correct schema
L.append('-- SCENARIO RESULTS')
sr=200
scenarios=[('scenario-meth-101','10pct Price Increase'),('scenario-meth-102','New Product Launch'),('scenario-meth-103','Competitor Entry'),('scenario-meth-104','Recession Preparedness'),('scenario-meth-105','Aggressive Growth'),('scenario-meth-106','Supply Chain Disruption')]
for scid,scnm in scenarios:
    for ci,(cid4,cn4,w4) in enumerate(CS[:5]):
        sr+=1; srid=f'sr-meth-{sr:03d}'
        bval=round(AR*w4,2); ipct=round(random.uniform(-15,25),2)
        mval=round(bval*(1+ipct/100),2); var=round(mval-bval,2)
        clow=round(mval*0.85,2); chigh=round(mval*1.15,2)
        cslug=cn4.lower().replace(' ','_').replace('&','and')
        rd=json.dumps({'customer':cn4,'scenario':scnm})
        L.append(f"INSERT OR IGNORE INTO scenario_results (id,company_id,scenario_id,result_type,period,metric_name,metric_value,baseline_value,variance,variance_pct,confidence_low,confidence_high,confidence_pct,sort_order,data,created_at,updated_at) VALUES ({q(srid)},{q(CID)},{q(scid)},'revenue_impact','2027',{q('revenue_'+cslug)},{mval},{bval},{var},{ipct},{clow},{chigh},0.85,{ci+1},{q(rd)},'{Y}-03-30 12:00:00','{Y}-03-30 12:00:00');")
L.append('')

# 8. UPDATE EXISTING FORECASTS
L.append('-- UPDATE existing forecasts with actuals')
for fn in range(101,114):
    fid2=f'forecast-meth-{fn:03d}'
    act=round(AR*random.uniform(0.22,0.28),2)
    fv=round(act*random.uniform(0.92,1.08),2)
    var2=round(act-fv,2); vpct=round((var2/fv)*100,2) if fv else 0
    L.append(f"UPDATE forecasts SET total_actual={act},variance={var2},variance_percent={vpct},status='active',updated_at='{Y}-03-30 12:00:00' WHERE id={q(fid2)} AND company_id={q(CID)};")

L.append('')
L.append('-- ML/AI FORECAST GENERATION COMPLETE')

op=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'migrations','0072_seed_methodist_forecasts.sql')
with open(op,'w') as f: f.write(chr(10).join(L))
total=sum(1 for l in L if l.startswith('INSERT') or l.startswith('UPDATE'))
print(f'Generated {total} statements')
print(f'Written to {op}')
print(f'Size: {os.path.getsize(op)/1024:.1f} KB')
