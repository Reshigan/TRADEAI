"""
Custom middleware for TRADEAI v2.0
"""

import time
import uuid
from typing import Callable, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp
import structlog

from app.core.logging import log_request


logger = structlog.get_logger()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging HTTP requests"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Start timer
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log request
        log_request(
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration=duration,
            request_id=request_id,
            tenant_id=getattr(request.state, "tenant_id", None),
            user_id=getattr(request.state, "user_id", None),
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else None
        )
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        return response


class TenantMiddleware(BaseHTTPMiddleware):
    """Middleware for multi-tenant context"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Extract tenant information
        tenant_id = self._extract_tenant_id(request)
        
        # Set tenant context
        request.state.tenant_id = tenant_id
        
        # Process request
        response = await call_next(request)
        
        return response
    
    def _extract_tenant_id(self, request: Request) -> Optional[str]:
        """Extract tenant ID from request"""
        
        # Method 1: Header-based tenant identification
        tenant_id = request.headers.get("X-Tenant-ID")
        if tenant_id:
            return tenant_id
        
        # Method 2: Subdomain-based tenant identification
        host = request.headers.get("host", "")
        if "." in host:
            subdomain = host.split(".")[0]
            if subdomain and subdomain != "www":
                return subdomain
        
        # Method 3: Path-based tenant identification
        path_parts = request.url.path.strip("/").split("/")
        if len(path_parts) > 1 and path_parts[0] == "tenant":
            return path_parts[1]
        
        # Default tenant
        return "default"


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware for adding security headers"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers.update({
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' ws: wss:;"
            )
        })
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting"""
    
    def __init__(self, app: ASGIApp, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = period
        # In production, use Redis for distributed rate limiting
        self._requests = {}
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get client identifier
        client_id = self._get_client_id(request)
        
        # Check rate limit
        if self._is_rate_limited(client_id):
            return Response(
                content='{"error": "Rate limit exceeded"}',
                status_code=429,
                headers={"Content-Type": "application/json"}
            )
        
        # Record request
        self._record_request(client_id)
        
        return await call_next(request)
    
    def _get_client_id(self, request: Request) -> str:
        """Get client identifier for rate limiting"""
        # Use tenant + user for authenticated requests
        tenant_id = getattr(request.state, "tenant_id", "unknown")
        user_id = getattr(request.state, "user_id", None)
        
        if user_id:
            return f"{tenant_id}:{user_id}"
        
        # Use tenant + IP for unauthenticated requests
        ip_address = request.client.host if request.client else "unknown"
        return f"{tenant_id}:{ip_address}"
    
    def _is_rate_limited(self, client_id: str) -> bool:
        """Check if client is rate limited"""
        now = time.time()
        
        # Clean old requests
        if client_id in self._requests:
            self._requests[client_id] = [
                req_time for req_time in self._requests[client_id]
                if now - req_time < self.period
            ]
        
        # Check limit
        request_count = len(self._requests.get(client_id, []))
        return request_count >= self.calls
    
    def _record_request(self, client_id: str) -> None:
        """Record request for rate limiting"""
        now = time.time()
        
        if client_id not in self._requests:
            self._requests[client_id] = []
        
        self._requests[client_id].append(now)


class TenantContextManager:
    """Context manager for tenant-aware operations"""
    
    _tenant_context: Optional[str] = None
    
    @classmethod
    def set_tenant(cls, tenant_id: str) -> None:
        """Set current tenant context"""
        cls._tenant_context = tenant_id
    
    @classmethod
    def get_tenant(cls) -> Optional[str]:
        """Get current tenant context"""
        return cls._tenant_context
    
    @classmethod
    def clear_tenant(cls) -> None:
        """Clear tenant context"""
        cls._tenant_context = None