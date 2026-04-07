import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'admin_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Already on login — let through
  if (pathname.startsWith('/login')) return NextResponse.next();

  // Only protect /admin routes
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  const session = req.cookies.get(COOKIE)?.value;
  const secret  = process.env.SESSION_SECRET;

  if (!secret || !session || session !== secret) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
