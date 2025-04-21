# Notification Link Fix

This SQL patch fixes the format of links in notifications so they point to the correct routes:

- Changed `/dashboard/proposals/{id}` to `/dashboard/proposal/{id}` for proposal links
- Changed to `/dashboard/view-response?id={id}` for admin response links

## How to Apply the Fix

### Using Supabase Dashboard SQL Editor

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `link_fix.sql`
5. Run the query

### Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Make sure you're in the project root directory
cat db/migrations/link_fix.sql | supabase db sql
```

### Manual Application

If you prefer to run individual commands:

1. Update the trigger functions first:
```sql
-- Copy and paste each CREATE OR REPLACE FUNCTION statement one by one
```

2. Then update the existing records:
```sql
-- Update proposal links
UPDATE notifications
SET link_url = '/dashboard/proposal/' || related_proposal_id
WHERE related_proposal_id IS NOT NULL
AND link_url LIKE '/dashboard/proposals/%';

-- Update response links
UPDATE notifications
SET link_url = '/dashboard/view-response?id=' || related_response_id
WHERE related_response_id IS NOT NULL
AND related_proposal_id IS NOT NULL
AND link_url LIKE '/dashboard/proposals/%';
```

## Verification

After applying the fix, you can verify that it worked by checking a few notification links:

```sql
-- Check the links for proposal notifications
SELECT id, title, link_url, related_proposal_id 
FROM notifications 
WHERE related_proposal_id IS NOT NULL 
LIMIT 5;

-- Check the links for response notifications
SELECT id, title, link_url, related_response_id 
FROM notifications 
WHERE related_response_id IS NOT NULL 
LIMIT 5;
```

The links should follow the correct format as mentioned above. 