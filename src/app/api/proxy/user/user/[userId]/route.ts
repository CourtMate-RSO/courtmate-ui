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

        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8080';
        const targetUrl = `${userServiceUrl}/user/${params.userId}`;

        console.log(`[User Proxy] Proxying GET request to: ${targetUrl}`);
        console.log(`[User Proxy] Auth Token Present: ${!!session.accessToken}`);

        const response = await fetch(targetUrl, {
            headers: {
                'Authorization': `Bearer ${session.accessToken}`
            },
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[User Proxy] Upstream Error ${response.status}: ${errorText}`);
            return NextResponse.json(
                { error: 'Failed to fetch user data', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[User Proxy] Internal Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, props: Props) {
    try {
        const session = await auth();
        const params = await props.params;

        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8080';
        const targetUrl = `${userServiceUrl}/user/${params.userId}`;
        const body = await request.json();

        console.log(`[User Proxy] Proxying PUT request to: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[User Proxy] Upstream Error ${response.status}: ${errorText}`);
            return NextResponse.json(
                { error: 'Failed to update user', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[User Proxy] Internal Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
