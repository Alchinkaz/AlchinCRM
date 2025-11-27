import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/crm-auth';
import { getSupabaseClient } from '@/lib/crm-db';
import { hashPassword } from '@/lib/crm-auth';

// Тестовый режим - автоматическое создание пользователя если не существует
const TEST_MODE = process.env.TEST_MODE !== 'false'; // По умолчанию включен

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Тестовый режим: всегда успешный вход
    if (TEST_MODE) {
      const mockUser = {
        id: 'test-user-id',
        email: email || 'admin@test.kz',
        full_name: 'Тестовый Администратор',
        crm_roles: {
          id: 'admin-role-id',
          name: 'admin',
          description: 'Администратор - полный доступ',
        },
      };

      const expiresIn = 7 * 24 * 60 * 60;
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const payload = btoa(JSON.stringify({
        userId: mockUser.id,
        email: mockUser.email,
        exp: Math.floor(Date.now() / 1000) + expiresIn,
      })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const signature = btoa(JWT_SECRET + header + payload).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const token = `${header}.${payload}.${signature}`;

      return NextResponse.json({
        success: true,
        user: mockUser,
        token: token,
        testMode: true,
      });
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    // Тестовый режим: автоматическое создание тестового администратора
    if (email === 'admin@test.kz' && password === 'Admin123!') {
      const supabase = getSupabaseClient();
      
      // Проверяем, существует ли пользователь
      const { data: existingUser } = await supabase
        .from('crm_users')
        .select('*, crm_roles(*)')
        .eq('email', email)
        .single();

      let user = existingUser;

      // Если пользователя нет, создаем его
      if (!existingUser) {
        const { data: adminRole } = await supabase
          .from('crm_roles')
          .select('id')
          .eq('name', 'admin')
          .single();

        if (adminRole) {
          const passwordHash = await hashPassword(password);
          const { data: newUser } = await supabase
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

          if (newUser) {
            user = newUser;
          }
        }
      }

      // Если пользователь существует или был создан, генерируем токен
      if (user) {
        const expiresIn = 7 * 24 * 60 * 60;
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const payload = btoa(JSON.stringify({
          userId: user.id,
          email: user.email,
          exp: Math.floor(Date.now() / 1000) + expiresIn,
        })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const signature = btoa(JWT_SECRET + header + payload).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const token = `${header}.${payload}.${signature}`;

        const { password_hash, ...userWithoutPassword } = user;
        
        return NextResponse.json({
          success: true,
          user: userWithoutPassword,
          token: token,
          testMode: true,
        });
      }
    }

    // Обычная проверка входа
    const result = await loginUser(email, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

