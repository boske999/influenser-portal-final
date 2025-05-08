# Fix for Duplicate Notification Issue

## Problem
When an admin updates a proposal or their response to a user's proposal, or when a user updates their proposal response, duplicate notifications were being generated. This was happening because the database trigger functions were not checking for existing notifications before creating new ones on updates.

## Solution
The fix addresses this by:

1. **For proposal updates**: Before creating new notifications, we first delete any existing unread "Proposal Updated" notifications for the same proposal.

2. **For admin response updates**: Before creating new notifications to users, we first delete any existing unread "Admin responded to your reply" notifications for the same response.

3. **For user response updates**: Before creating new notifications to admins, we first delete any existing unread "Response Updated" notifications for the same response.

This approach ensures that when multiple updates happen in succession, users don't receive duplicate notifications for the same action.

## Implementation
The fix is implemented in `fix_duplicate_notifications.sql` which updates three PostgreSQL trigger functions:
- `notify_users_on_proposal()`
- `notify_user_on_admin_response()`
- `notify_admin_on_response()`

## How to Apply
Run the SQL migration file in your Supabase instance:

```
psql -h <database-host> -d <database-name> -U <database-user> -f db/migrations/fix_duplicate_notifications.sql
```

Or apply through the Supabase SQL Editor in the dashboard. 