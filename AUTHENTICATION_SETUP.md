# Authentication Setup Guide

This guide will help you set up the authentication system for the StoryMaps project.

## Prerequisites

- MongoDB database (MongoDB Atlas recommended)
- Node.js 18+ and pnpm installed

## Step 1: Set Up MongoDB Database

1. Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Create a database user with password
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string

## Step 2: Configure Environment Variables

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your environment variables in `.env.local`:
   ```env
   # MongoDB connection string
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/storymaps?retryWrites=true&w=majority

   # Generate a secret with: openssl rand -base64 32
   NEXTAUTH_SECRET=your_generated_secret_here

   # Your app URL
   NEXTAUTH_URL=http://localhost:3000

   # Mapbox token (existing)
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
   ```

## Step 3: Generate Prisma Client

Run the following command to generate the Prisma Client:

```bash
npx prisma generate
```

## Step 4: Initialize the Database

Push the Prisma schema to your MongoDB database:

```bash
npx prisma db push
```

This will create the necessary collections in your MongoDB database.

## Step 5: Run the Development Server

Start the development server:

```bash
pnpm dev
```

## Testing the Authentication

### Register a New User

1. Navigate to http://localhost:3000/auth/register
2. Fill in your name, email, and password
3. Click "Create account"
4. You'll be automatically logged in and redirected to the homepage

### Login

1. Navigate to http://localhost:3000/auth/login
2. Enter your email and password
3. Click "Sign in"

### User Menu

Once logged in, you'll see a user icon in the sidebar:
- Click the icon to see your account menu
- Click "Profile" to view your profile page
- Click "Logout" to sign out

### Protected Routes

The following routes are protected and require authentication:
- `/profile` - User profile page
- `/account` - Account settings (when implemented)

## Authentication Features

### Current Features

- ✅ Email/password registration
- ✅ Email/password login
- ✅ Session management (JWT-based)
- ✅ Protected routes with middleware
- ✅ User profile page
- ✅ Logout functionality
- ✅ Themed auth pages (all 7 themes supported)
- ✅ Trilingual support (English, German, Yiddish)

### Future Features

Users can save favorite businesses, create custom collections, share stories, and receive updates on new research (coming soon).

## Database Schema

The authentication system uses the following MongoDB collections:

### User
- `id`: Unique identifier
- `email`: User's email (unique)
- `password`: Hashed password (bcrypt)
- `name`: User's name (optional)
- `image`: Profile image URL (optional)
- `createdAt`: Account creation date
- `updatedAt`: Last update date

### Session
- `id`: Unique identifier
- `sessionToken`: JWT session token (unique)
- `userId`: Reference to User
- `expires`: Session expiration date

### Account
- For OAuth providers (not currently used but available for future expansion)

### VerificationToken
- For email verification (not currently used but available for future expansion)

## Security Considerations

### Password Security
- Passwords are hashed using bcrypt with 10 salt rounds
- Passwords must be at least 8 characters

### Session Security
- Sessions use JWT tokens
- Sessions expire after 30 days
- Session tokens are stored in HTTP-only cookies

### Environment Security
- Never commit `.env.local` or `.env` files
- Use strong, randomly generated secrets
- Rotate secrets regularly in production

## Production Deployment

### Environment Variables

Set the following environment variables in your production platform:

**Vercel/Netlify:**
1. Go to Project Settings > Environment Variables
2. Add all variables from `.env.local`
3. Set `NEXTAUTH_URL` to your production domain

**Railway/Heroku:**
1. Go to Variables/Config Vars
2. Add all variables from `.env.local`
3. Set `NEXTAUTH_URL` to your production domain

### Database

Ensure your MongoDB Atlas cluster:
- Has proper IP whitelisting for your production environment
- Uses a strong database password
- Has backups enabled

## Troubleshooting

### "Module '@prisma/client' has no exported member 'PrismaClient'"

Run `npx prisma generate` to generate the Prisma Client.

### "Authentication failed"

Check that:
- Your DATABASE_URL is correct
- MongoDB is accessible from your environment
- The database user has proper permissions

### "Invalid session"

Check that:
- NEXTAUTH_SECRET is set and is the same across all environments
- NEXTAUTH_URL matches your current domain

### Session not persisting

Check that:
- Cookies are enabled in your browser
- You're not in incognito/private mode
- NEXTAUTH_URL is correct for your environment

## API Routes

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### POST /api/auth/[...nextauth]
NextAuth.js authentication endpoints (handled automatically):
- `/api/auth/signin` - Sign in
- `/api/auth/signout` - Sign out
- `/api/auth/session` - Get current session
- `/api/auth/csrf` - Get CSRF token

## Support

For issues or questions:
1. Check this documentation
2. Review the CLAUDE.md file for project-specific guidelines
3. Check Next.js and NextAuth.js documentation
