import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log("Middleware processing path:", pathname);
  
  // Skip middleware for static assets and API routes
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/api') || 
      pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // DEVELOPMENT MODE: Skip auth checks in development for easier debugging
  if (process.env.NODE_ENV === 'development') {
    console.log("Development mode detected, bypassing auth checks");
    return NextResponse.next();
  }
  
  // Create a response object to modify
  const res = NextResponse.next();
  
  try {
    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareClient({ req: request, res });
    
    // Check session (but don't refresh it here to avoid token conflicts)
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Session check:", { 
      hasSession: !!session, 
      path: pathname
    });
    
    // Basic protection for admin and dashboard routes
    const protectedRoutes = ['/dashboard', '/admin'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    
    // For protected routes, redirect to login if no session
    if (isProtectedRoute && !session) {
      console.log("Protected route accessed without session, redirecting to login");
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // For root path, redirect based on auth status
    if (pathname === '/') {
      if (!session) {
        console.log("Root path accessed without session, redirecting to login");
        return NextResponse.redirect(new URL('/login', request.url));
      } else {
        // Simplified: just redirect to dashboard without role check
        console.log("User at root path, redirecting to dashboard");
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // For login path, redirect if already logged in
    if (pathname === '/login' && session) {
      // Simplified: just redirect to dashboard without role check
      console.log("User at login path, redirecting to dashboard");
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of errors, return a standard response
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 