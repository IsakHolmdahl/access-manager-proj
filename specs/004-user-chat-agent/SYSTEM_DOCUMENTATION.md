# System Documentation: Access Manager

## Overview

This document provides a comprehensive explanation of the Access Manager system, its components, and how users interact with it through the chat interface. Understanding this documentation helps users make effective use of the chat agent for managing their accesses.

## System Architecture

### Core Components

The Access Manager system consists of three primary components that work together to provide access management functionality:

**Backend Service**: The central service that handles all business logic, database operations, and API endpoints. This service uses an embedded DuckDB database to store and retrieve access information. The backend exposes RESTful endpoints for querying available accesses, retrieving user accesses, and granting new accesses to users. When the chat agent needs to interact with the system, it communicates through these same endpoints, ensuring consistent and secure operations.

**Chat Agent**: An intelligent assistant embedded directly within the backend service. Unlike traditional separate services, the agent runs as part of the main backend application, eliminating the need for additional containers or deployments. The agent can understand natural language requests, translate them into system actions, and communicate results back to users in a conversational format. It has access to read-only database query tools for retrieving information and uses the existing access grant endpoint for modifying access permissions.

**User Interface**: The web-based interface where users interact with the system. The chat window is embedded directly on the user home page, providing immediate access to the agent without navigating to separate pages. The interface handles sending user messages to the backend, displaying agent responses, and managing the conversation flow.

### Data Storage

The system uses DuckDB, an embedded analytical database, for storing all access-related information. DuckDB was chosen for its lightweight nature, fast query performance, and ability to handle analytical workloads efficiently. The database stores several types of information:

**Access Definitions**: Records that describe each available access type in the system. Each access definition includes a unique identifier, a descriptive name, and a human-readable description that explains what the access allows and when it might be useful.

**User Accesses**: Records that link users to the accesses they have been granted. These records connect a user identifier with an access identifier, along with metadata such as when the access was granted and when it expires (if applicable).

## Understanding Accesses

### What Are Accesses?

An access in this system represents permission to perform a specific action or operate within a particular scope. Think of accesses as keys that unlock different capabilities within the system. When a user is granted an access, they gain the ability to perform the associated function or access the related resources.

Accesses are designed to follow the principle of least privilege - users should only have the accesses they genuinely need for their work. This approach minimizes security risks while ensuring users have sufficient permissions to accomplish their tasks.

### Access Categories

Accesses can be categorized by their purpose and scope. Some accesses provide general capabilities that apply broadly across the system, while others grant access to specific resources or limited functionality. The agent can help users understand what accesses are available and which ones might be appropriate for their needs.

### How Accesses Are Granted

Accesses are granted through a controlled process that ensures only authorized users can obtain appropriate permissions. When a user requests an access through the chat, the agent validates the request and submits it through the proper channel. The system checks that the user is authorized to receive the access and that the request follows any applicable policies. Once approved, the access is recorded in the database and becomes effective immediately.

### Access Descriptions

Each access in the system has a description that explains its purpose and usage. These descriptions are designed to help users understand what an access enables without needing deep technical knowledge. When users ask the agent about available accesses, they receive these descriptions along with information about their current access status.

## Using the Chat Interface

### Getting Started

The chat interface is available directly on your user home page. When you navigate to the home page, you'll see the chat window prominently displayed. You can begin a conversation immediately by typing your question or request in the message input area and pressing send or clicking the send button.

The chat interface is designed for natural conversation. You don't need to learn special commands or follow a rigid format. Simply express what you want to accomplish in plain language, and the agent will help you achieve it.

### Asking About Your Accesses

You can ask the agent many types of questions about your accesses. For example, you might ask "What accesses do I have?" to see a list of all your current permissions. Or you could ask "What accesses are available to me?" to learn about accesses you don't currently have but could request. The agent queries the database to retrieve accurate, up-to-date information and presents it in an easy-to-understand format.

