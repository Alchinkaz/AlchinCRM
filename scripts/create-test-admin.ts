// Скрипт для создания тестового администратора
// Запуск: npx tsx scripts/create-test-admin.ts
// Или: npm run create-admin

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Ошибка: Не установлены переменные окружения SUPABASE_URL и SUPABASE_ANON_KEY');
  console.log('\nСоздайте файл .env.local со следующим содержимым:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.log('JWT_SECRET=your_jwt_secret');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Функция хеширования пароля (та же логика, что в crm-auth.ts)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + JWT_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', Buffer.from(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function createTestAdmin() {
  const email = 'admin@test.kz';
  const password = 'Admin123!';
  const fullName = 'Тестовый Администратор';

  console.log('🔐 Создание тестового администратора...\n');
  console.log('Email:', email);
  console.log('Пароль:', password);
  console.log('Имя:', fullName);
  console.log('');

  try {
    // Проверяем, существует ли уже пользователь
    const { data: existingUser } = await supabase
      .from('crm_users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser) {
      console.log('⚠️  Пользователь с таким email уже существует!');
      console.log('ID:', existingUser.id);
      console.log('\nЕсли хотите создать нового, используйте другой email.');
      return;
    }

    // Получаем ID роли администратора
    const { data: adminRole, error: roleError } = await supabase
      .from('crm_roles')
      .select('id')
      .eq('name', 'admin')
      .single();

    if (roleError || !adminRole) {
      console.error('❌ Ошибка: Роль администратора не найдена!');
      console.error('Убедитесь, что вы выполнили crm_database_schema.sql в Supabase');
      return;
    }

    // Хешируем пароль
    console.log('🔒 Хеширование пароля...');
    const passwordHash = await hashPassword(password);

    // Создаем пользователя
    console.log('👤 Создание пользователя...');
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
      console.error('❌ Ошибка при создании пользователя:', userError.message);
      return;
    }

    console.log('\n✅ Тестовый администратор успешно создан!');
    console.log('\n📋 Данные для входа:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    ', email);
    console.log('Пароль:   ', password);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔗 Войдите на: https://alchin-crm.vercel.app/crm/login');
    console.log('\n⚠️  ВАЖНО: Смените пароль после первого входа!');

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
  }
}

createTestAdmin();

