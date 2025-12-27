# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: `storymaps` (or your preferred name)
   - **Database Password**: (generate a strong password and save it securely)
   - **Region**: Choose closest to your users
5. Wait for project to be created (~2 minutes)

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Project Settings** (gear icon)
2. Navigate to **API** section
3. Copy the following values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## 3. Configure Environment Variables

Create a `.env.local` file in the root of your project:

```bash
# Existing variables
NEXT_PUBLIC_MAPBOX_TOKEN=your_existing_token

# New Supabase variables
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your_anon_key...

# Optional: Service role key for admin operations (keep secret!)
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key...
```

**IMPORTANT**: Never commit `.env.local` to git. It's already in `.gitignore`.

## 4. Run Database Migrations

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
5. Click **Run** (bottom right)
6. Verify tables were created in **Table Editor**

### Option B: Using Supabase CLI (Recommended for production)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## 5. Verify Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see these tables:
   - `proposals`
   - `proposal_comments`
   - `user_profiles`

3. Go to **Authentication** → **Providers**
4. Ensure **Email** provider is enabled

## 6. Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the following templates:
   - **Confirm Signup**: Welcome message for new users
   - **Magic Link**: For passwordless login (if using)
   - **Change Email Address**: Email confirmation
   - **Reset Password**: Password reset instructions

## 7. Set Up Storage for Images (Optional, for proposal images)

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket called `proposal-images`
3. Set it to **Public** (or configure RLS policies)
4. Configure policies:
   - Allow authenticated users to upload
   - Allow anyone to read

## 8. Create First Admin User

After running migrations and deploying the app:

1. Sign up as a regular user through your app
2. In Supabase dashboard, go to **Table Editor** → `user_profiles`
3. Find your user and set `is_admin = true`

Alternatively, run this SQL in SQL Editor:

```sql
-- Replace with your user's email
UPDATE user_profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

## Troubleshooting

### Issue: "relation 'auth.users' does not exist"
- Make sure you're running the migration in the correct project
- The `auth` schema should exist by default in Supabase

### Issue: RLS policies preventing access
- Check if user is authenticated
- Verify policies in **Authentication** → **Policies**
- Temporarily disable RLS for testing: `ALTER TABLE proposals DISABLE ROW LEVEL SECURITY;`

### Issue: Email confirmation not working
- Check **Authentication** → **Email Templates**
- Verify SMTP settings in **Project Settings** → **Auth**
- For development, you can disable email confirmation in Auth settings

## Next Steps

Once Supabase is configured:
1. Install dependencies: `pnpm install`
2. Start development server: `pnpm dev`
3. Test authentication by signing up a new user
4. Submit a test proposal

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] Service role key is not exposed in client-side code
- [ ] RLS policies are enabled on all tables
- [ ] Email confirmation is enabled in production
- [ ] Rate limiting is configured (optional)
- [ ] CORS settings are properly configured
