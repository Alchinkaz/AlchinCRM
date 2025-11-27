// Утилиты для авторизации CRM
import { supabase } from './crm-db';

// Используем Web Crypto API вместо bcryptjs и jsonwebtoken для совместимости с Edge Runtime
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Простая хеш-функция для паролей (в продакшене лучше использовать bcrypt на сервере)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + JWT_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Простая JWT реализация
function signJWT(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signature = btoa(JWT_SECRET + encodedHeader + encodedPayload).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJWT(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = btoa(JWT_SECRET + encodedHeader + encodedPayload).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Проверка срока действия
    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    
    return payload;
  } catch {
    return null;
  }
}

export interface AuthResult {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
}

// Регистрация пользователя
export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  roleId?: string
): Promise<AuthResult> {
  try {
    // Проверяем, существует ли пользователь
    const existingUser = await supabase
      .from('crm_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser.data) {
      return { success: false, error: 'Пользователь с таким email уже существует' };
    }

    // Хешируем пароль
    const passwordHash = await hashPassword(password);

    // Создаем пользователя
    const { data: user, error } = await supabase
      .from('crm_users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role_id: roleId,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Генерируем JWT токен
    const expiresIn = 7 * 24 * 60 * 60; // 7 дней в секундах
    const token = signJWT({
      userId: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    });

    // Сохраняем сессию
    const tokenHash = await hashPassword(token);
    await supabase
      .from('crm_sessions')
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    return { success: true, user, token };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Вход пользователя
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Получаем пользователя
    const { data: user, error: userError } = await supabase
      .from('crm_users')
      .select('*, crm_roles(*)')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return { success: false, error: 'Неверный email или пароль' };
    }

    // Проверяем активность
    if (!user.is_active) {
      return { success: false, error: 'Аккаунт деактивирован' };
    }

    // Проверяем пароль
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return { success: false, error: 'Неверный email или пароль' };
    }

    // Обновляем время последнего входа
    await supabase
      .from('crm_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Генерируем JWT токен
    const expiresIn = 7 * 24 * 60 * 60; // 7 дней в секундах
    const token = signJWT({
      userId: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    });

    // Сохраняем сессию
    const tokenHash = await hashPassword(token);
    await supabase
      .from('crm_sessions')
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    // Убираем password_hash из ответа
    const { password_hash, ...userWithoutPassword } = user;

    return { success: true, user: userWithoutPassword, token };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Проверка токена
export async function verifyToken(token: string): Promise<{ valid: boolean; user?: any; error?: string }> {
  try {
    const decoded = verifyJWT(token);
    if (!decoded || !decoded.userId) {
      return { valid: false, error: 'Неверный токен' };
    }
    
    const { data: user, error } = await supabase
      .from('crm_users')
      .select('*, crm_roles(*)')
      .eq('id', decoded.userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return { valid: false, error: 'Пользователь не найден' };
    }

    const { password_hash, ...userWithoutPassword } = user;
    return { valid: true, user: userWithoutPassword };
  } catch (error: any) {
    return { valid: false, error: 'Неверный токен' };
  }
}

// Выход пользователя
export async function logoutUser(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Удаляем сессию (в реальности нужно найти по token_hash)
    // Для упрощения можно использовать expires_at
    const tokenHash = await hashPassword(token);
    await supabase
      .from('crm_sessions')
      .update({ expires_at: new Date().toISOString() })
      .eq('token_hash', tokenHash);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Middleware для проверки авторизации (для API routes)
export async function requireAuth(request: Request): Promise<{ user?: any; error?: string }> {
  // Тестовый режим: всегда возвращаем мокового пользователя
  const TEST_MODE = process.env.TEST_MODE !== 'false';
  
  if (TEST_MODE) {
    return {
      user: {
        id: 'test-user-id',
        email: 'admin@test.kz',
        full_name: 'Тестовый Администратор',
        crm_roles: {
          id: 'admin-role-id',
          name: 'admin',
        },
      },
    };
  }

  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Токен не предоставлен' };
  }

  const token = authHeader.substring(7);
  const result = await verifyToken(token);

  if (!result.valid) {
    return { error: result.error || 'Неверный токен' };
  }

  return { user: result.user };
}

