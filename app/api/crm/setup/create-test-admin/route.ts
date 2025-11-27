import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/crm-db';

// Функция хеширования пароля (та же логика, что в crm-auth.ts)
async function hashPassword(password: string): Promise<string> {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + JWT_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', Buffer.from(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// POST - создать тестового администратора
export async function POST(request: NextRequest) {
  try {
    // Только в development режиме или с секретным ключом
    const secretKey = request.headers.get('x-setup-key') || request.nextUrl.searchParams.get('key');
    const allowedKey = process.env.SETUP_SECRET_KEY || 'test-setup-key-change-in-production';
    
    if (secretKey !== allowedKey && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseClient();
    const email = 'admin@test.kz';
    const password = 'Admin123!';
    const fullName = 'Тестовый Администратор';

    // Проверяем, существует ли уже пользователь
    const { data: existingUser } = await supabase
      .from('crm_users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'Пользователь с таким email уже существует',
        user: existingUser,
      }, { status: 400 });
    }

    // Получаем ID роли администратора
    const { data: adminRole, error: roleError } = await supabase
      .from('crm_roles')
      .select('id')
      .eq('name', 'admin')
      .single();

    if (roleError || !adminRole) {
      return NextResponse.json({
        success: false,
        error: 'Роль администратора не найдена. Убедитесь, что вы выполнили crm_database_schema.sql',
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
        error: userError.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Тестовый администратор успешно создан!',
      credentials: {
        email,
        password,
      },
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

