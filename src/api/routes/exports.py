"""
Export routes for admin users.

Provides endpoints for exporting data in various formats (Parquet, etc.).
"""

from fastapi import APIRouter, Depends, status
from typing import Annotated
import duckdb

from src.models.parquet_export import ParquetExportRequest, ParquetExportResponse
from src.services.parquet_service import ParquetService
from src.api.dependencies import get_db, verify_admin_key

router = APIRouter(
    prefix="/admin/exports",
    tags=["Admin - Exports"]
)


def get_parquet_service(
    db: Annotated[duckdb.DuckDBPyConnection, Depends(get_db)]
) -> ParquetService:
    """Dependency to create ParquetService instance."""
    return ParquetService(db)


@router.post(
    "/parquet",
    response_model=ParquetExportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Export user accesses to Parquet",
    description=(
        "Export all user-access assignments to a Parquet file. "
        "Includes user details, access details, and assignment timestamps. "
        "Requires admin authentication."
    ),
    dependencies=[Depends(verify_admin_key)]
)
async def export_to_parquet(
    service: Annotated[ParquetService, Depends(get_parquet_service)],
    request: ParquetExportRequest = ParquetExportRequest()
) -> ParquetExportResponse:
    """
    Export all user-access assignments to Parquet format.
    
    The exported file includes:
    - User information (id, username, created_at)
    - Access information (id, name, description, renewal_period)
    - Assignment timestamp (assigned_at)
    
    If no filename is provided, a timestamped filename will be generated.
    Files are saved to the configured parquet directory.
    """
    return service.export_user_accesses(request)
