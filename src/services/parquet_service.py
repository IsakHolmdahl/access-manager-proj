"""
Parquet export service.

Handles exporting user access data to Parquet files.
"""

import duckdb
from pathlib import Path
from datetime import datetime

from src.models.parquet_export import ParquetExportRequest, ParquetExportResponse
from src.config import get_settings


class ParquetService:
    """Service for exporting data to Parquet format."""
    
    def __init__(self, db: duckdb.DuckDBPyConnection):
        self.db = db
        self.settings = get_settings()
    
    def export_user_accesses(self, request: ParquetExportRequest) -> ParquetExportResponse:
        """
        Export all user-access assignments to a Parquet file.
        
        Args:
            request: ParquetExportRequest with optional filename
            
        Returns:
            ParquetExportResponse: Metadata about the exported file
        """
        # Generate filename
        if request.filename:
            filename = f"{request.filename}.parquet"
        else:
            timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
            filename = f"user_accesses_{timestamp}.parquet"
        
        # Ensure parquet directory exists
        parquet_dir = Path(self.settings.parquet_path)
        parquet_dir.mkdir(parents=True, exist_ok=True)
        file_path = parquet_dir / filename
        
        # Query data with JOINs to get all user-access relationships
        query = """
        SELECT 
            u.id as user_id,
            u.username,
            u.created_at as user_created_at,
            a.id as access_id,
            a.name as access_name,
            a.description as access_description,
            a.renewal_period,
            ua.assigned_at
        FROM user_accesses ua
        JOIN users u ON ua.user_id = u.id
        JOIN accesses a ON ua.access_id = a.id
        ORDER BY u.username, a.name
        """
        
        # Use DuckDB's native Parquet export (efficient and direct)
        export_query = f"COPY ({query}) TO '{file_path}' (FORMAT PARQUET)"
        self.db.execute(export_query)
        
        # Get row count
        count_result = self.db.execute(f"SELECT COUNT(*) FROM ({query}) AS subquery").fetchone()
        row_count = count_result[0] if count_result else 0
        
        # Get file size
        file_size = file_path.stat().st_size
        
        return ParquetExportResponse(
            filename=filename,
            file_path=str(file_path),
            row_count=row_count,
            file_size_bytes=file_size,
            created_at=datetime.now()
        )
