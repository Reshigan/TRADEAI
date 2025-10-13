#!/usr/bin/env python3
"""
TRADEAI v2.0 - Mondelez SA Demo Data Seeder
==========================================

This script creates a comprehensive Mondelez South Africa demo company
with 6 months of realistic data across all modules.

Demo Company: Mondelez South Africa
Industry: Food & Beverages
Products: Oreo, Cadbury, Halls, Trident, Toblerone, etc.
Customers: Pick n Pay, Shoprite, Woolworths, SPAR, etc.
Data Period: 6 months of historical data
"""

import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any
import uuid

class MondelezDemoSeeder:
    def __init__(self):
        self.demo_data = {
            "company": {
                "name": "Mondelez South Africa",
                "slug": "mondelez-sa",
                "description": "Leading snacking company in South Africa",
                "industry": "Food & Beverages",
                "country": "South Africa",
                "currency": "ZAR",
                "fiscal_year_start": "01-01",
                "timezone": "Africa/Johannesburg",
                "logo": "https://www.mondelezinternational.com/logo.png",
                "website": "https://www.mondelezinternational.com/za"
            },
            "users": [],
            "products": [],
            "customers": [],
            "budgets": [],
            "trade_spend": [],
            "promotions": [],
            "activities": [],
            "contracts": [],
            "reports": []
        }
        
        # Generate demo data
        self.generate_users()
        self.generate_products()
        self.generate_customers()
        self.generate_budgets()
        self.generate_trade_spend()
        self.generate_promotions()
        self.generate_activities()
        self.generate_contracts()

    def generate_users(self):
        """Generate demo users for different roles"""
        users = [
            {
                "id": str(uuid.uuid4()),
                "email": "admin@mondelez.co.za",
                "first_name": "Admin",
                "last_name": "User",
                "role": "admin",
                "department": "IT",
                "phone": "+27 11 123 4567",
                "is_active": True,
                "created_at": (datetime.now() - timedelta(days=180)).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "email": "sarah.johnson@mondelez.co.za",
                "first_name": "Sarah",
                "last_name": "Johnson",
                "role": "trade_marketing_manager",
                "department": "Trade Marketing",
                "phone": "+27 11 234 5678",
                "is_active": True,
                "created_at": (datetime.now() - timedelta(days=150)).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "email": "mike.williams@mondelez.co.za",
                "first_name": "Mike",
                "last_name": "Williams",
                "role": "sales_manager",
                "department": "Sales",
                "phone": "+27 11 345 6789",
                "is_active": True,
                "created_at": (datetime.now() - timedelta(days=120)).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "email": "lisa.brown@mondelez.co.za",
                "first_name": "Lisa",
                "last_name": "Brown",
                "role": "finance_analyst",
                "department": "Finance",
                "phone": "+27 11 456 7890",
                "is_active": True,
                "created_at": (datetime.now() - timedelta(days=100)).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "email": "demo@mondelez.co.za",
                "first_name": "Demo",
                "last_name": "User",
                "role": "viewer",
                "department": "Demo",
                "phone": "+27 11 567 8901",
                "is_active": True,
                "created_at": (datetime.now() - timedelta(days=1)).isoformat()
            }
        ]
        
        self.demo_data["users"] = users

    def generate_products(self):
        """Generate Mondelez product portfolio"""
        products = [
            {
                "id": str(uuid.uuid4()),
                "name": "Oreo Original Cookies",
                "sku": "ORE-001-ZA",
                "brand": "Oreo",
                "category": "Biscuits & Cookies",
                "subcategory": "Sandwich Cookies",
                "description": "The world's favorite cookie - chocolate sandwich cookies with cream filling",
                "price": 25.99,
                "cost": 15.60,
                "currency": "ZAR",
                "unit": "pack",
                "weight": "154g",
                "status": "active",
                "launch_date": "2020-01-15",
                "metadata": {
                    "barcode": "7622210951045",
                    "shelf_life": "12 months",
                    "storage": "Cool, dry place",
                    "allergens": ["Wheat", "Milk", "Soy"],
                    "nutritional_info": {
                        "calories_per_100g": 480,
                        "fat": "20g",
                        "sugar": "36g",
                        "protein": "5g"
                    }
                }
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Cadbury Dairy Milk Chocolate",
                "sku": "CDM-001-ZA",
                "brand": "Cadbury",
                "category": "Chocolate",
                "subcategory": "Milk Chocolate",
                "description": "Smooth and creamy milk chocolate bar",
                "price": 18.50,
                "cost": 11.10,
                "currency": "ZAR",
                "unit": "bar",
                "weight": "80g",
                "status": "active",
                "launch_date": "2018-03-01",
                "metadata": {
                    "barcode": "7622210123456",
                    "shelf_life": "18 months",
                    "storage": "Cool, dry place below 20°C",
                    "allergens": ["Milk", "Nuts"],
                    "nutritional_info": {
                        "calories_per_100g": 534,
                        "fat": "30g",
                        "sugar": "56g",
                        "protein": "7g"
                    }
                }
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Halls Menthol Drops",
                "sku": "HAL-001-ZA",
                "brand": "Halls",
                "category": "Confectionery",
                "subcategory": "Throat Lozenges",
                "description": "Soothing menthol throat drops",
                "price": 12.99,
                "cost": 7.80,
                "currency": "ZAR",
                "unit": "pack",
                "weight": "33.5g",
                "status": "active",
                "launch_date": "2019-06-01",
                "metadata": {
                    "barcode": "7622210234567",
                    "shelf_life": "24 months",
                    "storage": "Cool, dry place",
                    "allergens": [],
                    "active_ingredients": ["Menthol", "Eucalyptus Oil"]
                }
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Trident Sugar-Free Gum",
                "sku": "TRI-001-ZA",
                "brand": "Trident",
                "category": "Gum",
                "subcategory": "Sugar-Free Gum",
                "description": "Long-lasting sugar-free chewing gum",
                "price": 8.99,
                "cost": 5.40,
                "currency": "ZAR",
                "unit": "pack",
                "weight": "14g",
                "status": "active",
                "launch_date": "2021-02-15",
                "metadata": {
                    "barcode": "7622210345678",
                    "shelf_life": "18 months",
                    "storage": "Cool, dry place",
                    "allergens": ["Soy"],
                    "sugar_free": True,
                    "pieces_per_pack": 14
                }
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Toblerone Milk Chocolate",
                "sku": "TOB-001-ZA",
                "brand": "Toblerone",
                "category": "Chocolate",
                "subcategory": "Premium Chocolate",
                "description": "Swiss milk chocolate with honey and almond nougat",
                "price": 45.00,
                "cost": 27.00,
                "currency": "ZAR",
                "unit": "bar",
                "weight": "100g",
                "status": "active",
                "launch_date": "2017-11-01",
                "metadata": {
                    "barcode": "7622210456789",
                    "shelf_life": "15 months",
                    "storage": "Cool, dry place below 18°C",
                    "allergens": ["Milk", "Almonds", "Eggs", "Soy"],
                    "origin": "Switzerland",
                    "premium": True
                }
            },
            {
                "id": str(uuid.uuid4()),
                "name": "belVita Breakfast Biscuits",
                "sku": "BEL-001-ZA",
                "brand": "belVita",
                "category": "Biscuits & Cookies",
                "subcategory": "Breakfast Biscuits",
                "description": "Wholesome breakfast biscuits with 4-hour energy release",
                "price": 32.50,
                "cost": 19.50,
                "currency": "ZAR",
                "unit": "pack",
                "weight": "225g",
                "status": "active",
                "launch_date": "2020-09-01",
                "metadata": {
                    "barcode": "7622210567890",
                    "shelf_life": "12 months",
                    "storage": "Cool, dry place",
                    "allergens": ["Wheat", "Milk", "Soy"],
                    "whole_grains": True,
                    "energy_release": "4 hours"
                }
            }
        ]
        
        self.demo_data["products"] = products

    def generate_customers(self):
        """Generate South African retail customers"""
        customers = [
            {
                "id": str(uuid.uuid4()),
                "name": "Pick n Pay",
                "code": "PNP-001",
                "type": "Retail Chain",
                "tier": "Tier 1",
                "email": "procurement@pnp.co.za",
                "phone": "+27 21 658 1000",
                "website": "https://www.picknpay.co.za",
                "status": "active",
                "address": {
                    "street": "101 Rosmead Avenue",
                    "city": "Cape Town",
                    "province": "Western Cape",
                    "postal_code": "7700",
                    "country": "South Africa"
                },
                "contact_person": {
                    "name": "John Smith",
                    "title": "Category Manager",
                    "email": "john.smith@pnp.co.za",
                    "phone": "+27 21 658 1234"
                },
                "metadata": {
                    "stores_count": 1800,
                    "annual_revenue": "R95 billion",
                    "established": 1967,
                    "stock_exchange": "JSE",
                    "payment_terms": "30 days",
                    "credit_limit": 5000000.00
                }
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Shoprite Holdings",
                "code": "SHP-001",
                "type": "Retail Chain",
                "tier": "Tier 1",
                "email": "buying@shoprite.co.za",
                "phone": "+27 21 980 4000",
                "website": "https://www.shopriteholdings.co.za",
                "status": "active",
                "address": {
                    "street": "Cnr William Dabs & Lyn Road",
                    "city": "Cape Town",
                    "province": "Western Cape",
                    "postal_code": "7405",
                    "country": "South Africa"
                },
                "contact_person": {
                    "name": "Mary Johnson",
                    "title": "Senior Buyer",
                    "email": "mary.johnson@shoprite.co.za",
                    "phone": "+27 21 980 4567"
                },
                "metadata": {
                    "stores_count": 3000,
                    "annual_revenue": "R165 billion",
                    "established": 1979,
                    "stock_exchange": "JSE",
                    "payment_terms": "45 days",
                    "credit_limit": 8000000.00
                }
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Woolworths",
                "code": "WOL-001",
                "type": "Premium Retail",
                "tier": "Tier 1",
                "email": "suppliers@woolworths.co.za",
                "phone": "+27 21 407 9111",
                "website": "https://www.woolworths.co.za",
                "status": "active",
                "address": {
                    "street": "93 Longmarket Street",
                    "city": "Cape Town",
                    "province": "Western Cape",
                    "postal_code": "8001",
                    "country": "South Africa"
                },
                "contact_person": {
                    "name": "David Wilson",
                    "title": "Category Director",
                    "email": "david.wilson@woolworths.co.za",
                    "phone": "+27 21 407 9234"
                },
                "metadata": {
                    "stores_count": 400,
                    "annual_revenue": "R28 billion",
                    "established": 1931,
                    "stock_exchange": "JSE",
                    "payment_terms": "30 days",
                    "credit_limit": 3000000.00,
                    "premium_positioning": True
                }
            },
            {
                "id": str(uuid.uuid4()),
                "name": "SPAR Group",
                "code": "SPR-001",
                "type": "Retail Chain",
                "tier": "Tier 2",
                "email": "purchasing@spar.co.za",
                "phone": "+27 31 308 8000",
                "website": "https://www.spar.co.za",
                "status": "active",
                "address": {
                    "street": "22 Adcock Ingram Drive",
                    "city": "Durban",
                    "province": "KwaZulu-Natal",
                    "postal_code": "4001",
                    "country": "South Africa"
                },
                "contact_person": {
                    "name": "Sarah Brown",
                    "title": "Procurement Manager",
                    "email": "sarah.brown@spar.co.za",
                    "phone": "+27 31 308 8456"
                },
                "metadata": {
                    "stores_count": 900,
                    "annual_revenue": "R45 billion",
                    "established": 1963,
                    "payment_terms": "30 days",
                    "credit_limit": 2500000.00
                }
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Checkers",
                "code": "CHK-001",
                "type": "Retail Chain",
                "tier": "Tier 1",
                "email": "procurement@checkers.co.za",
                "phone": "+27 21 980 4000",
                "website": "https://www.checkers.co.za",
                "status": "active",
                "address": {
                    "street": "Cnr William Dabs & Lyn Road",
                    "city": "Cape Town",
                    "province": "Western Cape",
                    "postal_code": "7405",
                    "country": "South Africa"
                },
                "contact_person": {
                    "name": "Michael Davis",
                    "title": "Category Manager",
                    "email": "michael.davis@checkers.co.za",
                    "phone": "+27 21 980 4789"
                },
                "metadata": {
                    "stores_count": 240,
                    "parent_company": "Shoprite Holdings",
                    "annual_revenue": "R35 billion",
                    "payment_terms": "45 days",
                    "credit_limit": 4000000.00
                }
            }
        ]
        
        self.demo_data["customers"] = customers

    def generate_budgets(self):
        """Generate budget allocations"""
        current_year = datetime.now().year
        
        budgets = [
            {
                "id": str(uuid.uuid4()),
                "name": f"Q1 {current_year} Trade Marketing Budget",
                "description": "First quarter trade marketing and promotional activities",
                "total_amount": 2500000.00,
                "allocated_amount": 1875000.00,
                "spent_amount": 1654320.50,
                "remaining_amount": 845679.50,
                "currency": "ZAR",
                "period_start": f"{current_year}-01-01",
                "period_end": f"{current_year}-03-31",
                "status": "completed",
                "category": "Trade Marketing",
                "owner": "sarah.johnson@mondelez.co.za",
                "created_at": f"{current_year-1}-12-15T00:00:00Z",
                "metadata": {
                    "department": "Trade Marketing",
                    "approval_required": True,
                    "auto_rollover": False,
                    "kpi_targets": {
                        "roi_target": 3.2,
                        "volume_lift": "15%",
                        "market_share_growth": "2%"
                    }
                }
            },
            {
                "id": str(uuid.uuid4()),
                "name": f"Q2 {current_year} Trade Spend Budget",
                "description": "Second quarter trade spending allocation",
                "total_amount": 3200000.00,
                "allocated_amount": 2880000.00,
                "spent_amount": 2456780.25,
                "remaining_amount": 743219.75,
                "currency": "ZAR",
                "period_start": f"{current_year}-04-01",
                "period_end": f"{current_year}-06-30",
                "status": "completed",
                "category": "Trade Spend",
                "owner": "mike.williams@mondelez.co.za",
                "created_at": f"{current_year}-03-15T00:00:00Z",
                "metadata": {
                    "department": "Sales",
                    "approval_required": True,
                    "auto_rollover": False,
                    "focus_areas": ["In-store displays", "Price promotions", "New product launches"]
                }
            },
            {
                "id": str(uuid.uuid4()),
                "name": f"H2 {current_year} Promotional Budget",
                "description": "Second half promotional activities and campaigns",
                "total_amount": 4800000.00,
                "allocated_amount": 3600000.00,
                "spent_amount": 2145600.75,
                "remaining_amount": 2654399.25,
                "currency": "ZAR",
                "period_start": f"{current_year}-07-01",
                "period_end": f"{current_year}-12-31",
                "status": "active",
                "category": "Promotions",
                "owner": "sarah.johnson@mondelez.co.za",
                "created_at": f"{current_year}-06-15T00:00:00Z",
                "metadata": {
                    "department": "Trade Marketing",
                    "approval_required": True,
                    "auto_rollover": True,
                    "seasonal_focus": ["Back to school", "Festive season", "Summer holidays"]
                }
            }
        ]
        
        self.demo_data["budgets"] = budgets

    def generate_trade_spend(self):
        """Generate 6 months of trade spend data"""
        trade_spend_records = []
        start_date = datetime.now() - timedelta(days=180)
        
        # Generate 50 trade spend records over 6 months
        for i in range(50):
            spend_date = start_date + timedelta(days=random.randint(0, 180))
            customer = random.choice(self.demo_data["customers"])
            product = random.choice(self.demo_data["products"])
            
            # Generate realistic spend amounts based on customer tier
            if customer["tier"] == "Tier 1":
                base_amount = random.uniform(25000, 150000)
            else:
                base_amount = random.uniform(10000, 75000)
            
            record = {
                "id": str(uuid.uuid4()),
                "customer_id": customer["id"],
                "customer_name": customer["name"],
                "product_id": product["id"],
                "product_name": product["name"],
                "amount": round(base_amount, 2),
                "currency": "ZAR",
                "spend_date": spend_date.strftime("%Y-%m-%d"),
                "category": random.choice(["Promotional Allowance", "Display Fee", "Listing Fee", "Volume Rebate", "Marketing Support"]),
                "description": f"Trade spend for {product['name']} at {customer['name']} - {random.choice(['Q1 promotion', 'New listing', 'Volume incentive', 'Display support', 'Marketing campaign'])}",
                "status": random.choice(["approved", "completed", "pending"]),
                "approval_date": (spend_date + timedelta(days=random.randint(1, 7))).strftime("%Y-%m-%d") if random.random() > 0.3 else None,
                "created_by": random.choice(["sarah.johnson@mondelez.co.za", "mike.williams@mondelez.co.za"]),
                "created_at": spend_date.isoformat(),
                "metadata": {
                    "campaign_id": f"CAMP-{random.randint(1000, 9999)}",
                    "channel": random.choice(["In-store", "Online", "Print", "Digital", "Radio"]),
                    "roi_target": round(random.uniform(1.5, 4.0), 2),
                    "duration_weeks": random.randint(2, 12),
                    "volume_target": random.randint(1000, 10000),
                    "kpi_metrics": {
                        "reach": f"{random.randint(10000, 100000)} customers",
                        "frequency": f"{random.uniform(2.1, 5.8):.1f}",
                        "conversion_rate": f"{random.uniform(2.5, 8.5):.1f}%"
                    }
                }
            }
            
            trade_spend_records.append(record)
        
        self.demo_data["trade_spend"] = trade_spend_records

    def generate_promotions(self):
        """Generate promotional campaigns"""
        promotions = []
        start_date = datetime.now() - timedelta(days=180)
        
        promotion_types = [
            "Buy One Get One Free",
            "20% Off Regular Price",
            "Multi-buy Discount",
            "Seasonal Promotion",
            "New Product Launch",
            "Back to School Special",
            "Festive Season Offer"
        ]
        
        for i in range(15):
            promo_start = start_date + timedelta(days=random.randint(0, 150))
            promo_end = promo_start + timedelta(days=random.randint(7, 42))
            
            promotion = {
                "id": str(uuid.uuid4()),
                "name": f"{random.choice(promotion_types)} - {random.choice(self.demo_data['products'])['brand']}",
                "description": f"Promotional campaign for {random.choice(self.demo_data['products'])['name']}",
                "type": random.choice(promotion_types),
                "start_date": promo_start.strftime("%Y-%m-%d"),
                "end_date": promo_end.strftime("%Y-%m-%d"),
                "status": "completed" if promo_end < datetime.now() else "active",
                "budget": round(random.uniform(50000, 500000), 2),
                "actual_spend": round(random.uniform(45000, 480000), 2),
                "currency": "ZAR",
                "target_customers": random.sample([c["name"] for c in self.demo_data["customers"]], random.randint(2, 4)),
                "target_products": random.sample([p["name"] for p in self.demo_data["products"]], random.randint(1, 3)),
                "created_by": random.choice(["sarah.johnson@mondelez.co.za", "mike.williams@mondelez.co.za"]),
                "created_at": (promo_start - timedelta(days=random.randint(14, 30))).isoformat(),
                "metadata": {
                    "objectives": ["Increase market share", "Drive volume growth", "Clear inventory", "Support new launch"],
                    "mechanics": random.choice(["Price reduction", "Bundle offer", "Gift with purchase", "Cashback"]),
                    "channels": random.sample(["In-store", "Online", "Print ads", "Digital", "Radio"], random.randint(2, 4)),
                    "kpi_results": {
                        "volume_lift": f"{random.uniform(8, 35):.1f}%",
                        "roi": round(random.uniform(1.8, 4.2), 2),
                        "market_share_impact": f"+{random.uniform(0.5, 2.5):.1f}%",
                        "customer_acquisition": random.randint(500, 5000)
                    }
                }
            }
            
            promotions.append(promotion)
        
        self.demo_data["promotions"] = promotions

    def generate_activities(self):
        """Generate activity grid data"""
        activities = []
        start_date = datetime.now() - timedelta(days=180)
        
        activity_types = [
            "In-store Display",
            "Price Promotion",
            "Sampling Campaign",
            "Digital Marketing",
            "Print Advertising",
            "Radio Campaign",
            "Product Launch",
            "Trade Show",
            "Customer Meeting",
            "Training Session"
        ]
        
        for i in range(30):
            activity_date = start_date + timedelta(days=random.randint(0, 180))
            
            activity = {
                "id": str(uuid.uuid4()),
                "name": f"{random.choice(activity_types)} - {random.choice(self.demo_data['customers'])['name']}",
                "type": random.choice(activity_types),
                "description": f"Marketing activity for {random.choice(self.demo_data['products'])['brand']} brand",
                "start_date": activity_date.strftime("%Y-%m-%d"),
                "end_date": (activity_date + timedelta(days=random.randint(1, 14))).strftime("%Y-%m-%d"),
                "status": random.choice(["completed", "in_progress", "planned"]),
                "priority": random.choice(["high", "medium", "low"]),
                "budget": round(random.uniform(5000, 100000), 2),
                "actual_cost": round(random.uniform(4500, 95000), 2),
                "currency": "ZAR",
                "assigned_to": random.choice(["sarah.johnson@mondelez.co.za", "mike.williams@mondelez.co.za"]),
                "customer_id": random.choice(self.demo_data["customers"])["id"],
                "product_ids": [random.choice(self.demo_data["products"])["id"]],
                "created_at": (activity_date - timedelta(days=random.randint(7, 21))).isoformat(),
                "metadata": {
                    "location": random.choice(["Cape Town", "Johannesburg", "Durban", "Pretoria", "Port Elizabeth"]),
                    "expected_reach": random.randint(1000, 50000),
                    "success_metrics": {
                        "awareness_lift": f"{random.uniform(5, 25):.1f}%",
                        "engagement_rate": f"{random.uniform(2, 12):.1f}%",
                        "conversion_rate": f"{random.uniform(1, 8):.1f}%"
                    }
                }
            }
            
            activities.append(activity)
        
        self.demo_data["activities"] = activities

    def generate_contracts(self):
        """Generate trading terms and contracts"""
        contracts = []
        
        for customer in self.demo_data["customers"]:
            contract = {
                "id": str(uuid.uuid4()),
                "customer_id": customer["id"],
                "customer_name": customer["name"],
                "contract_number": f"CT-{customer['code']}-{datetime.now().year}",
                "name": f"Annual Trading Agreement - {customer['name']}",
                "type": "Annual Trading Terms",
                "start_date": f"{datetime.now().year}-01-01",
                "end_date": f"{datetime.now().year}-12-31",
                "status": "active",
                "total_value": round(random.uniform(1000000, 10000000), 2),
                "currency": "ZAR",
                "payment_terms": customer["metadata"]["payment_terms"],
                "created_by": "mike.williams@mondelez.co.za",
                "created_at": f"{datetime.now().year-1}-11-15T00:00:00Z",
                "terms": {
                    "volume_discount": f"{random.uniform(2, 8):.1f}%",
                    "early_payment_discount": "2% if paid within 10 days",
                    "minimum_order_quantity": random.randint(100, 1000),
                    "delivery_terms": "FOB Warehouse",
                    "return_policy": "30 days for damaged goods",
                    "promotional_support": f"R{random.randint(50000, 500000):,} annually"
                },
                "kpi_targets": {
                    "annual_volume": f"{random.randint(10000, 100000)} units",
                    "market_share_growth": f"{random.uniform(1, 5):.1f}%",
                    "new_product_listings": random.randint(2, 8),
                    "promotional_compliance": "95%"
                },
                "metadata": {
                    "negotiated_by": "mike.williams@mondelez.co.za",
                    "approved_by": "sarah.johnson@mondelez.co.za",
                    "legal_review": True,
                    "auto_renewal": True,
                    "escalation_clause": "3% annual increase"
                }
            }
            
            contracts.append(contract)
        
        self.demo_data["contracts"] = contracts

    def save_demo_data(self, filename: str = "mondelez-demo-data.json"):
        """Save demo data to JSON file"""
        with open(filename, 'w') as f:
            json.dump(self.demo_data, f, indent=2, default=str)
        
        print(f"✅ Demo data saved to {filename}")
        
        # Print summary
        print("\n📊 MONDELEZ SA DEMO DATA SUMMARY")
        print("=" * 40)
        print(f"Company: {self.demo_data['company']['name']}")
        print(f"Users: {len(self.demo_data['users'])}")
        print(f"Products: {len(self.demo_data['products'])}")
        print(f"Customers: {len(self.demo_data['customers'])}")
        print(f"Budgets: {len(self.demo_data['budgets'])}")
        print(f"Trade Spend Records: {len(self.demo_data['trade_spend'])}")
        print(f"Promotions: {len(self.demo_data['promotions'])}")
        print(f"Activities: {len(self.demo_data['activities'])}")
        print(f"Contracts: {len(self.demo_data['contracts'])}")
        
        # Calculate totals
        total_budget = sum(b["total_amount"] for b in self.demo_data["budgets"])
        total_spend = sum(t["amount"] for t in self.demo_data["trade_spend"])
        
        print(f"\n💰 FINANCIAL SUMMARY")
        print(f"Total Budget Allocated: R{total_budget:,.2f}")
        print(f"Total Trade Spend: R{total_spend:,.2f}")
        print(f"Budget Utilization: {(total_spend/total_budget*100):.1f}%")

def main():
    """Generate Mondelez SA demo data"""
    print("🚀 GENERATING MONDELEZ SA DEMO DATA")
    print("=" * 40)
    
    seeder = MondelezDemoSeeder()
    seeder.save_demo_data()
    
    print("\n✅ Demo data generation complete!")
    print("📁 File: mondelez-demo-data.json")
    print("🎯 Ready for import into TRADEAI v2.0")

if __name__ == "__main__":
    main()