The agent can also help you explore accesses based on your needs. If you're not sure what access you need, try describing the task you're trying to accomplish. The agent can suggest appropriate accesses based on your description and explain what each access enables.

### Requesting New Accesses

When you've identified an access you need, you can request it through the chat. Simply tell the agent you want the access, and it will submit the request through the appropriate backend endpoint. The agent handles all the technical details, ensuring your request follows the proper procedure.

If your access request is approved, the agent will confirm the successful addition and you can immediately use the newly granted access. If there are any issues with your request, such as if you already have the access or if there are restrictions on who can receive it, the agent will explain the situation clearly.

### Conversation Context

The agent maintains context throughout your conversation on a single page load. This means you can reference earlier messages, ask follow-up questions, and build on previous discussion points. For example, if you first asked about database accesses and then wanted to know specifically about read-only database accesses, the agent would understand you're still discussing database-related topics.

However, this context only exists within a single page session. If you reload the page or navigate away and return, a new conversation begins with no memory of previous exchanges. This design keeps the system simple and ensures each conversation starts fresh.

## Security and Best Practices

### Automatic User Identification

The system automatically identifies you through your authenticated session. You never need to provide your user ID or verify your identity within the chat - this is handled automatically based on your login status. All queries and actions are automatically scoped to your user account, ensuring data isolation and preventing unauthorized access to other users' information.

### Read-Only Queries

When the agent retrieves information about accesses, it uses read-only database queries. This means the query process cannot modify, delete, or corrupt any data in the system. The agent can only read information and present it back to you, with all modifications going through the proper authorization channels.

### Controlled Access Grants

All access grants go through the existing backend endpoint, which enforces proper authorization checks. The agent cannot bypass these checks or grant accesses that you're not authorized to receive. This ensures that access management follows organizational policies and maintains proper security controls.

## Example Conversations

### Example 1: Checking Current Accesses

```
User: What accesses do I have?
Agent: Based on the system records, you currently have the following accesses:
- Database Reader: Allows viewing database schemas and table structures
- Report Generator: Enables creation and download of system reports
- User Viewer: Permits viewing basic user information for other users

Is there a specific access you'd like to know more about, or would you like to request an additional access?
```

### Example 2: Exploring Available Accesses

```
User: What accesses can I request?
Agent: Here are the accesses available for your account:
- Database Administrator: Full database management capabilities including schema changes
- System Configuration: Ability to modify system settings and configurations
- Access Manager: Permission to grant and revoke accesses for other users

Each of these accesses has specific requirements and may require approval. Which access interests you?
```

### Example 3: Requesting an Access

```
User: I need the Database Administrator access.
Agent: I'll submit a request for the Database Administrator access. This access provides full database management capabilities including schema modifications and user management.

Let me process this request through the system... The Database Administrator access has been successfully added to your account. You now have full database management capabilities.

Is there anything else I can help you with?
```

### Example 4: Understanding What an Access Does

```
User: What does the Report Generator access let me do?
Agent: The Report Generator access enables you to:
- Create custom reports using system data
- Schedule reports for automatic generation
- Export reports in various formats (PDF, CSV, Excel)
- Share reports with other users

This access is useful if you need to analyze system data or create regular reports for stakeholders. Would you like to request this access?
```

## Troubleshooting

### Access Not Found

If you ask about an access and the agent indicates it doesn't exist, you may have misspelled the access name or be referring to it by a different term. Try describing the capability you're looking for instead of using a specific name, and the agent can help identify the correct access.

### Request Rejected

If your access request is not approved, the agent will explain why. Common reasons include lacking required prerequisites, organizational restrictions, or existing access that provides the capability you need. The agent can help you understand what might be needed to obtain the access in the future.

### Unexpected Behavior

If the chat interface behaves unexpectedly, try refreshing the page. Since chat sessions are temporary, a fresh page load resets the conversation and often resolves temporary issues. If problems persist, contact your system administrator for assistance.
