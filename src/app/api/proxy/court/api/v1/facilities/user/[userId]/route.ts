import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

type Props = {
    params: Promise<{ userId: string }>;
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

        const response = await fetch(`${facilitiesServiceUrl}/api/${apiVersion}/facilities/user/${params.userId}`, {
            headers: {
                'Authorization': `Bearer ${session.accessToken}`
            }
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch facilities' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching user facilities:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
