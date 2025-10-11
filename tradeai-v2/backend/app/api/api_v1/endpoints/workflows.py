"""
Workflow management endpoints
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, get_tenant_id
from app.models.user import User
from app.services.workflow import WorkflowService

router = APIRouter()


@router.post("/budgets/{budget_id}/approve")
async def approve_budget(
    budget_id: str,
    notes: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id)
) -> Dict[str, Any]:
    """Approve a budget"""
    try:
        result = await WorkflowService.process_budget_approval(
            db=db,
            budget_id=budget_id,
            approved_by=current_user.id,
            tenant_id=tenant_id,
            notes=notes
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to approve budget: {str(e)}")


@router.post("/trade-spend/{trade_spend_id}/workflow")
async def process_trade_spend(
    trade_spend_id: str,
    action: str,  # approve, reject, submit
    notes: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id)
) -> Dict[str, Any]:
    """Process trade spend workflow action"""
    
    valid_actions = ["approve", "reject", "submit"]
    if action not in valid_actions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid action. Must be one of: {', '.join(valid_actions)}"
        )
    
    try:
        result = await WorkflowService.process_trade_spend_workflow(
            db=db,
            trade_spend_id=trade_spend_id,
            action=action,
            user_id=current_user.id,
            tenant_id=tenant_id,
            notes=notes
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process trade spend: {str(e)}")


@router.post("/promotions/{promotion_id}/lifecycle")
async def manage_promotion_lifecycle(
    promotion_id: str,
    action: str,  # activate, pause, complete, cancel
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id)
) -> Dict[str, Any]:
    """Manage promotion lifecycle"""
    
    valid_actions = ["activate", "pause", "complete", "cancel"]
    if action not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action. Must be one of: {', '.join(valid_actions)}"
        )
    
    try:
        result = await WorkflowService.manage_promotion_lifecycle(
            db=db,
            promotion_id=promotion_id,
            action=action,
            user_id=current_user.id,
            tenant_id=tenant_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to manage promotion: {str(e)}")


@router.post("/activity-grids/{activity_grid_id}/workflow")
async def process_activity_grid(
    activity_grid_id: str,
    action: str,  # activate, complete, cancel
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id)
) -> Dict[str, Any]:
    """Process activity grid workflow"""
    
    valid_actions = ["activate", "complete", "cancel"]
    if action not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action. Must be one of: {', '.join(valid_actions)}"
        )
    
    try:
        result = await WorkflowService.process_activity_grid_workflow(
            db=db,
            activity_grid_id=activity_grid_id,
            action=action,
            user_id=current_user.id,
            tenant_id=tenant_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process activity grid: {str(e)}")


@router.get("/trading-terms/expiry-alerts")
async def get_expiry_alerts(
    days_ahead: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id)
) -> Dict[str, Any]:
    """Get trading terms expiry alerts"""
    try:
        alerts = await WorkflowService.check_trading_terms_expiry(
            db=db,
            tenant_id=tenant_id,
            days_ahead=days_ahead
        )
        return {
            "alerts": alerts,
            "total_alerts": len(alerts),
            "days_ahead": days_ahead
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get expiry alerts: {str(e)}")


@router.get("/summary")
async def get_workflow_summary(
    period_days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id)
) -> Dict[str, Any]:
    """Get workflow activity summary"""
    try:
        summary = await WorkflowService.generate_workflow_summary(
            db=db,
            tenant_id=tenant_id,
            period_days=period_days
        )
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")


@router.get("/dashboard")
async def get_workflow_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id)
) -> Dict[str, Any]:
    """Get comprehensive workflow dashboard data"""
    try:
        # Get workflow summary
        summary = await WorkflowService.generate_workflow_summary(
            db=db, tenant_id=tenant_id, period_days=30
        )
        
        # Get expiry alerts
        alerts = await WorkflowService.check_trading_terms_expiry(
            db=db, tenant_id=tenant_id, days_ahead=30
        )
        
        return {
            "workflow_summary": summary,
            "expiry_alerts": {
                "alerts": alerts,
                "total_alerts": len(alerts),
                "urgent_alerts": len([a for a in alerts if a["alert_level"] == "urgent"])
            },
            "dashboard_generated": summary["summary_generated"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate dashboard: {str(e)}")