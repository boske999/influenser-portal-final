# Chat Isolation Fix

## Problem

Currently, all users can see the same chat for a proposal instead of having individual, private conversations with the admin. This results in users being able to see messages that were meant for other users.

## Solution

The solution requires two parts:

1. A database migration to ensure each user has their own isolated chat for each proposal
2. Updates to the frontend code to properly filter chats by both proposal and user

## Applying the Fix

### 1. Run the database migration

1. Go to the Supabase dashboard for your project
2. Navigate to the "SQL Editor" section
3. Create a new query
4. Copy and paste the contents of the `db/migrations/fix_chat_isolation.sql` file
5. Run the query

This migration will:
- Ensure the chats table has a user_id column with proper constraints
- Create a unique constraint on (proposal_id, user_id) to guarantee each user has their own chat for each proposal
- Fix any orphaned messages by associating them with the correct chats
- Set up proper Row Level Security (RLS) policies on the underlying tables to secure the data
- Create a view that properly joins chat messages with user data (security is enforced by RLS on the underlying tables)

### 2. Frontend changes

The following files have been updated:

1. `app/dashboard/chats/page.tsx` - Updated to filter chats by both proposal_id and user_id
2. `app/dashboard/chats/[id]/page.tsx` - Updated to ensure users can only see their own chat for a given proposal

This ensures that:
- Each user only sees their own chats in the chat list
- Each user can only access their own chat for a specific proposal
- The admin sees all chats properly organized by user and proposal

## Verification

After applying these changes, verify that:

1. Each user only sees their own chats
2. The admin can see all chats properly organized by proposal and user
3. Messages sent by the admin to one user don't appear for other users
4. Users can no longer see messages intended for other users 