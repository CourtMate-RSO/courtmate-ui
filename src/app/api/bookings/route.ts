import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.accessToken) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || 'http://localhost:8002';

        console.log(`[Bookings API] Fetching bookings from: ${bookingServiceUrl}/reservation/`);

        const response = await fetch(`${bookingServiceUrl}/reservation/`, {
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
            signal: AbortSignal.timeout(10000) // 10s timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Bookings API] Error ${response.status}: ${errorText}`);

            // Try to parse error as JSON
            try {
                const errorJson = JSON.parse(errorText);
                return NextResponse.json(
                    { error: errorJson.detail || 'Failed to fetch bookings' },
                    { status: response.status }
                );
            } catch {
                return NextResponse.json(
                    { error: 'Failed to fetch bookings' },
                    { status: response.status }
                );
            }
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[Bookings API] Internal Error:', error);

        // Handle specific error types
        let errorMessage = 'Internal server error';
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                errorMessage = 'Request timed out';
            } else if (error.message.includes('fetch failed')) {
                errorMessage = 'Cannot connect to Booking Service';
            } else {
                errorMessage = error.message;
            }
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
