import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const session = user != null;

    // Protect dashboard, workout, and nutrition routes
    const protectedRoutes = ["/dashboard", "/profile", "/workout", "/nutrition", "/reset-password", "/auth/callback"];
    const isProtectedRoute = protectedRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute && !session && !request.nextUrl.searchParams.has('code')) {
        // Redirect unauthenticated users to the login page
        // BUT don't redirect if it's an auth callback with a code!
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/login";
        return NextResponse.redirect(redirectUrl);
    }

    // Redirect authenticated users away from auth pages to the dashboard
    // Note: We EXCLUDE /reset-password and /auth/callback here
    const authRoutes = ["/login", "/register", "/forgot-password"];
    const isAuthRoute = authRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
    );

    // If logged in and on the homepage or login page, redirect to dashboard
    if (session && (isAuthRoute || (request.nextUrl.pathname === "/" && !request.nextUrl.pathname.startsWith('/auth/callback')))) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/dashboard";
        return NextResponse.redirect(redirectUrl);
    }



    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public static assets)
         * - api (API routes, they handle their own auth checking if needed)
         */
        "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
    ],
};
