import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/crm-auth';
import { supabase } from '@/lib/crm-db';

// GET - получить список пользователей
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
    const role = searchParams.get('role');

    let query = supabase
      .from('crm_users')
      .select('*, crm_roles(*)')
      .eq('is_active', true);

    if (role) {
      query = query.eq('crm_roles.name', role);
    }

    const { data: users, error } = await query;

    if (error) throw error;

    // Убираем password_hash из ответа
    const safeUsers = (users || []).map(({ password_hash, ...user }) => user);

    return NextResponse.json({ users: safeUsers });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

