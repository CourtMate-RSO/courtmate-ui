import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const facilitiesServiceUrl = process.env.FACILITIES_SERVICE_URL || 'http://localhost:8001';
        const apiVersion = process.env.API_VERSION || 'v1';
        const body = await request.json();

        const response = await fetch(`${facilitiesServiceUrl}/api/${apiVersion}/facilities`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to create facility' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating facility:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
