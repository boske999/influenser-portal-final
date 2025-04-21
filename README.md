# Allem Next.js

Advertising platform for creators built with Next.js and Supabase.

## Project Status

This version includes completed user authentication functionality but does not implement page refresh handling. Authentication works properly for initial login and navigation, but may encounter issues on direct page refreshes.

## Features

- User authentication with Supabase
- Role-based access control (admin/user)
- Dashboard layout with sidebar navigation
- Consistent auth state management across components

## Technologies

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase (Authentication & Database)

## Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Run `npm run dev` to start the development server

## Notes

This version maintains authentication state using localStorage, which works well for client-side navigation but has limitations with server-side rendering. Future versions may implement server-side authentication with proper cookie management. 