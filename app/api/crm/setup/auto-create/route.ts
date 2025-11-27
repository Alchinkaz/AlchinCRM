import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/crm-db';
import { hashPassword } from '@/lib/crm-auth';

// GET - автоматически создать тестового администратора при первом запросе
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const email = 'admin@test.kz';
    const password = 'Admin123!';

    // Проверяем существующего пользователя
    const { data: existingUser } = await supabase
      .from('crm_users')
      .select('*, crm_roles(*)')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Тестовый администратор уже существует',
        credentials: { email, password },
        user: {
          id: existingUser.id,
          email: existingUser.email,
          full_name: existingUser.full_name,
        },
      });
    }

    // Получаем роль администратора
    const { data: adminRole } = await supabase
      .from('crm_roles')
      .select('id')
      .eq('name', 'admin')
      .single();

    if (!adminRole) {
      return NextResponse.json({
        success: false,
        error: 'Роль администратора не найдена. Выполните crm_database_schema.sql',
      }, { status: 500 });
    }

    // Создаем пользователя
    const passwordHash = await hashPassword(password);
    const { data: user, error } = await supabase
      .from('crm_users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: 'Тестовый Администратор',
        role_id: adminRole.id,
        is_active: true,
      })
      .select('*, crm_roles(*)')
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: '✅ Тестовый администратор создан!',
      credentials: { email, password },
      user: userWithoutPassword,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

