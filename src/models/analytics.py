"""
Analytics models for custom SQL queries.

Defines Pydantic models for admin analytics queries with security constraints.
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Any, Optional


class SQLQueryRequest(BaseModel):
    """Request model for custom SQL queries."""
    query: str = Field(
        min_length=1,
        max_length=5000,
        description="SQL SELECT query to execute (read-only)"
    )
    limit: Optional[int] = Field(
        default=100,
        ge=1,
        le=1000,
        description="Maximum number of rows to return"
    )
    
    @field_validator('query')
    @classmethod
    def validate_query_is_select(cls, v: str) -> str:
        """Ensure query is a SELECT statement."""
        query_upper = v.strip().upper()
        if not query_upper.startswith('SELECT'):
            raise ValueError("Only SELECT queries are allowed")
        return v
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "query": "SELECT u.username, COUNT(ua.access_id) as access_count FROM users u LEFT JOIN user_accesses ua ON u.id = ua.user_id GROUP BY u.username",
                "limit": 100
            }
        }
    )


class SQLQueryResponse(BaseModel):
    """Response model for SQL query results."""
    columns: list[str] = Field(description="Column names from query result")
    rows: list[list[Any]] = Field(description="Query result rows")
    row_count: int = Field(description="Number of rows returned")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "columns": ["username", "access_count"],
                "rows": [
                    ["admin", 10],
                    ["testuser", 3]
                ],
                "row_count": 2
            }
        }
    )
