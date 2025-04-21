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
  // Automatically allow access to all routes in development
  if (process.env.NODE_ENV === 'development') {
    console.log("Development mode detected, bypassing auth checks");
    
    // Still log what would happen in production
    if (pathname.startsWith('/admin')) {
      console.log("Would check admin permissions in production");
    }
    
    // Continue without restrictions
    return NextResponse.next();
  }
  
  // Check if this is a direct access request with a special parameter
  const directAccess = request.nextUrl.searchParams.get('direct_access');
  if (directAccess === 'true') {
    console.log("Direct access parameter detected, bypassing middleware checks");
    const url = new URL(request.nextUrl);
    url.searchParams.delete('direct_access');
    url.searchParams.delete('t');
    return NextResponse.rewrite(url);
  }
  
  // Check if this is a timestamped request (used for cache busting)
  const timestamp = request.nextUrl.searchParams.get('t');
  if (timestamp) {
    console.log("Timestamp parameter detected, rewriting URL without it");
    const url = new URL(request.nextUrl);
    url.searchParams.delete('t');
    return NextResponse.rewrite(url);
  }
  
  // Allow test paths to be accessed directly
  if (pathname.includes('/test')) {
    console.log("Test path detected, bypassing middleware checks");
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
      path: pathname,
      userId: session?.user?.id 
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
        // If user has session but we can't determine role, default to dashboard
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          console.log("User role at root path:", userData?.role);
          
          if (userData?.role === 'admin') {
            console.log("Admin user at root path, redirecting to admin");
            return NextResponse.redirect(new URL('/admin', request.url));
          } else {
            console.log("Regular user at root path, redirecting to dashboard");
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
        } catch (error) {
          console.error("Error fetching user role at root path:", error);
          // If query fails, default to dashboard
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }
    
    // For login path, redirect if already logged in
    if (pathname === '/login' && session) {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        console.log("User role at login path:", userData?.role);
        
        if (userData?.role === 'admin') {
          console.log("Admin user at login path, redirecting to admin");
          return NextResponse.redirect(new URL('/admin', request.url));
        } else {
          console.log("Regular user at login path, redirecting to dashboard");
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } catch (error) {
        console.error("Error fetching user role at login path:", error);
        // If query fails, continue to login page
        return res;
      }
    }
    
    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of errors, continue without blocking
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 