import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/crm-auth';
import { getCRMGPSDevices, createCRMGPSDevice } from '@/lib/crm-db';

// GET - получить список GPS устройств
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const devices = await getCRMGPSDevices();
    return NextResponse.json({ devices });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - создать GPS устройство
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const device = await createCRMGPSDevice({
      ...body,
      created_by: authResult.user?.id,
    });

    return NextResponse.json({ device }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

