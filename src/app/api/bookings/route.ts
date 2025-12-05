import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth();

        if (!session || !session.accessToken) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Get Booking Service configuration
        const bookingServiceUrl =
            process.env.BOOKING_SERVICE_URL ||
            'http://localhost:8002';

        // Fetch user's reservations
        const bookingsResponse = await fetch(
            `${bookingServiceUrl}/reservation/`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                },
                signal: AbortSignal.timeout(10000),
            }
        );

        if (!bookingsResponse.ok) {
            const errorData = await bookingsResponse.json().catch(() => ({}));
            console.error('Booking service error:', errorData);

            return NextResponse.json(
                {
                    error: 'Failed to fetch bookings',
                    details: errorData
                },
                { status: bookingsResponse.status }
            );
        }

        const bookings = await bookingsResponse.json();

        // Enrich bookings with court information
        const facilitiesServiceUrl =
            process.env.FACILITIES_SERVICE_URL ||
            'http://localhost:8001';

        const enrichedBookings = await Promise.all(
            bookings.map(async (booking: any) => {
                try {
                    // Fetch court details
                    const courtResponse = await fetch(
                        `${facilitiesServiceUrl}/api/v1/facilities/${booking.court_id}`,
                        {
                            signal: AbortSignal.timeout(5000),
                        }
                    );

                    if (courtResponse.ok) {
                        const court = await courtResponse.json();
                        return {
                            ...booking,
                            court: {
                                name: court.name || 'Unknown Court',
                                address: court.address_line || court.city || 'No address',
                                city: court.city,
                            }
                        };
                    }
                } catch (error) {
                    console.error(`Failed to fetch court ${booking.court_id}:`, error);
                }

                // Return booking without court details if fetch fails
                return {
                    ...booking,
                    court: {
                        name: 'Unknown Court',
                        address: 'Address unavailable',
                        city: '',
                    }
                };
            })
        );

        return NextResponse.json(enrichedBookings, { status: 200 });
    } catch (error) {
        console.error('Error fetching bookings:', error);

        let errorMessage = 'Internal server error';
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                errorMessage = 'Request timed out';
            } else if (error.message.includes('fetch failed')) {
                errorMessage = 'Cannot connect to booking service';
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
