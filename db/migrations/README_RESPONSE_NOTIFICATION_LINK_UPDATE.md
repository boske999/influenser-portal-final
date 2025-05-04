# Response Notification Link Update

This migration updates the notification system to improve the admin experience when dealing with user responses to proposals.

## Changes Made

1. **Direct Links to Responses**: When a user submits a new response or updates an existing one, the notification link for admins now points directly to `/admin/response/{id}` instead of `/admin/proposal/{id}/responses`. This allows admins to go straight to the specific response that was updated.

2. **Updated Link Priority**: The `handleNotificationClick` function in the admin notifications page has been updated to prioritize the `link_url` field, improving the user experience by respecting the link defined in the notification.

3. **Existing Notifications Update**: The migration also updates any existing unread notifications to use the new URL format.

## How to Apply

To apply this update, run the `update_response_link.sql` file:

```bash
psql -h <database-host> -d <database-name> -U <database-user> -f db/migrations/update_response_link.sql
```

## Technical Details

The main change is in the `notify_admin_on_response()` function, which now generates a more specific link:

```sql
-- Old version (pointing to all responses):
link_url = '/admin/proposal/' || NEW.proposal_id || '/responses'

-- New version (pointing directly to the specific response):
link_url = '/admin/response/' || NEW.id
``` 