import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/crm-db';
import { hashPassword, comparePassword } from '@/lib/crm-auth';

// POST - тестирование входа с отладкой
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email и пароль обязательны',
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Получаем пользователя
    const { data: user, error: userError } = await supabase
      .from('crm_users')
      .select('*, crm_roles(*)')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Пользователь не найден',
        details: userError?.message,
        email,
      }, { status: 404 });
    }

    // Тестируем хеширование
    const testHash = await hashPassword(password);
    const storedHash = user.password_hash;
    const isValid = await comparePassword(password, storedHash);

    return NextResponse.json({
      success: isValid,
      debug: {
        email: user.email,
        userFound: true,
        isActive: user.is_active,
        storedHashLength: storedHash?.length || 0,
        testHashLength: testHash.length,
        hashesMatch: testHash === storedHash,
        isValidPassword: isValid,
        jwtSecretSet: !!process.env.JWT_SECRET,
        jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      },
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.crm_roles?.name,
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

