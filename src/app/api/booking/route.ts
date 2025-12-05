import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

interface ReservationCreateRequest {
    court_id: string;
    starts_at: string;
    ends_at: string;
}

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth();

        if (!session || !session.accessToken) {
            return NextResponse.json(
                { error: 'Authentication required. Please log in to make a reservation.' },
                { status: 401 }
            );
        }

        const body: ReservationCreateRequest = await request.json();

        // Validate input
        if (!body.court_id || !body.starts_at || !body.ends_at) {
            return NextResponse.json(
                { error: 'Missing required fields: court_id, starts_at, and ends_at are required' },
                { status: 400 }
            );
        }

        // Validate datetime format and logic
        const startsAt = new Date(body.starts_at);
        const endsAt = new Date(body.ends_at);

        if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
            return NextResponse.json(
                { error: 'Invalid datetime format. Use ISO 8601 format.' },
                { status: 400 }
            );
        }

        if (endsAt <= startsAt) {
            return NextResponse.json(
                { error: 'End time must be after start time' },
                { status: 400 }
            );
        }

        if (startsAt < new Date()) {
            return NextResponse.json(
                { error: 'Cannot book in the past' },
                { status: 400 }
            );
        }

        // Get Booking Service configuration
        const bookingServiceUrl =
            process.env.BOOKING_SERVICE_URL ||
            'http://localhost:8002';

        // Call the booking microservice
        const response = await fetch(
            `${bookingServiceUrl}/reservation/`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({
                    court_id: body.court_id,
                    starts_at: body.starts_at,
                    ends_at: body.ends_at,
                }),
                // Add timeout to prevent hanging
                signal: AbortSignal.timeout(10000), // 10 second timeout
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Booking service error:', errorData);

            // Handle specific error cases
            if (response.status === 401) {
                return NextResponse.json(
                    { error: 'Authentication failed. Please log in again.' },
                    { status: 401 }
                );
            }

            return NextResponse.json(
                {
                    error: errorData.detail || 'Failed to create reservation',
                    details: errorData
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Error creating reservation:', error);

        // Provide specific error messages
        let errorMessage = 'Internal server error';
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                errorMessage = 'Booking service request timed out';
            } else if (error.message.includes('fetch failed')) {
                errorMessage = 'Cannot connect to booking service. Please ensure it is running.';
            } else {
                errorMessage = error.message;
            }
        }

        return NextResponse.json(
            {
                error: errorMessage,
                hint: 'Make sure the booking microservice is running and accessible'
            },
            { status: 500 }
        );
    }
}
