import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/crm-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, roleId } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Email, пароль и имя обязательны' },
        { status: 400 }
      );
    }

    const result = await registerUser(email, password, fullName, roleId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
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

