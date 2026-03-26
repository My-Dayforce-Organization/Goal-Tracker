# RBAC Matrix

Roles: employee, manager, hr_admin, security_auditor, support, admin.

- employee: own goals only.
- manager: direct reports + own.
- hr_admin/security_auditor: elevated read requires justification + MFA.
- support: limited troubleshooting views.
- admin: full export, config, purge workflows.
