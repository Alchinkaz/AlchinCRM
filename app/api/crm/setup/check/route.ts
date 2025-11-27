import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/crm-db';

// GET - проверка подключения к базе данных и наличия ролей
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Проверяем подключение
    const { data: roles, error: rolesError } = await supabase
      .from('crm_roles')
      .select('id, name, description')
      .limit(10);

    const { data: users, error: usersError } = await supabase
      .from('crm_users')
      .select('id, email, full_name, is_active')
      .limit(5);

    const { data: testUser } = await supabase
      .from('crm_users')
      .select('id, email, full_name, role_id, is_active, password_hash')
      .eq('email', 'admin@test.kz')
      .single();

    return NextResponse.json({
      success: true,
      database: {
        connected: !rolesError,
        rolesError: rolesError?.message,
        usersError: usersError?.message,
      },
      roles: roles || [],
      users: users || [],
      testUser: testUser ? {
        id: testUser.id,
        email: testUser.email,
        full_name: testUser.full_name,
        is_active: testUser.is_active,
        has_password: !!testUser.password_hash,
        password_hash_length: testUser.password_hash?.length || 0,
      } : null,
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

