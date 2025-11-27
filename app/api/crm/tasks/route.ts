import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/crm-auth';
import { getCRMTasks, createCRMTask } from '@/lib/crm-db';

// GET - получить список задач
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
    const assignedTo = searchParams.get('assigned_to');
    const status = searchParams.get('status');

    const tasks = await getCRMTasks({
      assigned_to: assignedTo || undefined,
      status: status || undefined,
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - создать задачу
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
    const task = await createCRMTask({
      ...body,
      created_by: authResult.user?.id,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

