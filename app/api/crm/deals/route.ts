import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/crm-auth';
import { getCRMDeals, createCRMDeal } from '@/lib/crm-db';

// GET - получить список сделок
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get('manager_id');
    const status = searchParams.get('status');

    const deals = await getCRMDeals({
      manager_id: managerId || undefined,
      status: status || undefined,
    });

    return NextResponse.json({ deals });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - создать сделку
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
    const deal = await createCRMDeal({
      ...body,
      manager_id: body.manager_id || authResult.user?.id,
    });

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

