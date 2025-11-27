import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/crm-auth';

export async function GET(request: NextRequest) {
  try {
    // Тестовый режим: всегда возвращаем валидного пользователя
    const TEST_MODE = process.env.TEST_MODE !== 'false';
    
    if (TEST_MODE) {
      const mockUser = {
        id: 'test-user-id',
        email: 'admin@test.kz',
        full_name: 'Тестовый Администратор',
        crm_roles: {
          id: 'admin-role-id',
          name: 'admin',
        },
      };
      
      return NextResponse.json({
        valid: true,
        user: mockUser,
        testMode: true,
      });
    }

    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { valid: false, error: 'Токен не предоставлен' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const result = await verifyToken(token);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      user: result.user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, error: error.message },
      { status: 500 }
    );
  }
}

