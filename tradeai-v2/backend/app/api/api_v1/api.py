"""
API v1 router configuration
"""

from fastapi import APIRouter

from app.api.api_v1.endpoints import (
    auth,
    users,
    tenants,
    customers,
    products,
    budgets,
    trade_spend,
    trading_terms,
    activity_grids,
    promotions,
    analytics,
    reports,
    health
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
api_router.include_router(trade_spend.router, prefix="/trade-spend", tags=["trade-spend"])
api_router.include_router(trading_terms.router, prefix="/trading-terms", tags=["trading-terms"])
api_router.include_router(activity_grids.router, prefix="/activity-grids", tags=["activity-grids"])
api_router.include_router(promotions.router, prefix="/promotions", tags=["promotions"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])