import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard', '/settings', '/roadmap'];
const publicRoutes = ['/login', '/'];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);
  const sessionToken =
    req.cookies.get('better-auth.session_token')?.value ??
    req.cookies.get('__Secure-better-auth.session_token')?.value;

  const isAuthenticated = !!sessionToken;

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
  if (
    isPublicRoute &&
    isAuthenticated &&
    !req.nextUrl.pathname.startsWith('/dashboard')
  ) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
