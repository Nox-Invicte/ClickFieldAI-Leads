import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './src/lib/auth-edge';

const protectedPaths = ['/dashboard', '/leads'];
const authPaths = ['/login', '/register'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPage = authPaths.some((p) => pathname === p);

  const token = req.cookies.get('token')?.value;
  const payload = token ? await verifyToken(token) : null;

  if (isProtected && !payload) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && payload) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
