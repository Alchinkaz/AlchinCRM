import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/crm-auth';
import { supabase } from '@/lib/crm-db';

// GET - получить список пользователей
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabase
      .from('crm_users')
      .select('*, crm_roles(*)');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (role) {
      query = query.eq('crm_roles.name', role);
    }

    const { data: users, error } = await query;

    if (error) throw error;

    // Убираем password_hash из ответа
    const safeUsers = (users || []).map(({ password_hash, ...user }) => user);

    return NextResponse.json({ users: safeUsers });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - создать нового пользователя
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // В тестовом режиме разрешаем всем админам, в реальном - только админам
    if (authResult.user.crm_roles?.name !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, full_name, role_id, phone, telegram_id } = body;

    if (!email || !password || !full_name || !role_id) {
      return NextResponse.json({ error: 'Email, пароль, имя и роль обязательны' }, { status: 400 });
    }

    // Хешируем пароль (используя lib/crm-auth.ts)
    const { hashPassword } = await import('@/lib/crm-auth');
    const passwordHash = await hashPassword(password);

    const { data: user, error } = await supabase
      .from('crm_users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name,
        role_id,
        phone,
        telegram_id,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    const { password_hash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - обновить пользователя
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    if (authResult.user.crm_roles?.name !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID пользователя обязателен' }, { status: 400 });
    }

    const body = await request.json();
    const { full_name, role_id, phone, telegram_id, is_active, password } = body;

    const updates: any = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (role_id !== undefined) updates.role_id = role_id;
    if (phone !== undefined) updates.phone = phone;
    if (telegram_id !== undefined) updates.telegram_id = telegram_id;
    if (is_active !== undefined) updates.is_active = is_active;

    if (password) {
      const { hashPassword } = await import('@/lib/crm-auth');
      updates.password_hash = await hashPassword(password);
    }

    const { data: user, error } = await supabase
      .from('crm_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const { password_hash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

