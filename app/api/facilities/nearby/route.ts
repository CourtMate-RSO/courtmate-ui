import { NextRequest, NextResponse } from 'next/server';

interface LocationInput {
  latitude: number;
  longitude: number;
  radius_km: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: LocationInput = await request.json();

    // Validate input
    if (
      typeof body.latitude !== 'number' ||
      typeof body.longitude !== 'number' ||
      typeof body.radius_km !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid input: latitude, longitude, and radius_km are required' },
        { status: 400 }
      );
    }

    // Validate ranges
    if (body.latitude < -90 || body.latitude > 90) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90' },
        { status: 400 }
      );
    }

    if (body.longitude < -180 || body.longitude > 180) {
      return NextResponse.json(
        { error: 'Longitude must be between -180 and 180' },
        { status: 400 }
      );
    }

    if (body.radius_km <= 0 || body.radius_km > 50) {
      return NextResponse.json(
        { error: 'Radius must be between 0 and 50 km' },
        { status: 400 }
      );
    }

    // Get API configuration from environment variables
    const facilitiesServiceUrl =
      process.env.FACILITIES_SERVICE_URL || 
      process.env.NEXT_PUBLIC_FACILITIES_SERVICE_URL ||
      'http://localhost:8001';
    
    const apiVersion = process.env.API_VERSION || 'v1';

    // Call the facilities microservice
    const response = await fetch(
      `${facilitiesServiceUrl}/api/${apiVersion}/facilities/nearby`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: body.latitude,
          longitude: body.longitude,
          radius_km: body.radius_km,
        }),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Facilities service error:', errorData);
      
      return NextResponse.json(
        { 
          error: 'Facilities service unavailable or returned an error',
          details: errorData 
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching nearby courts:', error);
    
    // Provide specific error messages
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Facilities service request timed out';
      } else if (error.message.includes('fetch failed')) {
        errorMessage = 'Cannot connect to facilities service. Please ensure it is running.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        hint: 'Make sure the facilities microservice is running and accessible'
      },
      { status: 500 }
    );
  }
}
