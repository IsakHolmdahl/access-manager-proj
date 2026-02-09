"""
Parquet export models.

Defines Pydantic models for exporting data to Parquet files.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class ParquetExportRequest(BaseModel):
    """Request model for Parquet export."""
    filename: str = Field(
        default=None,
        min_length=1,
        max_length=100,
        description="Optional filename (without extension). If not provided, a timestamped filename will be generated."
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "filename": "user_accesses_export"
            }
        }
    )


class ParquetExportResponse(BaseModel):
    """Response model for Parquet export."""
    filename: str = Field(description="Name of the generated Parquet file")
    file_path: str = Field(description="Full path to the Parquet file")
    row_count: int = Field(description="Number of rows exported")
    file_size_bytes: int = Field(description="Size of the Parquet file in bytes")
    created_at: datetime = Field(description="Timestamp when file was created")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "filename": "user_accesses_2026-02-06_103045.parquet",
                "file_path": "./data/parquet/user_accesses_2026-02-06_103045.parquet",
                "row_count": 10,
                "file_size_bytes": 2048,
                "created_at": "2026-02-06T10:30:45Z"
            }
        }
    )
