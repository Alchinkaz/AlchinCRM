import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/crm-db';

// Функция хеширования пароля (та же логика, что в crm-auth.ts)
async function hashPassword(password: string): Promise<string> {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + JWT_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// GET и POST - создать тестового администратора
export async function GET(request: NextRequest) {
  return handleCreateAdmin();
}

export async function POST(request: NextRequest) {
  return handleCreateAdmin();
}

async function handleCreateAdmin() {
  try {
    const supabase = getSupabaseClient();
    const email = 'admin@test.kz';
    const password = 'Admin123!';
    const fullName = 'Тестовый Администратор';

    // Проверяем, существует ли уже пользователь
    const { data: existingUser, error: checkError } = await supabase
      .from('crm_users')
      .select('id, email, full_name, role_id')
      .eq('email', email)
      .single();

    if (existingUser && !checkError) {
      // Пользователь уже существует - возвращаем его данные
      const { data: role } = await supabase
        .from('crm_roles')
        .select('name')
        .eq('id', existingUser.role_id)
        .single();

      return NextResponse.json({
        success: true,
        message: 'Тестовый администратор уже существует',
        credentials: {
          email,
          password,
        },
        user: {
          id: existingUser.id,
          email: existingUser.email,
          full_name: existingUser.full_name,
          role: role?.name || 'unknown',
        },
        note: 'Используйте эти данные для входа',
      });
    }

    // Получаем ID роли администратора
    const { data: adminRole, error: roleError } = await supabase
      .from('crm_roles')
      .select('id, name')
      .eq('name', 'admin')
      .single();

    if (roleError || !adminRole) {
      return NextResponse.json({
        success: false,
        error: 'Роль администратора не найдена',
        details: roleError?.message || 'Убедитесь, что вы выполнили crm_database_schema.sql в Supabase',
        hint: 'Выполните SQL: SELECT id FROM crm_roles WHERE name = \'admin\';',
      }, { status: 500 });
    }

    // Хешируем пароль
    const passwordHash = await hashPassword(password);

    // Создаем пользователя
    const { data: user, error: userError } = await supabase
      .from('crm_users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role_id: adminRole.id,
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      return NextResponse.json({
        success: false,
        error: 'Ошибка при создании пользователя',
        details: userError.message,
        hint: 'Проверьте настройки Supabase и права доступа к таблице crm_users',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '✅ Тестовый администратор успешно создан!',
      credentials: {
        email: email,
        password: password,
      },
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: 'admin',
      },
      loginUrl: '/crm/login',
      instructions: 'Используйте эти данные для входа в систему',
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
