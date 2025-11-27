import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/crm-auth';

export async function GET(request: NextRequest) {
  try {
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

