import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BLOCKED_AUTH_PATHS = ['/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block login/register pages and send visitors to homepage
  if (BLOCKED_AUTH_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Firebase auth is client-side, so we can't check the token in middleware.
  // The auth check happens in the dashboard layout component.
  // This middleware exists for future server-side auth token validation.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
