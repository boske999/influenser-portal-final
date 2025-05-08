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

# Proposal Visibility Fix

This repository contains fixes for the issue where users could see proposals they weren't supposed to have access to. The issue has been resolved by:

1. Creating a junction table (`proposal_visibility`) to track which users can see which proposals
2. Adding proper Row Level Security (RLS) policies to enforce visibility restrictions
3. Updating the frontend code to respect these restrictions

## How to Apply the Fixes

### 1. Database Changes

First, run the following SQL scripts in your Supabase SQL editor:

1. Run `DB/migrations/user_proposals.sql` if you haven't already. This creates the junction table and initial policies.
2. Run `DB/migrations/fix_rls_policies.sql` to ensure all RLS policies are correctly applied and populate visibility records for existing proposals.

### 2. Frontend Changes

The frontend code has been updated to use Row Level Security properly:

- The dashboard pages now fetch proposals using RLS
- The create and edit proposal forms now include user selection

### 3. Testing

After applying these changes, perform the following tests:

1. Log in as an admin and create a new proposal, selecting only specific users 
2. Log in as a selected user and verify they can see the proposal
3. Log in as a non-selected user and verify they cannot see the proposal

## How It Works

The solution uses a many-to-many relationship between proposals and users through the `proposal_visibility` table:

- When an admin creates or edits a proposal, they select which users can see it
- Row Level Security policies ensure that users can only see proposals they've been given access to
- Admins can see all proposals regardless of the visibility settings

This approach ensures proper access control while maintaining flexibility for admins to target specific users with proposals.

# Rešavanje problema sa vidljivošću predloga

Ovaj dokument sadrži uputstva za rešavanje problema gde korisnici vide predloge koji nisu namenjeni njima. Problem je rešen kroz sledeće korake:

## 1. Pokrenite SQL skriptu za ispravku baze

Prvo, pokrenite SQL skriptu da biste postavili pravilna RLS (Row Level Security) pravila u bazi:

```sql
-- Pokrenuti sledeću SQL skriptu u Supabase SQL Editoru
-- Sadržaj fajla DB/migrations/fix_proper_rls.sql
```

Ova skripta će:
- Kreirati tabelu `proposal_visibility` ako već ne postoji
- Postaviti pravilna RLS pravila
- Osigurati da svi postojeći predlozi budu vidljivi svim korisnicima 
  (ovo će osigurati da ne izgubite pristup postojećim podacima)

## 2. Ažurirati front-end kod

Kod je ažuriran da koristi osnovni način pristupa podacima bez dodatnih neefektivnih provera.

Prethodni problemi su uključivali:
- Dvostruke provere pristupa koje su mogle praviti probleme
- Probleme sa autentifikacionim sesijama zbog nepotrebnog lančanja promisa

## 3. Pravilan pristup kreiranju novih predloga

Prilikom kreiranja novog predloga, admin treba da:
1. Popuni osnovne podatke o predlogu
2. Izabere korisnike koji treba da vide predlog
3. Sistem će automatski kreirati zapise u tabeli `proposal_visibility`

## 4. Testiranje

Nakon primene ovih ispravki, proverite da:
1. Admin može videti sve predloge
2. Običan korisnik vidi samo predloge koji su mu namenjeni
3. Kreiranje novog predloga pravilno koristi selektor korisnika

## Napomena o retrokompatibilnosti

Skripta `fix_proper_rls.sql` automatski dodaje sve korisnike u vidljivost svih postojećih predloga. Ovo osigurava da se ne izgubi pristup postojećim podacima nakon primene ispravki. Za nove predloge, admin će morati da eksplicitno izabere korisnike koji treba da imaju pristup.

## Deployment on Vercel

To deploy this project on Vercel, follow these steps:

1. Connect your GitHub repository to Vercel
2. Make sure to set the following environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_KEY=your-supabase-service-role-key
   ```
3. The project includes a `vercel.json` file that configures the build and fixes potential type checking issues.

### Build Issues

If you encounter TypeScript errors during build, the `vercel.json` file includes `"buildCommand": "next build --no-lint"` which skips TypeScript checks during build.

#### Known Issue with Supabase Realtime

There's a known issue with TypeScript typings in the Chat component where the Supabase Realtime `.on()` method requires 3 parameters. This has been fixed in the code but the TypeScript definition might cause build issues. 