import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/crm-db';
import { hashPassword } from '@/lib/crm-auth';

// GET - принудительно создать/обновить тестового администратора
export async function GET(request: NextRequest) {
  return handleForceCreate();
}

export async function POST(request: NextRequest) {
  return handleForceCreate();
}

async function handleForceCreate() {
  try {
    const supabase = getSupabaseClient();
    const email = 'admin@test.kz';
    const password = 'Admin123!';
    const fullName = 'Тестовый Администратор';

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
        details: roleError?.message,
        solution: 'Выполните crm_database_schema.sql в Supabase SQL Editor',
      }, { status: 500 });
    }

    // Хешируем пароль с правильным JWT_SECRET
    const passwordHash = await hashPassword(password);

    // Проверяем существующего пользователя
    const { data: existingUser } = await supabase
      .from('crm_users')
      .select('id')
      .eq('email', email)
      .single();

    let user;
    if (existingUser) {
      // Обновляем существующего пользователя с правильным хешем
      const { data: updatedUser, error: updateError } = await supabase
        .from('crm_users')
        .update({
          password_hash: passwordHash,
          full_name: fullName,
          role_id: adminRole.id,
          is_active: true,
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({
          success: false,
          error: 'Ошибка при обновлении пользователя',
          details: updateError.message,
        }, { status: 500 });
      }

      user = updatedUser;
    } else {
      // Создаем нового пользователя
      const { data: newUser, error: createError } = await supabase
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

      if (createError) {
        return NextResponse.json({
          success: false,
          error: 'Ошибка при создании пользователя',
          details: createError.message,
        }, { status: 500 });
      }

      user = newUser;
    }

    // Проверяем, что пароль правильный
    const testHash = await hashPassword(password);
    const passwordMatches = testHash === passwordHash;

    return NextResponse.json({
      success: true,
      message: existingUser ? '✅ Тестовый администратор обновлен!' : '✅ Тестовый администратор создан!',
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
      verification: {
        passwordHashLength: passwordHash.length,
        passwordMatches: passwordMatches,
        jwtSecretSet: !!process.env.JWT_SECRET,
      },
      loginUrl: '/crm/login',
      instructions: 'Теперь вы можете войти с этими данными',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Внутренняя ошибка',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

