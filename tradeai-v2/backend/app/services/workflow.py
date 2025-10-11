"""
Business workflow services for TRADEAI v2.0
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.models.budget import Budget
from app.models.trade_spend import TradeSpend
from app.models.promotion import Promotion
from app.models.activity_grid import ActivityGrid, ActivityGridItem
from app.models.trading_terms import TradingTerms
from app.crud import budget, trade_spend, promotion, activity_grid, trading_terms


class WorkflowService:
    """Service for managing business workflows"""
    
    @staticmethod
    async def process_budget_approval(
        db: AsyncSession,
        budget_id: str,
        approved_by: str,
        tenant_id: str,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process budget approval workflow"""
        
        # Get budget
        budget_obj = await budget.get(db, id=budget_id, tenant_id=tenant_id)
        if not budget_obj:
            raise ValueError("Budget not found")
        
        if budget_obj.approval_status == "approved":
            return {"status": "already_approved", "budget": budget_obj}
        
        # Update budget status
        update_data = {
            "approval_status": "approved",
            "status": "active"
        }
        
        updated_budget = await budget.update(
            db, db_obj=budget_obj, obj_in=update_data
        )
        
        # Log approval activity
        activity_log = {
            "action": "budget_approved",
            "budget_id": budget_id,
            "approved_by": approved_by,
            "timestamp": datetime.utcnow(),
            "notes": notes
        }
        
        return {
            "status": "approved",
            "budget": updated_budget,
            "activity_log": activity_log
        }
    
    @staticmethod
    async def process_trade_spend_workflow(
        db: AsyncSession,
        trade_spend_id: str,
        action: str,  # "approve", "reject", "submit"
        user_id: str,
        tenant_id: str,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process trade spend approval workflow"""
        
        # Get trade spend
        spend_obj = await trade_spend.get(db, id=trade_spend_id, tenant_id=tenant_id)
        if not spend_obj:
            raise ValueError("Trade spend not found")
        
        workflow_result = {"status": action, "trade_spend": spend_obj}
        
        if action == "approve":
            if spend_obj.status == "approved":
                workflow_result["status"] = "already_approved"
                return workflow_result
            
            # Update status to approved
            updated_spend = await trade_spend.update(
                db, db_obj=spend_obj, obj_in={"status": "approved"}
            )
            workflow_result["trade_spend"] = updated_spend
            
        elif action == "reject":
            updated_spend = await trade_spend.update(
                db, db_obj=spend_obj, obj_in={"status": "rejected"}
            )
            workflow_result["trade_spend"] = updated_spend
            
        elif action == "submit":
            updated_spend = await trade_spend.update(
                db, db_obj=spend_obj, obj_in={"status": "pending"}
            )
            workflow_result["trade_spend"] = updated_spend
        
        # Log workflow activity
        workflow_result["activity_log"] = {
            "action": f"trade_spend_{action}",
            "trade_spend_id": trade_spend_id,
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            "notes": notes
        }
        
        return workflow_result
    
    @staticmethod
    async def manage_promotion_lifecycle(
        db: AsyncSession,
        promotion_id: str,
        action: str,  # "activate", "pause", "complete", "cancel"
        user_id: str,
        tenant_id: str
    ) -> Dict[str, Any]:
        """Manage promotion lifecycle workflow"""
        
        # Get promotion
        promo_obj = await promotion.get(db, id=promotion_id, tenant_id=tenant_id)
        if not promo_obj:
            raise ValueError("Promotion not found")
        
        current_status = promo_obj.status
        new_status = current_status
        
        # Define valid status transitions
        valid_transitions = {
            "draft": ["active", "cancelled"],
            "active": ["paused", "completed", "cancelled"],
            "paused": ["active", "cancelled"],
            "completed": [],  # Terminal state
            "cancelled": []   # Terminal state
        }
        
        status_mapping = {
            "activate": "active",
            "pause": "paused", 
            "complete": "completed",
            "cancel": "cancelled"
        }
        
        if action in status_mapping:
            new_status = status_mapping[action]
            
            # Check if transition is valid
            if new_status not in valid_transitions.get(current_status, []):
                raise ValueError(f"Cannot {action} promotion from {current_status} status")
        
        # Update promotion status
        updated_promotion = await promotion.update(
            db, db_obj=promo_obj, obj_in={"status": new_status}
        )
        
        return {
            "status": "success",
            "action": action,
            "previous_status": current_status,
            "new_status": new_status,
            "promotion": updated_promotion,
            "activity_log": {
                "action": f"promotion_{action}",
                "promotion_id": promotion_id,
                "user_id": user_id,
                "timestamp": datetime.utcnow(),
                "status_change": f"{current_status} -> {new_status}"
            }
        }
    
    @staticmethod
    async def process_activity_grid_workflow(
        db: AsyncSession,
        activity_grid_id: str,
        action: str,  # "activate", "complete", "cancel"
        user_id: str,
        tenant_id: str
    ) -> Dict[str, Any]:
        """Process activity grid workflow"""
        
        # Get activity grid
        grid_obj = await activity_grid.get(db, id=activity_grid_id, tenant_id=tenant_id)
        if not grid_obj:
            raise ValueError("Activity grid not found")
        
        current_status = grid_obj.status
        
        # Define status transitions
        status_mapping = {
            "activate": "active",
            "complete": "completed", 
            "cancel": "cancelled"
        }
        
        new_status = status_mapping.get(action, current_status)
        
        # Update activity grid
        updated_grid = await activity_grid.update(
            db, db_obj=grid_obj, obj_in={"status": new_status}
        )
        
        # If completing, update all items to completed
        if action == "complete":
            # Get all items for this grid
            stmt = select(ActivityGridItem).where(
                ActivityGridItem.activity_grid_id == activity_grid_id
            )
            result = await db.execute(stmt)
            items = result.scalars().all()
            
            # Update incomplete items to completed
            for item in items:
                if item.status != "completed":
                    item.status = "completed"
                    if not item.actual_cost and item.planned_cost:
                        item.actual_cost = item.planned_cost
            
            await db.commit()
        
        return {
            "status": "success",
            "action": action,
            "previous_status": current_status,
            "new_status": new_status,
            "activity_grid": updated_grid,
            "activity_log": {
                "action": f"activity_grid_{action}",
                "activity_grid_id": activity_grid_id,
                "user_id": user_id,
                "timestamp": datetime.utcnow()
            }
        }
    
    @staticmethod
    async def check_trading_terms_expiry(
        db: AsyncSession,
        tenant_id: str,
        days_ahead: int = 30
    ) -> List[Dict[str, Any]]:
        """Check for trading terms expiring soon"""
        
        expiry_date = datetime.utcnow() + timedelta(days=days_ahead)
        
        # Get trading terms expiring soon
        stmt = select(TradingTerms).where(
            and_(
                TradingTerms.tenant_id == tenant_id,
                TradingTerms.status == "active",
                TradingTerms.expiry_date <= expiry_date,
                TradingTerms.expiry_date > datetime.utcnow()
            )
        )
        
        result = await db.execute(stmt)
        expiring_terms = result.scalars().all()
        
        expiry_alerts = []
        for term in expiring_terms:
            days_until_expiry = (term.expiry_date - datetime.utcnow()).days
            expiry_alerts.append({
                "trading_term": term,
                "days_until_expiry": days_until_expiry,
                "alert_level": "urgent" if days_until_expiry <= 7 else "warning",
                "message": f"Trading term '{term.term_name}' expires in {days_until_expiry} days"
            })
        
        return expiry_alerts
    
    @staticmethod
    async def generate_workflow_summary(
        db: AsyncSession,
        tenant_id: str,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """Generate workflow activity summary"""
        
        start_date = datetime.utcnow() - timedelta(days=period_days)
        
        # Get pending approvals
        pending_budgets = await db.execute(
            select(Budget).where(
                and_(
                    Budget.tenant_id == tenant_id,
                    Budget.approval_status == "pending"
                )
            )
        )
        
        pending_trade_spend = await db.execute(
            select(TradeSpend).where(
                and_(
                    TradeSpend.tenant_id == tenant_id,
                    TradeSpend.status == "pending"
                )
            )
        )
        
        # Get active promotions
        active_promotions = await db.execute(
            select(Promotion).where(
                and_(
                    Promotion.tenant_id == tenant_id,
                    Promotion.status == "active"
                )
            )
        )
        
        # Get active activity grids
        active_grids = await db.execute(
            select(ActivityGrid).where(
                and_(
                    ActivityGrid.tenant_id == tenant_id,
                    ActivityGrid.status == "active"
                )
            )
        )
        
        return {
            "period_days": period_days,
            "pending_approvals": {
                "budgets": len(pending_budgets.scalars().all()),
                "trade_spend": len(pending_trade_spend.scalars().all())
            },
            "active_items": {
                "promotions": len(active_promotions.scalars().all()),
                "activity_grids": len(active_grids.scalars().all())
            },
            "summary_generated": datetime.utcnow()
        }