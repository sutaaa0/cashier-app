import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
        const decoded = verifyToken(token)
        const requestHeaders = new Headers(request.headers)

        if (typeof decoded !== 'string' && decoded.userId && decoded.role) {
            requestHeaders.set('x-user-id', decoded.userId as string)
            requestHeaders.set('x-user-role', decoded.role as string)
        } else {
            throw new Error('Invalid token payload')
        }

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        })
    } catch (error) {
        console.error('Middleware error:', error)
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('token')
        return response
    }
}

export const config = {
    matcher: [
        '/home',
        '/api/:path*'
    ]
}