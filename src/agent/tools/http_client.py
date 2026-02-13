"""
HTTP client wrapper for the Access Management Agent.
Provides async HTTP client with retry logic and error handling.
"""

import logging
from typing import Any, Dict, Optional
import httpx
from httpx import Timeout
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
    after_log
)

logger = logging.getLogger(__name__)


class BackendAPIClient:
    """
    HTTP client for communicating with the backend access management API.
    
    Provides:
    - Async HTTP requests with retry logic
    - Error handling for common failure modes
    - Request/response logging
    """
    
    def __init__(
        self,
        base_url: str,
        admin_key: str = "",
        timeout: float = 10.0,
        max_retries: int = 2
    ):
        """
        Initialize the backend API client.
        
        Args:
            base_url: Base URL of the backend API
            admin_key: Admin key for admin endpoints
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
        """
        self.base_url = base_url.rstrip("/")
        self.admin_key = admin_key
        self.timeout = Timeout(timeout)
        self.max_retries = max_retries
        
        # Create async client
        self.client = httpx.AsyncClient(
            timeout=self.timeout,
            follow_redirects=True
        )
    
    async def close(self) -> None:
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def __aenter__(self) -> "BackendAPIClient":
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        await self.close()
    
    def _get_headers(self, username: Optional[str] = None) -> Dict[str, str]:
        """
        Get HTTP headers for requests.
        
        Args:
            username: Optional username for authentication
            
        Returns:
            Dictionary of headers
        """
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        if self.admin_key:
            headers["X-Admin-Key"] = self.admin_key
        
        if username:
            headers["X-Username"] = username
        
        return headers
    
    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(httpx.RequestError),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        after=after_log(logger, logging.INFO)
    )
    async def get(self, path: str, username: Optional[str] = None) -> httpx.Response:
        """
        Perform a GET request to the backend API.
        
        Args:
            path: API path (e.g., "/users/1/accesses")
            username: Optional username for authentication
            
        Returns:
            HTTP response object
            
        Raises:
            httpx.RequestError: If the request fails
            httpx.TimeoutException: If the request times out
        """
        url = f"{self.base_url}{path}"
        headers = self._get_headers(username)
        
        logger.info(f"GET {url}")
        
        response = await self.client.get(url, headers=headers)
        response.raise_for_status()
        
        logger.info(f"GET {url} - Status: {response.status_code}")
        
        return response
    
    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(httpx.RequestError),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        after=after_log(logger, logging.INFO)
    )
    async def post(
        self,
        path: str,
        data: Dict[str, Any],
        username: Optional[str] = None
    ) -> httpx.Response:
        """
        Perform a POST request to the backend API.
        
        Args:
            path: API path (e.g., "/users/1/accesses")
            data: Request body data
            username: Optional username for authentication
            
        Returns:
            HTTP response object
            
        Raises:
            httpx.RequestError: If the request fails
            httpx.TimeoutException: If the request times out
        """
        url = f"{self.base_url}{path}"
        headers = self._get_headers(username)
        
        logger.info(f"POST {url}")
        logger.debug(f"POST {url} - Data: {data}")
        
        response = await self.client.post(url, json=data, headers=headers)
        response.raise_for_status()
        
        logger.info(f"POST {url} - Status: {response.status_code}")
        
        return response
    
    async def get_accesses(self) -> Dict[str, Any]:
        """
        Get all available accesses from the backend API.
        
        Returns:
            Dictionary containing accesses list and metadata
            
        Raises:
            httpx.RequestError: If the request fails
        """
        response = await self.get("/admin/accesses?limit=100&offset=0")
        return response.json()
    
    async def get_user_accesses(self, user_id: int, username: str) -> Dict[str, Any]:
        """
        Get accesses assigned to a specific user.
        
        Args:
            user_id: ID of the user
            username: Username for authentication
            
        Returns:
            Dictionary containing user accesses
            
        Raises:
            httpx.RequestError: If the request fails
        """
        response = await self.get(f"/users/{user_id}/accesses", username=username)
        return response.json()
    
    async def grant_access(
        self,
        user_id: int,
        access_name: str,
        username: str
    ) -> Dict[str, Any]:
        """
        Grant an access to a user.
        
        Args:
            user_id: ID of the user
            access_name: Name of the access to grant
            username: Username for authentication
            
        Returns:
            Dictionary containing granted access details
            
        Raises:
            httpx.RequestError: If the request fails
        """
        response = await self.post(
            f"/users/{user_id}/accesses",
            data={"access_name": access_name},
            username=username
        )
        return response.json()


class BackendAPIError(Exception):
    """Exception raised for backend API errors."""
    
    def __init__(self, message: str, status_code: Optional[int] = None, details: Optional[Dict] = None):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


async def make_backend_request(
    client: BackendAPIClient,
    operation: str,
    **kwargs
) -> Dict[str, Any]:
    """
    Make a request to the backend API with error handling.
    
    Args:
        client: Backend API client instance
        operation: Name of the operation (for logging)
        **kwargs: Arguments to pass to the client method
        
    Returns:
        Response data from the API
        
    Raises:
        BackendAPIError: If the request fails
    """
    try:
        if operation == "get_accesses":
            return await client.get_accesses()
        elif operation == "get_user_accesses":
            return await client.get_user_accesses(**kwargs)
        elif operation == "grant_access":
            return await client.grant_access(**kwargs)
        else:
            raise ValueError(f"Unknown operation: {operation}")
    except httpx.HTTPStatusError as e:
        status_code = e.response.status_code
        message = f"Backend API error: {e.response.text}"
        
        logger.error(f"Backend API error during {operation}: {message}")
        
        # Map common status codes to user-friendly messages
        if status_code == 404:
            message = "Resource not found"
        elif status_code == 409:
            message = "You already have this access"
        elif status_code == 403:
            message = "You don't have permission for this operation"
        elif status_code == 400:
            message = "Invalid request"
        elif status_code >= 500:
            message = "Backend API error, please try again"
        
        raise BackendAPIError(message, status_code=status_code)
    except httpx.RequestError as e:
        logger.error(f"Backend API connection error during {operation}: {str(e)}")
        raise BackendAPIError("Backend API is not responding", details={"error": str(e)})
    except httpx.TimeoutException as e:
        logger.error(f"Backend API timeout during {operation}: {str(e)}")
        raise BackendAPIError("Backend API request timed out", details={"error": str(e)})
