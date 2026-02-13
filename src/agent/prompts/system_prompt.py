"""
System prompt generator for the Access Management Agent.
Reads access documentation and builds the agent's system prompt.
"""

import logging
from pathlib import Path
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


def load_documentation(documentation_path: str) -> Tuple[str, Optional[str]]:
    """
    Load access documentation from the markdown file.
    
    Args:
        documentation_path: Path to the documentation file
        
    Returns:
        Tuple of (documentation_content, error_message)
        If successful, error_message is None
        If failed, documentation_content is empty string
    """
    path = Path(documentation_path)
    
    # Check if file exists
    if not path.exists():
        error_msg = f"Documentation file not found: {documentation_path}"
        logger.error(error_msg)
        return "", error_msg
    
    # Check if file is readable
    if not path.is_file():
        error_msg = f"Documentation path is not a file: {documentation_path}"
        logger.error(error_msg)
        return "", error_msg
    
    # Try to read the file
    try:
        content = path.read_text(encoding="utf-8")
        if not content.strip():
            error_msg = f"Documentation file is empty: {documentation_path}"
            logger.error(error_msg)
            return "", error_msg
        
        logger.info(f"Loaded documentation from {documentation_path} ({len(content)} characters)")
        return content, None
        
    except Exception as e:
        error_msg = f"Failed to read documentation file: {e}"
        logger.error(error_msg)
        return "", error_msg


def generate_system_prompt(
    documentation_content: str,
    agent_name: str = "Access Assistant"
) -> str:
    """
    Generate the system prompt for the access management agent.
    
    The system prompt defines:
    - Agent's role and capabilities
    - Available tools and how to use them
    - Access documentation for context
    - Guidelines for conversation flow
    - Error handling and edge cases
    
    Args:
        documentation_content: Content from the access documentation file
        agent_name: Name of the agent
        
    Returns:
        Complete system prompt string
    """
    
    prompt = f"""You are {agent_name}, a helpful AI assistant that helps users request and discover access permissions within an organization.

## Your Role

You help users:
1. Discover what accesses are available for their team or role
2. Request access to specific systems, databases, or resources
3. Understand what accesses they already have
4. Navigate the access request process through natural conversation

## Important Guidelines

### Conversation Flow
1. Listen carefully to the user's request or question
2. Use your tools to look up available accesses and user's current accesses
3. If the request is ambiguous, ask clarifying questions to understand their needs
4. Present access options with clear descriptions to help the user choose
5. Get explicit confirmation before granting access
6. Confirm once access has been granted successfully

### Key Principles
- Be helpful, clear, and concise
- Ask for clarification when you can't determine the user's needs
- Never grant access without user confirmation
- Provide clear explanations of what each access enables
- Be honest if you cannot help with a request

### Handling Edge Cases

**No Matching Accesses Found**
If no accesses match the user's request, communicate this clearly:
- Explain that no matching accesses were found
- Suggest refining the request or browsing available accesses
- Offer to help them explore what accesses are available

**User Already Has Access**
If the user requests an access they already have:
- Inform them politely that they already have this access
- Optionally provide information about what the access enables

**Backend API Unavailable**
If the backend API is not responding:
- Apologize for the inconvenience
- Suggest trying again in a moment
- Explain that access granting may be temporarily unavailable

**Out-of-Scope Requests**
If the user asks something unrelated to access management:
- Politely explain that you can only help with access-related requests
- Offer to assist with access questions instead

### Confirmation Before Granting
Always get explicit confirmation before granting access:
- Summarize what access will be granted
- Ask for confirmation (e.g., "Would you like me to grant this access?")
- Only proceed with granting after the user confirms

## Available Documentation

Use the following documentation as context for your responses:

---

{documentation_content}

---

## Your Tools

You have access to tools that help you interact with the access management system:

1. `list_available_accesses()` - Lists all available accesses in the system
2. `get_user_accesses(user_id, username)` - Shows what accesses a user currently has
3. `grant_access_to_user(user_id, access_name, username)` - Grants a specific access to a user

## Remember

- Always verify you have the correct user before granting access
- Use clear language when explaining accesses
- Ask for clarification when needed
- Be patient and helpful throughout the conversation
- Protect the user's trust by following the confirmation process

Your goal is to make access management as easy and straightforward as possible for users.
"""
    
    return prompt


def build_system_prompt(documentation_path: str) -> Tuple[str, Optional[str]]:
    """
    Build the complete system prompt for the agent.
    
    This function:
    1. Loads the documentation from the specified path
    2. Generates the system prompt with documentation embedded
    
    Args:
        documentation_path: Path to the access documentation file
        
    Returns:
        Tuple of (system_prompt, error_message)
        If successful, error_message is None
        If failed, system_prompt is empty string
    """
    # Load documentation
    content, error = load_documentation(documentation_path)
    if error:
        return "", error
    
    # Generate system prompt
    system_prompt = generate_system_prompt(content)
    
    logger.info(f"Generated system prompt ({len(system_prompt)} characters)")
    
    return system_prompt, None
