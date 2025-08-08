# Clerk Authentication Setup for UpCoach

This document describes the Clerk authentication integration in the UpCoach Next.js application.

## Installation

Clerk has been installed using the latest Next.js SDK:

```bash
npm install @clerk/nextjs@latest
```

## Configuration

### Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
```

These keys are available in your Clerk Dashboard at https://dashboard.clerk.com

### Files Created/Modified

1. **`src/middleware.ts`** - Clerk middleware configuration using `clerkMiddleware()` from `@clerk/nextjs/server`
2. **`src/app/layout.tsx`** - Wrapped the application with `<ClerkProvider>`
3. **`src/components/Header.tsx`** - Header component with authentication UI
4. **`src/app/dashboard/page.tsx`** - Example protected page
5. **`src/app/api/user/route.ts`** - Example protected API route

## Usage

### Client Components

```typescript
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
```

### Server Components & API Routes

```typescript
import { auth } from "@clerk/nextjs/server";

export default async function ProtectedPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  // Your protected content
}
```

### Protected Routes

The middleware automatically protects routes. You can customize protection in `middleware.ts` by modifying the matcher configuration.

## Features Implemented

- ✅ Authentication middleware
- ✅ Sign in/Sign up buttons
- ✅ User profile button
- ✅ Protected pages example
- ✅ Protected API routes example
- ✅ Responsive header with auth UI

## Next Steps

1. Create your Clerk account at https://clerk.com
2. Get your API keys from the Clerk Dashboard
3. Update `.env.local` with your actual keys
4. Customize the authentication UI in Clerk Dashboard
5. Implement additional protected routes as needed

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js App Router Guide](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Components Reference](https://clerk.com/docs/components/overview)
