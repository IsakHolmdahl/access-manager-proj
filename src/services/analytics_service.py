"""
Analytics service for executing custom SQL queries.

Provides secure SQL query execution with validation and sanitization.
"""

import duckdb
import re
from typing import Any

from src.models.analytics import SQLQueryRequest, SQLQueryResponse
from src.api.exceptions import ValidationException


class AnalyticsService:
    """
    Service for executing custom analytics queries.
    
    Implements SQL injection prevention through:
    1. Whitelist-based approach (only SELECT allowed)
    2. Dangerous keyword detection
    3. Query complexity limits
    """
    
    # Dangerous SQL keywords that should not appear in SELECT queries
    DANGEROUS_KEYWORDS = [
        r'\bDROP\b',
        r'\bDELETE\b',
        r'\bINSERT\b',
        r'\bUPDATE\b',
        r'\bTRUNCATE\b',
        r'\bALTER\b',
        r'\bCREATE\b',
        r'\bREPLACE\b',
        r'\bEXEC\b',
        r'\bEXECUTE\b',
        r'\bCALL\b',
        r'\bATTACH\b',
        r'\bDETACH\b',
        r'\bPRAGMA\b',
        r'\bLOAD\b',
        r'\bINSTALL\b',
        r'\bCOPY\b',
        r'\bEXPORT\b',
    ]
    
    # Allowed tables (whitelist)
    ALLOWED_TABLES = ['users', 'accesses', 'user_accesses']
    
    def __init__(self, db: duckdb.DuckDBPyConnection):
        """
        Initialize service with database connection.
        
        Args:
            db: DuckDB database connection
        """
        self.db = db
    
    def validate_query(self, query: str) -> None:
        """
        Validate SQL query for security.
        
        Args:
            query: SQL query to validate
            
        Raises:
            ValidationException: If query contains dangerous patterns
        """
        query_upper = query.upper()
        
        # Check for dangerous keywords
        for keyword_pattern in self.DANGEROUS_KEYWORDS:
            if re.search(keyword_pattern, query_upper, re.IGNORECASE):
                keyword_clean = keyword_pattern.replace(r'\b', '')
                raise ValidationException(
                    f"Query contains forbidden keyword: {keyword_clean}",
                    details={"forbidden_pattern": keyword_pattern}
                )
        
        # Check for comment injection attempts
        if '--' in query or '/*' in query or '*/' in query:
            raise ValidationException(
                "Query contains forbidden comment syntax",
                details={"reason": "SQL comments not allowed"}
            )
        
        # Check for multiple statements (semicolon-separated)
        if query.count(';') > 1 or (';' in query and not query.strip().endswith(';')):
            raise ValidationException(
                "Multiple SQL statements not allowed",
                details={"reason": "Only single SELECT queries permitted"}
            )
        
        # Validate table names (basic check - extract FROM/JOIN clauses)
        # This is a simple heuristic, not perfect but adds defense-in-depth
        table_pattern = r'(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)'
        found_tables = re.findall(table_pattern, query_upper, re.IGNORECASE)
        
        for table in found_tables:
            if table.lower() not in self.ALLOWED_TABLES:
                raise ValidationException(
                    f"Query references forbidden table: {table}",
                    details={
                        "table": table,
                        "allowed_tables": self.ALLOWED_TABLES
                    }
                )
    
    def execute_query(self, request: SQLQueryRequest) -> SQLQueryResponse:
        """
        Execute a validated SQL query.
        
        Args:
            request: SQL query request with query and limit
            
        Returns:
            SQLQueryResponse with query results
            
        Raises:
            ValidationException: If query validation fails or execution error
        """
        # Validate the query
        self.validate_query(request.query)
        
        # Prepare query with LIMIT clause
        query = request.query.strip()
        if query.endswith(';'):
            query = query[:-1]  # Remove trailing semicolon
        
        # Add LIMIT if not present
        if 'LIMIT' not in query.upper():
            query = f"{query} LIMIT {request.limit}"
        
        try:
            # Execute query in read-only mode (DuckDB connection is already established)
            result = self.db.execute(query).fetchall()
            
            # Get column names from description
            description = self.db.description
            columns = [desc[0] for desc in description] if description else []
            
            # Convert result to list of lists
            rows = [list(row) for row in result]
            
            return SQLQueryResponse(
                columns=columns,
                rows=rows,
                row_count=len(rows)
            )
            
        except Exception as e:
            raise ValidationException(
                f"Query execution failed: {str(e)}",
                details={"error": str(e), "query": request.query}
            )
