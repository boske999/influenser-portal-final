import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log("========= MIDDLEWARE START =========");
  console.log("Middleware processing path:", pathname);
  
  // Skip middleware for static assets and API routes
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/api') || 
      pathname.includes('.')) {
    console.log("Skipping middleware for static/API route");
    console.log("========= MIDDLEWARE END =========");
    return NextResponse.next();
  }
  
  // Skip middleware for dashboard and admin routes entirely
  // Let client components handle auth for these routes
  if (pathname === '/dashboard' || 
      pathname === '/admin' || 
      pathname.startsWith('/dashboard/') || 
      pathname.startsWith('/admin/')) {
    console.log("Skipping middleware for protected route:", pathname);
    console.log("========= MIDDLEWARE END =========");
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
      userId: session?.user?.id,
      sessionId: session?.access_token ? session.access_token.substring(0, 10) + '...' : 'none'
    });
    
    // For root path, redirect based on auth status
    if (pathname === '/') {
      if (!session) {
        console.log("Root path accessed without session, redirecting to login");
        console.log("========= MIDDLEWARE END =========");
        const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
        // Add cache control headers
        redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        redirectResponse.headers.set('Pragma', 'no-cache');
        redirectResponse.headers.set('Expires', '0');
        return redirectResponse;
      } else {
        // Check user role and redirect accordingly
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user?.id)
          .single();

        console.log("User data for redirection:", userData);
        
        const destination = userData?.role === 'admin' ? '/admin' : '/dashboard';
        console.log(`User at root path, redirecting to ${destination}`);
        console.log("========= MIDDLEWARE END =========");
        const redirectUrl = new URL(destination, request.url);
        console.log("Redirect URL:", redirectUrl.toString());
        const redirectResponse = NextResponse.redirect(redirectUrl);
        // Add cache control headers
        redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        redirectResponse.headers.set('Pragma', 'no-cache');
        redirectResponse.headers.set('Expires', '0');
        return redirectResponse;
      }
    }
    
    // For login path, redirect if already logged in
    if (pathname === '/login' && session) {
      // Check user role for proper redirection
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user?.id)
        .single();
        
      const destination = userData?.role === 'admin' ? '/admin' : '/dashboard';
      console.log(`User at login path, redirecting to ${destination}`);
      console.log("========= MIDDLEWARE END =========");
      const redirectUrl = new URL(destination, request.url);
      console.log("Redirect URL:", redirectUrl.toString());
      const redirectResponse = NextResponse.redirect(redirectUrl);
      // Add cache control headers
      redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      redirectResponse.headers.set('Pragma', 'no-cache');
      redirectResponse.headers.set('Expires', '0');
      return redirectResponse;
    }
    
    // For reset-password path, redirect if already logged in
    if (pathname === '/reset-password' && session) {
      // Check user role for proper redirection
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user?.id)
        .single();
        
      const destination = userData?.role === 'admin' ? '/admin' : '/dashboard';
      console.log(`User at reset-password path but already logged in, redirecting to ${destination}`);
      console.log("========= MIDDLEWARE END =========");
      const redirectUrl = new URL(destination, request.url);
      console.log("Redirect URL:", redirectUrl.toString());
      const redirectResponse = NextResponse.redirect(redirectUrl);
      // Add cache control headers
      redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      redirectResponse.headers.set('Pragma', 'no-cache');
      redirectResponse.headers.set('Expires', '0');
      return redirectResponse;
    }
    
    console.log("No redirection needed, continuing with request");
    console.log("========= MIDDLEWARE END =========");
    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of errors, return a standard response
    console.log("========= MIDDLEWARE END WITH ERROR =========");
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 