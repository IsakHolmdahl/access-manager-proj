"""
Analytics routes for administrators.

Provides endpoints for custom SQL queries with security validation.
"""

from fastapi import APIRouter, Depends, status
from typing import Annotated
import duckdb

from src.models.analytics import SQLQueryRequest, SQLQueryResponse
from src.services.analytics_service import AnalyticsService
from src.api.dependencies import get_db, verify_admin_key

router = APIRouter(
    prefix="/admin/analytics",
    tags=["Admin - Analytics"]
)


def get_analytics_service(db: Annotated[duckdb.DuckDBPyConnection, Depends(get_db)]) -> AnalyticsService:
    """Dependency to get AnalyticsService instance."""
    return AnalyticsService(db)


@router.post(
    "/query",
    response_model=SQLQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute custom SQL query",
    description="Execute a custom SELECT query for analytics. Only SELECT queries are allowed. Requires admin authentication.",
    dependencies=[Depends(verify_admin_key)]
)
async def execute_query(
    request: SQLQueryRequest,
    service: Annotated[AnalyticsService, Depends(get_analytics_service)]
) -> SQLQueryResponse:
    """
    Execute a custom SQL query for analytics.
    
    **Authentication**: Requires X-Admin-Key header
    
    **Security**:
    - Only SELECT queries allowed
    - Dangerous keywords blocked (DROP, DELETE, INSERT, UPDATE, etc.)
    - SQL comments not permitted
    - Multiple statements not allowed
    - Table whitelist enforced (users, accesses, user_accesses)
    - Automatic LIMIT clause applied
    
    **Request Body**:
    - `query`: SQL SELECT query to execute
    - `limit`: Maximum rows to return (default: 100, max: 1000)
    
    **Returns**: Query results with columns and rows
    
    **Example Queries**:
    ```sql
    -- Count accesses by user
    SELECT u.username, COUNT(ua.access_id) as access_count 
    FROM users u 
    LEFT JOIN user_accesses ua ON u.id = ua.user_id 
    GROUP BY u.username
    
    -- List users with specific access
    SELECT u.username, a.name as access_name
    FROM users u
    JOIN user_accesses ua ON u.id = ua.user_id
    JOIN accesses a ON ua.access_id = a.id
    WHERE a.name = 'ADMIN_PANEL'
    
    -- Access renewal report
    SELECT a.name, a.renewal_period, COUNT(ua.user_id) as assigned_count
    FROM accesses a
    LEFT JOIN user_accesses ua ON a.id = ua.access_id
    GROUP BY a.name, a.renewal_period
    ORDER BY assigned_count DESC
    ```
    
    **Raises**:
    - `400 Bad Request`: If query validation fails or execution error
    """
    return service.execute_query(request)
