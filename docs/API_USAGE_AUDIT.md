# API usage audit

## Supported public surface

- /api/health and /api/ready
- /api/trpc/auth.*, /api/trpc/profile.*
- /api/trpc/criticalPath.*
- /api/trpc/system.*
- /api/integrations/hai/feed when explicitly configured

All other imported tRPC procedures are denied by default. Setting
ENABLE_UNSAFE_LEGACY_ROUTES=true expands that surface and is not a supported
production configuration.

There is no provider delivery API on the supported surface. HAI is read-only and
bearer-authenticated; content is withheld unless an operator opts in.
