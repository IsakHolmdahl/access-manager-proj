# Access Documentation

This document describes the available access types, teams, and their associations. The agent uses this information to help users request the correct accesses.

## Access Types

### Document Access
- **READ_DOCUMENTS**: View documents in the system. Required for: All employees who need to read documents.
- **WRITE_DOCUMENTS**: Create and edit documents. Required for: Content creators, managers.
- **DELETE_DOCUMENTS**: Remove documents from the system. Required for: Administrators, content managers.

### Database Access
- **DB_READ_DEV**: Read access to development database. Required for: Developers working on the application.
- **DB_WRITE_DEV**: Write access to development database. Required for: Developers needing to modify test data.
- **DB_READ_PROD**: Read access to production database. Required for: Senior developers, DevOps engineers, DBAs.
- **DB_WRITE_PROD**: Write access to production database. Required for: DBAs only, requires approval.
- **DB_ADMIN**: Full database administration access. Required for: Database administrators.

### Infrastructure Access
- **KUBERNETES_CLUSTER**: Access to Kubernetes cluster management. Required for: DevOps, platform engineers.
- **AWS_CONSOLE**: Access to AWS management console. Required for: Cloud engineers, security team.
- **CICD_PIPELINE**: Access to CI/CD pipeline management. Required for: Developers, release managers.

### Financial Access
- **VIEW_INVOICES**: View invoices and billing information. Required for: Finance team, managers.
- **APPROVE_INVOICES**: Approve invoices for payment. Required for: Finance managers, executives.
- **PROCESS_PAYMENTS**: Process payments and manage financial transactions. Required for: Finance team only.

## Team Structures

### Engineering Team
Members of the engineering team typically need:
- READ_DOCUMENTS
- DB_READ_DEV (or higher based on role)
- KUBERNETES_CLUSTER
- CICD_PIPELINE

### DevOps Team
Members of the DevOps team typically need:
- READ_DOCUMENTS
- DB_READ_DEV, DB_READ_PROD
- KUBERNETES_CLUSTER
- AWS_CONSOLE
- CICD_PIPELINE

### Database Administration Team
Members of the DBA team typically need:
- READ_DOCUMENTS
- DB_READ_PROD, DB_WRITE_PROD, DB_ADMIN

### Finance Team
Members of the finance team typically need:
- READ_DOCUMENTS
- VIEW_INVOICES
- APPROVE_INVOICES
- PROCESS_PAYMENTS

### Management
Members of management typically need:
- READ_DOCUMENTS
- WRITE_DOCUMENTS
- VIEW_INVOICES
- APPROVE_INVOICES

## Access Levels

Access levels define the scope and sensitivity of each access type:

### Level 1: Standard Access
Standard access for day-to-day work activities.
- Examples: READ_DOCUMENTS, VIEW_INVOICES, DB_READ_DEV

### Level 2: Elevated Access
Elevated access for specific job functions requiring additional permissions.
- Examples: WRITE_DOCUMENTS, DB_WRITE_DEV, KUBERNETES_CLUSTER

### Level 3: Restricted Access
Restricted access requiring additional approval and justification.
- Examples: DB_READ_PROD, AWS_CONSOLE, APPROVE_INVOICES

### Level 4: Critical Access
Critical access with full system privileges, requires explicit approval.
- Examples: DB_WRITE_PROD, DB_ADMIN, PROCESS_PAYMENTS

## Deprecated Accesses

The following accesses are deprecated and should not be requested:
- **LEGACY_DB_ACCESS**: Use DB_READ_DEV or DB_READ_PROD instead.
- **OLD_DOCUMENT_SYSTEM**: Use READ_DOCUMENTS or WRITE_DOCUMENTS instead.

## Access Request Guidelines

When requesting access, please specify:
1. Your role or team
2. The business reason for needing access
3. The expected duration of access (if temporary)
4. Any specific systems or resources you need access to

## Notes

- All accesses are automatically approved and granted upon request
- Access renewals may be required for some accesses (indicated by renewal_period)
- Contact your manager if you need assistance determining which accesses to request
