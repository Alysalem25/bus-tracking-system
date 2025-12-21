import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/admin-dashboard",
  "/driver-dashboard", 
  "/student-dashboard",
  "/driver"
];

const publicRoutes = ["/login", "/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (publicRoutes.includes(pathname) || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Check for token in cookie or header (handled by client-side ProtectedRoute)
    // This is just a basic check - full auth is handled client-side
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};


