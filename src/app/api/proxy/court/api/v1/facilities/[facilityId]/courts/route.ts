import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

type Props = {
    params: Promise<{ facilityId: string }>;
};

export async function GET(request: NextRequest, props: Props) {
    try {
        const session = await auth();
        const params = await props.params;

        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const facilitiesServiceUrl = process.env.FACILITIES_SERVICE_URL || 'http://localhost:8001';
        const apiVersion = process.env.API_VERSION || 'v1';

        const response = await fetch(`${facilitiesServiceUrl}/api/${apiVersion}/facilities/${params.facilityId}/courts`, {
            headers: {
                'Authorization': `Bearer ${session.accessToken}`
            }
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch courts' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching courts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest, props: Props) {
    try {
        const session = await auth();
        const params = await props.params;

        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const facilitiesServiceUrl = process.env.FACILITIES_SERVICE_URL || 'http://localhost:8001';
        const apiVersion = process.env.API_VERSION || 'v1';
        const body = await request.json();

        const response = await fetch(`${facilitiesServiceUrl}/api/${apiVersion}/facilities/${params.facilityId}/courts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to create court' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating court:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
