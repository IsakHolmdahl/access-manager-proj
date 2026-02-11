"""
FastAPI application initialization and configuration.

This module creates the FastAPI app instance, registers exception handlers,
and initializes the database on startup.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.config import get_settings
from src.database.connection import init_database
from src.database.migrations import seed_database
from src.api.exceptions import APIException


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Handles startup and shutdown events.
    - Startup: Initialize database schema and seed data
    - Shutdown: Clean up resources
    """
    # Startup: Initialize database
    settings = get_settings()
    print(f"Starting {settings.api_title} v{settings.api_version}")
    print(f"Environment: {settings.app_environment}")
    print(f"Database: {settings.duckdb_path}")
    
    # Run migrations to create schema
    init_database()
    print("✓ Database schema initialized")
    
    # Seed database with sample data (only if empty)
    seed_database()
    print("✓ Database seeded with sample data")
    
    yield
    
    # Shutdown: Clean up resources
    print("Shutting down...")


# Create FastAPI application
settings = get_settings()
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)


# ============================================================================
# Exception Handlers
# ============================================================================

@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException) -> JSONResponse:
    """
    Handle custom API exceptions.
    
    Converts APIException instances to structured JSON responses.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.message,
                "type": exc.__class__.__name__,
                "details": exc.details
            }
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """
    Handle Pydantic validation errors (422 Unprocessable Entity).
    
    Formats validation errors in a consistent structure.
    """
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " -> ".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "message": "Request validation failed",
                "type": "ValidationError",
                "details": {"errors": errors}
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle unexpected exceptions.
    
    Catches all unhandled exceptions and returns a 500 Internal Server Error.
    In production, this should log the error for debugging.
    """
    import traceback
    
    # Log the full traceback in development
    if settings.app_environment == "development":
        print(f"Unhandled exception: {exc}")
        traceback.print_exc()
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "message": "An internal server error occurred",
                "type": "InternalServerError",
                "details": {
                    "error": str(exc) if settings.app_environment == "development" else None
                }
            }
        }
)


# ============================================================================
# CORS Middleware Configuration
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Local frontend dev
        "http://frontend:3000",       # Docker frontend container
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Health Check Endpoint
# ============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    
    Returns:
        dict: Application health status
    """
    return {
        "status": "healthy",
        "service": settings.api_title,
        "version": settings.api_version,
        "environment": settings.app_environment
    }


# ============================================================================
# Route Registration
# ============================================================================

# User management routes (admin)
from src.api.routes import users
app.include_router(users.router, prefix="/admin", tags=["Admin - Users"])

# Access catalog routes (admin)
from src.api.routes import accesses
app.include_router(accesses.router)

# User access viewing routes
from src.api.routes import user_accesses
app.include_router(user_accesses.router)

# Analytics routes (admin)
from src.api.routes import analytics
app.include_router(analytics.router)

# Export routes (admin)
from src.api.routes import exports
app.include_router(exports.router)

